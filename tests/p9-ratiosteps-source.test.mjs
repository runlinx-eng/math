import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {EVIDENCE_ADAPTERS} from '../dist/learning/evidence-adapters.js';
import {LESSONS} from '../dist/learning/catalog.js';
import {BRIDGES,sessionTasks,sessionTaskFor} from '../dist/learning/bridges.js';
import * as native from '../dist/learning/phase5/b37-model.js';
import {ratioStepsBinding,replayRatioStepsEvidence} from '../dist/learning/ratiosteps-evidence.js';
import {thinkingFeedback,thinkingGuide} from '../dist/learning/thinking-feedback.js';
import {taskFingerprint} from '../scripts/audit-evidence-expansion.mjs';
const reviewed=[["scaleMap37",0,"5cca4aa4ec9f1eca86da86325f3a4bb753072c571d93bc07922d3501639952c8"],["scaleMap37",1,"bf90e433c47ff8a8259f007a4008afac1c024932bb9b295da085b51f16be0817"],["scaleMap37",2,"abec9df4555bd8e90e058ec57fae2cdacf81c091b46b9dbdf4f1aef06a8a316d"],["scaleArea37",1,"3dce8b0f18028dd0e9a1e0da065693f094ac01c7ae1ce603f8dbd3a932a7ac6a"],["scaleArea37",2,"083683212922d73111a50ab7cfc19036ed25f172c5ad4e2b8123f14773120b77"]];
test('#284 exact source manifest and independent replay for five original native steps',()=>{
 const manifest=JSON.parse(readFileSync(new URL('../docs/spatial-learning/evidence-review-manifest.json',import.meta.url)));
 const rows=manifest.tasks.filter(x=>x.adapter==='ratiosteps');
 assert.equal(rows.length,5);
 assert.equal(EVIDENCE_ADAPTERS.filter(x=>x.id==='ratiosteps').length,1);
 assert.equal(new Set(reviewed.map(([id])=>LESSONS[id].topicId)).size,2);
 for(const [sessionId,index,taskHash] of reviewed){
  const task=sessionTaskFor(sessionId,index),context={sessionId,index},model=native.example(task);
  assert.equal(task.type,'x-r37-steps');
  assert.equal(taskFingerprint(task),taskHash,sessionId+':'+index);
  assert.deepEqual(rows.find(x=>x.sessionId===sessionId&&x.index===index),{
   sessionId,index,type:'x-r37-steps',nodeId:LESSONS[sessionId].topicId,
   adapter:'ratiosteps',taskHash,method:null
  });
  assert.equal(native.inspect(task,model).correct,true);
  assert.equal(ratioStepsBinding(task,context)?.nodeId,LESSONS[sessionId].topicId);
  assert.ok(replayRatioStepsEvidence(task,model,context));
  assert.ok(thinkingGuide(task,context)?.question);
  const record={support:false,attempts:[{value:structuredClone(model)}]};
  const feedback=thinkingFeedback(task,model,record,context);
  assert.ok(feedback?.observation.includes('平方'));
  assert.equal(feedback.method,null);
  assert.ok(feedback.detail.some(s=>s.includes('没有自动评定自主构思')));
  assert.equal(thinkingFeedback(task,model,{attempts:[]},context),null);
  assert.equal(thinkingFeedback(task,model,record,{sessionId,index:String(index)}),null);
  const changed=structuredClone(model);changed.history=[];
  assert.equal(thinkingFeedback(task,changed,record,context),null);
 }
});
test('#284 no other native step or linked exercise can claim strict map-area replay',()=>{
 const allowed=new Set(reviewed.map(([s,i])=>s+':'+i));
 for(const id of Object.keys(LESSONS))for(const [index,task] of (sessionTasks(id)||[]).entries())
  if(task.type==='x-r37-steps')assert.equal(!!ratioStepsBinding(task,{sessionId:id,index}),allowed.has(id+':'+index));
 for(const id of Object.keys(BRIDGES))for(const [index,task] of (sessionTasks(id)||[]).entries())
  if(task.type==='x-r37-steps')assert.equal(ratioStepsBinding(task,{sessionId:id,index}),null);
 const task=sessionTaskFor('scaleMap37',0);
 assert.equal(ratioStepsBinding(task),null);
 assert.equal(ratioStepsBinding({...task,prompt:task.prompt+' changed'},{sessionId:'scaleMap37',index:0}),null);
 assert.equal(ratioStepsBinding(task,{sessionId:'scaleArea37',index:0}),null);
});
