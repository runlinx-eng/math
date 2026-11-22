import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {sessionTaskFor} from '../dist/learning/bridges.js';
import {example, inspect} from '../dist/learning/phase5/b39-model.js';
import {P104C_SOURCES, replayP104CCalculatorCheckEvidence, submittedP104CCalculatorCheckEvidence} from '../dist/learning/p104c-calculator-check-evidence.js';

const {ensureB39Ready}=await import('../dist/learning/phase4/async-batches.js');
await ensureB39Ready();
const ordered = value => Array.isArray(value) ? value.map(ordered) :
  value && typeof value === 'object' ? Object.fromEntries(Object.keys(value).sort((a,b)=>a.localeCompare(b,'en')).map(key=>[key,ordered(value[key])])) : value;

for (const {sessionId, index, taskHash} of P104C_SOURCES) {
  test(`${sessionId}:${index} replays a recorded estimate and exact calculator entry`, () => {
    const context = {sessionId, index};
    const task = sessionTaskFor(sessionId, index);
    const replay = model => replayP104CCalculatorCheckEvidence(task, model, context);
    assert.equal(createHash('sha256').update(JSON.stringify(ordered(task))).digest('hex'), taskHash);
    const correct = example(task);
    assert.ok(inspect(task, correct).correct);
    assert.deepEqual(replay(correct)?.result, task.result);
    assert.equal(replayP104CCalculatorCheckEvidence(task, correct, {sessionId, index:-1}), null);
    const wrong = structuredClone(correct);
    wrong.answer = '999';
    assert.equal(replay(wrong), null);
    assert.equal(submittedP104CCalculatorCheckEvidence(task, correct, {attempts:[{value:wrong}]}, context), null);
    assert.deepEqual(submittedP104CCalculatorCheckEvidence(task, correct, {attempts:[{value:structuredClone(correct)}]}, context), replay(correct));
    const forged = structuredClone(correct);
    forged.history.reverse();
    assert.equal(replay(forged), null);
    const tampered=structuredClone(correct);
    tampered.board.runs.at(-1).value++;
    assert.equal(replay(tampered),null);
  });
}
