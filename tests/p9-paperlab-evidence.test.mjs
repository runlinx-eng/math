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

// Independent visible-control traces supplement the original model's examples.
import fs from 'node:fs';
import crypto from 'node:crypto';
import {BRIDGES} from '../dist/learning/bridges.js';
import {PRACTICE} from '../dist/learning/tasks.js';
import {ensureB39Ready} from '../dist/learning/phase4/async-batches.js';
import {paperLabEvidenceExample,paperLabSolveSteps,applyPaperVisibleStep,paperPaintPatterns} from '../scripts/paperlab-evidence-fixture.mjs';
import {thinkingGuide,thinkingFeedback} from '../dist/learning/thinking-feedback.js';
const stable=x=>Array.isArray(x)?x.map(stable):x&&typeof x==='object'?
 Object.fromEntries(Object.keys(x).sort((a,b)=>a.localeCompare(b,'en')).map(k=>[k,stable(x[k])])):x;
const digest=x=>crypto.createHash('sha256').update(x).digest('hex');
const taskHash=x=>digest(JSON.stringify(stable(x)));
const step=(t,m,action,data={})=>applyPaperVisibleStep(t,m,{action:'b16-'+action,data});
const fill=(t,m,field,value)=>applyPaperVisibleStep(t,m,{field,value:String(value)});
const record=m=>({attempts:[{correct:true,value:clone(m)}]});

await ensureB39Ready();
test('all 12 native tasks, 24 bridges, three practices and five genuine navigation prerequisites remain frozen',()=>{
 for(const [file,expected]of Object.entries(paper.sourceHashes))assert.equal(digest(fs.readFileSync(new URL('../'+file,import.meta.url))),expected);
 for(const c of [...paper.cases,...paper.bridges,...paper.navigation]){
  assert.deepEqual(sessionTasks(c.id)[c.index],c.task);assert.equal(taskHash(c.task),c.taskHash);
 }
 assert.equal(paper.bridges.length,24);assert.equal(paper.practices.length,3);assert.equal(paper.navigation.length,5);
 const actual=Object.entries(BRIDGES).flatMap(([id,b])=>b.tasks.flatMap((t,index)=>t.type==='x-paperlab'?[id+':'+index]:[]));
 assert.deepEqual(actual.sort(),paper.bridges.map(c=>c.id+':'+c.index).sort());
 for(const c of [...paper.bridges,...paper.practices]){
  if(c.index===-1)assert.deepEqual(PRACTICE[c.id],c.task);
  assert.equal(paperLabBinding(c.task,{sessionId:c.id,index:c.index}),null);
  assert.equal(thinkingGuide(c.task,{sessionId:c.id,index:c.index}),null);
  const m=paperLabEvidenceExample(c.task);assert.equal(b16.inspect(c.task,m).correct,true);
  assert.equal(thinkingFeedback(c.task,m,record(m),{sessionId:c.id,index:c.index}),null);
 }
});

for(const c of paper.cases)test(c.id+':'+c.index+' independent original-control construction, failure, reset and snapshot boundaries',()=>{
 const t=taskOf(c),ctx=context(c),m=paperLabEvidenceExample(t,{reverse:true});
 assert.equal(b16.inspect(t,m).correct,true);const proof=replayPaperLabEvidence(t,m);assert.ok(proof);
 assert.equal(proof.round,0);assert.equal(proof.first,null===m.board.first?null:m.board.first);
 assert.ok(thinkingGuide(t,ctx));assert.ok(thinkingFeedback(t,m,record(m),ctx));
 if(t.mode==='classify'){
  assert.deepEqual(proof.judgements.map(j=>j.truth),c.expected.truth);
  assert.deepEqual(proof.judgements.map(j=>j.observedShares),c.expected.shares);
 }else if(t.mode==='paint'){
  assert.deepEqual(proof.savedWork.map(s=>s.colors),paperPaintPatterns.slice(0,2));
  assert.deepEqual(proof.savedWork.map(s=>s.groups.map(g=>g.length)),[[4,4,4,4],[4,4,4,4]]);
 }else assert.deepEqual(proof.answer,c.expected.answer);
 const before=clone(m);step(t,m,'reset');assert.equal(replayPaperLabEvidence(t,m),null);
 assert.deepEqual(m.history.slice(0,before.history.length),before.history);assert.equal(m.board.first,before.board.first);
 assert.equal(thinkingFeedback(t,m,record(before),ctx),null);
 for(const action of paperLabSolveSteps(t))applyPaperVisibleStep(t,m,action);
 const after=replayPaperLabEvidence(t,m);assert.ok(after);assert.equal(after.round,1);
 assert.equal(after.resets.length,1);assert.deepEqual(m.history.slice(0,before.history.length),before.history);
 if(t.mode==='paint'){
  assert.equal(after.savedWork.length,2);assert.equal(after.historicalSavedWork.length,4);
  assert.deepEqual(after.savedWork.map(s=>s.colors),m.board.saved);
  assert.ok(thinkingFeedback(t,m,record(m),ctx).observation.includes('最后一轮已经保存 2 种'));
 }else if(t.mode==='classify'){
  assert.equal(after.judgements.length,t.cases.length);assert.equal(after.historicalJudgements.length,2*t.cases.length);
 }else if(t.mode==='fold'){
  assert.equal(after.folds.length,Math.log2(t.d));assert.equal(after.historicalFolds.length,2*Math.log2(t.d));
 }
 const forged=clone(m);forged.history.at(-1).data.fields.unit='forged';assert.equal(replayPaperLabEvidence(t,forged),null);
 assert.equal(after.independentDrawingAssessed,false);assert.equal(after.exactKeystrokeOrderKnown,false);
 assert.equal(after.allLaterClicksRecorded,false);assert.equal(after.recordingLimit,2000);
});

test('classifier preserves empty first choice and rejects a fabricated unselectable value even when later corrected',()=>{
 const t=taskOf(paper.cases.find(c=>c.mode==='classify')),m=b16.initial(t);
 step(t,m,'judge');assert.equal(m.board.first,'');
 for(const action of paperLabSolveSteps(t))applyPaperVisibleStep(t,m,action);
 const proof=replayPaperLabEvidence(t,m);assert.ok(proof);assert.equal(proof.first,'');assert.equal(proof.failures.length,1);
 const forged=b16.initial(t);forged.choice='not-an-option';b16.act(t,forged,'b16-judge');
 for(const action of paperLabSolveSteps(t))applyPaperVisibleStep(t,forged,action);
 assert.equal(b16.inspect(t,forged).correct,true);assert.equal(replayPaperLabEvidence(t,forged),null);
});

test('classification names use exact fractions and retain incorrect name before a genuine correction',()=>{
 const c=paper.cases.find(c=>c.writeName),t=taskOf(c),m=b16.initial(t);
 fill(t,m,'choice','yes');fill(t,m,'answer','1/5');step(t,m,'judge');assert.equal(m.board.judgments.length,0);
 fill(t,m,'answer','2/12');step(t,m,'judge');assert.deepEqual(m.board.judgments,['yes']);
 for(const [choice,answer]of [['no','0'],['yes','1/6']]){fill(t,m,'choice',choice);fill(t,m,'answer',answer);step(t,m,'judge');}
 const p=replayPaperLabEvidence(t,m);assert.ok(p);assert.equal(p.failures.length,1);assert.equal(p.judgements.length,4);
 const f=thinkingFeedback(t,m,record(m),context(c));assert.ok(f.detail.some(x=>x.includes('“是”')));
});

test('all allowed rectangular grids and exact fraction names are independently reachable, circle row constraint remains enforced',()=>{
 let complete=0;
 for(const c of paper.cases.filter(c=>c.mode==='build')){
  const t=taskOf(c);
  for(let rows=1;rows<=6;rows++)for(let cols=1;cols<=12;cols++)if(rows*cols===t.d&&(!t.shape||rows===1)){
   const m=b16.initial(t);fill(t,m,'rows',rows);fill(t,m,'cols',cols);step(t,m,'partition');
   for(let i=0;i<(t.take||1);i++)step(t,m,'paper',{index:t.d-1-i});
   fill(t,m,'answer',2*(t.take||1)+'/'+2*t.d);assert.ok(replayPaperLabEvidence(t,m));complete++;
   fill(t,m,'rows','7');step(t,m,'partition');assert.ok(m.issue);fill(t,m,'rows',rows);
   assert.ok(replayPaperLabEvidence(t,m),'correcting the field retains the real failed partition issue');
  }
 }
 assert.equal(complete,15); // 1+3+1+3+4+3 legal row/column factorizations.
 const c=paper.cases.find(c=>c.shape==='circle'),t=taskOf(c),m=b16.initial(t);
 fill(t,m,'rows',2);fill(t,m,'cols',1);step(t,m,'partition');assert.equal(m.board.rows,1);assert.ok(m.issue);
 assert.equal(replayPaperLabEvidence(t,m),null);
});

test('paint empty visible color records a genuine no-op before a corrected complete construction',()=>{
 const c=paper.cases.find(c=>c.mode==='paint'),t=taskOf(c),m=b16.initial(t);
 fill(t,m,'color','');step(t,m,'save');assert.ok(m.issue);
 const cells=clone(m.board.cells);step(t,m,'paint',{index:0});
 assert.deepEqual(m.board.cells,cells);assert.equal(m.issue,'');
 const prefix=clone(m.history);
 for(const action of paperLabSolveSteps(t))applyPaperVisibleStep(t,m,action);
 assert.equal(b16.inspect(t,m).correct,true);assert.deepEqual(m.history.slice(0,prefix.length),prefix);
 const proof=replayPaperLabEvidence(t,m);assert.ok(proof);
 const noop=proof.operations[1];assert.equal(noop.action,'paint');assert.equal(noop.fields.color,'');
 assert.equal(noop.accepted,true);assert.equal(noop.changed,false);assert.equal(noop.issue,'');
 assert.deepEqual(noop.before,noop.after);assert.equal(proof.changes.length,32);
 assert.equal(proof.savedWork.length,2);assert.equal(proof.failures.length,1);
});

test('paint save and final editable state preserve the actual empty color option without inventing a color',()=>{
 const c=paper.cases.find(c=>c.mode==='paint'),t=taskOf(c),m=b16.initial(t);
 for(const pattern of paperPaintPatterns.slice(0,2)){
  for(const [index,color]of pattern.entries()){fill(t,m,'color',color);step(t,m,'paint',{index});}
  fill(t,m,'color','');step(t,m,'save');
 }
 fill(t,m,'answer','1/4');assert.equal(m.color,'');assert.equal(b16.inspect(t,m).correct,true);
 const proof=replayPaperLabEvidence(t,m);assert.ok(proof);assert.equal(proof.savedWork.length,2);
 assert.deepEqual(proof.operations.filter(op=>op.action==='save').map(op=>op.fields.color),['','']);
 assert.deepEqual(proof.savedWork.map(saved=>saved.colors),paperPaintPatterns.slice(0,2));
 const fake=clone(m);fake.color='4';assert.equal(replayPaperLabEvidence(t,fake),null);
 const invented=clone(m);invented.history[0].data.fields.color='not-an-option';
 assert.equal(replayPaperLabEvidence(t,invented),null);
});

test('paint reset with empty color retains prior work as history and accepts only the rebuilt current round',()=>{
 const c=paper.cases.find(c=>c.mode==='paint'),t=taskOf(c),m=paperLabEvidenceExample(t);
 fill(t,m,'color','');const prefix=clone(m.history);step(t,m,'reset');
 assert.deepEqual(m.history.slice(0,prefix.length),prefix);assert.equal(m.color,'');
 assert.equal(m.board.saved.length,0);assert.equal(replayPaperLabEvidence(t,m),null);
 for(const action of paperLabSolveSteps(t))applyPaperVisibleStep(t,m,action);
 fill(t,m,'color','');assert.equal(b16.inspect(t,m).correct,true);
 const proof=replayPaperLabEvidence(t,m);assert.ok(proof);assert.equal(proof.round,1);
 assert.equal(proof.savedWork.length,2);assert.equal(proof.historicalSavedWork.length,4);
 assert.equal(proof.operations.find(op=>op.action==='reset').fields.color,'');
 assert.deepEqual(m.history.slice(0,prefix.length),prefix);
});

test('only changing color names is duplicate; unsaved valid boundaries and invalid drafts remain separate from saved work',()=>{
 const c=paper.cases.find(c=>c.mode==='paint'),t=taskOf(c),m=paperLabEvidenceExample(t);
 for(const [i,color]of paperPaintPatterns[1].entries()){fill(t,m,'color',(color+1)%4);step(t,m,'paint',{index:i});}
 step(t,m,'save');assert.equal(m.board.saved.length,2);assert.ok(replayPaperLabEvidence(t,m).failures.length);
 for(const [i,color]of paperPaintPatterns[2].entries()){fill(t,m,'color',color);step(t,m,'paint',{index:i});}
 let proof=replayPaperLabEvidence(t,m);assert.ok(proof.currentDraft.valid);assert.equal(proof.currentDraft.alreadySaved,false);
 assert.equal(proof.savedWork.length,2);step(t,m,'save');assert.equal(m.board.saved.length,3);
 fill(t,m,'color',3);step(t,m,'paint',{index:0});proof=replayPaperLabEvidence(t,m);assert.equal(proof.currentDraft.valid,false);
 assert.equal(proof.savedWork.length,3);assert.equal(b16.inspect(t,m).correct,true);
 const fake=clone(m);fake.color='4';step(t,fake,'reset');for(const action of paperLabSolveSteps(t))applyPaperVisibleStep(t,fake,action);
 assert.equal(b16.inspect(t,fake).correct,true);assert.equal(replayPaperLabEvidence(t,fake),null);
});


test('classify feedback distinguishes equal-size shares with the wrong count from unequal-size shares',()=>{
 const c=paper.cases.find(x=>x.id==='quarterpaper'&&x.index===2),t=taskOf(c),m=paperLabEvidenceExample(t);
 const p=replayPaperLabEvidence(t,m),feedback=thinkingFeedback(t,m,record(m),context(c));
 assert.deepEqual(p.judgements.map(j=>j.truth),[true,false,false,true]);
 const unequal=t.cases[1],total=unequal.reduce((sum,n)=>sum+n,0);
 assert.deepEqual(unequal.map(n=>total/n),[6,6,6,2],'unequal shares can each be a unit fraction, just not all the required 1/4');
 assert.match(feedback.connection,/不能把每一块都叫作整个的 1\/4/);
 const twoEqual=feedback.detail.find(line=>line.startsWith('第 3 张：'));
 assert.match(twoEqual,/各份占 2、2 格/);
 assert.match(twoEqual,/这 2 份大小相同，但题目要求 4 个相等份/);
 assert.doesNotMatch(twoEqual,/不相等份|大小不同/);
 assert.match(feedback.detail.find(line=>line.startsWith('第 2 张：')),/份数是要求的 4 份，但各份大小不同/);
 assert.match(feedback.detail.find(line=>line.startsWith('第 1 张：')),/是题目要求的 4 个相等份/);
 assert.equal(b16.inspect(t,m).correct,true,'original grading is unchanged');
});
