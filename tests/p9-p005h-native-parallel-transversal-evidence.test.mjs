// #342 P005h: original B25 parallel-line geometry and adversarial replay.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {sessionTaskFor} from '../dist/learning/bridges.js';
import {LESSONS} from '../dist/learning/catalog.js';
import * as native from '../dist/learning/phase5/b25-model.js';
import {parallelBinding as binding,replayParallelEvidence as replay,
 submittedParallelEvidence as submitted}
 from '../dist/learning/p005h-native-parallel-transversal-evidence.js';
const CASES=[
 {id:'parallelangle',index:0,node:'mt_H_pNJ3ZI_S',
  sha:'cdbbc402bfcdd7e8593aa876f501b474fc69660ab61edce5e128fa3ca92ad28e'},
 {id:'parallelangle',index:1,node:'mt_H_pNJ3ZI_S',
  sha:'455479ecfd0c03dc7b71f9e935889928d0727461b2bcf2c2faa74990eeab8b08'},
 {id:'parallelangle',index:2,node:'mt_H_pNJ3ZI_S',
  sha:'74516eb7aa89d993be4b4c918e5aab4b1ccd7d7c08360714fb4b2596411d6fb9'}
];
const ctx=s=>({sessionId:s.id,index:s.index});
const task=s=>sessionTaskFor(s.id,s.index);
const stable=v=>Array.isArray(v)?v.map(stable):v&&typeof v==='object'?
 Object.fromEntries(Object.keys(v).sort((a,b)=>a.localeCompare(b,'en'))
 .map(k=>[k,stable(v[k])])):v;
const hash=t=>createHash('sha256').update(JSON.stringify(stable(t))).digest('hex');
function make(s,wrong=false){
 const t=task(s),m=native.initial(t,314159);
 native.act(t,m,'g25-slide');
 t.questions.forEach((q,i)=>{m.answers[i]=String(q.value);});
 if(wrong)m.answers[0]=String(t.questions[0].options?'supplement':'71');
 return m;
}
const tamper=(m,cb)=>{const x=structuredClone(m);cb(x);return x;};
test('P005h exact original source/full task SHA and Euclidean relations',()=>{
 for(const s of CASES){
  const t=task(s),m=make(s),proof=replay(t,m,ctx(s));
  console.log('P005H_NATIVE_FULL_TASK_SHA256 '+s.id+':'+s.index+' '+hash(t));
  assert.equal(hash(t),s.sha);
  assert.equal(LESSONS[s.id].topicId,s.node);
  assert.equal(t.type,'x-g25-parallel');
  assert.equal(binding(t,ctx(s))?.nodeId,s.node);
  assert.equal(native.valid(t,m),true);
  assert.equal(native.inspect(t,m).correct,true);
  assert.ok(proof);
  assert.equal(proof.kind,'native-parallel-transversal-relations');
  assert.equal(proof.originalSlideEvents.length,1);
  assert.ok(Math.abs(proof.independentCorrespondingAngleDegrees-70)<1e-9);
  assert.ok(Math.abs(proof.independentAlternateInteriorAngleDegrees-70)<1e-9);
  assert.ok(Math.abs(proof.independentSameSideSupplementDegrees-110)<1e-9);
  assert.ok(Math.abs(proof.screenGeometryAngles.sameSideInteriorSum-180)<1e-9);
  assert.equal(proof.strictAApproved,false);
  assert.equal(proof.verbalProofAssessed,false);
 }
});
test('P005h original wrong to correct Check and strict latest submission',()=>{
 for(const s of CASES){
  const t=task(s),m=make(s),wrong=make(s,true),context=ctx(s);
  assert.equal(native.inspect(t,wrong).correct,false);
  assert.equal(replay(t,wrong,context),null);
  assert.equal(replay(t,native.initial(t,314159),context),null);
  assert.ok(submitted(t,m,{attempts:[{value:wrong},{value:structuredClone(m)}]},context));
  assert.equal(submitted(t,m,{attempts:[{value:wrong}]},context),null);
  assert.equal(submitted(t,m,{attempts:[]},context),null);
  assert.equal(submitted(t,wrong,{attempts:[{value:m}]},context),null);
  assert.equal(replay(t,tamper(m,x=>x.answers[0]=''),context),null);
  if(t.questions[0].options)assert.equal(replay(t,tamper(m,x=>
   x.answers[0]='alternate-angle'),context),null);
  else assert.equal(replay(t,tamper(m,x=>x.answers[0]='070'),context),null);
 }
});
test('P005h rejects forged origin, slide toggles, hidden actions and shape edits',()=>{
 for(const s of CASES){
  const t=task(s),m=make(s),context=ctx(s);
  assert.equal(replay(t,tamper(m,x=>x.history=[]),context),null);
  assert.equal(replay(t,tamper(m,x=>x.history[0].a='choose'),context),null);
  assert.equal(replay(t,tamper(m,x=>x.history[0].f.angle='70'),context),null);
  assert.equal(replay(t,tamper(m,x=>x.history[0].d.index='0'),context),null);
  assert.equal(replay(t,tamper(m,x=>x.board.slid=false),context),null);
  assert.equal(replay(t,tamper(m,x=>x.board.first.slide.fake=1),context),null);
  assert.equal(replay(t,tamper(m,x=>x.prose='I proved the theorem'),context),null);
  assert.equal(replay(t,tamper(m,x=>x.length='1'),context),null);
  assert.equal(replay(t,tamper(m,x=>x.issue='wrong'),context),null);
  assert.equal(replay({...t,prompt:t.prompt+'?'},m,context),null);
  assert.equal(replay({...t,questions:[{label:'fake',value:70}]},m,context),null);
  assert.equal(replay(t,m,{sessionId:'angletypes',index:s.index}),null);
  assert.equal(replay(t,m,{sessionId:s.id,index:999}),null);
  assert.equal(replay(t,m,{sessionId:s.id,index:String(s.index)}),null);
  const redundant=make(s);
  native.act(t,redundant,'g25-slide');
  native.act(t,redundant,'g25-slide');
  assert.equal(native.valid(t,redundant),true);
  assert.equal(native.inspect(t,redundant).correct,true);
  assert.equal(replay(t,redundant,context),null);
 }
});
