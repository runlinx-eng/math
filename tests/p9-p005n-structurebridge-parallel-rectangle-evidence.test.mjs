// #342 P005n B15 structurebridge:0 development-only original source/math contract.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {sessionTaskFor} from '../dist/learning/bridges.js';
import {LESSONS} from '../dist/learning/catalog.js';
import * as native from '../dist/learning/phase5/b15-model.js';
import {structureBridgeBinding,replayStructureBridgeEvidence,submittedStructureBridgeEvidence}
 from '../dist/learning/p005n-structurebridge-parallel-rectangle-evidence.js';

const id='structurebridge',index=0,position=id+':'+index,node='mt_hImiKNiaNh';
const fullSha='5574b42f8ac8c33a3c07232a2784d22dfc88e25b0df58091122628b648517dc6';
const context={sessionId:id,index};
const stable=v=>Array.isArray(v)?v.map(stable):v&&typeof v==='object'?
 Object.fromEntries(Object.keys(v).sort((a,b)=>a.localeCompare(b,'en')).map(k=>[k,stable(v[k])])):v;
const digest=v=>createHash('sha256').update(JSON.stringify(stable(v))).digest('hex');
const clone=structuredClone;
function make(task){
 const m=native.initial(task);
 native.act(task,m,'b15-parallel',{index:0});
 native.act(task,m,'b15-parallel',{index:1});
 for(const skew of [0,30,0]){
  m.skew=String(skew);native.field(task,m,'skew');
  native.act(task,m,'b15-shape');
 }
 for(const k of ['angleB','angleC','angleD']){
  m[k]='90';native.field(task,m,k);
 }
 m.reason='opposite-adjacent';native.field(task,m,'reason');
 return m;
}
test('P005n original B15 task and runtime SHA256, native source and independent screen geometry',()=>{
 const task=sessionTaskFor(id,index);
 assert.equal(LESSONS[id].topicId,node);
 assert.equal(task.type,'x-shapeangle');
 assert.equal(digest(task),fullSha);
 console.log('P005N_NATIVE_FULL_TASK_SHA256 '+position+' '+digest(task));
 assert.equal(structureBridgeBinding(task,context)?.nodeId,node);
 const model=make(task);
 assert.equal(native.valid(task,model),true);
 assert.equal(native.inspect(task,model).correct,true);
 const proof=replayStructureBridgeEvidence(task,model,context);
 assert.ok(proof,'real original replay has valid geometry');
 assert.deepEqual(proof.originalCapturedSkewSequence,[0,30,0]);
 assert.equal(proof.independentlyVerifiedScreenArea,43400);
 assert.equal(proof.independentlyVerifiedRightAnglesOnlyAtZeroSkew,true);
 assert.equal(proof.strictAApproved,false);
 assert.equal(proof.sliderMovementTimelineObserved,false);
 assert.equal(proof.freeGeometricProofAssessed,false);
});
test('P005n wrong->correct native Check, stale latest submission, task and source isolation',()=>{
 const task=sessionTaskFor(id,index),good=make(task);
 const wrong=clone(good);wrong.angleB='80';
 assert.equal(native.inspect(task,wrong).correct,false);
 assert.equal(replayStructureBridgeEvidence(task,wrong,context),null);
 const record={attempts:[{value:wrong},{value:clone(good)}]};
 assert.ok(submittedStructureBridgeEvidence(task,good,record,context));
 assert.equal(submittedStructureBridgeEvidence(task,good,{attempts:[{value:wrong}]},context),null);
 assert.equal(submittedStructureBridgeEvidence(task,wrong,record,context),null);
 assert.equal(replayStructureBridgeEvidence(task,good,{sessionId:id,index:1}),null);
 assert.equal(replayStructureBridgeEvidence(task,good,{sessionId:'bridge-structurebridge',index}),null);
 assert.equal(replayStructureBridgeEvidence({...task,prompt:task.prompt+'（伪）'},good,context),null);
 assert.equal(replayStructureBridgeEvidence({...task,extra:'forged'},good,context),null);
});
test('P005n rejects missing toggles, forged events, bad geometry, extra fields and fake strategy',()=>{
 const task=sessionTaskFor(id,index),good=make(task);
 const reject=[
  m=>m.history.pop(),
  m=>m.history[0].data.index=1,
  m=>m.history[1].data.index=0,
  m=>m.history[2].data.fields.skew='30',
  m=>m.history[3].data.fields.skew='0',
  m=>m.history[3].action='b15-parallel',
  m=>m.history[4].data.value='0',
  m=>m.history[0].data.fields.fake='evidence',
  m=>m.board.parallel=[1,0],
  m=>m.board.seen=[30,0],
  m=>m.skew='30',
  m=>m.reason='all-parallelograms',
  m=>m.angleC='89',
  m=>m.issue='unresolved',
  m=>m.strategy='I chose a proof'
 ];
 for(const change of reject){const forged=clone(good);change(forged);
  assert.equal(replayStructureBridgeEvidence(task,forged,context),null);
 }
 const rotated=make(task);
 rotated.history[4].data.fields.skew='30';
 assert.equal(replayStructureBridgeEvidence(task,rotated,context),null);
});
