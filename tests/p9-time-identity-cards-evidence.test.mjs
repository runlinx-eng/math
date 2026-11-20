// #331 source preflight: independent math and genuine B32 control replay.
// This is NOT formal A registration or Chromium acceptance.
import test from 'node:test';
import assert from 'node:assert/strict';
import {LESSONS} from '../dist/learning/catalog.js';
import {BRIDGES,sessionTasks} from '../dist/learning/bridges.js';
import {ensureB39Ready} from '../dist/learning/phase4/async-batches.js';
import * as native from '../dist/learning/phase5/b32-model.js';
import {EVIDENCE_ADAPTERS} from '../dist/learning/evidence-adapters.js';
import {timeIdentityCardsBinding as bind,replayTimeIdentityCardsEvidence as replay} from
 '../dist/learning/time-identity-cards-evidence.js';

await ensureB39Ready();
const cases=[
 {sessionId:'ampmclock',index:2,nodeId:'mt_4m8BimI4G5',minutes:[740,20]},
 {sessionId:'romanclock',index:2,nodeId:'mt_5J2quSTspi',minutes:[920,425,740,20]},
 {sessionId:'clockconvert',index:2,nodeId:'mt_WfrE_4r-kY',minutes:[20,740]}
];
const copy=structuredClone;
const at=c=>sessionTasks(c.sessionId)[c.index];
const context=c=>({sessionId:c.sessionId,index:c.index});
const positive=c=>{
 const task=at(c),model=native.example(task);
 assert.ok(native.valid(task,model));
 assert.equal(native.inspect(task,model).correct,true);
 const proof=replay(task,model,context(c));
 assert.ok(proof);
 assert.deepEqual(proof.cards.map(x=>x.minuteOfDay),c.minutes);
 assert.equal(proof.observedEvents.length,task.parts.length);
 assert.equal(proof.originalCardsToolProvided,true);
 assert.equal(proof.learnerConversionDerivationAssessed,false);
 return {task,model,proof};
};
test('three isolated original positions; no automatic promotion to formal A',()=>{
 assert.equal(cases.length,3);
 assert.equal(new Set(cases.map(x=>x.nodeId)).size,3);
 assert.equal(EVIDENCE_ADAPTERS.some(x=>x.id==='time-identity-cards'),false);
 for(const c of cases){
  const {task,model}=positive(c);
  assert.equal(LESSONS[c.sessionId].topicId,c.nodeId);
  assert.equal(bind(task,context(c))?.method,null);
  assert.equal(replay(task,model,{...context(c),index:c.index+1}),null);
  for(const changed of [
   {...task,prompt:task.prompt+'!'}, {...task,parts:[...task.parts].reverse()},
   {...task,questions:[]}, {...task,extra:true}
  ])assert.equal(bind(changed,context(c)),null);
  for(const badContext of [
   {sessionId:c.sessionId,index:String(c.index)},
   {sessionId:c.sessionId,index:[c.index]},
   {sessionId:[c.sessionId],index:c.index},
   {sessionId:c.sessionId,index:-1}, {sessionId:c.sessionId,index:0.5},
   {},null,[c.sessionId,c.index]
  ]){assert.equal(bind(task,badContext),null);assert.equal(replay(task,model,badContext),null);}
 }
});
test('ordered real card toggles, correction, and exact independent time identities',()=>{
 for(const c of cases){
  const t=at(c),m=native.initial(t);
  const first=0;
  native.act(t,m,'t32-unit',{index:first});
  native.act(t,m,'t32-unit',{index:first});
  for(let i=t.parts.length-1;i>=0;i--)native.act(t,m,'t32-unit',{index:i});
  for(const [i,q] of t.questions.entries())
   m.answers[i]=q.kind==='time24'?native.clock24(q.value):q.value;
  assert.ok(native.valid(t,m));
  assert.equal(native.inspect(t,m).correct,true);
  const proof=replay(t,m,context(c));
  assert.ok(proof);
  assert.equal(proof.observedEvents.length,t.parts.length+2);
  assert.deepEqual(proof.observedEvents.slice(0,2).map(x=>x.kind),['select','unselect']);
  assert.deepEqual(proof.selectedOriginalCardIdentities,t.parts.map((_,i)=>i));
  assert.deepEqual(proof.cards.map(x=>x.minuteOfDay),c.minutes);
  assert.equal(proof.independentTimeNormalizationVerified,true);
 }
});
test('forged, missing, altered and contradictory controls fail closed',()=>{
 for(const c of cases){
  const {task,model}=positive(c);
  const changes=[
   m=>{m.history[0].i=String(task.parts.length);},
   m=>{m.history[0].i='00';},
   m=>{m.history[0].a='day';},
   m=>{m.history[0].v='1';},
   m=>{m.history[0].extra=1;},
   m=>{m.history.pop();},
   m=>{m.board.selected=[];},
   m=>{m.hour='1';},
   m=>{m.minute='2';},
   m=>{m.issue='not clear';},
   m=>{m.extra=true;},
   m=>{m.answers[0]='incorrect';},
   m=>{m.answers[0]=undefined;}
  ];
  for(const edit of changes){const altered=copy(model);edit(altered);assert.equal(replay(task,altered,context(c)),null);}
  for(const malformed of [null,{},[],true])assert.equal(replay(task,malformed,context(c)),null);
  const missing=copy(model);
  missing.history=[];
  assert.equal(replay(task,missing,context(c)),null);
 }
});
test('all other original unit cards and all bridges retain source isolation',()=>{
 const permitted=new Set(cases.map(c=>c.sessionId+':'+c.index));
 for(const id of Object.keys(LESSONS)){
  sessionTasks(id).forEach((task,index)=>{
   if(task.type!=='x-t32-units')return;
   const key=id+':'+index;
   if(permitted.has(key))return;
   assert.equal(bind(task,{sessionId:id,index}),null,key);
   assert.equal(replay(task,native.example(task),{sessionId:id,index}),null,key);
  });
 }
 for(const id of Object.keys(BRIDGES)){
  sessionTasks(id).forEach((task,index)=>{
   if(task.type!=='x-t32-units')return;
   assert.equal(bind(task,{sessionId:id,index}),null,id+':'+index);
  });
 }
});
