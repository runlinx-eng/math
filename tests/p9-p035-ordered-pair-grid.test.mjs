import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {sessionTaskFor} from '../dist/learning/bridges.js';
import {act, initial, solveSteps} from '../dist/learning/phase5/b22-model.js';
import {P035_SOURCES, p035OrderedPairGridBinding, replayP035OrderedPairGridEvidence, submittedP035OrderedPairGridEvidence} from '../dist/learning/p035-ordered-pair-grid-evidence.js';

const wrongSteps = task => solveSteps(task).map(step => step.field === 'prob' ? {...step,value:'0'} : step);

const ordered = value => Array.isArray(value) ? value.map(ordered) : value && typeof value === 'object'
  ? Object.fromEntries(Object.keys(value).sort((a,b) => a.localeCompare(b,'en')).map(key => [key, ordered(value[key])]))
  : value;

for (const source of P035_SOURCES) {
  const {sessionId, index} = source;
  const context = {sessionId, index};
  const task = sessionTaskFor(sessionId, index);
  const replay = model => replayP035OrderedPairGridEvidence(task, model, context);
  const submit = (model, saved) => submittedP035OrderedPairGridEvidence(task, model, {attempts:[{value:saved}]}, context);
  const play = (model, steps) => {
    for (const step of steps) {
      if (step.field) {
        if (step.field.startsWith('answers.')) model.answers[Number(step.field.split('.')[1])] = step.value;
        else model[step.field] = step.value;
      } else act(task, model, step.action === 'turn-extra' ? 'a30-turn' : step.action, step.data);
    }
  };
  test(`P035 locks ${sessionId}:${index} and rejects stale or modified work`, () => {
    assert.equal(createHash('sha256').update(JSON.stringify(ordered(task))).digest('hex'), source.taskHash);
    assert.ok(p035OrderedPairGridBinding(task, context));
    assert.equal(p035OrderedPairGridBinding(task, {sessionId,index:-1}), null);
    const model = initial(task);
    play(model, wrongSteps(task));
    const failed = structuredClone(model);
    assert.equal(replay(model), null);
    play(model, solveSteps(task).filter(step => step.field));
    const accepted = replay(model);
    assert.ok(accepted);
    assert.equal(submit(model, failed), null);
    assert.deepEqual(submit(model, structuredClone(model)), accepted);
    const forged = structuredClone(model);
    forged.history = [];
    assert.equal(replay(forged), null);
  });
}
