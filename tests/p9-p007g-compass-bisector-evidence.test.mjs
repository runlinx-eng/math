// #342 P007g: exact source, independent perpendicular-bisector geometry and adversarial replay.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {sessionTaskFor} from '../dist/learning/bridges.js';
import {LESSONS} from '../dist/learning/catalog.js';
import * as native from '../dist/learning/phase5/b23-model.js';
import {nativeCompassBisectorBinding,replayNativeCompassBisectorEvidence,
 submittedNativeCompassBisectorEvidence} from '../dist/learning/p007g-compass-bisector-evidence.js';
const sha='05568f1f7538a0362961fc24bb1411c5e568e36abc065c1f6b1598554150aaba';
const ctx={sessionId:'compasswork',index:0};
const stable=v=>Array.isArray(v)?v.map(stable):v&&typeof v==='object'?
 Object.fromEntries(Object.keys(v).sort((a,b)=>a.localeCompare(b,'en')).map(k=>[k,stable(v[k])])):v;
const digest=v=>createHash('sha256').update(JSON.stringify(stable(v))).digest('hex');
function fixture(){
 const task=sessionTaskFor('compasswork',0),m=native.initial(task,314159);
 const arc=(center,r)=>{m.center=center;m.radius=String(r);native.act(task,m,'g23-arc');};
 const meet=index=>native.act(task,m,'g23-meet',{index});
 arc('A',5);arc('B',4);meet(0);
 const wrong=structuredClone(m);
 arc('B',5);meet(0);meet(1);native.act(task,m,'g23-line');
 m.answers[0]='equal';
 const good=structuredClone(m);
 return {task,wrong,good,record:{attempts:[{value:wrong},{value:good}]}};
}
test('P007g source/native control and independent equal-distance perpendicular bisector',()=>{
 const {task,wrong,good,record}=fixture();
 console.log('P007G_NATIVE_FULL_TASK_SHA256 compasswork:0 '+digest(task));
 assert.equal(LESSONS.compasswork.topicId,'mt_ZrsqGVG-Wt');
 assert.equal(digest(task),sha);
 assert.equal(task.type,'x-s23-compass');
 assert.equal(task.mode,'bisector');
 assert.equal(native.valid(task,wrong),true);
 assert.equal(native.valid(task,good),true);
 assert.equal(native.inspect(task,wrong).correct,false);
 assert.equal(native.inspect(task,good).correct,true);
 assert.equal(nativeCompassBisectorBinding(task,ctx)?.originalTaskSha256,sha);
 const p=replayNativeCompassBisectorEvidence(task,good,ctx);
 assert.ok(p);assert.equal(p.originalArcCount,3);assert.equal(p.originalMarkCount,3);
 assert.deepEqual(p.independentGeometry.midpoint,[5,5]);
 assert.deepEqual(p.independentGeometry.intersections,[[5,9],[5,1]]);
 assert.equal(p.independentGeometry.arcRadius,5);
 assert.equal(p.independentGeometry.bisectorLength,8);
 assert.equal(p.independentGeometry.perpendicularDotProduct,0);
 assert.ok(p.independentGeometry.equalRadiusAndDistanceProved);
 assert.ok(p.independentGeometry.perpendicularAtMidpoint);
 assert.equal(p.physicalCompassOrRulerSkillAssessed,false);
 assert.equal(p.strictAApproved,false);
 assert.ok(submittedNativeCompassBisectorEvidence(task,good,record,ctx)
  ?.wrongToCorrectEqualRadiusAndBisectorObserved);
});
test('P007g reject wrong sources, neighboring indices and modified exact tasks',()=>{
 const {task,good}=fixture();
 for(const context of [null,{},[],{sessionId:'circleparts',index:0},
  {sessionId:'compasswork',index:1},{sessionId:'compasswork',index:'0'},
  {sessionId:'__proto__',index:0}]){
  assert.equal(nativeCompassBisectorBinding(task,context),null);
  assert.equal(replayNativeCompassBisectorEvidence(task,good,context),null);
 }
 for(const changed of [{...task,mode:'angle'},{...task,prompt:task.prompt+'!'},
  {...task,questions:[]},{...task,extra:true}]){
  assert.equal(replayNativeCompassBisectorEvidence(changed,good,ctx),null);
 }
});
test('P007g fail closed on fabricated arc/meet/line, geometry, events and fields',()=>{
 const {task,good}=fixture();
 const changes=[
  m=>m.history.pop(),m=>m.history.shift(),
  m=>m.history[0].f.center='C',m=>m.history[0].f.radius='-3',
  m=>m.history[0].f.extra='fake',m=>m.history[2].d.index='2',
  m=>m.history[2].d.extra='fake',m=>m.history[2].a='line',
  m=>m.history.splice(2,0,{a:'meet',f:{},d:{index:'9'}}),
  m=>m.history.push({a:'measure',f:{},d:{}}),
  m=>m.board.circles.A=4,m=>m.board.marked=[0],
  m=>m.board.finished=false,m=>m.board.lastArc.center='A',
  m=>m.board.first.arc.radius='7',m=>m.center='A',
  m=>m.radius='4',m=>m.answers[0]='look',
  m=>m.prose='I understand',m=>m.seed=0,m=>m.issue='fake',
  m=>m.extra='fake'
 ];
 for(const change of changes){
  const bad=structuredClone(good);change(bad);
  assert.equal(replayNativeCompassBisectorEvidence(task,bad,ctx),null,change.toString());
 }
});
test('P007g reject stale or fabricated original Check chronology',()=>{
 const {task,wrong,good,record}=fixture();
 assert.ok(submittedNativeCompassBisectorEvidence(task,good,record,ctx));
 const cases=[{attempts:[]},{attempts:[{value:wrong}]},
  {attempts:[{value:good},{value:good}]},
  {attempts:[{value:wrong},{value:wrong}]},
  {attempts:[{value:wrong},{value:good},{value:good}]},
  {attempts:[{value:{...wrong,seed:1}},{value:good}]},
  {attempts:[{value:{...wrong,history:[]}},{value:good}]},
  {attempts:[{value:{...wrong,board:{...wrong.board,finished:true}}},{value:good}]},
  {attempts:[{value:{...wrong,extra:'invented'}},{value:good}]}];
 for(const c of cases)
  assert.equal(submittedNativeCompassBisectorEvidence(task,good,c,ctx),null);
 const bare=native.initial(task,314159);
 assert.equal(replayNativeCompassBisectorEvidence(task,bare,ctx),null);
});
