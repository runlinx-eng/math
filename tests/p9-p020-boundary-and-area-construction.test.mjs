import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {sessionTaskFor} from '../dist/learning/bridges.js';
import {act, initial, solveSteps} from '../dist/learning/phase5/b30-model.js';
import {P020_SOURCES, p020BoundaryAndAreaConstructionBinding, replayP020BoundaryAndAreaConstructionEvidence, submittedP020BoundaryAndAreaConstructionEvidence} from '../dist/learning/p020-boundary-and-area-construction-evidence.js';

const answerField = task => task.type === 'x-a30-outline' ? 'answer' : 'area';
const wrongSteps = task => solveSteps(task).map(step =>
  step.field === answerField(task) ? {...step,value:'0'} : step
);
const correctSteps = task => solveSteps(task).filter(step => step.field === answerField(task));

const ordered = value => Array.isArray(value) ? value.map(ordered) : value && typeof value === 'object'
  ? Object.fromEntries(Object.keys(value).sort((a,b) => a.localeCompare(b,'en')).map(key => [key, ordered(value[key])]))
  : value;

for (const source of P020_SOURCES) {
  const {sessionId, index} = source;
  const context = {sessionId, index};
  const task = sessionTaskFor(sessionId, index);
  const replay = model => replayP020BoundaryAndAreaConstructionEvidence(task, model, context);
  const submit = (model, saved) => submittedP020BoundaryAndAreaConstructionEvidence(task, model, {attempts:[{value:saved}]}, context);
  const play = (model, steps) => {
    for (const step of steps) {
      if (step.field) {
        if (step.field.startsWith('answers.')) model.answers[Number(step.field.split('.')[1])] = step.value;
        else model[step.field] = step.value;
      } else act(task, model, step.action === 'turn-extra' ? 'a30-turn' : step.action, step.data);
    }
  };
  test(`P020 locks ${sessionId}:${index} and rejects stale or modified work`, () => {
    assert.equal(createHash('sha256').update(JSON.stringify(ordered(task))).digest('hex'), source.taskHash);
    assert.ok(p020BoundaryAndAreaConstructionBinding(task, context));
    assert.equal(p020BoundaryAndAreaConstructionBinding(task, {sessionId,index:-1}), null);
    const model = initial(task);
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
