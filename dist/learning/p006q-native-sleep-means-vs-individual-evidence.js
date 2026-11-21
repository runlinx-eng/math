// #342 P006q: observed synthetic individual sleep hours versus five sample means.
// Development-only, original-source-locked B21 replay; not formal A or a field survey.
import * as native from './phase5/b21-model.js';
import {isEvidenceContext,matchesNativeEvidenceTask,latestSubmissionMatches,
 hasExactKeys as exact,sameEvidence as same} from './evidence-contract.js';

const POSITION='samplevary:3',NODE='mt_x7V1qrkiqH';
const QUESTION={label:'样本均值的变化与个体变化',value:['different'],
 options:[['different','不是一回事，均值通常没个体值散得那么开'],
  ['same','均值范围就是所有人的范围']]};
function originalTask(){
 return {type:'x-samplelab',
  prompt:'每个人的睡眠时间和每次样本的平均，是两种不同的变化。保留两把同单位的尺来比较。',
  N:120,n:20,runs:5,methods:['all'],mode:'mean',seed:202621,
  questions:[QUESTION],profile:'sleep'};
}
function source(task,context){
 if(!isEvidenceContext(context)||context.sessionId!=='samplevary'||context.index!==3)return false;
 const expected=originalTask();
 return exact(task,Object.keys(expected))&&same(task,expected)&&
  matchesNativeEvidenceTask(task,context,{type:'x-samplelab',nodeId:NODE});
}
// Independent reproduction of each original seeded, within-draw non-replacement
// sample. The pool is reconstructed for every draw, while the seed continues.
// Do not use native.draw(), native.sampleValue() or a saved board for arithmetic.
function independentDraws(){
 let seed=202621;
 const population=Array.from({length:120},(_,i)=>6+i%6);
 const runs=[];
 for(let k=0;k<5;k++){
  const pool=Array.from({length:120},(_,i)=>i+1),ids=[];
  for(let i=0;i<20;i++){
   seed=(Math.imul(seed,1664525)+1013904223)>>>0;
   const j=i+Math.floor(seed/4294967296*(120-i));
   [pool[i],pool[j]]=[pool[j],pool[i]];
   ids.push(pool[i]);
  }
  const values=ids.map(id=>population[id-1]);
  const sum=values.reduce((a,b)=>a+b,0);
  const estimate=Math.round((sum/20+Number.EPSILON)*10)/10;
  runs.push({seed,ids,values,n:20,method:'all',estimate,sum});
 }
 return {seed,population,runs};
}
function event(e,action,fkeys){
 return exact(e,['a','d','f'])&&e.a===action&&exact(e.d,[])&&exact(e.f,fkeys);
}
function historyProof(history,expected){
 if(!Array.isArray(history))return null;
 let i=0,wrong=0,firstRecord=null;
 for(let k=0;k<5;k++){
  if(!event(history[i++],'draw',[]))return null;
  let e=history[i++];
  if(!event(e,'record',['estimate'])||typeof e.f.estimate!=='string')return null;
  if(k===0)firstRecord=structuredClone(e.f);
  const target=expected.runs[k].estimate,answer=String(target);
  if(e.f.estimate!==answer){
   // A genuine wrong record leaves the pending draw unchanged; an alternate
   // formatting of the correct number is not evidence of a wrong attempt.
   if(!e.f.estimate.trim()||!Number.isFinite(Number(e.f.estimate))||
    Math.abs(Number(e.f.estimate)-target)<1e-7)return null;
   wrong++;
   e=history[i++];
   if(!event(e,'record',['estimate']))return null;
  }
  if(e.f.estimate!==answer)return null;
 }
 return i===history.length?{wrong,firstRecord,drawClicks:5,recordClicks:5+wrong}:null;
}
export function nativeSleepMeansBinding(task,context={}){
 return source(task,context)?{
  position:POSITION,sourceNodeId:NODE,populationSize:120,
  syntheticIndividualMinHours:6,syntheticIndividualMaxHours:11,
  syntheticPopulationMeanHours:8.5,sampleSizeEach:20,
  drawCount:5,mode:'mean',profile:'sleep',syntheticPopulation:true
 }:null;
}
export function replayNativeSleepMeans(task,model,context={}){
 try{
  if(!source(task,context)||!model)return null;
  const expected=independentDraws(),defaults=native.fields(task);
  if(!exact(model,[...Object.keys(defaults),'board','history','issue'])||
   model.issue!==''||!native.valid(task,model)||!native.inspect(task,model).correct||
   !exact(model.board,['first','cursor','seed','pending','runs'])||
   model.board.cursor!==0||model.board.seed!==expected.seed||
   model.board.pending!==null||!Array.isArray(model.board.runs)||
   model.board.runs.length!==5||!same(model.answers,['different'])||
   model.estimate!==String(expected.runs[4].estimate))return null;
  // Unused UI fields must stay at their original defaults. Prose is an
  // unassessed free-text field and cannot count as proof of understanding.
  for(const key of Object.keys(defaults)){
   if(!['answers','estimate','prose'].includes(key)&&!same(model[key],defaults[key]))return null;
  }
  for(let k=0;k<5;k++){
   const r=model.board.runs[k],e=expected.runs[k];
   if(!exact(r,['seed','ids','values','n','method','estimate'])||
    !same(r,{seed:e.seed,ids:e.ids,values:e.values,n:20,
     method:'all',estimate:e.estimate})||
    new Set(r.ids).size!==20||
    !r.ids.every(id=>Number.isInteger(id)&&id>=1&&id<=120))return null;
  }
  const h=historyProof(model.history,expected);
  if(!h||!exact(model.board.first,['draw-0','record-0'])||
   !exact(model.board.first['draw-0'],[])||
   !same(model.board.first['record-0'],h.firstRecord))return null;
  const individual=expected.population,means=expected.runs.map(r=>r.estimate);
  const imin=Math.min(...individual),imax=Math.max(...individual);
  const mmin=Math.min(...means),mmax=Math.max(...means);
  // This is a comparison of the original synthetic population's individual
  // values and this one observed set of five sample averages; it neither
  // proves a general per-sample bound nor the learner's explanation.
  return {
   kind:'b21-native-sleep-individual-vs-sample-means',
   originalPosition:POSITION,sourceNodeId:NODE,
   syntheticPopulation:true,populationSize:120,sampleSizeEach:20,sampleCount:5,
   syntheticIndividualRangeHours:[imin,imax],
   syntheticIndividualSpreadHours:imax-imin,
   syntheticPopulationMeanHours:individual.reduce((a,b)=>a+b,0)/individual.length,
   syntheticIndividualHoursFrequency:[6,7,8,9,10,11].map(h=>individual.filter(v=>v===h).length),
   sampleIds:expected.runs.map(r=>[...r.ids]),
   sampleTotalHours:expected.runs.map(r=>r.sum),
   sampleMeanHours:means,
   observedSampleMeanRangeHours:[mmin,mmax],
   observedSampleMeanSpreadHours:Math.round((mmax-mmin)*10)/10,
   observedDrawClicks:h.drawClicks,observedRecordClicks:h.recordClicks,
   wrongEstimateThenCorrectionObserved:h.wrong>0,
   poolResetBeforeEveryDraw:true,withoutReplacementWithinEachDraw:true,
   bothRangesUseHours:true,choiceDifferentSelected:true,
   futureSampleMeansConfinedToObservedRange:false,
   individualRangeEqualsSampleMeanRange:false,
   actualSleepRespondentsObserved:false,realWorldPopulationInferred:false,
   individualHoursWereStudentMeasured:false,freeTextMeaningAssessed:false,
   longTermMasteryAssessed:false,strictAApproved:false
  };
 }catch{return null;}
}
export function submittedNativeSleepMeans(task,model,record,context={}){
 return latestSubmissionMatches(model,record)?
  replayNativeSleepMeans(task,model,context):null;
}
