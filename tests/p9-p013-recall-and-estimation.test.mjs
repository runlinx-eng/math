import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {sessionTaskFor} from '../dist/learning/bridges.js';
import * as b15 from '../dist/learning/phase5/b15-model.js';
import * as b10 from '../dist/learning/phase5/b10-model.js';
import * as b21 from '../dist/learning/phase5/b21-model.js';
import {P013_SOURCES, p013RecallAndEstimationBinding, replayP013RecallAndEstimationEvidence, submittedP013RecallAndEstimationEvidence} from '../dist/learning/p013-recall-and-estimation-evidence.js';

const recallSteps=task=>task.cases.flatMap(({a,b,op})=>[
  {field:'answer',value:String(a+(op==='+'?b:-b))},{action:'recall-save'}
]);
const wrongSteps=(task,model)=>{
  if (task.type==='x-recallbench') return [{action:'recall-help'},{field:'answer',value:'999'},{action:'recall-save'}];
  const field = task.type==='x-estimatepad' ? 'proof' : 'precision';
  const value = task.type==='x-estimatepad' ? 'proof' : 'exact';
  return model.solveSteps(task).map(step=>step.field===field?{...step,value}:step);
};
const correctSteps=(task,model)=>{
  if (task.type==='x-recallbench') return recallSteps(task);
  if (task.type==='x-estimatepad') return [{field:'proof',value:'not-proof'}];
  return [{field:'precision',value:'approx'},{action:'b21-estimate'}];
};

const ordered = value => Array.isArray(value) ? value.map(ordered) : value && typeof value === 'object'
  ? Object.fromEntries(Object.keys(value).sort((a,b) => a.localeCompare(b,'en')).map(key => [key, ordered(value[key])]))
  : value;

for (const source of P013_SOURCES) {
  const {sessionId, index} = source;
  const context = {sessionId, index};
  const task = sessionTaskFor(sessionId, index);
  const modelForTask = [b15, b10, b21].find(owner => owner.TYPES.has(task.type));
  const {act, initial} = modelForTask;
  const replay = model => replayP013RecallAndEstimationEvidence(task, model, context);
  const submit = (model, saved) => submittedP013RecallAndEstimationEvidence(task, model, {attempts:[{value:saved}]}, context);
  const play = (model, steps) => {
    for (const step of steps) {
      if (step.field) {
        if (step.field.startsWith('answers.')) model.answers[Number(step.field.split('.')[1])] = step.value;
        else model[step.field] = step.value;
      } else act(task, model, step.action === 'turn-extra' ? 'a30-turn' : step.action, step.data);
    }
  };
  test(`P013 locks ${sessionId}:${index} and rejects stale or modified work`, () => {
    assert.equal(createHash('sha256').update(JSON.stringify(ordered(task))).digest('hex'), source.taskHash);
    assert.ok(p013RecallAndEstimationBinding(task, context));
    assert.equal(p013RecallAndEstimationBinding(task, {sessionId,index:-1}), null);
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
