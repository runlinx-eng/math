import * as division from '../dist/learning/phase5/b09-model.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {sessionTaskFor} from '../dist/learning/bridges.js';
import {act as compareAction, initial as compareInitial, solveSteps as solveDecimalCompare} from '../dist/learning/phase5/b17-model.js';
import {P025_SOURCES, p025DecimalRemaindersAndPlaceValuesBinding, replayP025DecimalRemaindersAndPlaceValuesEvidence, submittedP025DecimalRemaindersAndPlaceValuesEvidence} from '../dist/learning/p025-decimal-remainders-and-place-values-evidence.js';

const fullSteps = task => {
  if (task.type !== 'x-decimalmachine') return solveDecimalCompare(task);
  const steps = [], seen = new Set();
  let remainder = task.n % task.d;
  while (remainder && !seen.has(remainder)) {
    seen.add(remainder);
    const next = remainder * 10;
    remainder = next % task.d;
    steps.push({field:'digit',value:String(Math.floor(next/task.d))},
      {field:'remainder',value:String(remainder)}, {action:'decimal-next'});
  }
  return [...steps, {field:'kind',value:remainder?'repeats':'ends'}, {field:'fraction',value:task.n+'/'+task.d}];
};
const wrongSteps = task => task.type === 'x-decimalmachine'
  ? fullSteps(task).map(step => step.field === 'kind' ? {...step,value:'irrational'} : step)
  : [{field:'prediction',value:'<'},{action:'b17-predict-compare'}];
const correctSteps = task => task.type === 'x-decimalmachine'
  ? fullSteps(task).filter(step => ['kind','fraction'].includes(step.field))
  : fullSteps(task).slice(2);

const ordered = value => Array.isArray(value) ? value.map(ordered) : value && typeof value === 'object'
  ? Object.fromEntries(Object.keys(value).sort((a,b) => a.localeCompare(b,'en')).map(key => [key, ordered(value[key])]))
  : value;

for (const source of P025_SOURCES) {
  const {sessionId, index} = source;
  const context = {sessionId, index};
  const task = sessionTaskFor(sessionId, index);
  const replay = model => replayP025DecimalRemaindersAndPlaceValuesEvidence(task, model, context);
  const submit = (model, saved) => submittedP025DecimalRemaindersAndPlaceValuesEvidence(task, model, {attempts:[{value:saved}]}, context);
  const play = (model, steps) => {
    for (const step of steps) {
      if (step.field) {
        if (step.field.startsWith('answers.')) model.answers[Number(step.field.split('.')[1])] = step.value;
        else model[step.field] = step.value;
      } else (division.TYPES.has(task.type) ? division.act : compareAction)(task, model, step.action, step.data);
    }
  };
  test(`P025 locks ${sessionId}:${index} and rejects stale or modified work`, () => {
    assert.equal(createHash('sha256').update(JSON.stringify(ordered(task))).digest('hex'), source.taskHash);
    assert.ok(p025DecimalRemaindersAndPlaceValuesBinding(task, context));
    assert.equal(p025DecimalRemaindersAndPlaceValuesBinding(task, {sessionId,index:-1}), null);
    const model = (division.TYPES.has(task.type) ? division.initial : compareInitial)(task);
    play(model, wrongSteps(task));
    const failed = structuredClone(model);
    assert.equal(replay(model), null);
    play(model, correctSteps(task));
    const accepted = replay(model);
    assert.ok(accepted);
    assert.equal(submit(model, failed), null);
    assert.deepEqual(submit(model, structuredClone(model)), accepted);
    const forged = structuredClone(model);
    forged.history = [];
    assert.equal(replay(forged), null);
  });
}
