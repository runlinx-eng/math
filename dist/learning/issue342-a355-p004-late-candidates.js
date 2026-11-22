// #342 A line P004i-n: exact independently runtime SHA-locked native sources.
// Inert until formal manifest; same task hash never grants a different lesson source.
import * as mi from './p004i-rotated-parallelogram-family-evidence.js';
import * as mj from './p004j-regular-hexagon-construction-evidence.js';
import * as mk from './p004k-shapefacts-parallelogram-evidence.js';
import * as ml from './p004l-words38-pentagon-side-trace-evidence.js';
import * as mm from './p004m-cross-source-square-inclusion-evidence.js';
import * as mn from './p004n-geometrynotation-hexagon-evidence.js';
const families=Object.freeze([
 {id:'issue341-A-P004I',types:Object.freeze(['x-s23-quad']),sources:Object.freeze([Object.freeze({"position":"quadhierarchy:2","sessionId":"quadhierarchy","index":2,"type":"x-s23-quad","nodeId":"mt_liIW336odh","taskHash":"e6cbba7cf296ffad18da397c90c3be0a0f69b1ccafc45a35af0038427f939e1e"})]),binding:mi.rotatedParallelogramFamilyBinding,replay:mi.replayRotatedParallelogramFamilyEvidence,submitted:mi.submittedRotatedParallelogramFamilyEvidence},
 {id:'issue341-A-P004J',types:Object.freeze(['x-s23-polygon']),sources:Object.freeze([Object.freeze({"position":"shapesides:2","sessionId":"shapesides","index":2,"type":"x-s23-polygon","nodeId":"mt_zuOGOGFAKb","taskHash":"bad98b895c2ffff36c1201c66637e86ab33b071e74b33cff4615f76f820b205b"})]),binding:mj.regularHexagonBinding,replay:mj.replayRegularHexagonEvidence,submitted:mj.submittedRegularHexagonEvidence},
 {id:'issue341-A-P004K',types:Object.freeze(['x-s23-quad']),sources:Object.freeze([Object.freeze({"position":"shapefacts:0","sessionId":"shapefacts","index":0,"type":"x-s23-quad","nodeId":"mt_DNYQLahbfa","taskHash":"e6cbba7cf296ffad18da397c90c3be0a0f69b1ccafc45a35af0038427f939e1e"})]),binding:mk.shapefactsParallelogramBinding,replay:mk.replayShapefactsParallelogramEvidence,submitted:mk.submittedShapefactsParallelogramEvidence},
 {id:'issue341-A-P004L',types:Object.freeze(['x-s23-sides']),sources:Object.freeze([Object.freeze({"position":"words38:2","sessionId":"words38","index":2,"type":"x-s23-sides","nodeId":"mt_lMz9nAs7VO","taskHash":"45495542e41598d132a4507480f24c46e6cf3c46716abda13739d222024a4a18"})]),binding:ml.words38PentagonSideTraceBinding,replay:ml.replayWords38PentagonSideTraceEvidence,submitted:ml.submittedWords38PentagonSideTraceEvidence},
 {id:'issue341-A-P004M',types:Object.freeze(['x-s23-quad']),sources:Object.freeze([Object.freeze({"position":"shapefacts:1","sessionId":"shapefacts","index":1,"type":"x-s23-quad","nodeId":"mt_DNYQLahbfa","taskHash":"59c85cf7b19f96f967978b44a4e829775825dcc91967bffcf28040ca30f39689"})]),binding:mm.crossSourceSquareInclusionBinding,replay:mm.replayCrossSourceSquareInclusionEvidence,submitted:mm.submittedCrossSourceSquareInclusionEvidence},
 {id:'issue341-A-P004N',types:Object.freeze(['x-s23-polygon']),sources:Object.freeze([Object.freeze({"position":"geometrynotation:3","sessionId":"geometrynotation","index":3,"type":"x-s23-polygon","nodeId":"mt_WtIFJSCQIT","taskHash":"3fceb132e31eeb6fb5b54d078c04088b4e836f73ff48c4d96956572f0caf1a64"})]),binding:mn.geometryNotationHexagonBinding,replay:mn.replayGeometryNotationHexagonEvidence,submitted:mn.submittedGeometryNotationHexagonEvidence}
]);
const index=(s,i)=>JSON.stringify([s,i]);
const seen=new Set();
export const ISSUE342_A_P004_LATE_ADAPTERS=Object.freeze(families.map(f=>{
 const exact=new Map(f.sources.map(s=>[index(s.sessionId,s.index),s]));
 for(const s of f.sources){const k=index(s.sessionId,s.index);if(seen.has(k)||!/^[0-9a-f]{64}$/.test(s.taskHash))throw Error('invalid P004 source');seen.add(k)}
 return Object.freeze({...f,binding:(task,context)=>{
  if(typeof context?.sessionId!=='string'||!Number.isSafeInteger(context.index))return null;
  const s=exact.get(index(context.sessionId,context.index));if(!s||task?.type!==s.type)return null;
  const bound=f.binding(task,context);
  if(!bound||bound.method!=null||(bound.nodeId??bound.sourceNodeId)!==s.nodeId)return null;
  return Object.freeze({...bound,nodeId:s.nodeId,method:null,candidateSource:s,strictAApproved:false,
   question:typeof bound.question==='string'&&bound.question?bound.question:'哪些真实原生操作和 Check 支持这次核验？'});
 }});
}));
if(families.length!==6||seen.size!==6)throw Error('P004 late count mismatch');
