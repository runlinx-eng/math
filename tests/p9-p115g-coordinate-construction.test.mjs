import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {sessionTaskFor} from '../dist/learning/bridges.js';
import {example, inspect} from '../dist/learning/phase5/b24-model.js';
import {P115G_SOURCES, replayP115GCoordinateConstructionEvidence, submittedP115GCoordinateConstructionEvidence} from '../dist/learning/p115g-coordinate-construction-evidence.js';

const ordered = value => Array.isArray(value) ? value.map(ordered) :
  value && typeof value === 'object' ? Object.fromEntries(Object.keys(value).sort((a,b)=>a.localeCompare(b,'en')).map(key=>[key,ordered(value[key])])) : value;

for (const {sessionId, index, taskHash} of P115G_SOURCES) {
  test(`${sessionId}:${index} replays each point, polygon and coordinate answers`, () => {
    const context = {sessionId, index};
    const task = sessionTaskFor(sessionId, index);
    const replay = model => replayP115GCoordinateConstructionEvidence(task, model, context);
    assert.equal(createHash('sha256').update(JSON.stringify(ordered(task))).digest('hex'), taskHash);
    const correct = example(task);
    assert.ok(inspect(task, correct).correct);
    assert.deepEqual(replay(correct)?.placed, task.target);
    assert.equal(replayP115GCoordinateConstructionEvidence(task, correct, {sessionId, index:-1}), null);
    const wrong = structuredClone(correct);
    wrong.answers[0] = '999';
    assert.equal(replay(wrong), null);
    assert.equal(submittedP115GCoordinateConstructionEvidence(task, correct, {attempts:[{value:wrong}]}, context), null);
    assert.deepEqual(submittedP115GCoordinateConstructionEvidence(task, correct, {attempts:[{value:structuredClone(correct)}]}, context), replay(correct));
    const forged = structuredClone(correct);
    forged.history[0].f.x = '99';
    assert.equal(replay(forged), null);
    const tampered=structuredClone(correct);
    tampered.board.placed[0][0]++;
    assert.equal(replay(tampered),null);
  });
}
