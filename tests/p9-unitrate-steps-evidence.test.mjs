import test from 'node:test';
import assert from 'node:assert/strict';
import {sessionTaskFor,sessionTasks,BRIDGES} from '../dist/learning/bridges.js';
import {LESSONS} from '../dist/learning/catalog.js';
import * as native from '../dist/learning/phase5/b37-model.js';
import {unitRateStepsBinding,replayUnitRateStepsEvidence} from '../dist/learning/unitrate-steps-evidence.js';

const cases=[
 {id:'rateWords37',index:2,node:'mt_ATYLKt0je-',numbers:['120','60'],choice:'mph'},
 {id:'proportionGraph37',index:2,node:'mt_FspV_imUGK',numbers:['2','10'],choice:'zero'}
];
const task=c=>sessionTaskFor(c.id,c.index);
const context=c=>({sessionId:c.id,index:c.index});
const proof=(c,m)=>replayUnitRateStepsEvidence(task(c),m,context(c));
test('#323 both immutable original unit-rate tasks have independent numeric and choice replay',()=>{
 for(const c of cases){
  const t=task(c),m=native.example(t),before=JSON.stringify(m);
  assert.equal(t.type,'x-r37-steps');
  assert.equal(LESSONS[c.id].topicId,c.node);
  assert.equal(native.inspect(t,m).correct,true);
  assert.equal(unitRateStepsBinding(t,context(c))?.nodeId,c.node);
  const p=proof(c,m);assert.ok(p,c.id);
  assert.deepEqual(p.construction.steps.slice(0,2).map(x=>x.quantity),c.numbers);
  assert.equal(p.construction.steps[2].choice,c.choice);
  assert.equal(p.construction.choiceRecorded,true);
  assert.equal(p.independentRationalMath,true);
  assert.equal(p.independentStrategyAssessed,false);
  assert.equal(p.checkedSubmissionAssessed,false);
  assert.deepEqual(p.construction.wrongStepIndices,[]);
  assert.equal(JSON.stringify(m),before,'pure replay');
 }
});
test('#323 wrong-first numeric and choice events followed by correction remain inspectable',()=>{
 for(const c of cases){
  const t=task(c),m=native.initial(t);
  m.value='999';native.act(t,m,'r37-step');
  assert.equal(proof(c,m),null);
  for(const value of c.numbers){m.value=value;native.act(t,m,'r37-step');}
  m.choice=c.choice==='mph'?'mile':'fixed';native.act(t,m,'r37-step');
  assert.equal(proof(c,m),null);
  m.choice=c.choice;native.act(t,m,'r37-step');
  const p=proof(c,m);assert.ok(p,c.id);
  assert.deepEqual(p.construction.wrongStepIndices,[0,3]);
  assert.deepEqual(p.construction.records.map(x=>x.correct),[false,true,true,false,true]);
  assert.equal(p.construction.firstAnswers[0],'999');
  assert.equal(p.construction.firstAnswers[2],c.choice==='mph'?'mile':'fixed');
  assert.equal(m.board.bad,true);
 }
});
test('#323 forged logs, extra hidden fields, wrong source and incomplete submissions are rejected',()=>{
 for(const c of cases){
  const t=task(c),m=native.example(t);
  let x=structuredClone(m);x.history[0].v='0';assert.equal(proof(c,x),null);
  x=structuredClone(m);x.history.shift();assert.equal(proof(c,x),null);
  x=structuredClone(m);x.board.records[0].correct=false;assert.equal(proof(c,x),null);
  x=structuredClone(m);x.history[0].w='foreign';assert.equal(proof(c,x),null);
  x=structuredClone(m);x.history[0].c='foreign';assert.equal(proof(c,x),null);
  x=structuredClone(m);x.history[2].v='1';assert.equal(proof(c,x),null);
  x=structuredClone(m);x.history[2].c='wrong';assert.equal(proof(c,x),null);
  assert.equal(replayUnitRateStepsEvidence({...t,prompt:t.prompt+' altered'},m,context(c)),null);
  assert.equal(replayUnitRateStepsEvidence(t,m,{sessionId:c.id,index:0}),null);
  assert.equal(unitRateStepsBinding(t),null);
 }
});
test('#323 other r37-step native tasks and all bridge tasks remain unbound',()=>{
 const accepted=new Set(cases.map(c=>c.id+':'+c.index));
 for(const id of Object.keys(LESSONS))for(const [index,t] of (sessionTasks(id)||[]).entries())
  if(t.type==='x-r37-steps')assert.equal(!!unitRateStepsBinding(t,{sessionId:id,index}),accepted.has(id+':'+index),id+':'+index);
 for(const id of Object.keys(BRIDGES))for(const [index,t] of (sessionTasks(id)||[]).entries())
  if(t.type==='x-r37-steps')assert.equal(unitRateStepsBinding(t,{sessionId:id,index}),null,'bridge '+id+':'+index);
});
