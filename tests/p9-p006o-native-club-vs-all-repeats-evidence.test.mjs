// #342 P006o: original six native B21 frame-comparison draws, math and negatives.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {sessionTaskFor} from '../dist/learning/bridges.js';
import {LESSONS} from '../dist/learning/catalog.js';
import * as native from '../dist/learning/phase5/b21-model.js';
import {nativeClubVsAllRepeatsBinding,replayNativeClubVsAllRepeats,
 submittedNativeClubVsAllRepeats} from '../dist/learning/p006o-native-club-vs-all-repeats-evidence.js';

const ctx={sessionId:'samplevary',index:1};
const stable=v=>Array.isArray(v)?v.map(stable):v&&typeof v==='object'?
 Object.fromEntries(Object.keys(v).sort((a,b)=>a.localeCompare(b,'en')).map(k=>[k,stable(v[k])])):v;
const digest=v=>createHash('sha256').update(JSON.stringify(stable(v))).digest('hex');
const task=sessionTaskFor(ctx.sessionId,ctx.index);
function complete(wrong=false){
 const model=native.initial(task);
 for(let i=0;i<6;i++){
  native.act(task,model,'b21-draw');
  assert.ok(model.board.pending,'original draw '+i);
  const pending=model.board.pending;
  assert.equal(pending.method,i<3?'club':'all');
  const sum=pending.values.reduce((a,b)=>a+b,0);
  const correct=Math.round((sum/pending.n+Number.EPSILON)*10)/10;
  if(wrong&&i===0){
   model.estimate=String(correct+1);
   native.act(task,model,'b21-record');
   assert.ok(model.issue,'wrong estimate rejected');
   assert.ok(model.board.pending,'wrong record retains pending draw');
  }
  model.estimate=String(correct);
  native.act(task,model,'b21-record');
  assert.equal(model.issue,'','correct native record');
  assert.equal(model.board.runs.length,i+1);
 }
 model.answers[0]='bias';
 return model;
}
test('P006o original frame source, full SHA, six independent native draws',()=>{
 console.log('P006O_NATIVE_FULL_TASK_SHA256 samplevary:1 '+digest(task));
 assert.equal(digest(task),'89c72b9bbd6503b5c39ce9ee0393ed631f0595f91cd2015a5a95290978deaa04');
 assert.equal(LESSONS.samplevary.topicId,'mt_x7V1qrkiqH');
 assert.deepEqual(task.methods,['club','club','club','all','all','all']);
 assert.equal(task.type,'x-samplelab');
 assert.equal(task.N,800);assert.equal(task.n,20);assert.equal(task.runs,6);
 assert.deepEqual(nativeClubVsAllRepeatsBinding(task,ctx),{
  position:'samplevary:1',sourceNodeId:'mt_x7V1qrkiqH',
  syntheticPopulationSize:800,clubFrameSize:200,sampleSizeEach:20,
  clubDraws:3,allFrameDraws:3,mode:'mean',syntheticPopulation:true
 });
 for(const wrong of [false,true]){
  const model=complete(wrong);
  assert.equal(native.valid(task,model),true);
  assert.equal(native.inspect(task,model).correct,true);
  const proof=replayNativeClubVsAllRepeats(task,model,ctx);
  assert.ok(proof,'six independent original frame draws');
  assert.deepEqual(proof.sampleMeans,model.board.runs.map(r=>r.estimate));
  assert.deepEqual(proof.sampleMeans,[6.2,6.2,6.8,2.5,1.9,3.2]);
  assert.equal(proof.sampleIds.length,6);
  assert.ok(proof.sampleIds.slice(0,3).every(ids=>ids.length===20&&ids.every(id=>id<=200)));
  assert.ok(proof.sampleIds.slice(3).every(ids=>ids.length===20&&ids.every(id=>id<=800)));
  assert.equal(proof.knownSyntheticClubPopulationMean,6.5);
  assert.equal(proof.knownSyntheticFullPopulationMean,2.75);
  assert.equal(proof.observedDrawClicks,6);
  assert.equal(proof.observedRecordClicks,wrong?7:6);
  assert.equal(proof.wrongEstimateThenCorrectionObserved,wrong);
  assert.equal(proof.realRespondentsObserved,false);
  assert.equal(proof.noSingleSampleGuarantee,true);
  assert.equal(proof.strictAApproved,false);
  assert.ok(submittedNativeClubVsAllRepeats(task,model,
   {attempts:[{value:structuredClone(model)}]},ctx));
  assert.equal(submittedNativeClubVsAllRepeats(task,model,{attempts:[]},ctx),null);
 }
});
test('P006o altered source, fake draw, forged history and stale Check reject',()=>{
 const model=complete(true),record={attempts:[{value:structuredClone(model)}]};
 assert.ok(submittedNativeClubVsAllRepeats(task,model,record,ctx));
 for(const context of [{sessionId:'samplevary',index:0},
  {sessionId:'samplevary',index:2},{sessionId:'samplevary',index:'1'},
  {sessionId:'fairdraw',index:1},{sessionId:'__proto__',index:1}]){
  assert.equal(replayNativeClubVsAllRepeats(task,model,context),null);
 }
 for(const t of [{...task,prompt:task.prompt+'!'}, {...task,N:801},
  {...task,n:21},{...task,runs:5},{...task,seed:123},
  {...task,mode:'proportion'},{...task,profile:'sleep'},
  {...task,methods:['all','all','all','club','club','club']},
  {...task,questions:task.questions.slice(1)}]){
  assert.equal(replayNativeClubVsAllRepeats(t,model,ctx),null);
 }
 const changes=[
  x=>x.history.shift(),x=>x.history[0].a='record',
  x=>x.history[0].d.index='0',x=>x.history[1].f.estimate='fake',
  x=>x.history[1].f.estimate=x.history[2].f.estimate,
  x=>x.history.push(structuredClone(x.history.at(-1))),
  x=>x.board.runs[0].method='all',x=>x.board.runs[0].ids[0]=205,
  x=>x.board.runs[1].ids[0]=x.board.runs[1].ids[1],
  x=>x.board.runs[2].values[0]++,x=>x.board.runs[3].estimate+=1,
  x=>x.board.runs[4].method='club',x=>x.board.runs[5].ids[0]=901,
  x=>x.board.seed++,x=>x.board.pending={},
  x=>x.answers[0]='same',x=>x.estimate='999',
  x=>x.issue='fabricated',x=>x.realRespondents=120
 ];
 for(const change of changes){
  const fake=structuredClone(model);change(fake);
  assert.equal(replayNativeClubVsAllRepeats(task,fake,ctx),null,change.toString());
 }
 const stale=structuredClone(record);
 stale.attempts[0].value.estimate='999';
 assert.equal(submittedNativeClubVsAllRepeats(task,model,stale,ctx),null);
});
