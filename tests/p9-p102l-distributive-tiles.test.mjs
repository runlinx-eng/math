import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {sessionTaskFor} from '../dist/learning/bridges.js';
import {example, inspect} from '../dist/learning/phase5/b15-model.js';
import {P102L_SOURCES, replayP102LDistributiveTilesEvidence, submittedP102LDistributiveTilesEvidence} from '../dist/learning/p102l-distributive-tiles-evidence.js';

const ordered = value => Array.isArray(value) ? value.map(ordered) :
  value && typeof value === 'object' ? Object.fromEntries(Object.keys(value).sort((a,b)=>a.localeCompare(b,'en')).map(key=>[key,ordered(value[key])])) : value;

for (const {sessionId, index, taskHash} of P102L_SOURCES) {
  test(`${sessionId}:${index} replays grouping and requires two trials with the full construction`, () => {
    const context = {sessionId, index};
    const task = sessionTaskFor(sessionId, index);
    const replay = model => replayP102LDistributiveTilesEvidence(task, model, context);
    assert.equal(createHash('sha256').update(JSON.stringify(ordered(task))).digest('hex'), taskHash);
    const correct = example(task);
    assert.ok(inspect(task, correct).correct);
    assert.deepEqual(replay(correct)?.coefficients, [3,15]);
    assert.equal(replayP102LDistributiveTilesEvidence(task, correct, {sessionId, index:-1}), null);
    const wrong = structuredClone(correct);
    wrong.coeff='0';
    assert.equal(replay(wrong), null);
    assert.equal(submittedP102LDistributiveTilesEvidence(task, correct, {attempts:[{value:wrong}]}, context), null);
    assert.deepEqual(submittedP102LDistributiveTilesEvidence(task, correct, {attempts:[{value:structuredClone(correct)}]}, context), replay(correct));
    const forged = structuredClone(correct);
    forged.history[0].data.value='x';
    assert.equal(replay(forged), null);
    assert.equal(replay({...correct,constant:'14'}),null);
  });
}
