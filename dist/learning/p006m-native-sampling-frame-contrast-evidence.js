// #342 P006m: original B21 sampling-frame contrast. A development candidate only.
// Club vs full-population frame, two native independent draws; never real survey proof.
import * as native from './phase5/b21-model.js';
import {isEvidenceContext,matchesNativeEvidenceTask,latestSubmissionMatches,
  hasExactKeys as exact,sameEvidence as same} from './evidence-contract.js';

const NODE='mt_4zgPzc6yu5', POSITION='fairdraw:1';
const QUESTIONS=[
 {label:'只问运动社团可能怎样偏',value:['high'],
  options:[['high','运动时间可能偏高'],['low','必然偏低']]},
 {label:'更合适的办法',value:['all'],
  options:[['all','从完整名单随机抽'],['easy','只问最方便遇到的人']]}
];
function originalTask(){
 return {type:'x-samplelab',
  prompt:'只从运动社团抽，和从全体名单抽，会看到同样的世界吗？同一个模拟总体，分别试一次。',
  N:800,n:20,runs:2,methods:['club','all'],mode:'mean',seed:202621,
  questions:QUESTIONS,profile:'exercise'};
}
function source(task,context){
 if(!isEvidenceContext(context)||context.sessionId!=='fairdraw'||context.index!==1)return false;
 const expected=originalTask();
 return exact(task,Object.keys(expected))&&same(task,expected)&&
  matchesNativeEvidenceTask(task,context,{type:'x-samplelab',nodeId:NODE});
}
// Independent seeded LCG and Fisher-Yates sampling. No native draw(), sampleValue(),
// b21 grader or stored board is used as the mathematical oracle.
function independentSamples(){
 let seed=202621;
 const runs=[];
 for(const method of ['club','all']){
  const pool=Array.from({length:method==='club'?200:800},(_,i)=>i+1);
  const ids=[];
  for(let i=0;i<20;i++){
   seed=(Math.imul(seed,1664525)+1013904223)>>>0;
   const j=i+Math.floor(seed/4294967296*(pool.length-i));
   [pool[i],pool[j]]=[pool[j],pool[i]];
   ids.push(pool[i]);
  }
  const values=ids.map(id=>id<=200?5+(id-1)%4:(id-1)%4);
  const sum=values.reduce((a,b)=>a+b,0);
  const estimate=Math.round((sum/20+Number.EPSILON)*10)/10;
  runs.push({seed,ids,values,n:20,method,estimate,sum});
 }
 return {seed,runs};
}
const isEvent=(e,a,fkeys)=>exact(e,['a','d','f'])&&e.a===a&&
 exact(e.d,[])&&exact(e.f,fkeys);
function replayHistory(history,expected){
 if(!Array.isArray(history))return null;
 let i=0,wrong=0;
 let firstRecord=null;
 for(const [run,desired] of expected.runs.entries()){
  if(!isEvent(history[i++],'draw',[]))return null;
  let e=history[i++];
  if(!isEvent(e,'record',['estimate'])||typeof e.f.estimate!=='string')return null;
  if(run===0)firstRecord=structuredClone(e.f);
  if(e.f.estimate!==String(desired.estimate)){
   if(!e.f.estimate.trim()||!Number.isFinite(Number(e.f.estimate)))return null;
   wrong++;
   e=history[i++];
   if(!isEvent(e,'record',['estimate']))return null;
  }
  if(e.f.estimate!==String(desired.estimate))return null;
 }
 return i===history.length?{wrong,firstRecord,draws:2,recordClicks:2+wrong}:null;
}
export function nativeSamplingFrameBinding(task,context={}){
 return source(task,context)?{
  position:POSITION,sourceNodeId:NODE,populationSize:800,
  perDrawSampleSize:20,methods:['club','all'],syntheticPopulation:true
 }:null;
}
export function replayNativeSamplingFrames(task,model,context={}){
 try{
  if(!source(task,context)||!model)return null;
  const expected=independentSamples(),fields=native.fields(task);
  if(!exact(model,[...Object.keys(fields),'board','history','issue'])||
   model.issue!==''||!native.valid(task,model)||!native.inspect(task,model).correct||
   !exact(model.board,['first','cursor','seed','pending','runs'])||
   model.board.cursor!==0||model.board.seed!==expected.seed||
   model.board.pending!==null||!Array.isArray(model.board.runs)||
   model.board.runs.length!==2||!same(model.answers,['high','all'])||
   model.estimate!==String(expected.runs[1].estimate))return null;
  for(const k of Object.keys(fields)){
   if(!['answers','estimate','prose'].includes(k)&&!same(model[k],fields[k]))return null;
  }
  for(let i=0;i<2;i++){
   const r=expected.runs[i],record=model.board.runs[i];
   if(!exact(record,['seed','ids','values','n','method','estimate'])||
    !same(record,{seed:r.seed,ids:r.ids,values:r.values,n:20,
     method:r.method,estimate:r.estimate})||
    new Set(record.ids).size!==20||
    (i===0&&!record.ids.every(id=>id>=1&&id<=200))||
    (i===1&&!record.ids.every(id=>id>=1&&id<=800)))return null;
  }
  const h=replayHistory(model.history,expected);
  if(!h||!exact(model.board.first,['draw-0','record-0'])||
   !exact(model.board.first['draw-0'],[])||
   !same(model.board.first['record-0'],h.firstRecord))return null;
  return {
   kind:'b21-native-sampling-frame-contrast',originalPosition:POSITION,
   sourceNodeId:NODE,syntheticPopulation:true,
   methods:['club','all'],sampleSizes:[20,20],
   sampleIds:expected.runs.map(r=>[...r.ids]),
   sampleMeans:expected.runs.map(r=>r.estimate),
   sampleSums:expected.runs.map(r=>r.sum),
   withinGroupFrameRestrictedToClub:true,
   fullFrameAllowsAll800:true,
   distinctSampleIdsWithinEachDraw:true,
   observedDrawClicks:h.draws,observedRecordClicks:h.recordClicks,
   wrongEstimateThenCorrectionObserved:h.wrong>0,
   groupMeanPopulationFrameDifferentByConstruction:true,
   singlePairProvesPopulationBias:false,
   noRealRespondentsObserved:true,unbiasedPopulationInferenceVerified:false,
   freeTextMeaningAssessed:false,longTermMasteryAssessed:false,
   strictAApproved:false
  };
 }catch{return null;}
}
export function submittedNativeSamplingFrames(task,model,record,context={}){
 return latestSubmissionMatches(model,record)?
  replayNativeSamplingFrames(task,model,context):null;
}
