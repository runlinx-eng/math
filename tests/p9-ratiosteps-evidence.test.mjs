import test from 'node:test';
import assert from 'node:assert/strict';
import {sessionTaskFor,sessionTasks,BRIDGES} from '../dist/learning/bridges.js';
import {LESSONS} from '../dist/learning/catalog.js';
import * as native from '../dist/learning/phase5/b37-model.js';
import {ratioStepsBinding,replayRatioStepsEvidence} from '../dist/learning/ratiosteps-evidence.js';
import {taskFingerprint} from '../scripts/audit-evidence-expansion.mjs';

const reviewed=[
 ['scaleMap37',0,'5cca4aa4ec9f1eca86da86325f3a4bb753072c571d93bc07922d3501639952c8',['450','9/2','120','12/5']],
 ['scaleMap37',1,'bf90e433c47ff8a8259f007a4008afac1c024932bb9b295da085b51f16be0817',['9','9/2','450']],
 ['scaleMap37',2,'abec9df4555bd8e90e058ec57fae2cdacf81c091b46b9dbdf4f1aef06a8a316d',['162500','13/8']],
 ['scaleArea37',1,'3dce8b0f18028dd0e9a1e0da065693f094ac01c7ae1ce603f8dbd3a932a7ac6a',['3','2','6','2500']],
 ['scaleArea37',2,'083683212922d73111a50ab7cfc19036ed25f172c5ad4e2b8123f14773120b77',['100000000','800000000','80000']]
];
const proof=(id,index,m)=>replayRatioStepsEvidence(sessionTaskFor(id,index),m,{sessionId:id,index});
test('#284 original fingerprints and independent unit arithmetic',()=>{
 for(const [id,index,hash,expected] of reviewed){
  const task=sessionTaskFor(id,index),model=native.example(task);
  assert.equal(task.type,'x-r37-steps');
  assert.equal(taskFingerprint(task),hash);
  assert.equal(ratioStepsBinding(task,{sessionId:id,index}).nodeId,LESSONS[id].topicId);
  assert.equal(native.inspect(task,model).correct,true);
  const before=JSON.stringify(model),result=proof(id,index,model);
  assert.ok(result,id+':'+index);
  assert.deepEqual(result.construction.steps.map(x=>x.quantity),expected);
  assert.deepEqual(result.construction.wrongStepIndices,[]);
  assert.equal(result.checkedSubmissionAssessed,false);
  assert.equal(JSON.stringify(model),before);
 }
});
test('#284 incorrect first step followed by correction remains visible',()=>{
 const task=sessionTaskFor('scaleArea37',2),model=native.initial(task);
 model.value='10000';native.act(task,model,'r37-step');
 assert.equal(proof('scaleArea37',2,model),null);
 for(const s of task.steps){model.value=String(s.value);native.act(task,model,'r37-step');}
 const p=proof('scaleArea37',2,model);
 assert.ok(p);assert.deepEqual(p.construction.wrongStepIndices,[0]);
 assert.equal(p.construction.firstAnswers[0],'10000');
 assert.deepEqual(p.construction.records.map(x=>x.correct),[false,true,true,true]);
});
test('#284 reject forged, wrong-unit, truncated, cross-source state',()=>{
 for(const [id,index] of reviewed){
  const task=sessionTaskFor(id,index),m=native.example(task);
  const wrong=structuredClone(m);wrong.history[0].v='50';
  assert.equal(proof(id,index,wrong),null);
  const missing=structuredClone(m);missing.history.shift();
  assert.equal(proof(id,index,missing),null);
  const forged=structuredClone(m);forged.board.records[0].correct=false;
  assert.equal(proof(id,index,forged),null);
  assert.equal(replayRatioStepsEvidence(task,m,{sessionId:id,index:index+1}),null);
  assert.equal(replayRatioStepsEvidence({...task,prompt:task.prompt+' changed'},m,{sessionId:id,index}),null);
 }
});
test('#284 no other native step or bridge inherits this contract',()=>{
 const eligible=new Set(reviewed.map(([id,index])=>id+':'+index));
 for(const id of Object.keys(LESSONS))for(const [i,task] of (sessionTasks(id)||[]).entries())
  if(task.type==='x-r37-steps')assert.equal(!!ratioStepsBinding(task,{sessionId:id,index:i}),eligible.has(id+':'+i));
 for(const id of Object.keys(BRIDGES))for(const [i,task] of (sessionTasks(id)||[]).entries())
  if(task.type==='x-r37-steps')assert.equal(ratioStepsBinding(task,{sessionId:id,index:i}),null);
});
