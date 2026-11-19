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
test('#273 first-stage replay has no strict A manifest admission or shared feedback registration',()=>{
 const manifest=JSON.parse(readFileSync(new URL('../docs/spatial-learning/evidence-review-manifest.json',import.meta.url)));
 for(const [id,index] of sources){
  assert.equal(manifest.tasks.some(t=>t.sessionId===id&&t.index===index),false);
 }
 assert.equal(EVIDENCE_ADAPTERS.some(a=>a.type==='x-t32-compare'),false);
});
