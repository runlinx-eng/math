import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {sessionTaskFor} from '../dist/learning/bridges.js';
import * as b17 from '../dist/learning/phase5/b17-model.js';
import {P009E_SOURCES,p009eDecimalComplementsBinding,replayP009EDecimalComplementsEvidence,submittedP009EDecimalComplementsEvidence} from '../dist/learning/p009e-decimal-complements-evidence.js';

const wrongSteps=task=>b17.solveSteps(task).map(step=>step.field==='right'?{...step,value:'0.001'}:step);
const correctSteps=task=>b17.solveSteps(task);

const ordered = value=>Array.isArray(value)?value.map(ordered):value&&typeof value==='object'
  ?Object.fromEntries(Object.keys(value).sort((a,b)=>a.localeCompare(b,'en')).map(key=>[key,ordered(value[key])])):value;
for (const source of P009E_SOURCES) {
  const {sessionId,index}=source, context={sessionId,index}, task=sessionTaskFor(sessionId,index);
  const replay=model=>replayP009EDecimalComplementsEvidence(task,model,context);
  const play=(model,steps)=>{
    for (const step of steps) {
      if (step.field) model[step.field]=String(step.value);
      else b17.act(task,model,step.action,step.data);
    }
  };
  test(`P009E ${sessionId}:${index} exact source, correction, stale Check and history`,()=>{
    assert.equal(createHash('sha256').update(JSON.stringify(ordered(task))).digest('hex'),source.taskHash);
    assert.ok(p009eDecimalComplementsBinding(task,context));
    assert.equal(p009eDecimalComplementsBinding(task,{sessionId,index:-1}),null);
    const model=b17.initial(task);
    play(model,wrongSteps(task));
    assert.equal(replay(model),null);
    const wrong=structuredClone(model);
    play(model,correctSteps(task));
    const proof=replay(model);
    assert.ok(proof);
    assert.equal(submittedP009EDecimalComplementsEvidence(task,model,{attempts:[{value:wrong}]},context),null);
    assert.deepEqual(submittedP009EDecimalComplementsEvidence(task,model,{attempts:[{value:structuredClone(model)}]},context),proof);
    const forged=structuredClone(model);
    forged.history=[];
    assert.equal(replay(forged),null);
  });
}
