// B08 non-additive decimal shifts. The trace records successful moves only;
// it does not establish every click or independent construction of digit rows.
import * as shifts from './phase5/b08-model.js';
import {isEvidenceContext,matchesNativeEvidenceTask,hasExactKeys as keys,sameEvidence} from './evidence-contract.js';

const SOURCES=Object.freeze({
 tenpattern:{indices:[0,1,2],nodeId:'mt_QqG6IdmTSE'},
 decimalscale:{indices:[0,1,2],nodeId:'mt_EDgw64OmfA'},
 decimalplaces:{indices:[1],nodeId:'mt_lNGpnILM5C'},
 powerpattern:{indices:[0,1,2,3],nodeId:'mt_HLUqHJ9Y7n'},
 standardform:{indices:[0,1,2],nodeId:'mt_bO-njVOige'},
 largerfacts:{indices:[3],nodeId:'mt_8A3pZNOp7Z'},
 shifttens:{indices:[0,1,2,3],nodeId:'mt_LlMl2PbaZe'},
 shiftfine:{indices:[0,1,2],nodeId:'mt_wPgpMJ0-PA'},
 dividebyten:{indices:[0,2,4],nodeId:'mt_kDMKJ5Ztt6'},
 structure39:{indices:[1],nodeId:'mt__Itf4aQZUj'}
});

export function wideShiftBinding(task,context={}){
 if(!isEvidenceContext(context))return null;
 const source=Object.hasOwn(SOURCES,context.sessionId)?SOURCES[context.sessionId]:null;
 if(!source||!source.indices.includes(context.index)||
    !matchesNativeEvidenceTask(task,context,{type:'x-wideshift',nodeId:source.nodeId}))return null;
 return {nodeId:source.nodeId,method:null,question:task.mode==='scientific'?
  '先把第一部分移到至少1、小于10，怎样用10的幂回到原数？向左、向右的移动怎样对应指数？':
  '小数点固定时，数字每移动一格，它所表示的量怎样变化？来回移动之后，怎样核对总的倍数？'};
}

const Q=1000000n,LIMIT=100000000n*Q;
const text=value=>typeof value==='string'&&value.length<=120;
// Match the original decimal spelling and range without binary rounding.
function units(value){
 if(!text(value))return null;
 const s=value.trim();if(!/^-?\d+(?:\.\d{1,6})?$/.test(s))return null;
 const sign=s.startsWith('-')?-1n:1n,[whole,part='']=s.replace(/^-/,'').split('.');
 const n=BigInt(whole)*Q+BigInt(part.padEnd(6,'0'));
 return n<=LIMIT?sign*n:null;
}
function decimal(n){
 const sign=n<0n?'-':'',a=n<0n?-n:n,tail=String(a%Q).padStart(6,'0').replace(/0+$/,'');
 return sign+String(a/Q)+(tail?'.'+tail:'');
}
function move(n,delta){
 if(delta===-1&&n%10n!==0n)return null;
 const next=delta===1?n*10n:n/10n;
 return next>0n&&next<=LIMIT?next:null;
}
function normalizedShift(start){
 let n=start,shift=0;
 while(n>=10n*Q){n=move(n,-1);if(n===null||--shift<-9)return null;}
 while(n<Q){n=move(n,1);if(n===null||++shift>9)return null;}
 return shift;
}

export function replayWideShiftEvidence(task,model){
 try{
  if(task?.type!=='x-wideshift'||!['scale','shift','scientific'].includes(task.mode)||
     !text(task.start)||typeof task.prompt!=='string'||
     !Number.isInteger(task.step)||task.step<-9||task.step>9||
     Object.keys(task).some(k=>!['type','mode','start','step','prompt','factors'].includes(k))||
     task.factors!==undefined&&typeof task.factors!=='boolean')return null;
  const start=units(task.start);if(start===null||start<=0n)return null;
  const target=task.mode==='scientific'?normalizedShift(start):task.step;
  if(target===null||task.mode==='scientific'&&task.step!==0)return null;
  if(!keys(model,['guess','committed','shift','trace','u','moves','swaps','answer','factor','direction','exponent','changed'])||
     !['guess','committed','answer','factor','direction','exponent'].every(k=>text(model[k]))||
     model.guess!==model.committed||units(model.committed)===null||
     !Number.isInteger(model.shift)||model.shift<-9||model.shift>9||
     !Array.isArray(model.trace)||model.trace.length<1||model.trace.length>60||
     !['u','moves','swaps','changed'].every(k=>Array.isArray(model[k])&&model[k].length===0))return null;
  let at=start,shift=0;const steps=[];
  for(const [index,delta]of model.trace.entries()){
   if(delta!==1&&delta!==-1)return null;
   const nextShift=shift+delta,next=move(at,delta);
   if(nextShift<-9||nextShift>9||next===null)return null;
   steps.push({index,delta,fromShift:shift,toShift:nextShift,from:Number(at),to:Number(next),
    display:{from:decimal(at),to:decimal(next)},operation:delta===1?'times':'divide'});
   at=next;shift=nextShift;
  }
  if(model.shift!==shift||shift!==target||units(model.answer)!==at)return null;
  let scientific=null;
  const factor=10n**BigInt(Math.abs(shift)),direction=shift>0?'times':'divide';
  if(task.mode==='scientific'){
   if(model.factor!==''||model.direction!==''||model.exponent.trim()!==String(-shift)||at<Q||at>=10n*Q)return null;
   // Check coefficient * 10^exponent = original as an integer equality.
   if(shift<0?at*factor!==start:start*factor!==at)return null;
   scientific={coefficient:Number(at),exponent:-shift,original:Number(start)};
  }else if(model.exponent!==''||units(model.factor)!==factor*Q||model.direction!==direction)return null;
  if(!shifts.valid(task,model)||!shifts.inspect(task,model).correct)return null;
  const guess=units(model.committed);
  return {mode:task.mode,unit:Number(Q),start:Number(start),end:Number(at),netShift:shift,
   successfulMoves:steps.length,leftMoves:steps.filter(s=>s.delta===1).length,
   rightMoves:steps.filter(s=>s.delta===-1).length,steps,
   factor:Number(factor),direction,scientific,
   guess:{value:Number(guess),matchesResult:guess===at,submissionOnly:true},
   digitRowsSystemGenerated:true,unrecordedClicksAssessed:false,
   display:{start:decimal(start),end:decimal(at),factor:String(factor),guess:decimal(guess)}};
 }catch{return null;}
}


// #301: additive thousands and observable, order-sensitive base-ten exchanges.
// Historical additive workpieces without chronological actions remain readable.
const ADD_NODE='mt_9XVFje6Tyr';
const ADD_CASES=Object.freeze([
 {start:'4562',step:1000},{start:'4562',step:-1000},
 {start:'9500',step:1000},{start:'10500',step:-1000}
]);
const ADD_KEYS=['guess','committed','shift','trace','u','moves','swaps',
 'answer','factor','direction','exponent','changed','actions'];
const POWERS=[10000n,1000n,100n,10n,1n];
const integer=s=>typeof s==='string'&&/^-?\d{1,12}$/.test(s.trim())?BigInt(s.trim()):null;
const rowOf=n=>POWERS.map(p=>Number(n/p%10n));
const totalOf=row=>row.reduce((sum,v,i)=>sum+BigInt(v)*POWERS[i],0n);
function addSource(task,context){
 if(!isEvidenceContext(context)||context.sessionId!=='thousandstep'||
    context.index>3||!matchesNativeEvidenceTask(task,context,
    {type:'x-wideshift',nodeId:ADD_NODE}))return null;
 const fixed=ADD_CASES[context.index];
 return task.mode==='add'&&task.start===fixed.start&&task.step===fixed.step?ADD_NODE:null;
}
export function wideShiftAddBinding(task,context={}){
 try{
  const nodeId=addSource(task,context);
  return nodeId?{nodeId,method:null,question:
   '每次添走多少个千？十个千和一个万怎样交换？换位前后总量为什么不变？'}:null;
 }catch{return null;}
}
export function replayWideShiftAddEvidence(task,model,context={}){
 try{
  const nodeId=addSource(task,context);
  if(!nodeId||!keys(model,ADD_KEYS)||!shifts.valid(task,model)||
     !shifts.inspect(task,model).correct||
     model.guess!==model.committed||integer(model.committed)===null||
     model.shift!==0||model.trace.length||model.factor!==''||
     model.direction!==''||model.exponent!==''||
     !Array.isArray(model.actions)||model.actions.length<3||
     model.actions.length>512)return null;
  const start=BigInt(task.start),end=start+BigInt(task.step);
  let row=rowOf(start),predicted=false,sumOfMoves=0;
  const moves=[],swaps=[],changed=[],steps=[];
  for(const [at,op] of model.actions.entries()){
   if(!op||typeof op!=='object'||Array.isArray(op))return null;
   const before=totalOf(row),from=[...row];
   if(op.kind==='predict'){
    if(!keys(op,['kind','value'])||predicted||at!==0||
       op.value!==model.committed)return null;
    predicted=true;
   }else if(op.kind==='move'){
    if(!keys(op,['kind','delta'])||!predicted||
       (op.delta!==1&&op.delta!==-1)||moves.length>=60||
       row[1]+op.delta<0||row[1]+op.delta>19)return null;
    row[1]+=op.delta;moves.push(op.delta);sumOfMoves+=op.delta;
    if(totalOf(row)!==before+BigInt(op.delta)*1000n)return null;
   }else if(op.kind==='swap'){
    if(!keys(op,['kind','direction','index'])||!predicted||
       swaps.length>=100)return null;
    if(op.direction==='up'&&op.index===1&&row[1]>=10&&row[0]<19){
     row[1]-=10;row[0]++;swaps.push('up1');
    }else if(op.direction==='down'&&op.index===0&&row[0]>0&&row[1]<=9){
     row[0]--;row[1]+=10;swaps.push('down0');
    }else return null;
    if(totalOf(row)!==before)return null;
   }else if(op.kind==='changed'){
    if(!keys(op,['kind','index'])||!predicted||
       !Number.isInteger(op.index)||op.index<0||op.index>4)return null;
    const i=changed.indexOf(op.index);
    if(i<0)changed.push(op.index);else changed.splice(i,1);
   }else return null;
   steps.push({at,kind:op.kind,from,to:[...row],
    before:String(before),after:String(totalOf(row))});
  }
  if(!predicted||!moves.length||sumOfMoves!==task.step/1000||
     !sameEvidence(moves,model.moves)||!sameEvidence(swaps,model.swaps)||
     !sameEvidence(changed,model.changed)||!sameEvidence(row,model.u)||
     !row.every(v=>Number.isInteger(v)&&v>=0&&v<=9)||
     totalOf(row)!==end||integer(model.answer)!==end)return null;
  const actualChanged=rowOf(start).flatMap((v,i)=>v!==rowOf(end)[i]?[i]:[]);
  if(!sameEvidence([...changed].sort((a,b)=>a-b),actualChanged))return null;
  const up=context.index===2,down=context.index===3;
  if(up&&!swaps.includes('up1')||down&&!swaps.includes('down0'))return null;
  return {kind:'thousandstep-additive',nodeId,method:null,start:String(start),
   end:String(end),signedThousands:sumOfMoves,
   prediction:{value:model.committed,matchesResult:integer(model.committed)===end},
   successfulMoves:moves.length,exchanges:swaps.length,swaps,
   changedColumns:actualChanged,steps,finalRow:row,
   regrouping:up?'ten-thousands-carry':down?'ten-thousands-borrow':'none-required',
   sourceWorkpieceReplayed:true,baseTenConservationChecked:true,
   unrecordedClicksAssessed:false,independentMentalArithmeticAssessed:false,
   generalMasteryAssessed:false};
 }catch{return null;}
}
