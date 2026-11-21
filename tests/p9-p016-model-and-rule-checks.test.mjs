import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {sessionTaskFor} from '../dist/learning/bridges.js';
import * as b36 from '../dist/learning/phase5/b36-model.js';
import * as b13 from '../dist/learning/phase5/b13-model.js';
import * as b22 from '../dist/learning/phase5/b22-model.js';
import * as b23 from '../dist/learning/phase5/b23-model.js';
import * as b29 from '../dist/learning/phase5/b29-model.js';
import * as b34 from '../dist/learning/phase5/b34-model.js';
import * as b35 from '../dist/learning/phase5/b35-model.js';
import {P016_SOURCES, p016ModelAndRuleChecksBinding, replayP016ModelAndRuleChecksEvidence, submittedP016ModelAndRuleChecksEvidence} from '../dist/learning/p016-model-and-rule-checks-evidence.js';

const differences = task => {
  if (task.type==='x-divreverse') return ['result','4'];
  if (task.type.startsWith('x-m29-')) return ['answer','0'];
  return ['answers.0',task.questions?.[0]?.options?.find(([id])=>id!==task.questions[0].value)?.[0] ?? '0'];
};
const wrongSteps = (task,model) => task.type==='x-a35-try'
  ? [{field:'value',value:'354'},{action:'a35-try'}]
  : model.solveSteps(task).map(step => step.field===differences(task)[0]?{...step,value:differences(task)[1]}:step);
const correctSteps = (task,model) => model.solveSteps(task).filter(step =>
  task.type==='x-a35-try' || step.field===differences(task)[0]);

const ordered = value => Array.isArray(value) ? value.map(ordered) : value && typeof value === 'object'
  ? Object.fromEntries(Object.keys(value).sort((a,b) => a.localeCompare(b,'en')).map(key => [key, ordered(value[key])]))
  : value;

for (const source of P016_SOURCES) {
  const {sessionId, index} = source;
  const context = {sessionId, index};
  const task = sessionTaskFor(sessionId, index);
  const modelForTask = [b36, b13, b22, b23, b29, b34, b35].find(owner => owner.TYPES.has(task.type));
  const {act, initial} = modelForTask;
  const replay = model => replayP016ModelAndRuleChecksEvidence(task, model, context);
  const submit = (model, saved) => submittedP016ModelAndRuleChecksEvidence(task, model, {attempts:[{value:saved}]}, context);
  const play = (model, steps) => {
    for (const step of steps) {
      if (step.field) {
        if (step.field.startsWith('answers.')) model.answers[Number(step.field.split('.')[1])] = step.value;
        else model[step.field] = step.value;
      } else act(task, model, step.action === 'turn-extra' ? 'a30-turn' : step.action, step.data);
    }
  };
  test(`P016 locks ${sessionId}:${index} and rejects stale or modified work`, () => {
    assert.equal(createHash('sha256').update(JSON.stringify(ordered(task))).digest('hex'), source.taskHash);
    assert.ok(p016ModelAndRuleChecksBinding(task, context));
    assert.equal(p016ModelAndRuleChecksBinding(task, {sessionId,index:-1}), null);
    const model = initial(task);
    play(model, wrongSteps(task,modelForTask));
    const failed = structuredClone(model);
    assert.equal(replay(model), null);
    play(model, correctSteps(task,modelForTask));
    const accepted = replay(model);
    assert.ok(accepted);
    assert.equal(submit(model, failed), null);
    assert.deepEqual(submit(model, structuredClone(model)), accepted);
    const forged = structuredClone(model);
    forged.history = [];
    assert.equal(replay(forged), null);
  });
}
