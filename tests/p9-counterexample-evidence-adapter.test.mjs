import test from 'node:test';
import assert from 'node:assert/strict';
import {sessionTasks,sessionMeta,BRIDGES} from '../dist/learning/bridges.js';
import {LESSONS} from '../dist/learning/catalog.js';
import * as m38 from '../dist/learning/phase5/b38-model.js';
import {counterexampleBinding,replayCounterexampleEvidence} from '../dist/learning/counterexample-evidence.js';
import {thinkingGuide,thinkingFeedback} from '../dist/learning/thinking-feedback.js';
import {ensureB39Ready} from '../dist/learning/phase4/async-batches.js';
await ensureB39Ready();
const cases=[3,4];
const context=index=>({sessionId:'argument38',index});
const record=model=>({support:false,attempts:[{value:structuredClone(model)}]});
const run=(task,value,factor,choice)=>{
 const m=m38.initial(task);m.value=value;m.second=factor;m.choice=choice;m38.act(task,m,'r38-test');return m;
};
test('two exact lesson positions bind original source, not shared type or bridges',()=>{
 for(const index of cases){
  const task=sessionTasks('argument38')[index],binding=counterexampleBinding(task,context(index));
  assert.equal(binding.nodeId,'mt_j5YqQnN6xe');
  assert.equal(binding.nodeId,sessionMeta('argument38').topicId);
  assert.ok(thinkingGuide(task,context(index)));
  assert.equal(counterexampleBinding(task,{}),null);
  assert.equal(counterexampleBinding(task,{sessionId:'argument38',index:String(index)}),null);
  assert.equal(counterexampleBinding({...task,prompt:task.prompt+' changed'},context(index)),null);
  assert.equal(counterexampleBinding(task,{sessionId:'argument38',index:1}),null);
 }
 const matches=[];
 for(const id of Object.keys(LESSONS))sessionTasks(id).forEach((task,index)=>{
  if(counterexampleBinding(task,{sessionId:id,index}))matches.push(id+':'+index);
 });
 assert.deepEqual(matches,['argument38:3','argument38:4']);
 for(const [id,b] of Object.entries(BRIDGES))sessionTasks(id).forEach((task,index)=>{
  assert.equal(counterexampleBinding(task,{sessionId:id,index}),null,id+':'+index);
 });
});
test('exact rational inequalities and both strict/non-strict boundaries',()=>{
 const strict=sessionTasks('argument38')[3],weak=sessionTasks('argument38')[4];
 for(const [task,index,rows] of [
  [strict,3,[['6','0','less',true],['6','1','equal',true],['6','1/2','less',true],['6','2','greater',false],['12','3','greater',false]]],
  [weak,4,[['6','0','less',true],['6','1','equal',false],['6','1/2','less',true],['6','2','greater',false],['12','3','greater',false]]]
 ]){
  for(const [x,f,choice,good] of rows){
   const model=run(task,x,f,choice);
   assert.equal(!!replayCounterexampleEvidence(task,model),good,task.rule+':'+x+':'+f);
   const feedback=thinkingFeedback(task,model,record(model),context(index));
   assert.equal(!!feedback,good);
   if(good){
    assert.equal(feedback.method.nodeId,'mt_j5YqQnN6xe');
    assert.match(feedback.observation,/实际检验/);
    assert.match(feedback.detail.join(' '),/不评价独立论证/);
   }
  }
 }
 for(const i of cases){
  const task=sessionTasks('argument38')[i],m=run(task,'6','1/2','less');
  assert.ok(replayCounterexampleEvidence(task,m));
  assert.ok(thinkingFeedback(task,m,record(m),context(i)));
  assert.equal(thinkingFeedback(task,m,record(m),{}),null);
  assert.equal(thinkingFeedback(task,m,{attempts:[]},context(i)),null);
  const edited=structuredClone(m);edited.prose='changed';
  assert.equal(thinkingFeedback(task,edited,record(m),context(i)),null);
  const wrong=run(task,'6','1/2','greater');
  assert.equal(replayCounterexampleEvidence(task,wrong),null);
  assert.equal(thinkingFeedback(task,wrong,record(wrong),context(i)),null);
 }
});
test('adversarial records, invalid history, no-ops and board edits never become evidence',()=>{
 for(const index of cases){
  const task=sessionTasks('argument38')[index],base=run(task,'6','1/2','less');
  const changes=[
   m=>m.history=[],m=>m.history.push({...m.history[0],a:'undo'}),
   m=>m.history.push({...m.history[0],a:'card'}),
   m=>m.history.push({...m.history[0],a:'test',i:'0'}),
   m=>m.history.push({...m.history[0],extra:'x'}),
   m=>m.history[0].w='-1',
   m=>m.history[0].v='0',
   m=>m.history[0].c='greater',
   m=>m.history[0].a='mark',
   m=>m.board.records[0].breaks=false,
   m=>m.board.records[0].actual='greater',
   m=>m.board.first.value='7',
   m=>m.board.bad=true,
   m=>m.issue='invalid',
   m=>m.value='7'
  ];
  for(const change of changes){
   const mod=structuredClone(base);change(mod);
   assert.equal(replayCounterexampleEvidence(task,mod),null,index+':'+JSON.stringify(mod.history));
  }
  const noOp=structuredClone(base);m38.act(task,noOp,'r38-card',{index:'arbitrary'});
  assert.ok(m38.valid(task,noOp),'original grader still accepts unrelated event');
  assert.equal(replayCounterexampleEvidence(task,noOp),null);
  const second=structuredClone(base);
  second.value='8';second.second='1/3';second.choice='less';m38.act(task,second,'r38-test');
  assert.ok(m38.inspect(task,second).correct);
  const p=replayCounterexampleEvidence(task,second);
  assert.equal(p?.comparisons,2,'two actual mathematically valid comparisons allowed');
  assert.equal(p?.factor,'1/3');
 }
});
