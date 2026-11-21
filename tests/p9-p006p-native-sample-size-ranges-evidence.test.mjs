// #342 P006p: immutable original samplevary:2 maths, replay and negative cases.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {sessionTaskFor} from '../dist/learning/bridges.js';
import {LESSONS} from '../dist/learning/catalog.js';
import * as native from '../dist/learning/phase5/b21-model.js';
import {nativeSizeRangesBinding,replayNativeSizeRanges,
 submittedNativeSizeRanges} from '../dist/learning/p006p-native-sample-size-ranges-evidence.js';

const ctx={sessionId:'samplevary',index:2};
const stable=v=>Array.isArray(v)?v.map(stable):v&&typeof v==='object'?
 Object.fromEntries(Object.keys(v).sort((a,b)=>a.localeCompare(b,'en')).map(k=>[k,stable(v[k])])):v;
const digest=v=>createHash('sha256').update(JSON.stringify(stable(v))).digest('hex');
const task=sessionTaskFor(ctx.sessionId,ctx.index);
const observed=[55,25,15,20,30,33.3,25,26.7,26.7,30];
function complete(wrong=false){
 const m=native.initial(task);
 for(let i=0;i<10;i++){
  native.act(task,m,'b21-draw');
  const pending=m.board.pending;
  assert.ok(pending,'original pending draw '+i);
  const n=i<5?20:60;
  assert.equal(pending.n,n);
  assert.equal(pending.method,'all');
  assert.equal(new Set(pending.ids).size,n);
  const successes=pending.values.reduce((a,b)=>a+b,0);
  const estimate=Math.round((successes/n*100+Number.EPSILON)*10)/10;
  if(wrong&&i===0){
   m.estimate=String(estimate+1);
   native.act(task,m,'b21-record');
   assert.ok(m.issue,'native rejects wrong estimate');
   assert.ok(m.board.pending,'wrong estimate cannot consume sample');
  }
  m.estimate=String(estimate);
  native.act(task,m,'b21-record');
  assert.equal(m.issue,'');
  assert.equal(m.board.runs.length,i+1);
 }
 const a=m.board.runs.slice(0,5).map(r=>r.estimate);
 const b=m.board.runs.slice(5).map(r=>r.estimate);
 Object.assign(m,{lowA:String(Math.min(...a)),highA:String(Math.max(...a)),
  lowB:String(Math.min(...b)),highB:String(Math.max(...b))});
 m.answers[0]='notbound';m.answers[1]='usually';
 return m;
}
test('P006p exact native source and independent 5x20 versus 5x60 sampling',()=>{
 const hash=digest(task);
 console.log('P006P_NATIVE_FULL_TASK_SHA256 samplevary:2 '+hash);
 assert.equal(hash,'2a09fa4bc4b0a85e4f7855b02ccc9e7ed8f7140e0e81a4e25b36d37cd9311b3e');
 assert.equal(LESSONS.samplevary.topicId,'mt_x7V1qrkiqH');
 assert.equal(task.type,'x-samplelab');
 assert.equal(task.N,200);assert.equal(task.runs,10);
 assert.equal(task.mode,'proportion');assert.equal(task.compareSizes,true);
 assert.deepEqual(task.sizes,[20,20,20,20,20,60,60,60,60,60]);
 assert.deepEqual(nativeSizeRangesBinding(task,ctx),{
  position:'samplevary:2',sourceNodeId:'mt_x7V1qrkiqH',
  populationSize:200,smallSampleSize:20,largeSampleSize:60,
  repetitionsPerSize:5,mode:'proportion',syntheticPopulation:true
 });
 for(const wrong of [false,true]){
  const model=complete(wrong);
  assert.equal(native.valid(task,model),true);
  assert.equal(native.inspect(task,model).correct,true);
  const proof=replayNativeSizeRanges(task,model,ctx);
  assert.ok(proof,'replayed complete synthetic original samples');
  assert.deepEqual(proof.samplePercentages,observed);
  assert.deepEqual(proof.sampleSuccessCounts,[11,5,3,4,6,20,15,16,16,18]);
  assert.deepEqual(proof.observedSmallSampleRange,[15,55]);
  assert.deepEqual(proof.observedLargeSampleRange,[25,33.3]);
  assert.ok(Math.abs(proof.observedSmallSpread-40)<1e-9);
  assert.ok(Math.abs(proof.observedLargeSpread-8.3)<1e-9);
  assert.equal(proof.syntheticPopulationPercentage,30);
  assert.equal(proof.observedDrawClicks,10);
  assert.equal(proof.observedRecordClicks,wrong?11:10);
  assert.equal(proof.wrongEstimateThenCorrectionObserved,wrong);
  assert.equal(proof.futureSamplesWithinObservedRangesGuaranteed,false);
  assert.equal(proof.eachLargerSampleNecessarilyCloser,false);
  assert.equal(proof.realRespondentsObserved,false);
  assert.equal(proof.strictAApproved,false);
  assert.ok(proof.sampleIds.every((ids,i)=>ids.length===(i<5?20:60)&&
   new Set(ids).size===ids.length&&ids.every(id=>id>=1&&id<=200)));
  assert.ok(submittedNativeSizeRanges(task,model,
   {attempts:[{value:structuredClone(model)}]},ctx));
 }
 // This concrete trace itself rebuts any deterministic per-draw superiority:
 // one n=20 draw exactly matches the synthetic 30%, whereas n=60 draw 6 does not.
 assert.equal(observed[4],30);assert.notEqual(observed[5],30);
});
test('P006p forged sample, range, context, choice and stale Check rejected',()=>{
 const m=complete(true),record={attempts:[{value:structuredClone(m)}]};
 assert.ok(submittedNativeSizeRanges(task,m,record,ctx));
 for(const c of [{sessionId:'samplevary',index:1},{sessionId:'samplevary',index:3},
  {sessionId:'samplevary',index:'2'},{sessionId:'fairdraw',index:2},
  {sessionId:'__proto__',index:2}])
  assert.equal(replayNativeSizeRanges(task,m,c),null);
 for(const t of [{...task,prompt:task.prompt+'!'}, {...task,N:201},
  {...task,n:21},{...task,runs:9},{...task,compareSizes:false},
  {...task,seed:202622},{...task,mode:'mean'},
  {...task,sizes:[20,20,20,20,20,20,60,60,60,60]},
  {...task,questions:task.questions.slice(1)}])
  assert.equal(replayNativeSizeRanges(t,m,ctx),null);
 const changes=[
  x=>x.history.shift(),x=>x.history[0].a='record',
  x=>x.history[1].f.estimate='bogus',
  x=>x.history.push(structuredClone(x.history.at(-1))),
  x=>x.board.runs[0].n=60,x=>x.board.runs[4].ids[0]=201,
  x=>x.board.runs[5].method='club',
  x=>x.board.runs[6].ids[0]=x.board.runs[6].ids[1],
  x=>x.board.runs[7].values[0]=1-x.board.runs[7].values[0],
  x=>x.board.runs[8].estimate=100,
  x=>x.board.seed++,x=>x.board.pending={},
  x=>x.lowA='14',x=>x.highA='56',x=>x.lowB='24',x=>x.highB='34',
  x=>x.answers[0]='guarantee',x=>x.answers[1]='always',
  x=>x.issue='forged',x=>x.realRespondents=200
 ];
 for(const change of changes){
  const fake=structuredClone(m);change(fake);
  assert.equal(replayNativeSizeRanges(task,fake,ctx),null,change.toString());
 }
 const stale=structuredClone(record);
 stale.attempts[0].value.lowA='999';
 assert.equal(submittedNativeSizeRanges(task,m,stale,ctx),null);
 assert.equal(submittedNativeSizeRanges(task,m,{attempts:[]},ctx),null);
});
