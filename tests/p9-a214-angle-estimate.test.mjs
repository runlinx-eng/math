import assert from 'node:assert/strict';
import test from 'node:test';
import {sessionTaskFor} from '../dist/learning/bridges.js';
import {prepareSessionRuntime} from '../dist/learning/phase4/async-batches.js';
import * as native from '../dist/learning/phase5/b25-model.js';
import {taskFingerprint} from '../scripts/audit-evidence-expansion.mjs';
import {SOURCE, replay, submitted} from '../dist/learning/a214-angle-estimate-evidence.js';

test('representations39:2 has its own runtime source and submission identity', async () => {
  await prepareSessionRuntime(SOURCE.sessionId);
  const task = sessionTaskFor(SOURCE.sessionId, SOURCE.index);
  assert.equal(taskFingerprint(task), SOURCE.taskHash);
  const model = native.example(task);
  const record = {attempts: [{value: structuredClone(model)}]};
  const proof = submitted(task, model, record, SOURCE);
  assert.equal(proof?.nodeId, SOURCE.nodeId);
  assert.equal(proof?.sessionId, SOURCE.sessionId);
  assert.equal(proof?.index, SOURCE.index);
  assert.equal(proof?.method, null);
  assert.equal(replay(task, model, {sessionId: 'angleestimate', index: 0}), null);
  assert.equal(replay(task, model, {...SOURCE, index: 1}), null);
  assert.equal(replay({...task, prompt: task.prompt + '。'}, model, SOURCE), null);
  assert.equal(replay(task, {...model, history: []}, SOURCE), null);
  assert.equal(submitted(task, model, {attempts: [{value: native.initial(task)}]}, SOURCE), null);
});
