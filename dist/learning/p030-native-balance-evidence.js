// #342 P030 exact original B05 balance/relationship tasks, three source positions.
// Ordered native release snapshots are saved; intervening bead clicks are not
// saved as a full independent history and must not be invented.
import * as b05 from './phase4/b05-model.js';
import {hasExactKeys,isEvidenceContext,matchesNativeEvidenceTask,
 sameEvidence,latestSubmissionMatches} from './evidence-contract.js';
const original=[
 {sessionId:'equality',index:0,nodeId:'mt_oIzycTBeE4',type:'x-balance',
 taskHash:'ad461f99ec9b9864a8a0640a3fb7c3f974da2eeca552569e7104eeec92d6b6ba',
 task:{type:'x-balance',left:'6',right:'6',l:6,r:6,
 prompt:'按两边数字分别放珠子。先猜天平会怎样，再松开支架。'}},
 {sessionId:'equality',index:1,nodeId:'mt_oIzycTBeE4',type:'x-balance',
 taskHash:'45c13e6a0991fca34273da692c9e81d8ec33aa487f5cf20c28a4d8094b073482',
 task:{type:'x-balance',left:'4 + 1',right:'5 + 2',l:5,r:7,
 prompt:'这次两边都是加法，但一样多吗？搭出来、先预测，再松开。'}},
 {sessionId:'equality',index:2,nodeId:'mt_oIzycTBeE4',type:'x-balance',
 taskHash:'23b489d4ffd0e44f95012b6e3868e234549400f9bc21a1cd441b3b6111e5edaa',
 task:{type:'x-balance',left:'5',right:'2 + 3',l:5,r:5,
 prompt:'“答案”在左边也能成立吗？用两盘珠子检查。'}}
];
export const P030_BALANCE_SOURCES=Object.freeze(original.map(({task,...s})=>
 Object.freeze({...s,position:s.sessionId+':'+s.index})));
function value(expr){
 if(typeof expr!=='string'||!/^\s*\d+\s*(?:\+\s*\d+\s*)?$/.test(expr))return null;
 const sum=expr.match(/\d+/g).map(Number);
 return sum.every(Number.isSafeInteger)?sum.reduce((a,b)=>a+b,0):null;
}
const direction=(a,b)=>a===b?'level':a>b?'left':'right';
export function p030BalanceBinding(task,context={}){
 if(!isEvidenceContext(context))return null;
 const src=original.find(x=>x.sessionId===context.sessionId&&x.index===context.index);
 if(!src||!sameEvidence(src.task,task)||!matchesNativeEvidenceTask(task,context,src))return null;
 return {position:src.sessionId+':'+src.index,nodeId:src.nodeId,
  type:src.type,taskHash:src.taskHash,method:null,
  question:'表达式的值如何决定天平左右，等号在什么条件下成立？',
  strictAApproved:false};
}
export function replayP030BalanceEvidence(task,model,context={}){
 try{
  const source=p030BalanceBinding(task,context);
  if(!source||!hasExactKeys(model,Object.keys(b05.initial(task)))||
    !b05.valid(task,model)||!b05.inspect(task,model).correct||
    value(task.left)!==task.l||value(task.right)!==task.r||
    model.left!==task.l||model.right!==task.r||!model.released||
    model.symbol!==(task.l===task.r?'equal':'different')||
    !Array.isArray(model.runs)||!model.runs.length)return null;
  const entries=[];
  for(const row of model.runs){
   if(!hasExactKeys(row,['left','right','guess'])||
      !Number.isInteger(row.left)||!Number.isInteger(row.right)||
      row.left<0||row.right<0||row.left>20||row.right>20||
      !['level','left','right'].includes(row.guess))return null;
   entries.push({left:row.left,right:row.right,guess:row.guess,
     mathematicalRelation:direction(row.left,row.right),
     predictedCorrectly:row.guess===direction(row.left,row.right)});
  }
  const last=entries.at(-1);
  if(last.left!==task.l||last.right!==task.r||
     last.guess!==direction(task.l,task.r)||model.guess!==last.guess)return null;
  return {kind:'p030-original-balance-expression-and-releases',source,
   originalLeftExpression:task.left,originalRightExpression:task.right,
   independentlyCalculatedLeft:task.l,independentlyCalculatedRight:task.r,
   mathematicalRelation:direction(task.l,task.r),
   observedOrderedOriginalReleaseSnapshots:entries,
   observedFinalEqualitySymbol:model.symbol,
   individualBeadClickChronologyObserved:false,
   childReasoningExplanationAssessed:false,childrenMasteryAssessed:false,
   strictAApproved:false};
 }catch{return null;}
}
export function submittedP030BalanceEvidence(task,model,record,context={}){
 return latestSubmissionMatches(model,record)?replayP030BalanceEvidence(task,model,context):null;
}
