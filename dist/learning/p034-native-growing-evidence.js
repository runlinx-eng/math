// #342 P034: exact three original native B05 fixed-step sequences.
// Final six values and committed (if present) tower forecast are observable;
// original UI does NOT store full chronological growth gestures.
import * as b05 from './phase4/b05-model.js';
import {hasExactKeys,isEvidenceContext,matchesNativeEvidenceTask,
 sameEvidence,latestSubmissionMatches} from './evidence-contract.js';
const frozen=[
 {sessionId:'growing',index:0,type:'x-grow',nodeId:'mt_W3VOAuFwVw',
 taskHash:'a1e23093ed896756f037d6ffef05e1dd4b4bede91c87665b9f05807f379ce6cf',
 task:{type:'x-grow',values:[5,8,11,14,17,20],known:4,
 prompt:'约定每次增加相同数量：5、8、11、14。记录从哪里开始、每次增加多少，再补出后两项。'}},
 {sessionId:'growing',index:1,type:'x-grow',nodeId:'mt_W3VOAuFwVw',
 taskHash:'a39b4d7f52ce7e993175620f2db4b81e6262b0cd65de92a5497dc514e57aa85f',
 task:{type:'x-grow',values:[40,35,30,25,20,15],known:0,given:[0,1,3,5],
 prompt:'约定每次减少相同数量：40、35、空格、25、空格、15。用负号记录每次变化，并补齐。'}},
 {sessionId:'growing',index:2,type:'x-grow',nodeId:'mt_W3VOAuFwVw',
 taskHash:'e56b3fc788c6f820b5ebac70b9146d8d14a93adb9261cc5050946384226f3e35',
 task:{type:'x-grow',values:[2,4,6,8,10,12],known:3,towers:true,
 prompt:'前三座塔每次多两块。先预测第六座有几块，再把后面三座搭出来。'}}
];
export const P034_GROWING_SOURCES=Object.freeze(frozen.map(({task,...x})=>Object.freeze(
 {...x,position:x.sessionId+':'+x.index})));
export function p034GrowingBinding(task,context={}){
 if(!isEvidenceContext(context))return null;
 const src=frozen.find(s=>s.sessionId===context.sessionId&&s.index===context.index);
 if(!src||!sameEvidence(task,src.task)||!matchesNativeEvidenceTask(task,context,src))return null;
 return {position:src.sessionId+':'+src.index,type:src.type,nodeId:src.nodeId,taskHash:src.taskHash,
  question:'从起点每次加或减相同步长，六项数值是否逐项对上？',
  method:null,strictAApproved:false};
}
export function replayP034GrowingEvidence(task,model,context={}){
 try{
  const source=p034GrowingBinding(task,context);
  if(!source||!hasExactKeys(model,Object.keys(b05.initial(task)))||
    !b05.valid(task,model)||!b05.inspect(task,model).correct||
    !Array.isArray(task.values)||task.values.length!==6||
    !Array.isArray(model.heights)||model.heights.length!==6||
    !model.heights.every(Number.isSafeInteger)||model.heights.some(v=>v<0||v>60)||
    model.start!==task.values[0]||typeof model.step!=='string')return null;
  const first=task.values[0],step=task.values[1]-task.values[0];
  if(!Number.isSafeInteger(step)||step===0||model.step.trim()!==String(step))return null;
  for(let i=0;i<6;i++){
   if(model.heights[i]!==first+i*step||task.values[i]!==first+i*step)return null;
  }
  if(task.towers){
   if(model.committed===null||!Number.isSafeInteger(model.prediction)||
      model.committed!==model.prediction)return null;
  }else if(model.committed!==null||model.prediction!==null)return null;
  return {kind:'p034-original-fixed-step-sequence-final-terms',source,
   originalFixedStart:first,independentlyCalculatedStep:step,
   observedSixTerms:[...model.heights],fifthDeltaIsNotSixthTerm:true,
   committedTowerPrediction:task.towers?model.committed:null,
   actualPredictionTimingObserved:false,fullActionHistoryObserved:false,
   freePatternProofAssessed:false,childrenMasteryAssessed:false,strictAApproved:false};
 }catch{return null;}
}
export function submittedP034GrowingEvidence(task,model,record,context={}){
 return latestSubmissionMatches(model,record)?
  replayP034GrowingEvidence(task,model,context):null;
}
