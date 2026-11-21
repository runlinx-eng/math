// #342 P007j three native rectangles, independent perimeter/area/angles, negative cases.
import test from 'node:test';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';
import {sessionTaskFor} from '../dist/learning/bridges.js';
import {LESSONS} from '../dist/learning/catalog.js';
import * as native from '../dist/learning/phase5/b23-model.js';
import {nativeRectangleBinding,replayNativeRectangleEvidence,
 submittedNativeRectangleEvidence} from '../dist/learning/p007j-rectangle-invariants-evidence.js';
const SPECS=[{"sessionId":"rectanglefacts","index":0,"nodeId":"mt_KFKUR_gBg_","sha":"51525557b3ab785b3a256fc25dd26a594c233e27f89c4022977b9e01d3f4703b","prompt":"一边8厘米，周长28厘米。先想另一边，再画出长方形。","w":8,"h":6,"questions":[{"label":"另一边多少厘米","value":6}],"inference":"perimeter"},{"sessionId":"rectanglefacts","index":1,"nodeId":"mt_KFKUR_gBg_","sha":"5ead1dacb723f7815f8644c3ca88a37f9441430aa415fe830d521b54b5a097e0","prompt":"画长7厘米、宽3厘米的长方形，看看每个角。","w":7,"h":3,"questions":[{"label":"每个角多少度","value":90}],"inference":"right-angles"},{"sessionId":"rectanglefacts","index":2,"nodeId":"mt_KFKUR_gBg_","sha":"0426eaa9e4788cbcddee61834514a651dbb9bc068f45e3fc9f3abf3b7e856110","prompt":"一边6厘米，面积24平方厘米。先找另一边，再画出来。","w":6,"h":4,"questions":[{"label":"另一边多少厘米","value":4},{"label":"周长多少厘米","value":20}],"inference":"area"}];
const stable=v=>Array.isArray(v)?v.map(stable):v&&typeof v==='object'?
 Object.fromEntries(Object.keys(v).sort((a,b)=>a.localeCompare(b,'en')).map(k=>[k,stable(v[k])])):v;
const digest=v=>createHash('sha256').update(JSON.stringify(stable(v))).digest('hex');
const ctx=s=>({sessionId:s.sessionId,index:s.index});
function fixture(s){
 const t=sessionTaskFor(s.sessionId,s.index),m=native.initial(t,314159);
 const draw=w=>{m.first=String(w);m.second=String(s.h);native.act(t,m,'g23-draw');};
 m.answers=s.questions.map(q=>String(q.value));
 draw(s.w-1);const wrong=structuredClone(m);
 draw(s.w);const good=structuredClone(m);
 return {t,wrong,good,record:{attempts:[{value:wrong},{value:good}]}};
}
test('P007j source/geometry and three original inverse contracts',()=>{
 assert.equal(LESSONS.rectanglefacts.topicId,'mt_KFKUR_gBg_');
 for(const s of SPECS){
  const {t,wrong,good,record}=fixture(s),c=ctx(s);
  console.log('P007J_NATIVE_FULL_TASK_SHA256 rectanglefacts:'+s.index+' '+digest(t));
  assert.equal(digest(t),s.sha);assert.equal(t.mode,'rectangle');
  assert.equal(native.valid(t,wrong),true);assert.equal(native.valid(t,good),true);
  assert.equal(native.inspect(t,wrong).correct,false);assert.equal(native.inspect(t,good).correct,true);
  assert.equal(nativeRectangleBinding(t,c)?.originalTaskSha256,s.sha);
  const proof=replayNativeRectangleEvidence(t,good,c);assert.ok(proof);
  assert.equal(proof.independentGeometry.areaSquareCm,s.w*s.h);
  assert.equal(proof.independentGeometry.perimeterCm,2*(s.w+s.h));
  assert.deepEqual(proof.independentGeometry.rightAnglesDegrees,[90,90,90,90]);
  assert.equal(proof.independentGeometry.inferredMissingSideCm,s.h);
  assert.ok(submittedNativeRectangleEvidence(t,good,record,c)?.wrongToCorrectNativeDrawObserved);
  assert.equal(proof.physicalRulerSkillAssessed,false);assert.equal(proof.strictAApproved,false);
 }
});
test('P007j fail closed on altered source or neighbor',()=>{
 for(const s of SPECS){
  const {t,good}=fixture(s),c=ctx(s);
  for(const bad of [null,{},[],{sessionId:'shapemeasures',index:s.index},
   {sessionId:s.sessionId,index:(s.index+1)%3},
   {sessionId:s.sessionId,index:String(s.index)}])
   assert.equal(replayNativeRectangleEvidence(t,good,bad),null);
  for(const bad of [{...t,prompt:t.prompt+'?'},{...t,questions:[]},
   {...t,target:[s.w,s.h+.5]},{...t,extra:true}])
   assert.equal(replayNativeRectangleEvidence(bad,good,c),null);
 }
});
test('P007j reject fake draw, board/answer/missing events and changed seed',()=>{
 for(const s of SPECS){
  const {t,good}=fixture(s),c=ctx(s);
  const changes=[m=>m.history.pop(),m=>m.history[0].f.first='10',
   m=>m.history[0].f.second='0',m=>m.history[0].f.extra='foo',
   m=>m.history[0].d.index='0',m=>m.history[0].a='reset',
   m=>m.board.drawing.points[2][0]++,
   m=>m.board.first.draw.second='123',
   m=>m.first='0',m=>m.second='0',m=>m.answers[0]='wrong',
   m=>m.issue='fake',m=>m.prose='I know',m=>m.seed=0,m=>m.extra=true];
  for(const change of changes){const x=structuredClone(good);change(x);
   assert.equal(replayNativeRectangleEvidence(t,x,c),null,change.toString());}
 }
});
test('P007j reject stale, forged and fabricated original Checks',()=>{
 for(const s of SPECS){
  const {t,wrong,good,record}=fixture(s),c=ctx(s);
  assert.ok(submittedNativeRectangleEvidence(t,good,record,c));
  for(const attempts of [[],[{value:wrong}],[{value:good},{value:good}],
   [{value:wrong},{value:wrong}],[{value:wrong},{value:good},{value:good}],
   [{value:{...wrong,seed:1}},{value:good}],
   [{value:{...wrong,history:[]}},{value:good}]])
   assert.equal(submittedNativeRectangleEvidence(t,good,{attempts},c),null);
 }
});
