import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {sessionTaskFor} from '../dist/learning/bridges.js';
import * as b12 from '../dist/learning/phase5/b12-model.js';
import * as b15 from '../dist/learning/phase5/b15-model.js';
import {P010_SOURCES, p010StoryOperationPlansBinding, replayP010StoryOperationPlansEvidence, submittedP010StoryOperationPlansEvidence} from '../dist/learning/p010-story-operation-plans-evidence.js';

const equalNumbers = task => task.type==='x-storychain' && task.values.join(',')==='2,2,3';
const wrongSteps=(task,model)=>model.solveSteps(task).map(step=>{
  if (equalNumbers(task)) return step.field==='operator' && step.value==='*' ? {...step,value:'+'} : step;
  return step.field==='answer' ? {...step,value:'0'} : step;
});
const correctSteps=(task,model)=>equalNumbers(task)
  ? [{action:'b15-back'},{action:'b15-back'},...model.solveSteps(task)]
  : model.solveSteps(task).filter(step=>step.field==='answer');

const ordered = value => Array.isArray(value) ? value.map(ordered) : value && typeof value === 'object'
  ? Object.fromEntries(Object.keys(value).sort((a,b) => a.localeCompare(b,'en')).map(key => [key, ordered(value[key])]))
  : value;

for (const source of P010_SOURCES) {
  const {sessionId, index} = source;
  const context = {sessionId, index};
  const task = sessionTaskFor(sessionId, index);
  const modelForTask = [b12, b15].find(owner => owner.TYPES.has(task.type));
  const {act, initial} = modelForTask;
  const replay = model => replayP010StoryOperationPlansEvidence(task, model, context);
  const submit = (model, saved) => submittedP010StoryOperationPlansEvidence(task, model, {attempts:[{value:saved}]}, context);
  const play = (model, steps) => {
    for (const step of steps) {
      if (step.field) {
        if (step.field.startsWith('lengths.')) model.lengths[Number(step.field.split('.')[1])] = Number(step.value);
        else if (step.field.startsWith('answers.')) model.answers[Number(step.field.split('.')[1])] = step.value;
        else model[step.field] = step.value;
      } else act(task, model, step.action === 'turn-extra' ? 'a30-turn' : step.action, step.data);
    }
  };
  test(`P010 locks ${sessionId}:${index} and rejects stale or modified work`, () => {
    assert.equal(createHash('sha256').update(JSON.stringify(ordered(task))).digest('hex'), source.taskHash);
    assert.ok(p010StoryOperationPlansBinding(task, context));
    assert.equal(p010StoryOperationPlansBinding(task, {sessionId,index:-1}), null);
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
