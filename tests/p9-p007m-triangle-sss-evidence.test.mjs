// #342 P007m native sss: full runtime fingerprints, exact source and negative history tests.
 import test from 'node:test';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';
 import {sessionTaskFor} from '../dist/learning/bridges.js';
 import {LESSONS} from '../dist/learning/catalog.js';
 import * as native from '../dist/learning/phase5/b25-model.js';
 import {nativeTriangleBinding,replayNativeTriangleEvidence,submittedNativeTriangleEvidence} from '../dist/learning/p007m-triangle-sss-evidence.js';
 const SPECS=[{"sessionId":"triangledraw","index":1,"nodeId":"mt_Jf8xcX4UTq","sha":"302faf6169e478bf52f437da2260f3df89c44e6dca59685338936ca75e60d9dd","prompt":"底边6厘米；从A、B分别画半径5、4厘米的圆弧，找交点。","mode":"sss","target":{"base":6,"a":5,"b":4},"chooseCount":1,"questions":[{"label":"两圆交点到A的距离","value":5},{"label":"到B的距离","value":4}]},{"sessionId":"trianglecongruent","index":1,"nodeId":"mt_167X6Ax8P7","sha":"9a7ee5c241934793e038f0666c9a05651d59eb8378428852a9971202786d884b","prompt":"三条边分别是6、5、4厘米。用圆弧找一个交点。","mode":"sss","target":{"base":6,"a":5,"b":4},"chooseCount":1,"questions":[{"label":"三条边对应相等的两个三角形","value":"congruent","options":[["congruent","全等，可通过移动或翻面重合"],["different","一定不同"]]}]},{"sessionId":"trianglepossible","index":0,"nodeId":"mt_4bc3EAxhlY","sha":"885bc61dfe1a5cba9a124a647ff61d7dd1cb01357b298aea0239d552ca5648f6","prompt":"底边8厘米；两段圆弧半径分别是3、4厘米。找交点。","mode":"sss","target":{"base":8,"a":3,"b":4},"chooseCount":0,"questions":[{"label":"能围成几个三角形","value":0}]},{"sessionId":"trianglepossible","index":1,"nodeId":"mt_4bc3EAxhlY","sha":"c792e3a7b1e6dafbad974834706e6fc14792f74d0b0e8f9f61d5b4ad168959b8","prompt":"底边7厘米，圆弧半径3和4厘米。交点如果落在底边上，会怎样？","mode":"sss","target":{"base":7,"a":3,"b":4},"chooseCount":0,"questions":[{"label":"两圆只在底边上相碰","value":"flat","options":[["flat","三条边排成直线，不能围成三角形"],["triangle","已经围成一个三角形"]]}]},{"sessionId":"trianglepossible","index":2,"nodeId":"mt_4bc3EAxhlY","sha":"3a91dd0733dfbcf86a1f7e9800b5758626ebd3065b9fa6b789ed9a9d77830eca","prompt":"底边7厘米，圆弧半径3和5厘米。找一个有效交点。","mode":"sss","target":{"base":7,"a":3,"b":5},"chooseCount":1,"questions":[{"label":"不计翻面，有几种不同形状","value":1}]}];
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
 test('P007m authentic full task hashes and independent sss construction',()=>{
  for(const s of SPECS){
   const {task,wrong,good,record}=fixture(s),context=ctx(s);
   console.log('P007M_NATIVE_FULL_TASK_SHA256 '+s.sessionId+':'+s.index+' '+digest(task));
   assert.equal(LESSONS[s.sessionId].topicId,s.nodeId);assert.equal(digest(task),s.sha);
   assert.equal(task.type,'x-g25-triangle');assert.equal(task.mode,'sss');
   assert.ok(native.valid(task,wrong));assert.ok(native.valid(task,good));
   assert.equal(native.inspect(task,wrong).correct,false);
   assert.equal(native.inspect(task,good).correct,true);
   assert.equal(nativeTriangleBinding(task,context)?.originalTaskSha256,s.sha);
   const p=replayNativeTriangleEvidence(task,good,context);assert.ok(p,s.sessionId+':'+s.index);
   assert.equal(p.independentGeometry.chosenCount,s.chooseCount);
   assert.equal(p.independentGeometry.baseCm,s.target.base);
   if(s.chooseCount===0)assert.equal(p.independentGeometry.distinctNondegeneratePoints,0);


   assert.ok(submittedNativeTriangleEvidence(task,good,record,context)
    ?.wrongToCorrectOriginalConstructionObserved);
   assert.equal(p.physicalRulerOrCompassSkillAssessed,false);assert.equal(p.strictAApproved,false);
  }
 });
 test('P007m reject cross-source, adjacent index, corrupted full source',()=>{
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
 test('P007m reject forged construction, missing original action and changed geometry',()=>{
  for(const s of SPECS){
   const {task,good}=fixture(s),context=ctx(s);
   const changes=[
    m=>m.history.pop(),m=>m.history.shift(),
    m=>m.history[0].f.base='12',m=>m.history[0].f.extra='fake',
    m=>m.history[0].d.index='0',
    m=>m.history[1].a='reset',
    m=>m.history.push({a:'finish',f:{},d:{}}),
    m=>m.board.base+=0.25,
    m=>{if(m.board.points.length)m.board.points[0][0]+=0.25;else m.board.points=[[0,1]];},
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
 test('P007m reject stale, counterfeit and absent original Check snapshots',()=>{
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
