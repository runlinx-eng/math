import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {sessionTaskFor} from '../dist/learning/bridges.js';
import {act, initial, solveSteps} from '../dist/learning/phase5/b22-model.js';
import {P018_SOURCES, p018ProbabilityObservationsBinding, replayP018ProbabilityObservationsEvidence, submittedP018ProbabilityObservationsEvidence} from '../dist/learning/p018-probability-observations-evidence.js';

const wrongSteps = (task, seed) => solveSteps(task, seed).map(step =>
  step.field === 'answers.0'
    ? {...step,value:task.questions[0].options?.find(([id]) => id !== task.questions[0].value)?.[0] ?? '0'}
    : step
);
const correctSteps = (task, seed) => solveSteps(task, seed).filter(step => step.field === 'answers.0');

const ordered = value => Array.isArray(value) ? value.map(ordered) : value && typeof value === 'object'
  ? Object.fromEntries(Object.keys(value).sort((a,b) => a.localeCompare(b,'en')).map(key => [key, ordered(value[key])]))
  : value;

for (const source of P018_SOURCES) {
  const {sessionId, index} = source;
  const context = {sessionId, index};
  const task = sessionTaskFor(sessionId, index);
  const replay = model => replayP018ProbabilityObservationsEvidence(task, model, context);
  const submit = (model, saved) => submittedP018ProbabilityObservationsEvidence(task, model, {attempts:[{value:saved}]}, context);
  const play = (model, steps) => {
    for (const step of steps) {
      if (step.field) {
        if (step.field.startsWith('answers.')) model.answers[Number(step.field.split('.')[1])] = step.value;
        else model[step.field] = step.value;
      } else act(task, model, step.action === 'turn-extra' ? 'a30-turn' : step.action, step.data);
    }
  };
  test(`P018 locks ${sessionId}:${index} and rejects stale or modified work`, () => {
    assert.equal(createHash('sha256').update(JSON.stringify(ordered(task))).digest('hex'), source.taskHash);
    assert.ok(p018ProbabilityObservationsBinding(task, context));
    assert.equal(p018ProbabilityObservationsBinding(task, {sessionId,index:-1}), null);
    const model = initial(task);
    const nativeSeed = model.seed;
    play(model, wrongSteps(task, nativeSeed));
    const failed = structuredClone(model);
    assert.equal(replay(model), null);
    play(model, correctSteps(task, nativeSeed));
    const accepted = replay(model);
    assert.ok(accepted);
    assert.equal(submit(model, failed), null);
    assert.deepEqual(submit(model, structuredClone(model)), accepted);
    const forged = structuredClone(model);
    forged.history = [];
    assert.equal(replay(forged), null);
  });
}
