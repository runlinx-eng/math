import assert from 'node:assert/strict';
import test from 'node:test';
import {prepareSessionRuntime} from '../dist/learning/phase4/async-batches.js';
import {sessionTaskFor} from '../dist/learning/bridges.js';
import * as original from '../dist/learning/phase5/b25-model.js';
import {taskFingerprint} from '../scripts/audit-evidence-expansion.mjs';
import {SOURCE, binding, replay, submitted} from '../dist/learning/a214-protractor-evidence.js';

test('representations39:3 rejects the supplementary scale and checks the recorded alignment', async () => {
  await prepareSessionRuntime(SOURCE.sessionId);
  const task = sessionTaskFor(SOURCE.sessionId, SOURCE.index);
  assert.equal(taskFingerprint(task), SOURCE.taskHash);
  assert.equal(binding(task, SOURCE)?.nodeId, SOURCE.nodeId);
  assert.equal(binding(task, {...SOURCE, index: 2}), null);

  const model = original.initial(task, 314159);
  // Include an extra move and its inverse. Both were visible and preserved.
  for (const index of ['down', 'up', 'right', 'right', 'up']) original.act(task, model, 'g25-move', {index});
  original.act(task, model, 'g25-flip');
  model.answers[0] = '50';
  const wrong = structuredClone(model);
  assert.equal(original.inspect(task, wrong).correct, false);
  assert.equal(replay(task, wrong, SOURCE), null);
  model.answers[0] = '130';
  const record = {attempts: [{value: wrong}, {value: structuredClone(model)}]};
  const proof = submitted(task, model, record, SOURCE);
  assert.equal(proof?.displayedDegrees, 130);
  assert.deepEqual(proof?.alignedCenter, [0, 0]);
  assert.equal(proof?.events.length, 6);
  assert.equal(submitted(task, model, {attempts: record.attempts.slice(0, 1)}, SOURCE), null);
  assert.equal(replay(task, {...model, history: []}, SOURCE), null);
  assert.equal(replay(task, {...model, angle: '130'}, SOURCE), null);
});
