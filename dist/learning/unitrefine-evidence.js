// Two source unit sizes: surviving whole-unit records and their remainders.
// The tool positions and counts the blocks; no independent measurement,
// division algorithm, unit-choice reasoning or prose interpretation is claimed.
import * as original from './phase5/b28-model.js';
import {sessionTaskFor} from './bridges.js';
import {matchesNativeEvidenceTask,isEvidenceContext,hasExactKeys as keys,sameEvidence as same} from './evidence-contract.js';
const TYPE='x-m28-refine',NODE='mt_e7tLi9SCIE',INDICES=[0,2,3];
const REPLAY_SOURCES=Object.freeze({precisionunits:[0,2,3,-1],'link-sameunitlength-precisionunits':[1]});
const sourceTask=t=>t?.type===TYPE&&Object.entries(REPLAY_SOURCES).some(([id,indices])=>indices.some(index=>same(sessionTaskFor(id,index),t)));
const cp=structuredClone,text=s=>typeof s==='string'&&s.length<=1200,dense=a=>Array.isArray(a)&&Object.keys(a).length===a.length;
const gcd=(a,b)=>b?gcd(b,a%b):a<0n?-a:a;
// Historical success and bad reproduce the source B20 parser and near gate;
// exact BigInt quantities are a separate requirement on surviving evidence.
function entered(raw){
 if(!text(raw))return null;const s=raw.trim();let m,n,d,value;
 if((m=/^(-?\d+)\s+(\d+)\/(\d+)$/.exec(s))&&BigInt(m[3])!==0n){d=BigInt(m[3]);n=BigInt(m[1])*d+(m[1].startsWith('-')?-1n:1n)*BigInt(m[2]);value=Number(m[1])+(m[1].startsWith('-')?-1:1)*(Number(m[2])/Number(m[3]));}
 else if((m=/^(-?\d+)\/(\d+)$/.exec(s))&&BigInt(m[2])!==0n){n=BigInt(m[1]);d=BigInt(m[2]);value=Number(m[1])/Number(m[2]);}
 else if((m=/^(-?)(\d+)(?:\.(\d+))?$/.exec(s))){d=10n**BigInt((m[3]||'').length);n=(BigInt(m[2])*d+BigInt(m[3]||'0'))*(m[1]?-1n:1n);value=Number(s);}
 else return null;const g=gcd(n,d);return{n:n/g,d:d/g,value};
}
const quantity=q=>q?{numerator:String(q.n),denominator:String(q.d),text:q.d===1n?String(q.n):q.n+'/'+q.d}:null;
const exact=(q,n)=>!!q&&q.n===BigInt(n)*q.d;
const near=(q,n)=>!!q&&Number.isFinite(q.value)&&Math.abs(q.value-n)<1e-7;
const fresh=()=>({first:{},bad:false,size:null,count:0,runs:[]});

export function unitrefineBinding(task,context={}){
 try{
  if(!isEvidenceContext(context)||context.sessionId!=='precisionunits'||!INDICES.includes(context.index)||
     !matchesNativeEvidenceTask(task,context,{type:TYPE,nodeId:NODE}))return null;
  return{nodeId:NODE,method:null,question:'同一份量，换一种大小的单位后，完整单位的数量和剩下的部分怎样对应？'};
 }catch{return null;}
}

export function replayUnitrefineEvidence(task,model){
 try{
  if(!sourceTask(task)||!keys(task,['type','prompt','total','sizes','questions','object'])||
     !keys(model,['offset','estimate','error','measure','unit','prose','values','answers','seed','board','history','issue'])||
     !['offset','estimate','error','measure','unit','prose','issue'].every(k=>text(model[k]))||
     model.offset!=='2'||model.estimate!==''||model.error!==''||model.unit!==''||!dense(model.values)||model.values.length||
     !dense(model.answers)||model.answers.length!==task.questions.length||
     !model.answers.every((v,i)=>text(v)&&['',...task.questions[i].options.map(q=>String(q[0]))].includes(v))||
     !Number.isInteger(model.seed)||model.seed<1||model.seed>4294967295||
     !dense(model.history)||!model.history.length||model.history.length>2000||
     !keys(model.board,['first','bad','size','count','runs'])||!dense(model.board.runs)||
     !model.board.runs.every(r=>keys(r,['size','count','remainder']))||
     !original.valid(task,model)||!original.inspect(task,model).correct)return null;
  const expected=task.sizes.map(u=>({...u,count:Number(BigInt(task.total)/BigInt(u.size)),remainder:Number(BigInt(task.total)%BigInt(u.size))}));
  let board=fresh(),issue='',selectedAt=null,additionIndices=[];
  const saved=new Map(),first=new Map(),events=[],records=[],selections=[],removals=[],overflows=[];
  const invalidate=size=>{board.runs=board.runs.filter(r=>r.size!==size);saved.delete(size);};
  for(let index=0;index<model.history.length;index++){
   const e=model.history[index];if(!keys(e,['a','d','f']))return null;
   const event={index,action:e.a};issue='';
   if(e.a==='size'){
    if(!keys(e.d,['index'])||!task.sizes.some(u=>e.d.index===String(u.size))||!keys(e.f,[]))return null;
    const size=Number(e.d.index),selection={index,size,previousSize:board.size,previousCount:board.count,invalidatedRecord:saved.get(size)?.recordedAt??null};
    board.size=size;board.count=0;invalidate(size);selectedAt=index;additionIndices=[];selections.push(selection);Object.assign(event,selection);
   }else if(e.a==='add'){
    if(!keys(e.d,[])||!keys(e.f,[]))return null;
    Object.assign(event,{size:board.size,beforeCount:board.count,accepted:false});
    if(board.size===null)issue='先选一种单位。';
    else if(BigInt(board.count+1)*BigInt(board.size)>BigInt(task.total)){
     issue='放不下完整的一块，看看还剩多少。';const overflow={index,size:board.size,count:board.count,remainder:task.total-board.count*board.size,retainedRecord:saved.get(board.size)?.recordedAt??null};overflows.push(overflow);Object.assign(event,overflow);
    }else{board.count++;invalidate(board.size);additionIndices.push(index);event.accepted=true;}
    event.afterCount=board.count;
   }else if(e.a==='remove'){
    if(!keys(e.d,[])||!keys(e.f,[]))return null;
    const removal={index,size:board.size,beforeCount:board.count,removedAddition:null,effect:board.count>0};
    if(board.count>0){board.count--;invalidate(board.size);removal.removedAddition=additionIndices.pop();}
    removal.afterCount=board.count;removals.push(removal);Object.assign(event,removal);
   }else if(e.a==='record'){
    if(!keys(e.d,[])||!keys(e.f,['measure','unit'])||!text(e.f.measure)||e.f.unit!=='')return null;
    const q=entered(e.f.measure),want=expected.find(u=>u.size===board.size);
    const record={index,size:board.size,raw:e.f.measure,unit:e.f.unit,placedCount:board.count,
     expectedCount:want?.count??null,originalNearPlacedCount:near(q,board.count),exactPlacedCount:exact(q,board.count),
     exactFullCount:!!want&&exact(q,want.count),maximalWholeUnits:!!want&&board.count===want.count,originalAccepted:false};
    if(board.size===null)issue='先选单位、放上去。';
    else{
     const firstKey='count'+board.size;board.first[firstKey]??=e.f.measure;
     record.originalAccepted=record.originalNearPlacedCount&&record.maximalWholeUnits;
     if(!first.has(board.size))first.set(board.size,{size:board.size,label:want.label,index,raw:e.f.measure,placedCount:board.count,
      originalAccepted:record.originalAccepted,originalNearPlacedCount:record.originalNearPlacedCount,exactFullCount:record.exactFullCount});
     if(!record.originalAccepted){board.bad=true;issue='先把能放下的完整单位排满，再数一数。';}
     else{
      const remainder=Number(BigInt(task.total)-BigInt(board.count)*BigInt(board.size));invalidate(board.size);
      board.runs.push({size:board.size,count:board.count,remainder});
      saved.set(board.size,{size:board.size,label:want.label,count:board.count,remainder,coveredAmount:board.count*board.size,
       recordedAt:index,rawCount:e.f.measure,quantity:quantity(q),selectedAt,additionIndices:additionIndices.slice(),exact:record.exactFullCount});
     }
    }
    records.push(record);Object.assign(event,record);
   }else return null;
   event.issue=issue;events.push(event);
  }
  const currentQuantity=entered(model.measure),currentUnit=expected.find(u=>u.size===board.size);
  if(!same(board,model.board)||issue!==model.issue||!currentUnit||!exact(currentQuantity,board.count)||
     !task.questions.every((q,i)=>model.answers[i]===String(q.value)))return null;
  const runs=expected.map(u=>saved.get(u.size)),firstRecords=expected.map(u=>first.get(u.size));
  if(runs.some((r,i)=>!r||!r.exact||r.count!==expected[i].count||r.remainder!==expected[i].remainder||
      !Number.isInteger(r.selectedAt)||r.additionIndices.length!==r.count||
      r.additionIndices.some(at=>!Number.isInteger(at)||at<=r.selectedAt||at>=r.recordedAt)||
      BigInt(r.count)*BigInt(r.size)+BigInt(r.remainder)!==BigInt(task.total))||firstRecords.some(r=>!r))return null;
  // Unlike unitcover, the original runs have no saved raw field. Equivalent
  // exact current spelling is allowed; the shared full-model submission gate
  // separately decides whether the current model has actually been checked.
  return{
   kind:'unitrefine',eventCount:events.length,events,records,selections,removals,overflows,retainedHistoryOnly:true,
   historyAtCapacity:events.length===2000,historyLimit:2000,limitBehavior:'whole-model-action-no-op-with-controller-metadata-write',
   construction:{total:task.total,runs:runs.map(({exact:_,...r})=>r),
    current:{size:board.size,label:currentUnit.label,count:board.count,remainder:task.total-board.count*board.size,rawMeasure:model.measure,
     quantity:quantity(currentQuantity),selectedAt,additionIndices:additionIndices.slice()},firstRecords,hadOriginalBad:board.bad,
    toolProvidedDimensions:true,toolPlacedUnitsSequentially:true,toolDisplayedCount:true,toolDisplayedRemainder:true},
   issue,prose:model.prose,independentCountingAssessed:false,independentPositioningAssessed:false,independentDivisionProcessAssessed:false,
   physicalMeasurementAssessed:false,generalUnitChoiceReasoningAssessed:false,freeExplanationAssessed:false,generalMasteryAssessed:false
  };
 }catch{return null;}
}
