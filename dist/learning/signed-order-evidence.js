// #339: strict evidence for one source-frozen signed order, not an inferred B08 family.
// Only actual pick/remove chronology and final axis coordinates are observable.
import {signedOrderPreauditBinding,replaySignedOrderModel} from './signed-order-preaudit.js';

export function signedOrderBinding(task,context={}){
 const source=signedOrderPreauditBinding(task,context);
 return source?{nodeId:source.nodeId,kind:'signed-integer-order',method:null,
  question:'模拟负深度的三个数怎样严格从小到大排列？为什么数轴越往左表示数越小？'}:null;
}
export function replaySignedOrderEvidence(task,model,context={}){
 try{
  const source=signedOrderBinding(task,context);
  if(!source)return null;
  const proof=replaySignedOrderModel(task,model,context);
  if(!proof||proof.preReviewOnly!==true||proof.strictAApproved!==false||
   !proof.observedPickRemoveChronology||proof.observedSliderMotionChronology)return null;
  return {kind:'signed-integer-order',nodeId:source.nodeId,
   sessionId:context.sessionId,index:context.index,
   selectedOrder:[...proof.selectedOrder],
   recordedOperations:proof.operations.map(e=>({step:e.step,kind:e.kind,index:e.index,after:[...e.after]})),
   finalAxisPositions:proof.finalAxisPositions.map(p=>({...p})),
   strictIncreasingAxis:true,originalValuesToolProvided:true,simulatedDepthNotMeasured:true,
   pickRemoveChronologyObserved:true,sliderMovementChronologyObserved:false,
   independentComparisonStrategyAssessed:false,learnerMasteryAssessed:false,method:null};
 }catch{return null;}
}
