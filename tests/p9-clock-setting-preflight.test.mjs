import test from 'node:test';
import assert from 'node:assert/strict';
import {sessionTaskFor} from '../dist/learning/bridges.js';
import * as clock from '../dist/learning/phase5/b32-model.js';
import {clockSettingBinding,replayClockSettingEvidence} from '../dist/learning/clock-setting-evidence.js';
const cases=[
 ['hourclock',2,2,30,150],
 ['fiveclock',2,3,40,220],
 ['quarterclock',1,6,45,405]
];
function solved(id,index,h,m){
 const task=sessionTaskFor(id,index),model=clock.initial(task);
 model.hour=String(h);clock.field(task,model,'hour');
 model.minute=String(m);clock.field(task,model,'minute');
 for(let i=0;i<(task.questions||[]).length;i++){
  model.answers[i]=String(task.questions[i].value);
  clock.field(task,model,'answers.'+i);
 }
 return {task,model,context:{sessionId:id,index}};
}
test('#306 B32 setting: strict position, source and time-angle replay preflight',()=>{
 for(const [id,index,h,m,target] of cases){
  const {task,model,context}=solved(id,index,h,m);
  assert.equal(task.mode,'set');assert.equal(task.value,target);
  assert.ok(clock.valid(task,model));assert.equal(clock.inspect(task,model).correct,true);
  assert.ok(clockSettingBinding(task,context));
  const proof=replayClockSettingEvidence(task,model,context);
  assert.ok(proof,id);
  assert.equal(proof.finalMinutes,target);
  assert.equal(proof.hourHandHalfDegrees,(h%12)*60+m);
  assert.equal(proof.minuteHandDegrees,m*6);
  assert.equal(proof.chronologicalControls.length,2);
 }
});
test('#306 rejects answer-only, history corruption, wrong source and stale clock',()=>{
 for(const [id,index,h,m] of cases){
  const {task,model,context}=solved(id,index,h,m);
  const edits=[
   x=>x.history.shift(),x=>x.history.reverse(),
   x=>x.history[0].a='day',x=>x.history[0].i='99',
   x=>x.history[1].v='1',x=>x.history[1].extra=1,
   x=>x.history[1].i='61',x=>x.board.minute=59,
   x=>x.hour='12',x=>x.minute='0',x=>x.answers[0]='bad',
   x=>x.history[0].i='01'
  ];
  for(const edit of edits){const copy=structuredClone(model);edit(copy);
   assert.equal(replayClockSettingEvidence(task,copy,context),null,edit.toString());}
  assert.equal(replayClockSettingEvidence({...task,prompt:task.prompt+'!' },model,context),null);
  assert.equal(replayClockSettingEvidence(task,model,{...context,index:0}),null);
  assert.equal(replayClockSettingEvidence(task,model,{sessionId:'clockconvert',index:0}),null);
 }
});

test('#306 rejects malformed contexts, strict numeric approximations and old checked snapshots',async()=>{
 const {thinkingGuide,thinkingFeedback}=await import('../dist/learning/thinking-feedback.js');
 for(const [id,index,h,m] of cases){
  const {task,model,context}=solved(id,index,h,m);
  const saved={support:false,attempts:[{value:structuredClone(model)}]};
  assert.ok(thinkingGuide(task,context));
  assert.ok(thinkingFeedback(task,model,saved,context));
  for(const bad of [null,[],false,0,{sessionId:{toString:null},index},
   {sessionId:id,index:String(index)},{sessionId:id,index:0.5}]){
   assert.equal(clockSettingBinding(task,bad),null);
   assert.equal(thinkingGuide(task,bad),null);
   assert.equal(thinkingFeedback(task,model,saved,bad),null);
  }
  assert.equal(thinkingFeedback(task,{...model,prose:'changed'},saved,context),null);
  assert.equal(thinkingFeedback(task,model,{attempts:[{value:model},{value:clock.initial(task)}]},context),null);
  if(id!=='hourclock'){
   const approximate=structuredClone(model);
   approximate.answers[0]+='.00000000001';
   assert.equal(clock.inspect(task,approximate).correct,true);
   assert.equal(replayClockSettingEvidence(task,approximate,context),null);
  }
 }
});
