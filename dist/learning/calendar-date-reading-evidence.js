// #329: preflight ONLY; not registered for formal A until full native acceptance.
// Observe original B32 day selections, independently check civil date/weekdays.
import * as native from './phase5/b32-model.js';
import {isEvidenceContext,matchesNativeEvidenceTask,hasExactKeys as keys,sameEvidence as same} from './evidence-contract.js';

const NODE='mt_tVvZVWO5d6';
const CASES=Object.freeze({
 0:{date:'2026-03-15',expected:'sun',kind:'choice',weekday:0},
 1:{date:'2026-03-18',expected:18,kind:'number',weekday:3}
});
const isIndex=s=>typeof s==='string'&&/^(0|[1-9][0-9]*)$/.test(s)&&Number.isSafeInteger(Number(s));
const isCivil=s=>typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s);
// Independent proleptic Gregorian arithmetic; Sunday=0. Do not use displayed weekday.
function civil(s){
 if(!isCivil(s))return null;
 const [y,m,d]=s.split('-').map(Number);
 if(y<1600||y>9999||m<1||m>12)return null;
 const leap=y%4===0&&(y%100!==0||y%400===0);
 const days=[31,leap?29:28,31,30,31,30,31,31,30,31,30,31];
 if(d<1||d>days[m-1])return null;
 const offsets=[0,3,2,5,0,3,5,1,4,6,2,4];
 const year=m<3?y-1:y;
 const weekday=(year+Math.floor(year/4)-Math.floor(year/100)+Math.floor(year/400)+offsets[m-1]+d)%7;
 return {year:y,month:m,day:d,weekday};
}
function descriptor(task,context){
 if(!isEvidenceContext(context)||context.sessionId!=='calendaruse')return null;
 const c=CASES[context.index];
 if(!c||!matchesNativeEvidenceTask(task,context,{type:'x-t32-calendar',nodeId:NODE})||
    !keys(task,['type','prompt','months','dates','questions'])||
    !same(task.months,[[2026,3]])||!same(task.dates,[c.date])||
    !Array.isArray(task.questions)||task.questions.length!==1||
    !keys(task.questions[0],c.kind==='choice'?['label','value','kind','options']:['label','value','kind'])||
    task.questions[0].kind!==c.kind||task.questions[0].value!==c.expected)return null;
 const date=civil(c.date);
 return date?.weekday===c.weekday?{...c,dateInfo:date}:null;
}
export function calendarDateReadingBinding(task,context={}){
 const c=descriptor(task,context);
 return c?{nodeId:NODE,kind:'calendar-date-reading',method:null,
  question:'你在日历上实际选了哪一天？年月、日期和星期怎样对应？'}:null;
}
export function replayCalendarDateReadingEvidence(task,model,context={}){
 try{
  const c=descriptor(task,context);
  if(!c||!keys(model,['hour','minute','jump','prose','answers','board','history','issue'])||
     model.hour!=='12'||model.minute!=='0'||model.jump!==''||
     typeof model.prose!=='string'||model.issue!==''||
     !Array.isArray(model.answers)||model.answers.length!==1||
     (c.kind==='choice'?model.answers[0]!=='sun':
      typeof model.answers[0]!=='string'||!/^\s*\+?0*18\s*$/.test(model.answers[0]))||
     !Array.isArray(model.history)||model.history.length<1||model.history.length>1200||
     !native.valid(task,model)||!native.inspect(task,model).correct)return null;
  const board={first:{},bad:false,page:0,selected:[]};
  const events=[],visited=[];
  for(const [at,e]of model.history.entries()){
   if(!keys(e,['a','i','v'])||e.v!=='')return null;
   const before={page:board.page,selected:[...board.selected]};
   if(e.a==='page'){
    if(!isIndex(e.i)||Number(e.i)!==0)return null;
    board.page=0;
   }else if(e.a==='day'){
    const date=civil(e.i);
    if(!date||date.year!==2026||date.month!==3)return null;
    visited.push(e.i);
    const pos=board.selected.indexOf(e.i);
    if(pos>=0)board.selected.splice(pos,1);
    else if(board.selected.length<1)board.selected.push(e.i);
    else return null; // Do not claim an ignored over-capacity click was a selection.
   }else return null;
   events.push({at,action:e.a,input:e.i,before,after:{page:board.page,selected:[...board.selected]}});
  }
  if(!visited.includes(c.date)||!same(board.selected,[c.date])||!same(board,model.board))return null;
  return {kind:'calendar-date-reading',nodeId:NODE,sessionId:context.sessionId,index:context.index,
   selectedDate:c.date,dayOfMonth:c.dateInfo.day,gregorianWeekday:c.dateInfo.weekday,
   weekdayLabel:['星期日','星期一','星期二','星期三','星期四','星期五','星期六'][c.dateInfo.weekday],
   observedDateClicks:visited.length,chronologicalControls:events,
   originalDateSelectionReplayed:true,weekdayCalculatedIndependently:true,
   dateCardsToolProvided:true,learnerWeekdayDerivationAssessed:false,
   independentExplanationAssessed:false,learnerMasteryAssessed:false};
 }catch{return null;}
}
