import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {LESSONS} from '../dist/learning/catalog.js';
import {BRIDGES,sessionTasks,sessionTaskFor} from '../dist/learning/bridges.js';
import * as place from '../dist/learning/phase5/b11-model.js';
import {placeRemovalBinding,replayPlaceRemovalEvidence,placeBinding,replayPlaceEvidence} from '../dist/learning/place-evidence.js';
import {thinkingGuide,thinkingFeedback} from '../dist/learning/thinking-feedback.js';
import {EVIDENCE_ADAPTERS} from '../dist/learning/evidence-adapters.js';
import {freshLesson,modelForLesson,submitLesson,currentSubmission,validateLesson} from '../dist/learning/state.js';

const cases=[
 {sessionId:'tensmove',index:1,values:[82,40],target:42,column:1,unit:10,hash:'42ef003e834f6b4407f857005e52e0585d2e0a29b186abc19e7cfef39b9af343',nodeId:'mt_I5j1ZWo2cn'},
 {sessionId:'hundredsmove',index:1,values:[762,400],target:362,column:2,unit:100,hash:'d64f49f77037193a52099f5cb98410800609c8afc9dc254889593a26b74abb3d',nodeId:'mt_xPqczp7zPX'}
];
const stable=x=>Array.isArray(x)?x.map(stable):x&&typeof x==='object'?Object.fromEntries(Object.keys(x).sort().map(k=>[k,stable(x[k])])):x;
const hash=t=>createHash('sha256').update(JSON.stringify(stable(t))).digest('hex');
const task=c=>sessionTaskFor(c.sessionId,c.index);
const context=c=>({sessionId:c.sessionId,index:c.index});
const record=m=>({support:false,attempts:[{value:structuredClone(m)}]});
function work(c,badAlign=false){
 const t=task(c),m=place.initial(t);m.guess='0';
 if(badAlign)place.act(t,m,'b11-place-start');
 m.align=t.values.map(()=> '0');place.act(t,m,'b11-place-start');
 place.act(t,m,'b11-remove',{index:c.column});m.answer=String(c.target);
 assert.equal(place.valid(t,m),true);assert.equal(place.inspect(t,m).correct,true);
 return m;
}
test('#304 exact native source hashes and real non-exchange integer conservation',()=>{
 for(const c of cases){
  const t=task(c),m=work(c),original=JSON.stringify(m),proof=replayPlaceRemovalEvidence(t,m,context(c));
  assert.equal(LESSONS[c.sessionId].topicId,c.nodeId);assert.deepEqual(t.values,c.values);
  assert.equal(hash(t),c.hash);assert.equal(placeRemovalBinding(t,context(c))?.nodeId,c.nodeId);
  assert.equal(placeBinding(t,context(c)),null);
  assert.equal(replayPlaceEvidence(t,m),null,'existing exchange replay is unchanged');
  assert.ok(proof);assert.equal(proof.exchangeCount,0);
  assert.equal(proof.removal.index,c.column);assert.equal(proof.removal.needed,4);
  assert.equal(proof.removal.unit,c.unit);assert.equal(proof.removal.quantity,c.values[1]);
  assert.equal(proof.total,c.target);assert.equal(proof.removed+proof.total,c.values[0]);
  assert.equal(proof.events.length,2);assert.equal(JSON.stringify(m),original);
  assert.ok(thinkingGuide(t,context(c)));
  const feedback=thinkingFeedback(t,m,record(m),context(c));assert.ok(feedback);
  assert.match(feedback.observation,/没有换位操作/);
  assert.doesNotMatch(JSON.stringify(feedback),/已掌握|独立心算|MP\./);
 }
});
test('#304 failed alignment remains historical, first wrong Check can be corrected and restored',()=>{
 for(const c of cases){
  const t=task(c),m=work(c,true),proof=replayPlaceRemovalEvidence(t,m,context(c));
  assert.ok(proof);assert.equal(proof.failedStarts,1);
  assert.equal(proof.events[0].accepted,false);
  assert.deepEqual(proof.events[0].before,proof.events[0].after);
  const lesson=freshLesson(c.sessionId);lesson.index=c.index;
  Object.assign(modelForLesson(lesson),structuredClone(m));
  const live=modelForLesson(lesson);live.answer='0';
  assert.equal(submitLesson(lesson).correct,false);
  const first=structuredClone(lesson.cases[c.index].attempts[0]);
  live.answer=String(c.target);
  assert.equal(submitLesson(lesson).correct,true);
  assert.deepEqual(lesson.cases[c.index].attempts[0],first);
  assert.equal(currentSubmission(lesson).status,'correct');
  const feedback=thinkingFeedback(t,live,lesson.cases[c.index],context(c));
  assert.ok(feedback);assert.match(feedback.detail.join(''),/修改后又试了一次/);
  const restored=validateLesson(structuredClone(lesson),c.sessionId);
  assert.deepEqual(restored.cases,lesson.cases);
  lesson.models[c.index]=place.initial(t);
  assert.equal(lesson.cases[c.index].attempts.length,2);
  assert.equal(currentSubmission(lesson).status,'modified');
  assert.ok(validateLesson(structuredClone(lesson),c.sessionId));
  const legacy=structuredClone(m);legacy.history=[];
  assert.ok(place.valid(t,legacy),'old model can remain readable');
  assert.equal(replayPlaceRemovalEvidence(t,legacy,context(c)),null);
 }
});
test('#304 reject invented, repeated, shuffled, no-op, wrong unit and stale evidence',()=>{
 for(const c of cases){
  const t=task(c),m=work(c),ctx=context(c);
  const mutations=[
   x=>x.history.shift(),x=>x.history.reverse(),x=>x.history.push(structuredClone(x.history[1])),
   x=>x.history[0].guess='abc',x=>x.history[0].align[0]='1',
   x=>x.history[1].index=0,x=>x.history[1].needed=0,
   x=>x.history[1].needed=3,x=>x.history[1].before[0]=99,
   x=>x.history[1].extra=true,
   x=>x.history.push({action:'b11-exchange',index:1,dir:'down',before:[...x.counts]}),
   x=>x.counts[c.column]++,x=>x.remaining[c.column]=4,
   x=>x.guess='999',x=>x.first='999',x=>x.align[0]='1',
   x=>x.answer='1',x=>x.issue='forged',x=>x.started=false,
   x=>x.extra='injected',x=>x.history[1].action='b11-place-start'
  ];
  for(const change of mutations){
   const altered=structuredClone(m);change(altered);
   assert.equal(replayPlaceRemovalEvidence(t,altered,ctx),null,change.toString());
  }
  assert.equal(replayPlaceRemovalEvidence({...t,prompt:t.prompt+' changed'},m,ctx),null);
  assert.equal(replayPlaceRemovalEvidence(t,m,{...ctx,index:0}),null);
  assert.equal(replayPlaceRemovalEvidence(t,m,{...ctx,index:'1'}),null);
  assert.equal(thinkingFeedback(t,m,{attempts:[{value:{...m,answer:'1'}}]},ctx),null);
  for(const adapter of EVIDENCE_ADAPTERS)
   if(adapter.id!=='place-removal')assert.equal(adapter.binding(t,ctx),null,adapter.id+' overlap');
 }
});
test('#304 the four automatic additions and all associated bridge tasks are excluded',()=>{
 const admitted=[];
 for(const sessionId of Object.keys(LESSONS))for(const [index,t] of sessionTasks(sessionId).entries())
  if(placeRemovalBinding(t,{sessionId,index}))admitted.push(sessionId+':'+index);
 assert.deepEqual(admitted.sort(),['hundredsmove:1','tensmove:1']);
 for(const sessionId of Object.keys(BRIDGES))for(const [index,t] of sessionTasks(sessionId).entries())
  assert.equal(placeRemovalBinding(t,{sessionId,index}),null,'associated '+sessionId+':'+index);
 for(const sessionId of ['tensmove','hundredsmove'])for(const index of [0,2])
  assert.equal(placeRemovalBinding(sessionTaskFor(sessionId,index),{sessionId,index}),null);
});
