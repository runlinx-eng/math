// #342 P007p: three native source-locked circle geometry contracts.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {sessionTaskFor} from '../dist/learning/bridges.js';
import {LESSONS} from '../dist/learning/catalog.js';
import * as native from '../dist/learning/phase5/b23-model.js';
import {nativeCircleBinding,replayNativeCircleEvidence,
 submittedNativeCircleEvidence} from '../dist/learning/p007p-circle-terminology-evidence.js';

const specs=[
 {index:0,r:4.5,sha:'a1466d51fcca03b4c7946c32cf66db3dc1eea6a4bf0fff0b1baea449ee38a234'}
];
const stable=v=>Array.isArray(v)?v.map(stable):v&&typeof v==='object'?
 Object.fromEntries(Object.keys(v).sort((a,b)=>a.localeCompare(b,'en')).map(k=>[k,stable(v[k])])):v;
const hash=v=>createHash('sha256').update(JSON.stringify(stable(v))).digest('hex');
const context=i=>({sessionId:'advancedWords38',index:i});
function fixture(s){
 const task=sessionTaskFor('advancedWords38',s.index),m=native.initial(task,314159);
 const actions=['radial','diameter','rim',...(task.turn?['turn']:[])];
 const draw=r=>{
  m.radius=String(r);native.act(task,m,'g23-circle');
  for(const a of actions)native.act(task,m,'g23-'+a);
 };
 m.answers=task.questions.map(q=>String(q.value));
 draw(s.r+1);const wrong=structuredClone(m);
 draw(s.r);const good=structuredClone(m);
 return {task,wrong,good,record:{attempts:[{value:wrong},{value:good}]}};
}
test('P007p original task identities and independent radius/diameter geometry',()=>{
 assert.equal(LESSONS.advancedWords38.topicId,'mt_3rTIyJDw7-');
 for(const s of specs){
  const {task,wrong,good,record}=fixture(s),ctx=context(s.index);
  console.log('P007P_NATIVE_FULL_TASK_SHA256 advancedWords38:'+s.index+' '+hash(task));
  assert.equal(hash(task),s.sha);
  assert.equal(task.type,'x-s23-circle');
  assert.equal(native.valid(task,wrong),true);
  assert.equal(native.valid(task,good),true);
  assert.equal(native.inspect(task,wrong).correct,false);
  assert.equal(native.inspect(task,good).correct,true);
  assert.equal(nativeCircleBinding(task,ctx)?.originalTaskSha256,s.sha);
  const p=replayNativeCircleEvidence(task,good,ctx);
  assert.ok(p,'native circle proof '+s.index);
  assert.equal(p.originalCircleDraws,2);
  assert.ok(Math.abs(p.independentGeometry.radiusCm-s.r)<1e-10);
  assert.ok(Math.abs(p.independentGeometry.diameterCm-2*s.r)<1e-10);
  assert.ok(Math.abs(p.independentGeometry.areaSquareCm-Math.PI*s.r*s.r)<1e-9);
  assert.ok(Math.abs(p.independentGeometry.circumferenceCm-2*Math.PI*s.r)<1e-9);
  assert.ok(Math.abs(p.independentGeometry.rotatedDiameterCm-2*s.r)<1e-9);
  assert.equal(p.independentGeometry.rotationDegrees,s.index===1?45:0);
  assert.deepEqual(p.independentGeometry.diameterMidpoint,[0,0]);
  assert.ok(submittedNativeCircleEvidence(task,good,record,ctx)
   ?.wrongToCorrectRadiusRedrawObserved);
  assert.equal(p.physicalCompassOrRulerSkillAssessed,false);
  assert.equal(p.strictAApproved,false);
 }
});
test('P007p reject wrong source, altered exact task, neighboring index, missing context',()=>{
 for(const s of specs){
  const {task,good}=fixture(s);
  for(const ctx of [null,{},[],{sessionId:'shapemeasures',index:s.index},
    {sessionId:'advancedWords38',index:String(s.index)},
    {sessionId:'advancedWords38',index:(s.index+1)%3},
    {sessionId:'__proto__',index:s.index}]){
   assert.equal(nativeCircleBinding(task,ctx),null);
   assert.equal(replayNativeCircleEvidence(task,good,ctx),null);
  }
  for(const change of [{...task,radius:4.75},{...task,prompt:task.prompt+'!'},
    {...task,questions:[]},{...task,extra:true},{...task,turn:!task.turn}]){
   assert.equal(replayNativeCircleEvidence(change,good,context(s.index)),null);
  }
 }
});
test('P007p fail closed for forged event, model, board and missing original action',()=>{
 for(const s of specs){
  const {task,good}=fixture(s),ctx=context(s.index);
  const changes=[
   m=>m.history.pop(),
   m=>m.history.shift(),
   m=>m.history[0].a='draw',
   m=>m.history[0].f.radius='-1',
   m=>m.history[0].f.radius='NaN',
   m=>m.history[0].f.extra='fake',
   m=>m.history[0].d.index='1',
   m=>m.history.splice(1,0,structuredClone(m.history[1])),
   m=>m.history.push({a:'turn',f:{},d:{}}),
   m=>m.history.push({a:'reset',f:{},d:{}}),
   m=>m.board.radius+=0.01,
   m=>m.board.turns++,
   m=>m.board.first.circle.radius='fake',
   m=>m.radius='5',
   m=>m.answers[0]='garbage',
   m=>m.seed=0,
   m=>m.issue='fake',
   m=>m.prose='I understand',
   m=>m.extra='fake'
  ];
  for(const change of changes){
   const bad=structuredClone(good);change(bad);
   assert.equal(replayNativeCircleEvidence(task,bad,ctx),null,change.toString());
  }
 }
});
test('P007p reject stale, forged or fabricated original Check revisions',()=>{
 for(const s of specs){
  const {task,wrong,good,record}=fixture(s),ctx=context(s.index);
  assert.ok(submittedNativeCircleEvidence(task,good,record,ctx));
  const badRecords=[
   {attempts:[]},{attempts:[{value:wrong}]},
   {attempts:[{value:good},{value:good}]},
   {attempts:[{value:wrong},{value:wrong}]},
   {attempts:[{value:wrong},{value:good},{value:good}]},
   {attempts:[{value:{...wrong,seed:1}},{value:good}]},
   {attempts:[{value:{...wrong,radius:'100'}},{value:good}]},
   {attempts:[{value:{...wrong,history:[]}},{value:good}]},
   {attempts:[{value:{...wrong,extra:true}},{value:good}]}
  ];
  for(const rec of badRecords)
   assert.equal(submittedNativeCircleEvidence(task,good,rec,ctx),null);
  const noCircle=native.initial(task,314159);
  noCircle.answers=task.questions.map(q=>String(q.value));
  assert.equal(replayNativeCircleEvidence(task,noCircle,ctx),null);
 }
});
