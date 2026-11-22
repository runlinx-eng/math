import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {sessionTaskFor} from '../dist/learning/bridges.js';
import {act, example, inspect} from '../dist/learning/phase5/b24-model.js';
import {P115P_SOURCES, replayP115PRelativePositionEvidence, submittedP115PRelativePositionEvidence} from '../dist/learning/p115p-relative-position-evidence.js';

const ordered = value => Array.isArray(value) ? value.map(ordered) :
  value && typeof value === 'object' ? Object.fromEntries(Object.keys(value).sort((a,b)=>a.localeCompare(b,'en')).map(key=>[key,ordered(value[key])])) : value;

for (const {sessionId, index, taskHash} of P115P_SOURCES) {
  test(`${sessionId}:${index} replays each location selection and the latest Check`, () => {
    const context = {sessionId, index};
    const task = sessionTaskFor(sessionId, index);
    const replay = model => replayP115PRelativePositionEvidence(task, model, context);
    assert.equal(createHash('sha256').update(JSON.stringify(ordered(task))).digest('hex'), taskHash);
    const correct = example(task);
    assert.ok(inspect(task, correct).correct);
    assert.deepEqual(replay(correct)?.zone, task.want);
    assert.equal(replayP115PRelativePositionEvidence(task, correct, {sessionId, index:-1}), null);
    const wrong = structuredClone(correct);
    wrong.answers[0] = '0';
    assert.equal(replay(wrong), null);
    assert.equal(submittedP115PRelativePositionEvidence(task, correct, {attempts:[{value:wrong}]}, context), null);
    assert.deepEqual(submittedP115PRelativePositionEvidence(task, correct, {attempts:[{value:structuredClone(correct)}]}, context), replay(correct));
    const forged = structuredClone(correct);
    forged.history[0].d.index = '5';
    assert.equal(replay(forged), null);
    act(task, correct, 'p24-reset');
    assert.equal(replay(correct), null);
  });
}
