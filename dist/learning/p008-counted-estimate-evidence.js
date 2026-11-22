// #342 P008 / B07 faces100:2. Independent count after a saved estimate.
// The original model stores the current selected set, not a tap chronology.
import * as native from './phase5/b07-model.js';
import {hasExactKeys,isEvidenceContext,sameEvidence,matchesNativeEvidenceTask,
 latestSubmissionMatches} from './evidence-contract.js';
const SOURCE=Object.freeze({
 sessionId:'faces100',index:2,nodeId:'mt_9L3NQqgqRd',
 type:'x-pvestimate',
 taskHash:'f91ef11e9fbb5347a2e646828b44dfe3e3f023faab83a9e168bf44a2928a10cd'
});
const TASK=Object.freeze({
 type:'x-pvestimate',n:38,
 prompt:'先估这堆大约多少，留下猜想。再一颗一颗标记，看看实际有多少。'
});
export const P008_COUNTED_ESTIMATE_SOURCE=SOURCE;
export function p008CountedEstimateBinding(task,context={}){
 if(!isEvidenceContext(context)||context.sessionId!==SOURCE.sessionId||context.index!==SOURCE.index||
    !sameEvidence(task,TASK)||!matchesNativeEvidenceTask(task,context,SOURCE))return null;
 return {position:'faces100:2',nodeId:SOURCE.nodeId,taskHash:SOURCE.taskHash,
  method:null,strictAApproved:false};
}
export function replayP008CountedEstimateEvidence(task,model,context={}){
 try{
  const source=p008CountedEstimateBinding(task,context);
  if(!source||!hasExactKeys(model,Object.keys(native.initial(task)))||
     !native.valid(task,model)||!native.inspect(task,model).correct||
     !Number.isInteger(model.guess)||model.guess!==model.committed||
     model.answer!==task.n||!Array.isArray(model.taps)||
     model.taps.length!==task.n)return null;
  const sorted=[...model.taps].sort((a,b)=>a-b);
  for(let i=0;i<task.n;i++)if(sorted[i]!==i)return null;
  return {kind:'p008-original-estimate-and-checked-set',source,
   savedEstimate:model.committed,countedTotal:task.n,finalSelectedDotIds:sorted,
   guessMayBeInaccurate:true,originalDotSelectionChronologyObserved:false,
   actualExternalObjectsCounted:false,freeExplanationAssessed:false,
   childrenMasteryAssessed:false,strictAApproved:false};
 }catch{return null;}
}
export function submittedP008CountedEstimateEvidence(task,model,record,context={}){
 return latestSubmissionMatches(model,record)?
  replayP008CountedEstimateEvidence(task,model,context):null;
}
