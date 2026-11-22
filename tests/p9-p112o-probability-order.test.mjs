import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {sessionTaskFor} from '../dist/learning/bridges.js';
import {example, inspect} from '../dist/learning/phase5/b22-model.js';
import {P112O_SOURCES, replayP112OProbabilityOrderEvidence, submittedP112OProbabilityOrderEvidence} from '../dist/learning/p112o-probability-order-evidence.js';

const ordered = value => Array.isArray(value) ? value.map(ordered) :
  value && typeof value === 'object' ? Object.fromEntries(Object.keys(value).sort((a,b)=>a.localeCompare(b,'en')).map(key=>[key,ordered(value[key])])) : value;

for (const {sessionId, index, taskHash} of P112O_SOURCES) {
  test(`${sessionId}:${index} replays each probability card and compares exact fractions`, () => {
    const context = {sessionId, index};
    const task = sessionTaskFor(sessionId, index);
    const replay = model => replayP112OProbabilityOrderEvidence(task, model, context);
    assert.equal(createHash('sha256').update(JSON.stringify(ordered(task))).digest('hex'), taskHash);
    const correct = example(task);
    assert.ok(inspect(task, correct).correct);
    assert.deepEqual(replay(correct)?.quarters, [0,1,2,3,4]);
    assert.equal(replayP112OProbabilityOrderEvidence(task, correct, {sessionId, index:-1}), null);
    const wrong = structuredClone(correct);
    wrong.answers[0] = '8';
    assert.equal(replay(wrong), null);
    assert.equal(submittedP112OProbabilityOrderEvidence(task, correct, {attempts:[{value:wrong}]}, context), null);
    assert.deepEqual(submittedP112OProbabilityOrderEvidence(task, correct, {attempts:[{value:structuredClone(correct)}]}, context), replay(correct));
    const forged = structuredClone(correct);
    forged.history[0].d.index = '27';
    assert.equal(replay(forged), null);
    const tampered=structuredClone(correct);
    tampered.board.order.reverse();
    assert.equal(replay(tampered),null);
  });
}
