import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {sessionTaskFor} from '../dist/learning/bridges.js';
import {act, example, initial, inspect} from '../dist/learning/phase5/b39-model.js';
import {P104M_SOURCES, replayP104MCalculatorMethodEvidence, submittedP104MCalculatorMethodEvidence} from '../dist/learning/p104m-calculator-method-evidence.js';

const {ensureB39Ready}=await import('../dist/learning/phase4/async-batches.js');
await ensureB39Ready();
const ordered = value => Array.isArray(value) ? value.map(ordered) :
  value && typeof value === 'object' ? Object.fromEntries(Object.keys(value).sort((a,b)=>a.localeCompare(b,'en')).map(key=>[key,ordered(value[key])])) : value;

for (const {sessionId, index, taskHash} of P104M_SOURCES) {
  test(`${sessionId}:${index} only certifies a real local calculator run`, () => {
    const context = {sessionId, index};
    const task = sessionTaskFor(sessionId, index);
    const replay = model => replayP104MCalculatorMethodEvidence(task, model, context);
    assert.equal(createHash('sha256').update(JSON.stringify(ordered(task))).digest('hex'), taskHash);
    const mental = example(task);
    assert.ok(inspect(task,mental).correct);
    assert.equal(replay(mental),null);
    assert.equal(replay({...mental,method:'written'}),null);
    const correct=initial(task);
    correct.method='calculator';
    correct.entry=task.operands.join(task.operator);
    correct.answer=String(task.result);
    assert.equal(replay(correct),null);
    act(task,correct,'s39-run');
    assert.ok(inspect(task, correct).correct);
    assert.deepEqual(replay(correct)?.result, task.result);
    assert.equal(replayP104MCalculatorMethodEvidence(task, correct, {sessionId, index:-1}), null);
    const wrong = structuredClone(correct);
    wrong.answer = '999';
    assert.equal(replay(wrong), null);
    assert.equal(submittedP104MCalculatorMethodEvidence(task, correct, {attempts:[{value:wrong}]}, context), null);
    assert.deepEqual(submittedP104MCalculatorMethodEvidence(task, correct, {attempts:[{value:structuredClone(correct)}]}, context), replay(correct));
    const forged = structuredClone(correct);
    forged.history[0].c='mental';
    assert.equal(replay(forged), null);
    const tampered=structuredClone(correct);
    tampered.board.runs.at(-1).value++;
    assert.equal(replay(tampered),null);
  });
}
