import * as bridge from '../dist/learning/phase5/b15-model.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {sessionTaskFor} from '../dist/learning/bridges.js';
import {act, initial, solveSteps} from '../dist/learning/phase5/b17-model.js';
import {P019_SOURCES, p019EquivalentNamesAndPercentBinding, replayP019EquivalentNamesAndPercentEvidence, submittedP019EquivalentNamesAndPercentEvidence} from '../dist/learning/p019-equivalent-names-and-percent-evidence.js';

const fullSteps = task => task.type === 'x-fractionbridge' ? bridge.solveSteps(task) : solveSteps(task);
const wrongField = task => task.type === 'x-fractionbridge' ? ['thousandths','120']
  : task.type === 'x-decimalzoom' ? ['answer','1/100']
  : task.type === 'x-percentkit' ? ['answer','0'] : null;
const wrongSteps = task => {
  const change = wrongField(task);
  return change
    ? fullSteps(task).map(step => step.field === change[0] ? {...step,value:change[1]} : step)
    : [{field:'decimal',value:'0'},{field:'percent',value:'0'},{action:'b17-recall'}];
};
const correctSteps = task => {
  const change = wrongField(task);
  return change ? fullSteps(task).filter(step => step.field === change[0]) : fullSteps(task);
};

const ordered = value => Array.isArray(value) ? value.map(ordered) : value && typeof value === 'object'
  ? Object.fromEntries(Object.keys(value).sort((a,b) => a.localeCompare(b,'en')).map(key => [key, ordered(value[key])]))
  : value;

for (const source of P019_SOURCES) {
  const {sessionId, index} = source;
  const context = {sessionId, index};
  const task = sessionTaskFor(sessionId, index);
  const replay = model => replayP019EquivalentNamesAndPercentEvidence(task, model, context);
  const submit = (model, saved) => submittedP019EquivalentNamesAndPercentEvidence(task, model, {attempts:[{value:saved}]}, context);
  const play = (model, steps) => {
    for (const step of steps) {
      if (step.field) {
        if (step.field.startsWith('answers.')) model.answers[Number(step.field.split('.')[1])] = step.value;
        else model[step.field] = step.value;
      } else (bridge.TYPES.has(task.type) ? bridge.act : act)(task, model, step.action === 'turn-extra' ? 'a30-turn' : step.action, step.data);
    }
  };
  test(`P019 locks ${sessionId}:${index} and rejects stale or modified work`, () => {
    assert.equal(createHash('sha256').update(JSON.stringify(ordered(task))).digest('hex'), source.taskHash);
    assert.ok(p019EquivalentNamesAndPercentBinding(task, context));
    assert.equal(p019EquivalentNamesAndPercentBinding(task, {sessionId,index:-1}), null);
    const model = (bridge.TYPES.has(task.type) ? bridge.initial : initial)(task);
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
