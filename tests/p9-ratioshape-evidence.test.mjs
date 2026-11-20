import test from 'node:test';
import assert from 'node:assert/strict';
import {sessionTaskFor} from '../dist/learning/bridges.js';
import * as native from '../dist/learning/phase5/b37-model.js';
import {replayRatioShapeEvidence} from '../dist/learning/ratioshape-evidence.js';

const cases=[
 ['pctIdeas37',2,'2','4','2','8','4'],
 ['recipeScale37',2,'1/2','2','1','2','1/4'],
 ['similar37',0,'3','9','6','54','9'],
 ['similar37',2,'2','8','4','32','4'],
 ['scaleArea37',0,'3','6','3','18','9']
];
const proof=(id,index,model)=>replayRatioShapeEvidence(sessionTaskFor(id,index),model,{sessionId:id,index});
const act=(task,model,action,index)=>native.act(task,model,'r37-'+action,{index});
test('#282 all five original constructions independently reconstruct k and k squared',()=>{
 for(const [id,index,factor,width,height,area,square] of cases){
  const task=sessionTaskFor(id,index),model=native.example(task);
  const before=JSON.stringify({task,model}),result=proof(id,index,model);
  assert.ok(result,id+':'+index);
  assert.equal(result.construction.lastFactor,factor);
  assert.equal(result.construction.lastWidth,width);
  assert.equal(result.construction.lastHeight,height);
  assert.equal(result.construction.scaledArea,area);
  assert.equal(result.construction.areaFactor,square);
  assert.equal(result.construction.records.length,task.required.length);
  assert.equal(result.construction.wrongSaveIndices.length,0);
  assert.equal(result.physicalMeasurementAssessed,false);
  assert.equal(result.angleProofAssessed,false);
  assert.equal(result.checkedSubmissionAssessed,false);
  assert.equal(JSON.stringify({task,model}),before);
 }
});
test('#282 honest incorrect first save and later correction remain visible',()=>{
 const task=sessionTaskFor('scaleArea37',0),model=native.initial(task);
 act(task,model,'factor','3');
 model.value='6';model.second='1';act(task,model,'save');
 assert.equal(native.inspect(task,model).correct,false);
 assert.equal(proof('scaleArea37',0,model),null);
 model.second='3';act(task,model,'save');
 task.questions.forEach((q,i)=>model.answers[i]=String(q.value));
 assert.equal(native.inspect(task,model).correct,true);
 const p=proof('scaleArea37',0,model);
 assert.ok(p);
 assert.equal(p.construction.firstSave.height,'1');
 assert.deepEqual(p.construction.wrongSaveIndices,[1]);
 assert.deepEqual(p.construction.records.map(r=>r.correct),[false,true]);
 assert.equal(p.construction.records[1].expectedAreaFactor,'9');
});
test('#282 reject shortened, forged, unrelated and stale histories',()=>{
 const task=sessionTaskFor('similar37',2),model=native.example(task);
 assert.equal(proof('similar37',2,model).construction.records.length,2);
 const altered=structuredClone(model);altered.value='9';
 assert.equal(proof('similar37',2,altered),null);
 const noHistory=structuredClone(model);noHistory.history=[];
 assert.equal(proof('similar37',2,noHistory),null);
 const forged=structuredClone(model);forged.history[0].a='step';
 assert.equal(proof('similar37',2,forged),null);
 const badFactor=structuredClone(model);badFactor.history[0].i='0.5';
 assert.equal(proof('similar37',2,badFactor),null);
 const late=structuredClone(model);act(task,late,'factor','3');
 assert.equal(native.inspect(task,late).correct,false);
 assert.equal(proof('similar37',2,late),null);
});
test('#282 reject one edge, add instead of multiply, area times k and bad answers',()=>{
 const task=sessionTaskFor('scaleArea37',0);
 for(const [width,height] of [['5','4'],['6','1'],['6','2']]){
  const model=native.initial(task);act(task,model,'factor','3');
  model.value=width;model.second=height;act(task,model,'save');
  task.questions.forEach((q,i)=>model.answers[i]=String(q.value));
  assert.equal(proof('scaleArea37',0,model),null);
 }
 for(const [index,value] of [[0,'6'],[1,'6'],[2,'3']]){
  const model=native.example(task);model.answers[index]=value;
  assert.equal(proof('scaleArea37',0,model),null);
 }
});
