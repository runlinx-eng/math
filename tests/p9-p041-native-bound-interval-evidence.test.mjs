import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {sessionTaskFor} from '../dist/learning/bridges.js';
import * as b08 from '../dist/learning/phase5/b08-model.js';
import {P041_BOUND_SOURCES,p041BoundBinding as binding,
 replayP041BoundEvidence as replay,submittedP041BoundEvidence as submitted}
 from '../dist/learning/p041-native-bound-interval-evidence.js';
const stable=x=>Array.isArray(x)?x.map(stable):x&&typeof x==='object'?
 Object.fromEntries(Object.keys(x).sort((a,b)=>a.localeCompare(b,'en')).map(k=>[k,stable(x[k])])):x;
test('P041 frozen inventory exactly estbounds:1 and :2, no x-roundwork sibling',()=>{
 assert.deepEqual(P041_BOUND_SOURCES.map(s=>s.position),['estbounds:1','estbounds:2']);
});
for(const s of P041_BOUND_SOURCES)test('P041 '+s.position+' independent endpoints, probe order, false Checks',()=>{
 const context={sessionId:s.sessionId,index:s.index},task=sessionTaskFor(s.sessionId,s.index);
 assert.equal(createHash('sha256').update(JSON.stringify(stable(task))).digest('hex'),s.taskHash);
 assert.equal(binding(task,context)?.nodeId,s.nodeId);
 assert.equal(binding(task,{sessionId:'estbounds',index:0}),null);
 assert.equal(binding({...task,prompt:task.prompt+'!'},context),null);
 const correct=b08.example(task),snapshot=JSON.stringify(correct),proof=replay(task,correct,context);
 assert.equal(b08.inspect(task,correct).correct,true);
 assert.ok(proof);
 assert.equal(proof.strictAApproved,false);
 assert.equal(proof.originalOrderedProbeRecords.length,2);
 assert.equal(proof.originalOrderedProbeRecords[0].inside,true);
 assert.equal(proof.originalOrderedProbeRecords[1].inside,false);
 assert.equal(JSON.stringify(correct),snapshot);
 const wrong=structuredClone(correct);wrong.right='closed';
 assert.equal(replay(task,wrong,context),null);
 assert.equal(submitted(task,correct,{attempts:[{value:wrong}]},context),null,'old wrong Check not valid');
 assert.deepEqual(submitted(task,correct,{attempts:[{value:wrong},{value:structuredClone(correct)}]},context),proof);
 for(const [label,change] of [
  ['lower incorrect',m=>m.low='0'],['upper incorrect',m=>m.high='999'],
  ['wrong left inclusion',m=>m.left='open'],['wrong upper inclusion',m=>m.right='closed'],
  ['missing low probe',m=>m.trials.shift()],['missing upper probe',m=>m.trials.pop()],
  ['false probe flag',m=>m.trials[0].inside=false],
  ['invented event detail',m=>m.trials[0].reason='math'],
  ['fake trace',m=>m.steps=[]]
 ]){const altered=structuredClone(correct);change(altered);assert.equal(replay(task,altered,context),null,label);}
});
