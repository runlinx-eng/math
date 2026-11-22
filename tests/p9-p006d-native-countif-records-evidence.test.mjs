// #342 P006d: exact original source and independent full-range COUNTIF.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {sessionTaskFor} from '../dist/learning/bridges.js';
import {LESSONS} from '../dist/learning/catalog.js';
import * as native from '../dist/learning/phase5/b19-model.js';
import {nativeCountifRecordBinding,replayNativeCountifRecord,
 submittedNativeCountifRecord} from '../dist/learning/p006d-native-countif-records-evidence.js';
const cases=[
 {id:'digitalstudy',index:2,node:'mt_yrvYKSwSRZ',
  hash:'772d795d586bc5e00f1eb0a20be87e5bccca909c46f6de2a622907030cbf01df',
  counts:[3,3,2],total:8,gap:0,maximum:[0,1],minimum:[2],unknown:0},
 {id:'checkrecords',index:2,node:'mt_QHT16CrFO-',
  hash:'387c9a4156b40d7e2143b716ccca795f815afcf18585996be6c2cf8c462a65e4',
  counts:[2,3,2],total:7,gap:1,maximum:[1],minimum:[0,2],unknown:1}
];
const stable=v=>Array.isArray(v)?v.map(stable):v&&typeof v==='object'?
 Object.fromEntries(Object.keys(v).sort((a,b)=>a.localeCompare(b,'en')).map(k=>[k,stable(v[k])])):v;
const digest=v=>createHash('sha256').update(JSON.stringify(stable(v))).digest('hex');
function modelFor(t,s){
 const m=native.initial(t);
 m.formulas=t.labels.map(label=>'=COUNTIF(B2:B'+(t.raw.length+1)+',"'+label+'")');
 for(const i of s.minimum)native.act(t,m,'b19-min',{index:i});
 for(const i of s.maximum)native.act(t,m,'b19-max',{index:i});
 m.total=String(s.total);native.field(t,m,'total');
 m.gap=String(s.gap);native.field(t,m,'gap');
 if(s.unknown){m.unknown=String(s.unknown);native.field(t,m,'unknown');}
 return m;
}
for(const s of cases){
 const ctx={sessionId:s.id,index:s.index},position=s.id+':'+s.index;
 test('P006d full source/task hash and independent COUNTIF '+position,()=>{
  const t=sessionTaskFor(s.id,s.index);
  const hash=digest(t);
  console.log('P006D_NATIVE_FULL_TASK_SHA256 '+position+' '+hash);
  assert.equal(LESSONS[s.id].topicId,s.node);
  assert.equal(hash,s.hash);
  assert.equal(t.type,'x-datacount');
  assert.equal(t.formula,true);
  assert.equal(t.extremes,true);
  assert.equal(t.raw.length,s.total);
  assert.deepEqual(t.counts,s.counts);
  assert.equal(t.unknown||0,s.unknown);
  assert.equal(nativeCountifRecordBinding(t,ctx)?.position,position);
  const m=modelFor(t,s);
  assert.equal(native.valid(t,m),true);
  assert.equal(native.inspect(t,m).correct,true);
  const proof=replayNativeCountifRecord(t,m,ctx);
  assert.ok(proof);
  assert.deepEqual(proof.independentCounts,s.counts);
  assert.equal(proof.independentTotal,s.total);
  assert.equal(proof.independentCategoryGap,s.gap);
  assert.equal(proof.fullRange,'B2:B'+(s.total+1));
  assert.deepEqual(proof.originalMaxSelections,s.maximum);
  assert.deepEqual(proof.originalMinSelections,s.minimum);
  assert.equal(proof.unknownRecordsExcluded,s.unknown);
  assert.equal(proof.actualChildrenSurveyed,false);
  assert.equal(proof.strictAApproved,false);
 });
 test('P006d original wrong-correct attempt, isolation and source integrity '+position,()=>{
  const t=sessionTaskFor(s.id,s.index),m=modelFor(t,s),wrong=structuredClone(m);
  wrong.total=String(s.total+1);
  assert.equal(native.inspect(t,wrong).correct,false);
  assert.equal(replayNativeCountifRecord(t,wrong,ctx),null);
  const record={attempts:[{value:wrong},{value:structuredClone(m)}]};
  assert.ok(submittedNativeCountifRecord(t,m,record,ctx));
  assert.equal(submittedNativeCountifRecord(t,m,{attempts:[{value:wrong}]},ctx),null);
  assert.equal(replayNativeCountifRecord(t,m,{sessionId:s.id,index:s.index+1}),null);
  assert.equal(replayNativeCountifRecord(t,m,{sessionId:'bridge-'+s.id,index:s.index}),null);
  assert.equal(replayNativeCountifRecord(t,m,{sessionId:s.id,index:String(s.index)}),null);
  assert.equal(replayNativeCountifRecord({...t,prompt:t.prompt+' changed'},m,ctx),null);
  assert.equal(replayNativeCountifRecord({...t,raw:[...t.raw,'未知']},m,ctx),null);
 });
 test('P006d reject abbreviated range, forged events, unknown imputation '+position,()=>{
  const t=sessionTaskFor(s.id,s.index),m=modelFor(t,s);
  const attacks=[
   x=>x.formulas[0]='=COUNTIF(B2:B'+s.total+',"'+t.labels[0]+'")',
   x=>x.formulas[0]='=COUNTIF(B3:B'+(s.total+1)+',"'+t.labels[0]+'")',
   x=>x.formulas[0]='=COUNTIF(B2:B'+(s.total+1)+',"'+t.labels[1]+'")',
   x=>x.formulas[1]='=COUNTIF(C2:C'+(s.total+1)+',"'+t.labels[1]+'")',
   x=>x.formulas[0]='3',
   x=>x.formulas[0]='=COUNTIF(B2:B999,"'+t.labels[0]+'")',
   x=>x.history.pop(),x=>x.history[0].a='bar',
   x=>x.history[0].d.index='00',x=>x.history[0].d.extra='forged',
   x=>x.history[0].f.total='5',x=>x.history[0].f.formulas[0]='=COUNTIF(B2:B3,"'+t.labels[0]+'")',
   x=>x.history.push(structuredClone(x.history[0])),
   x=>x.board.max=[0],x=>x.board.min=[1],
   x=>x.board.first.fake=1,x=>x.board.counts[0]=1,
   x=>x.total='0'+s.total,x=>x.gap=String(s.gap+1),
   x=>x.issue='forged',x=>x.reason='added conclusion',
   x=>x.formulas.push('=COUNTIF(B2:B2,"伪造")')
  ];
  attacks.push(s.unknown?x=>x.unknown='0':x=>x.unknown='1');
  for(const attack of attacks){
   const bad=structuredClone(m);attack(bad);
   assert.equal(replayNativeCountifRecord(t,bad,ctx),null,attack.toString());
  }
  // Original parser correctly accepts a semicolon separator when the entire range is counted.
  const alternate=structuredClone(m);
  const canonical=alternate.formulas[0];
  alternate.formulas[0]=canonical.replace(',"',';"');
  // Old click snapshots are now inconsistent with the alternate formula. A newly observed
  // original sequence is needed; do not retrofit event history to claim an observed edit.
  assert.equal(replayNativeCountifRecord(t,alternate,ctx),null);
 });
}
