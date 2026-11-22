// #342 A258 first 33, four independent native contracts.
// None is enabled merely by being in this family inventory. The formal manifest
// must name the exact original (sessionId,index,nodeId,type,taskHash).
import * as roundwork from './p008-native-roundwork-evidence.js';
import * as count from './p008-counted-estimate-evidence.js';
import * as story from './p010-two-part-story-evidence.js';
import * as bounds from './p041-native-bound-interval-evidence.js';

const families=[
 {id:'issue341-A-P008R',group:'P008',sources:roundwork.P008_ROUNDWORK_SOURCES,
  binding:roundwork.p008RoundworkBinding,replay:roundwork.replayP008RoundworkEvidence,
  submitted:roundwork.submittedP008RoundworkEvidence},
 {id:'issue341-A-P008E',group:'P008',sources:[count.P008_COUNTED_ESTIMATE_SOURCE],
  binding:count.p008CountedEstimateBinding,replay:count.replayP008CountedEstimateEvidence,
  submitted:count.submittedP008CountedEstimateEvidence},
 {id:'issue341-A-P010R',group:'P010',sources:story.P010_TWO_PART_SOURCES,
  binding:story.p010TwoPartBinding,replay:story.replayP010TwoPartEvidence,
  submitted:story.submittedP010TwoPartEvidence},
 {id:'issue341-A-P041B',group:'P041',sources:bounds.P041_BOUND_SOURCES,
  binding:bounds.p041BoundBinding,replay:bounds.replayP041BoundEvidence,
  submitted:bounds.submittedP041BoundEvidence}
];
const key=(sid,index)=>JSON.stringify([sid,index]);
const seen=new Set();
export const ISSUE342_A_FIRST33_ADAPTERS=Object.freeze(families.map(family=>{
 const sources=Object.freeze(family.sources.map(original=>{
  const src=Object.freeze({
   position:original.sessionId+':'+original.index,sessionId:original.sessionId,
   index:original.index,nodeId:original.nodeId,type:original.type,
   taskHash:original.taskHash
  });
  const k=key(src.sessionId,src.index);
  if(seen.has(k)||typeof src.sessionId!=='string'||
     !Number.isInteger(src.index)||src.index<0||
     !/^mt_[A-Za-z0-9_-]+$/.test(src.nodeId)||
     !/^[0-9a-f]{64}$/.test(src.taskHash))throw Error('P008/P010/P041 duplicate/bad source '+k);
  seen.add(k);return src;
 }));
 const exact=new Map(sources.map(s=>[key(s.sessionId,s.index),s]));
 const types=Object.freeze([...new Set(sources.map(s=>s.type))]);
 return Object.freeze({id:family.id,group:family.group,types,sources,
  replay:family.replay,submitted:family.submitted,
  binding:(task,context)=>{
   if(typeof context?.sessionId!=='string'||!Number.isInteger(context.index))return null;
   const src=exact.get(key(context.sessionId,context.index));
   if(!src||task?.type!==src.type)return null;
   const found=family.binding(task,context);
   if(!found||found.nodeId!==src.nodeId||found.taskHash!==src.taskHash||
      found.type!==undefined&&found.type!==src.type)return null;
   return Object.freeze({...found,nodeId:src.nodeId,method:null,
    candidateSource:src,
    question:found.question||'这次保存的原生操作和数学结果，分别支持哪些结论？',
    strictAApproved:false});
  }
 });
}));
if(ISSUE342_A_FIRST33_ADAPTERS.length!==4||seen.size!==33||
  ISSUE342_A_FIRST33_ADAPTERS.reduce((n,f)=>n+f.sources.length,0)!==33)
 throw Error('A258 first 33 frozen source/family inventory drift');
