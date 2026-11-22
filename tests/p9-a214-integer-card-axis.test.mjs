import assert from 'node:assert/strict';
import test from 'node:test';
import {sessionTaskFor} from '../dist/learning/bridges.js';
import * as original from '../dist/learning/phase5/b07-model.js';
import {taskFingerprint} from '../scripts/audit-evidence-expansion.mjs';
import {SOURCES, binding, replay, submitted} from '../dist/learning/a214-integer-card-axis-evidence.js';

for (const source of SOURCES) {
  test(source.sessionId + ':' + source.index + ' validates the native work and rejects counterexamples', () => {
    const task = sessionTaskFor(source.sessionId, source.index);
    assert.equal(taskFingerprint(task), source.taskHash);
    assert.equal(binding(task, source)?.nodeId, source.nodeId);
    assert.equal(binding({...task, prompt: task.prompt + '。'}, source), null);
    assert.equal(binding(task, {...source, index: String(source.index)}), null);
    const result = model => replay(task, model, source);

    const good = original.example(task);
    const proof = result(good);
    assert.deepEqual(proof?.retainedCardOrder.map(i => task.values[i]), [...task.values].sort((a, b) => a - b));
    assert.equal(proof?.sliderMovementHistoryRecorded, false);
    const wrong = {...good, positions: [good.positions[0] + 1, ...good.positions.slice(1)]};
    const finalOnly = {...good, touched: good.touched.map(() => false)};
    assert.equal(result(finalOnly), null);
    assert.equal(result(wrong), null);
    assert.equal(submitted(task, good, {attempts: [{value: wrong}]}, source), null);
    assert.ok(submitted(task, good, {attempts: [{value: wrong}, {value: structuredClone(good)}]}, source));
  });
}
