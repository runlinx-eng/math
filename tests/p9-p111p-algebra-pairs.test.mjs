import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {sessionTaskFor} from '../dist/learning/bridges.js';
import {example, inspect} from '../dist/learning/phase5/b35-model.js';
import {P111P_SOURCES, replayP111PAlgebraPairsEvidence, submittedP111PAlgebraPairsEvidence} from '../dist/learning/p111p-algebra-pairs-evidence.js';

const ordered = value => Array.isArray(value) ? value.map(ordered) :
  value && typeof value === 'object' ? Object.fromEntries(Object.keys(value).sort((a,b)=>a.localeCompare(b,'en')).map(key=>[key,ordered(value[key])])) : value;

for (const {sessionId, index, taskHash} of P111P_SOURCES) {
  test(`${sessionId}:${index} replays valid distinct pairs and verifies coverage`, () => {
    const context = {sessionId, index};
    const task = sessionTaskFor(sessionId, index);
    const replay = model => replayP111PAlgebraPairsEvidence(task, model, context);
    assert.equal(createHash('sha256').update(JSON.stringify(ordered(task))).digest('hex'), taskHash);
    const correct = example(task);
    assert.ok(inspect(task, correct).correct);
    assert.deepEqual(replay(correct)?.pairs.length, task.need);
    assert.equal(replayP111PAlgebraPairsEvidence(task, correct, {sessionId, index:-1}), null);
    const wrong = structuredClone(correct);
    wrong.answers[0] = '999';
    assert.equal(replay(wrong), null);
    assert.equal(submittedP111PAlgebraPairsEvidence(task, correct, {attempts:[{value:wrong}]}, context), null);
    assert.deepEqual(submittedP111PAlgebraPairsEvidence(task, correct, {attempts:[{value:structuredClone(correct)}]}, context), replay(correct));
    const forged = structuredClone(correct);
    forged.history[0].v = '27';
    assert.equal(replay(forged), null);
    const tampered=structuredClone(correct);
    tampered.board.pairs[0][1]++;
    assert.equal(replay(tampered),null);
  });
}
