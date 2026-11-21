// #342 P006f: native B19 inference boundaries and justified next collection steps.
// Development only: original UI choices, not verified real survey outcomes or strict A.
import * as native from './phase5/b19-model.js';
import {isEvidenceContext,matchesNativeEvidenceTask,latestSubmissionMatches,
 hasExactKeys as exact,sameEvidence as same} from './evidence-contract.js';

const choice=(key,label,options,answer)=>({key,label,options,answer});
const plan=(prompt,choices)=>({type:'x-dataplan',prompt,choices,draft:true});
const CASES=[
 {id:'studyplan',index:2,node:'mt_SHVyE1CLUa',
  task:plan('图表支持的结论，也有自己的边界。给这次小调查留下一条限制和下一步。',[
   choice('limit','哪条限制与这份记录有关？',[['sample','只记录这一小组和一晚，未必代表其他人或其他晚上'],['none','画过图就没有限制'],['colour','图的颜色不够多']],'sample'),
   choice('next','下一次怎样改进？',[['repeat','保留同样问法，换几晚再次记录并比较'],['erase','删掉不符合猜想的回答'],['rename','只换图的名字']],'repeat')]),
  wrong:'none',boundary:'one-group-one-night-not-generalizable',
  next:'repeat-same-method-on-other-nights'},
 {id:'betterquestion',index:2,node:'mt_O-U263ukg1',
  task:plan('如果只问同一支球队的朋友，下一步怎样改善？',[
   choice('limit','目前的限制',[['selection','来自同一球队，可能偏向爱运动的人'],['none','10人已经代表所有孩子'],['plot','必须换成3D图才可靠']],'selection'),
   choice('improve','下一步',[['wider','明确目标人群，从更多不同小组按同一方法收集'],['delete','去掉运动最少的回答'],['repeat','只把同一组数据复制几遍']],'wider')]),
  wrong:'none',boundary:'teammate-selection-not-representative',
  next:'collect-more-groups-with-same-method'}
];
const correct=s=>s.task.choices.map(c=>c.answer);
function original(s,task,context){
 return !!s&&matchesNativeEvidenceTask(task,context,{type:'x-dataplan',nodeId:s.node})&&
  exact(task,Object.keys(s.task))&&same(task,s.task);
}
export function nativeInferenceBoundaryBinding(task,context={}){
 if(!isEvidenceContext(context))return null;
 const s=CASES.find(x=>x.id===context.sessionId&&x.index===context.index);
 if(!original(s,task,context))return null;
 return {position:s.id+':'+s.index,sourceNodeId:s.node,
  choiceKeys:s.task.choices.map(c=>c.key)};
}
export function replayNativeInferenceBoundary(task,model,context={}){
 try{
  const binding=nativeInferenceBoundaryBinding(task,context);
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
   kind:'b19-native-inference-boundary-plan',
   originalPosition:binding.position,sourceNodeId:binding.sourceNodeId,
   observedChoiceKeys:binding.choiceKeys,observedFinalChoices:answers,
   observedPlanClickEvents:model.history.length,
   wrongInferenceThenCorrectionObserved:model.history.length===2,
   selectedLimitation:s.boundary,selectedImprovement:s.next,
   selectedPlanIsAboutSimulatedRecords:true,
   originalFreeTextSavedWithoutSemanticAssessment:typeof model.draft==='string',
   recordedSurveyResponsesObserved:false,representativenessVerified:false,
   causalInferenceVerified:false,longTermMasteryAssessed:false,strictAApproved:false
  };
 }catch{return null;}
}
export function submittedNativeInferenceBoundary(task,model,record,context={}){
 return latestSubmissionMatches(model,record)?
  replayNativeInferenceBoundary(task,model,context):null;
}
