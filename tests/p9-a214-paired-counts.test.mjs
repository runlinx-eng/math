import assert from 'node:assert/strict';
import test from 'node:test';
import {sessionTaskFor} from '../dist/learning/bridges.js';
import * as original from '../dist/learning/phase5/b06-model.js';
import {taskFingerprint} from '../scripts/audit-evidence-expansion.mjs';
import {SOURCES, binding, replay, submitted} from '../dist/learning/a214-paired-counts-evidence.js';

for (const source of SOURCES) {
  test(source.sessionId + ':' + source.index + ' validates the native work and rejects counterexamples', () => {
    const task = sessionTaskFor(source.sessionId, source.index);
    assert.equal(taskFingerprint(task), source.taskHash);
    assert.equal(binding(task, source)?.nodeId, source.nodeId);
    assert.equal(binding({...task, prompt: task.prompt + '。'}, source), null);
    assert.equal(binding(task, {...source, index: String(source.index)}), null);
    const result = model => replay(task, model, source);

    const good = original.example(task);
    if (!task.c) good.most = good.least = '';
    const minimum = Math.min(task.a, task.b);
    assert.deepEqual(result(good)?.unmatched, [task.a - minimum, task.b - minimum]);
    const wrong = {...good, pairs: good.pairs.slice(1)};
    const duplicate = structuredClone(good);
    duplicate.pairs[1][1] = duplicate.pairs[0][1];
    assert.equal(result(duplicate), null);
    assert.equal(result(wrong), null);
    assert.equal(submitted(task, good, {attempts: [{value: wrong}]}, source), null);
    assert.ok(submitted(task, good, {attempts: [{value: wrong}, {value: structuredClone(good)}]}, source));
  });
}
