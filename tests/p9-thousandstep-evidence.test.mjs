import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {LESSONS} from '../dist/learning/catalog.js';
import {BRIDGES,sessionTasks,sessionTaskFor} from '../dist/learning/bridges.js';
import * as native from '../dist/learning/phase5/b08-model.js';
import {wideShiftAddBinding,replayWideShiftAddEvidence,wideShiftBinding,replayWideShiftEvidence} from '../dist/learning/wideshift-evidence.js';
import {thinkingGuide,thinkingFeedback} from '../dist/learning/thinking-feedback.js';
import {EVIDENCE_ADAPTERS} from '../dist/learning/evidence-adapters.js';
import {freshLesson,modelForLesson,submitLesson,currentSubmission,validateLesson} from '../dist/learning/state.js';

const hashes=[
 'c731f29330d42377b2f03a48b76922a410f1db1fd6458daeae69d6436512e998',
 '5f6068379436d21a4c678cb01052f6504404a55e4172e80dbe7765c708e90989',
 '0c488411248da2e3eda552cf1f17296235d7622608ae88fc5542a41fb05fc9e1',
 '4f137472f6324b05b54066b3c3c2d6b9f8ae70ccfb2c6bb3d0c88d00bebcb86e'
];
const stable=x=>Array.isArray(x)?x.map(stable):x&&typeof x==='object'?
 Object.fromEntries(Object.keys(x).sort().map(k=>[k,stable(x[k])])):x;
const hash=t=>createHash('sha256').update(JSON.stringify(stable(t))).digest('hex');
const ctx=index=>({sessionId:'thousandstep',index});
const task=index=>sessionTaskFor('thousandstep',index);
const copy=structuredClone;
function work(index,guess='0'){
 const t=task(index),m=native.initial(t);
 m.guess=guess;native.act(t,m,'wide-predict');
 if(index===3)native.act(t,m,'wide-swap',{kind:'down',index:0});
 native.act(t,m,'wide-move',{delta:Math.sign(t.step)});
 if(index===2)native.act(t,m,'wide-swap',{kind:'up',index:1});
 m.answer=String(Number(t.start)+t.step);
 for(const i of native.changed(t))native.act(t,m,'wide-changed',{index:i});
 assert.equal(native.inspect(t,m).correct,true,index);
 return m;
}
test('#301 four frozen source positions and independent BigInt process proofs',()=>{
 assert.equal(LESSONS.thousandstep.topicId,'mt_9XVFje6Tyr');
 for(let index=0;index<4;index++){
  const t=task(index),m=work(index),before=JSON.stringify(m);
  assert.equal(hash(t),hashes[index]);
  assert.equal(wideShiftAddBinding(t,ctx(index))?.nodeId,'mt_9XVFje6Tyr');
  assert.equal(wideShiftBinding(t,ctx(index)),null);
  assert.equal(replayWideShiftEvidence(t,m),null);
  const proof=replayWideShiftAddEvidence(t,m,ctx(index));
  assert.ok(proof,index);
  assert.equal(proof.end,String(Number(t.start)+t.step));
  assert.equal(proof.signedThousands,Math.sign(t.step));
  assert.equal(proof.successfulMoves,1);
  assert.equal(proof.exchanges,index>=2?1:0);
  assert.equal(proof.steps[0].kind,'predict');
  assert.equal(proof.baseTenConservationChecked,true);
  assert.equal(proof.unrecordedClicksAssessed,false);
  assert.equal(JSON.stringify(m),before);
  const record={attempts:[{value:copy(m),supported:false,exposed:false}],support:false};
  assert.ok(thinkingGuide(t,ctx(index)));assert.ok(thinkingFeedback(t,m,record,ctx(index)));
  assert.equal(thinkingFeedback(t,{...m,answer:'1'},record,ctx(index)),null);
  assert.equal(thinkingFeedback(t,m,{...record,attempts:[{value:{...m,answer:'1'}}]},ctx(index)),null);
 }
});
test('#301 preserve wrong guess, first wrong Check, revision, retry and legacy backup model',()=>{
 for(let index=0;index<4;index++){
  const t=task(index),lesson=freshLesson('thousandstep');lesson.index=index;
  const m=modelForLesson(lesson);Object.assign(m,work(index,'-1'));m.answer='0';
  assert.equal(submitLesson(lesson).correct,false);
  const first=copy(lesson.cases[index].attempts[0]);
  m.answer=String(Number(t.start)+t.step);
  assert.equal(submitLesson(lesson).correct,true);
  assert.deepEqual(lesson.cases[index].attempts[0],first);
  assert.equal(currentSubmission(lesson).status,'correct');
  const hint=thinkingFeedback(t,m,lesson.cases[index],ctx(index));
  assert.ok(hint);assert.match(hint.detail.join(''),/没有记录的点击不作推断/);
  assert.doesNotMatch(JSON.stringify(hint),/MP\.\d|已掌握|独立完成/);
  const restored=validateLesson(copy(lesson),'thousandstep');
  assert.deepEqual(restored.cases,lesson.cases);
  const old=copy(m);delete old.actions;
  assert.equal(native.valid(t,old),true,'old v2 model remains valid');
  assert.equal(replayWideShiftAddEvidence(t,old,ctx(index)),null,'no fictitious past clicks');
  lesson.models[index]=native.initial(t);
  assert.equal(lesson.cases[index].attempts.length,2);
  assert.deepEqual(lesson.cases[index].attempts[0],first);
  assert.equal(currentSubmission(lesson).status,'modified');
  assert.ok(validateLesson(copy(lesson),'thousandstep'));
 }
});
test('#301 reject forged history, impossible exchange order, wrong units, stale answer',()=>{
 for(let index=0;index<4;index++){
  const t=task(index),m=work(index);
  const mutations=[
   x=>x.actions.shift(),x=>x.actions.push({kind:'move',delta:1}),
   x=>x.actions[0].value='999',x=>x.moves[0]*=-1,
   x=>x.answer='0',x=>x.guess='5',x=>x.committed='5',
   x=>x.u[1]++,x=>x.changed=[],
   x=>x.actions[1]={kind:'move',delta:100},
   x=>x.actions[1]={kind:'move',delta:1,extra:true},
   x=>x.actions[1]={kind:'swap',direction:'up',index:2},
   x=>x.actions.push({kind:'swap',direction:'down',index:1}),
   x=>x.actions.push({kind:'changed',index:5}),x=>x.extra=true
  ];
  if(index===2||index===3)mutations.push(x=>{[x.actions[1],x.actions[2]]=[x.actions[2],x.actions[1]];});
  for(const mutation of mutations){
   const changed=copy(m);mutation(changed);
   assert.equal(replayWideShiftAddEvidence(t,changed,ctx(index)),null,index+' '+mutation.toString());
  }
  assert.equal(replayWideShiftAddEvidence({...t,prompt:t.prompt+' altered'},m,ctx(index)),null);
  assert.equal(replayWideShiftAddEvidence(t,m,{...ctx(index),index:(index+1)%4}),null);
  assert.equal(replayWideShiftAddEvidence(t,m,{sessionId:'thousandstep',index:String(index)}),null);
 }
});
test('#301 all unrelated native positions and bridge work remain excluded',()=>{
 const admitted=[];
 for(const id of Object.keys(LESSONS))
  for(const [index,t] of sessionTasks(id).entries())
   if(wideShiftAddBinding(t,{sessionId:id,index}))admitted.push(id+':'+index);
 assert.deepEqual(admitted.sort(),[0,1,2,3].map(i=>'thousandstep:'+i));
 for(const id of Object.keys(BRIDGES))
  for(const [index,t] of sessionTasks(id).entries())
   assert.equal(wideShiftAddBinding(t,{sessionId:id,index}),null,'bridge '+id+':'+index);
 for(const adapter of EVIDENCE_ADAPTERS)
  if(adapter.id!=='wideshift-add')
   assert.equal(adapter.binding(task(0),ctx(0)),null,'overlap '+adapter.id);
});
