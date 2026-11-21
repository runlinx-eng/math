import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {EVIDENCE_ADAPTERS} from '../dist/learning/evidence-adapters.js';
import {LESSONS} from '../dist/learning/catalog.js';
import {BRIDGES,sessionTasks,sessionTaskFor} from '../dist/learning/bridges.js';
import * as native from '../dist/learning/phase5/b37-model.js';
import {unitConversionsBinding,replayUnitConversionsEvidence} from '../dist/learning/unitconversions-evidence.js';
import {thinkingFeedback,thinkingGuide} from '../dist/learning/thinking-feedback.js';
import {taskFingerprint} from '../scripts/audit-evidence-expansion.mjs';
const reviewed=[
 [0,'24f154fec9c36094a2249fb518bf4a5c283d51f37a267192a472ee6003168bdf'],
 [1,'24b5d85e4f40eea79a66c9c347a66b4fb92d78dbbc73e9a1407aab63169c45ca'],
 [2,'b9921e9e531986a88daa969ca4740e1fe0b0963d4a70902864a71e66ed9ea3e2']
];
test('#294 exactly three original source fingerprints and strictly checked feedback',()=>{
 const manifest=JSON.parse(readFileSync(new URL('../docs/spatial-learning/evidence-review-manifest.json',import.meta.url)));
 const rows=manifest.tasks.filter(x=>x.adapter==='unitconversions');
 assert.equal(rows.length,3);
 assert.equal(EVIDENCE_ADAPTERS.filter(x=>x.id==='unitconversions').length,1);
 assert.equal(new Set(rows.map(x=>x.nodeId)).size,1);
 const ids=EVIDENCE_ADAPTERS.filter(x=>x.type==='x-r37-steps').map(x=>x.id).sort();
 const approved=[...new Set(manifest.tasks.filter(x=>x.type==='x-r37-steps'&&!x.adapter.startsWith('issue341-')).map(x=>x.adapter))].sort();
 assert.deepEqual(ids,approved,'all shared widget contracts must exactly match independently reviewed manifest');
 for(const [index,hash] of reviewed){
  const sessionId='convertUnits37',task=sessionTaskFor(sessionId,index),context={sessionId,index};
  const model=native.example(task);
  assert.equal(taskFingerprint(task),hash);
  assert.deepEqual(rows.find(x=>x.sessionId===sessionId&&x.index===index),
   {sessionId,index,type:'x-r37-steps',nodeId:LESSONS[sessionId].topicId,
    adapter:'unitconversions',taskHash:hash,method:null});
  assert.equal(native.inspect(task,model).correct,true);
  assert.ok(unitConversionsBinding(task,context));
  assert.ok(replayUnitConversionsEvidence(task,model,context));
  assert.ok(thinkingGuide(task,context)?.question);
  const record={support:false,attempts:[{value:structuredClone(model)}]};
  const feedback=thinkingFeedback(task,model,record,context);
  assert.ok(feedback?.observation.includes('单位换算'));
  assert.equal(feedback.method,null);
  assert.ok(feedback.detail.some(x=>x.includes('不自动评价自主策略、单位解释、实际测量或长期理解')),
   'feedback must explicitly avoid inferring independent strategy, unit explanation, measurement or mastery');
  assert.equal(thinkingFeedback(task,model,{attempts:[]},context),null);
  const corrupted=structuredClone(model);corrupted.history=[];
  assert.equal(thinkingFeedback(task,corrupted,record,context),null);
 }
});
test('#294 unrelated original controls, cross-source steps and bridges remain excluded',()=>{
 const eligible=new Set(reviewed.map(([i])=>'convertUnits37:'+i));
 for(const sessionId of Object.keys(LESSONS))for(const [index,task] of (sessionTasks(sessionId)||[]).entries())
  if(task.type==='x-r37-steps')
   assert.equal(!!unitConversionsBinding(task,{sessionId,index}),eligible.has(sessionId+':'+index),sessionId+':'+index);
 for(const sessionId of Object.keys(BRIDGES))for(const [index,task] of (sessionTasks(sessionId)||[]).entries())
  if(task.type==='x-r37-steps')assert.equal(unitConversionsBinding(task,{sessionId,index}),null);
 const t=sessionTaskFor('convertUnits37',0);
 assert.equal(unitConversionsBinding(t),null);
 assert.equal(unitConversionsBinding({...t,prompt:t.prompt+' forged'},{sessionId:'convertUnits37',index:0}),null);
 assert.equal(unitConversionsBinding(sessionTaskFor('rateUnit37',1),{sessionId:'rateUnit37',index:1}),null);
});
