import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {sessionTaskFor} from '../dist/learning/bridges.js';
import * as b10 from '../dist/learning/phase5/b10-model.js';
import {P009A_SOURCES,p009aTenLandmarkBinding,replayP009ATenLandmarkEvidence,submittedP009ATenLandmarkEvidence} from '../dist/learning/p009a-ten-landmark-evidence.js';
const field=(field,value)=>({field,value:String(value)});
const act=(action,data)=>({action,data});
function tenSteps(task) {
  const add=task.op==='+';
  const head=add?10-task.a:task.a-10;
  const answer=task.a+(add?task.b:-task.b);
  const token=index=>act('ten-token',{index});
  return [field('guess',answer),act('ten-predict'),
    ...Array.from({length:head},(_,i)=>token(add?i:10+i)),act('ten-landmark'),
    ...Array.from({length:task.b-head},(_,i)=>token(add?i+head:i)),act('ten-finish'),
    field('firstPart',head),field('secondPart',task.b-head),field('equation',`${task.a}${task.op}${task.b}=${answer}`)];
}
function familySteps(task) {
  return b10.MODES.flatMap(mode=>{
    const [a,b,op]=b10.familyNumbers(task,mode);
    return [act('family-mode',{mode}),field('equation',`${a}${op}${b}=${a+(op==='+'?b:-b)}`),act('family-save')];
  });
}
function legacySteps(task) {
  if (task.type==='x-tenbridge') return tenSteps(task);
  if (task.type==='x-factfamily') return familySteps(task);
  if (task.type==='x-joinstory') {
    const answer=task.a+(task.op==='+'?task.b:-task.b);
    return [...Array.from({length:task.a},()=>act('story-counter',{group:'left',delta:1})),
      ...Array.from({length:task.b},()=>act('story-counter',{group:'right',delta:1})),
      field('op',task.op),field('guess',answer),act('story-do'),field('equation',`${task.a}${task.op}${task.b}=${answer}`)];
  }
  if (task.type==='x-splitbench') {
    let count=0;
    const steps=[];
    for (const [a,b] of task.pairs) {
      while (count>a) steps.push(act('split-token',{index:--count}));
      while (count<a) steps.push(act('split-token',{index:count++}));
      steps.push(field('equation',`${a}+${b}=${task.total}`),act('split-save'));
    }
    return steps;
  }
  throw new Error('Unexpected prerequisite: '+task.type);
}

const wrongSteps=task=>tenSteps(task).map(step=>step.field==='equation'?field('equation','1+1=2'):step);
const correctSteps=task=>tenSteps(task).slice(-1);

const ordered = value=>Array.isArray(value)?value.map(ordered):value&&typeof value==='object'
  ?Object.fromEntries(Object.keys(value).sort((a,b)=>a.localeCompare(b,'en')).map(key=>[key,ordered(value[key])])):value;
for (const source of P009A_SOURCES) {
  const {sessionId,index}=source, context={sessionId,index}, task=sessionTaskFor(sessionId,index);
  const replay=model=>replayP009ATenLandmarkEvidence(task,model,context);
  const play=(model,steps)=>{
    for (const step of steps) {
      if (step.field) model[step.field]=String(step.value);
      else b10.act(task,model,step.action,step.data);
    }
  };
  test(`P009A ${sessionId}:${index} exact source, correction, stale Check and history`,()=>{
    assert.equal(createHash('sha256').update(JSON.stringify(ordered(task))).digest('hex'),source.taskHash);
    assert.ok(p009aTenLandmarkBinding(task,context));
    assert.equal(p009aTenLandmarkBinding(task,{sessionId,index:-1}),null);
    const model=b10.initial(task);
    play(model,wrongSteps(task));
    assert.equal(replay(model),null);
    const wrong=structuredClone(model);
    play(model,correctSteps(task));
    const proof=replay(model);
    assert.ok(proof);
    assert.equal(submittedP009ATenLandmarkEvidence(task,model,{attempts:[{value:wrong}]},context),null);
    assert.deepEqual(submittedP009ATenLandmarkEvidence(task,model,{attempts:[{value:structuredClone(model)}]},context),proof);
    const forged=structuredClone(model);
    forged.history=[];
    assert.equal(replay(forged),null);
  });
}
