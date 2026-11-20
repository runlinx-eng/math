import test from 'node:test';
import assert from 'node:assert/strict';
import {sessionTaskFor,sessionTasks,BRIDGES} from '../dist/learning/bridges.js';
import {LESSONS} from '../dist/learning/catalog.js';
import * as native from '../dist/learning/phase5/b37-model.js';
import {unitConversionsBinding,replayUnitConversionsEvidence} from '../dist/learning/unitconversions-evidence.js';
import {taskFingerprint} from '../scripts/audit-evidence-expansion.mjs';

const reviewed=[
 [0,'24f154fec9c36094a2249fb518bf4a5c283d51f37a267192a472ee6003168bdf',['100','100','10000'],['cm','cm','cm^2']],
 [1,'24b5d85e4f40eea79a66c9c347a66b4fb92d78dbbc73e9a1407aab63169c45ca',['150','9000'],['min','s']],
 [2,'b9921e9e531986a88daa969ca4740e1fe0b0963d4a70902864a71e66ed9ea3e2',['1000','5/2'],['cm^3/L','L']]
];
const task=i=>sessionTaskFor('convertUnits37',i);
const ctx=i=>({sessionId:'convertUnits37',index:i});
const proof=(i,m)=>replayUnitConversionsEvidence(task(i),m,ctx(i));
test('#294 frozen original tasks, dimensionally independent BigInt calculations',()=>{
 for(const [i,hash,expected,units] of reviewed){
  const t=task(i),m=native.example(t);
  assert.equal(t.type,'x-r37-steps');
  assert.equal(taskFingerprint(t),hash,'original native task '+i);
  assert.equal(unitConversionsBinding(t,ctx(i))?.nodeId,LESSONS.convertUnits37.topicId);
  assert.equal(native.inspect(t,m).correct,true);
  const before=JSON.stringify(m),p=proof(i,m);
  assert.ok(p,'independent replay '+i);
  assert.deepEqual(p.construction.steps.map(x=>x.quantity),expected);
  assert.deepEqual(p.construction.steps.map(x=>x.unit),units);
  assert.equal(p.unitsIndependentlyChecked,true);
  assert.equal(p.independentStrategyAssessed,false);
  assert.equal(p.unitExplanationAssessed,false);
  assert.equal(p.checkedSubmissionAssessed,false);
  assert.deepEqual(p.construction.wrongStepIndices,[]);
  assert.equal(JSON.stringify(m),before,'pure replay');
 }
});
test('#294 real wrong step and later corrections preserve first and actual sequence',()=>{
 for(const [i,,expected] of reviewed){
  const t=task(i),m=native.initial(t);
  m.value='999';native.act(t,m,'r37-step');
  assert.equal(proof(i,m),null);
  for(const value of expected){m.value=value;native.act(t,m,'r37-step');}
  const p=proof(i,m);assert.ok(p);
  assert.deepEqual(p.construction.wrongStepIndices,[0]);
  assert.equal(p.construction.firstAnswers[0],'999');
  assert.deepEqual(p.construction.records.map(r=>r.correct),[false,...expected.map(()=>true)]);
  assert.equal(m.board.bad,true);
 }
});
test('#294 reject bad numerator/denominator, density inverse, forged history and source',()=>{
 for(const [i] of reviewed){
  const t=task(i),m=native.example(t);
  const bad=structuredClone(m);bad.history[0].v='wrong';
  assert.equal(proof(i,bad),null);
  const missing=structuredClone(m);missing.history.shift();
  assert.equal(proof(i,missing),null);
  const forged=structuredClone(m);forged.board.records[0].correct=false;
  assert.equal(proof(i,forged),null);
  const tamper=structuredClone(m);tamper.history[0].w='1';
  assert.equal(proof(i,tamper),null);
  assert.equal(replayUnitConversionsEvidence(t,m,{sessionId:'convertUnits37',index:i+1}),null);
  assert.equal(replayUnitConversionsEvidence({...t,prompt:t.prompt+' forged'},m,ctx(i)),null);
 }
 const t0=task(0),wrongArea=native.initial(t0);
 for(const value of ['100','100','100']){wrongArea.value=value;native.act(t0,wrongArea,'r37-step');}
 assert.equal(proof(0,wrongArea),null,'area uses 100 squared, not linear 100');
 const t1=task(1),wrongTime=native.initial(t1);
 for(const value of ['150','150']){wrongTime.value=value;native.act(t1,wrongTime,'r37-step');}
 assert.equal(proof(1,wrongTime),null,'minutes must be converted to seconds');
 const t2=task(2),wrongVolume=native.initial(t2);
 for(const value of ['1000','2500']){wrongVolume.value=value;native.act(t2,wrongVolume,'r37-step');}
 assert.equal(proof(2,wrongVolume),null,'divide cubic centimetres by 1000, do not multiply');
});
test('#294 never bind other step cards or the separate unit-price compare task',()=>{
 const eligible=new Set(reviewed.map(([i])=>'convertUnits37:'+i));
 for(const id of Object.keys(LESSONS))for(const [index,t] of (sessionTasks(id)||[]).entries())
  if(t.type==='x-r37-steps')
   assert.equal(!!unitConversionsBinding(t,{sessionId:id,index}),eligible.has(id+':'+index),id+':'+index);
 for(const id of Object.keys(BRIDGES))for(const [index,t] of (sessionTasks(id)||[]).entries())
  if(t.type==='x-r37-steps')assert.equal(unitConversionsBinding(t,{sessionId:id,index}),null);
 assert.equal(unitConversionsBinding(sessionTaskFor('rateUnit37',1),{sessionId:'rateUnit37',index:1}),null,'unrelated unit-price task excluded');
});
