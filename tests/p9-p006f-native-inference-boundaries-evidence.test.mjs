// #342 P006f: original B19 survey-plan controls, exact fingerprints, hostile replay.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {sessionTaskFor} from '../dist/learning/bridges.js';
import {LESSONS} from '../dist/learning/catalog.js';
import * as native from '../dist/learning/phase5/b19-model.js';
import {nativeInferenceBoundaryBinding,replayNativeInferenceBoundary,
 submittedNativeInferenceBoundary} from '../dist/learning/p006f-native-inference-boundaries-evidence.js';
const cases=[
 {id:'studyplan',index:2,node:'mt_SHVyE1CLUa',
  hash:'d961dacf687bbe09a860c314838adc89cc1ef382fdec40ffd6ab8aefe3f1d40e',
  correct:['sample','repeat'],wrong:'none'},
 {id:'betterquestion',index:2,node:'mt_O-U263ukg1',
  hash:'ad6950d2c3c35cde3e202def61672215e16a15be8fd195b8db019fc89dada00c',
  correct:['selection','wider'],wrong:'none'}
];
const stable=v=>Array.isArray(v)?v.map(stable):v&&typeof v==='object'?
 Object.fromEntries(Object.keys(v).sort((a,b)=>a.localeCompare(b,'en')).map(k=>[k,stable(v[k])])):v;
const digest=v=>createHash('sha256').update(JSON.stringify(stable(v))).digest('hex');
function make(t,s,correctFromStart=false){
 const m=native.initial(t);
 m.answers=s.correct.slice();
 if(!correctFromStart)m.answers[0]=s.wrong;
 native.act(t,m,'b19-plan');
 if(!correctFromStart){assert.ok(m.issue);m.answers=s.correct.slice();native.act(t,m,'b19-plan');}
 return m;
}
for(const s of cases){
 const ctx={sessionId:s.id,index:s.index},position=s.id+':'+s.index;
 test('P006f registered native source, task SHA and bounded inference boundary '+position,()=>{
  const t=sessionTaskFor(s.id,s.index);
  console.log('P006F_NATIVE_FULL_TASK_SHA256 '+position+' '+digest(t));
  assert.equal(LESSONS[s.id].topicId,s.node);assert.equal(digest(t),s.hash);
  assert.equal(t.type,'x-dataplan');assert.equal(t.draft,true);
  assert.deepEqual(t.choices.map(x=>x.answer),s.correct);
  assert.equal(nativeInferenceBoundaryBinding(t,ctx)?.position,position);
  for(const fromCorrect of [false,true]){
   const m=make(t,s,fromCorrect);
   assert.equal(native.valid(t,m),true);
   assert.equal(native.inspect(t,m).correct,true);
   const proof=replayNativeInferenceBoundary(t,m,ctx);
   assert.ok(proof);
   assert.equal(proof.wrongInferenceThenCorrectionObserved,!fromCorrect);
   assert.equal(proof.observedPlanClickEvents,fromCorrect?1:2);
   assert.deepEqual(proof.observedFinalChoices,s.correct);
   assert.equal(proof.recordedSurveyResponsesObserved,false);
   assert.equal(proof.strictAApproved,false);
   assert.equal(proof.representativenessVerified,false);
   assert.equal(proof.causalInferenceVerified,false);
   assert.ok(proof.selectedLimitation&&proof.selectedImprovement);
   const record={attempts:[{value:native.initial(t)},{value:structuredClone(m)}]};
   assert.ok(submittedNativeInferenceBoundary(t,m,record,ctx));
   assert.equal(submittedNativeInferenceBoundary(t,m,{attempts:[{value:record.attempts[0].value}]},ctx),null);
  }
 });
 test('P006f fail closed on false claims, source substitution and forged events '+position,()=>{
  const t=sessionTaskFor(s.id,s.index),m=make(t,s),one=make(t,s,true);
  const before=native.initial(t);before.answers=s.correct.slice();before.answers[0]=s.wrong;
  native.act(t,before,'b19-plan');
  assert.equal(native.inspect(t,before).correct,false);
  assert.equal(replayNativeInferenceBoundary(t,before,ctx),null);
  for(const context of [{sessionId:s.id,index:s.index+1},{sessionId:'bridge-'+s.id,index:s.index},
    {sessionId:'__proto__',index:s.index},{sessionId:s.id,index:'0'}])
   assert.equal(replayNativeInferenceBoundary(t,m,context),null);
  for(const badTask of [{...t,prompt:t.prompt+'!'},
    {...t,choices:t.choices.slice().reverse()},
    {...t,draft:false},
    {...t,choices:t.choices.map((c,i)=>i===0?{...c,answer:s.wrong}:c)}])
   assert.equal(replayNativeInferenceBoundary(badTask,m,ctx),null);
  const attacks=[
   x=>x.history.pop(),x=>x.history[0].a='reset',
   x=>x.history[0].d.index='0',x=>x.history[0].f.fake='forged',
   x=>x.history[0].f.answers[0]='invalid',x=>x.history[0].f.answers[1]=s.correct[0],
   x=>x.history[0].f.reason='forged',x=>x.history[0].f.draft=5,
   x=>x.history[1].f.answers[0]=s.wrong,
   x=>x.history[1].d.extra='x',x=>x.history[1].f.answers[1]=s.wrong,
   x=>x.history.push(structuredClone(x.history.at(-1))),
   x=>x.board.saved=false,x=>x.board.first.plan.fake=1,
   x=>x.answers[0]=s.wrong,x=>x.answers.push('extra'),
   x=>x.issue='forged',x=>x.reason='invented',
   x=>x.board.first.plan=x.history.at(-1).f
  ];
  for(const edit of attacks){const v=structuredClone(m);edit(v);
   assert.equal(replayNativeInferenceBoundary(t,v,ctx),null,edit.toString());
  }
  const forged=structuredClone(one);forged.history.push(structuredClone(one.history[0]));
  assert.equal(replayNativeInferenceBoundary(t,forged,ctx),null);
  const stale=structuredClone(m);stale.history[0].f.answers=s.correct.slice();
  assert.equal(replayNativeInferenceBoundary(t,stale,ctx),null);
  const falseBoundary=structuredClone(m);
  falseBoundary.history[0].f.answers[1]=s.id==='studyplan'?'erase':'delete';
  assert.equal(replayNativeInferenceBoundary(t,falseBoundary,ctx),null);
 });
}
