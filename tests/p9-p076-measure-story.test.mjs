import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {BRIDGES, sessionTaskFor} from '../dist/learning/bridges.js';
import {ensureB39Ready} from '../dist/learning/phase4/async-batches.js';
import * as original from '../dist/learning/phase5/b19-model.js';
import {P076_SOURCES, p076MeasureStoryBinding, replayP076MeasureStoryEvidence, submittedP076MeasureStoryEvidence} from '../dist/learning/p076-measure-story-evidence.js';

const cases = P076_SOURCES.map(s => ({source: s, context: {sessionId: s.sessionId, index: s.index}, task: sessionTaskFor(s.sessionId, s.index)}));
const ordered = v => Array.isArray(v) ? v.map(ordered) : (v && typeof v === 'object' ? Object.fromEntries(Object.keys(v).sort((a,b)=>a.localeCompare(b,'en')).map(k=>[k,ordered(v[k])])) : v);
test('P076 locks measurestory:1,2 fingerprints and replays context and half-hour rounding', () => {
  for (const e of cases) {
    assert.equal(createHash('sha256').update(JSON.stringify(ordered(e.task))).digest('hex'), e.source.taskHash);
    const m = original.example(e.task), before = structuredClone(m);
    const p = replayP076MeasureStoryEvidence(e.task, m, e.context);
    assert.equal(p?.mode, e.task.mode);
    if (e.task.mode === 'round') assert.deepEqual(p.rounded, [1260, 1260, 1290, 1290, 1290, 1290, 1290]);
    assert.deepEqual(m, before);
  }
});
test('P076 requires fresh Check and rejects wrong choices or conclusion', () => {
  for (const e of cases) {
    const good = original.example(e.task), bad = structuredClone(good);
    if (e.task.mode === 'context') { bad.answers[0] = 'none'; original.act(e.task, bad, 'b19-plan'); }
    else bad.conclusion = 'proved';
    assert.equal(submittedP076MeasureStoryEvidence(e.task, bad, {attempts:[{value:bad}]}, e.context), null);
    assert.equal(submittedP076MeasureStoryEvidence(e.task, good, {attempts:[{value:bad}]}, e.context), null);
    assert.equal(submittedP076MeasureStoryEvidence(e.task, good, {attempts:[{value:bad},{value:good}]}, e.context)?.mode, e.task.mode);
  }
});
test('P076 excludes measurestory:0, practice and bridges', async () => {
  await ensureB39Ready();
  assert.equal(p076MeasureStoryBinding(sessionTaskFor('measurestory', 0), {sessionId: 'measurestory', index: 0}), null);
  for (const e of cases) assert.equal(p076MeasureStoryBinding(e.task, {sessionId: 'measurestory', index: -1}), null);
  for (const [id, b] of Object.entries(BRIDGES)) for (const [idx, rel] of b.tasks.entries()) if (rel?.type === 'x-measurestory') assert.equal(p076MeasureStoryBinding(rel, {sessionId: id, index: idx}), null);
});
