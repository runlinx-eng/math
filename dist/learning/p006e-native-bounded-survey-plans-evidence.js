// #342 P006e: bounded, observable B19 survey-plan selections; development-only.
// This module never grades free prose or upgrades formal strict-A coverage.
import * as native from './phase5/b19-model.js';
import {isEvidenceContext,matchesNativeEvidenceTask,latestSubmissionMatches,
 hasExactKeys as exact,sameEvidence as same} from './evidence-contract.js';

const choice=(key,label,options,answer)=>({key,label,options,answer});
const plan=(prompt,choices)=>({type:'x-dataplan',prompt,choices,draft:true});
const CASES=[
 {id:'studyplan',index:0,node:'mt_SHVyE1CLUa',
  task:plan('想知道一组人的上学日前夜睡多久，先把调查计划补清楚。',[
   choice('who','问谁',[['group','事先确定的这组人'],['change','只找答案符合猜想的人'],['all','把随手问到的几人写成所有人']],'group'),
   choice('when','问哪一晚',[['same','同一个上学日前夜'],['any','每人随便选一晚'],['unknown','不用记日期']],'same'),
   choice('how','怎样记',[['consistent','都记录入睡到起床时长，单位小时、精度一致'],['mix','有人记起床时刻，有人记时长'],['guess','根据精神好不好猜']],'consistent')]),
  claim:{cohort:'predefined-group',window:'one-same-school-night',
   measure:'sleep-duration-hours-consistent-precision'}},
 {id:'betterquestion',index:0,node:'mt_O-U263ukg1',
  task:plan('“孩子喜欢运动吗”太模糊。把对象、时间和要记录的量拼清楚。',[
   choice('who','对象',[['defined','这个事先确定的兴趣小组'],['any','随便某些人'],['world','所有孩子，实际只问朋友']],'defined'),
   choice('when','时间',[['week','上周一到周日'],['ever','从小到现在，凭感觉'],['none','不规定']],'week'),
   choice('value','记录什么',[['hours','参加有组织运动的总小时数，约到整小时'],['like','喜欢还是不喜欢'],['good','运动好不好']],'hours')]),
  claim:{cohort:'predefined-interest-group',window:'last-monday-through-sunday',
   measure:'organized-sport-hours-rounded-to-whole-hour'}}
];
const correct=(spec,answers)=>same(answers,spec.task.choices.map(x=>x.answer));
function original(spec,task,context){
 return !!spec&&matchesNativeEvidenceTask(task,context,{type:'x-dataplan',nodeId:spec.node})&&
  exact(task,Object.keys(spec.task))&&same(task,spec.task);
}
export function nativeBoundedSurveyPlanBinding(task,context={}){
 if(!isEvidenceContext(context))return null;
 const spec=CASES.find(s=>s.id===context.sessionId&&s.index===context.index);
 if(!original(spec,task,context))return null;
 return {position:spec.id+':'+spec.index,sourceNodeId:spec.node,
  choiceKeys:spec.task.choices.map(c=>c.key)};
}
export function replayNativeBoundedSurveyPlan(task,model,context={}){
 try{
  const binding=nativeBoundedSurveyPlanBinding(task,context);
  if(!binding||!model||!exact(model,[...Object.keys(native.fieldValues(task)),
      'board','history','issue'])||!exact(model.board,['first','saved'])||
     !exact(model.board.first,['plan'])||model.board.saved!==true||
     model.issue!==''||!Array.isArray(model.history)||
     model.history.length<1||model.history.length>2||
     !native.valid(task,model)||!native.inspect(task,model).correct)return null;
  const spec=CASES.find(s=>s.id===context.sessionId&&s.index===context.index);
  const defaults=native.fieldValues(task),fieldKeys=Object.keys(defaults);
  for(const e of model.history){
   if(!exact(e,['a','d','f'])||e.a!=='plan'||!exact(e.d,[])||
      !exact(e.f,fieldKeys)||!Array.isArray(e.f.answers)||
      e.f.answers.length!==task.choices.length||typeof e.f.draft!=='string'||
      !fieldKeys.every(k=>k==='answers'||k==='draft'||same(e.f[k],defaults[k])))return null;
   if(!e.f.answers.every((value,i)=>task.choices[i].options.some(option=>option[0]===value)))
      return null;
  }
  const first=model.history[0],last=model.history.at(-1);
  if(!same(model.board.first.plan,first.f)||
     !same(model.answers,last.f.answers)||!same(model.draft,last.f.draft)||
     !fieldKeys.every(k=>k==='answers'||k==='draft'||same(model[k],defaults[k]))||
     !correct(spec,last.f.answers)||
     (model.history.length===2&&correct(spec,first.f.answers)))return null;
  return {
   kind:'b19-native-bounded-survey-plan',
   originalPosition:binding.position,sourceNodeId:binding.sourceNodeId,
   observedChoiceKeys:binding.choiceKeys,
   observedFinalChoices:last.f.answers.slice(),
   observedPlanClickEvents:model.history.length,
   wrongPlanThenCorrectObserved:model.history.length===2,
   boundedPlanCommitments:{...spec.claim},
   originalFreeTextSavedWithoutSemanticAssessment:typeof model.draft==='string',
   recordedSurveyResponsesObserved:false,
   realParticipantIdentityVerified:false,
   representativenessAssessed:false,
   longTermMasteryAssessed:false,
   strictAApproved:false
  };
 }catch{return null;}
}
export function submittedNativeBoundedSurveyPlan(task,model,record,context={}){
 return latestSubmissionMatches(model,record)?
  replayNativeBoundedSurveyPlan(task,model,context):null;
}
