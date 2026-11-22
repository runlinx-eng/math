// #342 P006o: three club-frame and three full-frame native B21 simulated draws.
// Development-only source-locked replay; not formal strict-A evidence or a real survey.
import * as native from './phase5/b21-model.js';
import {isEvidenceContext,matchesNativeEvidenceTask,latestSubmissionMatches,
 hasExactKeys as exact,sameEvidence as same} from './evidence-contract.js';

const NODE='mt_x7V1qrkiqH',POSITION='samplevary:1';
const QUESTION={label:'只抽社团和全体随机抽的差别',value:['bias'],
 options:[['bias','社团抽法偏向运动多的人，不只是偶然抽偏'],
  ['same','两种都叫随机，所以适用范围一样']]};
function originalTask(){
 return {type:'x-samplelab',
  prompt:'先后从同一模拟总体的社团名单和完整名单各抽三次。分清偶然波动与抽法长期偏向。',
  N:800,n:20,runs:6,methods:['club','club','club','all','all','all'],
  mode:'mean',seed:202621,questions:[QUESTION],profile:'exercise'};
}
function source(task,context){
 if(!isEvidenceContext(context)||context.sessionId!=='samplevary'||context.index!==1)return false;
 const expected=originalTask();
 return exact(task,Object.keys(expected))&&same(task,expected)&&
  matchesNativeEvidenceTask(task,context,{type:'x-samplelab',nodeId:NODE});
}
// Independently reconstruct the synthetic frame, PRNG and partial Fisher-Yates.
// LCG seed continues, but each draw restores a full eligible pool.
function independentDraws(){
 let seed=202621;
 const runs=[];
 for(let run=0;run<6;run++){
  const method=run<3?'club':'all';
  const pool=Array.from({length:method==='club'?200:800},(_,i)=>i+1),ids=[];
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
   if(!e.f.estimate.trim()||!Number.isFinite(Number(e.f.estimate)))return null;
   wrong++;
   e=history[i++];
   if(!event(e,'record',['estimate'])||typeof e.f.estimate!=='string')return null;
  }
  if(e.f.estimate!==answer)return null;
 }
 return i===history.length?{wrong,firstRecord,drawClicks:6,recordClicks:6+wrong}:null;
}
export function nativeClubVsAllRepeatsBinding(task,context={}){
 return source(task,context)?{position:POSITION,sourceNodeId:NODE,
  syntheticPopulationSize:800,clubFrameSize:200,sampleSizeEach:20,
  clubDraws:3,allFrameDraws:3,mode:'mean',syntheticPopulation:true}:null;
}
export function replayNativeClubVsAllRepeats(task,model,context={}){
 try{
  if(!source(task,context)||!model)return null;
  const expected=independentDraws(),fields=native.fields(task);
  if(!exact(model,[...Object.keys(fields),'board','history','issue'])||
   model.issue!==''||!native.valid(task,model)||!native.inspect(task,model).correct||
   !exact(model.board,['first','cursor','seed','pending','runs'])||
   model.board.cursor!==0||model.board.seed!==expected.seed||
   model.board.pending!==null||!Array.isArray(model.board.runs)||
   model.board.runs.length!==6||!same(model.answers,['bias'])||
   model.estimate!==String(expected.runs[5].estimate))return null;
  for(const key of Object.keys(fields)){
   if(!['answers','estimate','prose'].includes(key)&&!same(model[key],fields[key]))return null;
  }
  for(let i=0;i<6;i++){
   const e=expected.runs[i],r=model.board.runs[i];
   if(!exact(r,['seed','ids','values','n','method','estimate'])||
    !same(r,{seed:e.seed,ids:e.ids,values:e.values,n:20,
     method:e.method,estimate:e.estimate})||
    new Set(r.ids).size!==20||!r.ids.every(id=>
     Number.isInteger(id)&&id>=1&&id<=(i<3?200:800)))return null;
  }
  const h=historyProof(model.history,expected);
  if(!h||!exact(model.board.first,['draw-0','record-0'])||
   !exact(model.board.first['draw-0'],[])||
   !same(model.board.first['record-0'],h.firstRecord))return null;
  const club=expected.runs.slice(0,3).map(r=>r.estimate);
  const all=expected.runs.slice(3).map(r=>r.estimate);
  return {
   kind:'b21-native-club-vs-all-six-samples',originalPosition:POSITION,
   sourceNodeId:NODE,syntheticPopulation:true,
   populationSize:800,clubFrameSize:200,sampleSizeEach:20,
   methods:['club','club','club','all','all','all'],
   sampleIds:expected.runs.map(r=>[...r.ids]),
   sampleObservedValues:expected.runs.map(r=>[...r.values]),
   sampleMeans:expected.runs.map(r=>r.estimate),
   clubSampleMeans:club,allFrameSampleMeans:all,
   knownSyntheticClubPopulationMean:6.5,knownSyntheticFullPopulationMean:2.75,
   observedDrawClicks:h.drawClicks,observedRecordClicks:h.recordClicks,
   wrongEstimateThenCorrectionObserved:h.wrong>0,
   populationRestoredForEveryDraw:true,withoutReplacementWithinEachDraw:true,
   clubFrameExcludesOther600Members:true,fullFrameIncludesAll800Members:true,
   noSingleSampleGuarantee:true,realRespondentsObserved:false,
   realWorldPopulationInferred:false,freeTextMeaningAssessed:false,
   longTermMasteryAssessed:false,strictAApproved:false
  };
 }catch{return null;}
}
export function submittedNativeClubVsAllRepeats(task,model,record,context={}){
 return latestSubmissionMatches(model,record)?
  replayNativeClubVsAllRepeats(task,model,context):null;
}
