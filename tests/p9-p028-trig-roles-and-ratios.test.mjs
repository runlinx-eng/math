import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {sessionTaskFor} from '../dist/learning/bridges.js';
import {act, initial, solveSteps} from '../dist/learning/phase5/b26-model.js';
import {P028_SOURCES, p028TrigRolesAndRatiosBinding, replayP028TrigRolesAndRatiosEvidence, submittedP028TrigRolesAndRatiosEvidence} from '../dist/learning/p028-trig-roles-and-ratios-evidence.js';

const wrongSteps = task => solveSteps(task).map(step => step.field === 'answers.0' ? {...step,value:task.questions[0].options?.find(([id]) => id !== task.questions[0].value)?.[0] ?? '0'} : step);

const ordered = value => Array.isArray(value) ? value.map(ordered) : value && typeof value === 'object'
  ? Object.fromEntries(Object.keys(value).sort((a,b) => a.localeCompare(b,'en')).map(key => [key, ordered(value[key])]))
  : value;

for (const source of P028_SOURCES) {
  const {sessionId, index} = source;
  const context = {sessionId, index};
  const task = sessionTaskFor(sessionId, index);
  const replay = model => replayP028TrigRolesAndRatiosEvidence(task, model, context);
  const submit = (model, saved) => submittedP028TrigRolesAndRatiosEvidence(task, model, {attempts:[{value:saved}]}, context);
  const play = (model, steps) => {
    for (const step of steps) {
      if (step.field) {
        if (step.field.startsWith('answers.')) model.answers[Number(step.field.split('.')[1])] = step.value;
        else model[step.field] = step.value;
      } else act(task, model, step.action === 'turn-extra' ? 'a30-turn' : step.action, step.data);
    }
  };
  test(`P028 locks ${sessionId}:${index} and rejects stale or modified work`, () => {
    assert.equal(createHash('sha256').update(JSON.stringify(ordered(task))).digest('hex'), source.taskHash);
    assert.ok(p028TrigRolesAndRatiosBinding(task, context));
    assert.equal(p028TrigRolesAndRatiosBinding(task, {sessionId,index:-1}), null);
    const model = initial(task);
    play(model, wrongSteps(task));
    const failed = structuredClone(model);
    assert.equal(replay(model), null);
    play(model, solveSteps(task).filter(step => step.field === 'answers.0'));
    const accepted = replay(model);
    assert.ok(accepted);
    assert.equal(submit(model, failed), null);
    assert.deepEqual(submit(model, structuredClone(model)), accepted);
    const forged = structuredClone(model);
    forged.history = [];
    assert.equal(replay(forged), null);
  });
}
