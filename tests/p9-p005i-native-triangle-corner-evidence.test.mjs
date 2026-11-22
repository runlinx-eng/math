// #342 P005i: native two-source three-corner geometric replay.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {sessionTaskFor} from '../dist/learning/bridges.js';
import {LESSONS} from '../dist/learning/catalog.js';
import * as native from '../dist/learning/phase5/b25-model.js';
import {cornerBinding,replayCornerEvidence,submittedCornerEvidence}
 from '../dist/learning/p005i-native-triangle-corner-evidence.js';
const CASES=[
 {id:'triangleangles',index:0,node:'mt_cdMlC7EpTJ',
  sha:'86aafc8c07cd506552e0981c4b0b3c09384154e3d48f788050b71d7deaf13d4e',angles:[50,60,70]},
 {id:'polygonangles',index:0,node:'mt_J03RFlVdas',
  sha:'45f21a1463bb3b9b5a08f95f1d7010bc2b5b6eae63607cda1e269cbbd67f938b',angles:[35,80,65]}
];
const ctx=c=>({sessionId:c.id,index:c.index});
const stable=v=>Array.isArray(v)?v.map(stable):v&&typeof v==='object'?
 Object.fromEntries(Object.keys(v).sort((a,b)=>a.localeCompare(b,'en'))
 .map(k=>[k,stable(v[k])])):v;
const sha=v=>createHash('sha256').update(JSON.stringify(stable(v))).digest('hex');
const make=(t,order=[2,0,1],wrong=false)=>{
 const m=native.initial(t,314159);
 for(const index of order)native.act(t,m,'g25-choose',{index});
 t.questions.forEach((q,i)=>{m.answers[i]=String(q.value);});
 if(wrong)m.answers[0]='179';
 return m;
};
const altered=(m,fn)=>{const v=structuredClone(m);fn(v);return v;};
test('source, full original task fingerprint, independent triangle angles',()=>{
 for(const c of CASES){
  const t=sessionTaskFor(c.id,c.index),m=make(t),proof=replayCornerEvidence(t,m,ctx(c));
  console.log('P005I_NATIVE_FULL_TASK_SHA256 '+c.id+':0 '+sha(t));
  assert.equal(sha(t),c.sha);
  assert.equal(LESSONS[c.id].topicId,c.node);
  assert.equal(t.type,'x-g25-corners');
  assert.equal(cornerBinding(t,ctx(c))?.nodeId,c.node);
  assert.equal(native.valid(t,m),true);
  assert.equal(native.inspect(t,m).correct,true);
  assert.ok(proof);
  assert.deepEqual(proof.originalChooseOrder,[2,0,1]);
  proof.angles.forEach((a,i)=>assert.ok(Math.abs(a-c.angles[i])<1e-8));
  assert.ok(Math.abs(proof.independentAngleSumDegrees-180)<1e-8);
  assert.equal(proof.strictAApproved,false);
  assert.equal(proof.verbalProofAssessed,false);
 }
});
test('wrong-to-correct original Check, source isolation and stale record rejection',()=>{
 for(const c of CASES){
  const t=sessionTaskFor(c.id,0),m=make(t),wrong=make(t,[2,0,1],true);
  assert.equal(native.inspect(t,wrong).correct,false);
  assert.equal(replayCornerEvidence(t,wrong,ctx(c)),null);
  assert.ok(submittedCornerEvidence(t,m,{attempts:[{value:wrong},{value:structuredClone(m)}]},ctx(c)));
  assert.equal(submittedCornerEvidence(t,m,{attempts:[{value:wrong}]},ctx(c)),null);
  assert.equal(submittedCornerEvidence(t,m,{attempts:[]},ctx(c)),null);
  assert.equal(submittedCornerEvidence(t,wrong,{attempts:[{value:m}]},ctx(c)),null);
  assert.equal(replayCornerEvidence(t,m,{sessionId:'parallelangle',index:0}),null);
  assert.equal(replayCornerEvidence(t,m,{sessionId:c.id,index:1}),null);
  assert.equal(replayCornerEvidence(t,m,{sessionId:c.id,index:'0'}),null);
  assert.equal(replayCornerEvidence({...t,a:t.a+1},m,ctx(c)),null);
  assert.equal(replayCornerEvidence({...t,questions:[{label:'fake',value:180}]},m,ctx(c)),null);
 }
});
test('reject skipped, repeated, removed, forged and extra history',()=>{
 for(const c of CASES){
  const t=sessionTaskFor(c.id,0),m=make(t),context=ctx(c);
  assert.equal(replayCornerEvidence(t,make(t,[0,1]),context),null);
  assert.equal(replayCornerEvidence(t,make(t,[0,1,2,1,1]),context),null);
  assert.equal(replayCornerEvidence(t,altered(m,x=>x.history[0].a='test'),context),null);
  assert.equal(replayCornerEvidence(t,altered(m,x=>x.history[0].f.angle='90'),context),null);
  assert.equal(replayCornerEvidence(t,altered(m,x=>x.history[0].d.index='3'),context),null);
  assert.equal(replayCornerEvidence(t,altered(m,x=>x.history[0].d.index='1'),context),null);
  assert.equal(replayCornerEvidence(t,altered(m,x=>x.board.selected=[]),context),null);
  assert.equal(replayCornerEvidence(t,altered(m,x=>x.board.first.choose.fake=1),context),null);
  assert.equal(replayCornerEvidence(t,altered(m,x=>x.prose='proved'),context),null);
  assert.equal(replayCornerEvidence(t,altered(m,x=>x.issue='no'),context),null);
  assert.equal(replayCornerEvidence(t,altered(m,x=>x.answers[0]='0180'),context),null);
  assert.equal(replayCornerEvidence(t,altered(m,x=>x.evidence=true),context),null);
 }
});
