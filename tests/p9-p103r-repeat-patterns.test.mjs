import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {sessionTaskFor} from '../dist/learning/bridges.js';
import {act, example, inspect} from '../dist/learning/phase5/b34-model.js';
import {P103R_SOURCES, replayP103RRepeatPatternsEvidence, submittedP103RRepeatPatternsEvidence} from '../dist/learning/p103r-repeat-patterns-evidence.js';

const ordered = value => Array.isArray(value) ? value.map(ordered) :
  value && typeof value === 'object' ? Object.fromEntries(Object.keys(value).sort((a,b)=>a.localeCompare(b,'en')).map(key=>[key,ordered(value[key])])) : value;

for (const {sessionId, index, taskHash} of P103R_SOURCES) {
  test(`${sessionId}:${index} replays the smallest repeating unit`, () => {
    const context = {sessionId, index};
    const task = sessionTaskFor(sessionId, index);
    const replay = model => replayP103RRepeatPatternsEvidence(task, model, context);
    assert.equal(createHash('sha256').update(JSON.stringify(ordered(task))).digest('hex'), taskHash);
    const correct = example(task);
    assert.ok(inspect(task, correct).correct);
    assert.deepEqual(replay(correct)?.unit.length, task.unitLength ?? task.unit.length);
    assert.equal(replayP103RRepeatPatternsEvidence(task, correct, {sessionId, index:-1}), null);
    const wrong = structuredClone(correct);
    act(task, wrong, 'p34-clear');
    assert.equal(replay(wrong), null);
    assert.equal(submittedP103RRepeatPatternsEvidence(task, correct, {attempts:[{value:wrong}]}, context), null);
    assert.deepEqual(submittedP103RRepeatPatternsEvidence(task, correct, {attempts:[{value:structuredClone(correct)}]}, context), replay(correct));
    const forged = structuredClone(correct);
    forged.history[0].i = '27';
    assert.equal(replay(forged), null);
    act(task,correct,'p34-undo');
    assert.equal(replay(correct),null);
  });
}
