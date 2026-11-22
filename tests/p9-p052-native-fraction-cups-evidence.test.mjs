import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {sessionTaskFor} from '../dist/learning/bridges.js';
import {exampleModel,inspect} from '../dist/learning/tasks.js';
import {P052_CUPS_SOURCE,p052CupsBinding as binding,
 replayP052CupsEvidence as replay,submittedP052CupsEvidence as submitted}
 from '../dist/learning/p052-native-fraction-cups-evidence.js';
const stable=x=>Array.isArray(x)?x.map(stable):x&&typeof x==='object'?
 Object.fromEntries(Object.keys(x).sort((a,b)=>a.localeCompare(b,'en')).map(k=>[k,stable(x[k])])):x;
const context={sessionId:'quarters',index:1},task=sessionTaskFor('quarters',1);
test('P052 only frozen original quarters:1 source and task fingerprint',()=>{
 assert.equal(createHash('sha256').update(JSON.stringify(stable(task))).digest('hex'),
  P052_CUPS_SOURCE.taskHash);
 assert.equal(binding(task,context)?.nodeId,P052_CUPS_SOURCE.nodeId);
 assert.equal(binding(sessionTaskFor('quarters',0),context),null);
 assert.equal(binding(task,{sessionId:'quarters',index:0}),null);
 assert.equal(binding({...task,prompt:task.prompt+'X'},context),null);
 assert.equal(binding({...task,fractions:[[1,2],[3,4],[1,2]]},context),null);
});
test('P052 independently verifies 50%,75%,25% and 0.5,0.75,0.25',()=>{
 const good=exampleModel(task),before=JSON.stringify(good);
 assert.equal(inspect(task,good).correct,true);
 const proof=replay(task,good,context);
 assert.ok(proof);
 assert.deepEqual(proof.observedCups.map(x=>x.heightPercentage),[50,75,25]);
 assert.equal(proof.originalHeightMovementChronologyObserved,false);
 assert.equal(proof.strictAApproved,false);
 assert.equal(JSON.stringify(good),before);
 const wrong=structuredClone(good);wrong.names[0]='0.1';
 assert.equal(submitted(task,good,{attempts:[{value:wrong}]},context),null,'stale Check');
 assert.deepEqual(submitted(task,good,{attempts:[{value:wrong},{value:structuredClone(good)}]},context),proof);
 for(const [label,mutate] of [
  ['incorrect height',m=>m.heights[0]=45],['incorrect decimal',m=>m.names[1]='0.7'],
  ['swapped cup names',m=>m.names.reverse()],['not all cups',m=>m.names.pop()],
  ['forged event trace',m=>m.moves=[]],['decimal no units',m=>m.names[2]='1/4'],
  ['invalid decimal',m=>m.names[0]='0.5e0']
 ]){
  const bad=structuredClone(good);mutate(bad);
  assert.equal(replay(task,bad,context),null,label);
 }
});
