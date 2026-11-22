// #342 P056 original B03 equalparts:1: two distinct 4-colour equal-area mosaics.
// The source saves complete prior/final cell snapshots, not paint chronology.
import * as b03 from './phase4/b03-model.js';
import {isEvidenceContext,hasExactKeys,matchesNativeEvidenceTask,
 sameEvidence,latestSubmissionMatches} from './evidence-contract.js';
const SOURCE=Object.freeze({
 sessionId:'equalparts',index:1,nodeId:'mt_Xp-rj46S2w',type:'x-mosaic',
 taskHash:'c89b0fecdd24b0a4583541631e1e9a852404a78270179ba2993aaf9efef7633b'
});
const TASK=Object.freeze({type:'x-mosaic',
 prompt:'用四种颜色分这张纸，每种颜色分到一样多的格子。保存一种分法，再改成另一种分法。形状可以不同。'});
export const P056_MOSAIC_SOURCE=SOURCE;
const equalCounts=cells=>Array.isArray(cells)&&cells.length===16&&
 cells.every(v=>Number.isInteger(v)&&v>=0&&v<=3)&&
 [0,1,2,3].every(color=>cells.filter(v=>v===color).length===4);
const canonical=cells=>{
 const seen=[];
 return cells.map(color=>{
  if(!seen.includes(color))seen.push(color);
  return seen.indexOf(color);
 });
};
export function p056MosaicBinding(task,context={}){
 if(!isEvidenceContext(context)||context.sessionId!==SOURCE.sessionId||
    context.index!==SOURCE.index||!sameEvidence(task,TASK)||
    !matchesNativeEvidenceTask(task,context,SOURCE))return null;
 return {position:'equalparts:1',nodeId:SOURCE.nodeId,type:SOURCE.type,
  taskHash:SOURCE.taskHash,method:null,
  question:'两种颜色形状虽然不同，为什么四种颜色都恰好覆盖四格？',
  strictAApproved:false};
}
export function replayP056MosaicEvidence(task,model,context={}){
 try{
  const source=p056MosaicBinding(task,context);
  if(!source||!hasExactKeys(model,Object.keys(b03.initial(task)))||
    !b03.valid(task,model)||!b03.inspect(task,model).correct||
    model.den!==4||!equalCounts(model.cells)||!Array.isArray(model.saved)||
    !model.saved.length||!model.saved.every(equalCounts))return null;
  const final=canonical(model.cells);
  const saved=model.saved.map(canonical);
  if(!saved.some(first=>!sameEvidence(first,final)))return null;
  return {kind:'p056-original-equal-area-two-mosaics',source,
   originalGridCells:16,verifiedColourCount:4,verifiedCellsPerColour:4,
   observedFinalCellColours:[...model.cells],
   observedSavedMosaics:model.saved.map(x=>[...x]),
   genuinelyDistinctCellPartitions:saved.some(first=>!sameEvidence(first,final)),
   colourRenamingAloneIsNotDifferent:true,
   paintActionChronologyObserved:false,spokenExplanationAssessed:false,
   childrenMasteryAssessed:false,strictAApproved:false};
 }catch{return null;}
}
export function submittedP056MosaicEvidence(task,model,record,context={}){
 return latestSubmissionMatches(model,record)?replayP056MosaicEvidence(task,model,context):null;
}
