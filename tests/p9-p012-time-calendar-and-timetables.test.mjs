import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {sessionTaskFor} from '../dist/learning/bridges.js';
import * as b32 from '../dist/learning/phase5/b32-model.js';
import * as b20 from '../dist/learning/phase5/b20-model.js';
import * as b29 from '../dist/learning/phase5/b29-model.js';
import {P012_SOURCES, p012TimeCalendarAndTimetablesBinding, replayP012TimeCalendarAndTimetablesEvidence, submittedP012TimeCalendarAndTimetablesEvidence} from '../dist/learning/p012-time-calendar-and-timetables-evidence.js';

const mistakenField = task => task.type==='x-m29-clock' ? ['answer','00:00']
  : task.type==='x-timetable' && task.mode==='read' ? ['answers.0','09:00'] : ['answers.0','0'];
const wrongSteps=(task,model)=> {
  if (task.type==='x-t32-order') return model.solveSteps(task).reverse();
  const [field,value]=mistakenField(task);
  return model.solveSteps(task).map(step=>step.field===field?{...step,value}:step);
};
const correctSteps=(task,model)=>task.type==='x-t32-order'
  ? [{action:'t32-clear'},...model.solveSteps(task)]
  : model.solveSteps(task).filter(step=>step.field===mistakenField(task)[0]);

const ordered = value => Array.isArray(value) ? value.map(ordered) : value && typeof value === 'object'
  ? Object.fromEntries(Object.keys(value).sort((a,b) => a.localeCompare(b,'en')).map(key => [key, ordered(value[key])]))
  : value;

for (const source of P012_SOURCES) {
  const {sessionId, index} = source;
  const context = {sessionId, index};
  const task = sessionTaskFor(sessionId, index);
  const modelForTask = [b32, b20, b29].find(owner => owner.TYPES.has(task.type));
  const {act, initial} = modelForTask;
  const replay = model => replayP012TimeCalendarAndTimetablesEvidence(task, model, context);
  const submit = (model, saved) => submittedP012TimeCalendarAndTimetablesEvidence(task, model, {attempts:[{value:saved}]}, context);
  const play = (model, steps) => {
    for (const step of steps) {
      if (step.field) {
        if (step.field.startsWith('answers.')) model.answers[Number(step.field.split('.')[1])] = step.value;
        else model[step.field] = step.value;
      } else act(task, model, step.action === 'turn-extra' ? 'a30-turn' : step.action, step.data);
    }
  };
  test(`P012 locks ${sessionId}:${index} and rejects stale or modified work`, () => {
    assert.equal(createHash('sha256').update(JSON.stringify(ordered(task))).digest('hex'), source.taskHash);
    assert.ok(p012TimeCalendarAndTimetablesBinding(task, context));
    assert.equal(p012TimeCalendarAndTimetablesBinding(task, {sessionId,index:-1}), null);
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
