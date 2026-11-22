import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {sessionTaskFor} from '../dist/learning/bridges.js';
import {act, example, inspect} from '../dist/learning/phase5/b15-model.js';
import {P090S_SOURCES, replayP090SSignedMulDivEvidence, submittedP090SSignedMulDivEvidence} from '../dist/learning/p090s-signed-mul-div-evidence.js';

const ordered = value => Array.isArray(value) ? value.map(ordered) :
  value && typeof value === 'object' ? Object.fromEntries(Object.keys(value).sort((a,b)=>a.localeCompare(b,'en')).map(key=>[key,ordered(value[key])])) : value;

for (const {sessionId, index, taskHash} of P090S_SOURCES) {
  test(`${sessionId}:${index} replays signed multiplication and division cases`, () => {
    const context = {sessionId, index};
    const task = sessionTaskFor(sessionId, index);
    const replay = model => replayP090SSignedMulDivEvidence(task, model, context);
    assert.equal(createHash('sha256').update(JSON.stringify(ordered(task))).digest('hex'), taskHash);
    const correct = example(task);
    assert.ok(inspect(task, correct).correct);
    assert.deepEqual(replay(correct)?.rows.length, task.cases.length);
    assert.equal(replayP090SSignedMulDivEvidence(task, correct, {sessionId, index:-1}), null);
    const wrong = structuredClone(correct);
    act(task,wrong,'b15-reset');
    assert.equal(replay(wrong), null);
    assert.equal(submittedP090SSignedMulDivEvidence(task, correct, {attempts:[{value:wrong}]}, context), null);
    assert.deepEqual(submittedP090SSignedMulDivEvidence(task, correct, {attempts:[{value:structuredClone(correct)}]}, context), replay(correct));
    const forged = structuredClone(correct);
    forged.history.at(-1).data.fields.result = '999';
    assert.equal(replay(forged), null);
    const tampered=structuredClone(correct);
    tampered.board.rows.at(-1).value=999;
    assert.equal(replay(tampered),null);
  });
}
