import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {sessionTaskFor} from '../dist/learning/bridges.js';
import {example, inspect} from '../dist/learning/phase5/b20-model.js';
import {P116D_SOURCES, replayP116DFractionFairShareEvidence, submittedP116DFractionFairShareEvidence} from '../dist/learning/p116d-fraction-fair-share-evidence.js';

const ordered = value => Array.isArray(value) ? value.map(ordered) :
  value && typeof value === 'object' ? Object.fromEntries(Object.keys(value).sort((a,b)=>a.localeCompare(b,'en')).map(key=>[key,ordered(value[key])])) : value;

for (const {sessionId, index, taskHash} of P116D_SOURCES) {
  test(`${sessionId}:${index} replays original points, then conserves total during equal sharing`, () => {
    const context = {sessionId, index};
    const task = sessionTaskFor(sessionId, index);
    const replay = model => replayP116DFractionFairShareEvidence(task, model, context);
    assert.equal(createHash('sha256').update(JSON.stringify(ordered(task))).digest('hex'), taskHash);
    const correct = example(task);
    assert.ok(inspect(task, correct).correct);
    assert.deepEqual(replay(correct)?.cups, [4,4,4,4]);
    assert.equal(replayP116DFractionFairShareEvidence(task, correct, {sessionId, index:-1}), null);
    const wrong = structuredClone(correct);
    wrong.answers[0] = '0';
    assert.equal(replay(wrong), null);
    assert.equal(submittedP116DFractionFairShareEvidence(task, correct, {attempts:[{value:wrong}]}, context), null);
    assert.deepEqual(submittedP116DFractionFairShareEvidence(task, correct, {attempts:[{value:structuredClone(correct)}]}, context), replay(correct));
    const forged = structuredClone(correct);
    forged.history[0].f.value='0';
    assert.equal(replay(forged), null);
    const early = structuredClone(correct);
    early.history.unshift(early.history.pop());
    assert.ok(inspect(task,early).correct);
    assert.equal(replay(early),null);
    assert.equal(replay({...correct,answers:['2','0.500000001']}),null);
  });
}
