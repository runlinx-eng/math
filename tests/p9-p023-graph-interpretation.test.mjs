import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {sessionTaskFor} from '../dist/learning/bridges.js';
import {act, field, initial, solveSteps} from '../dist/learning/phase5/b20-model.js';
import {P023_SOURCES, p023GraphInterpretationBinding, replayP023GraphInterpretationEvidence, submittedP023GraphInterpretationEvidence} from '../dist/learning/p023-graph-interpretation-evidence.js';

const differingField = task => {
  if (task.type === 'x-scatterbuild') return ['xaxis','y'];
  if (task.type === 'x-correlationlab') return ['causal','direct'];
  return ['reason',task.mode==='represent'?'big':'max'];
};
const correctSteps = task => solveSteps(task).filter(step => step.field === differingField(task)[0]);
const wrongSteps = task => {
  const [field,value] = differingField(task);
  const steps = solveSteps(task).map(step => step.field === field ? {...step,value} : step);
  if (task.type === 'x-graphcompare' && task.mode === 'distributions') {
    return [{action:'b20-view',data:{kind:'table'}},{action:'b20-view',data:{kind:'dot'}},...steps];
  }
  return steps;
};

const ordered = value => Array.isArray(value) ? value.map(ordered) : value && typeof value === 'object'
  ? Object.fromEntries(Object.keys(value).sort((a,b) => a.localeCompare(b,'en')).map(key => [key, ordered(value[key])]))
  : value;

for (const source of P023_SOURCES) {
  const {sessionId, index} = source;
  const context = {sessionId, index};
  const task = sessionTaskFor(sessionId, index);
  const replay = model => replayP023GraphInterpretationEvidence(task, model, context);
  const submit = (model, saved) => submittedP023GraphInterpretationEvidence(task, model, {attempts:[{value:saved}]}, context);
  const play = (model, steps) => {
    for (const step of steps) {
      if (step.field) {
        if (step.field.startsWith('answers.')) model.answers[Number(step.field.split('.')[1])] = step.value;
        else model[step.field] = step.value;
        field(task,model,step.field);
      } else act(task, model, step.action === 'turn-extra' ? 'a30-turn' : step.action, step.data);
    }
  };
  test(`P023 locks ${sessionId}:${index} and rejects stale or modified work`, () => {
    assert.equal(createHash('sha256').update(JSON.stringify(ordered(task))).digest('hex'), source.taskHash);
    assert.ok(p023GraphInterpretationBinding(task, context));
    assert.equal(p023GraphInterpretationBinding(task, {sessionId,index:-1}), null);
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
