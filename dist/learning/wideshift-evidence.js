// B08 non-additive decimal shifts. The trace records successful moves only;
// it does not establish every click or independent construction of digit rows.
import * as shifts from './phase5/b08-model.js';
import {isEvidenceContext,matchesNativeEvidenceTask,hasExactKeys as keys} from './evidence-contract.js';

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
