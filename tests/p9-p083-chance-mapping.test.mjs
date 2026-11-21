import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {BRIDGES, sessionTaskFor} from '../dist/learning/bridges.js';
import {ensureB39Ready} from '../dist/learning/phase4/async-batches.js';
import * as original from '../dist/learning/phase5/b22-model.js';
import {P083_SOURCES, p083ChanceMappingBinding, replayP083ChanceMappingEvidence, submittedP083ChanceMappingEvidence} from '../dist/learning/p083-chance-mapping-evidence.js';

const cases = P083_SOURCES.map(s => ({source: s, context: {sessionId: s.sessionId, index: s.index}, task: sessionTaskFor(s.sessionId, s.index)}));
const ordered = v => Array.isArray(v) ? v.map(ordered) : (v && typeof v === 'object' ? Object.fromEntries(Object.keys(v).sort((a,b)=>a.localeCompare(b,'en')).map(k=>[k,ordered(v[k])])) : v);
test('P083 locks all 3 chancesim fingerprints and replays deterministic PRNG runs', () => {
  for (const e of cases) {
    assert.equal(createHash('sha256').update(JSON.stringify(ordered(e.task))).digest('hex'), e.source.taskHash);
    const m = original.example(e.task), before = structuredClone(m);
    const p = replayP083ChanceMappingEvidence(e.task, m, e.context);
    assert.equal(p?.targetRuns, e.task.targetRuns);
    assert.deepEqual(m, before);
  }
});
test('P083 rejects wrong rate and requires fresh Check', () => {
  for (const e of cases) {
    const good = original.example(e.task), bad = structuredClone(good); bad.rate = '99/100';
    assert.equal(submittedP083ChanceMappingEvidence(e.task, bad, {attempts:[{value:bad}]}, e.context), null);
    assert.equal(submittedP083ChanceMappingEvidence(e.task, good, {attempts:[{value:bad}]}, e.context), null);
    assert.equal(submittedP083ChanceMappingEvidence(e.task, good, {attempts:[{value:bad},{value:good}]}, e.context)?.targetRuns, e.task.targetRuns);
  }
});
test('P083 excludes practice and bridges', async () => {
  await ensureB39Ready();
  for (const e of cases) assert.equal(p083ChanceMappingBinding(e.task, {sessionId: 'chancesim', index: -1}), null);
  for (const [id, b] of Object.entries(BRIDGES)) for (const [idx, rel] of b.tasks.entries()) if (rel?.type === 'x-p22-mapping') assert.equal(p083ChanceMappingBinding(rel, {sessionId: id, index: idx}), null);
});
