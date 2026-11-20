import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {TASKS,BRIDGES,PRACTICE} from '../dist/learning/phase5/b32.js';
import * as native from '../dist/learning/phase5/b32-model.js';
import {calendarDateReadingBinding,replayCalendarDateReadingEvidence} from '../dist/learning/calendar-date-reading-evidence.js';

const stable=x=>Array.isArray(x)?x.map(stable):x&&typeof x==='object'?Object.fromEntries(Object.keys(x).sort((a,b)=>a.localeCompare(b,'en')).map(k=>[k,stable(x[k])])):x;
const fingerprint=t=>createHash('sha256').update(JSON.stringify(stable(t))).digest('hex');
const cases=[
 {id:'calendaruse',index:0,date:'2026-03-15',hash:'18d0ebb351f38e6fc6a9e41e7a036c80c19b85dc7e430dd0632617303e0c4f2c',answer:'sun',day:15,weekday:0},
 {id:'calendaruse',index:1,date:'2026-03-18',hash:'654994f34cef51db6825efea7ad6ddf25b1620b60016d66df1bea53765ed3d94',answer:'18',day:18,weekday:3}
];
function solved(c){
 const task=TASKS[c.id][c.index],context={sessionId:c.id,index:c.index};
 const model=native.initial(task);
 native.act(task,model,'t32-day',{index:c.date});
 model.answers=[c.answer];
 return {task,context,model};
}
test('#329 both original dates have independent Gregorian results and real day clicks',()=>{
 for(const c of cases){
  const {task,context,model}=solved(c);
  assert.equal(fingerprint(task),c.hash,'original complete source task SHA256');
  assert.equal(native.valid(task,model),true);
  assert.equal(native.inspect(task,model).correct,true);
  assert.equal(calendarDateReadingBinding(task,context)?.nodeId,'mt_tVvZVWO5d6');
  const p=replayCalendarDateReadingEvidence(task,model,context);
  assert.ok(p,c.date);
  assert.equal(p.dayOfMonth,c.day);
  assert.equal(p.gregorianWeekday,c.weekday);
  assert.equal(p.observedDateClicks,1);
  assert.equal(p.independentExplanationAssessed,false);
  assert.equal(p.learnerMasteryAssessed,false);
 }
});
test('#329 real cancel and reselect are retained in ordered replay',()=>{
 for(const c of cases){
  const {task,context,model}=solved(c);
  native.act(task,model,'t32-day',{index:c.date});
  native.act(task,model,'t32-day',{index:c.date});
  const p=replayCalendarDateReadingEvidence(task,model,context);
  assert.ok(p);
  assert.equal(p.observedDateClicks,3);
  assert.equal(p.chronologicalControls[1].after.selected.length,0);
  assert.deepEqual(p.chronologicalControls[2].after.selected,[c.date]);
 }
});
test('#329 rejects wrong original source, task modification and forged outcomes',()=>{
 for(const c of cases){
  const {task,context,model}=solved(c);
  assert.equal(calendarDateReadingBinding({...task,prompt:task.prompt+'!'},context),null);
  assert.equal(calendarDateReadingBinding(task,{sessionId:'calendarfacts',index:c.index}),null);
  assert.equal(calendarDateReadingBinding(task,{...context,index:String(c.index)}),null);
  assert.equal(calendarDateReadingBinding(task,{...context,index:2}),null);
  assert.equal(replayCalendarDateReadingEvidence(task,{...model,history:[]},context),null);
  for(const edit of [
   m=>{m.history[0].a='unit';},
   m=>{m.history[0].i='2026-03-32';},
   m=>{m.history[0].i='2026-04-15';},
   m=>{m.history[0].v='spoof';},
   m=>{m.history[0].extra=1;},
   m=>{m.board.selected=[];},
   m=>{m.answers[0]='wrong';},
   m=>{m.hour='11';},
   m=>{m.issue='warning';}
  ]){
   const altered=structuredClone(model);edit(altered);
   assert.equal(replayCalendarDateReadingEvidence(task,altered,context),null,edit.toString());
  }
 }
});
test('#329 same widget must exclude prior two reviewed interval tasks, all bridges and practice',()=>{
 for(const [id,tasks]of Object.entries(TASKS))for(const [index,task]of tasks.entries()){
  const expected=id==='calendaruse'&&(index===0||index===1);
  if(task.type==='x-t32-calendar')
   assert.equal(!!calendarDateReadingBinding(task,{sessionId:id,index}),expected,id+':'+index);
 }
 for(const [id,t]of Object.entries(PRACTICE||{}))
  assert.equal(calendarDateReadingBinding(t,{sessionId:'practice:'+id,index:0}),null);
 for(const bridge of BRIDGES||[])for(const task of bridge.tasks||[])
  assert.equal(calendarDateReadingBinding(task,{sessionId:bridge.to,index:0}),null);
});
