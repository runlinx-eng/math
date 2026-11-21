// #342 P007e: exact native source, independent pentagon geometry and fail-closed negatives.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {sessionTaskFor} from '../dist/learning/bridges.js';
import {LESSONS} from '../dist/learning/catalog.js';
import * as native from '../dist/learning/phase5/b23-model.js';
import {regularPentagonBinding,replayRegularPentagonEvidence,
 submittedRegularPentagonEvidence} from '../dist/learning/p007e-regular-pentagon-evidence.js';

const where={sessionId:'shapemeasures',index:2};
const HASH='52776a525512c4e7505d49436d3289d6c31b2d8e9600268aca5916f8a7c66dfb';
const stable=v=>Array.isArray(v)?v.map(stable):v&&typeof v==='object'?
 Object.fromEntries(Object.keys(v).sort((a,b)=>a.localeCompare(b,'en'))
 .map(k=>[k,stable(v[k])])):v;
const digest=v=>createHash('sha256').update(JSON.stringify(stable(v))).digest('hex');
const clone=structuredClone;
function fixture(){
 const task=sessionTaskFor('shapemeasures',2),model=native.initial(task,314159);
 model.first='3';model.angle='108';native.act(task,model,'g23-draw');
 model.answers=['5','108'];const wrong=clone(model);
 model.first='4';native.act(task,model,'g23-draw');
 return {task,model,wrong,record:{attempts:[{value:wrong},{value:clone(model)}]}};
}
test('P007e full original task SHA and independent regular-pentagon side/angle/area',()=>{
 const {task,model,wrong,record}=fixture();
 console.log('P007E_NATIVE_FULL_TASK_SHA256 shapemeasures:2 '+digest(task));
 assert.equal(digest(task),HASH);
 assert.equal(LESSONS.shapemeasures.topicId,'mt_hdrMoiTgqu');
 assert.equal(task.type,'x-s23-ruler');assert.equal(task.mode,'regular');
 assert.deepEqual(task.target,[4,108]);
 assert.deepEqual(task.questions,[{label:'共有几条边',value:5},{label:'每个内角多少度',value:108}]);
 assert.equal(native.valid(task,model),true);
 assert.equal(native.inspect(task,wrong).correct,false);
 assert.equal(native.inspect(task,model).correct,true);
 assert.equal(regularPentagonBinding(task,where)?.originalTaskSha256,HASH);
 const proof=replayRegularPentagonEvidence(task,model,where);
 assert.ok(proof);
 assert.equal(proof.originalDrawEvents,2);
 assert.deepEqual(proof.originalControlEvents.map(x=>x.action),['draw','draw']);
 const g=proof.independentGeometry;
 assert.equal(g.vertices,5);assert.equal(g.sideCount,5);
 assert.equal(g.equalSidesVerified,true);assert.equal(g.equalAnglesVerified,true);
 assert.equal(g.convexVerified,true);assert.equal(g.interiorAngleDegrees,108);
 assert.equal(g.interiorAngleSumDegrees,540);assert.equal(g.perimeterCm,20);
 assert.ok(Math.abs(g.areaSquareCm-20/Math.tan(Math.PI/5))<1e-9);
 assert.ok(Math.abs(g.circumradiusCm-2/Math.sin(Math.PI/5))<1e-9);
 assert.ok(Math.abs(g.apothemCm-2/Math.tan(Math.PI/5))<1e-9);
 assert.equal(submittedRegularPentagonEvidence(task,model,record,where)
  ?.wrongToCorrectDrawingRevisionObserved,true);
 assert.equal(proof.physicalRulerOrProtractorUseAssessed,false);
 assert.equal(proof.strictAApproved,false);
});
test('P007e reject adjacent source, altered task, tampered polygon geometry/history',()=>{
 const {task,model}=fixture();
 for(const context of [null,{},[],{sessionId:'shapemeasures',index:0},
  {sessionId:'shapemeasures',index:1},{sessionId:'shapemeasures',index:'2'},
  {sessionId:'shapedraw',index:2},{sessionId:'__proto__',index:2}]){
  assert.equal(regularPentagonBinding(task,context),null);
  assert.equal(replayRegularPentagonEvidence(task,model,context),null);
 }
 for(const changed of [{...task,prompt:task.prompt+'!'},
  {...task,mode:'rectangle'},{...task,target:[5,108]},
  {...task,questions:[]},{...task,extra:true}]){
  assert.equal(replayRegularPentagonEvidence(changed,model,where),null);
 }
 const changes=[
  m=>m.history.pop(),m=>m.history.splice(0),
  m=>m.history[0].a='rotate',
  m=>m.history[0].f.first='-1',
  m=>m.history[0].f.second='1',
  m=>m.history[0].f.angle='90',
  m=>m.history[0].d.index='1',
  m=>m.history[0].extra=true,
  m=>m.history.push({a:'draw',f:{first:'4',second:'',angle:'108'},d:{index:'0'}}),
  m=>m.board.drawing.points[2][0]+=0.1,
  m=>m.board.drawing.points[2][1]+=1,
  m=>m.board.drawing.first={fake:true},
  m=>m.first='3',
  m=>m.second='1',
  m=>m.angle='109',
  m=>m.answers[0]='4',
  m=>m.answers[1]='107',
  m=>m.issue='fabricated',
  m=>m.seed=0,
  m=>m.extra='fake'
 ];
 for(const change of changes){
  const bad=clone(model);change(bad);
  assert.equal(replayRegularPentagonEvidence(task,bad,where),null,change.toString());
 }
});
test('P007e reject stale/forged original Check and wrong final side length',()=>{
 const {task,model,wrong,record}=fixture();
 assert.ok(submittedRegularPentagonEvidence(task,model,record,where));
 const noDraw=native.initial(task,314159);noDraw.answers=['5','108'];
 assert.equal(replayRegularPentagonEvidence(task,noDraw,where),null);
 const nonTarget=native.initial(task,314159);
 nonTarget.first='5';nonTarget.angle='108';native.act(task,nonTarget,'g23-draw');
 nonTarget.answers=['5','108'];
 assert.equal(replayRegularPentagonEvidence(task,nonTarget,where),null);
 for(const badRecord of [{attempts:[]},{attempts:[{value:wrong}]},
  {attempts:[{value:model},{value:model}]},
  {attempts:[{value:wrong},{value:wrong}]},
  {attempts:[{value:wrong},{value:model},{value:model}]},
  {attempts:[{value:{...wrong,extra:'fake'}},{value:model}]},
  {attempts:[{value:{...wrong,first:'2'}},{value:model}]},
  {attempts:[{value:{...wrong,history:[]}},{value:model}]},
  {attempts:[{value:{...wrong,answers:['4','108']}},{value:model}]},
  {attempts:[{value:{...wrong,seed:1}},{value:model}]}]){
  assert.equal(submittedRegularPentagonEvidence(task,model,badRecord,where),null);
 }
});
test('P007e native reset/redraw still requires exact five equal edges and angles',()=>{
 const {task}=fixture(),m=native.initial(task,314159);
 m.first='3';m.angle='108';native.act(task,m,'g23-draw');
 native.act(task,m,'g23-reset');
 m.first='4';native.act(task,m,'g23-draw');m.answers=['5','108'];
 assert.equal(native.inspect(task,m).correct,true);
 const proof=replayRegularPentagonEvidence(task,m,where);
 assert.ok(proof);assert.equal(proof.originalResetEvents,1);
 assert.equal(proof.originalDrawEvents,2);
 assert.equal(proof.independentGeometry.perimeterCm,20);
});
