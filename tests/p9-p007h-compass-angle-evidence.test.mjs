// #342 native angle exact source/check/geometry tamper-resistant Node gate.
import test from 'node:test';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';
import {sessionTaskFor} from '../dist/learning/bridges.js';
import {LESSONS} from '../dist/learning/catalog.js';
import * as native from '../dist/learning/phase5/b23-model.js';
import {nativeCompassBinding,replayNativeCompassEvidence,submittedNativeCompassEvidence} from '../dist/learning/p007h-compass-angle-evidence.js';
const stable=v=>Array.isArray(v)?v.map(stable):v&&typeof v==='object'?
 Object.fromEntries(Object.keys(v).sort((a,b)=>a.localeCompare(b,'en')).map(k=>[k,stable(v[k])])):v;
const digest=v=>createHash('sha256').update(JSON.stringify(stable(v))).digest('hex');
const ctx={sessionId:'compasswork',index:1},sha='afc67970d24d820a8a7cedabd17eebeee81d46dbf74999cb27496b36bd029579';
function fixture(){
 const t=sessionTaskFor('compasswork',1),m=native.initial(t,314159);
 const action=(kind,field,value,data={})=>{if(kind==='arc'){m.center=field;m.radius=String(value);}native.act(t,m,'g23-'+kind,data);};
 action('arc','O',2);action('arc','C',2);action('arc','D',3);
 const wrong=structuredClone(m);
 action('arc','D',2);action('meet',null,null,{index:1});action('line');action('measure');
 m.answers[0]='45';
 return {t,wrong,good:structuredClone(m),record:{attempts:[{value:wrong},{value:structuredClone(m)}]}};
}
test('P007h exact task, native replay and independent geometry',()=>{
 const {t,wrong,good,record}=fixture();
 console.log('P007H_NATIVE_FULL_TASK_SHA256 compasswork:1 '+digest(t));
 assert.equal(LESSONS.compasswork.topicId,'mt_ZrsqGVG-Wt');assert.equal(digest(t),sha);
 assert.equal(t.mode,'angle');assert.equal(native.valid(t,wrong),true);
 assert.equal(native.valid(t,good),true);assert.equal(native.inspect(t,wrong).correct,false);
 assert.equal(native.inspect(t,good).correct,true);
 assert.equal(nativeCompassBinding(t,ctx)?.originalTaskSha256,sha);
 const p=replayNativeCompassEvidence(t,good,ctx);assert.ok(p);
 assert.deepEqual(p.independentGeometry.arcIntersection,[4,4]);
 assert.deepEqual(p.independentGeometry.halfAnglesDegrees,[45,45]);
 assert.equal(p.strictAApproved,false);
 assert.ok(submittedNativeCompassEvidence(t,good,record,ctx)?.wrongToCorrectArcConstructionObserved);
});
test('P007h reject wrong source, neighbor and mutated native task',()=>{
 const {t,good}=fixture();
 for(const context of [null,{},[],{sessionId:'circleparts',index:1},
 {sessionId:'compasswork',index:0},{sessionId:'compasswork',index:'1'},
 {sessionId:'__proto__',index:1}])
  assert.equal(replayNativeCompassEvidence(t,good,context),null);
 for(const bad of [{...t,mode:'fake'},{...t,prompt:t.prompt+'!'},
  {...t,questions:[]},{...t,extra:true}])
  assert.equal(replayNativeCompassEvidence(bad,good,ctx),null);
});
test('P007h reject forged events, board, answers and signatures',()=>{
 const {t,good}=fixture();
 const changes=[
  m=>m.history.pop(),m=>m.history.shift(),m=>m.history[0].f.radius='9',
  m=>m.history[0].f.center='A',m=>m.history[1].d.index='0',
  m=>m.history[3].f.radius='4.5',m=>m.history[4].d.index='0',
  m=>m.history.push({a:'reset',f:{},d:{}}),
  m=>m.board.circles.C=4,m=>m.board.marked=[0],
  m=>m.board.finished=false,m=>m.board.first.arc.center='X',
  m=>m.center='A',m=>m.radius='8',m=>m.answers[0]='99',
  m=>m.issue='fake',m=>m.prose='I can prove it',
  m=>m.seed=0,m=>m.extra=true
 ];
 for(const change of changes){const m=structuredClone(good);change(m);
  assert.equal(replayNativeCompassEvidence(t,m,ctx),null,change.toString());}
});
test('P007h reject stale, forged or missing original Checks',()=>{
 const {t,wrong,good,record}=fixture();
 assert.ok(submittedNativeCompassEvidence(t,good,record,ctx));
 for(const attempts of [[],[{value:wrong}],[{value:good},{value:good}],
 [{value:wrong},{value:wrong}],[{value:wrong},{value:good},{value:good}],
 [{value:{...wrong,seed:1}},{value:good}],
 [{value:{...wrong,history:[]}},{value:good}]])
 assert.equal(submittedNativeCompassEvidence(t,good,{attempts},ctx),null);
});
