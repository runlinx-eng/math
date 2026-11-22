// #342 P006n: five original B21 resamples from one synthetic population.
// Development-only source-locked replay; not a formal-A adapter or a real survey.
import * as native from './phase5/b21-model.js';
import {isEvidenceContext,matchesNativeEvidenceTask,latestSubmissionMatches,
 hasExactKeys as exact,sameEvidence as same} from './evidence-contract.js';

const NODE='mt_x7V1qrkiqH',POSITION='samplevary:0';
const QUESTION={label:'几次估计不同是因为',value:['chance'],
 options:[['chance','抽到的个体不同，有随机波动'],['wrong','一定有人算错']]};
function originalTask(){
 return {type:'x-samplelab',
  prompt:'同一个盒子，抽20个，记下比例，再全部放回。重复5次，结果一定一样吗？',
  N:80,n:20,runs:5,methods:['all'],mode:'proportion',seed:202621,
  questions:[QUESTION]};
}
function source(task,context){
 if(!isEvidenceContext(context)||context.sessionId!=='samplevary'||context.index!==0)return false;
 const expected=originalTask();
 return exact(task,Object.keys(expected))&&same(task,expected)&&
  matchesNativeEvidenceTask(task,context,{type:'x-samplelab',nodeId:NODE});
}
// Independent LCG+partial Fisher-Yates; no native draw(), sampleValue() or
// saved board is used to calculate the expected sample. Pool resets each run.
function independentDraws(){
 let seed=202621;
 const runs=[];
 for(let run=0;run<5;run++){
  const pool=Array.from({length:80},(_,i)=>i+1),ids=[];
  for(let i=0;i<20;i++){
   seed=(Math.imul(seed,1664525)+1013904223)>>>0;
   const j=i+Math.floor(seed/4294967296*(pool.length-i));
   [pool[i],pool[j]]=[pool[j],pool[i]];
   ids.push(pool[i]);
  }
  const values=ids.map(id=>(id-1)%10<3?1:0);
  const sum=values.reduce((a,b)=>a+b,0);
  const estimate=Math.round((sum/20*100+Number.EPSILON)*10)/10;
  runs.push({seed,ids,values,n:20,method:'all',estimate,sum});
 }
 return {seed,runs};
}
function event(e,action,fkeys){
 return exact(e,['a','d','f'])&&e.a===action&&exact(e.d,[])&&exact(e.f,fkeys);
}
function historyProof(history,expected){
 if(!Array.isArray(history))return null;
 let i=0,wrong=0,firstRecord=null;
 for(let run=0;run<expected.runs.length;run++){
  if(!event(history[i++],'draw',[]))return null;
  let e=history[i++];
  if(!event(e,'record',['estimate'])||typeof e.f.estimate!=='string')return null;
  if(run===0)firstRecord=structuredClone(e.f);
  const answer=String(expected.runs[run].estimate);
  if(e.f.estimate!==answer){
   // A failed native record is retained. It must be a genuine finite number,
   // followed by a corrected click, without changing the pending sample.
   if(!e.f.estimate.trim()||!Number.isFinite(Number(e.f.estimate)))return null;
   wrong++;
   e=history[i++];
   if(!event(e,'record',['estimate']))return null;
  }
  if(e.f.estimate!==answer)return null;
 }
 return i===history.length?{wrong,firstRecord,drawClicks:5,recordClicks:5+wrong}:null;
}
export function nativeRepeatSamplingBinding(task,context={}){
 return source(task,context)?{position:POSITION,sourceNodeId:NODE,
  populationSize:80,perDrawSize:20,drawCount:5,mode:'proportion',
  syntheticPopulation:true}:null;
}
export function replayNativeRepeatSampling(task,model,context={}){
 try{
  if(!source(task,context)||!model)return null;
  const expected=independentDraws(),fields=native.fields(task);
  if(!exact(model,[...Object.keys(fields),'board','history','issue'])||
   model.issue!==''||!native.valid(task,model)||!native.inspect(task,model).correct||
   !exact(model.board,['first','cursor','seed','pending','runs'])||
   model.board.cursor!==0||model.board.seed!==expected.seed||
   model.board.pending!==null||!Array.isArray(model.board.runs)||
   model.board.runs.length!==5||!same(model.answers,['chance'])||
   model.estimate!==String(expected.runs.at(-1).estimate))return null;
  for(const key of Object.keys(fields)){
   if(!['answers','estimate','prose'].includes(key)&&!same(model[key],fields[key]))return null;
  }
  for(let i=0;i<5;i++){
   const e=expected.runs[i],r=model.board.runs[i];
   if(!exact(r,['seed','ids','values','n','method','estimate'])||
    !same(r,{seed:e.seed,ids:e.ids,values:e.values,n:20,
     method:'all',estimate:e.estimate})||
    new Set(r.ids).size!==20||!r.ids.every(id=>Number.isInteger(id)&&id>=1&&id<=80))return null;
  }
  const h=historyProof(model.history,expected);
  if(!h||!exact(model.board.first,['draw-0','record-0'])||
   !exact(model.board.first['draw-0'],[])||
   !same(model.board.first['record-0'],h.firstRecord))return null;
  const estimates=expected.runs.map(r=>r.estimate);
  return {
   kind:'b21-native-five-repeat-samples',originalPosition:POSITION,
   sourceNodeId:NODE,syntheticPopulation:true,
   sampleCount:5,populationSize:80,sampleSizeEach:20,
   sampleIds:expected.runs.map(r=>[...r.ids]),
   sampleSuccessCounts:expected.runs.map(r=>r.sum),
   samplePercentages:estimates,
   distinctSamplePercentages:new Set(estimates).size,
   observedRangePercentagePoints:Math.max(...estimates)-Math.min(...estimates),
   observedDrawClicks:h.drawClicks,observedRecordClicks:h.recordClicks,
   wrongEstimateThenCorrectionObserved:h.wrong>0,
   allDrawsFromSameSyntheticPopulation:true,
   poolResetBeforeEveryDraw:true,withoutReplacementWithinEachDraw:true,
   noFutureSampleRangeGuarantee:true,
   realRespondentsObserved:false,realWorldPopulationInferred:false,
   freeTextMeaningAssessed:false,longTermMasteryAssessed:false,
   strictAApproved:false
  };
 }catch{return null;}
}
export function submittedNativeRepeatSampling(task,model,record,context={}){
 return latestSubmissionMatches(model,record)?
  replayNativeRepeatSampling(task,model,context):null;
}
