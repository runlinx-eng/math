// #342 P007a: two native B23 cube-frame tasks, exact source and replay.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {sessionTaskFor} from '../dist/learning/bridges.js';
import {LESSONS} from '../dist/learning/catalog.js';
import * as native from '../dist/learning/phase5/b23-model.js';
import {cubeFrameEdgeBinding,replayCubeFrameEdgeEvidence,
 submittedCubeFrameEdgeEvidence} from '../dist/learning/p007a-cube-frame-edge-evidence.js';

const specs=[
 {id:'shapeframe',index:2,node:'mt_2VR963szuk',
  hash:'1c0ff827c79b8f6dcd423ae54c45e4a9e39faba861dba0d6c4badbb155d5fd4e'},
 {id:'shapedraw',index:4,node:'mt_vJUa62bxeR',
  hash:'ccbb859c4d93758378686ab0e62edd7e69a3d3b137913aec8b14f144d537dbdd'}
];
const stable=v=>Array.isArray(v)?v.map(stable):v&&typeof v==='object'?
 Object.fromEntries(Object.keys(v).sort((a,b)=>a.localeCompare(b,'en'))
  .map(k=>[k,stable(v[k])])):v;
const digest=v=>createHash('sha256').update(JSON.stringify(stable(v))).digest('hex');
const ctx=s=>({sessionId:s.id,index:s.index});
const stick=(t,m,index)=>native.act(t,m,'g23-stick',{index});
function fixture(s){
 const task=sessionTaskFor(s.id,s.index),model=native.initial(task,314159);
 stick(task,model,0);stick(task,model,0);stick(task,model,0);
 for(let i=1;i<=10;i++)stick(task,model,i);
 const incomplete=structuredClone(model);
 stick(task,model,11);
 model.answers=['0','12','6'];
 const wrong=structuredClone(model);
 model.answers[0]='8';
 const good=structuredClone(model);
 return {task,model,wrong,good,incomplete,
  record:{attempts:[{value:wrong},{value:good}]}};
}
test('P007a exact native sources, full SHA256, independent cube degrees and 12 edge replay',()=>{
 for(const s of specs){
  const {task,model,wrong,record,incomplete}=fixture(s),context=ctx(s);
  console.log('P007A_NATIVE_FULL_TASK_SHA256 '+s.id+':'+s.index+' '+digest(task));
  assert.equal(digest(task),s.hash);
  assert.equal(LESSONS[s.id].topicId,s.node);
  assert.equal(task.type,'x-s23-frame');assert.equal(task.mode,'build');
  assert.equal(task.solid,'cube');
  assert.deepEqual(task.questions.map(q=>q.value),[8,12,6]);
  assert.equal(native.valid(task,incomplete),true);
  assert.equal(incomplete.board.edges.length,11);
  assert.equal(native.inspect(task,incomplete).correct,false);
  assert.equal(replayCubeFrameEdgeEvidence(task,incomplete,context),null);
  assert.equal(native.valid(task,model),true);
  assert.equal(native.inspect(task,wrong).correct,false);
  assert.equal(native.inspect(task,model).correct,true);
  assert.equal(replayCubeFrameEdgeEvidence(task,wrong,context),null);
  const binding=cubeFrameEdgeBinding(task,context);
  assert.equal(binding.nodeId,s.node);
  assert.equal(binding.originalTaskSha256,s.hash);
  const proof=replayCubeFrameEdgeEvidence(task,model,context);
  assert.ok(proof);
  assert.deepEqual(proof.independentCubeGeometry.vertexDegrees,[3,3,3,3,3,3,3,3]);
  assert.equal(proof.independentCubeGeometry.vertexCount,8);
  assert.equal(proof.independentCubeGeometry.edgeCount,12);
  assert.equal(proof.independentCubeGeometry.faceCount,6);
  assert.equal(proof.independentCubeGeometry.EulerCharacteristic,2);
  assert.equal(proof.originalStickEvents,14);
  assert.equal(proof.observedEffectiveEdgeAdds,13);
  assert.equal(proof.observedEffectiveEdgeRemovals,1);
  assert.equal(proof.originalEdgeToggleHistoryReplayed,true);
  assert.deepEqual(proof.originalSelectedEdgeIndices,[0,1,2,3,4,5,6,7,8,9,10,11]);
  assert.equal(proof.originalTurnEvents,0);
  assert.equal(proof.independentPhysicalCubeConstructionObserved,false);
  assert.equal(proof.hiddenEdgeExplanationAssessed,false);
  assert.equal(proof.verbalGeometricProofAssessed,false);
  assert.equal(proof.longTermMasteryAssessed,false);
  assert.equal(proof.strictAApproved,false);
  const submitted=submittedCubeFrameEdgeEvidence(task,model,record,context);
  assert.ok(submitted);
  assert.equal(submitted.originalCheckSnapshotsObserved,2);
  assert.equal(submitted.wrongToCorrectCheckRevisionObserved,true);
  assert.equal(submitted.individualAnswerFieldKeystrokesPersisted,false);
 }
});
test('P007a reject source drift, wrong context, pyramid view and forged edge histories',()=>{
 for(const s of specs){
  const {task,model}=fixture(s),context=ctx(s);
  const opposite=specs.find(z=>z!==s);
  for(const c of [
   null,{},[],{sessionId:s.id,index:String(s.index)},
   {sessionId:s.id,index:s.index+1},{sessionId:opposite.id,index:opposite.index},
   {sessionId:'__proto__',index:0}]){
   assert.equal(cubeFrameEdgeBinding(task,c),null);
   assert.equal(replayCubeFrameEdgeEvidence(task,model,c),null);
  }
  for(const modified of [
   {...task,prompt:task.prompt+'!'},
   {...task,mode:'view'},
   {...task,solid:'pyramid'},
   {...task,questions:[]},
   {...task,questions:task.questions.map((q,i)=>i===0?{...q,value:7}:q)},
   {...task,extra:'injected'}])
   assert.equal(replayCubeFrameEdgeEvidence(modified,model,context),null);
  const edits=[
   x=>{x.history=[];},
   x=>{x.history[0].d.index='00';},
   x=>{x.history[0].d.index='12';},
   x=>{x.history[0].d.index='-1';},
   x=>{x.history[0].a='rotate';},
   x=>{x.history[0].d.extra='1';},
   x=>{x.history[0].f.first='spoof';},
   x=>{x.history[0].extra='1';},
   x=>{x.history[1].d.index='0x0';},
   x=>{x.history[1].d.index='11';},
   x=>{x.history[2].a='turn';},
   x=>{x.board.edges.pop();},
   x=>{x.board.edges.reverse();},
   x=>{x.board.edges.push(0);},
   x=>{x.board.turns++;},
   x=>{x.board.first={};},
   x=>{x.issue='fabricated';},
   x=>{x.answers[0]='0';},
   x=>{x.answers[1]='11';},
   x=>{x.seed=0;},
   x=>{x.extra=true;}
  ];
  for(const edit of edits){
   const bad=structuredClone(model);edit(bad);
   assert.equal(replayCubeFrameEdgeEvidence(task,bad,context),null,edit.toString());
  }
  const noHistory=native.initial(task,314159);
  noHistory.board.edges=Array.from({length:12},(_,i)=>i);
  noHistory.answers=['8','12','6'];
  assert.equal(replayCubeFrameEdgeEvidence(task,noHistory,context),null);
 }
});
test('P007a reject stale, modified, or fabricated Check snapshots',()=>{
 for(const s of specs){
  const {task,model,wrong,record}=fixture(s),context=ctx(s);
  const good=submittedCubeFrameEdgeEvidence(task,model,record,context);
  assert.ok(good);
  const badRecords=[
   {attempts:[]},{attempts:[{value:wrong}]},
   {attempts:[{value:model},{value:model}]},
   {attempts:[{value:wrong},{value:model},{value:model}]},
   {attempts:[{value:{...wrong,extra:'fake'}},{value:model}]},
   {attempts:[{value:{...wrong,history:[]}},{value:model}]},
   {attempts:[{value:{...wrong,answers:['0','11','6']}},{value:model}]},
   {attempts:[{value:wrong},{value:wrong}]},
   {attempts:[{value:{...wrong,answers:['8','12','6']}},{value:model}]},
   {attempts:[{value:{...wrong,seed:wrong.seed+1}},{value:model}]}
  ];
  for(const rec of badRecords)
   assert.equal(submittedCubeFrameEdgeEvidence(task,model,rec,context),null);
  const altered=structuredClone(model);altered.answers[0]='0';
  assert.equal(submittedCubeFrameEdgeEvidence(task,altered,record,context),null);
 }
});
test('P007a actual native reset/rebuild does not create fabricated edges',()=>{
 const s=specs[0],task=sessionTaskFor(s.id,s.index);
 const model=native.initial(task,314159);
 stick(task,model,0);stick(task,model,1);
 native.act(task,model,'g23-reset');
 assert.equal(model.board.edges.length,0);
 for(let i=0;i<12;i++)stick(task,model,i);
 model.answers=['8','12','6'];
 assert.equal(native.valid(task,model),true);
 assert.equal(native.inspect(task,model).correct,true);
 const proof=replayCubeFrameEdgeEvidence(task,model,ctx(s));
 assert.ok(proof);
 assert.equal(proof.originalControlEvents.filter(e=>e.action==='reset').length,1);
 assert.equal(proof.observedEffectiveEdgeAdds,14);
 assert.equal(proof.observedEffectiveEdgeRemovals,0);
});
