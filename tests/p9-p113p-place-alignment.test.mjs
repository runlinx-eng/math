import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {sessionTaskFor} from '../dist/learning/bridges.js';
import {example, inspect} from '../dist/learning/phase5/b11-model.js';
import {P113P_SOURCES, replayP113PPlaceAlignmentEvidence, submittedP113PPlaceAlignmentEvidence} from '../dist/learning/p113p-place-alignment-evidence.js';

const ordered = value => Array.isArray(value) ? value.map(ordered) :
  value && typeof value === 'object' ? Object.fromEntries(Object.keys(value).sort((a,b)=>a.localeCompare(b,'en')).map(key=>[key,ordered(value[key])])) : value;

for (const {sessionId, index, taskHash} of P113P_SOURCES) {
  test(`${sessionId}:${index} replays alignment and matching place values`, () => {
    const context = {sessionId, index};
    const task = sessionTaskFor(sessionId, index);
    const replay = model => replayP113PPlaceAlignmentEvidence(task, model, context);
    assert.equal(createHash('sha256').update(JSON.stringify(ordered(task))).digest('hex'), taskHash);
    const correct = example(task);
    assert.ok(inspect(task, correct).correct);
    assert.deepEqual(replay(correct)?.total, task.values[0]+task.values[1]);
    assert.equal(replayP113PPlaceAlignmentEvidence(task, correct, {sessionId, index:-1}), null);
    const wrong = structuredClone(correct);
    wrong.answer = '999';
    assert.equal(replay(wrong), null);
    assert.equal(submittedP113PPlaceAlignmentEvidence(task, correct, {attempts:[{value:wrong}]}, context), null);
    assert.deepEqual(submittedP113PPlaceAlignmentEvidence(task, correct, {attempts:[{value:structuredClone(correct)}]}, context), replay(correct));
    const forged = structuredClone(correct);
    forged.history[0].align[0] = '1';
    assert.equal(replay(forged), null);
    correct.history=[];
    assert.equal(replay(correct),null);
  });
}
