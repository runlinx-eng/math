import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {sessionTaskFor} from '../dist/learning/bridges.js';
import * as b05 from '../dist/learning/phase4/b05-model.js';
import {P030_BALANCE_SOURCES as sources,p030BalanceBinding as binding,
 replayP030BalanceEvidence as replay,submittedP030BalanceEvidence as submitted}
 from '../dist/learning/p030-native-balance-evidence.js';
const stable=x=>Array.isArray(x)?x.map(stable):x&&typeof x==='object'?
 Object.fromEntries(Object.keys(x).sort((a,b)=>a.localeCompare(b,'en')).map(k=>[k,stable(x[k])])):x;
test('P030 source inventory is exactly three original equality B05 positions',()=>{
 assert.deepEqual(sources.map(x=>x.position),['equality:0','equality:1','equality:2']);
});
for(const src of sources)test('P030 '+src.position+' independent relation, snapshots, stale Check and wrong task',()=>{
 const context={sessionId:src.sessionId,index:src.index},task=sessionTaskFor('equality',src.index);
 assert.equal(createHash('sha256').update(JSON.stringify(stable(task))).digest('hex'),src.taskHash);
 assert.equal(binding(task,context)?.nodeId,src.nodeId);
 assert.equal(binding(task,{sessionId:'equality',index:3}),null);
 assert.equal(binding({...task,prompt:task.prompt+'X'},context),null);
 const good=b05.example(task),saved=JSON.stringify(good);
 assert.equal(b05.inspect(task,good).correct,true);
 const proof=replay(task,good,context);
 assert.ok(proof);
 assert.equal(proof.individualBeadClickChronologyObserved,false);
 assert.equal(proof.strictAApproved,false);
 assert.equal(JSON.stringify(good),saved);
 const wrong=structuredClone(good);wrong.symbol=good.symbol==='equal'?'different':'equal';
 assert.equal(submitted(task,good,{attempts:[{value:wrong}]},context),null,'stale Check');
 assert.deepEqual(submitted(task,good,{attempts:[{value:wrong},{value:structuredClone(good)}]},context),proof);
 for(const [label,mutate] of [
  ['wrong left beads',m=>m.left++],['wrong right beads',m=>m.right++],
  ['wrong final prediction',m=>m.guess=m.guess==='level'?'left':'level'],
  ['no release',m=>m.released=false],
  ['wrong release relation',m=>m.runs[0].guess='right'],
  ['forged release record',m=>m.runs[0].extra=1],
  ['fake action history',m=>m.history=[]]
 ]){
  const attempt=structuredClone(good);mutate(attempt);
  assert.equal(replay(task,attempt,context),null,label);
 }
});
