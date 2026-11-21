// #342 P006b: native B19 two simulated frequency comparisons, development-only.
import * as native from './phase5/b19-model.js';
import {isEvidenceContext,matchesNativeEvidenceTask,latestSubmissionMatches,
 hasExactKeys as exact,sameEvidence as same} from './evidence-contract.js';

const NODE='mt_1VSfm9yiLn';
const CASES={
 1:{type:'x-datacount',labels:['狗','猫','兔'],counts:[8,5,3],
  prompt:'把狗和猫的记录一一配对，多出来的那一段才是“多几个”。',
  unit:'份回答',compare:[0,1],pair:true},
 2:{type:'x-datacount',labels:['红','蓝','绿'],counts:[4,4,2],
  prompt:'最多可能不只一类。把所有并列最多、最少的类别都指出来。',
  unit:'份回答',compare:[0,1],extremes:true}
};
const fields=Object.keys(native.fieldValues(CASES[1]));
export function nativeFrequencyCompareBinding(task,context={}){
 if(!isEvidenceContext(context)||context.sessionId!=='categoryuse'||
  !Object.hasOwn(CASES,context.index))return null;
 const spec=CASES[context.index];
 if(!matchesNativeEvidenceTask(task,context,{type:'x-datacount',nodeId:NODE})||
  !exact(task,Object.keys(spec))||!same(task,spec))return null;
 return {position:'categoryuse:'+context.index,nodeId:NODE,kind:context.index===1?'pair':'ties'};
}
function originalFields(spec){
 return native.fieldValues(spec);
}
export function replayNativeFrequencyCompare(task,model,context={}){
 try{
  const binding=nativeFrequencyCompareBinding(task,context);
  if(!binding||!model||!exact(model,[...fields,'board','history','issue'])||
   !exact(model.board,['first','counts','pairs','max','min'])||
   !same(model.board.first,{})||model.issue!==''||
   !native.valid(task,model)||!native.inspect(task,model).correct||
   !Array.isArray(model.history))return null;
  const spec=CASES[context.index],initial=originalFields(spec);
  const expectedTotal=spec.counts.reduce((a,b)=>a+b,0);
  const expectedGap=Math.abs(spec.counts[0]-spec.counts[1]);
  for(const k of fields){
   if(!same(model[k],k==='total'?String(expectedTotal):
    k==='gap'?String(expectedGap):initial[k]))return null;
  }
  const tally=spec.counts.map(()=>0);
  let pairs=0;const max=[],min=[];
  let phase='bars';
  const expectedLength=expectedTotal+(binding.kind==='pair'?5:3);
  if(model.history.length!==expectedLength)return null;
  for(const event of model.history){
   if(!exact(event,['a','d','f'])||!exact(event.f,fields)||
    !fields.every(k=>same(event.f[k],initial[k])))return null;
   if(event.a==='bar'){
    if(phase!=='bars'||!exact(event.d,['index','delta'])||
     event.d.delta!=='1'||!/^[012]$/.test(event.d.index))return null;
    const i=Number(event.d.index);
    if(++tally[i]>spec.counts[i])return null;
    continue;
   }
   if(!same(tally,spec.counts))return null;
   phase='comparisons';
   if(binding.kind==='pair'){
    if(event.a!=='pair'||!exact(event.d,[])||++pairs>5)return null;
   }else{
    if(!exact(event.d,['index'])||!/^[012]$/.test(event.d.index))return null;
    const i=Number(event.d.index);
    if(event.a==='max'&&[0,1].includes(i)&&!max.includes(i))max.push(i);
    else if(event.a==='min'&&i===2&&!min.includes(i))min.push(i);
    else return null;
   }
  }
  if(!same(tally,spec.counts)||!same(model.board.counts,tally)||
   Number(model.total)!==expectedTotal||Number(model.gap)!==expectedGap||
   !same(model.board.max, binding.kind==='ties'?[0,1]:[])||
   !same(model.board.min,binding.kind==='ties'?[2]:[])||
   model.board.pairs!==(binding.kind==='pair'?5:0)||
   (binding.kind==='pair'&&pairs!==5)||
   (binding.kind==='ties'&&(!same(max.slice().sort(),[0,1])||!same(min,[2]))))
   return null;
  return {kind:'b19-simulated-frequency-comparison',position:binding.position,
   sourceNodeId:NODE,originalBarEvents:expectedTotal,counts:tally,
   independentTotal:expectedTotal,independentDifference:expectedGap,
   originalPairActions:pairs,originalMaxSelections:max.slice().sort(),
   originalMinSelections:min,comparisonMode:binding.kind,
   actualChildrenSurveyed:false,uniqueRespondentsVerified:false,
   statisticalInferenceAssessed:false,freeExplanationAssessed:false,
   generalMasteryAssessed:false,strictAApproved:false};
 }catch{return null;}
}
export function submittedNativeFrequencyCompare(task,model,record,context={}){
 return latestSubmissionMatches(model,record)?
  replayNativeFrequencyCompare(task,model,context):null;
}
