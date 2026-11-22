import assert from 'node:assert/strict';
import test from 'node:test';
import {sessionTaskFor} from '../dist/learning/bridges.js';
import * as original from '../dist/learning/phase4/b04-model.js';
import {taskFingerprint} from '../scripts/audit-evidence-expansion.mjs';
import {SOURCES, binding, replay, submitted} from '../dist/learning/a214-chance-draws-evidence.js';

for (const source of SOURCES) {
  test(source.sessionId + ':' + source.index + ' validates the native work and rejects counterexamples', () => {
    const task = sessionTaskFor(source.sessionId, source.index);
    assert.equal(taskFingerprint(task), source.taskHash);
    assert.equal(binding(task, source)?.nodeId, source.nodeId);
    assert.equal(binding({...task, prompt: task.prompt + '。'}, source), null);
    assert.equal(binding(task, {...source, index: String(source.index)}), null);
    const result = model => replay(task, model, source);

    const good = original.example(task);
    good.guess = good.prediction = 0;
    good.comparison = good.counts[0] > 0 ? 'higher' : 'same';
    assert.equal(result(good)?.tally.reduce((a, b) => a + b, 0), task.count);
    const wrong = {...good, comparison: 'lower'};
    const forged = structuredClone(good);
    forged.draws[0] = (forged.draws[0] + 1) % task.labels.length;
    assert.equal(result(forged), null);
    assert.equal(result(wrong), null);
    assert.equal(submitted(task, good, {attempts: [{value: wrong}]}, source), null);
    assert.ok(submitted(task, good, {attempts: [{value: wrong}, {value: structuredClone(good)}]}, source));
  });
}
