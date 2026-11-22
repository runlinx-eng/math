import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {sessionTaskFor} from '../dist/learning/bridges.js';
import {example, inspect} from '../dist/learning/phase5/b24-model.js';
import {P115F_SOURCES, replayP115FPolygonAngleFanEvidence, submittedP115FPolygonAngleFanEvidence} from '../dist/learning/p115f-polygon-angle-fan-evidence.js';

const ordered = value => Array.isArray(value) ? value.map(ordered) :
  value && typeof value === 'object' ? Object.fromEntries(Object.keys(value).sort((a,b)=>a.localeCompare(b,'en')).map(key=>[key,ordered(value[key])])) : value;

for (const {sessionId, index, taskHash} of P115F_SOURCES) {
  test(`${sessionId}:${index} replays saved fans and verifies gap and overlap`, () => {
    const context = {sessionId, index};
    const task = sessionTaskFor(sessionId, index);
    const replay = model => replayP115FPolygonAngleFanEvidence(task, model, context);
    assert.equal(createHash('sha256').update(JSON.stringify(ordered(task))).digest('hex'), taskHash);
    const correct = example(task);
    assert.ok(inspect(task, correct).correct);
    assert.deepEqual(replay(correct)?.angles, [360,360,360,324,432]);
    assert.equal(replayP115FPolygonAngleFanEvidence(task, correct, {sessionId, index:-1}), null);
    const wrong = structuredClone(correct);
    wrong.answers[0] = '0';
    assert.equal(replay(wrong), null);
    assert.equal(submittedP115FPolygonAngleFanEvidence(task, correct, {attempts:[{value:wrong}]}, context), null);
    assert.deepEqual(submittedP115FPolygonAngleFanEvidence(task, correct, {attempts:[{value:structuredClone(correct)}]}, context), replay(correct));
    const forged = structuredClone(correct);
    forged.history[0].f.kind = '9';
    assert.equal(replay(forged), null);
    assert.equal(replay({...correct,answers:['324','36.000000001','three']}),null);
  });
}
