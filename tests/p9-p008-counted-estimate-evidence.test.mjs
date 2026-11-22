import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {sessionTaskFor} from '../dist/learning/bridges.js';
import * as b07 from '../dist/learning/phase5/b07-model.js';
import {P008_COUNTED_ESTIMATE_SOURCE as source,p008CountedEstimateBinding as binding,
 replayP008CountedEstimateEvidence as replay,submittedP008CountedEstimateEvidence as submitted}
 from '../dist/learning/p008-counted-estimate-evidence.js';
const context={sessionId:'faces100',index:2},task=sessionTaskFor('faces100',2);
const stable=x=>Array.isArray(x)?x.map(stable):x&&typeof x==='object'?
 Object.fromEntries(Object.keys(x).sort((a,b)=>a.localeCompare(b,'en')).map(k=>[k,stable(x[k])])):x;
const copy=x=>structuredClone(x);
test('P008 faces100:2 original task fingerprint and exact native source',()=>{
 assert.equal(createHash('sha256').update(JSON.stringify(stable(task))).digest('hex'),source.taskHash);
 assert.equal(source.nodeId,'mt_9L3NQqgqRd');
 assert.ok(binding(task,context));
 assert.equal(binding(task,{sessionId:'faces100',index:1}),null);
 assert.equal(binding(task,{sessionId:'faces100',index:-1}),null);
 assert.equal(binding(task,{sessionId:'link-faces100',index:2}),null);
 assert.equal(binding({...task,prompt:task.prompt+'other'},context),null);
 assert.equal(binding({...task,n:39},context),null);
 assert.equal(binding(sessionTaskFor('faces100',1),context),null);
});
test('P008 original estimate saved first, all 38 selected once; no invented tap sequence',()=>{
 const model=b07.initial(task);
 model.guess=35;b07.act(task,model,'pv-predict');
 assert.equal(replay(task,model,context),null,'must count first');
 for(let index=0;index<task.n;index++)b07.act(task,model,'pv-tap',{index});
 model.answer=38;
 assert.equal(b07.inspect(task,model).correct,true);
 const snapshot=JSON.stringify(model),proof=replay(task,model,context);
 assert.ok(proof);
 assert.equal(proof.savedEstimate,35);
 assert.equal(proof.countedTotal,38);
 assert.equal(proof.strictAApproved,false);
 assert.equal(proof.originalDotSelectionChronologyObserved,false);
 assert.equal(JSON.stringify(model),snapshot,'read-only evidence');
 const wrong=copy(model);wrong.answer=37;
 assert.equal(replay(task,wrong,context),null);
 assert.equal(submitted(task,model,{attempts:[{value:wrong}]},context),null,'stale wrong Check');
 assert.deepEqual(submitted(task,model,{attempts:[{value:wrong},{value:copy(model)}]},context),proof);
 for(const [name,change] of [
  ['missing dot',m=>m.taps.pop()],
  ['duplicate dot',m=>m.taps[0]=m.taps[1]],
  ['wrong dot',m=>m.taps[0]=38],
  ['no committed guess',m=>m.committed=null],
  ['forged later guess',m=>m.guess=37],
  ['incorrect number',m=>m.answer=37],
  ['extra fabricated history',m=>m.history=[]]
 ]){
  const changed=copy(model);change(changed);
  assert.equal(replay(task,changed,context),null,name);
 }
});
