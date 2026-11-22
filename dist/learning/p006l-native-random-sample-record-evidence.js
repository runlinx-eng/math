// #342 P006l: B21 native random-sample draw -> one recorded estimate.
// Two original positions share the event invariant, not a claim of real-world sampling.
import * as native from './phase5/b21-model.js';
import {isEvidenceContext,matchesNativeEvidenceTask,latestSubmissionMatches,
 hasExactKeys as exact,sameEvidence as same} from './evidence-contract.js';

const QUESTIONS0=[
 {label:'想了解的全体有几人',value:800},
 {label:'实际抽到几人',value:40},
 {label:'为什么只问一部分',value:['cost'],
  options:[['cost','节省时间，但估计仍有不确定'],['exact','40人的结果一定等于800人']]}
];
const QUESTIONS2=[
 {label:'抽到不均衡说明',value:['chance'],
  options:[['chance','可能只是这一次的偶然，不等于抽法不公平'],['wrong','必然有人操纵结果']]},
 {label:'随机和随便找人的差别',value:['frame'],
  options:[['frame','随机从完整名单抽，方便碰见的人未必人人有机会'],['same','两者一样']]}
];
const SOURCES=[
 {index:0,node:'mt_4zgPzc6yu5',prompt:'全体800人里抽40人了解每周运动时间。先选完整名单，再实际抽一次。',
  N:800,n:40,mode:'mean',profile:'exercise',questions:QUESTIONS0,answerStrings:['800','40','cost']},
 {index:2,node:'mt_4zgPzc6yu5',prompt:'随机抽10人，看看两组各来几位。公平的抽法也可能抽得不均衡。',
  N:80,n:10,mode:'proportion',questions:QUESTIONS2,answerStrings:['chance','frame']}
];
function originalTask(s){
 const t={type:'x-samplelab',prompt:s.prompt,N:s.N,n:s.n,runs:1,
  methods:['all'],mode:s.mode,seed:202621,questions:s.questions};
 if(s.profile)t.profile=s.profile;
 return t;
}
function source(task,context){
 if(!isEvidenceContext(context)||context.sessionId!=='fairdraw')return null;
 const s=SOURCES.find(v=>v.index===context.index);
 if(!s)return null;
 const expected=originalTask(s);
 return exact(task,Object.keys(expected))&&same(task,expected)&&
  matchesNativeEvidenceTask(task,context,{type:'x-samplelab',nodeId:s.node})?s:null;
}
// Independent reimplementation of the native LCG + without-replacement draw.
// Never substitute B21 grader, b21.draw(), or task model.board as the oracle.
function independentSample(s){
 let state=202621;const pool=Array.from({length:s.N},(_,i)=>i+1);
 const ids=[];
 for(let i=0;i<s.n;i++){
  state=(Math.imul(state,1664525)+1013904223)>>>0;
  const j=i+Math.floor(state/4294967296*(pool.length-i));
  [pool[i],pool[j]]=[pool[j],pool[i]];
  ids.push(pool[i]);
 }
 const values=ids.map(id=>s.profile==='exercise'?
  (id-1<s.N/4?5+(id-1)%4:(id-1)%4):((id-1)%10<3?1:0));
 const total=values.reduce((a,b)=>a+b,0);
 const estimate=Math.round((total/s.n*(s.mode==='proportion'?100:1)+Number.EPSILON)*10)/10;
 return {seed:state,ids,values,n:s.n,method:'all',estimate,total};
}
export function nativeSampleBinding(task,context={}){
 const s=source(task,context);
 return s?{position:'fairdraw:'+s.index,sourceNodeId:s.node,
  populationSize:s.N,sampleSize:s.n,metric:s.mode,syntheticPopulation:true}:null;
}
export function replayNativeSample(task,model,context={}){
 try{
  const s=source(task,context);
  if(!s||!model)return null;
  const expected=independentSample(s);
  const fields=native.fields(task),keys=Object.keys(fields);
  if(!exact(model,[...keys,'board','history','issue'])||
     model.issue!==''||!native.valid(task,model)||
     !native.inspect(task,model).correct||
     !exact(model.board,['first','cursor','seed','pending','runs'])||
     model.board.cursor!==0||model.board.seed!==expected.seed||
     model.board.pending!==null||!Array.isArray(model.board.runs)||
     model.board.runs.length!==1||
     !exact(model.board.runs[0],['seed','ids','values','n','method','estimate'])||
     !same(model.board.runs[0],{
      seed:expected.seed,ids:expected.ids,values:expected.values,n:s.n,
      method:'all',estimate:expected.estimate
     })||!same(model.answers,s.answerStrings)||
     model.estimate!==String(expected.estimate))return null;
  for(const k of keys){
   if(!['answers','estimate','prose'].includes(k)&&!same(model[k],fields[k]))return null;
  }
  const history=model.history;
  if(!Array.isArray(history)||![2,3].includes(history.length))return null;
  for(const e of history)if(!exact(e,['a','d','f'])||!exact(e.d,[]))return null;
  const first=history[0];
  if(first.a!=='draw'||!exact(first.f,[]))return null;
  let wrongRecorded=false;
  for(let i=1;i<history.length;i++){
   const e=history[i];
   if(e.a!=='record'||!exact(e.f,['estimate'])||typeof e.f.estimate!=='string')return null;
   if(i<history.length-1){
    if(e.f.estimate===String(expected.estimate)||
       !Number.isFinite(Number(e.f.estimate)))return null;
    wrongRecorded=true;
   }else if(e.f.estimate!==String(expected.estimate))return null;
  }
  if(!exact(model.board.first,['draw-0','record-0'])||
     !exact(model.board.first['draw-0'],[])||
     !same(model.board.first['record-0'],history[1].f))return null;
  return {kind:'b21-native-random-sample-record',originalPosition:'fairdraw:'+s.index,
   sourceNodeId:s.node,populationSize:s.N,sampleSize:s.n,
   sampleIds:[...expected.ids],sampleValues:[...expected.values],
   withoutReplacement:new Set(expected.ids).size===s.n,
   recordedSum:expected.total,recordedEstimate:expected.estimate,
   estimateType:s.mode==='mean'?'sample-mean':'sample-percent',
   observedDrawClicks:1,observedRecordClicks:history.length-1,
   wrongEstimateThenCorrectionObserved:wrongRecorded,
   observedOriginalCheck:false,syntheticPopulation:true,
   actualRespondentsObserved:false,populationEstimateExact:false,
   individualGroupCountsNotEqualsTargetPercent:s.index===2,
   sourceInferenceLimited:true,freeTextMeaningAssessed:false,
   realSamplingMethodEvaluated:false,longTermMasteryAssessed:false,
   strictAApproved:false};
 }catch{return null;}
}
export function submittedNativeSample(task,model,record,context={}){
 return latestSubmissionMatches(model,record)?replayNativeSample(task,model,context):null;
}
