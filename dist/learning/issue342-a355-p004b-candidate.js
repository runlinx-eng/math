// #342 P004b exact original task SHA-256 retrieved from successful CI run 44869743089.
// Native Node and Chromium both independently printed 31cc026...; no type/sibling widening.
import * as p004b from './p004b-quadrilateral-nesting-evidence.js';
const source=Object.freeze({position:'quadsort:3',sessionId:'quadsort',index:3,type:'x-s23-nest',nodeId:'mt_Xt1cRqaBOW',taskHash:'31cc0267773b61a7cff693870b0b13c4d69a68449f2b8113f5085c291b69c117'});
export const ISSUE342_A_P004B_ADAPTERS=Object.freeze([Object.freeze({
 id:'issue341-A-P004B',types:Object.freeze([source.type]),sources:Object.freeze([source]),
 replay:p004b.replayQuadrilateralNestingEvidence,
 submitted:p004b.submittedQuadrilateralNestingEvidence,
 binding:(task,context)=>{
  if(context?.sessionId!==source.sessionId||context.index!==source.index||task?.type!==source.type)return null;
  const b=p004b.quadrilateralNestingBinding(task,context);
  if(!b||b.method!=null||(b.nodeId??b.sourceNodeId)!==source.nodeId)return null;
  return Object.freeze({...b,nodeId:source.nodeId,method:null,candidateSource:source,strictAApproved:false,
   question:typeof b.question==='string'&&b.question?b.question:'哪些原生排序操作和 Check 支持四边形包含关系？'});
 }
})]);
