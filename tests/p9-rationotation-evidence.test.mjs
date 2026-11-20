import test from 'node:test';
import assert from 'node:assert/strict';
import {sessionTaskFor,sessionTasks,BRIDGES} from '../dist/learning/bridges.js';
import {LESSONS} from '../dist/learning/catalog.js';
import * as native from '../dist/learning/phase5/b37-model.js';
import {ratioNotationBinding,replayRatioNotationEvidence} from '../dist/learning/rationotation-evidence.js';
import {taskFingerprint} from '../scripts/audit-evidence-expansion.mjs';
const reviewed=[
 ['ratioNotation37',1,'ad19110a86afef2892af6e8be66de7c183c1ced41d187623cdb52874c48b9621',['2','1','3']],
 ['ratioNotation37',2,'e5d2fd0622f4e630d95ed4314ca1c886eb173869e3f8289a38dc4a75185e30be',['2','3']]
];
const proof=(i,m)=>replayRatioNotationEvidence(sessionTaskFor('ratioNotation37',i),m,{sessionId:'ratioNotation37',index:i});
test('#290 original fingerprints, independently derived common multiplier and simplest ratios',()=>{
 for(const [id,index,hash,expected] of reviewed){
  const task=sessionTaskFor(id,index),model=native.example(task);
  assert.equal(task.type,'x-r37-steps');
  assert.equal(taskFingerprint(task),hash);
  assert.equal(ratioNotationBinding(task,{sessionId:id,index})?.nodeId,LESSONS[id].topicId);
  assert.equal(native.inspect(task,model).correct,true);
  const before=JSON.stringify(model),p=proof(index,model);
  assert.ok(p,id+':'+index);
  assert.deepEqual(p.construction.steps.map(x=>x.quantity),expected);
  assert.equal(p.construction.simplestIntegerRatio,true);
  assert.equal(p.selfSelectedMultiplierAssessed,false);
  assert.equal(p.checkedSubmissionAssessed,false);
  assert.deepEqual(p.construction.wrongStepIndices,[]);
  assert.equal(JSON.stringify(model),before);
 }
});
test('#290 prior wrong multiplier and correction remain first-class real events',()=>{
 const task=sessionTaskFor('ratioNotation37',1),m=native.initial(task);
 m.value='3';native.act(task,m,'r37-step');
 assert.equal(proof(1,m),null);
 for(const step of task.steps){m.value=String(step.value);native.act(task,m,'r37-step');}
 const p=proof(1,m);
 assert.ok(p);
 assert.deepEqual(p.construction.wrongStepIndices,[0]);
 assert.equal(p.construction.firstAnswers[0],'3');
 assert.deepEqual(p.construction.records.map(x=>x.correct),[false,true,true,true]);
});
test('#290 reject mismatched numerator, unequal scale, forged state, missing events, cross-source',()=>{
 for(const [id,index] of reviewed){
  const task=sessionTaskFor(id,index),m=native.example(task);
  const wrong=structuredClone(m);wrong.history[0].v='999';assert.equal(proof(index,wrong),null);
  const partial=structuredClone(m);partial.history.shift();assert.equal(proof(index,partial),null);
  const forged=structuredClone(m);forged.board.records[0].correct=false;assert.equal(proof(index,forged),null);
  assert.equal(replayRatioNotationEvidence(task,m,{sessionId:id,index:index+1}),null);
  assert.equal(replayRatioNotationEvidence({...task,prompt:task.prompt+' forged'},m,{sessionId:id,index}),null);
 }
});
test('#290 exact native positions only; old ratio pair and all other steps/bridges excluded',()=>{
 const expected=new Set(reviewed.map(([id,index])=>id+':'+index));
 for(const id of Object.keys(LESSONS))for(const [index,task] of (sessionTasks(id)||[]).entries())
  if(task.type==='x-r37-steps')
   assert.equal(!!ratioNotationBinding(task,{sessionId:id,index}),expected.has(id+':'+index),id+':'+index);
 for(const id of Object.keys(BRIDGES))for(const [index,task] of (sessionTasks(id)||[]).entries())
  if(task.type==='x-r37-steps')assert.equal(ratioNotationBinding(task,{sessionId:id,index}),null);
 assert.equal(ratioNotationBinding(sessionTaskFor('ratioNotation37',0),{sessionId:'ratioNotation37',index:0}),null);
});
