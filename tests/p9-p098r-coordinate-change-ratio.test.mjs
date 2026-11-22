import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {sessionTaskFor} from '../dist/learning/bridges.js';
import {act, example, inspect} from '../dist/learning/phase5/b36-model.js';
import {P098R_SOURCES, replayP098RCoordinateChangeRatioEvidence, submittedP098RCoordinateChangeRatioEvidence} from '../dist/learning/p098r-coordinate-change-ratio-evidence.js';

const ordered = value => Array.isArray(value) ? value.map(ordered) :
  value && typeof value === 'object' ? Object.fromEntries(Object.keys(value).sort((a,b)=>a.localeCompare(b,'en')).map(key=>[key,ordered(value[key])])) : value;

for (const {sessionId, index, taskHash} of P098R_SOURCES) {
  test(`${sessionId}:${index} replays left-to-right selection and the exact changes`, () => {
    const context = {sessionId, index};
    const task = sessionTaskFor(sessionId, index);
    const replay = model => replayP098RCoordinateChangeRatioEvidence(task, model, context);
    assert.equal(createHash('sha256').update(JSON.stringify(ordered(task))).digest('hex'), taskHash);
    const correct = example(task);
    assert.ok(inspect(task, correct).correct);
    assert.deepEqual(replay(correct)?.changes, [8,4,2]);
    assert.equal(replayP098RCoordinateChangeRatioEvidence(task, correct, {sessionId, index:-1}), null);
    const wrong = structuredClone(correct);
    wrong.answers[0] = '0';
    assert.equal(replay(wrong), null);
    assert.equal(submittedP098RCoordinateChangeRatioEvidence(task, correct, {attempts:[{value:wrong}]}, context), null);
    assert.deepEqual(submittedP098RCoordinateChangeRatioEvidence(task, correct, {attempts:[{value:structuredClone(correct)}]}, context), replay(correct));
    const forged = structuredClone(correct);
    forged.history[0].i = '27';
    assert.equal(replay(forged), null);
    const reversed = structuredClone(correct);
    reversed.history.reverse();
    assert.ok(inspect(task, reversed).correct);
    assert.equal(replay(reversed), null);
    act(task, correct, 'f36-select', {index:1});
    assert.equal(replay(correct), null);
  });
}
