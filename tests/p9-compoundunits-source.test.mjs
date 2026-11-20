import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {EVIDENCE_ADAPTERS} from '../dist/learning/evidence-adapters.js';
import {LESSONS} from '../dist/learning/catalog.js';
import {BRIDGES,sessionTasks,sessionTaskFor} from '../dist/learning/bridges.js';
import * as native from '../dist/learning/phase5/b37-model.js';
import {compoundUnitsBinding,replayCompoundUnitsEvidence} from '../dist/learning/compoundunits-evidence.js';
import {thinkingFeedback,thinkingGuide} from '../dist/learning/thinking-feedback.js';
import {taskFingerprint} from '../scripts/audit-evidence-expansion.mjs';
const reviewed=[
 [0,'69272359c602558a94244a1294c6bf653d993e02331f615a859687154687dc72'],
 [2,'0f71251781e1a412d7a3fa45b64f5747c95862ab82c0333f0fb5c60f54f6a165'],
 [3,'951af1b4390e88b9c8ccebb2f857d7cfc362de9fcf77249288c2d49ee6734801']
];
test('#292 exactly three original source fingerprints and strictly checked feedback',()=>{
 const manifest=JSON.parse(readFileSync(new URL('../docs/spatial-learning/evidence-review-manifest.json',import.meta.url)));
 const rows=manifest.tasks.filter(x=>x.adapter==='compoundunits');
 assert.equal(rows.length,3);
 assert.equal(EVIDENCE_ADAPTERS.filter(x=>x.id==='compoundunits').length,1);
 assert.equal(new Set(rows.map(x=>x.nodeId)).size,1);
 const ids=EVIDENCE_ADAPTERS.filter(x=>x.type==='x-r37-steps').map(x=>x.id).sort();
 const approved=[...new Set(manifest.tasks.filter(x=>x.type==='x-r37-steps').map(x=>x.adapter))].sort();
 assert.deepEqual(ids,approved,'all shared widget contracts must exactly match independently reviewed manifest');
 for(const [index,hash] of reviewed){
  const sessionId='rateUnit37',task=sessionTaskFor(sessionId,index),context={sessionId,index};
  const model=native.example(task);
  assert.equal(taskFingerprint(task),hash);
  assert.deepEqual(rows.find(x=>x.sessionId===sessionId&&x.index===index),
   {sessionId,index,type:'x-r37-steps',nodeId:LESSONS[sessionId].topicId,
    adapter:'compoundunits',taskHash:hash,method:null});
  assert.equal(native.inspect(task,model).correct,true);
  assert.ok(compoundUnitsBinding(task,context));
  assert.ok(replayCompoundUnitsEvidence(task,model,context));
  assert.ok(thinkingGuide(task,context)?.question);
  const record={support:false,attempts:[{value:structuredClone(model)}]};
  const feedback=thinkingFeedback(task,model,record,context);
  assert.ok(feedback?.observation.includes('速度或密度'));
  assert.equal(feedback.method,null);
  assert.ok(feedback.detail.some(x=>x.includes('不自动认定学生自选策略')));
  assert.equal(thinkingFeedback(task,model,{attempts:[]},context),null);
  const corrupted=structuredClone(model);corrupted.history=[];
  assert.equal(thinkingFeedback(task,corrupted,record,context),null);
 }
});
test('#292 unrelated original controls, cross-source steps and bridges remain excluded',()=>{
 const eligible=new Set(reviewed.map(([i])=>'rateUnit37:'+i));
 for(const sessionId of Object.keys(LESSONS))for(const [index,task] of (sessionTasks(sessionId)||[]).entries())
  if(task.type==='x-r37-steps')
   assert.equal(!!compoundUnitsBinding(task,{sessionId,index}),eligible.has(sessionId+':'+index),sessionId+':'+index);
 for(const sessionId of Object.keys(BRIDGES))for(const [index,task] of (sessionTasks(sessionId)||[]).entries())
  if(task.type==='x-r37-steps')assert.equal(compoundUnitsBinding(task,{sessionId,index}),null);
 const t=sessionTaskFor('rateUnit37',0);
 assert.equal(compoundUnitsBinding(t),null);
 assert.equal(compoundUnitsBinding({...t,prompt:t.prompt+' forged'},{sessionId:'rateUnit37',index:0}),null);
 assert.equal(compoundUnitsBinding(sessionTaskFor('rateUnit37',1),{sessionId:'rateUnit37',index:1}),null);
});
