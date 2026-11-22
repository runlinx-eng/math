import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {sessionTaskFor} from '../dist/learning/bridges.js';
import {example, inspect} from '../dist/learning/phase5/b22-model.js';
import {P112B_SOURCES, replayP112BBagSamplingEvidence, submittedP112BBagSamplingEvidence} from '../dist/learning/p112b-bag-sampling-evidence.js';

const ordered = value => Array.isArray(value) ? value.map(ordered) :
  value && typeof value === 'object' ? Object.fromEntries(Object.keys(value).sort((a,b)=>a.localeCompare(b,'en')).map(key=>[key,ordered(value[key])])) : value;

for (const {sessionId, index, taskHash} of P112B_SOURCES) {
  test(`${sessionId}:${index} replays retained samples and separates them from theory`, () => {
    const context = {sessionId, index};
    const task = sessionTaskFor(sessionId, index);
    const replay = model => replayP112BBagSamplingEvidence(task, model, context);
    assert.equal(createHash('sha256').update(JSON.stringify(ordered(task))).digest('hex'), taskHash);
    const correct = example(task);
    assert.ok(inspect(task, correct).correct);
    assert.deepEqual(replay(correct)?.theoretical, [[3,4],[6,12]]);
    assert.equal(replayP112BBagSamplingEvidence(task, correct, {sessionId, index:-1}), null);
    const wrong = structuredClone(correct);
    wrong.answers[0] = '8';
    assert.equal(replay(wrong), null);
    assert.equal(submittedP112BBagSamplingEvidence(task, correct, {attempts:[{value:wrong}]}, context), null);
    assert.deepEqual(submittedP112BBagSamplingEvidence(task, correct, {attempts:[{value:structuredClone(correct)}]}, context), replay(correct));
    const forged = structuredClone(correct);
    forged.history.splice(1,1);
    assert.equal(replay(forged), null);
    const tampered=structuredClone(correct);
    tampered.board.drawA[0]=1-tampered.board.drawA[0];
    assert.equal(replay(tampered),null);
  });
}
