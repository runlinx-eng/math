// #342 P006l: original B21 random-sampling math, exact source and negative replay.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {sessionTaskFor} from '../dist/learning/bridges.js';
import {LESSONS} from '../dist/learning/catalog.js';
import * as native from '../dist/learning/phase5/b21-model.js';
import {nativeSampleBinding,replayNativeSample,submittedNativeSample} from
 '../dist/learning/p006l-native-random-sample-record-evidence.js';

const stable=v=>Array.isArray(v)?v.map(stable):v&&typeof v==='object'?
 Object.fromEntries(Object.keys(v).sort((a,b)=>a.localeCompare(b,'en')).map(k=>[k,stable(v[k])])):v;
const digest=v=>createHash('sha256').update(JSON.stringify(stable(v))).digest('hex');
const cases=[
 {index:0,hash:'8fe9d888f53692c0c592ffe2b36e2f9d74ecc152349581edb5bb2948286f8da3',
  population:800,n:40,metric:'mean'},
 {index:2,hash:'e8ce0a04fca7daf066aebf3c2fd0e35cbca1c7299b8b494f96d0fe724087b38b',
  population:80,n:10,metric:'proportion'}
];
function complete(t,wrong){
 const m=native.initial(t);
 native.act(t,m,'b21-draw');
 assert.ok(m.board.pending,'native B21 draw generated a sample');
 const p=m.board.pending, sum=p.values.reduce((a,b)=>a+b,0);
 const number=Math.round((sum/p.n*(t.mode==='proportion'?100:1)+Number.EPSILON)*10)/10;
 if(wrong){
  m.estimate=String(number+1);native.act(t,m,'b21-record');
  assert.ok(m.issue,'wrong native estimate rejected');
  assert.ok(m.board.pending,'wrong estimate preserves original pending sample');
 }
 m.estimate=String(number);native.act(t,m,'b21-record');
 assert.equal(m.issue,'','corrected estimate recorded');
 t.questions.forEach((q,i)=>m.answers[i]=String(Array.isArray(q.value)?q.value[0]:q.value));
 return m;
}
for(const s of cases){
 const t=sessionTaskFor('fairdraw',s.index),ctx={sessionId:'fairdraw',index:s.index};
 test('P006l fairdraw:'+s.index+' exact source, independent draw and wrong-to-correct',()=>{
  console.log('P006L_NATIVE_FULL_TASK_SHA256 fairdraw:'+s.index+' '+digest(t));
  assert.equal(digest(t),s.hash);
  assert.equal(LESSONS.fairdraw.topicId,'mt_4zgPzc6yu5');
  assert.equal(t.type,'x-samplelab');
  assert.deepEqual(nativeSampleBinding(t,ctx),{
   position:'fairdraw:'+s.index,sourceNodeId:'mt_4zgPzc6yu5',
   populationSize:s.population,sampleSize:s.n,metric:s.metric,syntheticPopulation:true
  });
  for(const wrong of [false,true]){
   const model=complete(t,wrong);
   assert.equal(native.valid(t,model),true);
   assert.equal(native.inspect(t,model).correct,true);
   const result=replayNativeSample(t,model,ctx);
   assert.ok(result,'source-locked independent original B21 replay');
   assert.equal(result.recordedSum,model.board.runs[0].values.reduce((a,b)=>a+b,0));
   assert.equal(result.sampleIds.length,s.n);
   assert.equal(result.withoutReplacement,true);
   assert.equal(result.observedDrawClicks,1);
   assert.equal(result.observedRecordClicks,wrong?2:1);
   assert.equal(result.wrongEstimateThenCorrectionObserved,wrong);
   assert.equal(result.populationEstimateExact,false);
   assert.equal(result.actualRespondentsObserved,false);
   assert.equal(result.strictAApproved,false);
   const record={attempts:[{value:structuredClone(model)}]};
   assert.ok(submittedNativeSample(t,model,record,ctx));
   assert.equal(submittedNativeSample(t,model,{attempts:[]},ctx),null);
  }
 });
 test('P006l fairdraw:'+s.index+' rejects forgery, source mutations, stale Check and invalid steps',()=>{
  const model=complete(t,true),stored={attempts:[{value:structuredClone(model)}]};
  assert.ok(submittedNativeSample(t,model,stored,ctx));
  for(const context of [{sessionId:'fairdraw',index:s.index+1},
   {sessionId:'fairdraw',index:String(s.index)}, {sessionId:'__proto__',index:s.index},
   {sessionId:'samplevary',index:s.index}]){
   assert.equal(replayNativeSample(t,model,context),null);
  }
  for(const task of [
   {...t,prompt:t.prompt+'！'}, {...t,N:t.N+1}, {...t,seed:t.seed+1},
   {...t,n:t.n+1}, {...t,methods:['club']},
   {...t,questions:t.questions.slice(1)}, {...t,mode:'unknown'}]){
   assert.equal(replayNativeSample(task,model,ctx),null);
  }
  for(const attack of [
   x=>x.history.pop(),
   x=>x.history[0].a='record',
   x=>x.history[0].d.index='1',
   x=>x.history[1].f.estimate='fake',
   x=>x.history[1].f.estimate=x.history.at(-1).f.estimate,
   x=>x.history.push(structuredClone(x.history.at(-1))),
   x=>x.board.runs[0].ids[0]=9999,
   x=>x.board.runs[0].values[0]++,
   x=>x.board.runs[0].estimate++,
   x=>x.board.seed++,
   x=>x.board.pending={},
   x=>x.answers[0]='unknown',
   x=>x.estimate='999',
   x=>x.issue='fabricated',
   x=>x.researchClaim='national',
   x=>x.board.realRespondents=40
  ]){
   const fake=structuredClone(model);attack(fake);
   assert.equal(replayNativeSample(t,fake,ctx),null,attack.toString());
  }
  const stale=structuredClone(stored);stale.attempts[0].value.estimate='999';
  assert.equal(submittedNativeSample(t,model,stale,ctx),null);
 });
}
