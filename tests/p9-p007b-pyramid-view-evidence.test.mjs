// #342 P007b: full original-source SHA, signed event replay and failures.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {sessionTaskFor} from '../dist/learning/bridges.js';
import {LESSONS} from '../dist/learning/catalog.js';
import * as native from '../dist/learning/phase5/b23-model.js';
import {solid} from '../dist/learning/phase4/geometry.js';
import {pyramidViewBinding,replayPyramidViewEvidence,
 submittedPyramidViewEvidence} from '../dist/learning/p007b-pyramid-view-evidence.js';

const where={sessionId:'shapedraw',index:5};
const HASH='fde74143edf21a92606e9f5c565cd883d0b714fb2d5cefd0ce18a4bde7727774';
const stable=v=>Array.isArray(v)?v.map(stable):v&&typeof v==='object'?
 Object.fromEntries(Object.keys(v).sort((a,b)=>a.localeCompare(b,'en'))
  .map(k=>[k,stable(v[k])])):v;
const digest=v=>createHash('sha256').update(JSON.stringify(stable(v))).digest('hex');
function fixture(){
 const task=sessionTaskFor('shapedraw',5),model=native.initial(task,314159);
 const unturned=structuredClone(model);
 native.act(task,model,'g23-turn');
 model.answers=['cube'];
 const wrong=structuredClone(model);
 model.answers=['pyramid'];
 const good=structuredClone(model);
 return {task,model,unturned,wrong,good,record:{attempts:[
  {value:wrong},{value:good}]}};
}
test('P007b exact runtime source and original pyramid geometry are independent',()=>{
 const {task,model,unturned,wrong,record}=fixture();
 console.log('P007B_NATIVE_FULL_TASK_SHA256 shapedraw:5 '+digest(task));
 assert.equal(digest(task),HASH);
 assert.equal(LESSONS.shapedraw.topicId,'mt_vJUa62bxeR');
 assert.equal(task.type,'x-s23-frame');
 assert.equal(task.mode,'view');assert.equal(task.solid,'pyramid');
 assert.equal(task.prompt,'转动这个四棱锥，从另一个方向看，再认出它。');
 assert.equal(task.questions[0].value,'pyramid');
 assert.equal(task.questions[0].options[1][0],'cube');
 const geom=solid('pyramid');
 assert.equal(geom.vertices.length,5);
 assert.equal(geom.edges.length,8);
 assert.equal(geom.faces.length,5);
 assert.equal(geom.faces.filter(x=>x.length===4).length,1);
 assert.equal(geom.faces.filter(x=>x.length===3).length,4);
 assert.equal(native.valid(task,unturned),true);
 unturned.answers=['pyramid'];
 assert.equal(native.inspect(task,unturned).correct,false);
 assert.equal(replayPyramidViewEvidence(task,unturned,where),null);
 assert.equal(native.inspect(task,wrong).correct,false);
 assert.equal(native.inspect(task,model).correct,true);
 const binding=pyramidViewBinding(task,where);
 assert.equal(binding.originalTaskSha256,HASH);
 const proof=replayPyramidViewEvidence(task,model,where);
 assert.ok(proof);
 assert.deepEqual(proof.independentPyramidGeometry.vertexDegrees,[3,3,3,3,4]);
 assert.equal(proof.independentPyramidGeometry.edges,8);
 assert.equal(proof.independentPyramidGeometry.squareBaseFaces,1);
 assert.equal(proof.independentPyramidGeometry.triangularSideFaces,4);
 assert.equal(proof.originalTurnEvents,1);
 assert.equal(proof.observedTurnCount,1);
 assert.equal(proof.originalControlEvents.length,1);
 assert.equal(proof.cameraOrientationHistoryPersisted,false);
 assert.equal(proof.distinctViewingAnglesIndependentlyMeasured,false);
 assert.equal(proof.physicalModelRotationAssessed,false);
 assert.equal(proof.spokenGeometricExplanationAssessed,false);
 assert.equal(proof.longTermMasteryAssessed,false);
 assert.equal(submittedPyramidViewEvidence(task,model,record,where)?.originalCheckSnapshotsObserved,2);
 assert.equal(proof.strictAApproved,false);
});
test('P007b fail closed: wrong source, task, context, fields and fabricated events',()=>{
 const {task,model}=fixture();
 const badContext=[null,{},[],{sessionId:'shapedraw',index:'5'},
  {sessionId:'shapedraw',index:4},{sessionId:'shapeframe',index:2},
  {sessionId:'__proto__',index:0}];
 for(const ctx of badContext){
  assert.equal(pyramidViewBinding(task,ctx),null);
  assert.equal(replayPyramidViewEvidence(task,model,ctx),null);
 }
 for(const bad of [
  {...task,prompt:task.prompt+'改写'},
  {...task,mode:'build'}, {...task,solid:'cube'},
  {...task,questions:[{label:'转动后仍是',value:'cube'}]},
  {...task,extra:'fake'}])
  assert.equal(replayPyramidViewEvidence(bad,model,where),null);
 const edits=[
  m=>m.history.splice(0),
  m=>m.history[0].a='stick',
  m=>m.history[0].a='rotate',
  m=>m.history[0].f.foo='value',
  m=>m.history[0].d.index='0',
  m=>m.history[0].extra='fake',
  m=>m.history.push({a:'turn',f:{},d:{other:'0'}}),
  m=>m.board.turns=0,
  m=>m.board.turns=2,
  m=>m.board.edges.push(0),
  m=>m.board.first={},
  m=>m.answers[0]='cube',
  m=>m.issue='fake',
  m=>m.seed=0,
  m=>m.unexpected='injected'
 ];
 for(const edit of edits){
  const bad=structuredClone(model);edit(bad);
  assert.equal(replayPyramidViewEvidence(task,bad,where),null,edit.toString());
 }
 const noHistory=native.initial(task,314159);
 noHistory.answers=['pyramid'];noHistory.board.turns=1;
 assert.equal(replayPyramidViewEvidence(task,noHistory,where),null);
});
test('P007b reject stale or fabricated original Check revision',()=>{
 const {task,model,wrong,record}=fixture();
 assert.ok(submittedPyramidViewEvidence(task,model,record,where));
 for(const rec of [
  {attempts:[]},{attempts:[{value:wrong}]},
  {attempts:[{value:model},{value:model}]},
  {attempts:[{value:wrong},{value:model},{value:model}]},
  {attempts:[{value:wrong},{value:wrong}]},
  {attempts:[{value:{...wrong,extra:'fake'}},{value:model}]},
  {attempts:[{value:{...wrong,board:{...wrong.board,turns:0}}},{value:model}]},
  {attempts:[{value:{...wrong,answers:['pyramid']}},{value:model}]},
  {attempts:[{value:{...wrong,seed:wrong.seed+1}},{value:model}]},
  {attempts:[{value:{...wrong,history:[]}},{value:model}]}
 ]) assert.equal(submittedPyramidViewEvidence(task,model,rec,where),null);
 const altered=structuredClone(model);altered.answers=['cube'];
 assert.equal(submittedPyramidViewEvidence(task,altered,record,where),null);
});
test('P007b original reset then turn restores only bounded turn-count evidence',()=>{
 const {task}=fixture(),m=native.initial(task,314159);
 native.act(task,m,'g23-turn');native.act(task,m,'g23-turn');
 native.act(task,m,'g23-reset');
 assert.equal(m.board.turns,0);
 m.answers=['pyramid'];
 assert.equal(replayPyramidViewEvidence(task,m,where),null);
 native.act(task,m,'g23-turn');
 const proof=replayPyramidViewEvidence(task,m,where);
 assert.ok(proof);
 assert.equal(proof.originalTurnEvents,3);
 assert.equal(proof.originalResetEvents,1);
 assert.equal(proof.observedTurnCount,1);
});
