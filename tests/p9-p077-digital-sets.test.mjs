import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {BRIDGES, sessionTaskFor} from '../dist/learning/bridges.js';
import {ensureB39Ready} from '../dist/learning/phase4/async-batches.js';
import * as original from '../dist/learning/phase5/b21-model.js';
import {P077_SOURCES, p077DigitalSetsBinding, replayP077DigitalSetsEvidence, submittedP077DigitalSetsEvidence} from '../dist/learning/p077-digital-sets-evidence.js';

const cases = P077_SOURCES.map(s => ({source: s, context: {sessionId: s.sessionId, index: s.index}, task: sessionTaskFor(s.sessionId, s.index)}));
const ordered = v => Array.isArray(v) ? v.map(ordered) : (v && typeof v === 'object' ? Object.fromEntries(Object.keys(v).sort((a,b)=>a.localeCompare(b,'en')).map(k=>[k,ordered(v[k])])) : v);
test('P077 locks both digitalsets fingerprints and verifies exact bar heights', () => {
  const expected = [[8,6,4,5,9,4], [10,30,40,20,30,40,20,10]];
  for (let i = 0; i < cases.length; i++) {
    const e = cases[i];
    assert.equal(createHash('sha256').update(JSON.stringify(ordered(e.task))).digest('hex'), e.source.taskHash);
    const m = original.example(e.task), before = structuredClone(m);
    assert.deepEqual(replayP077DigitalSetsEvidence(e.task, m, e.context)?.heights, expected[i]);
    assert.deepEqual(m, before);
  }
});
test('P077 rejects wrong bar height and requires fresh Check', () => {
  for (const e of cases) {
    const good = original.example(e.task), bad = structuredClone(good); bad.heights[0] = '99'; original.act(e.task, bad, 'b21-build');
    assert.equal(submittedP077DigitalSetsEvidence(e.task, bad, {attempts:[{value:bad}]}, e.context), null);
    assert.equal(submittedP077DigitalSetsEvidence(e.task, good, {attempts:[{value:bad}]}, e.context), null);
    assert.ok(submittedP077DigitalSetsEvidence(e.task, good, {attempts:[{value:bad},{value:good}]}, e.context)?.builds >= 1);
  }
});
test('P077 excludes practice and bridges', async () => {
  await ensureB39Ready();
  for (const e of cases) assert.equal(p077DigitalSetsBinding(e.task, {sessionId: 'digitalsets', index: -1}), null);
  for (const [id, b] of Object.entries(BRIDGES)) for (const [idx, rel] of b.tasks.entries()) if (rel?.type === 'x-digitalsets') assert.equal(p077DigitalSetsBinding(rel, {sessionId: id, index: idx}), null);
});
