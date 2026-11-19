// #256 source-bound vessel evidence. Deliberately unregistered until PR #255
// has passed its own gates. Original tasks, grading and State/v2 stay unchanged.
import * as original from './phase5/b28-model.js';
import {LESSONS} from './catalog.js';
import {matchesNativeEvidenceTask,hasExactKeys as keys,sameEvidence as same} from './evidence-contract.js';

const TYPE='x-m28-vessels';
const SOURCES=Object.freeze({indirectmass:1,ordermeasure:1,precisionunits:1});
const cp=structuredClone;
const txt=x=>typeof x==='string'&&x.length<=1200;
const dense=x=>Array.isArray(x)&&Object.keys(x).length===x.length;
const pos=(x,max)=>Number.isSafeInteger(x)&&x>0&&x<=max;
const idx=(x,max)=>typeof x==='string'&&/^(?:0|[1-9]\d*)$/.test(x)&&
 Number.isSafeInteger(Number(x))&&Number(x)<max?Number(x):null;

function nativeNode(task,context){
 if(!context||!Object.hasOwn(SOURCES,context.sessionId)||
     context.index!==SOURCES[context.sessionId])return null;
 const nodeId=LESSONS[context.sessionId]?.topicId;
 return nodeId&&matchesNativeEvidenceTask(task,context,{type:TYPE,nodeId})?nodeId:null;
}
function mathematicalPlan(t){
 if(t?.type!==TYPE||!['order','precision'].includes(t.mode)||
    !dense(t.capacities)||!t.capacities.length||t.capacities.length>8||
    !t.capacities.every(x=>pos(x,10000000))||
    !dense(t.units)||!t.units.length||t.units.length>8||
    !t.units.every(u=>u&&txt(u.id)&&u.id.length>0&&
      pos(u.amount,10000000)&&txt(u.label))||
    new Set(t.units.map(u=>u.id)).size!==t.units.length||
    !dense(t.questions))return null;
 const sorted=t.capacities.map((amount,i)=>({amount,i}))
  .sort((a,b)=>a.amount-b.amount||a.i-b.i).map(x=>x.i);
 if(t.mode==='order'){
  if(t.questions.length||t.requiredUnit!==undefined)return null;
  return{sorted,expected:[]};
 }
 const u=t.units.find(x=>x.id===t.requiredUnit);
 if(!u||t.capacities.length!==1||t.questions.length!==1||
    t.questions[0].options!==undefined||!txt(t.questions[0].label)||
    t.capacities[0]%u.amount!==0||
    Number(t.questions[0].value)!==t.capacities[0]/u.amount)return null;
 return{sorted,expected:[t.capacities[0]/u.amount]};
}
function exactAnswer(raw,want){
 if(!txt(raw)||raw.length>128)return false;
 const s=raw.trim();
 let m,n,d;
 if((m=/^(\d+)\/(\d+)$/.exec(s))){
  n=BigInt(m[1]);d=BigInt(m[2]);
 }else if((m=/^(\d+)(?:\.(\d+))?$/.exec(s))){
  d=10n**BigInt((m[2]||'').length);
  n=BigInt(m[1])*d+BigInt(m[2]||'0');
 }else return false;
 return d>0n&&n===BigInt(want)*d;
}
export function vesselsBinding(task,context={}){
 try{
  const nodeId=nativeNode(task,context);
  if(!nodeId)return null;
  return{nodeId,method:null,question:task.mode==='precision'?
    '大杯放不下时，换小勺真实倒了几次才装满？':
    '用同一种量杯分别装满后，怎样核对容量与顺序？'};
 }catch{return null;}
}
// Requires an original native session/position; bridge copies never qualify.
export function replayVesselsEvidence(task,model,context={}){
 try{
  const plan=mathematicalPlan(task);
  if(!plan||!nativeNode(task,context)||
     !keys(model,['offset','estimate','error','measure','unit','prose','values',
      'answers','seed','board','history','issue'])||
     !['offset','estimate','error','measure','unit','prose','issue'].every(k=>txt(model[k]))||
     model.offset!=='2'||model.estimate!==''||model.error!==''||
     model.measure!==''||model.unit!==''||model.issue!==''||
     !dense(model.values)||model.values.length||
     !dense(model.answers)||model.answers.length!==plan.expected.length||
     !model.answers.every((a,i)=>exactAnswer(a,plan.expected[i]))||
     !pos(model.seed,4294967295)||!dense(model.history)||
     !model.history.length||model.history.length>2000||
     !keys(model.board,['first','bad','selected','unit','levels','seen','order'])||
     !original.valid(task,model)||!original.inspect(task,model).correct)return null;
  const board={first:{},bad:false,selected:0,unit:null,
   levels:task.capacities.map(()=>0),seen:[],order:[]};
  const events=[],pours=[],observations=[],orders=[],clears=[],overflows=[];
  let issue='',retainedOrders=[],allSeenAt=null;
  for(let at=0;at<model.history.length;at++){
   const e=model.history[at];
   if(!keys(e,['a','d','f'])||!keys(e.f,[]))return null;
   const step={at,action:e.a};issue='';
   if(e.a==='select'){
    if(!keys(e.d,['index']))return null;
    const n=idx(e.d.index,task.capacities.length);
    if(n===null)return null;
    board.selected=n;step.container=n;
   }else if(e.a==='vunit'){
    if(!keys(e.d,['index'])||!task.units.some(u=>u.id===e.d.index))return null;
    board.first.unit??=e.d.index;
    board.unit=e.d.index;step.unit=e.d.index;
   }else if(e.a==='pour'){
    if(!keys(e.d,[]))return null;
    const n=board.selected,u=task.units.find(x=>x.id===board.unit);
    step.container=n;step.unit=board.unit;step.before=board.levels[n];
    if(!u)issue='先选一个量杯。';
    else if(board.levels[n]+u.amount>task.capacities[n]){
     board.first.overflow??=u.id;
     issue='这一杯会装不下，换小一点的量杯试试。';
     overflows.push({at,container:n,unit:u.id,before:board.levels[n]});
    }else{
     board.levels[n]+=u.amount;
     pours.push({at,container:n,unit:u.id,amount:u.amount,after:board.levels[n]});
    }
    step.accepted=issue==='';step.after=board.levels[n];
   }else if(e.a==='seen'){
    if(!keys(e.d,[]))return null;
    const n=board.selected,full=board.levels[n]===task.capacities[n];
    step.container=n;step.full=full;
    if(!full)issue='先把这个容器装满。';
    else if(!board.seen.includes(n)){
     board.seen.push(n);
     observations.push({at,container:n,capacity:task.capacities[n]});
     if(board.seen.length===task.capacities.length)allSeenAt=at;
    }
   }else if(e.a==='order'){
    if(!keys(e.d,['index']))return null;
    const n=idx(e.d.index,task.capacities.length);
    if(n===null)return null;
    const accepted=!board.order.includes(n);
    if(accepted){
     board.order.push(n);
     retainedOrders.push({at,container:n});
    }
    const attempt={at,container:n,accepted,allObserved:allSeenAt!==null};
    orders.push(attempt);Object.assign(step,attempt);
   }else if(e.a==='clear'){
    if(!keys(e.d,[]))return null;
    clears.push({at,previousOrder:board.order.slice()});
    board.order=[];retainedOrders=[];
   }else return null; // Hidden or unrelated controller actions are not evidence.
   step.issue=issue;events.push(step);
  }
  if(!same(board,model.board)||issue!==model.issue||
     board.seen.length!==task.capacities.length||allSeenAt===null)return null;
  // An accepted grade alone is insufficient. Every observed full container
  // needs actual repeated pours of one uniform unit, completed before seen.
  const measurements=[];
  for(let n=0;n<task.capacities.length;n++){
   const used=pours.filter(x=>x.container===n);
   const seen=observations.find(x=>x.container===n);
   if(!used.length||!seen||used.some(x=>x.at>seen.at)||
      new Set(used.map(x=>x.unit)).size!==1)return null;
   const u=task.units.find(x=>x.id===used[0].unit);
   if(!u||used.length*u.amount!==task.capacities[n])return null;
   if(task.mode==='precision'&&u.id!==task.requiredUnit)return null;
   measurements.push({container:n,capacity:task.capacities[n],
     unit:u.id,unitAmount:u.amount,count:used.length,seenAt:seen.at});
  }
  if(task.mode==='order'){
   if(new Set(measurements.map(x=>x.unit)).size!==1||
      board.order.length!==task.capacities.length||
      retainedOrders.length!==task.capacities.length||
      retainedOrders.some(o=>o.at<=allSeenAt)||
      board.order.some((n,i)=>i>0&&task.capacities[board.order[i-1]]>task.capacities[n]))return null;
  }else if(board.unit!==task.requiredUnit||board.order.length)return null;
  return{kind:'capacity-vessels',mode:task.mode,eventCount:events.length,events,
   construction:{suppliedCapacities:task.capacities.map(String),
    unitSizes:task.units.map(u=>({id:u.id,amount:String(u.amount)})),
    measurements,successfulPours:cp(pours),fullObservations:cp(observations),
    overflows,orders,clears,retainedOrder:board.order.slice(),
    allObservedAt:allSeenAt,expectedOrder:plan.sorted,
    originalFirst:cp(board.first),originalBad:board.bad,
    questions:plan.expected.map((n,i)=>({expected:String(n),raw:model.answers[i]}))},
   method:null,physicalMeasurementAssessed:false,
   independentUnitChoiceReasoningAssessed:false,
   freeExplanationAssessed:false,generalMasteryAssessed:false,
   historyAtCapacity:events.length===2000};
 }catch{return null;}
}
