// #342 P006a: original B19 native category-frequency count, development only.
// Evidence is bounded to a nine-answer simulated dataset and actual bar actions.
import * as native from './phase5/b19-model.js';
import {isEvidenceContext,matchesNativeEvidenceTask,latestSubmissionMatches,
 hasExactKeys as keys,sameEvidence as same} from './evidence-contract.js';
const POSITION='categoryuse:0',NODE='mt_1VSfm9yiLn';
const SPEC={
 type:'x-datacount',labels:['苹果','香蕉','梨'],counts:[4,3,2],
 prompt:'把这9份模拟回答整理成三列。每个人只选一次：每类、总数、相差多少分别是什么？',
 unit:'份回答',compare:[0,1]
};
const countKeys=Object.keys(native.fieldValues(SPEC));
export function categoryFrequencyBinding(task,context={}){
 if(!isEvidenceContext(context)||context.sessionId+':'+context.index!==POSITION||
    !matchesNativeEvidenceTask(task,context,{type:SPEC.type,nodeId:NODE})||
    !keys(task,Object.keys(SPEC))||!same(task,SPEC))return null;
 return {position:POSITION,nodeId:NODE};
}
export function replayCategoryFrequencyEvidence(task,model,context={}){
 try{
  const source=categoryFrequencyBinding(task,context);
  if(!source||!model||!keys(model,[...countKeys,'board','history','issue'])||
     !keys(model.board,['first','counts','pairs','max','min'])||
     !same(model.board.first,{})||model.issue!==''||
     !native.valid(task,model)||!native.inspect(task,model).correct||
     !Array.isArray(model.history)||model.history.length!==9)return null;
  const before=native.fieldValues(SPEC);
  if(!countKeys.every(k=>same(model[k],k==='total'?'9':k==='gap'?'1':before[k])))return null;
  const tallies=[0,0,0];
  for(const event of model.history){
   if(!keys(event,['a','d','f'])||event.a!=='bar'||
      !keys(event.d,['index','delta'])||event.d.delta!=='1'||
      !/^[012]$/.test(event.d.index)||
      !keys(event.f,countKeys)||
      !countKeys.every(k=>same(event.f[k],before[k])))return null;
   tallies[Number(event.d.index)]++;
   if(tallies[Number(event.d.index)]>SPEC.counts[Number(event.d.index)])return null;
  }
  const total=tallies.reduce((n,v)=>n+v,0);
  const gap=Math.abs(tallies[0]-tallies[1]);
  if(!same(tallies,[4,3,2])||!same(model.board.counts,tallies)||
     total!==9||gap!==1||total!==Number(model.total)||
     gap!==Number(model.gap))return null;
  return {kind:'b19-original-simulated-frequency-tally',
   position:source.position,nodeId:source.nodeId,
   originalBarEvents:9,independentFrequencies:tallies,
   independentlyCountedTotal:9,independentCategoryDifference:1,
   unit:'份回答',denominatorIsNineSimulatedSingleChoiceResponses:true,
   actualChildrenSurveyed:false,individualIdentityVerified:false,
   statisticalInferenceAssessed:false,freeExplanationAssessed:false,
   generalMasteryAssessed:false,strictAApproved:false};
 }catch{return null;}
}
export function submittedCategoryFrequencyEvidence(task,model,record,context={}){
 return latestSubmissionMatches(model,record)?
   replayCategoryFrequencyEvidence(task,model,context):null;
}
