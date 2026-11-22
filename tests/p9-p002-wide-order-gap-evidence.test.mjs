// #342 / P002: independent candidate Node contract/negative suite; not formal A.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {sessionTaskFor} from '../dist/learning/bridges.js';
import * as original from '../dist/learning/phase5/b08-model.js';
import {
  wideOrderGapBinding as binding,replayWideOrderGapEvidence as replay,
  submittedWideOrderGapEvidence as submitted
} from '../dist/learning/p002-wide-order-gap-evidence.js';

const cases=[
  {sessionId:'placeproblems',index:1,hash:'fe801fed3d8193d295850adbb8d19aacbdb0c33aee17f0de07f849849b04f1a2',
    nodeId:'mt__sMrmOv3bx',order:[1,0,2],gap:500},
  {sessionId:'bigproblems',index:2,hash:'7a40c552e48ec98d9918c0eefa90dbb10e81ee3efa896710531eeee20fb6205f',
    nodeId:'mt_xMt1TLTs--',order:[3,0,2,1,4],gap:67000}
];
const stable=v=>Array.isArray(v)?v.map(stable):v&&typeof v==='object'
  ?Object.fromEntries(Object.keys(v).sort((a,b)=>a.localeCompare(b,'en')).map(k=>[k,stable(v[k])])):v;
const digest=v=>createHash('sha256').update(JSON.stringify(stable(v))).digest('hex');
function fixture(c){
 const task=sessionTaskFor(c.sessionId,c.index),model=original.initial(task);
 // Authentic original action handler; a fixture, NOT a simulated child.
 for(const index of c.order)original.act(task,model,'wide-order',{index});
 for(let i=0;i<task.values.length;i++){
  model.positions[i]=Math.round((Number(task.values[i])-task.min)/(task.max-task.min)*1000);
  original.field(task,model,'positions.'+i);
 }
 model.gap=String(c.gap);
 return {task,model};
}
const edit=(model,change)=>{const m=structuredClone(model);change(m);return m;};
for(const c of cases){
 const id=c.sessionId+':'+c.index;
 test(id+' native task hash, independent order/range and Check boundary',()=>{
  const {task,model}=fixture(c),context={sessionId:c.sessionId,index:c.index};
  assert.equal(digest(task),c.hash,'runtime task fingerprint');
  assert.equal(binding(task,context)?.nodeId,c.nodeId);
  assert.equal(original.valid(task,model),true);
  assert.equal(original.inspect(task,model).correct,true);
  const result=replay(task,model,context);
  assert.ok(result,'candidate replay');
  assert.deepEqual(result.selectedSourceIndices,c.order);
  assert.equal(result.exactRange,String(c.gap));
  assert.equal(result.recordedPickRemoveEvents.length,c.order.length);
  assert.equal(result.sliderMovementChronologyObserved,false);
  assert.equal(result.arithmeticCalculationStepsObserved,false);
  const wrong=edit(model,m=>{m.gap=String(c.gap+1);});
  assert.equal(replay(task,wrong,context),null);
  assert.ok(submitted(task,model,{attempts:[{value:wrong},{value:structuredClone(model)}]},context));
  assert.equal(submitted(task,model,{attempts:[]},context),null);
  assert.equal(submitted(task,model,{attempts:[{value:wrong}]},context),null);
  assert.equal(submitted(task,edit(model,m=>{m.first='changed';}),{attempts:[{value:model}]},context),null);
 });
 test(id+' forged order/axis/history/answer/other source fail closed',()=>{
  const {task,model}=fixture(c),context={sessionId:c.sessionId,index:c.index};
  const bad=[
   m=>{m.orderTrace=[];},m=>{m.orderTraceOverflow=true;},
   m=>{m.orderTrace[0].kind='remove';},m=>{m.orderTrace[0].index=-1;},
   m=>{m.orderTrace[0].unexpected=1;},m=>{m.orderTrace.pop();},
   m=>{m.order=[...m.order].reverse();},m=>{m.touched[0]=false;},
   m=>{m.positions[c.order[0]]=0;},m=>{m.positions[c.order[1]]=m.positions[c.order[0]];},
   m=>{m.gap=String(c.gap+1);},m=>{m.gap=String(c.gap)+'.1';},
   m=>{m.gap='1e'+String(c.gap).length;},m=>{m.gap='Infinity';},
   m=>{m.rows[0][0]=1;},m=>{m.words[0]='forged';}
  ];
  for(const mutation of bad)assert.equal(replay(task,edit(model,mutation),context),null,mutation.toString());
  for(const contextBad of [{sessionId:c.sessionId,index:0},{sessionId:'term38',index:2},
   {sessionId:c.sessionId,index:'1'},null,{}]){
   assert.equal(binding(task,contextBad),null);
   assert.equal(replay(task,model,contextBad),null);
  }
  for(const taskBad of [{...task,prompt:task.prompt+' '},{...task,gap:false},
    {...task,values:[...task.values].reverse()},{...task,min:task.min+1}]){
   assert.equal(binding(taskBad,context),null);
   assert.equal(replay(taskBad,model,context),null);
  }
 });
}
test('bigproblems:2 original tolerance may accept a reversed close axis; strict replay rejects',()=>{
 const c=cases[1],{task,model}=fixture(c),context={sessionId:c.sessionId,index:c.index};
 // 152430 ideal 762.15; 154230 ideal 771.15: 767 and 766 are each within 6,
 // yet the larger value would be plotted left of the smaller.
 model.positions[2]=767;model.positions[1]=766;
 assert.equal(original.inspect(task,model).correct,true,'original grader accepts tolerance');
 assert.equal(replay(task,model,context),null,'strict mathematical axis rejects reversed position');
});
test('negative wrong-first => remove/pick => corrected source-native chronology',()=>{
 const c=cases[0],{task,model}=fixture(c),context={sessionId:c.sessionId,index:c.index};
 const wrong=original.initial(task);
 for(const i of [0,1,2])original.act(task,wrong,'wide-order',{index:i});
 for(let i=0;i<task.values.length;i++){
  wrong.positions[i]=model.positions[i];original.field(task,wrong,'positions.'+i);
 }
 wrong.gap=model.gap;
 assert.equal(original.inspect(task,wrong).correct,false);
 assert.equal(replay(task,wrong,context),null);
 for(const i of [0,1,2])original.act(task,wrong,'wide-order',{index:i});
 for(const i of c.order)original.act(task,wrong,'wide-order',{index:i});
 assert.equal(original.inspect(task,wrong).correct,true);
 assert.equal(replay(task,wrong,context)?.recordedPickRemoveEvents.length,9);
 assert.ok(submitted(task,wrong,{attempts:[{value:structuredClone(model)},{value:structuredClone(wrong)}]},context));
});
