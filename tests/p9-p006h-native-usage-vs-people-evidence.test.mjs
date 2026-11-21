// #342 P006h: original B19 survey-plan controls, exact fingerprints, hostile replay.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {sessionTaskFor} from '../dist/learning/bridges.js';
import {LESSONS} from '../dist/learning/catalog.js';
import * as native from '../dist/learning/phase5/b19-model.js';
import {nativeUsageCountBoundaryBinding,replayNativeUsageCountBoundary,
 submittedNativeUsageCountBoundary} from '../dist/learning/p006h-native-usage-vs-people-evidence.js';
const cases=[
 {id:'playgroundstudy',index:2,node:'mt_kxeuXm6EyC',
  hash:'b982e6b2e7953fae44e694ed685f14442047ae9b20178cd1a8151e8b85b8d414',
  correct:['visits','recorded'],wrong:'people'}
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
 test('P006h registered native source, task SHA and usage events versus distinct people '+position,()=>{
  const t=sessionTaskFor(s.id,s.index);
  console.log('P006H_NATIVE_FULL_TASK_SHA256 '+position+' '+digest(t));
  assert.equal(LESSONS[s.id].topicId,s.node);assert.equal(digest(t),s.hash);
  assert.equal(t.type,'x-dataplan');assert.equal(t.draft,true);
  assert.deepEqual(t.choices.map(x=>x.answer),s.correct);
  assert.equal(nativeUsageCountBoundaryBinding(t,ctx)?.position,position);
  for(const fromCorrect of [false,true]){
   const m=make(t,s,fromCorrect);
   assert.equal(native.valid(t,m),true);
   assert.equal(native.inspect(t,m).correct,true);
   const proof=replayNativeUsageCountBoundary(t,m,ctx);
   assert.ok(proof);
   assert.equal(proof.wrongPopulationInferenceThenCorrectionObserved,!fromCorrect);
   assert.equal(proof.observedPlanClickEvents,fromCorrect?1:2);
   assert.deepEqual(proof.observedFinalChoices,s.correct);
   assert.equal(proof.recordedSurveyResponsesObserved,false);
   assert.equal(proof.strictAApproved,false);
   assert.equal(proof.representativenessVerified,false);
   assert.equal(proof.causalInferenceVerified,false);
   assert.ok(proof.selectedEventUnitBoundary&&proof.selectedSupportedClaim);
   const record={attempts:[{value:native.initial(t)},{value:structuredClone(m)}]};
   assert.ok(submittedNativeUsageCountBoundary(t,m,record,ctx));
   assert.equal(submittedNativeUsageCountBoundary(t,m,{attempts:[{value:record.attempts[0].value}]},ctx),null);
  }
 });
 test('P006h fail closed on false claims, source substitution and forged events '+position,()=>{
  const t=sessionTaskFor(s.id,s.index),m=make(t,s),one=make(t,s,true);
  const before=native.initial(t);before.answers=s.correct.slice();before.answers[0]=s.wrong;
  native.act(t,before,'b19-plan');
  assert.equal(native.inspect(t,before).correct,false);
  assert.equal(replayNativeUsageCountBoundary(t,before,ctx),null);
  for(const context of [{sessionId:s.id,index:s.index+1},{sessionId:'bridge-'+s.id,index:s.index},
    {sessionId:'__proto__',index:s.index},{sessionId:s.id,index:'0'}])
   assert.equal(replayNativeUsageCountBoundary(t,m,context),null);
  for(const badTask of [{...t,prompt:t.prompt+'!'},
    {...t,choices:t.choices.slice().reverse()},
    {...t,draft:false},
    {...t,choices:t.choices.map((c,i)=>i===0?{...c,answer:s.wrong}:c)}])
   assert.equal(replayNativeUsageCountBoundary(badTask,m,ctx),null);
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
   assert.equal(replayNativeUsageCountBoundary(t,v,ctx),null,edit.toString());
  }
  const forged=structuredClone(one);forged.history.push(structuredClone(one.history[0]));
  assert.equal(replayNativeUsageCountBoundary(t,forged,ctx),null);
  const stale=structuredClone(m);stale.history[0].f.answers=s.correct.slice();
  assert.equal(replayNativeUsageCountBoundary(t,stale,ctx),null);
  const falseBoundary=structuredClone(m);
  falseBoundary.history[0].f.answers[1]='all';
  assert.equal(replayNativeUsageCountBoundary(t,falseBoundary,ctx),null);
  if(s.correct.length===3){const extra=structuredClone(m);
   extra.history[0].f.answers[2]='only';
   assert.equal(replayNativeUsageCountBoundary(t,extra,ctx),null);
  }
 });
}
