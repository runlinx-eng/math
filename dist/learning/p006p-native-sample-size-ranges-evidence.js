// #342 P006p: ten original B21 draws comparing n=20 and n=60.
// A-only isolated candidate. No formal A credit, causal inference or field survey.
import * as native from './phase5/b21-model.js';
import {isEvidenceContext,matchesNativeEvidenceTask,latestSubmissionMatches,
 hasExactKeys as exact,sameEvidence as same} from './evidence-contract.js';

const POSITION='samplevary:2',NODE='mt_x7V1qrkiqH';
const QUESTIONS=[
 {label:'五次最小到最大的范围',value:['notbound'],
  options:[['notbound','是这几次看到的变化，不能保证真实值或未来都在里面'],
   ['guarantee','一定罩住所有未来结果']]},
 {label:'较大随机样本一般',value:['usually'],
  options:[['usually','通常更稳定，但不保证每次更准，也不修复偏差'],
   ['always','每一次都必然更准']]}
];
function originalTask(){
 return {type:'x-samplelab',
  prompt:'同一个盒子，先抽20个五次，再抽60个五次。比较记录，不要求每一次大样本都更准。',
  N:200,n:20,runs:10,methods:['all'],mode:'proportion',seed:202621,
  questions:QUESTIONS,compareSizes:true,sizes:[20,20,20,20,20,60,60,60,60,60]};
}
function source(task,context){
 if(!isEvidenceContext(context)||context.sessionId!=='samplevary'||context.index!==2)return false;
 const frozen=originalTask();
 return exact(task,Object.keys(frozen))&&same(task,frozen)&&
  matchesNativeEvidenceTask(task,context,{type:'x-samplelab',nodeId:NODE});
}
// Independently reproduce the LCG, pool-reset and in-draw Fisher-Yates.
// We intentionally do not call original draw(), sampleValue(), or solveSteps().
function independentDraws(){
 let seed=202621;
 const runs=[];
 for(let k=0;k<10;k++){
  const n=k<5?20:60,pool=Array.from({length:200},(_,i)=>i+1),ids=[];
  for(let i=0;i<n;i++){
   seed=(Math.imul(seed,1664525)+1013904223)>>>0;
   const j=i+Math.floor(seed/4294967296*(200-i));
   [pool[i],pool[j]]=[pool[j],pool[i]];
   ids.push(pool[i]);
  }
  const values=ids.map(id=>(id-1)%10<3?1:0);
  const sum=values.reduce((a,b)=>a+b,0);
  const estimate=Math.round((sum/n*100+Number.EPSILON)*10)/10;
  runs.push({seed,ids,values,n,method:'all',estimate,sum});
 }
 return {seed,runs};
}
const within=(v,keys)=>exact(v,keys);
function event(e,action,fields){
 return within(e,['a','d','f'])&&e.a===action&&within(e.d,[])&&within(e.f,fields);
}
function historyProof(history,expected){
 if(!Array.isArray(history))return null;
 let i=0,wrong=0,firstRecord=null;
 for(let k=0;k<10;k++){
  if(!event(history[i++],'draw',[]))return null;
  let e=history[i++];
  if(!event(e,'record',['estimate'])||typeof e.f.estimate!=='string')return null;
  if(k===0)firstRecord=structuredClone(e.f);
  const answer=String(expected.runs[k].estimate);
  if(e.f.estimate!==answer){
   if(!e.f.estimate.trim()||!Number.isFinite(Number(e.f.estimate)))return null;
   wrong++;
   e=history[i++];
   if(!event(e,'record',['estimate']))return null;
  }
  if(e.f.estimate!==answer)return null;
 }
 return i===history.length?{wrong,firstRecord,drawClicks:10,recordClicks:10+wrong}:null;
}
const ranges=runs=>{
 const a=runs.slice(0,5).map(r=>r.estimate),b=runs.slice(5).map(r=>r.estimate);
 return {lowA:Math.min(...a),highA:Math.max(...a),lowB:Math.min(...b),highB:Math.max(...b)};
};
export function nativeSizeRangesBinding(task,context={}){
 return source(task,context)?{position:POSITION,sourceNodeId:NODE,
  populationSize:200,smallSampleSize:20,largeSampleSize:60,
  repetitionsPerSize:5,mode:'proportion',syntheticPopulation:true}:null;
}
export function replayNativeSizeRanges(task,model,context={}){
 try{
  if(!source(task,context)||!model)return null;
  const expected=independentDraws(),bounds=ranges(expected.runs);
  const fields=native.fields(task);
  if(!exact(model,[...Object.keys(fields),'board','history','issue'])||
   model.issue!==''||!native.valid(task,model)||!native.inspect(task,model).correct||
   !exact(model.board,['first','cursor','seed','pending','runs'])||
   model.board.cursor!==0||model.board.seed!==expected.seed||
   model.board.pending!==null||!Array.isArray(model.board.runs)||
   model.board.runs.length!==10||!same(model.answers,['notbound','usually'])||
   model.estimate!==String(expected.runs[9].estimate)||
   !['lowA','highA','lowB','highB'].every(k=>model[k]===String(bounds[k])))return null;
  for(const key of Object.keys(fields)){
   if(!['answers','estimate','lowA','highA','lowB','highB','prose'].includes(key)&&
    !same(model[key],fields[key]))return null;
  }
  for(let k=0;k<10;k++){
   const e=expected.runs[k],r=model.board.runs[k];
   if(!exact(r,['seed','ids','values','n','method','estimate'])||
    !same(r,{seed:e.seed,ids:e.ids,values:e.values,n:e.n,
     method:'all',estimate:e.estimate})||
    new Set(r.ids).size!==e.n||!r.ids.every(id=>Number.isInteger(id)&&id>=1&&id<=200))return null;
  }
  const h=historyProof(model.history,expected);
  if(!h||!exact(model.board.first,['draw-0','record-0'])||
   !exact(model.board.first['draw-0'],[])||
   !same(model.board.first['record-0'],h.firstRecord))return null;
  const percentages=expected.runs.map(r=>r.estimate);
  const small=percentages.slice(0,5),large=percentages.slice(5);
  return {
   kind:'b21-native-ten-sample-size-ranges',originalPosition:POSITION,
   sourceNodeId:NODE,syntheticPopulation:true,populationSize:200,
   syntheticPopulationPercentage:30,smallDrawSize:20,largeDrawSize:60,
   drawsPerSize:5,sampleIds:expected.runs.map(r=>[...r.ids]),
   sampleSuccessCounts:expected.runs.map(r=>r.sum),
   samplePercentages:percentages,observedSmallSampleRange:[bounds.lowA,bounds.highA],
   observedLargeSampleRange:[bounds.lowB,bounds.highB],
   observedSmallSpread:bounds.highA-bounds.lowA,
   observedLargeSpread:bounds.highB-bounds.lowB,
   observedDrawClicks:h.drawClicks,observedRecordClicks:h.recordClicks,
   wrongEstimateThenCorrectionObserved:h.wrong>0,
   poolResetBeforeEveryDraw:true,withoutReplacementWithinEachDraw:true,
   futureSamplesWithinObservedRangesGuaranteed:false,
   eachLargerSampleNecessarilyCloser:false,
   realRespondentsObserved:false,realWorldPopulationInferred:false,
   freeTextMeaningAssessed:false,longTermMasteryAssessed:false,strictAApproved:false
  };
 }catch{return null;}
}
export function submittedNativeSizeRanges(task,model,record,context={}){
 return latestSubmissionMatches(model,record)?
  replayNativeSizeRanges(task,model,context):null;
}
