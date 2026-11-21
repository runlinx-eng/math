// #342 native perpendicular exact source/check/geometry tamper-resistant Node gate.
import test from 'node:test';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';
import {sessionTaskFor} from '../dist/learning/bridges.js';
import {LESSONS} from '../dist/learning/catalog.js';
import * as native from '../dist/learning/phase5/b23-model.js';
import {nativeCompassBinding,replayNativeCompassEvidence,submittedNativeCompassEvidence} from '../dist/learning/p007i-compass-perpendicular-evidence.js';
const stable=v=>Array.isArray(v)?v.map(stable):v&&typeof v==='object'?
 Object.fromEntries(Object.keys(v).sort((a,b)=>a.localeCompare(b,'en')).map(k=>[k,stable(v[k])])):v;
const digest=v=>createHash('sha256').update(JSON.stringify(stable(v))).digest('hex');
const ctx={sessionId:'compasswork',index:2},sha='1eebbac570ca690187b7b129b88c541663d8c12e9ebfe7b76c0e0ab01de11a9a';
function fixture(){
 const t=sessionTaskFor('compasswork',2),m=native.initial(t,314159);
 const action=(kind,field,value,data={})=>{if(kind==='arc'){m.center=field;m.radius=String(value);}native.act(t,m,'g23-'+kind,data);};
 action('arc','P',5);action('arc','C',5);action('arc','D',4);
 const wrong=structuredClone(m);
 action('arc','D',5);action('meet',null,null,{index:1});action('line');
 m.answers[0]='90';
 return {t,wrong,good:structuredClone(m),record:{attempts:[{value:wrong},{value:structuredClone(m)}]}};
}
test('P007i exact task, native replay and independent geometry',()=>{
 const {t,wrong,good,record}=fixture();
 console.log('P007I_NATIVE_FULL_TASK_SHA256 compasswork:2 '+digest(t));
 assert.equal(LESSONS.compasswork.topicId,'mt_ZrsqGVG-Wt');assert.equal(digest(t),sha);
 assert.equal(t.mode,'perpendicular');assert.equal(native.valid(t,wrong),true);
 assert.equal(native.valid(t,good),true);assert.equal(native.inspect(t,wrong).correct,false);
 assert.equal(native.inspect(t,good).correct,true);
 assert.equal(nativeCompassBinding(t,ctx)?.originalTaskSha256,sha);
 const p=replayNativeCompassEvidence(t,good,ctx);assert.ok(p);
 assert.deepEqual(p.independentGeometry.arcIntersection,[5,2]);
 assert.deepEqual(p.independentGeometry.footOnLine,[5,5]);
 assert.equal(p.independentGeometry.perpendicularDotProduct,0);
 assert.equal(p.strictAApproved,false);
 assert.ok(submittedNativeCompassEvidence(t,good,record,ctx)?.wrongToCorrectArcConstructionObserved);
});
test('P007i reject wrong source, neighbor and mutated native task',()=>{
 const {t,good}=fixture();
 for(const context of [null,{},[],{sessionId:'circleparts',index:2},
 {sessionId:'compasswork',index:0},{sessionId:'compasswork',index:'2'},
 {sessionId:'__proto__',index:2}])
  assert.equal(replayNativeCompassEvidence(t,good,context),null);
 for(const bad of [{...t,mode:'fake'},{...t,prompt:t.prompt+'!'},
  {...t,questions:[]},{...t,extra:true}])
  assert.equal(replayNativeCompassEvidence(bad,good,ctx),null);
});
test('P007i reject forged events, board, answers and signatures',()=>{
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
test('P007i reject stale, forged or missing original Checks',()=>{
 const {t,wrong,good,record}=fixture();
 assert.ok(submittedNativeCompassEvidence(t,good,record,ctx));
 for(const attempts of [[],[{value:wrong}],[{value:good},{value:good}],
 [{value:wrong},{value:wrong}],[{value:wrong},{value:good},{value:good}],
 [{value:{...wrong,seed:1}},{value:good}],
 [{value:{...wrong,history:[]}},{value:good}]])
 assert.equal(submittedNativeCompassEvidence(t,good,{attempts},ctx),null);
});
