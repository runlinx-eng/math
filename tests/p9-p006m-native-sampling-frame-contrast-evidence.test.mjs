// #342 P006m source-locked original B21 sampling-frame contrast and negative replay.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {sessionTaskFor} from '../dist/learning/bridges.js';
import {LESSONS} from '../dist/learning/catalog.js';
import * as native from '../dist/learning/phase5/b21-model.js';
import {nativeSamplingFrameBinding,replayNativeSamplingFrames,
 submittedNativeSamplingFrames} from '../dist/learning/p006m-native-sampling-frame-contrast-evidence.js';

const ctx={sessionId:'fairdraw',index:1};
const hash='852bacf9fa85cb2853d9bcbb39f3c83135bbb5b8cc431e297dd55bd05143e321';
const stable=v=>Array.isArray(v)?v.map(stable):v&&typeof v==='object'?
 Object.fromEntries(Object.keys(v).sort((a,b)=>a.localeCompare(b,'en')).map(k=>[k,stable(v[k])])):v;
const digest=v=>createHash('sha256').update(JSON.stringify(stable(v))).digest('hex');
const task=sessionTaskFor('fairdraw',1);
function complete(wrong=false){
 const m=native.initial(task);
 for(let j=0;j<2;j++){
  native.act(task,m,'b21-draw');
  assert.ok(m.board.pending,'original B21 pending sample '+j);
  const p=m.board.pending;
  const sum=p.values.reduce((a,b)=>a+b,0);
  const target=Math.round((sum/p.n+Number.EPSILON)*10)/10;
  if(wrong&&j===0){
   m.estimate=String(target+1);
   native.act(task,m,'b21-record');
   assert.ok(m.issue,'wrong first estimate is rejected');
   assert.ok(m.board.pending,'failed record does not consume sample');
  }
  m.estimate=String(target);
  native.act(task,m,'b21-record');
  assert.equal(m.issue,'','correct estimate is recorded');
  assert.equal(m.board.runs.length,j+1);
 }
 task.questions.forEach((q,i)=>m.answers[i]=q.value[0]);
 return m;
}
test('P006m fairdraw:1 native source full SHA, two frames and corrected mathematics',()=>{
 console.log('P006M_NATIVE_FULL_TASK_SHA256 fairdraw:1 '+digest(task));
 assert.equal(digest(task),hash);
 assert.equal(LESSONS.fairdraw.topicId,'mt_4zgPzc6yu5');
 assert.equal(task.type,'x-samplelab');
 assert.deepEqual(nativeSamplingFrameBinding(task,ctx),{
  position:'fairdraw:1',sourceNodeId:'mt_4zgPzc6yu5',populationSize:800,
  perDrawSampleSize:20,methods:['club','all'],syntheticPopulation:true
 });
 for(const wrong of [false,true]){
  const m=complete(wrong);
  assert.equal(native.valid(task,m),true);
  assert.equal(native.inspect(task,m).correct,true);
  const proof=replayNativeSamplingFrames(task,m,ctx);
  assert.ok(proof,'independent frame replay');
  assert.deepEqual(proof.methods,['club','all']);
  assert.deepEqual(proof.sampleSizes,[20,20]);
  assert.deepEqual(proof.sampleMeans,m.board.runs.map(x=>x.estimate));
  assert.equal(proof.sampleIds[0].every(id=>id<=200),true);
  assert.equal(proof.sampleIds[1].every(id=>id<=800),true);
  assert.equal(proof.wrongEstimateThenCorrectionObserved,wrong);
  assert.equal(proof.observedRecordClicks,wrong?3:2);
  assert.equal(proof.singlePairProvesPopulationBias,false);
  assert.equal(proof.noRealRespondentsObserved,true);
  assert.equal(proof.strictAApproved,false);
  const record={attempts:[{value:structuredClone(m)}]};
  assert.ok(submittedNativeSamplingFrames(task,m,record,ctx));
  assert.equal(submittedNativeSamplingFrames(task,m,{attempts:[]},ctx),null);
 }
});
test('P006m fail-closed source, event sequence, forged sample, stale latest Check',()=>{
 const m=complete(true),record={attempts:[{value:structuredClone(m)}]};
 assert.ok(submittedNativeSamplingFrames(task,m,record,ctx));
 for(const c of [{sessionId:'fairdraw',index:0},{sessionId:'fairdraw',index:2},
  {sessionId:'fairdraw',index:'1'},{sessionId:'samplevary',index:1}]){
  assert.equal(replayNativeSamplingFrames(task,m,c),null);
 }
 for(const t of [{...task,prompt:task.prompt+'!'}, {...task,N:801},
  {...task,n:21},{...task,runs:1},{...task,seed:123},
  {...task,methods:['all','club']},{...task,mode:'proportion'},
  {...task,questions:task.questions.slice(1)}, {...task,profile:'sleep'}]){
  assert.equal(replayNativeSamplingFrames(t,m,ctx),null);
 }
 for(const attack of [
  x=>x.history.shift(),x=>x.history[0].a='record',
  x=>x.history[0].d.index='0',
  x=>x.history[1].f.estimate='not-a-number',
  x=>x.history[1].f.estimate=x.history[2].f.estimate,
  x=>x.history.push(structuredClone(x.history.at(-1))),
  x=>x.board.runs[0].method='all',
  x=>x.board.runs[1].method='club',
  x=>x.board.runs[0].ids[0]=700,
  x=>x.board.runs[1].ids[0]=9999,
  x=>x.board.runs[1].values[0]++,
  x=>x.board.runs[1].estimate++,
  x=>x.board.seed++,
  x=>x.board.pending={},
  x=>x.answers[0]='low',
  x=>x.estimate='999',
  x=>x.issue='forged',
  x=>x.researchClaim='representative',
  x=>x.board.realPeople=20
 ]){
  const fake=structuredClone(m);attack(fake);
  assert.equal(replayNativeSamplingFrames(task,fake,ctx),null,attack.toString());
 }
 const stale=structuredClone(record);
 stale.attempts[0].value.estimate='999';
 assert.equal(submittedNativeSamplingFrames(task,m,stale,ctx),null);
});
