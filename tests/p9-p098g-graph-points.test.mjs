import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {sessionTaskFor} from '../dist/learning/bridges.js';
import {act, example, inspect} from '../dist/learning/phase5/b16-model.js';
import {P098G_SOURCES, replayP098GGraphPointsEvidence, submittedP098GGraphPointsEvidence} from '../dist/learning/p098g-graph-points-evidence.js';

const ordered = value => Array.isArray(value) ? value.map(ordered) :
  value && typeof value === 'object' ? Object.fromEntries(Object.keys(value).sort((a,b)=>a.localeCompare(b,'en')).map(key=>[key,ordered(value[key])])) : value;

for (const {sessionId, index, taskHash} of P098G_SOURCES) {
  test(`${sessionId}:${index} replays plotted values and the graph comparison`, () => {
    const context = {sessionId, index};
    const task = sessionTaskFor(sessionId, index);
    const replay = model => replayP098GGraphPointsEvidence(task, model, context);
    assert.equal(createHash('sha256').update(JSON.stringify(ordered(task))).digest('hex'), taskHash);
    const correct = example(task);
    assert.ok(inspect(task, correct).correct);
    assert.deepEqual(replay(correct)?.points, task.data);
    assert.equal(replayP098GGraphPointsEvidence(task, correct, {sessionId, index:-1}), null);
    const wrong = structuredClone(correct);
    wrong.answer = '999';
    assert.equal(replay(wrong), null);
    assert.equal(submittedP098GGraphPointsEvidence(task, correct, {attempts:[{value:wrong}]}, context), null);
    assert.deepEqual(submittedP098GGraphPointsEvidence(task, correct, {attempts:[{value:structuredClone(correct)}]}, context), replay(correct));
    const forged = structuredClone(correct);
    forged.history[0].data.fields.x = '27';
    assert.equal(replay(forged), null);
    act(task, correct, 'b16-reset');
    assert.equal(replay(correct), null);
  });
}
