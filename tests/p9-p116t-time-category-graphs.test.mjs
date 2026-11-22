import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {sessionTaskFor} from '../dist/learning/bridges.js';
import {example, inspect} from '../dist/learning/phase5/b20-model.js';
import {P116T_SOURCES, replayP116TTimeCategoryGraphsEvidence, submittedP116TTimeCategoryGraphsEvidence} from '../dist/learning/p116t-time-category-graphs-evidence.js';

const ordered = value => Array.isArray(value) ? value.map(ordered) :
  value && typeof value === 'object' ? Object.fromEntries(Object.keys(value).sort((a,b)=>a.localeCompare(b,'en')).map(key=>[key,ordered(value[key])])) : value;

for (const {sessionId, index, taskHash} of P116T_SOURCES) {
  test(`${sessionId}:${index} replays graph construction or the changed scale`, () => {
    const context = {sessionId, index};
    const task = sessionTaskFor(sessionId, index);
    const replay = model => replayP116TTimeCategoryGraphsEvidence(task, model, context);
    assert.equal(createHash('sha256').update(JSON.stringify(ordered(task))).digest('hex'), taskHash);
    const correct = example(task);
    assert.ok(inspect(task, correct).correct);
    assert.deepEqual(replay(correct)?.points, task.points);
    assert.equal(replayP116TTimeCategoryGraphsEvidence(task, correct, {sessionId, index:-1}), null);
    const wrong = structuredClone(correct);
    wrong.history=[];
    assert.equal(replay(wrong), null);
    assert.equal(submittedP116TTimeCategoryGraphsEvidence(task, correct, {attempts:[{value:wrong}]}, context), null);
    assert.deepEqual(submittedP116TTimeCategoryGraphsEvidence(task, correct, {attempts:[{value:structuredClone(correct)}]}, context), replay(correct));
    const forged = structuredClone(correct);
    forged.history[0].a='bin';
    assert.equal(replay(forged), null);
    const altered=structuredClone(correct);
    altered.board.points[0][1]++;
    assert.equal(replay(altered),null);
  });
}
