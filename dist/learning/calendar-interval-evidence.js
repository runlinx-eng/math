// #314 source-bound Gregorian interval preflight: NOT an A registration.
// Require original task identity plus real current day/page actions.
import * as b32 from './phase5/b32-model.js';
import {isEvidenceContext,matchesNativeEvidenceTask,hasExactKeys as keys,sameEvidence as same} from './evidence-contract.js';

const NODE='mt_tVvZVWO5d6';
const INDICES=Object.freeze([2,3]);
const safe=Number.isSafeInteger;
const leap=y=>y%4===0&&(y%100!==0||y%400===0);
const monthDays=(y,m)=>[31,leap(y)?29:28,31,30,31,30,31,31,30,31,30,31][m-1];
function civil(s){
 const m=typeof s==='string'&&/^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
 if(!m)return null;
 const y=+m[1],mo=+m[2],d=+m[3];
 if(!safe(y)||y<1600||y>9999||!safe(mo)||mo<1||mo>12||d<1||d>monthDays(y,mo))return null;
 const before=y-1;
 let ordinal=365*before+Math.floor(before/4)-Math.floor(before/100)+Math.floor(before/400);
 for(let k=1;k<mo;k++)ordinal+=monthDays(y,k);
 return {year:y,month:mo,day:d,ordinal:ordinal+d};
}
function descriptor(task,context){
 if(!isEvidenceContext(context)||context.sessionId!=='calendaruse'||!INDICES.includes(context.index)||
    !matchesNativeEvidenceTask(task,context,{type:'x-t32-calendar',nodeId:NODE})||
    !Array.isArray(task.months)||!Array.isArray(task.dates)||task.dates.length!==2||
    !Array.isArray(task.questions)||task.questions.length!==1)return null;
 const [start,end]=task.dates.map(civil);
 if(!start||!end||end.ordinal<=start.ordinal||!Array.isArray(task.questions)||task.questions.length!==1||
    task.questions[0].kind!=='number'||task.questions[0].value!==end.ordinal-start.ordinal)return null;
 const months=task.months.map(x=>Array.isArray(x)&&x.length===2&&safe(x[0])&&safe(x[1])&&x[0]>=1600&&x[0]<=9999&&x[1]>=1&&x[1]<=12?x:null);
 if(months.some(x=>!x)||!task.dates.every(d=>months.some(([y,m])=>d.startsWith(`${y}-${String(m).padStart(2,'0')}`))))return null;
 return {start,end,months,interval:end.ordinal-start.ordinal};
}
export function calendarIntervalBinding(task,context={}){
 const d=descriptor(task,context);
 return d?{nodeId:NODE,kind:'calendar-interval',method:null,
  question:'先亲自标记开始和结束日期；起始日不重复算，跨月和闰日各走过几天？'}:null;
}
export function replayCalendarIntervalEvidence(task,model,context={}){
 try{
  const d=descriptor(task,context);
  if(!d||!keys(model,['hour','minute','jump','prose','answers','board','history','issue'])||
     !Array.isArray(model.answers)||model.answers.length!==1||
     typeof model.answers[0]!=='string'||!/^\s*\+?0*\d+\s*$/.test(model.answers[0])||
     Number(model.answers[0].trim())!==d.interval||
     !Array.isArray(model.history)||model.history.length<2||model.history.length>1200||
     !b32.valid(task,model)||!b32.inspect(task,model).correct||model.issue!=='')return null;
  const board={first:{},bad:false,page:0,selected:[]},events=[],hits=new Set();
  for(const [index,e] of model.history.entries()){
   if(!keys(e,['a','i','v'])||e.v!=='')return null;
   const before={page:board.page,selected:[...board.selected]};
   if(e.a==='page'){
    if(!/^(0|[1-9]\d*)$/.test(e.i)||!safe(+e.i)||+e.i>=d.months.length)return null;
    board.page=+e.i;
   }else if(e.a==='day'){
    const selected=civil(e.i),[y,m]=d.months[board.page];
    if(!selected||selected.year!==y||selected.month!==m)return null;
    const at=board.selected.indexOf(e.i);
    if(at>=0)board.selected.splice(at,1);
    else if(board.selected.length<task.dates.length)board.selected.push(e.i);
    else return null; // Reject hidden no-op claims when selection limit is reached.
    hits.add(e.i);
   }else return null;
   events.push({index,action:e.a,input:e.i,before,after:{page:board.page,selected:[...board.selected]}});
  }
  if(!hits.has(task.dates[0])||!hits.has(task.dates[1])||
     !same([...board.selected].sort(),[...task.dates].sort())||
     !same(board,model.board))return null;
  return {kind:'calendar-interval',nodeId:NODE,sessionId:context.sessionId,index:context.index,
   firstDate:task.dates[0],lastDate:task.dates[1],startSerial:d.start.ordinal,endSerial:d.end.ordinal,
   elapsedDays:d.interval,observedDayClicks:events.filter(e=>e.action==='day').length,
   chronologicalControls:events,originalDateSelectionReplayed:true,
   answerFromCurrentSubmission:true,mentalCountingAssessed:false,learnerMasteryAssessed:false};
 }catch{return null;}
}
