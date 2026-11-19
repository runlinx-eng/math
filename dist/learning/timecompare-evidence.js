// #273/B32 stage 1: independently replay six existing native time comparisons.
// Only bounded virtual guess/reveal/choice events, never mastery or real timing.
import * as original from './phase5/b32-model.js';
import {LESSONS} from './catalog.js';
import {matchesNativeEvidenceTask,hasExactKeys as keys} from './evidence-contract.js';

const TYPE='x-t32-compare';
const SOURCES=Object.freeze({
 timecompare:Object.freeze([0,1,2]),
 durationorder:Object.freeze([1]),
 durationwork:Object.freeze([1]),
 minuteclock:Object.freeze([2])
});
const choices=new Set(['left','right','equal']);
const safeTime=n=>Number.isSafeInteger(n)&&n>=0&&n<=1440;
const text=x=>typeof x==='string'&&x.length<=1200;
const dense=x=>Array.isArray(x)&&Object.keys(x).length===x.length;

function getSource(task,context){
 if(!context||typeof context.sessionId!=='string'||
    !Object.hasOwn(SOURCES,context.sessionId)||
    !SOURCES[context.sessionId].includes(context.index))return null;
 const nodeId=LESSONS[context.sessionId]?.topicId;
 return nodeId&&matchesNativeEvidenceTask(task,context,{type:TYPE,nodeId})?nodeId:null;
}
function math(task){
 if(task?.type!==TYPE||!['longer','earlier','first'].includes(task.kind)||
    !dense(task.events)||task.events.length!==2||
    !task.events.every(e=>e&&keys(e,['name','start','end'])&&text(e.name)&&
       e.name.trim().length&&safeTime(e.start)&&safeTime(e.end)&&e.end>=e.start)||
    !dense(task.questions||[]))return null;
 const [a,b]=task.events;
 const numbers=task.kind==='longer'
  ? [a.end-a.start,b.end-b.start]
  : task.kind==='earlier'?[a.start,b.start]:[a.end,b.end];
 const expected=numbers[0]===numbers[1]?'equal':
   task.kind==='longer'
    ?(numbers[0]>numbers[1]?'left':'right')
    :(numbers[0]<numbers[1]?'left':'right');
 return {numbers,expected,metrics:task.events.map(e=>({
  name:e.name,start:e.start,end:e.end,duration:e.end-e.start
 }))};
}
export function timeCompareBinding(task,context={}){
 try{
  const nodeId=getSource(task,context),m=math(task);
  if(!nodeId||!m)return null;
  const question=task.kind==='longer'
   ?'比较两次活动的用时，要不要先算各自的结束减开始？'
   :task.kind==='earlier'
    ?'比较开始先后时，应该看开始还是结束时刻？'
    :'比较谁先结束与比较谁用得久，是同一个问题吗？';
  return {nodeId,method:null,question};
 }catch{return null;}
}
export function replayTimeCompareEvidence(task,model,context={}){
 try{
  const nodeId=getSource(task,context),plan=math(task);
  if(!nodeId||!plan||!original.valid(task,model)||
     !original.inspect(task,model).correct||
     model.issue!==''||!dense(model.history)||
     model.history.length<3||model.history.length>1200||
     !keys(model.board,['first','bad','guess','revealed','choice'])||
     !keys(model.board.first,['guess','choice']))return null;
  let guess=null,revealed=false,firstChoice=null,lastChoice=null;
  let revealAt=-1,guessAt=-1;
  const decisions=[],wrongChoices=[];
  for(let at=0;at<model.history.length;at++){
   const e=model.history[at];
   if(!keys(e,['a','i','v'])||e.v!=='')return null;
   if(e.a==='guess'){
    if(guess!==null||revealed||!choices.has(e.i))return null;
    guess=e.i;guessAt=at;
   }else if(e.a==='reveal'){
    if(guess===null||revealed||e.i!=='')return null;
    revealed=true;revealAt=at;
   }else if(e.a==='choice'){
    if(!revealed||!choices.has(e.i))return null;
    if(firstChoice===null)firstChoice=e.i;
    const correct=e.i===plan.expected;
    decisions.push({at,choice:e.i,correct});
    if(!correct)wrongChoices.push(at);
    lastChoice=e.i;
   }else return null; // unused controller events are not mathematical proof
  }
  if(guessAt!==0||revealAt<=guessAt||decisions.length<1||
     decisions[0].at<=revealAt||
     decisions.at(-1).at!==model.history.length-1||
     lastChoice!==plan.expected||
     model.board.guess!==guess||model.board.first.guess!==guess||
     model.board.first.choice!==firstChoice||
     model.board.revealed!==true||
     model.board.choice!==lastChoice||
     model.board.bad!==(wrongChoices.length>0))return null;
  const seconds=context.sessionId==='minuteclock';
  return {kind:'time-compare',nodeId,method:null,eventCount:model.history.length,
   construction:{kind:task.kind,unit:seconds?'秒':'分钟',
    metrics:plan.metrics,numbers:plan.numbers,expected:plan.expected,
    firstGuess:guess,firstGuessCorrect:guess===plan.expected,
    guessAt,revealAt,firstChoice,finalChoice:lastChoice,
    decisions,wrongChoices},
   realButtonSequenceAssessed:true,
   timeValuesAreTaskProvided:true,
   independentStrategyAssessed:false,realWorldTimingAssessed:false,
   checkedSubmissionAssessed:false,freeExplanationAssessed:false,
   generalMasteryAssessed:false};
 }catch{return null;}
}
