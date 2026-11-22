import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {sessionTaskFor} from '../dist/learning/bridges.js';
import {example, inspect} from '../dist/learning/phase5/b29-model.js';
import {P095I_SOURCES, replayP095IIntervalDistanceEvidence, submittedP095IIntervalDistanceEvidence} from '../dist/learning/p095i-interval-distance-evidence.js';

const ordered = value => Array.isArray(value) ? value.map(ordered) :
  value && typeof value === 'object' ? Object.fromEntries(Object.keys(value).sort((a,b)=>a.localeCompare(b,'en')).map(key=>[key,ordered(value[key])])) : value;

for (const {sessionId, index, taskHash} of P095I_SOURCES) {
  test(`${sessionId}:${index} replays directed movement and exact interval length`, () => {
    const context = {sessionId, index};
    const task = sessionTaskFor(sessionId, index);
    const replay = model => replayP095IIntervalDistanceEvidence(task, model, context);
    assert.equal(createHash('sha256').update(JSON.stringify(ordered(task))).digest('hex'), taskHash);
    const correct = example(task);
    assert.ok(inspect(task, correct).correct);
    assert.deepEqual(replay(correct)?.positions.at(-1), task.end);
    assert.equal(replayP095IIntervalDistanceEvidence(task, correct, {sessionId, index:-1}), null);
    const wrong = structuredClone(correct);
    wrong.answer = '0';
    assert.equal(replay(wrong), null);
    assert.equal(submittedP095IIntervalDistanceEvidence(task, correct, {attempts:[{value:wrong}]}, context), null);
    assert.deepEqual(submittedP095IIntervalDistanceEvidence(task, correct, {attempts:[{value:structuredClone(correct)}]}, context), replay(correct));
    const forged = structuredClone(correct);
    forged.history[0].v = '27';
    assert.equal(replay(forged), null);
    assert.equal(replay({...correct,unit:'kg'}),null);
  });
}
