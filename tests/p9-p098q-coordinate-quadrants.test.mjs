import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {sessionTaskFor} from '../dist/learning/bridges.js';
import {act, example, inspect} from '../dist/learning/phase5/b36-model.js';
import {P098Q_SOURCES, replayP098QCoordinateQuadrantsEvidence, submittedP098QCoordinateQuadrantsEvidence} from '../dist/learning/p098q-coordinate-quadrants-evidence.js';

const ordered = value => Array.isArray(value) ? value.map(ordered) :
  value && typeof value === 'object' ? Object.fromEntries(Object.keys(value).sort((a,b)=>a.localeCompare(b,'en')).map(key=>[key,ordered(value[key])])) : value;

for (const {sessionId, index, taskHash} of P098Q_SOURCES) {
  test(`${sessionId}:${index} replays half-grid coordinates and classifies axes and quadrants after the latest Check`, () => {
    const context = {sessionId, index};
    const task = sessionTaskFor(sessionId, index);
    const replay = model => replayP098QCoordinateQuadrantsEvidence(task, model, context);
    assert.equal(createHash('sha256').update(JSON.stringify(ordered(task))).digest('hex'), taskHash);
    const correct = example(task);
    assert.ok(inspect(task, correct).correct);
    assert.deepEqual(replay(correct)?.points, task.targets);
    assert.equal(replayP098QCoordinateQuadrantsEvidence(task, correct, {sessionId, index:-1}), null);
    const wrong = structuredClone(correct);
    wrong.answers[0] = '0';
    assert.equal(replay(wrong), null);
    assert.equal(submittedP098QCoordinateQuadrantsEvidence(task, correct, {attempts:[{value:wrong}]}, context), null);
    assert.deepEqual(submittedP098QCoordinateQuadrantsEvidence(task, correct, {attempts:[{value:structuredClone(correct)}]}, context), replay(correct));
    const forged = structuredClone(correct);
    forged.history[0].v = '27';
    assert.equal(replay(forged), null);
    act(task, correct, 'f36-undo');
    assert.equal(replay(correct), null);
  });
}
