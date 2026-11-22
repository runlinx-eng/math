// #342 P006h: native B19 distinction between usage event counts and unique people.
// Development only: original UI choices, not verified real participants or strict A.
import * as native from './phase5/b19-model.js';
import {isEvidenceContext,matchesNativeEvidenceTask,latestSubmissionMatches,
 hasExactKeys as exact,sameEvidence as same} from './evidence-contract.js';

const choice=(key,label,options,answer)=>({key,label,options,answer});
const plan=(prompt,choices)=>({type:'x-dataplan',prompt,choices});
const CASES=[
 {id:'playgroundstudy',index:2,node:'mt_kxeuXm6EyC',
  task:plan('三天共记录12次使用。先别把“次数”改成“人数”。',[
   choice('unit','12表示什么？',[['visits','12次使用'],['people','12个不同的人'],['days','12天']],'visits'),
   choice('claim','这些记录能回答什么？',[['recorded','这三天记录里，哪种器材使用次数最多'],['all','全国孩子最喜欢什么'],['unique','有多少不同的人来过']],'recorded')]),
  wrong:'people',boundary:'twelve-usage-events-not-twelve-unique-people',
  next:'compare-usage-frequency-within-three-day-simulated-records'}
];
const correct=s=>s.task.choices.map(c=>c.answer);
function original(s,task,context){
 return !!s&&matchesNativeEvidenceTask(task,context,{type:'x-dataplan',nodeId:s.node})&&
  exact(task,Object.keys(s.task))&&same(task,s.task);
}
export function nativeUsageCountBoundaryBinding(task,context={}){
 if(!isEvidenceContext(context))return null;
 const s=CASES.find(x=>x.id===context.sessionId&&x.index===context.index);
 if(!original(s,task,context))return null;
 return {position:s.id+':'+s.index,sourceNodeId:s.node,
  choiceKeys:s.task.choices.map(c=>c.key)};
}
export function replayNativeUsageCountBoundary(task,model,context={}){
 try{
  const binding=nativeUsageCountBoundaryBinding(task,context);
  if(!binding||!model)return null;
  const defaults=native.fieldValues(task),fieldKeys=Object.keys(defaults);
  if(!exact(model,[...fieldKeys,'board','history','issue'])||
     !exact(model.board,['first','saved'])||!exact(model.board.first,['plan'])||
     model.board.saved!==true||model.issue!==''||
     !Array.isArray(model.history)||model.history.length<1||model.history.length>2||
     !native.valid(task,model)||!native.inspect(task,model).correct)return null;
  const s=CASES.find(x=>x.id===context.sessionId&&x.index===context.index);
  for(const e of model.history){
   if(!exact(e,['a','d','f'])||e.a!=='plan'||!exact(e.d,[])||
      !exact(e.f,fieldKeys)||!Array.isArray(e.f.answers)||
      e.f.answers.length!==task.choices.length||typeof e.f.draft!=='string'||
      !fieldKeys.every(k=>k==='answers'||k==='draft'||same(e.f[k],defaults[k])))return null;
   if(!e.f.answers.every((value,i)=>task.choices[i].options.some(option=>option[0]===value)))
     return null;
  }
  const first=model.history[0],last=model.history.at(-1),answers=correct(s);
  if(!same(model.board.first.plan,first.f)||
     !same(model.answers,last.f.answers)||!same(model.draft,last.f.draft)||
     !fieldKeys.every(k=>k==='answers'||k==='draft'||same(model[k],defaults[k]))||
     !same(last.f.answers,answers))return null;
  // Two clicks certify correction of a wrong inference, not an arbitrary edit history.
  if(model.history.length===2&&
     (first.f.answers[0]!==s.wrong||first.f.answers[1]!==answers[1]||
      first.f.draft!==last.f.draft))return null;
  if(model.history.length===1&&!same(first.f.answers,answers))return null;
  return {
   kind:'b19-native-usage-versus-people-plan',
   originalPosition:binding.position,sourceNodeId:binding.sourceNodeId,
   observedChoiceKeys:binding.choiceKeys,observedFinalChoices:answers,
   observedPlanClickEvents:model.history.length,
   wrongPopulationInferenceThenCorrectionObserved:model.history.length===2,
   selectedEventUnitBoundary:s.boundary,selectedSupportedClaim:s.next,
   selectedPlanIsAboutSimulatedRecords:true,
   originalFreeTextSavedWithoutSemanticAssessment:typeof model.draft==='string',
   recordedSurveyResponsesObserved:false,distinctPeopleCountKnown:false,representativenessVerified:false,
   causalInferenceVerified:false,longTermMasteryAssessed:false,strictAApproved:false
  };
 }catch{return null;}
}
export function submittedNativeUsageCountBoundary(task,model,record,context={}){
 return latestSubmissionMatches(model,record)?
  replayNativeUsageCountBoundary(task,model,context):null;
}
