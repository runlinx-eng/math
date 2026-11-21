// #337: exactly three source-locked positive integer order tasks.
// A strict operation-and-position observation, not a test of mental methods.
import {positiveOrderPreauditBinding,replayPositiveOrderModel} from './positive-order-preaudit.js';

export function positiveOrderBinding(task,context={}){
 const source=positiveOrderPreauditBinding(task,context);
 return source?{nodeId:source.nodeId,kind:'positive-integer-order',method:null,
  question:'这些整数怎样依次从小到大排列？数轴上从左到右的位置为何也递增？'}:null;
}
export function replayPositiveOrderEvidence(task,model,context={}){
 try{
  const source=positiveOrderBinding(task,context);
  if(!source)return null;
  const proof=replayPositiveOrderModel(task,model,context);
  if(!proof||proof.preReviewOnly!==true||proof.strictAApproved!==false||
   !proof.pickRemoveChronologyObserved||proof.sliderMotionHistoryObserved)return null;
  return {kind:'positive-integer-order',nodeId:source.nodeId,
   sessionId:context.sessionId,index:context.index,
   selectedOrder:[...proof.selectedOrder],
   recordedOperations:proof.events.map(e=>({step:e.step,kind:e.kind,index:e.index,after:[...e.after]})),
   finalAxisPositions:proof.finalAxisPositions.map(p=>({...p})),
   strictIncreasingAxis:true,originalValuesToolProvided:true,
   pickRemoveChronologyObserved:true,sliderMovementChronologyObserved:false,
   independentComparisonStrategyAssessed:false,freeExplanationAssessed:false,
   learnerMasteryAssessed:false,method:null};
 }catch{return null;}
}
