// #342 P007d: exact native source and four-right-angle rectangle proof.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {sessionTaskFor} from '../dist/learning/bridges.js';
import {LESSONS} from '../dist/learning/catalog.js';
import * as native from '../dist/learning/phase5/b23-model.js';
import {rectangleDimensionsBinding,replayRectangleDimensionsEvidence,
 submittedRectangleDimensionsEvidence} from '../dist/learning/p007d-rectangle-dimensions-evidence.js';

const where={sessionId:'shapemeasures',index:1};
const HASH='5280a44cd6f5b3b782ec4184a213a613064f914e42b465e79e5c616930492fd9';
const stable=v=>Array.isArray(v)?v.map(stable):v&&typeof v==='object'?
 Object.fromEntries(Object.keys(v).sort((a,b)=>a.localeCompare(b,'en'))
 .map(k=>[k,stable(v[k])])):v;
const digest=v=>createHash('sha256').update(JSON.stringify(stable(v))).digest('hex');
const clone=structuredClone;
function fixture(){
 const task=sessionTaskFor('shapemeasures',1),model=native.initial(task,314159);
 model.first='5';model.second='4';
 native.act(task,model,'g23-draw');
 model.answers=['90'];
 const wrong=clone(model);
 model.first='6';native.act(task,model,'g23-draw');
 return {task,model,wrong,record:{attempts:[{value:wrong},{value:clone(model)}]}};
}
test('P007d full native source SHA, four right angles, area and perimeter',()=>{
 const {task,model,wrong,record}=fixture();
 console.log('P007D_NATIVE_FULL_TASK_SHA256 shapemeasures:1 '+digest(task));
 assert.equal(digest(task),HASH);
 assert.equal(LESSONS.shapemeasures.topicId,'mt_hdrMoiTgqu');
 assert.equal(task.type,'x-s23-ruler');assert.equal(task.mode,'rectangle');
 assert.deepEqual(task.target,[6,4]);
 assert.deepEqual(task.questions,[{label:'四个角各是多少度',value:90}]);
 assert.equal(native.valid(task,model),true);
 assert.equal(native.inspect(task,wrong).correct,false);
 assert.equal(native.inspect(task,model).correct,true);
 assert.equal(rectangleDimensionsBinding(task,where)?.originalTaskSha256,HASH);
 const proof=replayRectangleDimensionsEvidence(task,model,where);
 assert.ok(proof);
 assert.equal(proof.originalDrawEvents,2);
 assert.deepEqual(proof.originalControlEvents.map(x=>x.action),['draw','draw']);
 assert.equal(proof.independentGeometry.vertices,4);
 assert.equal(proof.independentGeometry.rightAnglesVerified,true);
 assert.equal(proof.independentGeometry.oppositeSidesParallelVerified,true);
 assert.equal(proof.independentGeometry.oppositeSidesEqualVerified,true);
 assert.equal(proof.independentGeometry.areaSquareCm,24);
 assert.equal(proof.independentGeometry.perimeterCm,20);
 assert.ok(Math.abs(proof.independentGeometry.diagonalCm-Math.sqrt(52))<1e-9);
 assert.equal(submittedRectangleDimensionsEvidence(task,model,record,where)
  ?.wrongToCorrectDrawingRevisionObserved,true);
 assert.equal(proof.physicalRulerUseAssessed,false);
 assert.equal(proof.strictAApproved,false);
});
test('P007d reject adjacent source, modified task and forged geometry/history',()=>{
 const {task,model}=fixture();
 for(const context of [null,{},[],{sessionId:'shapemeasures',index:0},
  {sessionId:'shapemeasures',index:2},{sessionId:'shapemeasures',index:'1'},
  {sessionId:'shapedraw',index:1},{sessionId:'__proto__',index:1}]){
  assert.equal(rectangleDimensionsBinding(task,context),null);
  assert.equal(replayRectangleDimensionsEvidence(task,model,context),null);
 }
 for(const changed of [{...task,prompt:task.prompt+'!'},
  {...task,mode:'triangle'},{...task,target:[6,5]},
  {...task,questions:[]},{...task,extra:true}]){
  assert.equal(replayRectangleDimensionsEvidence(changed,model,where),null);
 }
 const changes=[
  m=>m.history.pop(),m=>m.history.splice(0),
  m=>m.history[0].a='rotate',
  m=>m.history[0].f.first='-1',
  m=>m.history[0].f.second='11',
  m=>m.history[0].f.angle='90',
  m=>m.history[0].d.index='1',
  m=>m.history[0].extra=true,
  m=>m.history.push({a:'draw',f:{first:'6',second:'4',angle:''},d:{index:'0'}}),
  m=>m.board.drawing.points[2][0]+=0.1,
  m=>m.board.drawing.points[2][1]+=1,
  m=>m.board.drawing.first='5',
  m=>m.board.first={},
  m=>m.first='5',
  m=>m.answers[0]='89',
  m=>m.issue='fabricated',
  m=>m.seed=0,
  m=>m.extra='fake'
 ];
 for(const change of changes){
  const bad=clone(model);change(bad);
  assert.equal(replayRectangleDimensionsEvidence(task,bad,where),null,change.toString());
 }
});
test('P007d reject wrong final dimensions and stale or fabricated Check',()=>{
 const {task,model,wrong,record}=fixture();
 assert.ok(submittedRectangleDimensionsEvidence(task,model,record,where));
 const noDraw=native.initial(task,314159);noDraw.answers=['90'];
 assert.equal(replayRectangleDimensionsEvidence(task,noDraw,where),null);
 const nonTarget=native.initial(task,314159);
 nonTarget.first='6';nonTarget.second='5';native.act(task,nonTarget,'g23-draw');
 nonTarget.answers=['90'];assert.equal(replayRectangleDimensionsEvidence(task,nonTarget,where),null);
 for(const badRecord of [{attempts:[]},{attempts:[{value:wrong}]},
  {attempts:[{value:model},{value:model}]},
  {attempts:[{value:wrong},{value:wrong}]},
  {attempts:[{value:wrong},{value:model},{value:model}]},
  {attempts:[{value:{...wrong,extra:'fake'}},{value:model}]},
  {attempts:[{value:{...wrong,first:'3'}},{value:model}]},
  {attempts:[{value:{...wrong,history:[]}},{value:model}]},
  {attempts:[{value:{...wrong,answers:['91']}},{value:model}]},
  {attempts:[{value:{...wrong,seed:1}},{value:model}]}]){
  assert.equal(submittedRectangleDimensionsEvidence(task,model,badRecord,where),null);
 }
});
test('P007d native reset/redraw and swapped length-width require same rectangle proof',()=>{
 const {task}=fixture(),m=native.initial(task,314159);
 m.first='5';m.second='4';native.act(task,m,'g23-draw');
 native.act(task,m,'g23-reset');
 m.first='4';m.second='6';native.act(task,m,'g23-draw');m.answers=['90'];
 assert.equal(native.inspect(task,m).correct,true);
 const proof=replayRectangleDimensionsEvidence(task,m,where);
 assert.ok(proof);assert.equal(proof.originalResetEvents,1);
 assert.equal(proof.originalDrawEvents,2);
 assert.equal(proof.independentGeometry.areaSquareCm,24);
});
