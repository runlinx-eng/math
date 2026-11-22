// #342 P006s: exact two native simulated survey tasks, independent frequencies.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {sessionTaskFor} from '../dist/learning/bridges.js';
import {LESSONS} from '../dist/learning/catalog.js';
import {validModel,inspect} from '../dist/learning/tasks.js';
import {nativeSurveyFrequencyBinding,replayNativeSurveyFrequency,
 submittedNativeSurveyFrequency} from '../dist/learning/p006s-native-survey-frequency-evidence.js';

const specs=[
 {index:0,hash:'b408662903dcf4427dbd62cde33a67aed44713215040dfe2e1a315ed6d040712',
  order:[1,0,2,0,1,0,2,1,0],counts:[4,3,2],mode:0},
 {index:1,hash:'62e70fbba828146520ab23b8f3e59738ddde922ff980cc3b79af83e2ce892595',
  order:[1,2,0,1,3,2,1,0,2,1],counts:[2,4,3,1],mode:1}
];
const stable=v=>Array.isArray(v)?v.map(stable):v&&typeof v==='object'?
 Object.fromEntries(Object.keys(v).sort((a,b)=>a.localeCompare(b,'en')).map(k=>[k,stable(v[k])])):v;
const digest=v=>createHash('sha256').update(JSON.stringify(stable(v))).digest('hex');
function records(s){
 const task=sessionTaskFor('survey',s.index);
 const correct={seen:s.order.length,counts:[...s.counts],choice:s.mode};
 const wrong=structuredClone(correct);wrong.counts[s.mode]--;
 const record={attempts:[{value:structuredClone(wrong)},{value:structuredClone(correct)}]};
 return {task,correct,wrong,record,ctx:{sessionId:'survey',index:s.index}};
}
test('P006s full native task SHA, independent modal frequency and two Check snapshots',()=>{
 assert.equal(LESSONS.survey.topicId,'mt_ebQURBOsM5');
 for(const s of specs){
  const {task,correct,wrong,record,ctx}=records(s);
  console.log('P006S_NATIVE_FULL_TASK_SHA256 survey:'+s.index+' '+digest(task));
  assert.equal(digest(task),s.hash);
  assert.equal(task.type,'survey');
  assert.deepEqual(task.order,s.order);
  assert.equal(validModel(task,correct),true);
  assert.equal(inspect(task,wrong).correct,false);
  assert.equal(inspect(task,correct).correct,true);
  const binding=nativeSurveyFrequencyBinding(task,ctx);
  assert.equal(binding.position,'survey:'+s.index);
  assert.equal(binding.originalTaskSha256,s.hash);
  assert.equal(binding.simulatedObservationCount,s.order.length);
  assert.deepEqual(binding.sourceScenarioCounts,s.counts);
  assert.equal(binding.originalObservationEventHistoryAvailable,false);
  const proof=submittedNativeSurveyFrequency(task,correct,record,ctx);
  assert.equal(proof.originalTaskSha256,s.hash);
  assert.deepEqual(proof.independentlyRecountedFrequencies,s.counts);
  assert.equal(proof.modalCategoryIndex,s.mode);
  assert.equal(proof.originalCheckSnapshotsObserved,2);
  assert.equal(proof.wrongToCorrectCheckRevisionObserved,true);
  assert.equal(proof.originalObservationEventHistoryAvailable,false);
  assert.equal(proof.individualCountButtonHistoryAvailable,false);
  assert.equal(proof.realSurveyRespondentsObserved,false);
  assert.equal(proof.childIndependentCountingProcessVerified,false);
  assert.equal(proof.strictAApproved,false);
  assert.equal(replayNativeSurveyFrequency(task,wrong,ctx),null);
 }
});
test('P006s fail closed on source, task, model, tally and stale Check tampering',()=>{
 for(const s of specs){
  const {task,correct,record,ctx}=records(s);
  for(const badCtx of [
   {sessionId:'survey',index:2},{sessionId:'tally',index:s.index},
   {sessionId:'survey',index:String(s.index)},{sessionId:'__proto__',index:s.index},
   null,{},[]]){
   assert.equal(replayNativeSurveyFrequency(task,correct,badCtx),null);
  }
  for(const bad of [
    {...task,prompt:task.prompt+'!'},
    {...task,order:task.order.slice().reverse()},
    {...task,counts:task.counts.map((v,i)=>i===0?v+1:v)},
    {...task,labels:task.labels.slice().reverse()},
    {...task,extra:'forged'}, {...task,question:'other'}]){
   assert.equal(replayNativeSurveyFrequency(bad,correct,ctx),null);
  }
  const changes=[
   m=>m.seen--,m=>m.seen++,m=>m.choice=null,m=>m.choice=(s.mode+1)%m.counts.length,
   m=>m.counts[s.mode]--,m=>m.counts[0]++,m=>m.counts.push(0),
   m=>m.extra=true,m=>m.counts[0]=-1
  ];
  for(const mutate of changes){
   const bad=structuredClone(correct);mutate(bad);
   assert.equal(replayNativeSurveyFrequency(task,bad,ctx),null);
  }
  const stale=structuredClone(record);stale.attempts.pop();
  assert.equal(submittedNativeSurveyFrequency(task,correct,stale,ctx),null);
  const fabricated=structuredClone(record);fabricated.attempts[0].value.counts[0]++;
  assert.equal(submittedNativeSurveyFrequency(task,correct,fabricated,ctx),null);
  const none=structuredClone(record);none.attempts[0].value=structuredClone(correct);
  assert.equal(submittedNativeSurveyFrequency(task,correct,none,ctx),null);
  const extra=structuredClone(record);extra.attempts.push({value:correct});
  assert.equal(submittedNativeSurveyFrequency(task,correct,extra,ctx),null);
  const wrongChoice=structuredClone(record);wrongChoice.attempts[0].value.choice=null;
  assert.equal(submittedNativeSurveyFrequency(task,correct,wrongChoice,ctx),null);
 }
});
