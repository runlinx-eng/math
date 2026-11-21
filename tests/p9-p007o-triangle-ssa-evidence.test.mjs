// #342 P007o native ssa: full runtime fingerprints, exact source and negative history tests.
 import test from 'node:test';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';
 import {sessionTaskFor} from '../dist/learning/bridges.js';
 import {LESSONS} from '../dist/learning/catalog.js';
 import * as native from '../dist/learning/phase5/b25-model.js';
 import {nativeTriangleBinding,replayNativeTriangleEvidence,submittedNativeTriangleEvidence} from '../dist/learning/p007o-triangle-ssa-evidence.js';
 const SPECS=[{"sessionId":"trianglecongruent","index":4,"nodeId":"mt_167X6Ax8P7","sha":"9cd8ce5144aae798870f1c8963263591e3952ecc3c7d980c3df81b0ccbe4d5e8","prompt":"AB是7厘米，BC是5厘米，角A是40°。试两个交点。","mode":"ssa","target":{"base":7,"b":5,"angle":40},"chooseCount":2,"questions":[{"label":"两边和非夹角","value":"ambiguous","options":[["ambiguous","可能形成两个不同三角形"],["always","总能唯一确定"]]}]},{"sessionId":"trianglepossible","index":4,"nodeId":"mt_4bc3EAxhlY","sha":"605f91198116643147a2977f4482fd4f3f6b1c6de4721a7d66f21f9d72fc4d33","prompt":"AB是7厘米，BC是5厘米，角A是40°。找两个能围成的交点。","mode":"ssa","target":{"base":7,"b":5,"angle":40},"chooseCount":2,"questions":[{"label":"找到几种不同形状","value":2}]}];
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
 test('P007o authentic full task hashes and independent ssa construction',()=>{
  for(const s of SPECS){
   const {task,wrong,good,record}=fixture(s),context=ctx(s);
   console.log('P007O_NATIVE_FULL_TASK_SHA256 '+s.sessionId+':'+s.index+' '+digest(task));
   assert.equal(LESSONS[s.sessionId].topicId,s.nodeId);assert.equal(digest(task),s.sha);
   assert.equal(task.type,'x-g25-triangle');assert.equal(task.mode,'ssa');
   assert.ok(native.valid(task,wrong));assert.ok(native.valid(task,good));
   assert.equal(native.inspect(task,wrong).correct,false);
   assert.equal(native.inspect(task,good).correct,true);
   assert.equal(nativeTriangleBinding(task,context)?.originalTaskSha256,s.sha);
   const p=replayNativeTriangleEvidence(task,good,context);assert.ok(p,s.sessionId+':'+s.index);
   assert.equal(p.independentGeometry.chosenCount,s.chooseCount);
   assert.equal(p.independentGeometry.baseCm,s.target.base);

   assert.equal(p.independentGeometry.distinctNondegeneratePoints,2);

   assert.ok(submittedNativeTriangleEvidence(task,good,record,context)
    ?.wrongToCorrectOriginalConstructionObserved);
   assert.equal(p.physicalRulerOrCompassSkillAssessed,false);assert.equal(p.strictAApproved,false);
  }
 });
 test('P007o reject cross-source, adjacent index, corrupted full source',()=>{
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
 test('P007o reject forged construction, missing original action and changed geometry',()=>{
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
 test('P007o reject stale, counterfeit and absent original Check snapshots',()=>{
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
