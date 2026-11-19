// #270/B31: candidate ONLY. Do not register as strict A without independent
// source review, real Chromium interaction, visible feedback, and P10 gates.
// The existing task, original grading, storage and State-v2 are unchanged.
import * as original from './phase5/b31-model.js';
import {LESSONS} from './catalog.js';
import {matchesNativeEvidenceTask,hasExactKeys as keys,sameEvidence as same} from './evidence-contract.js';

const TYPE='x-m31-fill';
const SOURCES=Object.freeze({comparecap:Object.freeze([2,3]),cupmeasure:Object.freeze([0,1])});
const text=x=>typeof x==='string'&&x.length<=1200;
const dense=a=>Array.isArray(a)&&Object.keys(a).length===a.length;
const safe=n=>Number.isSafeInteger(n)&&n>0&&n<=100000000;
const cp=structuredClone;

function nodeFor(task,context){
 if(!context||typeof context.sessionId!=='string'||!Object.hasOwn(SOURCES,context.sessionId)||
     !SOURCES[context.sessionId].includes(context.index))return null;
 const nodeId=LESSONS[context.sessionId]?.topicId;
 return nodeId&&matchesNativeEvidenceTask(task,context,{type:TYPE,nodeId})?nodeId:null;
}
function plan(task){
 if(task?.type!==TYPE||!safe(task.capacity)||!safe(task.goal)||
    task.goal>task.capacity||task.unit!=='mL'||
    !dense(task.units)||task.units.length<1||task.units.length>4||
    !dense(task.requiredUnits)||task.requiredUnits.length<1||
    task.requiredUnits.length>task.units.length||
    !task.units.every(u=>u&&text(u.id)&&u.id.length>0&&text(u.label)&&safe(u.amount))||
    new Set(task.units.map(u=>u.id)).size!==task.units.length||
    new Set(task.requiredUnits).size!==task.requiredUnits.length||
    !task.requiredUnits.every(id=>typeof id==='string'&&
      task.units.some(u=>u.id===id&&task.goal%u.amount===0))||
    !dense(task.questions||[]))return null;
 return task.requiredUnits.map(id=>{
  const u=task.units.find(x=>x.id===id);
  return {unit:id,unitAmount:u.amount,count:task.goal/u.amount,goal:task.goal};
 });
}
function exact(raw,want){
 if(!text(raw)||raw.length>128)return false;
 const s=raw.trim();
 let n,d,m;
 if((m=/^([0-9]+)\/([0-9]+)$/.exec(s))){
  n=BigInt(m[1]);d=BigInt(m[2]);
 }else if((m=/^([0-9]+)(?:\.([0-9]+))?$/.exec(s))){
  const fraction=m[2]||'';
  d=10n**BigInt(fraction.length);
  n=BigInt(m[1])*d+BigInt(fraction||'0');
 }else return false;
 return d>0n&&n===BigInt(want)*d;
}
export function cupfillBinding(task,context={}){
 try{
  const nodeId=nodeFor(task,context);
  if(!nodeId||!plan(task))return null;
  return {nodeId,method:null,question:task.requiredUnits.length>1?
   '同一个壶，大杯和小杯分别倒了几次？哪种杯数更少，为什么总量仍相同？':
   '每次是一整杯吗？倒了几次，杯数乘每杯容量与目标水量相同吗？'};
 }catch{return null;}
}

// This does not claim a learner checked/submitted the model: the shared
// latestSubmissionMatches gate belongs to the later UI integration stage.
export function replayCupfillEvidence(task,model,context={}){
 try{
  const expected=plan(task),nodeId=nodeFor(task,context);
  if(!expected||!nodeId||!original.valid(task,model)||
     !original.inspect(task,model).correct||
     !dense(model.history)||model.history.length===0||model.history.length>1200||
     !keys(model.board,['first','bad','unit','level','count','runs'])||
     !dense(model.board.runs)||model.issue!=='')return null;
  let selected=null,level=0,count=0,selectedAt=null,resetAt=null,adds=[];
  const records=new Map(),events=[],failures=[],overflows=[];
  for(let at=0;at<model.history.length;at++){
   const entry=model.history[at];
   if(!keys(entry,['a','i','f'])||!text(entry.i))return null;
   const action=entry.a,step={at,action};
   if(action==='choose'){
    if(!keys(entry.f,[])||!task.units.some(u=>u.id===entry.i))return null;
    selected=task.units.find(u=>u.id===entry.i);
    level=0;count=0;adds=[];selectedAt=at;resetAt=null;
    step.unit=selected.id;
   }else if(action==='reset'){
    if(entry.i!==''||!keys(entry.f,[])||!selected)return null;
    level=0;count=0;adds=[];resetAt=at;
    step.unit=selected.id;
   }else if(action==='add'){
    if(entry.i!==''||!keys(entry.f,[]))return null;
    step.unit=selected?.id||null;
    step.before=level;
    if(!selected)failures.push({at,reason:'no-unit'});
    else if(level+selected.amount>task.capacity){
     overflows.push({at,unit:selected.id,before:level,amount:selected.amount});
     failures.push({at,reason:'capacity-overflow'});
    }else{
     level+=selected.amount;count++;adds.push(at);
    }
    step.after=level;step.accepted=!!selected&&level>step.before;
   }else if(action==='record'){
    if(entry.i!==''||!keys(entry.f,['count','amount','unit'])||
       ![entry.f.count,entry.f.amount,entry.f.unit].every(text))return null;
    const found=expected?.find(u=>u.unit===selected?.id);
    const accepted=!!selected&&!!found&&level===task.goal&&
      count===found.count&&adds.length===count&&
      exact(entry.f.count,count)&&exact(entry.f.amount,task.goal)&&
      entry.f.unit===task.unit;
    step.unit=selected?.id||null;step.level=level;step.count=count;
    step.recorded=cp(entry.f);step.accepted=accepted;
    if(!accepted)failures.push({at,reason:'incomplete-or-invalid-record'});
    else records.set(selected.id,{unit:selected.id,unitAmount:selected.amount,
      count,goal:level,selectedAt,resetAt,addIndices:adds.slice(),
      recordedAt:at,fields:cp(entry.f)});
   }else return null; // Arbitrary controller actions are not mathematics evidence.
   events.push(step);
  }
  const final=events.at(-1);
  if(final?.action!=='record'||!final.accepted||!selected||
     model.board.unit!==selected.id||model.board.level!==task.goal||
     model.board.count!==count||!dense(model.board.runs)||
     model.board.runs.length!==expected.length||records.size!==expected.length)return null;
  if(!expected.every(want=>{
   const got=records.get(want.unit),saved=model.board.runs.find(x=>x.unit===want.unit);
   return !!got&&!!saved&&got.unitAmount===want.unitAmount&&
    got.count===want.count&&got.goal===task.goal&&
    got.count*got.unitAmount===task.goal&&
    got.addIndices.length===got.count&&
    got.addIndices.every(at=>at>Math.max(got.selectedAt,got.resetAt??-1)&&at<got.recordedAt)&&
    keys(saved,['unit','count','amount','fields'])&&
    saved.count===got.count&&saved.amount===task.goal&&same(saved.fields,got.fields);
  })||!same({count:model.count,amount:model.amount,unit:model.unit},
                  records.get(selected.id).fields))return null;
  const runs=expected.map(want=>cp(records.get(want.unit)));
  return {kind:'cupfill',eventCount:events.length,events,failures,overflows,
   construction:{capacity:task.capacity,goal:task.goal,unit:task.unit,
    runs,requiredUnits:task.requiredUnits.slice(),
    comparison:runs.length>1?{
     smallerCup:runs.reduce((a,b)=>a.unitAmount<b.unitAmount?a:b).unit,
     largerCup:runs.reduce((a,b)=>a.unitAmount>b.unitAmount?a:b).unit,
     largerCupUsesFewer:runs.every(x=>x.count*x.unitAmount===task.goal)&&
      new Set(runs.map(x=>x.unitAmount)).size===runs.length
    }:null,
    firstRecorded:cp(model.board.first),historicalBad:model.board.bad},
   nodeId,method:null,virtualCupActionsAssessed:true,
   physicalMeasurementAssessed:false,independentUnitChoiceAssessed:false,
   freeExplanationAssessed:false,checkedSubmissionAssessed:false,
   generalMasteryAssessed:false};
 }catch{return null;}
}
