import test from 'node:test';
import assert from 'node:assert/strict';
import {sessionTaskFor,sessionTasks,BRIDGES} from '../dist/learning/bridges.js';
import {LESSONS} from '../dist/learning/catalog.js';
import * as native from '../dist/learning/phase5/b37-model.js';
import {proportionalStepsBinding,replayProportionalStepsEvidence} from '../dist/learning/proportionalsteps-evidence.js';
import {taskFingerprint} from '../scripts/audit-evidence-expansion.mjs';

const cases=[
 {id:'proportion37',index:2,hash:'e297b2c98126d3176b6a207848578c49e92d4875e6ceff118ba94dd8aff738c0',
  values:['3/2','15'],units:['元/支','元'],node:'mt_5mIcmKRCgA'},
 {id:'ratioLink37',index:2,hash:'783e99d8e05ebab01f9f5b41deca8a157f97c91d35be8308a66205b6cb4e4bb3',
  values:['4','12'],units:['x','y'],node:'mt_yK51ZnKA8m'}
];
const task=c=>sessionTaskFor(c.id,c.index);
const context=c=>({sessionId:c.id,index:c.index});
const proof=(c,m)=>replayProportionalStepsEvidence(task(c),m,context(c));
test('#296 two immutable original source tasks and independently computed rational results',()=>{
 for(const c of cases){
  const t=task(c),m=native.example(t),before=JSON.stringify(m);
  assert.equal(taskFingerprint(t),c.hash,'original source SHA '+c.id);
  assert.equal(LESSONS[c.id].topicId,c.node);
  assert.equal(native.inspect(t,m).correct,true);
  assert.equal(proportionalStepsBinding(t,context(c))?.nodeId,c.node);
  const p=proof(c,m);assert.ok(p,c.id);
  assert.deepEqual(p.construction.steps.map(x=>x.quantity),c.values);
  assert.deepEqual(p.construction.steps.map(x=>x.unit),c.units);
  assert.equal(p.independentRationalMath,true);
  assert.equal(p.independentStrategyAssessed,false);
  assert.equal(p.generalProportionalityProofAssessed,false);
  assert.deepEqual(p.construction.wrongStepIndices,[]);
  assert.equal(JSON.stringify(m),before,'replay must not mutate raw history');
 }
});
test('#296 wrong-first and correction events remain in the original step history',()=>{
 for(const c of cases){
  const t=task(c),m=native.initial(t);
  m.value='999';native.act(t,m,'r37-step');
  assert.equal(proof(c,m),null,'partial mistaken work is not a completed proof');
  for(const value of c.values){m.value=value;native.act(t,m,'r37-step');}
  const p=proof(c,m);assert.ok(p,c.id);
  assert.deepEqual(p.construction.wrongStepIndices,[0]);
  assert.equal(p.construction.firstAnswers[0],'999');
  assert.deepEqual(p.construction.records.map(x=>x.correct),[false,true,true]);
  assert.equal(m.board.bad,true);
  const forged=structuredClone(m);forged.history[0].v='0';
  assert.equal(proof(c,forged),null);
  const missing=structuredClone(m);missing.history.shift();
  assert.equal(proof(c,missing),null);
  const wrongBoard=structuredClone(m);wrongBoard.board.records[0].correct=true;
  assert.equal(proof(c,wrongBoard),null);
  const foreign=structuredClone(m);foreign.history[0].w='1';
  assert.equal(proof(c,foreign),null);
  assert.equal(replayProportionalStepsEvidence({...t,prompt:t.prompt+' fake'},m,context(c)),null);
 }
});
test('#296 same widget never implies admission of unreviewed native or bridges',()=>{
 const accepted=new Set(cases.map(c=>c.id+':'+c.index));
 for(const id of Object.keys(LESSONS))
  for(const [index,t] of (sessionTasks(id)||[]).entries())
   if(t.type==='x-r37-steps')
    assert.equal(!!proportionalStepsBinding(t,{sessionId:id,index}),accepted.has(id+':'+index),id+':'+index);
 for(const id of Object.keys(BRIDGES))
  for(const [index,t] of (sessionTasks(id)||[]).entries())
   if(t.type==='x-r37-steps')
    assert.equal(proportionalStepsBinding(t,{sessionId:id,index}),null,'bridge '+id+':'+index);
 for(const c of cases){
  assert.equal(proportionalStepsBinding(task(c)),null);
  assert.equal(replayProportionalStepsEvidence(task(c),native.example(task(c)),{sessionId:c.id,index:0}),null);
 }
});
