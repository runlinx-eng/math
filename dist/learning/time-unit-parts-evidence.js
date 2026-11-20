// #327 Q06: source-bound time-unit selection preflight. Not an A registration.
import * as native from './phase5/b32-model.js';
import {isEvidenceContext,matchesNativeEvidenceTask,hasExactKeys as keys,sameEvidence as same} from './evidence-contract.js';

// Each card's duration is supplied by the original task. Selection is observed;
// deriving the unit conversion is independent math, not an observed mental strategy.
const SOURCES=Object.freeze({
 'durationunit:2':{node:'mt__N55B7u7HD',labels:['1分钟','1分钟'],seconds:[60,60]},
 'hoursday:0':{node:'mt_2XDGT5tei1',labels:['15分钟','15分钟','15分钟','15分钟'],seconds:[900,900,900,900]},
 'hoursday:1':{node:'mt_2XDGT5tei1',labels:['第一轮12小时','第二轮12小时'],seconds:[43200,43200]},
 'hoursday:2':{node:'mt_2XDGT5tei1',labels:['60分钟','30分钟'],seconds:[3600,1800]},
 'timeconvert:0':{node:'mt_2yas4Unc8o',labels:['1小时','1小时','1小时','25分钟'],seconds:[3600,3600,3600,1500]},
 'timeconvert:1':{node:'mt_2yas4Unc8o',labels:['60秒','60秒','30秒'],seconds:[60,60,30]},
 'calendarfacts:0':{node:'mt_EXlmTURK_o',labels:['15秒','15秒','15秒','15秒'],seconds:[15,15,15,15]}
});
const exactInteger=s=>typeof s==='string'&&/^\\s*\\+?0*\\d+\\s*$/.test(s)&&
 Number.isSafeInteger(Number(s.trim()));
function sourceFor(task,context){
 if(!isEvidenceContext(context))return null;
 const source=SOURCES[context.sessionId+':'+context.index];
 if(!source||!matchesNativeEvidenceTask(task,context,{type:'x-t32-units',nodeId:source.node})||
    !keys(task,['type','prompt','parts','questions'])||
    !Array.isArray(task.parts)||!same(task.parts,source.labels.map(label=>({label})))||
    !Array.isArray(task.questions))return null;
 const sum=source.seconds.reduce((a,b)=>a+b,0);
 const k=context.sessionId+':'+context.index;
 const expected=k==='durationunit:2'?[sum/60,sum]:
   k==='hoursday:0'?[sum/60]:
   k==='hoursday:1'?[sum/3600]:
   k==='hoursday:2'?[Math.floor(sum/3600),(sum%3600)/60]:
   k==='timeconvert:0'?[sum/60]:
   k==='timeconvert:1'?[Math.floor(sum/60),sum%60]:[sum/60];
 if(!same(task.questions.map(q=>q?.value),expected)||
    !task.questions.every(q=>keys(q,['label','value','kind'])&&q.kind==='number'&&
       Number.isSafeInteger(q.value)))return null;
 return {...source,expected,sum};
}
export function timeUnitPartsBinding(task,context={}){
 const source=sourceFor(task,context);
 return source?{nodeId:source.node,kind:'time-unit-parts',method:null,
  question:'这些由题目给出的时间段都选齐了吗？换单位时整份与余数怎样对应？'}:null;
}
export function replayTimeUnitPartsEvidence(task,model,context={}){
 try{
  const source=sourceFor(task,context);
  if(!source||!keys(model,['hour','minute','jump','prose','answers','board','history','issue'])||
     model.hour!=='12'||model.minute!=='0'||model.jump!==''||
     typeof model.prose!=='string'||model.issue!==''||
     !Array.isArray(model.answers)||model.answers.length!==source.expected.length||
     !model.answers.every((answer,i)=>exactInteger(answer)&&Number(answer.trim())===source.expected[i])||
     !Array.isArray(model.history)||model.history.length<source.labels.length||
     model.history.length>1200||!native.valid(task,model)||
     !native.inspect(task,model).correct)return null;
  const board={first:{},bad:false,selected:[]},events=[];
  for(const [at,event] of model.history.entries()){
   if(!keys(event,['a','i','v'])||event.a!=='unit'||event.v!==''||
      typeof event.i!=='string'||!/^(0|[1-9]\\d*)$/.test(event.i))return null;
   const index=Number(event.i);
   if(!Number.isSafeInteger(index)||index<0||index>=source.labels.length)return null;
   const before=[...board.selected],old=board.selected.indexOf(index);
   if(old>=0)board.selected.splice(old,1);
   else board.selected.push(index);
   board.selected.sort((a,b)=>a-b);
   events.push({at,index,label:source.labels[index],
     seconds:source.seconds[index],action:old>=0?'unselect':'select',
     before,after:[...board.selected]});
  }
  if(!same(board,model.board)||
     !same(board.selected,source.labels.map((_,i)=>i)))return null;
  const selectedSeconds=board.selected.reduce((sum,i)=>sum+source.seconds[i],0);
  if(selectedSeconds!==source.sum)return null;
  return {kind:'time-unit-parts',sessionId:context.sessionId,index:context.index,
   nodeId:source.node,sourceCards:source.labels.map((label,i)=>({label,seconds:source.seconds[i]})),
   totalSeconds:selectedSeconds,totalMinutes:selectedSeconds/60,
   expectedAnswers:[...source.expected],controlEvents:events,
   selectedOriginalCardIdentities:[...board.selected],
   lastSelectionReplayed:true,presetCardsAreToolProvided:true,
   independentCalculationAssessed:false,independentExplanationAssessed:false,
   learnerMasteryAssessed:false};
 }catch{return null;}
}
