// #342 P006n: exact original five-draw B21 probability replay and rejection tests.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {sessionTaskFor} from '../dist/learning/bridges.js';
import {LESSONS} from '../dist/learning/catalog.js';
import * as native from '../dist/learning/phase5/b21-model.js';
import {nativeRepeatSamplingBinding,replayNativeRepeatSampling,
 submittedNativeRepeatSampling} from '../dist/learning/p006n-native-repeat-sampling-evidence.js';

const ctx={sessionId:'samplevary',index:0};
const stable=v=>Array.isArray(v)?v.map(stable):v&&typeof v==='object'?
 Object.fromEntries(Object.keys(v).sort((a,b)=>a.localeCompare(b,'en')).map(k=>[k,stable(v[k])])):v;
const digest=v=>createHash('sha256').update(JSON.stringify(stable(v))).digest('hex');
const task=sessionTaskFor(ctx.sessionId,ctx.index);
function complete(wrong=false){
 const model=native.initial(task);
 for(let i=0;i<5;i++){
  native.act(task,model,'b21-draw');
  assert.ok(model.board.pending,'native draw '+i);
  const pending=model.board.pending;
  const sum=pending.values.reduce((a,b)=>a+b,0);
  const correct=Math.round((sum/pending.n*100+Number.EPSILON)*10)/10;
  if(wrong&&i===0){
   model.estimate=String(correct+1);
   native.act(task,model,'b21-record');
   assert.ok(model.issue,'wrong estimate rejected');
   assert.ok(model.board.pending,'failed record retains pending draw');
  }
  model.estimate=String(correct);
  native.act(task,model,'b21-record');
  assert.equal(model.issue,'','correct record accepted');
  assert.equal(model.board.runs.length,i+1);
 }
 model.answers[0]='chance';
 return model;
}
test('P006n original B21 source, complete SHA, repeated draws and variation',()=>{
 console.log('P006N_NATIVE_FULL_TASK_SHA256 samplevary:0 '+digest(task));
 assert.equal(digest(task),'66b47f1c9c7dd633e5538f40852a8bd12561d5a077633717a5f01cf03b3bb546');
 assert.equal(LESSONS.samplevary.topicId,'mt_x7V1qrkiqH');
 assert.equal(task.type,'x-samplelab');
 assert.equal(task.N,80);assert.equal(task.n,20);
 assert.equal(task.runs,5);
 assert.deepEqual(nativeRepeatSamplingBinding(task,ctx),{
  position:'samplevary:0',sourceNodeId:'mt_x7V1qrkiqH',
  populationSize:80,perDrawSize:20,drawCount:5,
  mode:'proportion',syntheticPopulation:true
 });
 for(const wrong of [false,true]){
  const model=complete(wrong);
  assert.equal(native.valid(task,model),true);
  assert.equal(native.inspect(task,model).correct,true);
  const proof=replayNativeRepeatSampling(task,model,ctx);
  assert.ok(proof,'independent all-five replay');
  assert.deepEqual(proof.samplePercentages,model.board.runs.map(x=>x.estimate));
  assert.equal(proof.sampleIds.length,5);
  assert.ok(proof.sampleIds.every(ids=>ids.length===20&&new Set(ids).size===20));
  assert.equal(proof.observedDrawClicks,5);
  assert.equal(proof.observedRecordClicks,wrong?6:5);
  assert.equal(proof.wrongEstimateThenCorrectionObserved,wrong);
  assert.equal(proof.realRespondentsObserved,false);
  assert.equal(proof.noFutureSampleRangeGuarantee,true);
  assert.equal(proof.strictAApproved,false);
  assert.ok(submittedNativeRepeatSampling(task,model,
   {attempts:[{value:structuredClone(model)}]},ctx));
  assert.equal(submittedNativeRepeatSampling(task,model,{attempts:[]},ctx),null);
 }
});
test('P006n fake source, altered math, forged sequence and stale Check fail closed',()=>{
 const model=complete(true),record={attempts:[{value:structuredClone(model)}]};
 assert.ok(submittedNativeRepeatSampling(task,model,record,ctx));
 for(const context of [{sessionId:'samplevary',index:1},
  {sessionId:'samplevary',index:'0'},
  {sessionId:'fairdraw',index:0}, {sessionId:'__proto__',index:0}]){
  assert.equal(replayNativeRepeatSampling(task,model,context),null);
 }
 for(const t of [{...task,prompt:task.prompt+'!'}, {...task,N:81},
  {...task,n:21},{...task,runs:4},{...task,seed:123},
  {...task,mode:'mean'},{...task,methods:['club']},
  {...task,questions:task.questions.slice(1)}]){
  assert.equal(replayNativeRepeatSampling(t,model,ctx),null);
 }
 const changes=[
  x=>x.history.shift(),
  x=>x.history[0].a='record',
  x=>x.history[0].d.index='0',
  x=>x.history[1].f.estimate='fake',
  x=>x.history[1].f.estimate=x.history[2].f.estimate,
  x=>x.history.push(structuredClone(x.history.at(-1))),
  x=>x.board.runs[0].method='club',
  x=>x.board.runs[0].ids[0]=99,
  x=>x.board.runs[1].ids[0]=x.board.runs[1].ids[1],
  x=>x.board.runs[2].values[0]++,
  x=>x.board.runs[3].estimate+=1,
  x=>x.board.seed++,
  x=>x.board.pending={},
  x=>x.answers[0]='wrong',
  x=>x.estimate='999',
  x=>x.issue='fabricated',
  x=>x.realWorldClaim='representative',
  x=>x.board.realRespondents=20
 ];
 for(const change of changes){
  const fake=structuredClone(model);change(fake);
  assert.equal(replayNativeRepeatSampling(task,fake,ctx),null,change.toString());
 }
 const stale=structuredClone(record);
 stale.attempts[0].value.estimate='999';
 assert.equal(submittedNativeRepeatSampling(task,model,stale,ctx),null);
});
