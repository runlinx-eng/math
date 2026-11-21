import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {sessionTaskFor} from '../dist/learning/bridges.js';
import * as b15 from '../dist/learning/phase5/b15-model.js';
import {P009D_SOURCES,p009dInverseCalculationBinding,replayP009DInverseCalculationEvidence,submittedP009DInverseCalculationEvidence} from '../dist/learning/p009d-inverse-calculation-evidence.js';

const wrongSteps=task=>b15.solveSteps(task).map(step=>step.field==='answer'?{...step,value:'0'}:step);
const correctSteps=task=>b15.solveSteps(task).filter(step=>step.field==='answer');

const ordered = value=>Array.isArray(value)?value.map(ordered):value&&typeof value==='object'
  ?Object.fromEntries(Object.keys(value).sort((a,b)=>a.localeCompare(b,'en')).map(key=>[key,ordered(value[key])])):value;
for (const source of P009D_SOURCES) {
  const {sessionId,index}=source, context={sessionId,index}, task=sessionTaskFor(sessionId,index);
  const replay=model=>replayP009DInverseCalculationEvidence(task,model,context);
  const play=(model,steps)=>{
    for (const step of steps) {
      if (step.field) model[step.field]=String(step.value);
      else b15.act(task,model,step.action,step.data);
    }
  };
  test(`P009D ${sessionId}:${index} exact source, correction, stale Check and history`,()=>{
    assert.equal(createHash('sha256').update(JSON.stringify(ordered(task))).digest('hex'),source.taskHash);
    assert.ok(p009dInverseCalculationBinding(task,context));
    assert.equal(p009dInverseCalculationBinding(task,{sessionId,index:-1}),null);
    const model=b15.initial(task);
    play(model,wrongSteps(task));
    assert.equal(replay(model),null);
    const wrong=structuredClone(model);
    play(model,correctSteps(task));
    const proof=replay(model);
    assert.ok(proof);
    assert.equal(submittedP009DInverseCalculationEvidence(task,model,{attempts:[{value:wrong}]},context),null);
    assert.deepEqual(submittedP009DInverseCalculationEvidence(task,model,{attempts:[{value:structuredClone(model)}]},context),proof);
    const forged=structuredClone(model);
    forged.history=[];
    assert.equal(replay(forged),null);
  });
}
