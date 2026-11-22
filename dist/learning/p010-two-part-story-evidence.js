// P010 represent:0/1. Strict final diagram and equation replay; source locked.
// No chronology, explanation assessment or formal-A credit is claimed.
import * as b05 from './phase4/b05-model.js';
import {hasExactKeys,isEvidenceContext,matchesNativeEvidenceTask,
 sameEvidence,latestSubmissionMatches} from './evidence-contract.js';
const src=[
 {sessionId:'represent',index:0,nodeId:'mt_EBYGhd8X3x',type:'x-story',
 taskHash:'0074242ad699e501c74fb71e7843f6d157abb8e6935e1b865e0f3d70264a4f84',
 task:{type:'x-story',a:14,b:5,total:19,story:'原来有 14 张贴纸，又得到 5 张，一共有多少？',prompt:'搭出两部分和整体，再把同一件事写成算式。'}},
 {sessionId:'represent',index:1,nodeId:'mt_EBYGhd8X3x',type:'x-story',
 taskHash:'662a010e349e7f863ef33d4b6c537e7677c7a6e465b257f91a0747df49bb2233',
 task:{type:'x-story',a:6,b:4,total:10,missing:true,story:'一共有 10 个苹果，6 个是红的，其余是绿的。绿色有几个？',prompt:'先认出哪个数是整体，再搭图；写一个能求绿色数量的算式。'}}
];
export const P010_TWO_PART_SOURCES=Object.freeze(src.map(({task,...r})=>Object.freeze({...r,position:r.sessionId+':'+r.index})));
export function p010TwoPartBinding(task,context={}){
 if(!isEvidenceContext(context))return null;
 const row=src.find(s=>s.sessionId===context.sessionId&&s.index===context.index);
 if(!row||!sameEvidence(task,row.task)||!matchesNativeEvidenceTask(task,context,row))return null;
 return {position:row.sessionId+':'+row.index,nodeId:row.nodeId,type:row.type,
  taskHash:row.taskHash,method:null,question:'故事里的整体和部分，怎样对应算式？',
  strictAApproved:false};
}
export function replayP010TwoPartEvidence(task,model,context={}){
 try{
  const source=p010TwoPartBinding(task,context);
  if(!source||!hasExactKeys(model,Object.keys(b05.initial(task)))||
    !b05.valid(task,model)||!b05.inspect(task,model).correct||
    !Number.isSafeInteger(task.a)||!Number.isSafeInteger(task.b)||
    task.a<0||task.b<0||task.a+task.b!==task.total||
    model.a!==task.a||model.b!==task.b||model.total!==task.total||
    model.whole!=='total'||model.role!==(task.missing?'known-part':'new-part')||
    ![model.first,model.second,model.result].every(Number.isSafeInteger))return null;
  const sum=model.op==='plus'&&model.first+model.second===model.result&&
    model.result===task.total&&
    (model.first===task.a&&model.second===task.b||
     model.first===task.b&&model.second===task.a);
  const difference=!!task.missing&&model.op==='minus'&&model.first===task.total&&
    model.second===task.a&&model.result===task.b&&
    model.first-model.second===model.result;
  if(!sum&&!difference)return null;
  return {kind:'p010-two-part-original-final-story-math',source,
   originalMissingPart:!!task.missing,diagram:[model.a,model.b],
   whole:task.a+task.b,equation:{a:model.first,op:model.op,b:model.second,result:model.result},
   historicalOrderObserved:false,independentFreeExplanationObserved:false,
   childMasteryAssessed:false,strictAApproved:false};
 }catch{return null;}
}
export function submittedP010TwoPartEvidence(task,model,record,context={}){
 return latestSubmissionMatches(model,record)?replayP010TwoPartEvidence(task,model,context):null;
}
