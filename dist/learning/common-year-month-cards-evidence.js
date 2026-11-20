// #335 PRE-REVIEW only. This module does not grant formal strict A.
// The task supplies all month lengths; toggling those labels is not independent derivation.
import * as native from './phase5/b32-model.js';
import {isEvidenceContext,matchesNativeEvidenceTask,hasExactKeys as keys,sameEvidence as same}
 from './evidence-contract.js';

const SESSION='calendarfacts',INDEX=1,NODE='mt_EXlmTURK_o';
const PROMPT='查看平年各月的天数。';
const MONTH_DAYS=Object.freeze([31,28,31,30,31,30,31,31,30,31,30,31]);
const PARTS=MONTH_DAYS.map((days,i)=>({label:`${i+1}月${days}天`}));
const QUESTIONS=Object.freeze([
 {label:'4月有多少天',value:30,kind:'number'},
 {label:'平年2月有多少天',value:28,kind:'number'}
]);
const indexOf=e=>{
 if(typeof e!=='string'||!/^(0|[1-9][0-9]*)$/.test(e))return null;
 const n=Number(e);return Number.isSafeInteger(n)&&n<12?n:null;
};
function source(task,context){
 if(!isEvidenceContext(context)||context.sessionId!==SESSION||context.index!==INDEX||
   !matchesNativeEvidenceTask(task,context,{type:'x-t32-units',nodeId:NODE})||
   !keys(task,['type','prompt','parts','questions'])||
   task.prompt!==PROMPT||!same(task.parts,PARTS)||!same(task.questions,QUESTIONS))return null;
 if(MONTH_DAYS.reduce((sum,d)=>sum+d,0)!==365)return null;
 return {days:MONTH_DAYS};
}
export function commonYearMonthCardsBinding(task,context={}){
 return source(task,context)?{nodeId:NODE,kind:'common-year-month-cards',method:null,
  question:'按月份分别核对原本给出的12张平年月份天数牌。'}:null;
}
export function replayCommonYearMonthCardsEvidence(task,model,context={}){
 try{
  const spec=source(task,context);
  if(!spec||!keys(model,['hour','minute','jump','prose','answers','board','history','issue'])||
   model.hour!=='12'||model.minute!=='0'||model.jump!==''||model.issue!==''||
   typeof model.prose!=='string'||model.prose.length>1200||
   !same(model.answers,['30','28'])||!Array.isArray(model.history)||
   model.history.length<12||model.history.length>1200||
   !native.valid(task,model)||!native.inspect(task,model).correct)return null;
  const selected=[],seen=new Set(),events=[];
  for(const [at,e] of model.history.entries()){
   if(!keys(e,['a','i','v'])||e.a!=='unit'||e.v!=='')return null;
   const i=indexOf(e.i);if(i===null)return null;
   const before=[...selected],j=selected.indexOf(i);
   if(j<0){selected.push(i);seen.add(i);}else selected.splice(j,1);
   selected.sort((a,b)=>a-b);
   events.push({at,index:i,kind:j<0?'select':'unselect',month:i+1,days:spec.days[i],
    before,after:[...selected]});
  }
  const all=Array.from({length:12},(_,i)=>i);
  if(seen.size!==12||!same(selected,all)||
   !same(model.board,{first:{},bad:false,selected:all}))return null;
  return {kind:'common-year-month-cards',nodeId:NODE,sessionId:SESSION,index:INDEX,
   observedEvents:events,selectedOriginalCardIndices:all,
   suppliedMonthDays:[...spec.days],suppliedMonthDaysTotal:365,
   aprilDays:30,commonYearFebruaryDays:28,sourceMonthFactsVerified:true,
   // The native widget only tracks toggles of cards with answers already printed.
   // This replay cannot establish which card answered which question or any 365-day calculation.
   monthSpecificLookupStepsObserved:false,learnerComputedAnnualDaysAssessed:false,
   strictAApproved:false,preReviewOnly:true,
   originalCardsToolProvided:true,learnerIndependentMonthDayDerivationAssessed:false,
   leapYearRuleAssessed:false,independentExplanationAssessed:false,
   learnerMasteryAssessed:false,method:null};
 }catch{return null;}
}
