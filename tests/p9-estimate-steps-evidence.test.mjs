import test from 'node:test';
import assert from 'node:assert/strict';
import {sessionTaskFor,sessionTasks,BRIDGES} from '../dist/learning/bridges.js';
import {LESSONS} from '../dist/learning/catalog.js';
import * as native from '../dist/learning/phase5/b37-model.js';
import {estimateStepsBinding,replayEstimateStepsEvidence} from '../dist/learning/estimate-steps-evidence.js';
import {ensureB39Ready} from '../dist/learning/phase4/async-batches.js';
await ensureB39Ready();

const cases=[
 {id:'complex38',index:1,node:'mt_GpltXPoaoc',numbers:['5000','35000'],choice:'yes',
  reference:/4832 × 7 = 33824/},
 {id:'advancedPlan38',index:3,node:'mt_FieL-vVTI_',numbers:['20','4','5'],choice:'yes',
  reference:/198\/41/}
];
const task=c=>sessionTaskFor(c.id,c.index);
const ctx=c=>({sessionId:c.id,index:c.index});
const proof=(c,m)=>replayEstimateStepsEvidence(task(c),m,ctx(c));
test('#325 B38 exact two original tasks have independent magnitude arithmetic and original steps',()=>{
 for(const c of cases){
  const t=task(c),m=native.example(t),before=JSON.stringify(m);
  assert.equal(t.type,'x-r37-steps');
  assert.equal(LESSONS[c.id].topicId,c.node);
  assert.equal(native.inspect(t,m).correct,true);
  assert.equal(estimateStepsBinding(t,ctx(c))?.nodeId,c.node);
  const p=proof(c,m);assert.ok(p,c.id);
  assert.deepEqual(p.construction.steps.map(x=>x.quantity),c.numbers);
  assert.equal(p.construction.terminalChoice,c.choice);
  assert.match(p.construction.reference,c.reference);
  assert.equal(p.independentExactMath,true);
  assert.equal(p.independentEstimationStrategyAssessed,false);
  assert.equal(p.mathematicalProofAssessed,false);
  assert.equal(p.checkedSubmissionAssessed,false);
  assert.deepEqual(p.construction.wrongStepIndices,[]);
  assert.equal(JSON.stringify(m),before,'pure original history replay');
 }
});
test('#325 first mistaken numeric and terminal choice, followed by actual correction, stay recorded',()=>{
 for(const c of cases){
  const t=task(c),m=native.initial(t);
  m.value='999';native.act(t,m,'r37-step');
  assert.equal(proof(c,m),null);
  for(const v of c.numbers){m.value=v;native.act(t,m,'r37-step');}
  m.choice='no';native.act(t,m,'r37-step');
  assert.equal(proof(c,m),null);
  m.choice='yes';native.act(t,m,'r37-step');
  const p=proof(c,m);assert.ok(p,c.id);
  assert.deepEqual(p.construction.wrongStepIndices,[0,c.numbers.length+1]);
  assert.deepEqual(p.construction.records.map(x=>x.correct),[false,...c.numbers.map(()=>true),false,true]);
  assert.equal(p.construction.firstAnswers[0],'999');
  assert.equal(p.construction.firstAnswers[c.numbers.length],'no');
  assert.equal(m.board.bad,true);
 }
});
test('#325 corrupted history, spoofed board, changed prompt, unrelated task must fail closed',()=>{
 for(const c of cases){
  const t=task(c),m=native.example(t);
  let bad=structuredClone(m);bad.history[0].v='0';assert.equal(proof(c,bad),null);
  bad=structuredClone(m);bad.history.shift();assert.equal(proof(c,bad),null);
  bad=structuredClone(m);bad.board.records[0].correct=false;assert.equal(proof(c,bad),null);
  bad=structuredClone(m);bad.history[0].w='hidden';assert.equal(proof(c,bad),null);
  bad=structuredClone(m);bad.history[0].c='hidden';assert.equal(proof(c,bad),null);
  bad=structuredClone(m);bad.history.at(-1).v='1';assert.equal(proof(c,bad),null);
  bad=structuredClone(m);bad.history.at(-1).c='no';assert.equal(proof(c,bad),null);
  assert.equal(replayEstimateStepsEvidence({...t,prompt:t.prompt+' changed'},m,ctx(c)),null);
  assert.equal(replayEstimateStepsEvidence(t,m,{sessionId:c.id,index:0}),null);
  assert.equal(estimateStepsBinding(t),null);
 }
});
test('#325 only two genuine B38 originals bind; no other same-widget or bridge does',()=>{
 const allowed=new Set(cases.map(x=>x.id+':'+x.index));
 for(const id of Object.keys(LESSONS))for(const [index,t]of(sessionTasks(id)||[]).entries())
  if(t.type==='x-r37-steps')assert.equal(!!estimateStepsBinding(t,{sessionId:id,index}),allowed.has(id+':'+index),id+':'+index);
 for(const id of Object.keys(BRIDGES))for(const [index,t]of(sessionTasks(id)||[]).entries())
  if(t.type==='x-r37-steps')assert.equal(estimateStepsBinding(t,{sessionId:id,index}),null,'bridge '+id+':'+index);
});
