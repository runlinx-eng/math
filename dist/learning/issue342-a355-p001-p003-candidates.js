// #342 A line P001-P003 reusable exact-source adapters, inert until manifest admission.
// Four independently original-node-and-SHA-checked positions; no sibling/type expansion.
import * as m0 from './gridarea-perimeter-contrast-evidence.js';
import * as m1 from './p002-wide-order-gap-evidence.js';
import * as m2 from './p003-rulejump-equivalent-evidence.js';
const frozen=Object.freeze([
 {id:"issue341-A-P001",types:Object.freeze(["x-a30-grid"]),sources:Object.freeze([{"sessionId":"gridarea","index":2,"nodeId":"mt_6xNmQLzuqm","type":"x-a30-grid","taskHash":"79cadc478abf5d9d742c2ff5cd2cb0f090cbbbef9dcd21bc34d5451a1900997f","position":"gridarea:2"}].map(Object.freeze)),binding:m0.gridareaPerimeterContrastBinding,replay:m0.replayGridareaPerimeterContrastEvidence,submitted:m0.submittedGridareaPerimeterContrastEvidence},
 {id:"issue341-A-P002",types:Object.freeze(["x-wideboard"]),sources:Object.freeze([{"sessionId":"placeproblems","index":1,"nodeId":"mt__sMrmOv3bx","type":"x-wideboard","taskHash":"fe801fed3d8193d295850adbb8d19aacbdb0c33aee17f0de07f849849b04f1a2","position":"placeproblems:1"},{"sessionId":"bigproblems","index":2,"nodeId":"mt_xMt1TLTs--","type":"x-wideboard","taskHash":"7a40c552e48ec98d9918c0eefa90dbb10e81ee3efa896710531eeee20fb6205f","position":"bigproblems:2"}].map(Object.freeze)),binding:m1.wideOrderGapBinding,replay:m1.replayWideOrderGapEvidence,submitted:m1.submittedWideOrderGapEvidence},
 {id:"issue341-A-P003",types:Object.freeze(["x-rulejump"]),sources:Object.freeze([{"sessionId":"percentpatterns","index":0,"nodeId":"mt_jCy07DyBNU","type":"x-rulejump","taskHash":"860ef4c64b8993c38591ccf90ddf032c3e9aaa789f8a10e459b2362757436fce","position":"percentpatterns:0"}].map(Object.freeze)),binding:m2.rulejumpEquivalentBinding,replay:m2.replayRulejumpEquivalentEvidence,submitted:m2.submittedRulejumpEquivalentEvidence}
]);
const key=(s,i)=>JSON.stringify([s,i]);
const all=new Set();
export const ISSUE342_A_P001_P003_ADAPTERS=Object.freeze(frozen.map(f=>{
 const selected=new Map(f.sources.map(s=>[key(s.sessionId,s.index),s]));
 for(const row of f.sources){
  const k=key(row.sessionId,row.index);
  if(all.has(k)||!/^[0-9a-f]{64}$/.test(row.taskHash))throw Error('P001-P003 invalid original source');
  all.add(k);
 }
 return Object.freeze({...f,binding:(task,context)=>{
  if(typeof context?.sessionId!=='string'||!Number.isSafeInteger(context.index))return null;
  const src=selected.get(key(context.sessionId,context.index));
  if(!src||task?.type!==src.type)return null;
  const old=f.binding(task,context);
  if(!old||old.method!=null||(old.nodeId??old.sourceNodeId)!==src.nodeId)return null;
  return Object.freeze({...old,nodeId:src.nodeId,method:null,
   question:typeof old.question==='string'&&old.question?old.question:
    '哪些保存的原生操作和 Check 支持这次结果？',
   candidateSource:src,strictAApproved:false});
 }});
}));
if(ISSUE342_A_P001_P003_ADAPTERS.length!==3||all.size!==4)throw Error('Unexpected A355 P001-P003 scope');
