// #342 P006c: independent native B19 tallies in three distinct data scopes.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {sessionTaskFor} from '../dist/learning/bridges.js';
import {LESSONS} from '../dist/learning/catalog.js';
import * as native from '../dist/learning/phase5/b19-model.js';
import {nativeFrequencyScopesBinding,replayNativeFrequencyScopes,
 submittedNativeFrequencyScopes} from '../dist/learning/p006c-native-frequency-scopes-evidence.js';
const cases=[
 {id:'playgroundstudy',index:1,node:'mt_kxeuXm6EyC',
  hash:'f0a5bb49744b71e2999b4cd02a6ccdad8687c20e8531100e31c3f3539c9b5be9',
  counts:[2,1,1],total:4,gap:1,unit:'次使用',scope:'visits'},
 {id:'measurestory',index:0,node:'mt_6gpryAnpoZ',
  hash:'ed4ec76e97c65506709940aafd84b7adabba2cd9f05558ffc2f88f3ece5be500',
  counts:[3,7,6,4],total:20,gap:4,unit:'条观察'},
 {id:'ownstudy',index:2,node:'mt_Y6JmLjnfRP',
  hash:'42fae338a6579eb8eb924ba776d3a156ec5ca5c4ee324b74ec0413b70f4a2e41',
  counts:[3,6,4,2],total:15,gap:3,unit:'人',extremes:true}
];
const stable=v=>Array.isArray(v)?v.map(stable):v&&typeof v==='object'?
 Object.fromEntries(Object.keys(v).sort((a,b)=>a.localeCompare(b,'en')).map(k=>[k,stable(v[k])])):v;
const digest=v=>createHash('sha256').update(JSON.stringify(stable(v))).digest('hex');
function make(t,s){
 const m=native.initial(t);
 // Noncanonical but genuine original clicks: cycle categories to prove replay is not one fixed script.
 for(let round=0;round<Math.max(...s.counts);round++)
  for(let i=s.counts.length-1;i>=0;i--)
   if(round<s.counts[i])native.act(t,m,'b19-bar',{index:i,delta:1});
 if(s.extremes){
  native.act(t,m,'b19-min',{index:3});
  native.act(t,m,'b19-max',{index:1});
 }
 m.total=String(s.total);native.field(t,m,'total');
 m.gap=String(s.gap);native.field(t,m,'gap');
 if(s.scope){m.scope=s.scope;native.field(t,m,'scope');}
 return m;
}
for(const s of cases){
 const ctx={sessionId:s.id,index:s.index},label=s.id+':'+s.index;
 test('P006c native runtime full SHA, source and independent frequency '+label,()=>{
  const t=sessionTaskFor(s.id,s.index);
  console.log('P006C_NATIVE_FULL_TASK_SHA256 '+label+' '+digest(t));
  assert.equal(LESSONS[s.id].topicId,s.node);
  assert.equal(digest(t),s.hash);
  assert.equal(t.type,'x-datacount');
  assert.deepEqual(t.counts,s.counts);
  assert.equal(t.unit,s.unit);
  assert.equal(nativeFrequencyScopesBinding(t,ctx)?.position,label);
  const m=make(t,s);
  assert.equal(native.valid(t,m),true);
  assert.equal(native.inspect(t,m).correct,true);
  const e=replayNativeFrequencyScopes(t,m,ctx);
  assert.ok(e);
  assert.equal(e.independentlyCountedTotal,s.total);
  assert.equal(e.independentCategoryDifference,s.gap);
  assert.equal(e.originalIncrementEvents,s.total);
  assert.deepEqual(e.simulatedCounts,s.counts);
  assert.equal(e.originalDistinctRespondentsObserved,false);
  assert.equal(e.strictAApproved,false);
  if(s.extremes){
   assert.deepEqual(e.originalMaxSelections,[1]);
   assert.deepEqual(e.originalMinSelections,[3]);
  }else{
   assert.deepEqual(e.originalMaxSelections,[]);
   assert.deepEqual(e.originalMinSelections,[]);
  }
 });
 test('P006c original wrong-to-correct latest Check, source isolation '+label,()=>{
  const t=sessionTaskFor(s.id,s.index),m=make(t,s);
  const wrong=structuredClone(m);wrong.total=String(s.total-1);
  assert.equal(native.inspect(t,wrong).correct,false);
  assert.equal(replayNativeFrequencyScopes(t,wrong,ctx),null);
  const rec={attempts:[{value:wrong},{value:structuredClone(m)}]};
  assert.ok(submittedNativeFrequencyScopes(t,m,rec,ctx));
  assert.equal(submittedNativeFrequencyScopes(t,m,{attempts:[{value:wrong}]},ctx),null);
  assert.equal(replayNativeFrequencyScopes(t,m,{sessionId:s.id,index:s.index+1}),null);
  assert.equal(replayNativeFrequencyScopes(t,m,{sessionId:'bridge-'+s.id,index:s.index}),null);
  assert.equal(replayNativeFrequencyScopes({...t,prompt:t.prompt+'!'},m,ctx),null);
  assert.equal(replayNativeFrequencyScopes({...t,counts:t.counts.map(x=>x+1)},m,ctx),null);
  assert.equal(replayNativeFrequencyScopes(t,m,{sessionId:s.id,index:String(s.index)}),null);
 });
 test('P006c reject hostile history/fields/scope/extra actions '+label,()=>{
  const t=sessionTaskFor(s.id,s.index),m=make(t,s);
  const attacks=[
   x=>x.history.pop(),x=>x.history[0].d.delta='-1',
   x=>x.history[0].d.index='00',x=>x.history[0].d.extra='x',
   x=>x.history[0].f.total='1',x=>x.history[0].a='reset',
   x=>x.history[0].d.index='6',x=>x.board.counts[0]++,
   x=>x.board.first.injected=1,x=>x.history[0].a='invented',
   x=>x.history.push(structuredClone(x.history[0])),
   x=>x.total='0'+s.total,x=>x.gap=String(s.gap+1),
   x=>x.issue='forged',x=>x.reason='invented',
   x=>x.history[0].d.delta='2',
   x=>x.history[s.total-1].a='max',
   x=>x.history[0].f.scope='someone changed the scope',
   x=>x.history[0].f.extra='not original',
   x=>x.board.pairs=1,
   x=>x.history[0].d.index='5'
  ];
  if(s.scope)attacks.push(x=>x.scope='people');
  else attacks.push(x=>x.scope='visits');
  if(s.extremes){
   attacks.push(x=>x.board.max=[0]);
   attacks.push(x=>x.history.at(-1).d.index='2');
   attacks.push(x=>x.history.at(-1).a='min');
  }else attacks.push(x=>x.history.push({a:'min',d:{index:'0'},f:structuredClone(x.history[0].f)}));
  for(const attack of attacks){
   const changed=structuredClone(m);attack(changed);
   assert.equal(replayNativeFrequencyScopes(t,changed,ctx),null,attack.toString());
  }
 });
}
