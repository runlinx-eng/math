import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {EVIDENCE_ADAPTERS} from '../dist/learning/evidence-adapters.js';
import {LESSONS} from '../dist/learning/catalog.js';
import {BRIDGES,sessionTasks,sessionTaskFor} from '../dist/learning/bridges.js';
import * as native from '../dist/learning/phase5/b37-model.js';
import {ratioNotationBinding,replayRatioNotationEvidence} from '../dist/learning/rationotation-evidence.js';
import {thinkingFeedback,thinkingGuide} from '../dist/learning/thinking-feedback.js';
import {taskFingerprint} from '../scripts/audit-evidence-expansion.mjs';
const reviewed=[
 ['ratioNotation37',1,'ad19110a86afef2892af6e8be66de7c183c1ced41d187623cdb52874c48b9621'],
 ['ratioNotation37',2,'e5d2fd0622f4e630d95ed4314ca1c886eb173869e3f8289a38dc4a75185e30be']
];
test('#290 native fingerprints, exact reviewed source and truly checked feedback',()=>{
 const manifest=JSON.parse(readFileSync(new URL('../docs/spatial-learning/evidence-review-manifest.json',import.meta.url)));
 const rows=manifest.tasks.filter(r=>r.adapter==='rationotation');
 assert.equal(rows.length,2);
 assert.equal(EVIDENCE_ADAPTERS.filter(x=>x.id==='rationotation').length,1);
 const priorReviewedPair=manifest.tasks.find(x=>x.sessionId==='ratioNotation37'&&x.index===0);
 assert.equal(priorReviewedPair?.adapter,'ratiopair');
 assert.equal(priorReviewedPair?.nodeId,rows[0]?.nodeId,
  'new original ratio notation steps share an already reviewed source node; do not double-count nodes');
 const ids=EVIDENCE_ADAPTERS.filter(x=>x.type==='x-r37-steps').map(x=>x.id).sort();
 const manifestIds=[...new Set(manifest.tasks.filter(x=>x.type==='x-r37-steps').map(x=>x.adapter))].sort();
 assert.deepEqual(ids,manifestIds,'all shared step families require exact reviewed manifest membership');
 for(const [sessionId,index,hash] of reviewed){
  const task=sessionTaskFor(sessionId,index),ctx={sessionId,index},m=native.example(task);
  assert.equal(task.type,'x-r37-steps');
  assert.equal(taskFingerprint(task),hash);
  assert.deepEqual(rows.find(x=>x.sessionId===sessionId&&x.index===index),
   {sessionId,index,type:'x-r37-steps',nodeId:LESSONS[sessionId].topicId,
    adapter:'rationotation',taskHash:hash,method:null});
  assert.equal(native.inspect(task,m).correct,true);
  assert.ok(ratioNotationBinding(task,ctx)?.nodeId===LESSONS[sessionId].topicId);
  assert.ok(replayRatioNotationEvidence(task,m,ctx));
  assert.ok(thinkingGuide(task,ctx)?.question);
  const record={support:false,attempts:[{value:structuredClone(m)}]};
  const feedback=thinkingFeedback(task,m,record,ctx);
  assert.ok(feedback?.observation.includes('等值比'));
  assert.equal(feedback.method,null);
  assert.ok(feedback.detail.some(x=>x.includes('不自动评定自选倍数')));
  assert.equal(thinkingFeedback(task,m,{attempts:[]},ctx),null);
  const corrupted=structuredClone(m);corrupted.history=[];
  assert.equal(thinkingFeedback(task,corrupted,record,ctx),null);
 }
});
test('#290 no other native step or linked bridge inherits the ratio-notation contract',()=>{
 const eligible=new Set(reviewed.map(([s,i])=>s+':'+i));
 for(const sessionId of Object.keys(LESSONS))for(const [index,task] of (sessionTasks(sessionId)||[]).entries())
  if(task.type==='x-r37-steps')
   assert.equal(!!ratioNotationBinding(task,{sessionId,index}),eligible.has(sessionId+':'+index),sessionId+':'+index);
 for(const sessionId of Object.keys(BRIDGES))for(const [index,task] of (sessionTasks(sessionId)||[]).entries())
  if(task.type==='x-r37-steps')assert.equal(ratioNotationBinding(task,{sessionId,index}),null);
 const t=sessionTaskFor('ratioNotation37',1);
 assert.equal(ratioNotationBinding(t),null);
 assert.equal(ratioNotationBinding({...t,prompt:t.prompt+' forged'},{sessionId:'ratioNotation37',index:1}),null);
});
