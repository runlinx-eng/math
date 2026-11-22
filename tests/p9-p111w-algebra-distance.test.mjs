import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {sessionTaskFor} from '../dist/learning/bridges.js';
import {example, inspect} from '../dist/learning/phase5/b35-model.js';
import {P111W_SOURCES, replayP111WAlgebraDistanceEvidence, submittedP111WAlgebraDistanceEvidence} from '../dist/learning/p111w-algebra-distance-evidence.js';

const ordered = value => Array.isArray(value) ? value.map(ordered) :
  value && typeof value === 'object' ? Object.fromEntries(Object.keys(value).sort((a,b)=>a.localeCompare(b,'en')).map(key=>[key,ordered(value[key])])) : value;

for (const {sessionId, index, taskHash} of P111W_SOURCES) {
  test(`${sessionId}:${index} replays each jump, net change and explanation equation`, () => {
    const context = {sessionId, index};
    const task = sessionTaskFor(sessionId, index);
    const replay = model => replayP111WAlgebraDistanceEvidence(task, model, context);
    assert.equal(createHash('sha256').update(JSON.stringify(ordered(task))).digest('hex'), taskHash);
    const correct = example(task);
    assert.ok(inspect(task, correct).correct);
    assert.deepEqual(replay(correct)?.distance, task.target-task.start);
    assert.equal(replayP111WAlgebraDistanceEvidence(task, correct, {sessionId, index:-1}), null);
    const wrong = structuredClone(correct);
    wrong.answers[0] = '999';
    assert.equal(replay(wrong), null);
    assert.equal(submittedP111WAlgebraDistanceEvidence(task, correct, {attempts:[{value:wrong}]}, context), null);
    assert.deepEqual(submittedP111WAlgebraDistanceEvidence(task, correct, {attempts:[{value:structuredClone(correct)}]}, context), replay(correct));
    const forged = structuredClone(correct);
    forged.history[0].i = '27';
    assert.equal(replay(forged), null);
    const tampered=structuredClone(correct);
    tampered.board.position++;
    assert.equal(replay(tampered),null);
  });
}
