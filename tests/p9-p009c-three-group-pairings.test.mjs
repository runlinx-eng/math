import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {sessionTaskFor} from '../dist/learning/bridges.js';
import * as b10 from '../dist/learning/phase5/b10-model.js';
import {P009C_SOURCES,p009cThreeGroupPairingsBinding,replayP009CThreeGroupPairingsEvidence,submittedP009CThreeGroupPairingsEvidence} from '../dist/learning/p009c-three-group-pairings-evidence.js';
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

const total=task=>task.values.reduce((a,b)=>a+b,0);
const pairSteps=(task,pair)=>[
  ...pair.map(index=>act('triple-pick',{index})),act('triple-merge'),
  field('sub',task.values[pair[0]]+task.values[pair[1]]),field('total',total(task)),act('triple-save'),
];
const wrongSteps=task=>pairSteps(task,[0,1]).map(step=>step.field==='total'?field('total','0'):step);
const correctSteps=task=>{
  const choices=[[1,2],[0,2]];
  const useful=pair=>task.values[pair[0]]+task.values[pair[1]]===10||task.values[pair[0]]===task.values[pair[1]];
  const second=task.useful&&!useful([0,1])?choices.find(useful):choices[0];
  return [field('total',total(task)),act('triple-save'),...pairSteps(task,second)];
};

const ordered = value=>Array.isArray(value)?value.map(ordered):value&&typeof value==='object'
  ?Object.fromEntries(Object.keys(value).sort((a,b)=>a.localeCompare(b,'en')).map(key=>[key,ordered(value[key])])):value;
for (const source of P009C_SOURCES) {
  const {sessionId,index}=source, context={sessionId,index}, task=sessionTaskFor(sessionId,index);
  const replay=model=>replayP009CThreeGroupPairingsEvidence(task,model,context);
  const play=(model,steps)=>{
    for (const step of steps) {
      if (step.field) model[step.field]=String(step.value);
      else b10.act(task,model,step.action,step.data);
    }
  };
  test(`P009C ${sessionId}:${index} exact source, correction, stale Check and history`,()=>{
    assert.equal(createHash('sha256').update(JSON.stringify(ordered(task))).digest('hex'),source.taskHash);
    assert.ok(p009cThreeGroupPairingsBinding(task,context));
    assert.equal(p009cThreeGroupPairingsBinding(task,{sessionId,index:-1}),null);
    const model=b10.initial(task);
    play(model,wrongSteps(task));
    assert.equal(replay(model),null);
    const wrong=structuredClone(model);
    play(model,correctSteps(task));
    const proof=replay(model);
    assert.ok(proof);
    assert.equal(submittedP009CThreeGroupPairingsEvidence(task,model,{attempts:[{value:wrong}]},context),null);
    assert.deepEqual(submittedP009CThreeGroupPairingsEvidence(task,model,{attempts:[{value:structuredClone(model)}]},context),proof);
    const forged=structuredClone(model);
    forged.history=[];
    assert.equal(replay(forged),null);
  });
}
