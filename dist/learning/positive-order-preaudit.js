// Issue #337: prospective Q07 B08 card-order source audit, NOT an approved A adapter.
// A saved final order alone cannot prove a pick/remove chronology. Existing saved
// models without orderTrace remain valid with the original grader but yield no proof.
import * as original from './phase5/b08-model.js';
import {matchesNativeEvidenceTask,sameEvidence as same,latestSubmissionMatches,hasExactKeys as keys} from './evidence-contract.js';

const SOURCES=Object.freeze({
 'bigcompare:2':{nodeId:'mt_MHaiUd2FLA',values:['7310','7031','999','10000']},
 'sixdigits:2':{nodeId:'mt_JwP9QFv6gQ',values:['508301','580301','503801','583010']},
 'millionwords:1':{nodeId:'mt_Gag_h98jWP',values:['7045200','7450200','7042500','7405200']}
});
const integerText=s=>typeof s==='string'&&/^(0|[1-9]\d{0,14})$/.test(s);
const valuesEqual=(a,b)=>Array.isArray(a)&&same(a,b);
function sourceFor(t,context){
 if(!context||typeof context.sessionId!=='string'||!Number.isInteger(context.index))return null;
 const s=SOURCES[context.sessionId+':'+context.index];
 if(!s||!matchesNativeEvidenceTask(t,context,{type:'x-wideboard',nodeId:s.nodeId})||
   t.mode!=='order'||!valuesEqual(t.values,s.values)||
   !s.values.every(integerText)||!Number.isSafeInteger(t.min)||!Number.isSafeInteger(t.max)||
   !(t.max>t.min)||t.conversions||t.gap||t.notation)return null;
 return s;
}
export function positiveOrderPreauditBinding(task,context={}){
 const source=sourceFor(task,context);
 return source?{nodeId:source.nodeId,preReviewOnly:true,strictAApproved:false,
   mathematicalClaim:'learner-selected-positive-integer-card-order-only'}:null;
}
export function replayPositiveOrderPreaudit(task,model,record,context={}){
 try{
  const source=sourceFor(task,context);
  if(!source||!record||!latestSubmissionMatches(model,record)||
    !original.valid(task,model)||!original.inspect(task,model).correct||
    !Array.isArray(model.orderTrace)||!model.orderTrace.length||model.orderTrace.length>512||
    model.orderTraceOverflow!==false)return null;
  const expected=Object.keys(original.initial(task)).sort();
  if(!keys(model,expected))return null;
  const order=[],timeline=[],numbers=source.values.map(BigInt);
  for(let step=0;step<model.orderTrace.length;step++){
   const event=model.orderTrace[step];
   if(!keys(event,['index','kind'])||!Number.isInteger(event.index)||
      event.index<0||event.index>=numbers.length)return null;
   const old=order.indexOf(event.index),kind=old<0?'pick':'remove';
   if(event.kind!==kind)return null;
   if(old<0)order.push(event.index);else order.splice(old,1);
   timeline.push({step,kind,index:event.index,after:[...order]});
  }
  if(!same(order,model.order)||order.length!==numbers.length)return null;
  for(let i=1;i<order.length;i++)if(numbers[order[i-1]]>=numbers[order[i]])return null;
  const expectedOrder=numbers.map((n,i)=>({n,i})).sort((a,b)=>a.n<b.n?-1:a.n>b.n?1:0).map(x=>x.i);
  if(!same(order,expectedOrder))return null;
  if(!model.touched.every(value=>value===true))return null;
  // Positions are final-state observations, not a timeline of slider movements.
  const points=source.values.map((value,i)=>{
   const ideal=(Number(value)-task.min)/(task.max-task.min)*1000;
   return {index:i,value,position:model.positions[i],finalPositionError:Math.abs(model.positions[i]-ideal)};
  });
  if(points.some(p=>p.finalPositionError>6))return null;
  return {preReviewOnly:true,strictAApproved:false,nodeId:source.nodeId,
   sessionId:context.sessionId,index:context.index,
   mathematicalInvariant:'ascending-distinct-positive-integer-card-values',
   selectedOrder:order.map(i=>source.values[i]),events:timeline,
   finalAxisPositions:points,sliderMotionHistoryObserved:false,
   pickRemoveChronologyObserved:true,independentStrategyAssessed:false,
   learnerUnderstandingAssessed:false};
 }catch{return null;}
}
