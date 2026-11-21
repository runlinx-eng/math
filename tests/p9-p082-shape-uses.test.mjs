import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {BRIDGES, sessionTaskFor} from '../dist/learning/bridges.js';
import {ensureB39Ready} from '../dist/learning/phase4/async-batches.js';
import * as original from '../dist/learning/phase5/b23-model.js';
import {P082_SOURCES, p082ShapeUsesBinding, replayP082ShapeUsesEvidence, submittedP082ShapeUsesEvidence} from '../dist/learning/p082-shape-uses-evidence.js';

const cases = P082_SOURCES.map(s => ({source: s, context: {sessionId: s.sessionId, index: s.index}, task: sessionTaskFor(s.sessionId, s.index)}));
const ordered = v => Array.isArray(v) ? v.map(ordered) : (v && typeof v === 'object' ? Object.fromEntries(Object.keys(v).sort((a,b)=>a.localeCompare(b,'en')).map(k=>[k,ordered(v[k])])) : v);
test('P082 locks all 3 shapeuses fingerprints and replays roll/stack/pack', () => {
  for (const e of cases) {
    assert.equal(createHash('sha256').update(JSON.stringify(ordered(e.task))).digest('hex'), e.source.taskHash);
    const m = original.example(e.task), before = structuredClone(m);
    assert.ok(replayP082ShapeUsesEvidence(e.task, m, e.context)?.stacked);
    assert.deepEqual(m, before);
  }
});
test('P082 requires fresh Check and rejects wrong answer', () => {
  for (const e of cases) {
    const good = original.example(e.task), bad = structuredClone(good);
    bad.answers[0] = e.task.questions[0].options[1][0];
    assert.equal(submittedP082ShapeUsesEvidence(e.task, bad, {attempts:[{value:bad}]}, e.context), null);
    assert.equal(submittedP082ShapeUsesEvidence(e.task, good, {attempts:[{value:bad}]}, e.context), null);
    assert.ok(submittedP082ShapeUsesEvidence(e.task, good, {attempts:[{value:bad},{value:good}]}, e.context)?.stacked);
  }
});
test('P082 excludes practice and bridges', async () => {
  await ensureB39Ready();
  for (const e of cases) assert.equal(p082ShapeUsesBinding(e.task, {sessionId: 'shapeuses', index: -1}), null);
  for (const [id, b] of Object.entries(BRIDGES)) for (const [idx, rel] of b.tasks.entries()) if (rel?.type === 'x-s23-objects') assert.equal(p082ShapeUsesBinding(rel, {sessionId: id, index: idx}), null);
});
