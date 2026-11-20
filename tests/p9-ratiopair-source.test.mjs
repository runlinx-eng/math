import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {LESSONS} from '../dist/learning/catalog.js';
import {BRIDGES,sessionTasks,sessionTaskFor} from '../dist/learning/bridges.js';
import * as native from '../dist/learning/phase5/b37-model.js';
import {EVIDENCE_ADAPTERS} from '../dist/learning/evidence-adapters.js';
import {ratioPairBinding,replayRatioPairEvidence} from '../dist/learning/ratiopair-evidence.js';
import {taskFingerprint} from '../scripts/audit-evidence-expansion.mjs';

const sources=[
 ['pctIdeas37',0],
 ['ratioProblem37',0],['ratioProblem37',1],['ratioProblem37',2],
 ['rateWords37',0],['rateWords37',1],
 ['ratioNotation37',0],
 ['proportion37',0],['proportion37',1],
 ['ratioLink37',0],['ratioLink37',1],
 ['recipeScale37',0],['recipeScale37',1]
];
const eligible=new Set(sources.map(([id,index])=>id+':'+index));
test('#276 exactly 13 existing ratio source positions, no manufactured task',()=>{
 assert.equal(eligible.size,13);
 assert.equal(new Set(sources.map(([id])=>LESSONS[id].topicId)).size,7);
 const records=[];
 for(const [id,index] of sources){
  const task=sessionTaskFor(id,index),context={sessionId:id,index};
  assert.equal(task.type,'x-r37-pair');
  assert.equal(Object.hasOwn(BRIDGES,id),false);
  const before=JSON.stringify(task);
  const source=ratioPairBinding(task,context);
  assert.equal(source?.nodeId,LESSONS[id].topicId);
  assert.equal(source?.method,null);
  assert.ok(source?.question);
  assert.equal(native.valid(task,native.initial(task)),true);
  assert.equal(native.inspect(task,native.initial(task)).correct,false);
  const p=replayRatioPairEvidence(task,native.example(task),context);
  assert.ok(p,'actual original operations must mathematically reconstruct');
  assert.equal(p.nodeId,source.nodeId);
  assert.equal(JSON.stringify(task),before);
  records.push({sessionId:id,index,taskHash:taskFingerprint(task)});
 }
 console.log('RATIO_PAIR_SOURCE_REVIEW_CANDIDATES '+JSON.stringify(records));
});
test('#276 all unreviewed native pair positions and bridges remain excluded',()=>{
 for(const id of Object.keys(LESSONS)){
  for(const [index,task] of (sessionTasks(id)||[]).entries()){
   if(task?.type!=='x-r37-pair')continue;
   assert.equal(!!ratioPairBinding(task,{sessionId:id,index}),eligible.has(id+':'+index),
    id+':'+index);
  }
 }
 for(const id of Object.keys(BRIDGES)){
  for(const [index,task] of (sessionTasks(id)||[]).entries()){
   if(task?.type!=='x-r37-pair')continue;
   assert.equal(ratioPairBinding(task,{sessionId:id,index}),null);
  }
 }
});
test('#276 stage 1 alone grants no A rating and no shared learning feedback',()=>{
 const manifest=JSON.parse(readFileSync(new URL('../docs/spatial-learning/evidence-review-manifest.json',import.meta.url)));
 assert.equal(manifest.tasks.length,714);
 for(const [sessionId,index] of sources)assert.equal(
  manifest.tasks.some(x=>x.sessionId===sessionId&&x.index===index),false);
 assert.equal(EVIDENCE_ADAPTERS.some(x=>x.type==='x-r37-pair'),false);
});
