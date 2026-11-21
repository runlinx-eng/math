import * as bars from '../dist/learning/phase5/b15-model.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {sessionTaskFor} from '../dist/learning/bridges.js';
import {act, initial, solveSteps as solvePortion} from '../dist/learning/phase5/b16-model.js';
import {P014_SOURCES, p014MultiplicativeBarsBinding, replayP014MultiplicativeBarsEvidence, submittedP014MultiplicativeBarsEvidence} from '../dist/learning/p014-multiplicative-bars-evidence.js';

const fullSteps = task => task.type === 'x-comparebars' ? bars.solveSteps(task) : solvePortion(task);
const wrongSteps = task => fullSteps(task).map(step=>step.field==='answer'?{...step,value:'0'}:step);
const correctSteps = task => fullSteps(task).filter(step=>step.field==='answer');

const ordered = value => Array.isArray(value) ? value.map(ordered) : value && typeof value === 'object'
  ? Object.fromEntries(Object.keys(value).sort((a,b) => a.localeCompare(b,'en')).map(key => [key, ordered(value[key])]))
  : value;

for (const source of P014_SOURCES) {
  const {sessionId, index} = source;
  const context = {sessionId, index};
  const task = sessionTaskFor(sessionId, index);
  const replay = model => replayP014MultiplicativeBarsEvidence(task, model, context);
  const submit = (model, saved) => submittedP014MultiplicativeBarsEvidence(task, model, {attempts:[{value:saved}]}, context);
  const play = (model, steps) => {
    for (const step of steps) {
      if (step.field) {
        if (step.field.startsWith('answers.')) model.answers[Number(step.field.split('.')[1])] = step.value;
        else model[step.field] = step.value;
      } else (bars.TYPES.has(task.type) ? bars.act : act)(task, model, step.action === 'turn-extra' ? 'a30-turn' : step.action, step.data);
    }
  };
  test(`P014 locks ${sessionId}:${index} and rejects stale or modified work`, () => {
    assert.equal(createHash('sha256').update(JSON.stringify(ordered(task))).digest('hex'), source.taskHash);
    assert.ok(p014MultiplicativeBarsBinding(task, context));
    assert.equal(p014MultiplicativeBarsBinding(task, {sessionId,index:-1}), null);
    const model = (bars.TYPES.has(task.type) ? bars.initial : initial)(task);
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
