// #342 P006b: native categoryuse:1/2 full task locks and hostile replay.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {sessionTaskFor} from '../dist/learning/bridges.js';
import {LESSONS} from '../dist/learning/catalog.js';
import * as native from '../dist/learning/phase5/b19-model.js';
import {nativeFrequencyCompareBinding,replayNativeFrequencyCompare,
 submittedNativeFrequencyCompare} from '../dist/learning/p006b-frequency-pair-ties-evidence.js';
const cases=[
 {index:1,hash:'7986284102490a6eaaf5e3b5f2ca3be505ccfaac91feadc0c305e48fb590c680',
  counts:[8,5,3],total:16,gap:3,kind:'pair'},
 {index:2,hash:'d8a566016199a413177b13dc23eace3957cbecb5415167a162cd35eff31eb313',
  counts:[4,4,2],total:10,gap:0,kind:'ties'}
];
const stable=v=>Array.isArray(v)?v.map(stable):v&&typeof v==='object'?
 Object.fromEntries(Object.keys(v).sort((a,b)=>a.localeCompare(b,'en')).map(k=>[k,stable(v[k])])):v;
const digest=v=>createHash('sha256').update(JSON.stringify(stable(v))).digest('hex');
function make(t,s){
 const m=native.initial(t);
 // Exercise legitimate noncanonical order: native history is evidence, not a prescribed script.
 const order=s.kind==='pair'?
  [2,0,1,0,2,1,0,1,2,0,1,0,1,0,0,0]:
  [2,0,1,1,2,0,1,0,0,1];
 for(const index of order)native.act(t,m,'b19-bar',{index,delta:1});
 if(s.kind==='pair')for(let j=0;j<5;j++)native.act(t,m,'b19-pair');
 else{
  native.act(t,m,'b19-max',{index:1});
  native.act(t,m,'b19-min',{index:2});
  native.act(t,m,'b19-max',{index:0});
 }
 m.total=String(s.total);native.field(t,m,'total');
 m.gap=String(s.gap);native.field(t,m,'gap');
 return m;
}
for(const s of cases){
 const ctx={sessionId:'categoryuse',index:s.index},label='categoryuse:'+s.index;
 test('P006b original registered task, full SHA and independent math '+label,()=>{
  const t=sessionTaskFor(ctx.sessionId,ctx.index);
  console.log('P006B_NATIVE_FULL_TASK_SHA256 '+label+' '+digest(t));
  assert.equal(LESSONS.categoryuse.topicId,'mt_1VSfm9yiLn');
  assert.equal(digest(t),s.hash);
  assert.equal(t.type,'x-datacount');assert.deepEqual(t.counts,s.counts);
  assert.equal(nativeFrequencyCompareBinding(t,ctx)?.kind,s.kind);
  const m=make(t,s);
  assert.equal(native.valid(t,m),true);assert.equal(native.inspect(t,m).correct,true);
  const evidence=replayNativeFrequencyCompare(t,m,ctx);
  assert.ok(evidence);
  assert.equal(evidence.independentTotal,s.total);
  assert.equal(evidence.independentDifference,s.gap);
  assert.equal(evidence.originalBarEvents,s.total);
  assert.equal(evidence.strictAApproved,false);
  assert.equal(evidence.actualChildrenSurveyed,false);
  if(s.kind==='pair')assert.equal(evidence.originalPairActions,5);
  else{assert.deepEqual(evidence.originalMaxSelections,[0,1]);assert.deepEqual(evidence.originalMinSelections,[2]);}
 });
 test('P006b latest original Check only and cross-source refusal '+label,()=>{
  const t=sessionTaskFor(ctx.sessionId,ctx.index),m=make(t,s);
  const wrong=structuredClone(m);wrong.total=String(s.total-1);
  assert.equal(native.inspect(t,wrong).correct,false);
  assert.equal(replayNativeFrequencyCompare(t,wrong,ctx),null);
  const record={attempts:[{value:wrong},{value:structuredClone(m)}]};
  assert.ok(submittedNativeFrequencyCompare(t,m,record,ctx));
  assert.equal(submittedNativeFrequencyCompare(t,m,{attempts:[{value:wrong}]},ctx),null);
  assert.equal(replayNativeFrequencyCompare(t,m,{sessionId:'categoryuse',index:0}),null);
  assert.equal(replayNativeFrequencyCompare(t,m,{sessionId:'bridge-categoryuse',index:s.index}),null);
  assert.equal(replayNativeFrequencyCompare({...t,prompt:t.prompt+'!' },m,ctx),null);
  assert.equal(replayNativeFrequencyCompare({...t,counts:[1,1,1]},m,ctx),null);
 });
 test('P006b reject fabricated history, malformed fields and invalid comparison '+label,()=>{
  const t=sessionTaskFor(ctx.sessionId,ctx.index),m=make(t,s);
  const edits=[
   x=>x.history.pop(),x=>x.history[0].d.delta='-1',
   x=>x.history[0].d.index='00',x=>x.history[0].d.extra='x',
   x=>x.history[0].f.fake='x',x=>x.history[0].a='reset',
   x=>x.history[0].f.total='1',
   x=>x.history[0].d.index='5',
   x=>x.board.counts[0]--,
   x=>x.board.first.foo=1,
   x=>x.history.push(structuredClone(x.history.at(-1))),
   x=>x.total='0'+s.total,
   x=>x.issue='forged',
   x=>x.reason='not observable',
   x=>x.history[0].d.delta='2',
   x=>x.history[s.total].a='bar',
   x=>x.history[s.total-1].a=s.kind==='pair'?'pair':'max'
  ];
  if(s.kind==='pair')edits.push(x=>x.history.at(-1).d.index='1');
  else edits.push(x=>x.history.at(-1).d.index='2');
  for(const edit of edits){const x=structuredClone(m);edit(x);
   assert.equal(replayNativeFrequencyCompare(t,x,ctx),null,edit.toString());
  }
 });
}
