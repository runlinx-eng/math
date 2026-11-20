import test from 'node:test';
import assert from 'node:assert/strict';
import {LESSONS} from '../dist/learning/catalog.js';
import {BRIDGES,sessionTasks,sessionTaskFor} from '../dist/learning/bridges.js';
import * as native from '../dist/learning/phase5/b37-model.js';
import {ratioShapeBinding,replayRatioShapeEvidence} from '../dist/learning/ratioshape-evidence.js';
import {taskFingerprint} from '../scripts/audit-evidence-expansion.mjs';

// Five independently frozen existing native task digests. No bridge inheritance.
export const reviewed=[
 ['pctIdeas37',2,'68ce4e9f7f57f0887fd4961b56c9aa511ac775ad9e9d6f332b23eb50069aa97a'],
 ['recipeScale37',2,'b8c33afe27e8113c2df0d6219224f77a50faaf0ae56f47fcbfa43fa36909ccf0'],
 ['similar37',0,'ff7621db6a87718bf59a4c2d545cab909eb85e87af100a28b8f5c02a606a66b9'],
 ['similar37',2,'94e53fe969f56d86e4aaaf696645334e8d2ecc44bdfedc0538377cf58a40014d'],
 ['scaleArea37',0,'84f8a46d71de3c4bd6bc11fc90eabc87a6c57171a216d90db92976ff043ac06b']
];
test('#282 five native sources, original fingerprints and correct operation replay',()=>{
 assert.equal(new Set(reviewed.map(([id,index])=>id+':'+index)).size,5);
 assert.equal(new Set(reviewed.map(([id])=>LESSONS[id].topicId)).size,4);
 for(const [sessionId,index,digest] of reviewed){
  const task=sessionTaskFor(sessionId,index),context={sessionId,index},before=JSON.stringify(task);
  assert.equal(task.type,'x-r37-shape');
  assert.equal(Object.hasOwn(BRIDGES,sessionId),false);
  assert.equal(taskFingerprint(task),digest,sessionId+':'+index);
  assert.equal(ratioShapeBinding(task,context)?.nodeId,LESSONS[sessionId].topicId);
  assert.equal(native.inspect(task,native.initial(task)).correct,false);
  const model=native.example(task);
  assert.equal(native.valid(task,model),true);
  assert.equal(native.inspect(task,model).correct,true);
  assert.ok(replayRatioShapeEvidence(task,model,context),sessionId+':'+index);
  assert.equal(JSON.stringify(task),before);
 }
});
test('#282 no unrelated native or bridge automatically inherits the adapter',()=>{
 const eligible=new Set(reviewed.map(([id,index])=>id+':'+index));
 for(const sessionId of Object.keys(LESSONS))
  for(const [index,task] of (sessionTasks(sessionId)||[]).entries()){
   if(task.type==='x-r37-shape')
    assert.equal(!!ratioShapeBinding(task,{sessionId,index}),eligible.has(sessionId+':'+index));
  }
 for(const sessionId of Object.keys(BRIDGES))
  for(const [index,task] of (sessionTasks(sessionId)||[]).entries())
   if(task.type==='x-r37-shape')
    assert.equal(ratioShapeBinding(task,{sessionId,index}),null);
 for(const [sessionId,index] of reviewed){
  const task=sessionTaskFor(sessionId,index),model=native.example(task);
  assert.equal(ratioShapeBinding(task),null);
  assert.equal(replayRatioShapeEvidence(task,model,{sessionId,index:String(index)}),null);
  const altered={...task,prompt:task.prompt+' changed'};
  assert.equal(ratioShapeBinding(altered,{sessionId,index}),null);
 }
});
