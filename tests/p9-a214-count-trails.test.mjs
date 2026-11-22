import assert from 'node:assert/strict';
import test from 'node:test';
import {sessionTaskFor} from '../dist/learning/bridges.js';
import * as original from '../dist/learning/phase5/b06-model.js';
import {
  COUNT_TRAIL_SOURCES, countTrailBinding, replayCountTrailEvidence, submittedCountTrailEvidence
} from '../dist/learning/a214-count-trails-evidence.js';
import {taskFingerprint} from '../scripts/audit-evidence-expansion.mjs';

for (const source of COUNT_TRAIL_SOURCES) {
  test(source.sessionId + ':' + source.index + ' preserves identity, counting error and applicable recount', () => {
    const task = sessionTaskFor(source.sessionId, source.index);
    assert.equal(taskFingerprint(task), source.taskHash);
    assert.equal(countTrailBinding(task, source)?.nodeId, source.nodeId);
    assert.equal(countTrailBinding({...task, n: task.n + 1}, source), null);
    const model = original.initial(task);
    const tap = index => original.act(task, model, 'count-tap', {index});
    tap(0);
    tap(0);
    const wrong = structuredClone(model);
    assert.deepEqual(wrong.taps, [0, 0]);
    assert.equal(replayCountTrailEvidence(task, wrong, source), null);
    original.act(task, model, 'count-undo');
    for (let i = 1; i < task.n; i++) tap(i);
    model.total = task.n;
    if (task.rearrange) {
      model.prediction = task.n;
      original.act(task, model, 'count-move');
      model.after = task.n;
      model.why = 'same';
    }
    if (task.recount) for (let i = task.n - 1; i >= 0; i--) tap(i);
    if (task.error) {
      model.badStep = 4;
      model.why = 'twice';
    }
    if (task.crooked) model.why = 'start';
    const record = {attempts: [{value: wrong}, {value: structuredClone(model)}]};
    const proof = submittedCountTrailEvidence(task, model, record, source);
    assert.equal(proof?.distinctObjects, task.n);
    assert.equal(proof?.duplicateOrdinalInGivenExample, task.error ? 4 : null);
    assert.equal(proof?.retainedRecount?.length, task.recount ? task.n : undefined);
    assert.equal(submittedCountTrailEvidence(task, model, {attempts: record.attempts.slice(0, 1)}, source), null);

    const finalOnly = {...model, taps: []};
    assert.equal(replayCountTrailEvidence(task, finalOnly, source), null);
    const hidden = task.recount ? {...model, again: [...model.taps]} : {...model, again: [0]};
    assert.equal(replayCountTrailEvidence(task, hidden, source), null);
  });
}
