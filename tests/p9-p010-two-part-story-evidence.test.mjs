import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {sessionTaskFor} from '../dist/learning/bridges.js';
import * as b05 from '../dist/learning/phase4/b05-model.js';
import {P010_TWO_PART_SOURCES as sources,p010TwoPartBinding as binding,
 replayP010TwoPartEvidence as replay,submittedP010TwoPartEvidence as submitted}
 from '../dist/learning/p010-two-part-story-evidence.js';
const stable=x=>Array.isArray(x)?x.map(stable):x&&typeof x==='object'?
 Object.fromEntries(Object.keys(x).sort((a,b)=>a.localeCompare(b,'en')).map(k=>[k,stable(x[k])])):x;
test('P010 two remaining original tasks only',()=>{
 assert.deepEqual(sources.map(s=>s.position),['represent:0','represent:1']);
});
for(const src of sources)test('P010 '+src.position+' full source, arithmetic, mistakes and stale Check',()=>{
 const context={sessionId:src.sessionId,index:src.index},task=sessionTaskFor(src.sessionId,src.index);
 assert.equal(createHash('sha256').update(JSON.stringify(stable(task))).digest('hex'),src.taskHash);
 assert.equal(binding(task,context)?.nodeId,src.nodeId);
 assert.equal(binding(task,{sessionId:'represent',index:1-src.index}),null);
 assert.equal(binding({...task,prompt:task.prompt+'X'},context),null);
 const correct=b05.example(task),snapshot=JSON.stringify(correct),proof=replay(task,correct,context);
 assert.ok(proof);
 assert.equal(proof.strictAApproved,false);
 assert.equal(proof.historicalOrderObserved,false);
 assert.equal(JSON.stringify(correct),snapshot);
 const wrong=structuredClone(correct);wrong.result=-1;
 assert.equal(submitted(task,correct,{attempts:[{value:wrong}]},context),null);
 assert.deepEqual(submitted(task,correct,{attempts:[{value:wrong},{value:structuredClone(correct)}]},context),proof);
 for(const [desc,change] of [
  ['wrong whole',m=>m.whole='first'],['wrong role',m=>m.role='total'],
  ['forged part',m=>m.a=0],['forged total',m=>m.total++],
  ['wrong equation',m=>m.result++],['extra history',m=>m.history=[]]
 ]){const work=structuredClone(correct);change(work);assert.equal(replay(task,work,context),null,desc);}
 if(task.missing){
  const alt=structuredClone(correct);
  Object.assign(alt,{first:task.a,op:'plus',second:task.b,result:task.total});
  assert.ok(b05.inspect(task,alt).correct);
  assert.ok(replay(task,alt,context),'original alternative valid addition retained');
 }
});
