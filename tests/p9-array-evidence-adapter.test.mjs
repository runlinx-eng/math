import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {TASKS as T34} from '../dist/learning/phase5/b34.js';
import {TASKS as T13} from '../dist/learning/phase5/b13.js';
import * as arrays from '../dist/learning/phase5/b13-model.js';
import {sessionTasks,sessionMeta} from '../dist/learning/bridges.js';
import {arrayBinding,replayArrayEvidence} from '../dist/learning/array-evidence.js';
import {thinkingGuide,thinkingFeedback} from '../dist/learning/thinking-feedback.js';
const cases=[
 ['structure34',1,'mt_FAXjFkgG6X','ccss-math:MP.7'],
 ['tables34',1,'mt_2jbUekyTu4','ccss-math:MP.8'],
 ...[0,3,4,5,6].map(i=>['derivepatterns',i,'mt_aivrWs6jrS','ccss-math:MP.8'])
];
const record=v=>({support:false,attempts:[{value:structuredClone(v)}]});
const source=JSON.parse(readFileSync(new URL('../docs/spatial-learning/thinking-source-map.json',import.meta.url)));
test('seven explicitly sourced native B13 arrays offer optional prompts',()=>{
 for(const [id,index,nodeId,code] of cases){
  const task=sessionTasks(id)[index],context={sessionId:id,index};
  assert.equal(task.type,'x-mularray');
  const bind=arrayBinding(task,context);
  assert.equal(bind?.nodeId,nodeId);
  assert.equal(bind.code,code);
  assert.equal(sessionMeta(id).topicId,nodeId);
  const node=source.groups.find(g=>g.code===code).nodes.find(n=>n.id===nodeId);
  assert.equal(node.displayName,bind.label);
  assert.equal(node.lessonId,id);
  assert.ok(node.goals.some(g=>g.tasks.some(t=>t.index===index&&t.type===task.type)));
  assert.match(thinkingGuide(task,context).summary,/想一想/);
  assert.ok(thinkingGuide(task,context).question.length>10);
  assert.equal(arrayBinding({...task,unit:10000},context),null);
 }
 assert.equal(arrayBinding(T13.productways[0],{sessionId:'productways',index:0}),null);
 assert.equal(arrayBinding(T34.structure34[1],{sessionId:'structure34',index:3}),null);
 assert.equal(arrayBinding(T34.structure34[1],{sessionId:'link-productways-structure34',index:1}),null);
});
test('seven array lessons require actual checked actions and current submission',()=>{
 for(const [id,index,nodeId,code] of cases){
  const task=sessionTasks(id)[index],context={sessionId:id,index},done=arrays.example(task);
  assert.equal(arrays.valid(task,done),true,id+':'+index);
  assert.equal(arrays.inspect(task,done).correct,true,id+':'+index);
  const proof=replayArrayEvidence(task,done);
  assert.ok(proof,id+':'+index);
  assert.equal(proof.rows,task.a);
  assert.equal(proof.cols,task.b);
  assert.equal(proof.total,task.a*task.b*(task.unit||1));
  assert.equal(thinkingFeedback(task,done,record(arrays.initial(task)),context),null);
  assert.equal(thinkingFeedback(task,done,record(done)),null);
  const feedback=thinkingFeedback(task,done,record(done),context);
  assert.equal(feedback.method.nodeId,nodeId);
  assert.equal(feedback.method.code,code);
  assert.match(feedback.observation,/实际摆出/);
  assert.match(feedback.detail.join(' '),/不能据此判断/);
  assert.equal(thinkingFeedback(task,done,null,context),null);
  const changed=structuredClone(done);changed.answer='__changed__';
  assert.equal(thinkingFeedback(task,changed,record(done),context),null);
  const wrong=structuredClone(done);wrong.answer='12345';
  assert.equal(thinkingFeedback(task,wrong,record(wrong),context),null);
 }
});
test('turn, partition and changing units yield distinct mathematics',()=>{
 const rot=replayArrayEvidence(T34.structure34[1],arrays.example(T34.structure34[1]));
 assert.equal(rot.turned,true);assert.equal(rot.total,24);
 const split=replayArrayEvidence(T34.tables34[1],arrays.example(T34.tables34[1]));
 assert.deepEqual([split.left,split.right,split.cut],[40,16,5]);
 for(const [index,unit,total] of [[3,1,12],[4,10,120],[5,100,1200]]){
  const t=T13.derivepatterns[index],proof=replayArrayEvidence(t,arrays.example(t));
  assert.equal(proof.unit,unit);assert.equal(proof.total,total);
 }
});
test('no-ops, reordered events, edited pieces and fabricated work are refused',()=>{
 for(const [id,index] of cases){
  const t=sessionTasks(id)[index],done=arrays.example(t);
  const altered=fn=>{const m=structuredClone(done);fn(m);return m;};
  assert.equal(replayArrayEvidence(t,altered(m=>m.history=[])),null);
  assert.equal(replayArrayEvidence(t,altered(m=>m.history.push(m.history[0]))),null);
  assert.equal(replayArrayEvidence(t,altered(m=>m.history[0].action='b13-reset')),null);
  assert.equal(replayArrayEvidence(t,altered(m=>m.history[0].data.rows='11')),null);
  assert.equal(replayArrayEvidence(t,altered(m=>m.board.built.rows=11)),null);
  assert.equal(replayArrayEvidence(t,altered(m=>m.board.rows=11)),null);
  if(done.history.length===2){
   assert.equal(replayArrayEvidence(t,altered(m=>m.history.reverse())),null);
   assert.equal(replayArrayEvidence(t,altered(m=>m.history.pop())),null);
  }
 }
});