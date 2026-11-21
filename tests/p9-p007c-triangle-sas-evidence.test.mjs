// #342 P007c: exact native source SHA and independent SAS mathematics.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {sessionTaskFor} from '../dist/learning/bridges.js';
import {LESSONS} from '../dist/learning/catalog.js';
import * as native from '../dist/learning/phase5/b23-model.js';
import {triangleSasBinding,replayTriangleSasEvidence,
 submittedTriangleSasEvidence} from '../dist/learning/p007c-triangle-sas-evidence.js';

const where={sessionId:'shapemeasures',index:0};
const HASH='07b7c68d5d254f6042b17f6ba7f18f850caad412da75f82ee00f01ca7f236e36';
const stable=v=>Array.isArray(v)?v.map(stable):v&&typeof v==='object'?
 Object.fromEntries(Object.keys(v).sort((a,b)=>a.localeCompare(b,'en'))
 .map(k=>[k,stable(v[k])])):v;
const digest=v=>createHash('sha256').update(JSON.stringify(stable(v))).digest('hex');
const clone=structuredClone;
function fixture(){
 const task=sessionTaskFor('shapemeasures',0),model=native.initial(task,314159);
 model.first='4';model.second='7';model.angle='60';
 native.act(task,model,'g23-draw');
 model.answers=['60'];
 const wrong=clone(model);
 model.first='5';
 native.act(task,model,'g23-draw');
 const good=clone(model);
 return {task,model,wrong,good,record:{attempts:[{value:wrong},{value:good}]}};
}
test('P007c native source, full SHA, and SAS triangle independent math',()=>{
 const {task,model,wrong,record}=fixture();
 console.log('P007C_NATIVE_FULL_TASK_SHA256 shapemeasures:0 '+digest(task));
 assert.equal(digest(task),HASH);
 assert.equal(LESSONS.shapemeasures.topicId,'mt_hdrMoiTgqu');
 assert.equal(task.type,'x-s23-ruler');assert.equal(task.mode,'triangle');
 assert.deepEqual(task.target,[5,7,60]);
 assert.equal(native.valid(task,model),true);
 assert.equal(native.inspect(task,wrong).correct,false);
 assert.equal(native.inspect(task,model).correct,true);
 assert.equal(triangleSasBinding(task,where)?.originalTaskSha256,HASH);
 const proof=replayTriangleSasEvidence(task,model,where);
 assert.ok(proof);
 assert.equal(proof.originalDrawEvents,2);
 assert.equal(proof.originalControlEvents[0].action,'draw');
 assert.equal(proof.originalControlEvents[1].action,'draw');
 assert.ok(Math.abs(proof.independentGeometry.thirdSideCm-Math.sqrt(39))<1e-9);
 assert.ok(Math.abs(proof.independentGeometry.areaSquareCm-35*Math.sqrt(3)/4)<1e-9);
 assert.ok(submittedTriangleSasEvidence(task,model,record,where)?.wrongToCorrectDrawingRevisionObserved);
 assert.equal(proof.actualRulerOrProtractorUseAssessed,false);
 assert.equal(proof.strictAApproved,false);
});
test('P007c reject adjacent source, modified task and fake event or geometry',()=>{
 const {task,model}=fixture();
 for(const context of [null,{},[],{sessionId:'shapemeasures',index:1},
   {sessionId:'shapemeasures',index:'0'}, {sessionId:'shapedraw',index:0},
   {sessionId:'__proto__',index:0}]){
  assert.equal(triangleSasBinding(task,context),null);
  assert.equal(replayTriangleSasEvidence(task,model,context),null);
 }
 for(const altered of [{...task,prompt:task.prompt+'!'},
  {...task,mode:'rectangle'},{...task,target:[4,7,60]},
  {...task,questions:[]},{...task,additional:true}]){
  assert.equal(replayTriangleSasEvidence(altered,model,where),null);
 }
 const edits=[
  m=>m.history.pop(),m=>m.history.splice(0),
  m=>m.history[0].a='test',
  m=>m.history[0].f.first='-4',
  m=>m.history[0].f.angle='181',
  m=>m.history[0].d.index='0',
  m=>m.history[0].extra=true,
  m=>m.history.push({a:'draw',f:{first:'5',second:'7',angle:'60'},d:{index:'0'}}),
  m=>m.board.drawing.points[2][0]+=0.1,
  m=>m.board.drawing.first='4',
  m=>m.board.first={},
  m=>m.first='4',
  m=>m.answers[0]='61',
  m=>m.issue='fake',
  m=>m.seed=0,
  m=>m.extra=true
 ];
 for(const edit of edits){
  const changed=clone(model);edit(changed);
  assert.equal(replayTriangleSasEvidence(task,changed,where),null,edit.toString());
 }
});
test('P007c reject no drawing, non-target dimensions, stale Check and fake correction',()=>{
 const {task,model,wrong,record}=fixture();
 assert.ok(submittedTriangleSasEvidence(task,model,record,where));
 const noDrawing=native.initial(task,314159);noDrawing.answers=['60'];
 assert.equal(replayTriangleSasEvidence(task,noDrawing,where),null);
 const nonTarget=native.initial(task,314159);
 nonTarget.first='6';nonTarget.second='7';nonTarget.angle='60';
 native.act(task,nonTarget,'g23-draw');nonTarget.answers=['60'];
 assert.equal(replayTriangleSasEvidence(task,nonTarget,where),null);
 for(const badRecord of [{attempts:[]},{attempts:[{value:wrong}]},
   {attempts:[{value:model},{value:model}]},
   {attempts:[{value:wrong},{value:wrong}]},
   {attempts:[{value:wrong},{value:model},{value:model}]},
   {attempts:[{value:{...wrong,extra:'fake'}},{value:model}]},
   {attempts:[{value:{...wrong,first:'3'}},{value:model}]},
   {attempts:[{value:{...wrong,history:[]}},{value:model}]},
   {attempts:[{value:{...wrong,answers:['59']}},{value:model}]},
   {attempts:[{value:{...wrong,seed:1}},{value:model}]}]){
  assert.equal(submittedTriangleSasEvidence(task,model,badRecord,where),null);
 }
});
test('P007c native reset and corrected redraw are bounded',()=>{
 const {task}=fixture(),m=native.initial(task,314159);
 m.first='4';m.second='7';m.angle='60';
 native.act(task,m,'g23-draw');native.act(task,m,'g23-reset');
 m.first='5';native.act(task,m,'g23-draw');m.answers=['60'];
 const p=replayTriangleSasEvidence(task,m,where);
 assert.ok(p);assert.equal(p.originalResetEvents,1);
 assert.equal(p.originalDrawEvents,2);
});
