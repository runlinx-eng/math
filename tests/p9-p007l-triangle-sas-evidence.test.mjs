// #342 P007l native sas: full runtime fingerprints, exact source and negative history tests.
 import test from 'node:test';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';
 import {sessionTaskFor} from '../dist/learning/bridges.js';
 import {LESSONS} from '../dist/learning/catalog.js';
 import * as native from '../dist/learning/phase5/b25-model.js';
 import {nativeTriangleBinding,replayNativeTriangleEvidence,submittedNativeTriangleEvidence} from '../dist/learning/p007l-triangle-sas-evidence.js';
 const SPECS=[{"sessionId":"triangledraw","index":0,"nodeId":"mt_Jf8xcX4UTq","sha":"d78e88326c59af0ccc0ca3efe5f5504d3f8ba3a84a5299983709bc47d140aced","prompt":"先画7厘米底边，再从A点画5厘米的边，夹角40°；找出第三个顶点。","mode":"sas","target":{"base":7,"a":5,"angle":40},"chooseCount":1,"questions":[{"label":"夹角多少度","value":40}]},{"sessionId":"trianglecongruent","index":0,"nodeId":"mt_167X6Ax8P7","sha":"8bdcc1a887e2c7ae16d5c0a62eb8492cb8d5f4931e7d6f8061c8aa6d5f8e6546","prompt":"两边分别是7、5厘米，它们之间的角是40°。画出三角形。","mode":"sas","target":{"base":7,"a":5,"angle":40},"chooseCount":1,"questions":[{"label":"两边和夹角","value":"sas","options":[["sas","可以确定一个三角形形状"],["ssa","总会有两个不同形状"]]}]},{"sessionId":"trianglecongruent","index":3,"nodeId":"mt_167X6Ax8P7","sha":"c59ca48c2f01cef41ec430856d75412dc35f4b08f18a5b0fc2d61ce3e6c945d2","prompt":"两条直角边分别是6厘米和4厘米。","mode":"sas","target":{"base":6,"a":4,"angle":90},"chooseCount":1,"questions":[{"label":"这是一种","value":"right","options":[["right","两直角边确定的直角三角形"],["oblique","没有直角的三角形"]]}]},{"sessionId":"trianglepossible","index":5,"nodeId":"mt_4bc3EAxhlY","sha":"e371888c52fd73a0d699bcaab3331d09089cad2950bf907452c7d6af84543ddc","prompt":"仍用7厘米、5厘米和40°，这次让40°夹在两条已知边之间。","mode":"sas","target":{"base":7,"a":5,"angle":40},"chooseCount":1,"questions":[{"label":"不计翻面，有几种不同形状","value":1}]}];
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
 test('P007l authentic full task hashes and independent sas construction',()=>{
  for(const s of SPECS){
   const {task,wrong,good,record}=fixture(s),context=ctx(s);
   console.log('P007L_NATIVE_FULL_TASK_SHA256 '+s.sessionId+':'+s.index+' '+digest(task));
   assert.equal(LESSONS[s.sessionId].topicId,s.nodeId);assert.equal(digest(task),s.sha);
   assert.equal(task.type,'x-g25-triangle');assert.equal(task.mode,'sas');
   assert.ok(native.valid(task,wrong));assert.ok(native.valid(task,good));
   assert.equal(native.inspect(task,wrong).correct,false);
   assert.equal(native.inspect(task,good).correct,true);
   assert.equal(nativeTriangleBinding(task,context)?.originalTaskSha256,s.sha);
   const p=replayNativeTriangleEvidence(task,good,context);assert.ok(p,s.sessionId+':'+s.index);
   assert.equal(p.independentGeometry.chosenCount,s.chooseCount);
   assert.equal(p.independentGeometry.baseCm,s.target.base);



   assert.ok(submittedNativeTriangleEvidence(task,good,record,context)
    ?.wrongToCorrectOriginalConstructionObserved);
   assert.equal(p.physicalRulerOrCompassSkillAssessed,false);assert.equal(p.strictAApproved,false);
  }
 });
 test('P007l reject cross-source, adjacent index, corrupted full source',()=>{
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
 test('P007l reject forged construction, missing original action and changed geometry',()=>{
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
 test('P007l reject stale, counterfeit and absent original Check snapshots',()=>{
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
