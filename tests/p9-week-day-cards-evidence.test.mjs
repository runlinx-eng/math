// #333 WIP math/source preflight. Never interpret Node alone as formal A.
import test from 'node:test';
import assert from 'node:assert/strict';
import {LESSONS} from '../dist/learning/catalog.js';
import {BRIDGES,sessionTasks} from '../dist/learning/bridges.js';
import {ensureB39Ready} from '../dist/learning/phase4/async-batches.js';
import * as native from '../dist/learning/phase5/b32-model.js';
import {weekDayCardsBinding as bind,replayWeekDayCardsEvidence as replay}
 from '../dist/learning/week-day-cards-evidence.js';

await ensureB39Ready();
const source={sessionId:'timeconvert',index:2};
const task=sessionTasks(source.sessionId)[source.index];
const copy=structuredClone;
const validExample=()=>{
 const model=native.example(task);
 assert.equal(native.valid(task,model),true);
 assert.equal(native.inspect(task,model).correct,true);
 const proof=replay(task,model,source);
 assert.ok(proof);
 assert.deepEqual(proof.originalCardDays,[7,7,7,7,7,7,7,7,3]);
 assert.equal(proof.totalDays,59);
 assert.equal(proof.learnerUnitConversionDerivationAssessed,false);
 return model;
};
test('exact original week/day source is isolated without prematurely granting A',()=>{
 assert.equal(LESSONS.timeconvert.topicId,'mt_2yas4Unc8o');
 assert.equal(task.type,'x-t32-units');
 assert.equal(bind(task,source)?.method,null);
 validExample();
 for(const changed of [
  {...task,prompt:task.prompt+'!'},
  {...task,parts:task.parts.slice(1)},
  {...task,parts:[...task.parts].reverse()},
  {...task,questions:[{...task.questions[0],value:11}]},
  {...task,unreviewed:true}
 ]){assert.equal(bind(changed,source),null);assert.equal(replay(changed,native.example(task),source),null);}
 for(const context of [
  {...source,index:0},{...source,index:1},{...source,index:3},
  {...source,index:'2'},{...source,index:-1},{...source,index:2.5},
  {sessionId:'hoursday',index:2},null,{},[]
 ]){assert.equal(bind(task,context),null);assert.equal(replay(task,native.example(task),context),null);}
});
test('actual card toggle/reselection history independently totals 8*7+3',()=>{
 const m=native.initial(task);
 native.act(task,m,'t32-unit',{index:0});
 native.act(task,m,'t32-unit',{index:0});
 for(let i=8;i>=0;i--)native.act(task,m,'t32-unit',{index:i});
 m.answers[0]='59';
 assert.equal(native.valid(task,m),true);
 assert.equal(native.inspect(task,m).correct,true);
 const p=replay(task,m,source);
 assert.ok(p);
 assert.deepEqual(p.observedEvents.slice(0,2).map(e=>e.kind),['select','unselect']);
 assert.equal(p.observedEvents.length,11);
 assert.equal(p.totalDays,59);
});
test('forged, stale, truncated and wrong-answer histories fail closed',()=>{
 const model=validExample();
 for(const change of [
  m=>{m.history[0].a='day';},m=>{m.history[0].i='09';},
  m=>{m.history[0].i='9';},m=>{m.history[0].v='7';},
  m=>{m.history[0].extra=true;},m=>{m.history.pop();},
  m=>{m.board.selected=[];},m=>{m.hour='11';},
  m=>{m.minute='20';},m=>{m.issue='bad';},
  m=>{m.answers[0]='11';},m=>{m.answers[0]='';},
  m=>{m.history=[];},m=>{m.extra=true;}
 ]){const altered=copy(model);change(altered);assert.equal(replay(task,altered,source),null);}
 for(const v of [null,{},[],false])assert.equal(replay(task,v,source),null);
});
test('other native unit positions and bridge clones never bind',()=>{
 for(const id of Object.keys(LESSONS))sessionTasks(id).forEach((t,index)=>{
  if(t.type!=='x-t32-units'||(id==='timeconvert'&&index===2))return;
  assert.equal(bind(t,{sessionId:id,index}),null,id+':'+index);
 });
 for(const id of Object.keys(BRIDGES))sessionTasks(id).forEach((t,index)=>{
  if(t.type==='x-t32-units')assert.equal(bind(t,{sessionId:id,index}),null,id+':'+index);
 });
});
