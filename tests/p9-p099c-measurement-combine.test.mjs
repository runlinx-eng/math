import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {sessionTaskFor} from '../dist/learning/bridges.js';
import {example, inspect} from '../dist/learning/phase5/b29-model.js';
import {P099C_SOURCES, replayP099CMeasurementCombineEvidence, submittedP099CMeasurementCombineEvidence} from '../dist/learning/p099c-measurement-combine-evidence.js';

const ordered = value => Array.isArray(value) ? value.map(ordered) :
  value && typeof value === 'object' ? Object.fromEntries(Object.keys(value).sort((a,b)=>a.localeCompare(b,'en')).map(key=>[key,ordered(value[key])])) : value;

for (const {sessionId, index, taskHash} of P099C_SOURCES) {
  test(`${sessionId}:${index} replays each selected quantity and exact sum`, () => {
    const context = {sessionId, index};
    const task = sessionTaskFor(sessionId, index);
    const replay = model => replayP099CMeasurementCombineEvidence(task, model, context);
    assert.equal(createHash('sha256').update(JSON.stringify(ordered(task))).digest('hex'), taskHash);
    const correct = example(task);
    assert.ok(inspect(task, correct).correct);
    assert.deepEqual(replay(correct)?.total, task.parts.reduce((a,b)=>a+b,0));
    assert.equal(replayP099CMeasurementCombineEvidence(task, correct, {sessionId, index:-1}), null);
    const wrong = structuredClone(correct);
    wrong.answer = '0';
    assert.equal(replay(wrong), null);
    assert.equal(submittedP099CMeasurementCombineEvidence(task, correct, {attempts:[{value:wrong}]}, context), null);
    assert.deepEqual(submittedP099CMeasurementCombineEvidence(task, correct, {attempts:[{value:structuredClone(correct)}]}, context), replay(correct));
    const forged = structuredClone(correct);
    forged.history[0].i = '27';
    assert.equal(replay(forged), null);
    assert.equal(replay({...correct,unit:'kg'}),null);
  });
}
