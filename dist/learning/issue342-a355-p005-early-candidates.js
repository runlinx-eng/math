// #342 P005a-g tested source-locked native angular evidence; *inert* until manifest selection.
import * as ma from './p005a-acute-angle-comparison-evidence.js';
import * as mb from './p005b-angle-ordering-evidence.js';
import * as mc from './p005c-native-vertex-angle-evidence.js';
import * as md from './p005d-cross-source-vertex-angle-evidence.js';
import * as me from './p005e-directed-angle-classification-evidence.js';
import * as mf from './p005f-native-angle-estimates-evidence.js';
import * as mg from './p005g-native-protractor-evidence.js';
const families=Object.freeze([
 {id:'issue341-A-P005A',types:Object.freeze(['x-g25-compare']),sources:Object.freeze([{"position":"angletypes:0","sessionId":"angletypes","index":0,"nodeId":"mt_h0CVtqI2xo","type":"x-g25-compare","taskHash":"4f092487ea35e4acd828caed73074c73bb55c5fcaecd6e7e87303fe34439cb32"}].map(Object.freeze)),binding:ma.acuteAngleComparisonBinding,replay:ma.replayAcuteAngleComparisonEvidence,submitted:ma.submittedAcuteAngleComparisonEvidence},
 {id:'issue341-A-P005B',types:Object.freeze(['x-g25-compare']),sources:Object.freeze([{"position":"angletypes:1","sessionId":"angletypes","index":1,"nodeId":"mt_h0CVtqI2xo","type":"x-g25-compare","taskHash":"126024ce38ae4972a7a8fe4b3a93dfdbbf7e25d72267b6d07c718425dc371324"}].map(Object.freeze)),binding:mb.angleOrderingBinding,replay:mb.replayAngleOrderingEvidence,submitted:mb.submittedAngleOrderingEvidence},
 {id:'issue341-A-P005C',types:Object.freeze(['x-g25-vertices']),sources:Object.freeze([{"position":"angletypes:2","sessionId":"angletypes","index":2,"nodeId":"mt_h0CVtqI2xo","type":"x-g25-vertices","taskHash":"fe8d25eebb372ca59917395fad7ad2c641ebeb9e66b59da04e536e11850ffd4c"},{"position":"angletypes:3","sessionId":"angletypes","index":3,"nodeId":"mt_h0CVtqI2xo","type":"x-g25-vertices","taskHash":"3e545f1207fd64dcee25f76cc7449116ba45995afd385738fec4c7fce527b140"},{"position":"angletypes:4","sessionId":"angletypes","index":4,"nodeId":"mt_h0CVtqI2xo","type":"x-g25-vertices","taskHash":"e2b698087a7edc69401092db6ff10b55938c9b49caedb5dfaed420bef75e96c6"}].map(Object.freeze)),binding:mc.vertexAngleBinding,replay:mc.replayVertexAngleEvidence,submitted:mc.submittedVertexAngleEvidence},
 {id:'issue341-A-P005D',types:Object.freeze(['x-g25-vertices']),sources:Object.freeze([{"position":"anglecorner:2","sessionId":"anglecorner","index":2,"nodeId":"mt_8OAGVdeTJ_","type":"x-g25-vertices","taskHash":"732d4288b4601c08cca221c8c35d13ebf080c2326d7a579f4b1cc0689087c5b8"},{"position":"rightcheck:1","sessionId":"rightcheck","index":1,"nodeId":"mt_MFfYcnv6Tv","type":"x-g25-vertices","taskHash":"0b936ffb21588a5f4b82cc6ee2f55796f509456cec2613e773131a1803e59979"},{"position":"linemark:2","sessionId":"linemark","index":2,"nodeId":"mt_QysgF57dxh","type":"x-g25-vertices","taskHash":"31fcde19c84f05c03b7e4629201d21e2ba1cfdeb4e0562053d3810e62e06d8db"},{"position":"linenotation:0","sessionId":"linenotation","index":0,"nodeId":"mt_e4V6hvcuEJ","type":"x-g25-vertices","taskHash":"6e14b21b9bafdff25c2a163736fa1886d477ff10122c8f64ad816621a2773ab0"}].map(Object.freeze)),binding:md.vertexAngleBinding,replay:md.replayVertexAngleEvidence,submitted:md.submittedVertexAngleEvidence},
 {id:'issue341-A-P005E',types:Object.freeze(['x-g25-compare']),sources:Object.freeze([{"position":"rightcheck:0","sessionId":"rightcheck","index":0,"nodeId":"mt_MFfYcnv6Tv","type":"x-g25-compare","taskHash":"09beb6f706b5d3ed887b4002c1fbe8b01f0baa34252d1beb3545e6a3537b3faa"},{"position":"anglestraight:1","sessionId":"anglestraight","index":1,"nodeId":"mt_LBT-9jz7kR","type":"x-g25-compare","taskHash":"8f6bc73d9e3bf01ece867b47a886b45e84a9de11e58b38e18785e971e8e227ce"}].map(Object.freeze)),binding:me.directedAngleBinding,replay:me.replayDirectedAngleEvidence,submitted:me.submittedDirectedAngleEvidence},
 {id:'issue341-A-P005F',types:Object.freeze(['x-g25-estimate']),sources:Object.freeze([{"position":"angleestimate:0","sessionId":"angleestimate","index":0,"nodeId":"mt_YUJ5pwalqL","type":"x-g25-estimate","taskHash":"2e95b28676442bc8fc86c1bdfdeec5cfb3cff4d88efa1c546acbf6dfa3e06e35"},{"position":"angleestimate:1","sessionId":"angleestimate","index":1,"nodeId":"mt_YUJ5pwalqL","type":"x-g25-estimate","taskHash":"0747b513cf0a1b47fa7287c24c8f1124fad9decd5264b49ac198cc44d8c24b6d"}].map(Object.freeze)),binding:mf.angleEstimateBinding,replay:mf.replayAngleEstimateEvidence,submitted:mf.submittedAngleEstimateEvidence},
 {id:'issue341-A-P005G',types:Object.freeze(['x-g25-protractor']),sources:Object.freeze([{"position":"angleprotractor:0","sessionId":"angleprotractor","index":0,"nodeId":"mt_4MFUAsbx_6","type":"x-g25-protractor","taskHash":"107b5a8506ea58a40654d33f663faf8cc36d1060cbf5e3b6c890c95801bb126a"},{"position":"angleprotractor:1","sessionId":"angleprotractor","index":1,"nodeId":"mt_4MFUAsbx_6","type":"x-g25-protractor","taskHash":"b59a56720e76b1c137285af1f28c5a39215295ffe87712266a187c8d98fedc42"},{"position":"angleprotractor:2","sessionId":"angleprotractor","index":2,"nodeId":"mt_4MFUAsbx_6","type":"x-g25-protractor","taskHash":"38f731b2d957fd5a6bd7befea7ba52703a90d8ebe014cfaec13f0a82ed75440d"}].map(Object.freeze)),binding:mg.protractorBinding,replay:mg.replayProtractorEvidence,submitted:mg.submittedProtractorEvidence}
]);
const key=(s,i)=>JSON.stringify([s,i]);
const seen=new Set();
export const ISSUE342_A_P005_EARLY_ADAPTERS=Object.freeze(families.map(f=>{
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
if(families.length!==7||seen.size!==16)throw Error('P005 early source count mismatch');
