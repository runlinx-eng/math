import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {sessionTaskFor} from '../dist/learning/bridges.js';
import {act, example, initial, inspect} from '../dist/learning/phase5/b13-model.js';
import {P102F_SOURCES, replayP102FMultiplicationFactsEvidence, submittedP102FMultiplicationFactsEvidence} from '../dist/learning/p102f-multiplication-facts-evidence.js';

const ordered = value => Array.isArray(value) ? value.map(ordered) :
  value && typeof value === 'object' ? Object.fromEntries(Object.keys(value).sort((a,b)=>a.localeCompare(b,'en')).map(key=>[key,ordered(value[key])])) : value;

for (const {sessionId, index, taskHash} of P102F_SOURCES) {
  test(`${sessionId}:${index} replays every saved arithmetic or parity case`, () => {
    const context = {sessionId, index};
    const task = sessionTaskFor(sessionId, index);
    const replay = model => replayP102FMultiplicationFactsEvidence(task, model, context);
    assert.equal(createHash('sha256').update(JSON.stringify(ordered(task))).digest('hex'), taskHash);
    const correct = example(task);
    assert.ok(inspect(task, correct).correct);
    assert.deepEqual(replay(correct)?.cases.length, task.cases.length);
    assert.equal(replayP102FMultiplicationFactsEvidence(task, correct, {sessionId, index:-1}), null);
    const wrong = structuredClone(correct);
    act(task, wrong, 'b13-reset');
    assert.equal(replay(wrong), null);
    assert.equal(submittedP102FMultiplicationFactsEvidence(task, correct, {attempts:[{value:wrong}]}, context), null);
    assert.deepEqual(submittedP102FMultiplicationFactsEvidence(task, correct, {attempts:[{value:structuredClone(correct)}]}, context), replay(correct));
    const forged = structuredClone(correct);
    forged.history[0].data.answer = '';
    assert.equal(replay(forged), null);
    const assisted = initial(task);
    act(task, assisted, 'b13-fact-help');
    for (const event of correct.history) {
      assisted.answer = event.data.answer;
      act(task, assisted, event.action);
    }
    assert.equal(replay(assisted)?.cases[0].help, true);
    act(task, correct, 'b13-reset');
    assert.equal(replay(correct), null);
  });
}
