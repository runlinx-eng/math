import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {sessionTaskFor} from '../dist/learning/bridges.js';
import {act, example, inspect} from '../dist/learning/phase5/b13-model.js';
import {P107R_SOURCES, replayP107RFactorRectanglesEvidence, submittedP107RFactorRectanglesEvidence} from '../dist/learning/p107r-factor-rectangles-evidence.js';

const ordered = value => Array.isArray(value) ? value.map(ordered) :
  value && typeof value === 'object' ? Object.fromEntries(Object.keys(value).sort((a,b)=>a.localeCompare(b,'en')).map(key=>[key,ordered(value[key])])) : value;

for (const {sessionId, index, taskHash} of P107R_SOURCES) {
  test(`${sessionId}:${index} replays each unique factor rectangle`, () => {
    const context = {sessionId, index};
    const task = sessionTaskFor(sessionId, index);
    const replay = model => replayP107RFactorRectanglesEvidence(task, model, context);
    assert.equal(createHash('sha256').update(JSON.stringify(ordered(task))).digest('hex'), taskHash);
    const correct = example(task);
    assert.ok(inspect(task, correct).correct);
    assert.deepEqual(replay(correct)?.pairs.length, task.n === 36 ? 5 : 4);
    assert.equal(replayP107RFactorRectanglesEvidence(task, correct, {sessionId, index:-1}), null);
    const wrong = structuredClone(correct);
    act(task, wrong, 'b13-reset');
    assert.equal(replay(wrong), null);
    assert.equal(submittedP107RFactorRectanglesEvidence(task, correct, {attempts:[{value:wrong}]}, context), null);
    assert.deepEqual(submittedP107RFactorRectanglesEvidence(task, correct, {attempts:[{value:structuredClone(correct)}]}, context), replay(correct));
    const forged = structuredClone(correct);
    forged.history[0].data.answer = '';
    assert.equal(replay(forged), null);
    const duplicate = structuredClone(correct);
    act(task, duplicate, 'b13-pair-save');
    assert.equal(replay(duplicate), null);
    act(task, correct, 'b13-reset');
    assert.equal(replay(correct), null);
  });
}
