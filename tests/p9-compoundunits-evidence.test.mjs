import test from 'node:test';
import assert from 'node:assert/strict';
import {sessionTaskFor,sessionTasks,BRIDGES} from '../dist/learning/bridges.js';
import {LESSONS} from '../dist/learning/catalog.js';
import * as native from '../dist/learning/phase5/b37-model.js';
import {compoundUnitsBinding,replayCompoundUnitsEvidence} from '../dist/learning/compoundunits-evidence.js';
import {taskFingerprint} from '../scripts/audit-evidence-expansion.mjs';

const reviewed=[
 [0,'69272359c602558a94244a1294c6bf653d993e02331f615a859687154687dc72',['72000','3600','20'],['m','s','m/s']],
 [2,'0f71251781e1a412d7a3fa45b64f5747c95862ab82c0333f0fb5c60f54f6a165',['240','80','3'],['g','cm^3','g/cm^3']],
 [3,'951af1b4390e88b9c8ccebb2f857d7cfc362de9fcf77249288c2d49ee6734801',['240','80'],['g','cm^3']]
];
const task=i=>sessionTaskFor('rateUnit37',i);
const ctx=i=>({sessionId:'rateUnit37',index:i});
const proof=(i,m)=>replayCompoundUnitsEvidence(task(i),m,ctx(i));
test('#292 frozen original tasks, dimensionally independent BigInt calculations',()=>{
 for(const [i,hash,expected,units] of reviewed){
  const t=task(i),m=native.example(t);
  assert.equal(t.type,'x-r37-steps');
  assert.equal(taskFingerprint(t),hash,'original native task '+i);
  assert.equal(compoundUnitsBinding(t,ctx(i))?.nodeId,LESSONS.rateUnit37.topicId);
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
test('#292 real wrong step and later corrections preserve first and actual sequence',()=>{
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
test('#292 reject bad numerator/denominator, density inverse, forged history and source',()=>{
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
  assert.equal(replayCompoundUnitsEvidence(t,m,{sessionId:'rateUnit37',index:i+1}),null);
  assert.equal(replayCompoundUnitsEvidence({...t,prompt:t.prompt+' forged'},m,ctx(i)),null);
 }
 const t0=task(0),wrongSpeed=native.initial(t0);
 for(const value of ['72000','60','20']){wrongSpeed.value=value;native.act(t0,wrongSpeed,'r37-step');}
 assert.equal(proof(0,wrongSpeed),null,'hours must become 3600 seconds, not 60');
 const t2=task(2),wrongDensity=native.initial(t2);
 for(const value of ['240','80','19200']){wrongDensity.value=value;native.act(t2,wrongDensity,'r37-step');}
 assert.equal(proof(2,wrongDensity),null,'density uses division, not multiplication');
 const t3=task(3),wrongInverse=native.initial(t3);
 for(const value of ['240','720']){wrongInverse.value=value;native.act(t3,wrongInverse,'r37-step');}
 assert.equal(proof(3,wrongInverse),null,'recover volume by division, not multiplication');
});
test('#292 never bind other step cards or the separate unit-price compare task',()=>{
 const eligible=new Set(reviewed.map(([i])=>'rateUnit37:'+i));
 for(const id of Object.keys(LESSONS))for(const [index,t] of (sessionTasks(id)||[]).entries())
  if(t.type==='x-r37-steps')
   assert.equal(!!compoundUnitsBinding(t,{sessionId:id,index}),eligible.has(id+':'+index),id+':'+index);
 for(const id of Object.keys(BRIDGES))for(const [index,t] of (sessionTasks(id)||[]).entries())
  if(t.type==='x-r37-steps')assert.equal(compoundUnitsBinding(t,{sessionId:id,index}),null);
 assert.equal(compoundUnitsBinding(task(1),ctx(1)),null,'unreviewed unit-price task excluded');
});
