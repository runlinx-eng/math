// #342 P006d: original B19 COUNTIF over bounded simulated answer rows; dev-only.
import * as native from './phase5/b19-model.js';
import {isEvidenceContext,matchesNativeEvidenceTask,latestSubmissionMatches,
 hasExactKeys as exact,sameEvidence as same} from './evidence-contract.js';

const CASES=[
 {id:'digitalstudy',index:2,node:'mt_yrvYKSwSRZ',
  task:{type:'x-datacount',labels:['足球','游泳','羽毛球'],counts:[3,3,2],
   prompt:'另一次模拟投票出现并列。用COUNTIF计算，不能只挑一个“最多”。',
   unit:'份回答',compare:[0,1],
   raw:['足球','游泳','足球','羽毛球','游泳','足球','羽毛球','游泳'],
   formula:true,extremes:true}},
 {id:'checkrecords',index:2,node:'mt_QHT16CrFO-',
  task:{type:'x-datacount',labels:['红','蓝','绿'],counts:[2,3,2],
   prompt:'清理后有7条可计入的颜色回答，还有1条未知。用公式重新计算；未知不能被补成任何颜色。',
   unit:'份回答',compare:[0,1],
   raw:['红','蓝','绿','红','蓝','绿','蓝'],formula:true,extremes:true,unknown:1}}
];
const sorted=x=>x.slice().sort((a,b)=>a-b);
export function nativeCountifRecordBinding(task,context={}){
 if(!isEvidenceContext(context))return null;
 const spec=CASES.find(s=>s.id===context.sessionId&&s.index===context.index);
 if(!spec||!matchesNativeEvidenceTask(task,context,{type:'x-datacount',nodeId:spec.node})||
    !exact(task,Object.keys(spec.task))||!same(task,spec.task))return null;
 return {position:spec.id+':'+spec.index,nodeId:spec.node,
  rawCount:spec.task.raw.length,unknownExcluded:spec.task.unknown||0};
}
export function replayNativeCountifRecord(task,model,context={}){
 try{
  const binding=nativeCountifRecordBinding(task,context);
  if(!binding||!model||!exact(model,[...Object.keys(native.fieldValues(task)),
      'board','history','issue'])||!exact(model.board,['first','counts','pairs','max','min'])||
     !same(model.board.first,{})||model.issue!==''||
     !native.valid(task,model)||!native.inspect(task,model).correct||
     !Array.isArray(model.history))return null;
  const independentCounts=task.labels.map(label=>task.raw.filter(v=>v===label).length);
  if(task.raw.some(v=>!task.labels.includes(v))||!same(independentCounts,task.counts))return null;
  const total=task.raw.length;
  const gap=Math.abs(independentCounts[task.compare[0]]-independentCounts[task.compare[1]]);
  const rows=task.raw.map(v=>[v]),end=String(total+1);
  if(!Array.isArray(model.formulas)||model.formulas.length!==task.labels.length)return null;
  for(let i=0;i<task.labels.length;i++){
   const parsed=native.countIf(model.formulas[i],rows,0);
   if(!parsed||!parsed.full||parsed.condition!==task.labels[i]||
      parsed.value!==independentCounts[i])return null;
  }
  const defaults=native.fieldValues(task),keys=Object.keys(defaults);
  const finalFields={...defaults,formulas:model.formulas,total:String(total),gap:String(gap),
   unknown:task.unknown?String(task.unknown):''};
  if(!keys.every(k=>same(model[k],finalFields[k])))return null;
  const eventFields={...defaults,formulas:model.formulas};
  const maxExpected=native.extremes(independentCounts,'max'),
   minExpected=native.extremes(independentCounts,'min');
  if(model.history.length!==maxExpected.length+minExpected.length)return null;
  const chosenMax=[],chosenMin=[];
  for(const e of model.history){
   if(!exact(e,['a','d','f'])||!exact(e.d,['index'])||
      !exact(e.f,keys)||!keys.every(k=>same(e.f[k],eventFields[k]))||
      !/^(0|[1-9][0-9]*)$/.test(e.d.index))return null;
   const i=Number(e.d.index);
   if(!Number.isSafeInteger(i))return null;
   if(e.a==='max'&&maxExpected.includes(i)&&!chosenMax.includes(i))chosenMax.push(i);
   else if(e.a==='min'&&minExpected.includes(i)&&!chosenMin.includes(i))chosenMin.push(i);
   else return null;
  }
  if(model.board.pairs!==0||!same(model.board.counts,task.counts.map(()=>0))||
     !same(sorted(chosenMax),maxExpected)||!same(sorted(chosenMin),minExpected)||
     !same(model.board.max,maxExpected)||!same(model.board.min,minExpected))return null;
  return {kind:'b19-original-countif-full-column',
   originalPosition:binding.position,sourceNodeId:binding.nodeId,
   originalRawRows:total,fullRange:'B2:B'+end,
   independentCounts,independentTotal:total,independentCategoryGap:gap,
   originalMaxSelections:sorted(chosenMax),originalMinSelections:sorted(chosenMin),
   unknownRecordsExcluded:binding.unknownExcluded,
   formulasBoundToAllOriginalRows:true,correctedHistoricalRowsObserved:false,
   actualChildrenSurveyed:false,realResponseIdentityVerified:false,
   outsideSampleInferenceAssessed:false,longTermMasteryAssessed:false,
   strictAApproved:false};
 }catch{return null;}
}
export function submittedNativeCountifRecord(task,model,record,context={}){
 return latestSubmissionMatches(model,record)?replayNativeCountifRecord(task,model,context):null;
}
