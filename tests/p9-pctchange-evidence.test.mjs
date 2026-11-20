import test from 'node:test';
import assert from 'node:assert/strict';
import {sessionTaskFor,sessionTasks,BRIDGES} from '../dist/learning/bridges.js';
import {LESSONS} from '../dist/learning/catalog.js';
import * as native from '../dist/learning/phase5/b37-model.js';
import {pctChangeBinding,replayPctChangeEvidence} from '../dist/learning/pctchange-evidence.js';
import {taskFingerprint} from '../scripts/audit-evidence-expansion.mjs';

const reviewed=[
 ['pctChange37',0,'58795f709857ea784cb4718b1d5a32ddac31a64eb937056f387852518ff7e54f',['240','36','276','23/20']],
 ['pctChange37',1,'42a42994482d615a2535fa7856256bb73cbc98001dfdfca1879dcb9a85b26939',['64','16','80']],
 ['pctChange37',2,'0d529285e48c3f0edb36c9678dc2e7d0a2eab0bb00ef272c372521c835e15aca',['15','60','560']]
];
const proof=(id,index,model)=>replayPctChangeEvidence(sessionTaskFor(id,index),model,{sessionId:id,index});
test('#286 genuine source fingerprints, independent percentage and simple interest arithmetic',()=>{
 for(const [id,index,hash,expected] of reviewed){
  const task=sessionTaskFor(id,index),model=native.example(task);
  assert.equal(task.type,'x-r37-steps');
  assert.equal(taskFingerprint(task),hash,id+':'+index);
  assert.equal(pctChangeBinding(task,{sessionId:id,index})?.nodeId,LESSONS[id].topicId);
  assert.equal(native.inspect(task,model).correct,true);
  const before=JSON.stringify(model),result=proof(id,index,model);
  assert.ok(result,id+':'+index);
  assert.deepEqual(result.construction.steps.map(x=>x.quantity),expected);
  assert.deepEqual(result.construction.wrongStepIndices,[]);
  assert.equal(result.checkedSubmissionAssessed,false);
  assert.equal(JSON.stringify(model),before);
 }
});
test('#286 original wrong step and correction are both retained',()=>{
 const task=sessionTaskFor('pctChange37',2),model=native.initial(task);
 model.value='15.45';native.act(task,model,'r37-step');
 assert.equal(proof('pctChange37',2,model),null);
 for(const step of task.steps){model.value=String(step.value);native.act(task,model,'r37-step');}
 const p=proof('pctChange37',2,model);
 assert.ok(p);
 assert.deepEqual(p.construction.wrongStepIndices,[0]);
 assert.equal(p.construction.firstAnswers[0],'15.45');
 assert.deepEqual(p.construction.records.map(r=>r.correct),[false,true,true,true]);
});
test('#286 reject wrong rates, compound interest, missing history, invented source',()=>{
 for(const [id,index] of reviewed){
  const task=sessionTaskFor(id,index),m=native.example(task);
  const wrong=structuredClone(m);wrong.history[0].v='999';
  assert.equal(proof(id,index,wrong),null);
  const partial=structuredClone(m);partial.history.pop();
  assert.equal(proof(id,index,partial),null);
  const forged=structuredClone(m);forged.board.records[0].correct=false;
  assert.equal(proof(id,index,forged),null);
  assert.equal(replayPctChangeEvidence(task,m,{sessionId:id,index:index+1}),null);
  assert.equal(replayPctChangeEvidence({...task,prompt:task.prompt+' forged'},m,{sessionId:id,index}),null);
 }
});
test('#286 no other B37 steps or bridge are eligible',()=>{
 const eligible=new Set(reviewed.map(([id,index])=>id+':'+index));
 for(const id of Object.keys(LESSONS))for(const [index,task] of (sessionTasks(id)||[]).entries())
  if(task.type==='x-r37-steps')assert.equal(!!pctChangeBinding(task,{sessionId:id,index}),eligible.has(id+':'+index));
 for(const id of Object.keys(BRIDGES))for(const [index,task] of (sessionTasks(id)||[]).entries())
  if(task.type==='x-r37-steps')assert.equal(pctChangeBinding(task,{sessionId:id,index}),null);
});
