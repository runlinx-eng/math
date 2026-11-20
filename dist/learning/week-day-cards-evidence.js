// #333 WIP: original eight-week-and-three-day card replay.
// Preflight only: not a formal strict-A adapter registration.
// Original cards are tool-provided. Selection cannot prove a learner derived 7 days/week.
import * as native from './phase5/b32-model.js';
import {isEvidenceContext,matchesNativeEvidenceTask,hasExactKeys as keys,sameEvidence as same}
 from './evidence-contract.js';

const SESSION='timeconvert', INDEX=2, NODE='mt_2yas4Unc8o';
const PROMPT='8周和3天，先把每周都换成天。';
const LABELS=Object.freeze([...Array(8).fill('1周'),'3天']);
const QUESTION=Object.freeze([{label:'合起来多少天',value:59,kind:'number'}]);
const parseCard=(s)=>{
 if(typeof s!=='string')return null;
 const match=/^([1-9]\d*)(周|天)$/.exec(s);
 if(!match||!Number.isSafeInteger(Number(match[1])))return null;
 return Number(match[1])*(match[2]==='周'?7:1);
};
const exactIndex=s=>typeof s==='string'&&/^(0|[1-9]\d*)$/.test(s)
 &&Number.isSafeInteger(Number(s))?Number(s):null;
const source=(task,context)=>{
 if(!isEvidenceContext(context)||context.sessionId!==SESSION||context.index!==INDEX||
   !matchesNativeEvidenceTask(task,context,{type:'x-t32-units',nodeId:NODE})||
   !keys(task,['type','prompt','parts','questions'])||task.prompt!==PROMPT||
   !same(task.parts,LABELS.map(label=>({label})))||
   !same(task.questions,QUESTION))return null;
 const days=task.parts.map(p=>parseCard(p.label));
 if(days.some(d=>d===null)||days.reduce((a,b)=>a+b,0)!==59||
    !same(days,[7,7,7,7,7,7,7,7,3]))return null;
 return {days};
};
export function weekDayCardsBinding(task,context={}){
 return source(task,context)?{nodeId:NODE,kind:'week-day-cards',method:null,
  question:'选过哪九张原单位牌？每张“1周”按7天换算，加上3天一共是多少天？'}:null;
}
export function replayWeekDayCardsEvidence(task,model,context={}){
 try{
  const spec=source(task,context);
  if(!spec||!keys(model,['hour','minute','jump','prose','answers','board','history','issue'])||
    model.hour!=='12'||model.minute!=='0'||model.jump!==''||model.issue!==''||
    typeof model.prose!=='string'||model.prose.length>1200||
    !same(model.answers,['59'])||!Array.isArray(model.history)||
    model.history.length<9||model.history.length>1200||
    !native.valid(task,model)||!native.inspect(task,model).correct)return null;
  const selected=[],picked=new Set(),events=[];
  for(const [at,e] of model.history.entries()){
   if(!keys(e,['a','i','v'])||e.a!=='unit'||e.v!=='')return null;
   const i=exactIndex(e.i);
   if(i===null||i>=9)return null;
   const before=[...selected],atIndex=selected.indexOf(i);
   if(atIndex<0){selected.push(i);picked.add(i);}
   else selected.splice(atIndex,1);
   selected.sort((a,b)=>a-b);
   events.push({at,index:i,kind:atIndex<0?'select':'unselect',label:LABELS[i],
    days:spec.days[i],before,after:[...selected]});
  }
  const all=[0,1,2,3,4,5,6,7,8];
  const board={first:{},bad:false,selected:all};
  if(picked.size!==9||!same(selected,all)||!same(model.board,board))return null;
  return {kind:'week-day-cards',nodeId:NODE,sessionId:SESSION,index:INDEX,
   originalCardDays:[...spec.days],observedEvents:events,
   selectedOriginalCardIndices:all,totalDays:spec.days.reduce((a,b)=>a+b,0),
   sourceUnitNormalizationVerified:true,originalCardsToolProvided:true,
   learnerUnitConversionDerivationAssessed:false,
   independentExplanationAssessed:false,learnerMasteryAssessed:false,method:null};
 }catch{return null;}
}
