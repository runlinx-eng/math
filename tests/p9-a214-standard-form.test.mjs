import assert from 'node:assert/strict';
import test from 'node:test';
import {sessionTaskFor} from '../dist/learning/bridges.js';
import * as original from '../dist/learning/phase5/b08-model.js';
import {taskFingerprint} from '../scripts/audit-evidence-expansion.mjs';
import {SOURCES, binding, replay, submitted} from '../dist/learning/a214-standard-form-evidence.js';

for (const source of SOURCES) {
  test(source.sessionId + ':' + source.index + ' validates the native work and rejects counterexamples', () => {
    const task = sessionTaskFor(source.sessionId, source.index);
    assert.equal(taskFingerprint(task), source.taskHash);
    assert.equal(binding(task, source)?.nodeId, source.nodeId);
    assert.equal(binding({...task, prompt: task.prompt + '。'}, source), null);
    assert.equal(binding(task, {...source, index: String(source.index)}), null);
    const result = model => replay(task, model, source);

    const good = original.initial(task);
    for (const index of [1, 1, 2, 0, 1]) original.act(task, good, 'wide-order', {index});
    good.answers = ['720000', '5800000', '0.00072'];
    assert.deepEqual(result(good)?.order, [2, 0, 1]);
    const wrong = {...good, answers: ['720000', '5800000', '-0.00072']};
    const finalOnly = {...good, orderTrace: []};
    assert.equal(original.inspect(task, finalOnly).correct, true);
    assert.equal(result(finalOnly), null);
    assert.equal(result(wrong), null);
    assert.equal(submitted(task, good, {attempts: [{value: wrong}]}, source), null);
    assert.ok(submitted(task, good, {attempts: [{value: wrong}, {value: structuredClone(good)}]}, source));
  });
}
