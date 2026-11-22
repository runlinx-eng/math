// #342 P006r: source-locked B04 statistical question variation, no field-event log.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {sessionTaskFor} from '../dist/learning/bridges.js';
import {LESSONS} from '../dist/learning/catalog.js';
import * as native from '../dist/learning/phase4/b04-model.js';
import {nativeQuestionVariationBinding,replayNativeQuestionVariation,
 submittedNativeQuestionVariation} from '../dist/learning/p006r-native-question-variation-evidence.js';

const specs=[
 {index:1,hash:'1f654a820c65fc8586140e4977c599093e869fdc8ee54a1fdbb7265dd83f7bd3',
  variable:'sport',population:'group',answers:['足球','游泳'],unit:'different-children'},
 {index:2,hash:'eb954fa3f8aead15a7e41265af49424e2dfb61a178e180c078069d32825a34a7',
  variable:'minutes',population:'self-days',answers:['10','20'],unit:'one-person-many-days'}
];
const stable=v=>Array.isArray(v)?v.map(stable):v&&typeof v==='object'?
 Object.fromEntries(Object.keys(v).sort((a,b)=>a.localeCompare(b,'en')).map(k=>[k,stable(v[k])])):v;
const digest=v=>createHash('sha256').update(JSON.stringify(stable(v))).digest('hex');
function pair(s){
 const task=sessionTaskFor('statquestions',s.index),correct=native.initial(task);
 Object.assign(correct,{population:s.population,variable:s.variable,expected:'vary',
  answerA:s.answers[0],answerB:s.answers[1]});
 const wrong=structuredClone(correct);wrong.population='one-once';
 return {task,correct,wrong,record:{attempts:[
  {value:structuredClone(wrong)},{value:structuredClone(correct)}]}};
}
test('P006r exact native source, full task SHA, bounded correct and corrected Check snapshots',()=>{
 assert.equal(LESSONS.statquestions.topicId,'mt_iykH2P5oFq');
 for(const s of specs){
  const context={sessionId:'statquestions',index:s.index};
  const {task,correct,wrong,record}=pair(s);
  console.log('P006R_NATIVE_FULL_TASK_SHA256 statquestions:'+s.index+' '+digest(task));
  assert.equal(digest(task),s.hash);
  assert.equal(task.type,'x-questionbuild');
  assert.equal(native.valid(task,correct),true);
  assert.equal(native.inspect(task,wrong).correct,false);
  assert.equal(native.inspect(task,correct).correct,true);
  assert.deepEqual(nativeQuestionVariationBinding(task,context),{
   position:'statquestions:'+s.index,sourceNodeId:'mt_iykH2P5oFq',
   originalType:'x-questionbuild',variable:s.variable,
   observationUnit:s.unit,validPossibleValues:s.variable==='sport'?
    ['足球','游泳','羽毛球']:['10','20','30'],
   optionChangeIsObservable:true,originalFieldEventHistoryAvailable:false,
   strictAApproved:false});
  const proof=submittedNativeQuestionVariation(task,correct,record,context);
  assert.ok(proof);
  assert.equal(proof.originalCheckSnapshotsObserved,2);
  assert.equal(proof.wrongToCorrectCheckRevisionObserved,true);
  assert.equal(proof.originalControlChangeEventLogObserved,false);
  assert.equal(proof.actualSurveyResponsesObserved,false);
  assert.equal(proof.freeTextMeaningAssessed,false);
  assert.equal(proof.strictAApproved,false);
  assert.equal(proof.observationUnit,s.unit);
  assert.equal(replayNativeQuestionVariation(task,wrong,context),null);
  assert.equal(submittedNativeQuestionVariation(task,correct,{
   attempts:[{value:structuredClone(correct)}]},context),null);
 }
});
test('P006r fail-closed: wrong source, tampered task/fields, stale Check or false revision',()=>{
 for(const s of specs){
  const ctx={sessionId:'statquestions',index:s.index};
  const {task,correct,record}=pair(s);
  for(const context of [{sessionId:'statquestions',index:0},
    {sessionId:'statquestions',index:3},{sessionId:'statquestions',index:String(s.index)},
    {sessionId:'survey',index:s.index},{sessionId:'__proto__',index:s.index}]){
   assert.equal(replayNativeQuestionVariation(task,correct,context),null);
  }
  for(const fakeTask of [{...task,prompt:task.prompt+'!'},
    {...task,variable:s.variable==='sport'?'minutes':'sport'},
    {...task,extra:'forged'}, {...task,self:!task.self}]){
   assert.equal(replayNativeQuestionVariation(fakeTask,correct,ctx),null);
  }
  const mutations=[
   m=>m.population='one-once',m=>m.variable='fixed',
   m=>m.expected='same',m=>m.answerB=m.answerA,
   m=>m.answerA='forged',m=>m.notOriginal='bad'
  ];
  for(const change of mutations){
   const forged=structuredClone(correct);change(forged);
   assert.equal(replayNativeQuestionVariation(task,forged,ctx),null);
  }
  const stale=structuredClone(record);stale.attempts[1].value.answerB='forged';
  assert.equal(submittedNativeQuestionVariation(task,correct,stale,ctx),null);
  const fakeBefore=structuredClone(record);fakeBefore.attempts[0].value.answerA='forged';
  assert.equal(submittedNativeQuestionVariation(task,correct,fakeBefore,ctx),null);
  const noWrong=structuredClone(record);noWrong.attempts[0].value.population=s.population;
  assert.equal(submittedNativeQuestionVariation(task,correct,noWrong,ctx),null);
  const extra=structuredClone(record);extra.attempts.push({value:structuredClone(correct)});
  assert.equal(submittedNativeQuestionVariation(task,correct,extra,ctx),null);
  assert.equal(submittedNativeQuestionVariation(task,correct,{attempts:[]},ctx),null);
 }
});
