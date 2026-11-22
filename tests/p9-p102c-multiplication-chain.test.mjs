import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {sessionTaskFor} from '../dist/learning/bridges.js';
import {act, example, inspect} from '../dist/learning/phase5/b13-model.js';
import {P102C_SOURCES, replayP102CMultiplicationChainEvidence, submittedP102CMultiplicationChainEvidence} from '../dist/learning/p102c-multiplication-chain-evidence.js';

const ordered = value => Array.isArray(value) ? value.map(ordered) :
  value && typeof value === 'object' ? Object.fromEntries(Object.keys(value).sort((a,b)=>a.localeCompare(b,'en')).map(key=>[key,ordered(value[key])])) : value;

for (const {sessionId, index, taskHash} of P102C_SOURCES) {
  test(`${sessionId}:${index} replays merges without reusing an original factor`, () => {
    const context = {sessionId, index};
    const task = sessionTaskFor(sessionId, index);
    const replay = model => replayP102CMultiplicationChainEvidence(task, model, context);
    assert.equal(createHash('sha256').update(JSON.stringify(ordered(task))).digest('hex'), taskHash);
    const correct = example(task);
    assert.ok(inspect(task, correct).correct);
    assert.deepEqual(replay(correct)?.products.at(-1), task.values.reduce((a,b)=>a*b,1));
    assert.equal(replayP102CMultiplicationChainEvidence(task, correct, {sessionId, index:-1}), null);
    const wrong = structuredClone(correct);
    act(task, wrong, 'b13-reset');
    assert.equal(replay(wrong), null);
    assert.equal(submittedP102CMultiplicationChainEvidence(task, correct, {attempts:[{value:wrong}]}, context), null);
    assert.deepEqual(submittedP102CMultiplicationChainEvidence(task, correct, {attempts:[{value:structuredClone(correct)}]}, context), replay(correct));
    const forged = structuredClone(correct);
    forged.history[0].data.index = 5;
    assert.equal(replay(forged), null);
    act(task, correct, 'b13-chain-undo');
    assert.equal(replay(correct), null);
    act(task, correct, 'b13-reset');
    assert.equal(replay(correct), null);
  });
}
