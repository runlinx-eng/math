import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {TASKS,BRIDGES,PRACTICE} from '../dist/learning/phase5/b32.js';
import * as native from '../dist/learning/phase5/b32-model.js';
import {timeUnitPartsBinding,replayTimeUnitPartsEvidence} from '../dist/learning/time-unit-parts-evidence.js';

const cases=[
 ['durationunit',2,'mt__N55B7u7HD','a4b8cc3ab8ca39557ad2f318869c86009190b05403c227878710fa8f1338a9d3',120,[2,120]],
 ['hoursday',0,'mt_2XDGT5tei1','212843e1f0b36c73b1eb788e2b94fc795e03a2396166de57b7435c8b70828302',3600,[60]],
 ['hoursday',1,'mt_2XDGT5tei1','bab632b8393c8e0224ce0e4e9b83bb4f46b8b6df20b4f5603ed0f71177a7c759',86400,[24]],
 ['hoursday',2,'mt_2XDGT5tei1','cef8b68d985c09debdf129887cfe8fe1c2aee31756f8a7308cf7c71ec875bf0f',5400,[1,30]],
 ['timeconvert',0,'mt_2yas4Unc8o','1bae521a58580ee0fe402c19cf0f3d3aa946368e84fd42b3e1a2991f54aded92',12300,[205]],
 ['timeconvert',1,'mt_2yas4Unc8o','2635aa3849d226069eb93f7f6efe01c25bb497f54034837d2ab98ccecf1c40ec',150,[2,30]],
 ['calendarfacts',0,'mt_EXlmTURK_o','56655e258936575429bca55375504ac92cb9b58d05a55b75aad0053205c4f14d',60,[1]]
];
const stable=x=>Array.isArray(x)?x.map(stable):x&&typeof x==='object'?
 Object.fromEntries(Object.keys(x).sort((a,b)=>a.localeCompare(b,'en')).map(k=>[k,stable(x[k])])):x;
const hash=x=>createHash('sha256').update(JSON.stringify(stable(x))).digest('hex');
const context=([id,index])=>({sessionId:id,index});
function solved(row){
 const [id,index]=row,task=TASKS[id][index],m=native.initial(task);
 for(let i=0;i<task.parts.length;i++)native.act(task,m,'t32-unit',{index:i});
 m.answers=task.questions.map(q=>String(q.value));
 return {task,m,ctx:context(row)};
}
test('#327 original seven task fingerprints, distinct sources and independently replayed time sums',()=>{
 for(const row of cases){
  const {task,m,ctx}=solved(row);
  assert.equal(hash(task),row[3],row[0]+':'+row[1]);
  assert.equal(native.valid(task,m),true);
  assert.equal(native.inspect(task,m).correct,true);
  assert.equal(timeUnitPartsBinding(task,ctx)?.nodeId,row[2]);
  const p=replayTimeUnitPartsEvidence(task,m,ctx);assert.ok(p,row[0]+':'+row[1]);
  assert.equal(p.totalSeconds,row[4]);
  assert.deepEqual(p.expectedAnswers,row[5]);
  assert.equal(p.controlEvents.length,task.parts.length);
  assert.equal(p.independentCalculationAssessed,false);
  assert.equal(p.learnerMasteryAssessed,false);
 }
});
test('#327 source/task spoofing, answer-only snapshots and forged controls reject',()=>{
 for(const row of cases){
  const {task,m,ctx}=solved(row);
  assert.equal(replayTimeUnitPartsEvidence(task,{...m,history:[]},ctx),null);
  for(const edit of [
   x=>{x.history.pop();},x=>{x.history[0].a='day';},
   x=>{x.history[0].i='01';},x=>{x.history[0].i='999';},
   x=>{x.history[0].v='forged';},x=>{x.history[0].extra=1;},
   x=>{x.board.selected=[];},x=>{x.answers[0]='999';},
   x=>{x.minute='1';},x=>{x.history[0].i='-1';}
  ]){
   const x=structuredClone(m);edit(x);
   assert.equal(replayTimeUnitPartsEvidence(task,x,ctx),null,edit.toString());
  }
  assert.equal(replayTimeUnitPartsEvidence({...task,prompt:task.prompt+'!'},m,ctx),null);
  assert.equal(timeUnitPartsBinding(task,{...ctx,index:String(ctx.index)}),null);
  assert.equal(timeUnitPartsBinding(task,{...ctx,index:ctx.index+10}),null);
 }
});
test('#327 selection/correction toggles retain actual event order without inventing moves',()=>{
 for(const row of cases){
  const {task,m,ctx}=solved(row);
  native.act(task,m,'t32-unit',{index:0});
  native.act(task,m,'t32-unit',{index:0});
  const p=replayTimeUnitPartsEvidence(task,m,ctx);
  assert.ok(p);
  assert.equal(p.controlEvents.at(-2).action,'unselect');
  assert.equal(p.controlEvents.at(-1).action,'select');
  assert.deepEqual(p.selectedOriginalCardIdentities,task.parts.map((_,i)=>i));
 }
});
test('#327 other task types, same control wrong sources and association contexts are excluded',()=>{
 for(const row of cases){
  const {task,m,ctx}=solved(row);
  assert.equal(timeUnitPartsBinding(task,{sessionId:'wrong',index:ctx.index}),null);
  assert.equal(timeUnitPartsBinding({...task,parts:[...task.parts,{label:'1小时'}]},ctx),null);
  assert.equal(replayTimeUnitPartsEvidence(task,m,{}),null);
 }
 for(const [id,tasks] of Object.entries(TASKS))for(const [index,task]of tasks.entries())
  if(task.type==='x-t32-units'){
   const expected=cases.some(([session,position])=>id===session&&index===position);
   assert.equal(!!timeUnitPartsBinding(task,{sessionId:id,index}),expected,id+':'+index);
  }
 for(const [id,task]of Object.entries(PRACTICE||{}))
  assert.equal(timeUnitPartsBinding(task,{sessionId:id,index:0}),null);
 for(const bridge of BRIDGES||[])for(const task of bridge.tasks||[])
  assert.equal(timeUnitPartsBinding(task,{sessionId:bridge.to,index:0}),null);
});
