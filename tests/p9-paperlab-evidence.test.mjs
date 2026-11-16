import test from 'node:test';
import assert from 'node:assert/strict';
import paper from './fixtures/p9-paperlab-cases.cjs';
import {LESSONS} from '../dist/learning/catalog.js';
import {sessionTasks} from '../dist/learning/bridges.js';
import * as b16 from '../dist/learning/phase5/b16-model.js';
import {paperLabBinding,replayPaperLabEvidence} from '../dist/learning/paperlab-evidence.js';

const clone=x=>structuredClone(x);
const taskOf=c=>sessionTasks(c.sessionId)[c.index];
const context=c=>({sessionId:c.sessionId,index:c.index});

test('exact paperlab whitelist contains 12 distinct native positions and five reviewed sources',()=>{
 assert.equal(paper.cases.length,12);
 assert.equal(new Set(paper.cases.map(c=>c.sessionId+':'+c.index)).size,12);
 assert.equal(new Set(paper.cases.map(c=>c.nodeId)).size,5);
 assert.deepEqual(Object.fromEntries(['fold','build','classify','paint'].map(mode=>
  [mode,paper.cases.filter(c=>c.mode===mode).length])),{fold:2,build:6,classify:3,paint:1});
});

for(const c of paper.cases){
 test('paperlab '+c.sessionId+':'+c.index+' accepts only its actual source and independently replays its original completed native model',()=>{
  const task=taskOf(c);
  assert.equal(task.type,'x-paperlab');assert.equal(task.mode,c.mode);assert.equal(task.d,c.d);
  assert.equal(task.take||1,c.take||1);
  assert.equal(task.shape||null,c.shape||null);
  assert.equal(!!task.writeName,!!c.writeName);
  assert.equal(LESSONS[c.sessionId].topicId,c.nodeId);
  assert.equal(paperLabBinding(task,context(c))?.nodeId,c.nodeId);
  assert.equal(paperLabBinding(task,{sessionId:'not-a-real-course',index:c.index}),null);
  assert.equal(paperLabBinding(task,{sessionId:c.sessionId,index:99}),null);
  assert.equal(paperLabBinding({...task,prompt:task.prompt+' edited'},context(c)),null);
  const model=b16.example(task);
  assert.equal(b16.valid(task,model),true);
  assert.equal(b16.inspect(task,model).correct,true);
  const proof=replayPaperLabEvidence(task,model);
  assert.ok(proof,'every actual native task has independent replay evidence');
  assert.equal(proof.mode,c.mode);assert.equal(proof.d,c.d);assert.equal(proof.method,null);
  assert.equal(proof.acceptedHistoryLength,model.history.length);
  assert.equal(proof.toolCreatedGrid,true);
  assert.equal(proof.independentDrawingAssessed,false);
  assert.equal(proof.generalMasteryAssessed,false);
  if(c.mode==='paint'){
   assert.equal(proof.savedWork.length,2);assert.equal(proof.currentDraft.valid,true);
   assert.equal(proof.currentDraft.alreadySaved,true);
   for(const saved of proof.savedWork)assert.deepEqual(saved.groups.map(x=>x.length),[4,4,4,4]);
  }else if(c.mode==='classify'){
   assert.equal(proof.judgements.length,task.cases.length);
   assert.equal(proof.judgements.every(x=>x.correct),true);
  }else{
   assert.equal(proof.selectedIds.length,c.take||1);
   assert.deepEqual(proof.answer,[c.take||1,c.d]);
  }
  const boardForgery=clone(model);boardForgery.board.rows=99;
  assert.equal(replayPaperLabEvidence(task,boardForgery),null);
  const hiddenFieldForgery=clone(model);hiddenFieldForgery.unit='forged';
  assert.equal(replayPaperLabEvidence(task,hiddenFieldForgery),null);
  const historyForgery=clone(model);historyForgery.history[0].action='nonexistent';
  assert.equal(replayPaperLabEvidence(task,historyForgery),null);
  const eventFieldForgery=clone(model);eventFieldForgery.history[0].data.fields.unit='forged';
  assert.equal(replayPaperLabEvidence(task,eventFieldForgery),null);
 });
}

test('failed classify first response and corrected real sequence retain original provenance',()=>{
 const c=paper.cases.find(x=>x.sessionId==='halfpaper'&&x.index===2);
 const task=taskOf(c),model=b16.initial(task);
 model.choice='no';
 b16.act(task,model,'b16-judge');
 assert.equal(model.board.first,'no');
 assert.equal(model.board.judgments.length,0);
 for(const step of b16.solveSteps(task)){
  if(step.field){model[step.field]=step.value;b16.field(task,model,step.field);}
  else b16.act(task,model,step.action,step.data);
 }
 assert.equal(b16.inspect(task,model).correct,true);
 const proof=replayPaperLabEvidence(task,model);
 assert.ok(proof);
 assert.equal(proof.first,'no');
 assert.ok(proof.failures.some(x=>x.action==='judge'));
 assert.equal(proof.judgements.filter(x=>x.correct).length,task.cases.length);
});

test('paint keeps two saved valid decompositions distinct from the current invalid draft',()=>{
 const c=paper.cases.find(x=>x.mode==='paint'),task=taskOf(c),model=b16.example(task);
 model.color='0';b16.field(task,model,'color');
 b16.act(task,model,'b16-paint',{index:12});
 assert.equal(b16.inspect(task,model).correct,true,'original model grades saved work');
 const proof=replayPaperLabEvidence(task,model);
 assert.ok(proof);
 assert.equal(proof.savedWork.length,2);
 assert.equal(proof.currentDraft.valid,false);
 assert.equal(proof.currentDraft.alreadySaved,false);
});

test('paint duplicate save is not a novel area split and preserves original issue',()=>{
 const c=paper.cases.find(x=>x.mode==='paint'),task=taskOf(c),model=b16.example(task);
 b16.act(task,model,'b16-save');
 assert.equal(model.board.saved.length,2);
 const proof=replayPaperLabEvidence(task,model);
 assert.ok(proof);
 assert.equal(proof.savedWork.length,2);
 assert.ok(proof.failures.some(x=>x.action==='save'));
 assert.match(proof.issue,/改变分界/);
});

test('submitted response cannot be inferred solely from the correct answer without real paper operations',()=>{
 const c=paper.cases.find(x=>x.mode==='build'&&x.d===6),task=taskOf(c);
 const model=b16.initial(task);model.answer='1/6';
 assert.equal(replayPaperLabEvidence(task,model),null);
 const completed=b16.example(task),forgotHistory=clone(completed);forgotHistory.history=[];
 assert.equal(replayPaperLabEvidence(task,forgotHistory),null);
 const wrong=clone(completed);wrong.answer='1/2';
 assert.equal(replayPaperLabEvidence(task,wrong),null);
});
