import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {sessionTaskFor} from '../dist/learning/bridges.js';
import * as b05 from '../dist/learning/phase4/b05-model.js';
import {P034_GROWING_SOURCES as sources,p034GrowingBinding as binding,
 replayP034GrowingEvidence as replay,submittedP034GrowingEvidence as submitted}
 from '../dist/learning/p034-native-growing-evidence.js';
const stable=x=>Array.isArray(x)?x.map(stable):x&&typeof x==='object'?
 Object.fromEntries(Object.keys(x).sort((a,b)=>a.localeCompare(b,'en')).map(k=>[k,stable(x[k])])):x;
test('P034 exactly the three original growing:0,1,2 positions, never source siblings',()=>{
 assert.deepEqual(sources.map(x=>x.position),['growing:0','growing:1','growing:2']);
});
for(const src of sources)test(src.position+' original task, independent six-term sequence and negative Checks',()=>{
 const ctx={sessionId:'growing',index:src.index},task=sessionTaskFor('growing',src.index);
 assert.equal(createHash('sha256').update(JSON.stringify(stable(task))).digest('hex'),src.taskHash);
 assert.equal(binding(task,ctx)?.nodeId,src.nodeId);
 assert.equal(binding(task,{sessionId:'growing',index:-1}),null);
 assert.equal(binding({...task,prompt:task.prompt+'x'},ctx),null);
 const good=b05.example(task),raw=JSON.stringify(good);
 assert.equal(b05.inspect(task,good).correct,true);
 const proof=replay(task,good,ctx);
 assert.ok(proof);
 assert.equal(proof.strictAApproved,false);
 assert.equal(proof.fullActionHistoryObserved,false);
 assert.equal(JSON.stringify(good),raw);
 const wrong=structuredClone(good);wrong.heights[5]--;
 assert.equal(submitted(task,good,{attempts:[{value:wrong}]},ctx),null,'stale Check');
 assert.deepEqual(submitted(task,good,{attempts:[{value:wrong},{value:structuredClone(good)}]},ctx),proof);
 for(const [label,change] of [
  ['forged step',m=>m.step='-0'],['wrong starting value',m=>m.start++],
  ['bad 5th term',m=>m.heights[4]++],['invented act history',m=>m.history=[]],
  ['wrong length',m=>m.heights.pop()],['forged prediction',m=>m.prediction=999]
 ]){
  const attempt=structuredClone(good);change(attempt);
  assert.equal(replay(task,attempt,ctx),null,label);
 }
});
