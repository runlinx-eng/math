import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {sessionTaskFor} from '../dist/learning/bridges.js';
import {act, example, inspect} from '../dist/learning/phase5/b24-model.js';
import {P115W_SOURCES, replayP115WDirectionWalkEvidence, submittedP115WDirectionWalkEvidence} from '../dist/learning/p115w-direction-walk-evidence.js';

const ordered = value => Array.isArray(value) ? value.map(ordered) :
  value && typeof value === 'object' ? Object.fromEntries(Object.keys(value).sort((a,b)=>a.localeCompare(b,'en')).map(key=>[key,ordered(value[key])])) : value;

for (const {sessionId, index, taskHash} of P115W_SOURCES) {
  test(`${sessionId}:${index} replays each turn and step and the latest Check`, () => {
    const context = {sessionId, index};
    const task = sessionTaskFor(sessionId, index);
    const replay = model => replayP115WDirectionWalkEvidence(task, model, context);
    assert.equal(createHash('sha256').update(JSON.stringify(ordered(task))).digest('hex'), taskHash);
    const correct = example(task);
    assert.ok(inspect(task, correct).correct);
    assert.deepEqual(replay(correct)?.operations, task.ops);
    assert.equal(replayP115WDirectionWalkEvidence(task, correct, {sessionId, index:-1}), null);
    const wrong = structuredClone(correct);
    wrong.answers[0] = '0';
    assert.equal(replay(wrong), null);
    assert.equal(submittedP115WDirectionWalkEvidence(task, correct, {attempts:[{value:wrong}]}, context), null);
    assert.deepEqual(submittedP115WDirectionWalkEvidence(task, correct, {attempts:[{value:structuredClone(correct)}]}, context), replay(correct));
    const forged = structuredClone(correct);
    forged.history[0].a = 'wrong';
    assert.equal(replay(forged), null);
    act(task, correct, 'p24-reset');
    assert.equal(replay(correct), null);
  });
}
