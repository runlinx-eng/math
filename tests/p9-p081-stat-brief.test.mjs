import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {BRIDGES, sessionTaskFor} from '../dist/learning/bridges.js';
import {ensureB39Ready} from '../dist/learning/phase4/async-batches.js';
import * as original from '../dist/learning/phase5/b21-model.js';
import {P081_SOURCES, p081StatBriefBinding, replayP081StatBriefEvidence, submittedP081StatBriefEvidence} from '../dist/learning/p081-stat-brief-evidence.js';

const cases = P081_SOURCES.map(s => ({source: s, context: {sessionId: s.sessionId, index: s.index}, task: sessionTaskFor(s.sessionId, s.index)}));
const ordered = v => Array.isArray(v) ? v.map(ordered) : (v && typeof v === 'object' ? Object.fromEntries(Object.keys(v).sort((a,b)=>a.localeCompare(b,'en')).map(k=>[k,ordered(v[k])])) : v);
test('P081 locks all 3 datasummary fingerprints and replays statbrief reports', () => {
  for (const e of cases) {
    assert.equal(createHash('sha256').update(JSON.stringify(ordered(e.task))).digest('hex'), e.source.taskHash);
    const m = original.example(e.task), before = structuredClone(m);
    assert.equal(replayP081StatBriefEvidence(e.task, m, e.context)?.n, e.task.values.length);
    assert.deepEqual(m, before);
  }
});
test('P081 rejects mismatched n and requires fresh Check', () => {
  for (const e of cases) {
    const good = original.example(e.task), bad = structuredClone(good); bad.n = '999'; original.act(e.task, bad, 'b21-report');
    assert.equal(submittedP081StatBriefEvidence(e.task, bad, {attempts:[{value:bad}]}, e.context), null);
    assert.equal(submittedP081StatBriefEvidence(e.task, good, {attempts:[{value:bad}]}, e.context), null);
    assert.equal(submittedP081StatBriefEvidence(e.task, good, {attempts:[{value:bad},{value:good}]}, e.context)?.n, e.task.values.length);
  }
});
test('P081 excludes practice and bridges', async () => {
  await ensureB39Ready();
  for (const e of cases) assert.equal(p081StatBriefBinding(e.task, {sessionId: 'datasummary', index: -1}), null);
  for (const [id, b] of Object.entries(BRIDGES)) for (const [idx, rel] of b.tasks.entries()) if (rel?.type === 'x-statbrief') assert.equal(p081StatBriefBinding(rel, {sessionId: id, index: idx}), null);
});
