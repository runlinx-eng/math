import assert from 'node:assert/strict';
import test from 'node:test';
import {sessionTaskFor} from '../dist/learning/bridges.js';
import * as original from '../dist/learning/phase5/b10-model.js';
import {taskFingerprint} from '../scripts/audit-evidence-expansion.mjs';
import {SOURCES, binding, replay, submitted} from '../dist/learning/a214-count-from-start-evidence.js';

for (const source of SOURCES) {
  test(source.sessionId + ':' + source.index + ' validates the native work and rejects counterexamples', () => {
    const task = sessionTaskFor(source.sessionId, source.index);
    assert.equal(taskFingerprint(task), source.taskHash);
    assert.equal(binding(task, source)?.nodeId, source.nodeId);
    assert.equal(binding({...task, prompt: task.prompt + '。'}, source), null);
    assert.equal(binding(task, {...source, index: String(source.index)}), null);
    const result = model => replay(task, model, source);

    const good = original.initial(task);
    const [start, count, direction] = task.op === '+' ? [Math.max(task.a, task.b), Math.min(task.a, task.b), 1] : [task.a, task.b, -1];
    good.start = String(start);
    original.field(task, good, 'start');
    const enter = n => {
      good.next = String(n);
      original.act(task, good, 'steps-next');
    };
    enter(start);
    const wrong = structuredClone(good);
    original.act(task, good, 'steps-undo');
    for (let i = 1; i <= count; i++) enter(start + i * direction);
    good.equation = task.a + task.op + task.b + '=' + (start + direction * count);
    const proof = result(good);
    assert.deepEqual(proof?.retained, good.hops);
    assert.equal(proof?.recordedSteps[0], start);
    assert.equal(proof?.explicitUndoRecorded, false);
    const forged = {...good, history: good.history.slice(0, 2)};
    assert.equal(original.inspect(task, forged).correct, true);
    assert.equal(result(forged), null);
    assert.equal(result(wrong), null);
    assert.equal(submitted(task, good, {attempts: [{value: wrong}]}, source), null);
    assert.ok(submitted(task, good, {attempts: [{value: wrong}, {value: structuredClone(good)}]}, source));
  });
}
