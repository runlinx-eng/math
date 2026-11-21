import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {sessionTaskFor} from '../dist/learning/bridges.js';
import * as b33 from '../dist/learning/phase5/b33-model.js';
import {P011_SOURCES, p011MeasurementModelsBinding, replayP011MeasurementModelsEvidence, submittedP011MeasurementModelsEvidence} from '../dist/learning/p011-measurement-models-evidence.js';

const wrongAnswer = task => task.questions[0].options
  ?.find(([id])=>id!==task.questions[0].value)?.[0] ?? '0';
const wrongSteps = (task,model) => {
  const steps=model.solveSteps(task);
  if (task.questions.length) return steps.map(step=>step.field==='answers.0'?{...step,value:wrongAnswer(task)}:step);
  const other=task.groups.find(group=>group.id!==task.cards[0].group).id;
  return [...steps,{action:'m33-group',data:{index:other}},{action:'m33-place',data:{index:0}}];
};
const correctSteps = (task,model) => task.questions.length
  ? model.solveSteps(task).filter(step=>step.field==='answers.0')
  : [{action:'m33-group',data:{index:task.cards[0].group}},{action:'m33-place',data:{index:0}}];

const ordered = value => Array.isArray(value) ? value.map(ordered) : value && typeof value === 'object'
  ? Object.fromEntries(Object.keys(value).sort((a,b) => a.localeCompare(b,'en')).map(key => [key, ordered(value[key])]))
  : value;

for (const source of P011_SOURCES) {
  const {sessionId, index} = source;
  const context = {sessionId, index};
  const task = sessionTaskFor(sessionId, index);
  const modelForTask = [b33].find(owner => owner.TYPES.has(task.type));
  const {act, initial} = modelForTask;
  const replay = model => replayP011MeasurementModelsEvidence(task, model, context);
  const submit = (model, saved) => submittedP011MeasurementModelsEvidence(task, model, {attempts:[{value:saved}]}, context);
  const play = (model, steps) => {
    for (const step of steps) {
      if (step.field) {
        if (step.field.startsWith('answers.')) model.answers[Number(step.field.split('.')[1])] = step.value;
        else model[step.field] = step.value;
      } else act(task, model, step.action === 'turn-extra' ? 'a30-turn' : step.action, step.data);
    }
  };
  test(`P011 locks ${sessionId}:${index} and rejects stale or modified work`, () => {
    assert.equal(createHash('sha256').update(JSON.stringify(ordered(task))).digest('hex'), source.taskHash);
    assert.ok(p011MeasurementModelsBinding(task, context));
    assert.equal(p011MeasurementModelsBinding(task, {sessionId,index:-1}), null);
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
