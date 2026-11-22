import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {sessionTaskFor} from '../dist/learning/bridges.js';
import {act, example, inspect} from '../dist/learning/phase5/b13-model.js';
import {P096D_SOURCES, replayP096DDivisionReverseEvidence, submittedP096DDivisionReverseEvidence} from '../dist/learning/p096d-division-reverse-evidence.js';

const ordered = value => Array.isArray(value) ? value.map(ordered) :
  value && typeof value === 'object' ? Object.fromEntries(Object.keys(value).sort((a,b)=>a.localeCompare(b,'en')).map(key=>[key,ordered(value[key])])) : value;

for (const {sessionId, index, taskHash} of P096D_SOURCES) {
  test(`${sessionId}:${index} replays the swap and both exact division results`, () => {
    const context = {sessionId, index};
    const task = sessionTaskFor(sessionId, index);
    const replay = model => replayP096DDivisionReverseEvidence(task, model, context);
    assert.equal(createHash('sha256').update(JSON.stringify(ordered(task))).digest('hex'), taskHash);
    const correct = example(task);
    assert.ok(inspect(task, correct).correct);
    assert.deepEqual(replay(correct)?.quotients, [[12,3],[3,12]]);
    assert.equal(replayP096DDivisionReverseEvidence(task, correct, {sessionId, index:-1}), null);
    const wrong = structuredClone(correct);
    wrong.answer = '999';
    assert.equal(replay(wrong), null);
    assert.equal(submittedP096DDivisionReverseEvidence(task, correct, {attempts:[{value:wrong}]}, context), null);
    assert.deepEqual(submittedP096DDivisionReverseEvidence(task, correct, {attempts:[{value:structuredClone(correct)}]}, context), replay(correct));
    const forged = structuredClone(correct);
    forged.history[0].data.answer = '3';
    assert.equal(replay(forged), null);
    act(task, correct, 'b13-div-swap');
    assert.ok(inspect(task, correct).correct);
    assert.equal(replay(correct), null);
    act(task, correct, 'b13-reset');
    assert.equal(replay(correct), null);
  });
}
