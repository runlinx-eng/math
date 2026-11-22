// #342 P038 original B05 x-unknown: three exact source-locked equation cards.
// Evidence is bounded to recorded box, written value, Check and verification flag.
// The model has no action chronology; do not infer a child's full strategy.
import * as b05 from './phase4/b05-model.js';
import {hasExactKeys,isEvidenceContext,matchesNativeEvidenceTask,
 sameEvidence,latestSubmissionMatches} from './evidence-contract.js';
const frozen=[
 {sessionId:'unknown',index:0,type:'x-unknown',nodeId:'mt_3JgrHY221M',
  taskHash:'2c65bdae041f711e997f7989a473a67b8545bc356b010c0bf69fd2349925b49c',
  task:{type:'x-unknown',mode:'add',answer:3,label:'8 + □ = 11',
   prompt:'向空盒里增减珠子，让 8 加上它与 11 一样多。'}},
 {sessionId:'unknown',index:1,type:'x-unknown',nodeId:'mt_3JgrHY221M',
  taskHash:'0d2fc3d888639123548ca6a5dc12516bc7725701d1788a667d1347a068d16f14',
  task:{type:'x-unknown',mode:'subtract',answer:8,label:'5 = □ − 3',
   prompt:'空盒拿走三颗后要剩五颗。调好空盒，再代回原式。'}},
 {sessionId:'unknown',index:2,type:'x-unknown',nodeId:'mt_3JgrHY221M',
  taskHash:'4e7dce98935252e387f08d9c9d4425dc49f35322f361ee9e23c0fafc1b185eca',
  task:{type:'x-unknown',mode:'sum',answer:12,label:'6 + 6 = □',
   prompt:'空盒在右边。这次让它与六加六一样多。'}}
];
export const P038_UNKNOWN_SOURCES=Object.freeze(frozen.map(({task,...source})=>Object.freeze(
 {...source,position:source.sessionId+':'+source.index})));
export function p038UnknownBinding(task,context={}){
 if(!isEvidenceContext(context))return null;
 const source=frozen.find(x=>x.sessionId===context.sessionId&&x.index===context.index);
 if(!source||!sameEvidence(source.task,task)||!matchesNativeEvidenceTask(task,context,source))return null;
 return {position:source.sessionId+':'+source.index,nodeId:source.nodeId,type:source.type,
  taskHash:source.taskHash,method:null,question:'把空盒的数量代回原等式，两边真相等吗？',
  strictAApproved:false};
}
function sameEquation(task,box){
 if(!Number.isSafeInteger(box)||box<0||box>20)return false;
 switch(task.mode){
  case'add':return task.label==='8 + □ = 11'&&8+box===11;
  case'subtract':return task.label==='5 = □ − 3'&&5===box-3;
  case'sum':return task.label==='6 + 6 = □'&&6+6===box;
  default:return false;
 }
}
export function replayP038UnknownEvidence(task,model,context={}){
 try{
  const source=p038UnknownBinding(task,context);
  if(!source||!hasExactKeys(model,Object.keys(b05.initial(task)))||
   !b05.valid(task,model)||!b05.inspect(task,model).correct||
   model.checked!==true||model.written!==model.box||
   !sameEquation(task,model.box)||model.box!==task.answer)return null;
  return {kind:'p038-native-unknown-equation-current-substitution',source,
   observedBoxValue:model.box,independentOriginalEquationValue:true,
   originalNativeCheckPassed:true,
   substitutionButtonFlagObserved:true,actionChronologyObserved:false,
   spokenEquationProofAssessed:false,childrenMasteryAssessed:false,
   strictAApproved:false};
 }catch{return null;}
}
export function submittedP038UnknownEvidence(task,model,record,context={}){
 return latestSubmissionMatches(model,record)?
  replayP038UnknownEvidence(task,model,context):null;
}
