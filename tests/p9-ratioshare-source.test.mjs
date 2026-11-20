import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {LESSONS} from '../dist/learning/catalog.js';
import {BRIDGES,sessionTasks,sessionTaskFor} from '../dist/learning/bridges.js';
import * as native from '../dist/learning/phase5/b37-model.js';
import {EVIDENCE_ADAPTERS} from '../dist/learning/evidence-adapters.js';
import {ratioShareBinding,replayRatioShareEvidence} from '../dist/learning/ratioshare-evidence.js';
import {taskFingerprint} from '../scripts/audit-evidence-expansion.mjs';
// Independently frozen original B37 source task values; not a runtime discovery list.
const reviewed=[
 [
  "ratioShare37",
  0,
  "4fe2a93628c3b9d1c6a1d389ee4ca5daaf88ab2d748cb85e31a267fa966c7c53"
 ],
 [
  "ratioShare37",
  1,
  "c654fe0d8b79210ece762fa1133bb8d082752a984b90f806246a60984f6f4b8d"
 ],
 [
  "ratioShare37",
  2,
  "09178b98f8059d88b76ad1d8c3461c864c1aaa10a90efab4916dfec1ac2e13ea"
 ],
 [
  "ratioDivide37",
  0,
  "75a73ed0787d0b6a3708bf84ae86a60e9cd2842573953e35e71c685df529d5de"
 ],
 [
  "ratioDivide37",
  1,
  "ab7284442b647c8ca705936775e9eeaa0c4fb496c423a4674483c9f2ed0094ae"
 ],
 [
  "ratioDivide37",
  2,
  "7e1cfdcf04357764bdfa0d4d05a4787ea3990315d322671e927d285fef7003ad"
 ]
];
const eligible=new Set(reviewed.map(([id,index])=>id+':'+index));
test('#280 six native source positions and complete original task digests',()=>{
 assert.equal(eligible.size,6);
 assert.equal(new Set(reviewed.map(([id])=>LESSONS[id].topicId)).size,2);
 for(const [id,index,digest] of reviewed){
  const task=sessionTaskFor(id,index),context={sessionId:id,index},before=JSON.stringify(task);
  assert.equal(task.type,'x-r37-share');
  assert.equal(Object.hasOwn(BRIDGES,id),false);
  assert.equal(taskFingerprint(task),digest,'independent original task fingerprint');
  assert.equal(ratioShareBinding(task,context)?.nodeId,LESSONS[id].topicId);
  assert.equal(native.valid(task,native.initial(task)),true);
  assert.equal(native.inspect(task,native.initial(task)).correct,false);
  assert.ok(replayRatioShareEvidence(task,native.example(task),context));
  assert.equal(JSON.stringify(task),before);
 }
});
test('#280 no other native or bridge with same widget is auto-promoted',()=>{
 for(const id of Object.keys(LESSONS))for(const [index,task] of (sessionTasks(id)||[]).entries()){
  if(task?.type!=='x-r37-share')continue;
  assert.equal(!!ratioShareBinding(task,{sessionId:id,index}),eligible.has(id+':'+index),id+':'+index);
 }
 for(const id of Object.keys(BRIDGES))for(const [index,task] of (sessionTasks(id)||[]).entries()){
  if(task?.type==='x-r37-share')assert.equal(ratioShareBinding(task,{sessionId:id,index}),null);
 }
});
test('#280 approved manifest contains exactly six unchanged reviewed sources',()=>{
 const manifest=JSON.parse(readFileSync(new URL('../docs/spatial-learning/evidence-review-manifest.json',import.meta.url)));
 const accepted=manifest.tasks.filter(x=>x.adapter==='ratioshare');
 assert.equal(accepted.length,6);
 for(const [sessionId,index,taskHash] of reviewed){
  assert.deepEqual(accepted.find(x=>x.sessionId===sessionId&&x.index===index),{
   sessionId,index,type:'x-r37-share',nodeId:LESSONS[sessionId].topicId,
   adapter:'ratioshare',taskHash,method:null
  });
 }
 assert.equal(EVIDENCE_ADAPTERS.filter(x=>x.type==='x-r37-share').length,1);
});
