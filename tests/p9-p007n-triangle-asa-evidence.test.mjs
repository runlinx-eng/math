// #342 P007n native asa: full runtime fingerprints, exact source and negative history tests.
 import test from 'node:test';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';
 import {sessionTaskFor} from '../dist/learning/bridges.js';
 import {LESSONS} from '../dist/learning/catalog.js';
 import * as native from '../dist/learning/phase5/b25-model.js';
 import {nativeTriangleBinding,replayNativeTriangleEvidence,submittedNativeTriangleEvidence} from '../dist/learning/p007n-triangle-asa-evidence.js';
 const SPECS=[{"sessionId":"triangledraw","index":2,"nodeId":"mt_Jf8xcX4UTq","sha":"97dac8caa523064fba09be4f7e14cfb3e0b66a18028bae7d08e671b46238e357","prompt":"底边7厘米，两端的角分别是50°和60°。放出射线并找交点。","mode":"asa","target":{"base":7,"angle":50,"other":60},"chooseCount":1,"questions":[{"label":"第三个角是多少度","value":70}]},{"sessionId":"trianglecongruent","index":2,"nodeId":"mt_167X6Ax8P7","sha":"e861d76f1bf70dfb609609121750a2658e3c601b1c992f78a1488ce20562f5eb","prompt":"底边7厘米，两端的角是50°和60°。","mode":"asa","target":{"base":7,"angle":50,"other":60},"chooseCount":1,"questions":[{"label":"第三个角是多少度","value":70},{"label":"△ABC与△DEF对应时","value":"order","options":[["order","A对应D，B对应E，C对应F"],["reverse","A一定对应F"]]}]}];
 const stable=v=>Array.isArray(v)?v.map(stable):v&&typeof v==='object'?
 Object.fromEntries(Object.keys(v).sort((a,b)=>a.localeCompare(b,'en')).map(k=>[k,stable(v[k])])):v;
 const digest=v=>createHash('sha256').update(JSON.stringify(stable(v))).digest('hex');
 const ctx=s=>({sessionId:s.sessionId,index:s.index});
 function fixture(s){
  const task=sessionTaskFor(s.sessionId,s.index),m=native.initial(task,314159);
  const set=(key,value)=>{m[key]=String(value);native.act(task,m,'g25-'+key);};
  set('base',s.target.base-1);
  for(const [k,v] of Object.entries(s.target))if(k!=='base')set(k,v);
  native.act(task,m,'g25-construct');native.act(task,m,'g25-finish');
  m.answers=s.questions.map(q=>String(q.value));
  const wrong=structuredClone(m);
  set('base',s.target.base);native.act(task,m,'g25-construct');
  for(let i=0;i<s.chooseCount;i++)native.act(task,m,'g25-choose',{index:i});
  native.act(task,m,'g25-finish');
  const good=structuredClone(m);
  return {task,wrong,good,record:{attempts:[{value:wrong},{value:good}]}};
 }
 test('P007n authentic full task hashes and independent asa construction',()=>{
  for(const s of SPECS){
   const {task,wrong,good,record}=fixture(s),context=ctx(s);
   console.log('P007N_NATIVE_FULL_TASK_SHA256 '+s.sessionId+':'+s.index+' '+digest(task));
   assert.equal(LESSONS[s.sessionId].topicId,s.nodeId);assert.equal(digest(task),s.sha);
   assert.equal(task.type,'x-g25-triangle');assert.equal(task.mode,'asa');
   assert.ok(native.valid(task,wrong));assert.ok(native.valid(task,good));
   assert.equal(native.inspect(task,wrong).correct,false);
   assert.equal(native.inspect(task,good).correct,true);
   assert.equal(nativeTriangleBinding(task,context)?.originalTaskSha256,s.sha);
   const p=replayNativeTriangleEvidence(task,good,context);assert.ok(p,s.sessionId+':'+s.index);
   assert.equal(p.independentGeometry.chosenCount,s.chooseCount);
   assert.equal(p.independentGeometry.baseCm,s.target.base);


   assert.equal(p.independentGeometry.thirdAngleDegrees,70);
   assert.ok(submittedNativeTriangleEvidence(task,good,record,context)
    ?.wrongToCorrectOriginalConstructionObserved);
   assert.equal(p.physicalRulerOrCompassSkillAssessed,false);assert.equal(p.strictAApproved,false);
  }
 });
 test('P007n reject cross-source, adjacent index, corrupted full source',()=>{
  for(const s of SPECS){
   const {task,good}=fixture(s);
   for(const context of [null,{},[],{sessionId:'other',index:s.index},
    {sessionId:s.sessionId,index:s.index+1},{sessionId:s.sessionId,index:String(s.index)}])
    assert.equal(replayNativeTriangleEvidence(task,good,context),null);
   for(const t of [{...task,prompt:task.prompt+'!'},{...task,target:{...task.target,base:100}},
    {...task,chooseCount:9},{...task,questions:[]},{...task,extra:true}])
    assert.equal(replayNativeTriangleEvidence(t,good,ctx(s)),null);
  }
 });
 test('P007n reject forged construction, missing original action and changed geometry',()=>{
  for(const s of SPECS){
   const {task,good}=fixture(s),context=ctx(s);
   const changes=[
    m=>m.history.pop(),m=>m.history.shift(),
    m=>m.history[0].f.base='12',m=>m.history[0].f.extra='fake',
    m=>m.history[0].d.index='0',
    m=>m.history[1].a='reset',
    m=>m.history.push({a:'finish',f:{},d:{}}),
    m=>m.board.base+=0.25,
    m=>m.board.points[0]&& (m.board.points[0][0]+=0.25),
    m=>m.board.first.base.base='false',
    m=>m.base='0',m=>m.answers[0]='bad',
    m=>m.seed=0,m=>m.prose='learned',m=>m.issue='fake',m=>m.extra=true
   ];
   for(const change of changes){
    const bad=structuredClone(good);change(bad);
    assert.equal(replayNativeTriangleEvidence(task,bad,context),null,change.toString());
   }
  }
 });
 test('P007n reject stale, counterfeit and absent original Check snapshots',()=>{
  for(const s of SPECS){
   const {task,wrong,good,record}=fixture(s),context=ctx(s);
   assert.ok(submittedNativeTriangleEvidence(task,good,record,context));
   for(const attempts of [[],[{value:wrong}],[{value:good},{value:good}],
    [{value:wrong},{value:wrong}],[{value:wrong},{value:good},{value:good}],
    [{value:{...wrong,seed:1}},{value:good}],
    [{value:{...wrong,history:[]}},{value:good}],
    [{value:{...wrong,board:{...wrong.board,base:100}}},{value:good}]])
    assert.equal(submittedNativeTriangleEvidence(task,good,{attempts},context),null);
  }
 });
