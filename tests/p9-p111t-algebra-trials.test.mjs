import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {sessionTaskFor} from '../dist/learning/bridges.js';
import {act, example, initial, inspect} from '../dist/learning/phase5/b35-model.js';
import {P111T_SOURCES, replayP111TAlgebraTrialsEvidence, submittedP111TAlgebraTrialsEvidence} from '../dist/learning/p111t-algebra-trials-evidence.js';

const ordered = value => Array.isArray(value) ? value.map(ordered) :
  value && typeof value === 'object' ? Object.fromEntries(Object.keys(value).sort((a,b)=>a.localeCompare(b,'en')).map(key=>[key,ordered(value[key])])) : value;

for (const {sessionId, index, taskHash} of P111T_SOURCES) {
  test(`${sessionId}:${index} replays substitution and both sides of the equation`, () => {
    const context = {sessionId, index};
    const task = sessionTaskFor(sessionId, index);
    const replay = model => replayP111TAlgebraTrialsEvidence(task, model, context);
    assert.equal(createHash('sha256').update(JSON.stringify(ordered(task))).digest('hex'), taskHash);
    const correct = example(task);
    if (sessionId === 'twostep35') {
      assert.equal(replay(correct),null);
      const draft=initial(task);
      draft.value='10';
      act(task,draft,'a35-try');
      draft.value=correct.value;
      act(task,draft,'a35-try');
      correct.history=draft.history;
      correct.board=draft.board;
    }
    assert.ok(inspect(task, correct).correct);
    assert.deepEqual(replay(correct)?.trial.equal, true);
    assert.equal(replayP111TAlgebraTrialsEvidence(task, correct, {sessionId, index:-1}), null);
    const wrong = structuredClone(correct);
    wrong.value = '999';
    assert.equal(replay(wrong), null);
    assert.equal(submittedP111TAlgebraTrialsEvidence(task, correct, {attempts:[{value:wrong}]}, context), null);
    assert.deepEqual(submittedP111TAlgebraTrialsEvidence(task, correct, {attempts:[{value:structuredClone(correct)}]}, context), replay(correct));
    const forged = structuredClone(correct);
    forged.history.at(-1).v = '999';
    assert.equal(replay(forged), null);
    const tampered=structuredClone(correct);
    tampered.board.trials.at(-1).left = '999';
    assert.equal(replay(tampered),null);
  });
}
