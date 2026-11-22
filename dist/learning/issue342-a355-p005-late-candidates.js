// #342 P005h-n independently real-runtime source-locked mathematics. Inert before formal manifest.
// Different lessons sharing same full SHA (e.g. original polygon clone) require distinct node identities.
import * as mh from './p005h-native-parallel-transversal-evidence.js';
import * as mi from './p005i-native-triangle-corner-evidence.js';
import * as mj from './p005j-native-polygon-triangulation-evidence.js';
import * as mk from './p005k-cross-source-angle-order-evidence.js';
import * as ml from './p005l-reason34-polygon-fan-evidence.js';
import * as mm from './p005m-native-fractionreason-anglejoin-evidence.js';
import * as mn from './p005n-structurebridge-parallel-rectangle-evidence.js';
const families=Object.freeze([
 {id:'issue341-A-P005H',types:Object.freeze(['x-g25-parallel']),sources:Object.freeze([{"position":"parallelangle:0","sessionId":"parallelangle","index":0,"nodeId":"mt_H_pNJ3ZI_S","type":"x-g25-parallel","taskHash":"cdbbc402bfcdd7e8593aa876f501b474fc69660ab61edce5e128fa3ca92ad28e"},{"position":"parallelangle:1","sessionId":"parallelangle","index":1,"nodeId":"mt_H_pNJ3ZI_S","type":"x-g25-parallel","taskHash":"455479ecfd0c03dc7b71f9e935889928d0727461b2bcf2c2faa74990eeab8b08"},{"position":"parallelangle:2","sessionId":"parallelangle","index":2,"nodeId":"mt_H_pNJ3ZI_S","type":"x-g25-parallel","taskHash":"74516eb7aa89d993be4b4c918e5aab4b1ccd7d7c08360714fb4b2596411d6fb9"}].map(Object.freeze)),binding:mh.parallelBinding,replay:mh.replayParallelEvidence,submitted:mh.submittedParallelEvidence},
 {id:'issue341-A-P005I',types:Object.freeze(['x-g25-corners']),sources:Object.freeze([{"position":"triangleangles:0","sessionId":"triangleangles","index":0,"nodeId":"mt_cdMlC7EpTJ","type":"x-g25-corners","taskHash":"86aafc8c07cd506552e0981c4b0b3c09384154e3d48f788050b71d7deaf13d4e"},{"position":"polygonangles:0","sessionId":"polygonangles","index":0,"nodeId":"mt_J03RFlVdas","type":"x-g25-corners","taskHash":"45f21a1463bb3b9b5a08f95f1d7010bc2b5b6eae63607cda1e269cbbd67f938b"}].map(Object.freeze)),binding:mi.cornerBinding,replay:mi.replayCornerEvidence,submitted:mi.submittedCornerEvidence},
 {id:'issue341-A-P005J',types:Object.freeze(['x-g25-polygon']),sources:Object.freeze([{"position":"triangleangles:1","sessionId":"triangleangles","index":1,"nodeId":"mt_cdMlC7EpTJ","type":"x-g25-polygon","taskHash":"0f6663f98f33d41c0a34325fa27fa2efccd210c8226ec84f54b54d2c780fd0c7"},{"position":"triangleangles:2","sessionId":"triangleangles","index":2,"nodeId":"mt_cdMlC7EpTJ","type":"x-g25-polygon","taskHash":"147de24573fdcaf86536f966660dc6f70defc3f1c96a2b1d1f40c4ae83af2dec"},{"position":"polygonangles:1","sessionId":"polygonangles","index":1,"nodeId":"mt_J03RFlVdas","type":"x-g25-polygon","taskHash":"07e4b762dc704c68929bf22c12cfa40b749813061618ad50bfee9da182053e11"},{"position":"polygonangles:2","sessionId":"polygonangles","index":2,"nodeId":"mt_J03RFlVdas","type":"x-g25-polygon","taskHash":"27d4dadcb1c638fb86fcdd4497c8658ebaa9716293697d394b252d6fe0a28993"}].map(Object.freeze)),binding:mj.polygonBinding,replay:mj.replayPolygonEvidence,submitted:mj.submittedPolygonEvidence},
 {id:'issue341-A-P005K',types:Object.freeze(['x-g25-compare']),sources:Object.freeze([{"position":"angleestimate:2","sessionId":"angleestimate","index":2,"nodeId":"mt_YUJ5pwalqL","type":"x-g25-compare","taskHash":"66129894fabd7fda86e14f8373186a7b65cae628f29a1868a7f30c137e0935e9"}].map(Object.freeze)),binding:mk.angleOrderingBinding,replay:mk.replayAngleOrderingEvidence,submitted:mk.submittedAngleOrderingEvidence},
 {id:'issue341-A-P005L',types:Object.freeze(['x-g25-polygon']),sources:Object.freeze([{"position":"reason34:0","sessionId":"reason34","index":0,"nodeId":"mt_iyovKgZC1q","type":"x-g25-polygon","taskHash":"07e4b762dc704c68929bf22c12cfa40b749813061618ad50bfee9da182053e11"}].map(Object.freeze)),binding:ml.polygonBinding,replay:ml.replayPolygonEvidence,submitted:ml.submittedPolygonEvidence},
 {id:'issue341-A-P005M',types:Object.freeze(['x-anglejoin']),sources:Object.freeze([{"position":"fractionreason:2","sessionId":"fractionreason","index":2,"nodeId":"mt_2ESZh70NyS","type":"x-anglejoin","taskHash":"87348811a8a2af3a10b9f4e29d1f56ffe13d6ebc0c4b259326cf5ec3a951ab70"},{"position":"fractionreason:3","sessionId":"fractionreason","index":3,"nodeId":"mt_2ESZh70NyS","type":"x-anglejoin","taskHash":"7d32137f7f140f8fabaa1d8e07c2ae0a8a6a7c60933566b300a5beb3100506e8"}].map(Object.freeze)),binding:mm.angleJoinBinding,replay:mm.replayAngleJoinEvidence,submitted:mm.submittedAngleJoinEvidence},
 {id:'issue341-A-P005N',types:Object.freeze(['x-shapeangle']),sources:Object.freeze([{"position":"structurebridge:0","sessionId":"structurebridge","index":0,"nodeId":"mt_hImiKNiaNh","type":"x-shapeangle","taskHash":"5574b42f8ac8c33a3c07232a2784d22dfc88e25b0df58091122628b648517dc6"}].map(Object.freeze)),binding:mn.structureBridgeBinding,replay:mn.replayStructureBridgeEvidence,submitted:mn.submittedStructureBridgeEvidence}
]);
const key=(s,i)=>JSON.stringify([s,i]);
const seen=new Set();
export const ISSUE342_A_P005_LATE_ADAPTERS=Object.freeze(families.map(f=>{
 const exact=new Map(f.sources.map(s=>[key(s.sessionId,s.index),s]));
 for(const s of f.sources){const k=key(s.sessionId,s.index);if(seen.has(k)||!/^[0-9a-f]{64}$/.test(s.taskHash))throw Error('P005 duplicate/invalid source');seen.add(k)}
 return Object.freeze({...f,binding:(task,context)=>{
  if(typeof context?.sessionId!=='string'||!Number.isSafeInteger(context.index))return null;
  const s=exact.get(key(context.sessionId,context.index));if(!s||task?.type!==s.type)return null;
  const binding=f.binding(task,context);
  if(!binding||binding.method!=null||(binding.nodeId??binding.sourceNodeId)!==s.nodeId)return null;
  return Object.freeze({...binding,nodeId:s.nodeId,method:null,candidateSource:s,strictAApproved:false,
   question:typeof binding.question==='string'&&binding.question?binding.question:'哪些真实原生操作和 Check 支持这次核验？'});
 }});
}));
if(families.length!==7||seen.size!==14)throw Error('P005 late source count mismatch');
