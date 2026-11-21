// Issue #339: source-bound signed integer order preaudit, NOT a registered strict A adapter.
// The original B08 grader, source task, State-v2 and all old saved models are untouched.
import * as original from './phase5/b08-model.js';
import {matchesNativeEvidenceTask,sameEvidence as same,latestSubmissionMatches,hasExactKeys as keys} from './evidence-contract.js';

const ID='tenmillion',INDEX=1,NODE='mt_XNmGwNggdU';
const VALUES=Object.freeze(['-8200','-7900','-9100']);
const isSignedInteger=s=>typeof s==='string'&&/^(0|-?[1-9]\d{0,14})$/.test(s);
const sourceFor=(task,context)=>{
 if(context?.sessionId!==ID||context?.index!==INDEX||
  !matchesNativeEvidenceTask(task,context,{type:'x-wideboard',nodeId:NODE})||
  task.mode!=='order'||!same(task.values,VALUES)||
  !VALUES.every(isSignedInteger)||task.min!==-10000||task.max!==0||
  task.gap||task.conversions||task.notation)return null;
 return {nodeId:NODE};
};
export function signedOrderPreauditBinding(task,context={}){
 return sourceFor(task,context)?{nodeId:NODE,preReviewOnly:true,strictAApproved:false,
  mathematicalClaim:'chronological-signed-order-and-final-axis-only'}:null;
}
export function replaySignedOrderModel(task,model,context={}){
 try{
  if(!sourceFor(task,context)||!original.valid(task,model)||!original.inspect(task,model).correct||
   !keys(model,Object.keys(original.initial(task)))||
   !Array.isArray(model.orderTrace)||model.orderTrace.length===0||model.orderTrace.length>512||
   model.orderTraceOverflow!==false)return null;
  const values=VALUES.map(BigInt),order=[],events=[];
  for(const [step,event] of model.orderTrace.entries()){
   if(!keys(event,['index','kind'])||!Number.isInteger(event.index)||
    event.index<0||event.index>=values.length)return null;
   const position=order.indexOf(event.index),kind=position<0?'pick':'remove';
   if(event.kind!==kind)return null;
   if(position<0)order.push(event.index);else order.splice(position,1);
   events.push({step,kind,index:event.index,after:[...order]});
  }
  if(!same(order,model.order)||order.length!==values.length)return null;
  const expected=values.map((value,index)=>({value,index}))
   .sort((a,b)=>a.value<b.value?-1:a.value>b.value?1:0).map(x=>x.index);
  if(!same(order,expected))return null;
  if(!model.touched.every(value=>value===true))return null;
  const axis=VALUES.map((value,index)=>{
   const ideal=(Number(value)-task.min)/(task.max-task.min)*1000;
   return {index,value,position:model.positions[index],error:Math.abs(model.positions[index]-ideal)};
  });
  if(axis.some(point=>point.error>6))return null;
  for(let i=1;i<order.length;i++)
   if(!(model.positions[order[i-1]]<model.positions[order[i]]))return null;
  return {preReviewOnly:true,strictAApproved:false,nodeId:NODE,
   sessionId:ID,index:INDEX,selectedOrder:order.map(i=>VALUES[i]),
   operations:events,finalAxisPositions:axis,observedPickRemoveChronology:true,
   observedSliderMotionChronology:false,independentComparisonStrategyAssessed:false,
   learnerUnderstandingAssessed:false};
 }catch{return null;}
}
export function replaySignedOrderPreaudit(task,model,record,context={}){
 return latestSubmissionMatches(model,record)?replaySignedOrderModel(task,model,context):null;
}
