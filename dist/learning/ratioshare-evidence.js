// #280/B37 Stage 1: source-limited, read-only replay of six native equal-share tasks.
// This is mathematical evidence of observed slot actions, not an independent strategy claim.
import * as original from './phase5/b37-model.js';
import {LESSONS} from './catalog.js';
import {matchesNativeEvidenceTask,hasExactKeys,sameEvidence} from './evidence-contract.js';

const TYPE='x-r37-share';
const POSITIONS=Object.freeze({
 ratioShare37:Object.freeze([0,1,2]),
 ratioDivide37:Object.freeze([0,1,2])
});
const integer=(x,low,high)=>Number.isSafeInteger(x)&&x>=low&&x<=high;
const dense=a=>Array.isArray(a)&&Object.keys(a).length===a.length;
// Map the original six question fields to a mathematical role, independently
// of the native answer key and grading method.
const ANSWER_ROLES=Object.freeze({
 ratioShare37:[['part','amount:0','amount:1'],['part','amount:0','amount:1','amount:2'],['fraction:0','amount:1']],
 ratioDivide37:[['part','amount:0','amount:1'],['part','parts:0','parts:1'],['part','amount:0','amount:1','amount:2']]
});
function exactAnswer(text,n,d=1){
 if(typeof text!=='string'||text.length>96)return false;
 const raw=text.trim().replace(/\s*\/\s*/g,'/');
 let a,b;
 if(/^\d+\/[1-9]\d*$/.test(raw))([a,b]=raw.split('/').map(BigInt));
 else if(/^\d+(?:\.\d+)?$/.test(raw)){
  const [whole,decimal='']=raw.split('.');
  a=BigInt(whole+decimal);b=10n**BigInt(decimal.length);
 }else return false;
 return b>0n&&a*BigInt(d)===BigInt(n)*b;
}
function answerEvidence(task,model,context,plan){
 const roles=ANSWER_ROLES[context.sessionId]?.[context.index];
 if(!roles||roles.length!==(task.questions||[]).length||
    !Array.isArray(model.answers)||model.answers.length!==roles.length)return null;
 const rows=[];
 for(let i=0;i<roles.length;i++){
  const role=roles[i],part=Number(role.split(':')[1]);
  const numerator=role==='part'?plan.partSize:
   role.startsWith('amount:')?plan.amounts[part]:plan.parts[part];
  const denominator=role.startsWith('fraction:')?plan.totalSlots:1;
  const raw=model.answers[i];
  if(!Number.isSafeInteger(numerator)||!exactAnswer(raw,numerator,denominator))return null;
  rows.push({label:task.questions[i].label,raw,role,numerator,denominator});
 }
 return rows;
}
const rawIndex=(x,limit)=>typeof x==='string'&&/^(0|[1-9]\d*)$/.test(x)&&
 Number.isSafeInteger(Number(x))&&Number(x)<limit?Number(x):null;

function plan(task){
 if(task?.type!==TYPE||!integer(task.total,1,1000000)||
    !dense(task.parts)||task.parts.length<2||task.parts.length>3||
    !task.parts.every(x=>integer(x,1,1000))||
    !dense(task.labels)||task.labels.length!==task.parts.length||
    !task.labels.every(x=>typeof x==='string'&&x.trim().length>0)||
    !dense(task.questions||[]))return null;
 const slots=task.parts.reduce((a,b)=>a+b,0);
 if(!integer(slots,1,1000)||task.total%slots!==0)return null;
 const one=task.total/slots;
 return {total:task.total,totalSlots:slots,partSize:one,
  parts:[...task.parts],amounts:task.parts.map(x=>x*one),
  fractions:task.parts.map(x=>({numerator:x,denominator:slots}))};
}
function source(task,context){
 if(!context||!Object.hasOwn(POSITIONS,context.sessionId)||
    !POSITIONS[context.sessionId].includes(context.index))return null;
 const nodeId=LESSONS[context.sessionId]?.topicId;
 return nodeId&&matchesNativeEvidenceTask(task,context,{type:TYPE,nodeId})?nodeId:null;
}
export function ratioShareBinding(task,context={}){
 try{
  const nodeId=source(task,context),p=plan(task);
  if(!nodeId||!p)return null;
  return {nodeId,method:null,question:
   '整个分成多少份相同的小份？一份是多少？各人得几份，为什么合起来仍是整个？'};
 }catch{return null;}
}
export function replayRatioShareEvidence(task,model,context={}){
 try{
  const nodeId=source(task,context),p=plan(task);
  if(!nodeId||!p||!original.valid(task,model)||!original.inspect(task,model).correct||
     !dense(model.history)||model.history.length<2||model.history.length>2000||
     !hasExactKeys(model.board,['bad','first','owner','slots'])||
     !hasExactKeys(model.board.first,[])||model.board.bad!==false||
     model.issue!=='')return null;
  const slots=Array(p.totalSlots).fill(-1);
  let owner=0,assigned=0,removed=0,reassigned=0;
  const events=[],firstAssigned=Array(p.totalSlots).fill(null);
  for(let at=0;at<model.history.length;at++){
   const e=model.history[at];
   if(!hasExactKeys(e,['a','i','v','w','c'])||e.v!==''||e.w!==''||e.c!=='')return null;
   if(e.a==='person'){
    const next=rawIndex(e.i,p.parts.length);
    if(next===null)return null;
    owner=next;
    events.push({at,action:'person',owner});
   }else if(e.a==='slot'){
    const i=rawIndex(e.i,p.totalSlots);
    if(i===null)return null;
    const from=slots[i],to=from===owner?-1:owner;
    if(from===-1){assigned++;if(firstAssigned[i]===null)firstAssigned[i]={at,owner};}
    else if(to===-1)removed++;
    else reassigned++;
    slots[i]=to;
    events.push({at,action:'slot',slot:i,from,to});
   }else return null; // Other controller events cannot certify an equal-share construction.
  }
  const checkedAnswers=answerEvidence(task,model,context,p);
  if(!checkedAnswers)return null;
  const counts=p.parts.map((_,i)=>slots.filter(x=>x===i).length);
  if(events.at(-1)?.action!=='slot'||!slots.every(x=>x>=0)||
     !sameEvidence(counts,p.parts)||!sameEvidence(slots,model.board.slots)||
     model.board.owner!==owner||firstAssigned.some(x=>x===null))return null;
  return {kind:'ratio-share',nodeId,method:null,
   construction:{total:p.total,totalSlots:p.totalSlots,partSize:p.partSize,
    parts:p.parts,amounts:p.amounts,fractions:p.fractions,counts,
    firstAssigned,assigned,removed,reassigned,finalOwner:owner,
    answers:checkedAnswers,events},
   eventCount:events.length,originalControlsReplayed:true,
   taskValuesProvided:true,independentStrategyAssessed:false,
   freeExplanationAssessed:false,physicalSharingAssessed:false,
   generalMasteryAssessed:false,checkedSubmissionAssessed:false};
 }catch{return null;}
}
