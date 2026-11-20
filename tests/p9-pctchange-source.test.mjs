import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {EVIDENCE_ADAPTERS} from '../dist/learning/evidence-adapters.js';
import {LESSONS} from '../dist/learning/catalog.js';
import {BRIDGES,sessionTasks,sessionTaskFor} from '../dist/learning/bridges.js';
import * as native from '../dist/learning/phase5/b37-model.js';
import {pctChangeBinding,replayPctChangeEvidence} from '../dist/learning/pctchange-evidence.js';
import {thinkingFeedback,thinkingGuide} from '../dist/learning/thinking-feedback.js';
import {taskFingerprint} from '../scripts/audit-evidence-expansion.mjs';
const reviewed=[
 ['pctChange37',0,'58795f709857ea784cb4718b1d5a32ddac31a64eb937056f387852518ff7e54f'],
 ['pctChange37',1,'42a42994482d615a2535fa7856256bb73cbc98001dfdfca1879dcb9a85b26939'],
 ['pctChange37',2,'0d529285e48c3f0edb36c9678dc2e7d0a2eab0bb00ef272c372521c835e15aca']
];
test('#286 reviewed fingerprints, original steps and latest truly checked math feedback',()=>{
 const manifest=JSON.parse(readFileSync(new URL('../docs/spatial-learning/evidence-review-manifest.json',import.meta.url)));
 const rows=manifest.tasks.filter(x=>x.adapter==='pctchange');
 assert.equal(rows.length,3);
 assert.equal(EVIDENCE_ADAPTERS.filter(x=>x.id==='pctchange').length,1);
 const actualStepAdapters=EVIDENCE_ADAPTERS.filter(x=>x.type==='x-r37-steps').map(x=>x.id).sort();
 const reviewedStepAdapters=[...new Set(manifest.tasks.filter(x=>x.type==='x-r37-steps').map(x=>x.adapter))].sort();
 assert.deepEqual(actualStepAdapters,reviewedStepAdapters,
  'every shared step adapter must have a distinct, strictly reviewed native source');
 for(const [sessionId,index,taskHash] of reviewed){
  const task=sessionTaskFor(sessionId,index),context={sessionId,index},model=native.example(task);
  assert.equal(task.type,'x-r37-steps');
  assert.equal(taskFingerprint(task),taskHash);
  assert.deepEqual(rows.find(x=>x.sessionId===sessionId&&x.index===index),{
   sessionId,index,type:'x-r37-steps',nodeId:LESSONS[sessionId].topicId,
   adapter:'pctchange',taskHash,method:null
  });
  assert.ok(pctChangeBinding(task,context));
  assert.ok(replayPctChangeEvidence(task,model,context));
  assert.ok(thinkingGuide(task,context)?.question);
  const record={support:false,attempts:[{value:structuredClone(model)}]};
  const feedback=thinkingFeedback(task,model,record,context);
  assert.ok(feedback?.observation.includes('百分'));
  assert.equal(feedback.method,null);
  assert.ok(feedback.detail.some(x=>x.includes('没有记录独立策略')));
  assert.equal(thinkingFeedback(task,model,{attempts:[]},context),null);
  const edited=structuredClone(model);edited.history=[];
  assert.equal(thinkingFeedback(task,edited,record,context),null);
 }
});
test('#286 original percentage steps only, no other shared x-r37-steps or linked exercise',()=>{
 const eligible=new Set(reviewed.map(([s,i])=>s+':'+i));
 for(const id of Object.keys(LESSONS))for(const [index,task] of (sessionTasks(id)||[]).entries()){
  if(task.type==='x-r37-steps')
   assert.equal(!!pctChangeBinding(task,{sessionId:id,index}),eligible.has(id+':'+index),id+':'+index);
 }
 for(const id of Object.keys(BRIDGES))for(const [index,task] of (sessionTasks(id)||[]).entries())
  if(task.type==='x-r37-steps')assert.equal(pctChangeBinding(task,{sessionId:id,index}),null);
 const task=sessionTaskFor('pctChange37',0);
 assert.equal(pctChangeBinding(task),null);
 assert.equal(pctChangeBinding({...task,prompt:task.prompt+' changed'},{sessionId:'pctChange37',index:0}),null);
 assert.equal(pctChangeBinding(task,{sessionId:'scaleMap37',index:0}),null);
});
