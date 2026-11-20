// #273: the original native positions are fixed, bridge variants are excluded.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {LESSONS} from '../dist/learning/catalog.js';
import {BRIDGES,sessionTaskFor,sessionTasks} from '../dist/learning/bridges.js';
import * as original from '../dist/learning/phase5/b32-model.js';
import {EVIDENCE_ADAPTERS} from '../dist/learning/evidence-adapters.js';
import {timeCompareBinding,replayTimeCompareEvidence}
 from '../dist/learning/timecompare-evidence.js';
import {taskFingerprint} from '../scripts/audit-evidence-expansion.mjs';

const sources=[['timecompare',0],['timecompare',1],['timecompare',2],
 ['durationorder',1],['durationwork',1],['minuteclock',2]];
const eligible=new Set(sources.map(([id,index])=>id+':'+index));

test('#273 six existing unreviewed native comparison positions, four distinct source nodes',()=>{
 assert.equal(eligible.size,6);
 assert.equal(new Set(sources.map(([id])=>LESSONS[id].topicId)).size,4);
 const records=[];
 for(const [id,index] of sources){
  const task=sessionTaskFor(id,index);
  assert.equal(task.type,'x-t32-compare',id+':'+index);
  assert.equal(Object.hasOwn(BRIDGES,id),false);
  const before=JSON.stringify(task);
  const context={sessionId:id,index};
  const binding=timeCompareBinding(task,context);
  assert.equal(binding?.nodeId,LESSONS[id].topicId);
  assert.equal(binding?.method,null);
  assert.ok(binding.question);
  assert.equal(original.valid(task,original.initial(task)),true);
  assert.equal(original.inspect(task,original.initial(task)).correct,false);
  const replay=replayTimeCompareEvidence(task,original.example(task),context);
  assert.ok(replay);
  records.push({sessionId:id,index,taskHash:taskFingerprint(task)});
  assert.equal(JSON.stringify(task),before);
 }
 console.log('TIME_COMPARE_SOURCE_REVIEW_CANDIDATES '+JSON.stringify(records));
});
test('#273 all same-type native and bridge positions are source-scoped without inheritance',()=>{
 for(const id of Object.keys(LESSONS)){
  for(const [index,task] of (sessionTasks(id)||[]).entries()){
   if(task?.type!=='x-t32-compare')continue;
   const eligibleHere=eligible.has(id+':'+index);
   assert.equal(!!timeCompareBinding(task,{sessionId:id,index}),eligibleHere,
    id+':'+index);
  }
 }
 for(const id of Object.keys(BRIDGES)){
  for(const [index,task] of (sessionTasks(id)||[]).entries()){
   if(task?.type!=='x-t32-compare')continue;
   assert.equal(timeCompareBinding(task,{sessionId:id,index}),null);
  }
 }
});
test('#273 immutable reviewed source fingerprints admit exactly the six native positions',()=>{
 const manifest=JSON.parse(readFileSync(new URL('../docs/spatial-learning/evidence-review-manifest.json',import.meta.url)));
 assert.equal(manifest.tasks.filter(t=>t.adapter==='timecompare').length,6);
 for(const [sessionId,index] of sources){
  const item={sessionId,index,type:'x-t32-compare',
   nodeId:LESSONS[sessionId].topicId,adapter:'timecompare',
   taskHash:taskFingerprint(sessionTaskFor(sessionId,index)),method:null};
  assert.deepEqual(manifest.tasks.find(t=>t.adapter==='timecompare'&&
    t.sessionId===sessionId&&t.index===index),item);
 }
 assert.equal(EVIDENCE_ADAPTERS.filter(a=>a.type==='x-t32-compare').length,1);
});
