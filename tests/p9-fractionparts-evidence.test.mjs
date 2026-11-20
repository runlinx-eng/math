import test from 'node:test';
import assert from 'node:assert/strict';
import {sessionTaskFor,sessionTasks,BRIDGES} from '../dist/learning/bridges.js';
import {LESSONS} from '../dist/learning/catalog.js';
import * as native from '../dist/learning/phase5/b37-model.js';
import {fractionPartsBinding,replayFractionPartsEvidence} from '../dist/learning/fractionparts-evidence.js';
import {taskFingerprint} from '../scripts/audit-evidence-expansion.mjs';

const reviewed=[
 ['fractionOf37',0,'f9b4969c75ed81ec8ae778b1f140c09953f59fcd4010a80c326d6c27a3e1cdca',['120','3/8'],['number','simple']],
 ['fractionOf37',1,'be92e4d923c53aa7f58145f981574319424c2a688308e0305254ade627cad7e0',['5/2','larger'],['simple','choice']],
 ['fractionOf37',2,'7d12c7d28171862e2fbcace46754f280dffc3e4ac9b0af1fe0cf55b4021cef6a',['18/24','3/4'],['rawfraction','simple']]
];
const proof=(i,m)=>replayFractionPartsEvidence(sessionTaskFor('fractionOf37',i),m,{sessionId:'fractionOf37',index:i});
test('#288 exact original fingerprints and independent arithmetic for all three kinds',()=>{
 for(const [id,index,hash,amounts,kinds] of reviewed){
  const task=sessionTaskFor(id,index),model=native.example(task);
  assert.equal(task.type,'x-r37-steps');
  assert.equal(taskFingerprint(task),hash);
  assert.equal(fractionPartsBinding(task,{sessionId:id,index})?.nodeId,LESSONS[id].topicId);
  assert.equal(native.inspect(task,model).correct,true);
  const prior=JSON.stringify(model),p=proof(index,model);
  assert.ok(p,'fractionOf37:'+index);
  assert.deepEqual(p.construction.steps.map(s=>s.quantity),amounts);
  assert.deepEqual(p.construction.steps.map(s=>s.kind),kinds);
  assert.deepEqual(p.construction.wrongStepIndices,[]);
  assert.equal(p.checkedSubmissionAssessed,false);
  assert.equal(p.independentExplanationAssessed,false);
  assert.equal(JSON.stringify(model),prior);
 }
});
test('#288 original raw fraction cannot be silently reduced before the required next step',()=>{
 const task=sessionTaskFor('fractionOf37',2),model=native.initial(task);
 model.value='3/4';native.act(task,model,'r37-step');
 assert.equal(proof(2,model),null);
 model.value='18/24';native.act(task,model,'r37-step');
 model.value='3/4';native.act(task,model,'r37-step');
 const p=proof(2,model);
 assert.ok(p);
 assert.deepEqual(p.construction.wrongStepIndices,[0]);
 assert.equal(p.construction.firstAnswers[0],'3/4');
 assert.deepEqual(p.construction.records.map(s=>s.correct),[false,true,true]);
});
test('#288 5/2 is greater than one, choice must be a real distinct step event',()=>{
 const task=sessionTaskFor('fractionOf37',1),model=native.initial(task);
 model.value='5/2';native.act(task,model,'r37-step');
 model.choice='smaller';native.act(task,model,'r37-step');
 model.choice='larger';native.act(task,model,'r37-step');
 const p=proof(1,model);
 assert.ok(p);
 assert.deepEqual(p.construction.records.map(s=>s.correct),[true,false,true]);
 assert.deepEqual(p.construction.wrongStepIndices,[1]);
 assert.equal(p.construction.firstAnswers[1],'smaller');
 assert.equal(model.history[1].c,'smaller');
 assert.equal(model.history[2].c,'larger');
});
test('#288 reject forged, unsimplified, wrong-unit, truncated and cross-source evidence',()=>{
 for(const [id,index] of reviewed){
  const task=sessionTaskFor(id,index),model=native.example(task);
  const forged=structuredClone(model);forged.history[0].v='450';
  assert.equal(proof(index,forged),null);
  const missing=structuredClone(model);missing.history.shift();
  assert.equal(proof(index,missing),null);
  const tamper=structuredClone(model);tamper.board.records[0].correct=false;
  assert.equal(proof(index,tamper),null);
  assert.equal(replayFractionPartsEvidence(task,model,{sessionId:id,index:index+1}),null);
  assert.equal(replayFractionPartsEvidence({...task,prompt:task.prompt+' forged'},model,{sessionId:id,index}),null);
 }
 const task=sessionTaskFor('fractionOf37',0),m=native.initial(task);
 m.value='120';native.act(task,m,'r37-step');m.value='6/16';native.act(task,m,'r37-step');
 assert.equal(proof(0,m),null);
});
test('#288 all other x-r37-steps and linked lessons remain outside this strict source',()=>{
 const eligible=new Set(reviewed.map(([id,index])=>id+':'+index));
 for(const id of Object.keys(LESSONS))for(const [index,task] of (sessionTasks(id)||[]).entries())
  if(task.type==='x-r37-steps')
   assert.equal(!!fractionPartsBinding(task,{sessionId:id,index}),eligible.has(id+':'+index),id+':'+index);
 for(const id of Object.keys(BRIDGES))for(const [index,task] of (sessionTasks(id)||[]).entries())
  if(task.type==='x-r37-steps')assert.equal(fractionPartsBinding(task,{sessionId:id,index}),null);
});
