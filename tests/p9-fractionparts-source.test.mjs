import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {EVIDENCE_ADAPTERS} from '../dist/learning/evidence-adapters.js';
import {LESSONS} from '../dist/learning/catalog.js';
import {BRIDGES,sessionTasks,sessionTaskFor} from '../dist/learning/bridges.js';
import * as native from '../dist/learning/phase5/b37-model.js';
import {fractionPartsBinding,replayFractionPartsEvidence} from '../dist/learning/fractionparts-evidence.js';
import {thinkingFeedback,thinkingGuide} from '../dist/learning/thinking-feedback.js';
import {taskFingerprint} from '../scripts/audit-evidence-expansion.mjs';
const rows=[
 ['fractionOf37',0,'f9b4969c75ed81ec8ae778b1f140c09953f59fcd4010a80c326d6c27a3e1cdca'],
 ['fractionOf37',1,'be92e4d923c53aa7f58145f981574319424c2a688308e0305254ade627cad7e0'],
 ['fractionOf37',2,'7d12c7d28171862e2fbcace46754f280dffc3e4ac9b0af1fe0cf55b4021cef6a']
];
test('#288 exact part/whole source manifest, fingerprints and checked feedback',()=>{
 const manifest=JSON.parse(readFileSync(new URL('../docs/spatial-learning/evidence-review-manifest.json',import.meta.url)));
 const reviewed=manifest.tasks.filter(x=>x.adapter==='fractionparts');
 assert.equal(reviewed.length,3);
 assert.equal(EVIDENCE_ADAPTERS.filter(a=>a.id==='fractionparts').length,1);
 const actualStepAdapters=EVIDENCE_ADAPTERS.filter(x=>x.type==='x-r37-steps').map(x=>x.id).sort();
 const reviewedStepAdapters=[...new Set(manifest.tasks.filter(x=>x.type==='x-r37-steps').map(x=>x.adapter))].sort();
 assert.deepEqual(actualStepAdapters,reviewedStepAdapters,
  'every shared step adapter must have a distinct, strictly reviewed native source');
 for(const [sessionId,index,hash] of rows){
  const task=sessionTaskFor(sessionId,index),ctx={sessionId,index},m=native.example(task);
  assert.equal(taskFingerprint(task),hash);
  assert.deepEqual(reviewed.find(x=>x.sessionId===sessionId&&x.index===index),{
   sessionId,index,type:'x-r37-steps',nodeId:LESSONS[sessionId].topicId,
   adapter:'fractionparts',taskHash:hash,method:null
  });
  assert.equal(native.inspect(task,m).correct,true);
  assert.equal(fractionPartsBinding(task,ctx)?.nodeId,LESSONS[sessionId].topicId);
  assert.ok(replayFractionPartsEvidence(task,m,ctx));
  assert.ok(thinkingGuide(task,ctx)?.question);
  const record={support:false,attempts:[{value:structuredClone(m)}]};
  const feedback=thinkingFeedback(task,m,record,ctx);
  assert.ok(feedback?.observation.includes('部分与整体'));
  assert.equal(feedback.method,null);
  assert.ok(feedback.detail.some(x=>x.includes('没有自动核验学生自主策略')));
  assert.equal(thinkingFeedback(task,m,{attempts:[]},ctx),null);
  assert.equal(thinkingFeedback(task,m,record,{sessionId,index:String(index)}),null);
  const tamper=structuredClone(m);tamper.history=[];
  assert.equal(thinkingFeedback(task,tamper,record,ctx),null);
 }
});
test('#288 only these three native mixed steps; never legacy practice or bridge',()=>{
 const positions=new Set(rows.map(([id,index])=>id+':'+index));
 for(const sessionId of Object.keys(LESSONS))for(const [index,task] of (sessionTasks(sessionId)||[]).entries()){
  if(task.type==='x-r37-steps')
   assert.equal(!!fractionPartsBinding(task,{sessionId,index}),positions.has(sessionId+':'+index),sessionId+':'+index);
 }
 for(const sessionId of Object.keys(BRIDGES))for(const [index,task] of (sessionTasks(sessionId)||[]).entries())
  if(task.type==='x-r37-steps')
   assert.equal(fractionPartsBinding(task,{sessionId,index}),null);
 const task=sessionTaskFor('fractionOf37',0);
 assert.equal(fractionPartsBinding(task),null);
 assert.equal(fractionPartsBinding({...task,prompt:task.prompt+' forged'},{sessionId:'fractionOf37',index:0}),null);
 assert.equal(fractionPartsBinding(task,{sessionId:'pctChange37',index:0}),null);
});
