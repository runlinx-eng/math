import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {sessionTaskFor} from '../dist/learning/bridges.js';
import * as b05 from '../dist/learning/phase4/b05-model.js';
import {P038_UNKNOWN_SOURCES,p038UnknownBinding as binding,
 replayP038UnknownEvidence as replay,submittedP038UnknownEvidence as submitted}
 from '../dist/learning/p038-native-unknown-evidence.js';
const canonical=x=>Array.isArray(x)?x.map(canonical):x&&typeof x==='object'?
 Object.fromEntries(Object.keys(x).sort((a,b)=>a.localeCompare(b,'en')).map(k=>[k,canonical(x[k])])):x;
test('P038 exactly 3 original B05 x-unknown positions, never same-widget siblings',()=>{
 assert.deepEqual(P038_UNKNOWN_SOURCES.map(x=>x.position),['unknown:0','unknown:1','unknown:2']);
 assert.equal(new Set(P038_UNKNOWN_SOURCES.map(x=>x.position)).size,3);
});
for(const src of P038_UNKNOWN_SOURCES)test(src.position+' native source, independent equation and stale Check',()=>{
 const ctx={sessionId:src.sessionId,index:src.index};
 const task=sessionTaskFor(src.sessionId,src.index);
 assert.equal(createHash('sha256').update(JSON.stringify(canonical(task))).digest('hex'),src.taskHash);
 assert.equal(binding(task,ctx)?.nodeId,src.nodeId);
 assert.equal(binding(task,{sessionId:src.sessionId,index:99}),null);
 assert.equal(binding({...task,label:task.label+' wrong'},ctx),null);
 const good=b05.example(task),raw=JSON.stringify(good);
 assert.equal(b05.inspect(task,good).correct,true);
 const proof=replay(task,good,ctx);
 assert.ok(proof,'independent same equation and original grader');
 assert.equal(proof.strictAApproved,false);
 assert.equal(proof.actionChronologyObserved,false);
 assert.equal(JSON.stringify(good),raw,'replay never writes user State-v2');
 const bad=structuredClone(good);bad.written=good.written+1;
 assert.equal(submitted(task,good,{attempts:[{value:bad}]},ctx),null,'old Check rejected');
 assert.deepEqual(submitted(task,good,{attempts:[{value:bad},{value:structuredClone(good)}]},ctx),proof);
 for(const [label,mutate] of [
  ['wrong box',m=>m.box=0],['wrong written answer',m=>m.written++],
  ['not substituted',m=>m.checked=false],['unexpected extra history',m=>m.events=[]],
  ['misplaced field',m=>m.answer=good.box]
 ]){
  const model=structuredClone(good);mutate(model);
  assert.equal(replay(task,model,ctx),null,label);
 }
});
