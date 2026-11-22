import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {sessionTaskFor} from '../dist/learning/bridges.js';
import {act, example, initial, inspect} from '../dist/learning/phase5/b10-model.js';
import {P087S_SOURCES, replayP087SSplitbenchEvidence, submittedP087SSplitbenchEvidence} from '../dist/learning/p087s-splitbench-evidence.js';

const ordered = value => Array.isArray(value) ? value.map(ordered) :
  value && typeof value === 'object' ? Object.fromEntries(Object.keys(value).sort((a,b)=>a.localeCompare(b,'en')).map(key=>[key,ordered(value[key])])) : value;

for (const {sessionId, index, taskHash} of P087S_SOURCES) {
  test(`${sessionId}:${index} replays distinct saved partitions and requires a new Check`, () => {
    const context = {sessionId, index};
    const task = sessionTaskFor(sessionId, index);
    const replay = model => replayP087SSplitbenchEvidence(task, model, context);
    assert.equal(createHash('sha256').update(JSON.stringify(ordered(task))).digest('hex'), taskHash);
    const wrong = initial(task);
    wrong.equation = '1+1=2';
    act(task, wrong, 'split-save');
    assert.equal(replay(wrong), null);
    const correct = example(task);
    assert.ok(inspect(task, correct).correct);
    correct.history.unshift(...wrong.history);
    assert.ok(replay(correct));
    assert.equal(replayP087SSplitbenchEvidence(task, correct, {sessionId, index:-1}), null);
    assert.equal(submittedP087SSplitbenchEvidence(task, correct, {attempts:[{value:wrong}]}, context), null);
    assert.deepEqual(submittedP087SSplitbenchEvidence(task, correct, {attempts:[{value:structuredClone(correct)}]}, context), replay(correct));
    const forged = structuredClone(correct);
    forged.history[1].b--;
    assert.equal(replay(forged), null);
    const duplicate = structuredClone(correct);
    duplicate.history[2] = duplicate.history[1];
    assert.equal(replay(duplicate), null);
    const substituted = structuredClone(correct);
    substituted.saved[0].eq = '1+1=2';
    assert.equal(replay(substituted), null);
  });
}
