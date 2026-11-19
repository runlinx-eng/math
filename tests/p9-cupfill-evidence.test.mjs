// #270 candidate replay tests; no strict A registration or user-data writes.
import test from 'node:test';
import assert from 'node:assert/strict';
import {sessionTaskFor,sessionTasks,BRIDGES} from '../dist/learning/bridges.js';
import * as original from '../dist/learning/phase5/b31-model.js';
import {cupfillBinding,replayCupfillEvidence} from '../dist/learning/cupfill-evidence.js';

const reviewed=[['comparecap',2,1],['comparecap',3,1],
 ['cupmeasure',0,1],['cupmeasure',1,2]];
const context=(id,index)=>({sessionId:id,index});
const act=(task,model,name,index)=>original.act(task,model,'m31-'+name,
 index===undefined?{}:{index});
const record=(t,m,count,amount=t.goal)=>{
 m.count=String(count);m.amount=String(amount);m.unit=t.unit;
 original.act(t,m,'m31-record');
};

for(const [id,index,unitCount] of reviewed){
 test('#270 native true-example source-bound cup fills: '+id+':'+index,()=>{
  const task=sessionTaskFor(id,index),model=original.example(task),before=JSON.stringify({task,model});
  assert.equal(task.type,'x-m31-fill');
  assert.equal(original.valid(task,model),true);
  assert.equal(original.inspect(task,model).correct,true);
  assert.equal(cupfillBinding(task,context(id,index))?.nodeId!==undefined,true);
  const proof=replayCupfillEvidence(task,model,context(id,index));
  assert.ok(proof,'real actions, source position and unit counts must replay');
  assert.equal(proof.method,null);
  assert.equal(proof.construction.runs.length,unitCount);
  assert.equal(proof.eventCount,model.history.length);
  assert.deepEqual(proof.construction.requiredUnits,task.requiredUnits);
  for(const run of proof.construction.runs){
   assert.equal(run.count*run.unitAmount,task.goal);
   assert.equal(run.addIndices.length,run.count);
   assert.ok(run.addIndices.every(n=>n>run.selectedAt&&n<run.recordedAt));
  }
  assert.equal(proof.physicalMeasurementAssessed,false);
  assert.equal(proof.independentUnitChoiceAssessed,false);
  assert.equal(proof.checkedSubmissionAssessed,false);
  assert.equal(proof.generalMasteryAssessed,false);
  assert.equal(JSON.stringify({task,model}),before,'never mutate original source or work');
 });
 test('#270 rejects forged source, absent provenance and missing actions: '+id+':'+index,()=>{
  const task=sessionTaskFor(id,index),model=original.example(task);
  assert.equal(cupfillBinding(task),null);
  assert.equal(replayCupfillEvidence(task,model),null);
  assert.equal(replayCupfillEvidence(task,model,context(id,index+1)),null);
  const forged=structuredClone(task);forged.prompt+='（改写）';
  assert.equal(cupfillBinding(forged,context(id,index)),null);
  assert.equal(replayCupfillEvidence(forged,model,context(id,index)),null);
  const empty=structuredClone(model);empty.history=[];
  assert.equal(replayCupfillEvidence(task,empty,context(id,index)),null);
 });
}

test('#270 a 1000 mL jug requires four big cups or eight small cups',()=>{
 const t=sessionTaskFor('cupmeasure',1),m=original.example(t);
 const proof=replayCupfillEvidence(t,m,context('cupmeasure',1));
 assert.ok(proof);
 assert.deepEqual(proof.construction.runs.map(r=>[r.unitAmount,r.count]),[[250,4],[125,8]]);
 assert.deepEqual(proof.construction.comparison,{
  smallerCup:'cup125',largerCup:'cup250',largerCupUsesFewer:true
 });
 assert.equal(m.answers[0],'fewer');
 const wrong=structuredClone(m);wrong.answers[0]='more';
 assert.equal(original.inspect(t,wrong).correct,false);
 assert.equal(replayCupfillEvidence(t,wrong,context('cupmeasure',1)),null);
});
test('#270 initial failed 300 mL record is preserved; correction earns only 200 mL',()=>{
 const t=sessionTaskFor('comparecap',2),m=original.initial(t);
 act(t,m,'choose','cup100');
 for(let i=0;i<3;i++)act(t,m,'add');
 record(t,m,3);
 assert.equal(original.inspect(t,m).correct,false);
 assert.equal(m.board.bad,true);
 act(t,m,'reset');
 for(let i=0;i<2;i++)act(t,m,'add');
 record(t,m,2);
 assert.equal(original.valid(t,m),true);
 assert.equal(original.inspect(t,m).correct,true);
 const proof=replayCupfillEvidence(t,m,context('comparecap',2));
 assert.ok(proof);
 assert.equal(proof.failures.length,1);
 assert.equal(proof.construction.runs[0].count,2);
 assert.equal(proof.construction.runs[0].goal,200);
 assert.equal(proof.construction.historicalBad,true);
});
test('#270 an overflowing fifth cup never becomes 1250 mL evidence',()=>{
 const t=sessionTaskFor('cupmeasure',0),m=original.initial(t);
 act(t,m,'choose','cup250');
 for(let i=0;i<5;i++)act(t,m,'add');
 assert.equal(m.board.level,1000);
 assert.equal(m.board.count,4);
 record(t,m,4);
 assert.equal(original.inspect(t,m).correct,true);
 const proof=replayCupfillEvidence(t,m,context('cupmeasure',0));
 assert.ok(proof);
 assert.equal(proof.overflows.length,1);
 assert.equal(proof.construction.runs[0].addIndices.length,4);
 assert.equal(proof.construction.runs[0].goal,1000);
 act(t,m,'add');
 assert.equal(original.inspect(t,m).correct,true,'old grader retains a saved run');
 assert.equal(replayCupfillEvidence(t,m,context('cupmeasure',0)),null,
  'uncorrected last overflow is not a strict, clean final record');
});
test('#270 grade-only idle controller action is not independent cupfill proof',()=>{
 const t=sessionTaskFor('comparecap',3),m=original.example(t);
 act(t,m,'test');
 assert.equal(original.valid(t,m),true);
 assert.equal(original.inspect(t,m).correct,true);
 assert.equal(replayCupfillEvidence(t,m,context('comparecap',3)),null);
});
test('#270 stale saved record does not count after the current cup is reset',()=>{
 const t=sessionTaskFor('comparecap',2),m=original.example(t);
 act(t,m,'reset');
 m.count='2';m.amount='200';m.unit='mL';
 assert.equal(original.valid(t,m),true);
 assert.equal(original.inspect(t,m).correct,true);
 assert.equal(replayCupfillEvidence(t,m,context('comparecap',2)),null);
});
test('#270 no bridge copy inherits native A or source-bound evidence',()=>{
 let count=0;
 for(const id of Object.keys(BRIDGES))for(const [index,t] of (sessionTasks(id)||[]).entries()){
  if(t?.type!=='x-m31-fill')continue;
  count++;
  const c=context(id,index);
  assert.equal(cupfillBinding(t,c),null);
  assert.equal(replayCupfillEvidence(t,original.example(t),c),null);
 }
 assert.ok(count>0,'at least one existing associated B31 cup task remains separate');
});
