// #342 P006q: original synthetic sleep population vs five sample mean observations.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {sessionTaskFor} from '../dist/learning/bridges.js';
import {LESSONS} from '../dist/learning/catalog.js';
import * as native from '../dist/learning/phase5/b21-model.js';
import {nativeSleepMeansBinding,replayNativeSleepMeans,
 submittedNativeSleepMeans} from '../dist/learning/p006q-native-sleep-means-vs-individual-evidence.js';

const ctx={sessionId:'samplevary',index:3};
const stable=v=>Array.isArray(v)?v.map(stable):v&&typeof v==='object'?
 Object.fromEntries(Object.keys(v).sort((a,b)=>a.localeCompare(b,'en')).map(k=>[k,stable(v[k])])):v;
const digest=v=>createHash('sha256').update(JSON.stringify(stable(v))).digest('hex');
const task=sessionTaskFor(ctx.sessionId,ctx.index);
function complete(wrong=false){
 const model=native.initial(task);
 for(let i=0;i<5;i++){
  native.act(task,model,'b21-draw');
  const pending=model.board.pending;
  assert.ok(pending,'original synthetic sample '+i);
  const mean=Math.round((pending.values.reduce((s,v)=>s+v,0)/20+Number.EPSILON)*10)/10;
  if(wrong&&i===0){
   model.estimate=String(mean+1);
   native.act(task,model,'b21-record');
   assert.ok(model.issue&&model.board.pending,'wrong mean preserves pending original sample');
  }
  model.estimate=String(mean);
  native.act(task,model,'b21-record');
  assert.equal(model.issue,'');
  assert.equal(model.board.runs.length,i+1);
 }
 model.answers[0]='different';
 return model;
}
test('P006q original task, source, exact fingerprint and two different variations',()=>{
 const hash=digest(task);
 console.log('P006Q_NATIVE_FULL_TASK_SHA256 samplevary:3 '+hash);
 assert.equal(hash,process.env.A_DEV_EXPECTED_TASK_SHA256||'__P006Q_RUNTIME_SHA_PENDING__');
 assert.equal(LESSONS.samplevary.topicId,'mt_x7V1qrkiqH');
 assert.equal(task.type,'x-samplelab');
 assert.equal(task.N,120);assert.equal(task.n,20);assert.equal(task.runs,5);
 assert.equal(task.mode,'mean');assert.equal(task.profile,'sleep');
 assert.deepEqual(task.methods,['all']);
 assert.deepEqual(nativeSleepMeansBinding(task,ctx),{
  position:'samplevary:3',sourceNodeId:'mt_x7V1qrkiqH',
  populationSize:120,syntheticIndividualMinHours:6,syntheticIndividualMaxHours:11,
  syntheticPopulationMeanHours:8.5,sampleSizeEach:20,
  drawCount:5,mode:'mean',profile:'sleep',syntheticPopulation:true
 });
 for(const wrong of [false,true]){
  const model=complete(wrong);
  assert.equal(native.valid(task,model),true);
  assert.equal(native.inspect(task,model).correct,true);
  const proof=replayNativeSleepMeans(task,model,ctx);
  assert.ok(proof,'independent replay of all original five samples');
  assert.deepEqual(proof.syntheticIndividualRangeHours,[6,11]);
  assert.deepEqual(proof.syntheticIndividualHoursFrequency,[20,20,20,20,20,20]);
  assert.equal(proof.syntheticIndividualSpreadHours,5);
  assert.equal(proof.syntheticPopulationMeanHours,8.5);
  assert.deepEqual(proof.sampleMeanHours,model.board.runs.map(r=>r.estimate));
  assert.equal(proof.sampleMeanHours.length,5);
  assert.ok(proof.sampleIds.every(ids=>ids.length===20&&new Set(ids).size===20));
  assert.ok(proof.sampleMeanHours.every(x=>x>=6&&x<=11));
  assert.ok(proof.observedSampleMeanSpreadHours<=proof.syntheticIndividualSpreadHours);
  assert.equal(proof.observedDrawClicks,5);
  assert.equal(proof.observedRecordClicks,wrong?6:5);
  assert.equal(proof.wrongEstimateThenCorrectionObserved,wrong);
  assert.equal(proof.individualRangeEqualsSampleMeanRange,false);
  assert.equal(proof.futureSampleMeansConfinedToObservedRange,false);
  assert.equal(proof.actualSleepRespondentsObserved,false);
  assert.equal(proof.freeTextMeaningAssessed,false);
  assert.equal(proof.strictAApproved,false);
  assert.ok(submittedNativeSleepMeans(task,model,
   {attempts:[{value:structuredClone(model)}]},ctx));
 }
});
test('P006q wrong context, fake original, forged history and stale submission fail-closed',()=>{
 const model=complete(true),record={attempts:[{value:structuredClone(model)}]};
 assert.ok(submittedNativeSleepMeans(task,model,record,ctx));
 for(const c of [{sessionId:'samplevary',index:0},{sessionId:'samplevary',index:2},
  {sessionId:'samplevary',index:'3'},{sessionId:'fairdraw',index:3},
  {sessionId:'__proto__',index:3}]){
  assert.equal(replayNativeSleepMeans(task,model,c),null);
 }
 for(const t of [{...task,prompt:task.prompt+'!'}, {...task,N:121},
  {...task,n:21},{...task,runs:4},{...task,seed:202622},
  {...task,mode:'proportion'},{...task,profile:'exercise'},
  {...task,methods:['club']},{...task,questions:task.questions.slice(1)}]){
  assert.equal(replayNativeSleepMeans(t,model,ctx),null);
 }
 const changes=[
  x=>x.history.shift(),x=>x.history[0].a='record',
  x=>x.history[0].d.index='1',
  x=>x.history[1].f.estimate='fake',
  x=>x.history.push(structuredClone(x.history.at(-1))),
  x=>x.board.runs[0].method='club',
  x=>x.board.runs[0].n=19,
  x=>x.board.runs[1].ids[0]=121,
  x=>x.board.runs[2].ids[0]=x.board.runs[2].ids[1],
  x=>x.board.runs[2].values[0]++,
  x=>x.board.runs[3].estimate+=1,
  x=>x.board.seed++,
  x=>x.board.pending={},
  x=>x.answers[0]='same',
  x=>x.estimate='999',
  x=>x.issue='forged',
  x=>x.board.individualHours=[1,2,3],
  x=>x.realWorldPopulation='measured'
 ];
 for(const change of changes){
  const fake=structuredClone(model);change(fake);
  assert.equal(replayNativeSleepMeans(task,fake,ctx),null,change.toString());
 }
 const stale=structuredClone(record);
 stale.attempts[0].value.estimate='999';
 assert.equal(submittedNativeSleepMeans(task,model,stale,ctx),null);
 assert.equal(submittedNativeSleepMeans(task,model,{attempts:[]},ctx),null);
});
