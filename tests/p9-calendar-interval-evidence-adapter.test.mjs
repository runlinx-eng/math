import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {TASKS,PRACTICE,BRIDGES} from '../dist/learning/phase5/b32.js';
import * as b32 from '../dist/learning/phase5/b32-model.js';
import {calendarIntervalBinding,replayCalendarIntervalEvidence} from '../dist/learning/calendar-interval-evidence.js';

const expected=[
 {index:2,hash:'0a1c94be2c27273dec8643548e92a0b6982372ce8da6fdb231cdbdba2ec4a8af',days:14},
 {index:3,hash:'e8907a46c2676f70d17276230648ee5fc7556ac5e760c2dde24f7743af95ae3b',days:2}
];
const context=index=>({sessionId:'calendaruse',index});
const stable=v=>Array.isArray(v)?v.map(stable):v&&typeof v==='object'?
 Object.fromEntries(Object.keys(v).sort((a,b)=>a.localeCompare(b,'en')).map(k=>[k,stable(v[k])])):v;
const sha=t=>createHash('sha256').update(JSON.stringify(stable(t))).digest('hex');
function action(t,m,a,index){b32.act(t,m,'t32-'+a,index===undefined?{}:{index});}
function build(index){
 const t=TASKS.calendaruse[index],m=b32.initial(t);
 for(const date of t.dates){
  const page=t.months.findIndex(([y,mo])=>date.startsWith(y+'-'+String(mo).padStart(2,'0')));
  if(t.months.length>1)action(t,m,'page',page);
  action(t,m,'day',date);
 }
 m.answers[0]=String(index===2?14:2);
 return m;
}
test('#314 two native source tasks are frozen and independently rechecked',()=>{
 for(const row of expected){
  const task=TASKS.calendaruse[row.index],m=build(row.index);
  assert.equal(sha(task),row.hash);
  assert.equal(b32.valid(task,m),true);
  assert.equal(b32.inspect(task,m).correct,true);
  assert.equal(calendarIntervalBinding(task,context(row.index))?.nodeId,'mt_tVvZVWO5d6');
  const proof=replayCalendarIntervalEvidence(task,m,context(row.index));
  assert.ok(proof);
  assert.equal(proof.elapsedDays,row.days);
  assert.equal(proof.endSerial-proof.startSerial,row.days);
  assert.equal(proof.observedDayClicks,2);
  assert.equal(proof.mentalCountingAssessed,false);
  assert.equal(proof.learnerMasteryAssessed,false);
 }
});
test('#314 same widget, wrong source, practice and bridge must never inherit contract',()=>{
 for(const i of [0,1])assert.equal(calendarIntervalBinding(TASKS.calendaruse[i],context(i)),null);
 for(const row of expected){
  const t=TASKS.calendaruse[row.index],ctx=context(row.index),m=build(row.index);
  assert.equal(calendarIntervalBinding(t,{sessionId:'calendarfacts',index:row.index}),null);
  assert.equal(calendarIntervalBinding(t,{sessionId:'calendaruse',index:String(row.index)}),null);
  assert.equal(calendarIntervalBinding({...t,prompt:t.prompt+'!'},ctx),null);
  assert.equal(replayCalendarIntervalEvidence({...t,prompt:t.prompt+'!'},m,ctx),null);
 }
 for(const [id,task] of Object.entries(PRACTICE))
  assert.equal(calendarIntervalBinding(task,{sessionId:id,index:0}),null);
 for(const bridge of BRIDGES)for(const task of bridge.tasks)
  assert.equal(calendarIntervalBinding(task,{sessionId:bridge.to,index:0}),null);
});
test('#314 missing day clicks, forged history, wrong interval and altered board fail closed',()=>{
 for(const row of expected){
  const t=TASKS.calendaruse[row.index],ctx=context(row.index),good=build(row.index);
  for(const change of [
   m=>{m.history=[];},
   m=>{m.history=m.history.filter(e=>e.a!=='day');},
   m=>{m.board.selected=[];},
   m=>{m.board.page=0; if(row.index===2)m.board.page=1;},
   m=>{m.answers[0]=String(row.days+1);},
   m=>{m.history[0].a='tick';},
   m=>{m.history.at(-1).i='1900-02-29';},
   m=>{m.history.at(-1).v='forged';},
   m=>{m.history.at(-1).extra='ghost';},
   m=>{m.history.push({a:'day',i:t.dates[0],v:''});}
  ]){
   const m=structuredClone(good);change(m);
   assert.equal(replayCalendarIntervalEvidence(t,m,ctx),null);
  }
 }
});
test('#314 wrong-first date selection and subsequent correction preserve observable clicks',()=>{
 for(const row of expected){
  const t=TASKS.calendaruse[row.index],m=b32.initial(t),ctx=context(row.index);
  const wrong=t.months[0][0]+'-'+String(t.months[0][1]).padStart(2,'0')+'-01';
  action(t,m,'day',wrong);action(t,m,'day',wrong);
  for(const date of t.dates){
   const page=t.months.findIndex(([y,mo])=>date.startsWith(y+'-'+String(mo).padStart(2,'0')));
   if(t.months.length>1)action(t,m,'page',page);
   action(t,m,'day',date);
  }
  m.answers[0]=String(row.days);
  const proof=replayCalendarIntervalEvidence(t,m,ctx);
  assert.ok(proof);assert.equal(proof.observedDayClicks,4);
  assert.equal(proof.chronologicalControls[0].input,wrong);
  assert.equal(proof.chronologicalControls[1].input,wrong);
 }
});
