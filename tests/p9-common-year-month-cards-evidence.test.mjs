// #335 WIP preflight: does not register A or replace native mathematical grading.
import test from 'node:test';
import assert from 'node:assert/strict';
import {sessionTasks} from '../dist/learning/bridges.js';
import {ensureB39Ready} from '../dist/learning/phase4/async-batches.js';
import {LESSONS} from '../dist/learning/catalog.js';
import {BRIDGES} from '../dist/learning/bridges.js';
import {commonYearMonthCardsFingerprint,commonYearMonthCardsEvidenceExample}
 from '../scripts/common-year-month-cards-evidence-fixture.mjs';
import * as native from '../dist/learning/phase5/b32-model.js';
import {commonYearMonthCardsBinding as bind,replayCommonYearMonthCardsEvidence as replay}
 from '../dist/learning/common-year-month-cards-evidence.js';

await ensureB39Ready();
const source={sessionId:'calendarfacts',index:1};
const task=sessionTasks(source.sessionId)[source.index];
const copy=structuredClone;
test('common-year twelve original month labels are source-isolated and not learner-derivation claims',()=>{
 assert.equal(task.type,'x-t32-units');
 assert.equal(bind(task,source)?.method,null);
 const model=native.example(task);
 assert.equal(native.valid(task,model),true);
 assert.equal(native.inspect(task,model).correct,true);
 const p=replay(task,model,source);
 assert.ok(p);
 assert.deepEqual(p.suppliedMonthDays,[31,28,31,30,31,30,31,31,30,31,30,31]);
 assert.equal(p.suppliedMonthDaysTotal,365);
 assert.equal(p.aprilDays,30);
 assert.equal(p.commonYearFebruaryDays,28);
 assert.equal(p.learnerIndependentMonthDayDerivationAssessed,false);
 assert.equal(p.leapYearRuleAssessed,false);
 for(const alteredTask of [
  {...task,prompt:task.prompt+'a'}, {...task,parts:task.parts.slice(1)},
  {...task,parts:[...task.parts].reverse()},
  {...task,questions:[...task.questions].reverse()},
  {...task,unreviewed:true}
 ])assert.equal(bind(alteredTask,source),null);
 for(const context of [
  {sessionId:'calendarfacts',index:0}, {sessionId:'calendarfacts',index:2},
  {sessionId:'calendarfacts',index:'1'}, {sessionId:'calendarfacts',index:1.5},
  {sessionId:'timeconvert',index:1}, {},[],null
 ])assert.equal(bind(task,context),null);
});
test('real unit toggles replay select, unselect, reselect without order dependence',()=>{
 const model=native.initial(task);
 native.act(task,model,'t32-unit',{index:11});
 native.act(task,model,'t32-unit',{index:11});
 for(let i=11;i>=0;i--)native.act(task,model,'t32-unit',{index:i});
 model.answers=['30','28'];
 assert.equal(native.valid(task,model),true);
 const p=replay(task,model,source);
 assert.ok(p);
 assert.equal(p.observedEvents.length,14);
 assert.deepEqual(p.observedEvents.slice(0,2).map(x=>x.kind),['select','unselect']);
 assert.equal(p.suppliedMonthDaysTotal,365);
});
test('tampering, invalid month indices and answer-only submissions fail closed',()=>{
 const original=native.example(task);
 for(const edit of [
  m=>{m.history[0].a='day';},m=>{m.history[0].i='012';},
  m=>{m.history[0].i='12';},m=>{m.history[0].v='31';},
  m=>{m.history[0].extra=true;},m=>{m.history.pop();},
  m=>{m.history=[];},m=>{m.board.selected=[];},
  m=>{m.answers[0]='31';},m=>{m.answers[1]='29';},
  m=>{m.answers[0]='';},m=>{m.hour='11';},
  m=>{m.issue='invalid';},m=>{m.extra=true;}
 ]){const m=copy(original);edit(m);assert.equal(replay(task,m,source),null);}
 for(const m of [null,{},[],false])assert.equal(replay(task,m,source),null);
});

test('complete original task SHA, genuine action fixture and exact source are frozen',()=>{
 assert.equal(LESSONS.calendarfacts.topicId,'mt_EXlmTURK_o');
 assert.equal(commonYearMonthCardsFingerprint(task),
  'd1b0ee036acf3aa56ebe9c4e228dd7a62d9383af23fc7773cce8dd48450a7546');
 assert.deepEqual(commonYearMonthCardsEvidenceExample(task),native.example(task));
});
test('preprinted answers do not turn whole-board toggles into a demonstrated math derivation',()=>{
 const proof=replay(task,commonYearMonthCardsEvidenceExample(task),source);
 assert.ok(proof);
 assert.equal(proof.preReviewOnly,true);
 assert.equal(proof.strictAApproved,false);
 assert.equal(proof.monthSpecificLookupStepsObserved,false);
 assert.equal(proof.learnerComputedAnnualDaysAssessed,false);
 assert.equal(proof.learnerIndependentMonthDayDerivationAssessed,false);
 assert.equal(proof.independentExplanationAssessed,false);
 assert.equal(proof.originalCardsToolProvided,true);
 assert.equal(proof.observedEvents.length,12);
 assert.equal(proof.suppliedMonthDaysTotal,365);
});
test('all other native unit sessions and associated clones remain excluded',()=>{
 for(const id of Object.keys(LESSONS))sessionTasks(id).forEach((t,index)=>{
  if(t.type==='x-t32-units'&&!(id==='calendarfacts'&&index===1))
   assert.equal(bind(t,{sessionId:id,index}),null,id+':'+index);
 });
 for(const id of Object.keys(BRIDGES))sessionTasks(id).forEach((t,index)=>{
  if(t.type==='x-t32-units')assert.equal(bind(t,{sessionId:id,index}),null,id+':'+index);
 });
});
