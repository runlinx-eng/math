// #342 P006g: original B19 neutral-question and consistent-response schema.
// Development only: original UI choices, not verified real survey outcomes or strict A.
import * as native from './phase5/b19-model.js';
import {isEvidenceContext,matchesNativeEvidenceTask,latestSubmissionMatches,
 hasExactKeys as exact,sameEvidence as same} from './evidence-contract.js';

const choice=(key,label,options,answer)=>({key,label,options,answer});
const plan=(prompt,choices)=>({type:'x-dataplan',prompt,choices,draft:true});
const CASES=[
 {id:'digitalstudy',index:1,node:'mt_yrvYKSwSRZ',
  task:plan('给本地小表单选问题与回答方式，看看问法会怎样影响记录。',[
   choice('question','问题怎样写？',[['neutral','在这些选项中，你目前最喜欢哪项运动？只选一项。'],['lead','足球最好玩，你也最喜欢足球吧？'],['double','你喜欢什么运动和什么食物？']],'neutral'),
   choice('answers','答案怎样安排？',[['cover','足球 / 游泳 / 羽毛球 / 其他'],['miss','只给足球一个选项'],['overlap','球类 / 足球 / 游泳']],'cover')]),
  wrong:'lead',boundary:'neutral-single-question-not-leading-or-double-barreled',
  next:'bounded-nonoverlapping-options-with-other'},
 {id:'ownstudy',index:1,node:'mt_Y6JmLjnfRP',
  task:plan('设计三题，要让每个人回答的是同一时间、同一单位。',[
   choice('hours','时长题',[['clear','昨天总共约几小时，按整小时记'],['vague','平时用得多吗？'],['lead','你昨天肯定用了太久吧？']],'clear'),
   choice('purpose','用途题',[['one','昨天最多用于什么，只选一项'],['two','喜欢游戏和运动吗？'],['none','替别人猜用途']],'one'),
   choice('device','设备题',[['one','昨天用得最多的设备，只选一项；没用可选未使用'],['none','不用问，按用途推断'],['only','只允许选手机']],'one')]),
  wrong:'vague',boundary:'same-yesterday-window-whole-hour-screen-time',
  next:'one-response-per-purpose-and-device-with-none-option'}
];
const correct=s=>s.task.choices.map(c=>c.answer);
function original(s,task,context){
 return !!s&&matchesNativeEvidenceTask(task,context,{type:'x-dataplan',nodeId:s.node})&&
  exact(task,Object.keys(s.task))&&same(task,s.task);
}
export function nativeQuestionSchemaBinding(task,context={}){
 if(!isEvidenceContext(context))return null;
 const s=CASES.find(x=>x.id===context.sessionId&&x.index===context.index);
 if(!original(s,task,context))return null;
 return {position:s.id+':'+s.index,sourceNodeId:s.node,
  choiceKeys:s.task.choices.map(c=>c.key)};
}
export function replayNativeQuestionSchema(task,model,context={}){
 try{
  const binding=nativeQuestionSchemaBinding(task,context);
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
  // Two clicks must show correction of only the first originally wrong choice.
  if(model.history.length===2&&
     (first.f.answers[0]!==s.wrong||!same(first.f.answers.slice(1),answers.slice(1))||
      first.f.draft!==last.f.draft))return null;
  if(model.history.length===1&&!same(first.f.answers,answers))return null;
  return {
   kind:'b19-native-question-schema-plan',
   originalPosition:binding.position,sourceNodeId:binding.sourceNodeId,
   observedChoiceKeys:binding.choiceKeys,observedFinalChoices:answers,
   observedPlanClickEvents:model.history.length,
   wrongPlanThenCorrectionObserved:model.history.length===2,
   selectedQuestionConstraint:s.boundary,selectedResponseSchema:s.next,
   selectedPlanIsAboutSimulatedRecords:true,
   originalFreeTextSavedWithoutSemanticAssessment:typeof model.draft==='string',
   recordedSurveyResponsesObserved:false,representativenessVerified:false,
   causalInferenceVerified:false,longTermMasteryAssessed:false,strictAApproved:false
  };
 }catch{return null;}
}
export function submittedNativeQuestionSchema(task,model,record,context={}){
 return latestSubmissionMatches(model,record)?
  replayNativeQuestionSchema(task,model,context):null;
}
