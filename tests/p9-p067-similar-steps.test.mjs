import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {BRIDGES, sessionTaskFor} from '../dist/learning/bridges.js';
import {ensureB39Ready} from '../dist/learning/phase4/async-batches.js';
import * as original from '../dist/learning/phase5/b37-model.js';
import {P067_SOURCES, p067SimilarStepsBinding, replayP067SimilarStepsEvidence, submittedP067SimilarStepsEvidence} from '../dist/learning/p067-similar-steps-evidence.js';

const [source] = P067_SOURCES, context = {sessionId: source.sessionId, index: source.index};
const task = sessionTaskFor(source.sessionId, source.index);
const ordered = v => Array.isArray(v) ? v.map(ordered) : (v && typeof v === 'object' ? Object.fromEntries(Object.keys(v).sort((a,b)=>a.localeCompare(b,'en')).map(k=>[k,ordered(v[k])])) : v);
const complete = (wrongFirst = false) => {
  const m = original.initial(task);
  if (wrongFirst) { m.value = '99999'; original.act(task, m, 'r37-step'); }
  for (const s of task.steps) { m.value = String(s.value); original.act(task, m, 'r37-step'); }
  return m;
};

test('P067 locks fingerprint', () => {
  assert.equal(createHash('sha256').update(JSON.stringify(ordered(task))).digest('hex'), source.taskHash);
  assert.equal(p067SimilarStepsBinding(task, context)?.nodeId, source.nodeId);
  assert.equal(p067SimilarStepsBinding({...task, prompt: 'x'}, context), null);
});
test('P067 verifies steps and preserves failed attempt', () => {
  const m = complete(true), before = structuredClone(m), p = replayP067SimilarStepsEvidence(task, m, context);
  assert.equal(p?.steps.length, task.steps.length);
  assert.equal(p?.failedSteps, 1);
  assert.deepEqual(m, before);
});
test('P067 requires fresh Check and rejects tampered state', () => {
  const good = complete(false), partial = original.initial(task);
  partial.value = String(task.steps[0].value); original.act(task, partial, 'r37-step');
  assert.equal(submittedP067SimilarStepsEvidence(task, partial, {attempts:[{value:partial}]}, context), null);
  assert.equal(submittedP067SimilarStepsEvidence(task, good, {attempts:[{value:partial}]}, context), null);
  assert.equal(submittedP067SimilarStepsEvidence(task, good, {attempts:[{value:partial},{value:good}]}, context)?.steps.length, task.steps.length);
  for (const mut of [m => { m.history.length = 0; }, m => { m.board.index = 0; }, m => { m.issue = 'e'; }]) {
    const c = structuredClone(good); mut(c); assert.equal(replayP067SimilarStepsEvidence(task, c, context), null);
  }
});
test('P067 excludes practice and bridges', async () => {
  await ensureB39Ready();
  assert.equal(p067SimilarStepsBinding(task, {sessionId: source.sessionId, index: -1}), null);
  for (const [id, b] of Object.entries(BRIDGES)) for (const [idx, rel] of b.tasks.entries()) if (rel?.type === 'x-r37-steps') assert.equal(p067SimilarStepsBinding(rel, {sessionId: id, index: idx}), null);
});
