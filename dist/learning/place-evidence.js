// Integer decimal-place exchanges. This adapter observes saved mathematics;
// it neither changes the B11 grader nor adds fields to the v2 workpiece.
import * as place from './phase5/b11-model.js';
import {matchesNativeEvidenceTask,sameEvidence as same,hasExactKeys as keys} from './evidence-contract.js';

const SOURCES=Object.freeze({
 onesbridge:{indices:[0,1],nodeId:'mt_AKAtWEwpcj'},
 tensmove:{indices:[3],nodeId:'mt_I5j1ZWo2cn'},
 decadetake:{indices:[2],nodeId:'mt_HJTuIGHvcR'},
 twodigitpair:{indices:[0,1],nodeId:'mt_UQnAFPs83F'},
 flexhundred:{indices:[0,1],nodeId:'mt_cChv2j_-Da'},
 oneslarge:{indices:[3],nodeId:'mt_oDU_8zMZjp'},
 tenslarge:{indices:[2,3],nodeId:'mt_aHQ9kNt3is'},
 showwhy:{indices:[0,2],nodeId:'mt_zxST3MarI9'},
 fourparts:{indices:[2],nodeId:'mt_TiQbi027PE'},
 buildthousand:{indices:[0,1,2],nodeId:'mt_ewmuMMPAzP'},
 columnthree:{indices:[1,3],nodeId:'mt_SrrsLiJkr3'},
 flexthousand:{indices:[2,4],nodeId:'mt_HFRYjTb-Z5'},
 columnfour:{indices:[1,3],nodeId:'mt_mpS-JK_p_m'},
 columnlarge:{indices:[1,3,4],nodeId:'mt_Yw1_4Nfsql'}
});

export function placeBinding(task,context={}){
 if(!context||typeof context!=='object'||Array.isArray(context))return null;
 const source=Object.hasOwn(SOURCES,context.sessionId)?SOURCES[context.sessionId]:null;
 if(!source||!source.indices.includes(context.index)||
    !matchesNativeEvidenceTask(task,context,{type:'x-placecalc',nodeId:source.nodeId}))return null;
 return {nodeId:source.nodeId,method:null,
  question:'每一列的一份表示多少？十个小单位可以换成几个相邻的大单位？拆开或合并时，总量为什么没有变？减法中，换过以后还要拿走多少？'};
}

const text=x=>typeof x==='string'&&x.length<=2000;
const integer=(x,min=0,max=1000000000)=>Number.isSafeInteger(x)&&x>=min&&x<=max;
const total=counts=>counts.reduce((n,c,i)=>n+c*10**i,0);
const digits=(n,width)=>Array.from({length:width},(_,i)=>Math.floor(n/10**i)%10);

export function replayPlaceEvidence(task,model){
 try{
  if(task?.type!=='x-placecalc'||(task.scale!==undefined&&task.scale!==1)||
     !['+','-'].includes(task.op)||!Array.isArray(task.values)||task.values.length<2||
     task.values.length>10||!task.values.every(n=>integer(n))||
     (task.op==='-'&&task.values.length!==2)||
     (task.written!==undefined&&typeof task.written!=='boolean'))return null;
  const target=task.op==='+'?task.values.reduce((a,b)=>a+b,0):task.values[0]-task.values[1];
  if(!integer(target))return null;
  const width=Math.max(String(Math.max(...task.values,target)).length+1,2);
  const modelKeys=['history','issue','guess','first','align','started','counts','remaining','answer'];
  if(task.written)modelKeys.push('columnAnswers');
  if(!keys(model,modelKeys)||model.issue!==''||model.started!==true||
     !text(model.guess)||!text(model.first)||!text(model.answer)||
     !Array.isArray(model.history)||model.history.length<2||model.history.length>10000)return null;
  const alignment=task.values.map(()=> '0'),start=model.history[0];
  if(!keys(start,['action','guess','align'])||start.action!=='b11-place-start'||
     !text(start.guess)||place.number(start.guess,1)===null||
     !same(start.align,alignment)||!same(model.align,alignment)||
     model.first!==start.guess||model.guess!==start.guess)return null;
  const initialDigits=task.values.map(n=>digits(n,width));
  const counts=task.op==='+'?Array.from({length:width},(_,i)=>initialDigits.reduce((n,row)=>n+row[i],0)):
   [...initialDigits[0]];
  const startCounts=[...counts],remaining=task.op==='-'?[...initialDigits[1]]:Array(width).fill(0);
  const exchanges=[],removals=[];
  let up=0,down=0,removed=0;
  if(!counts.every(n=>integer(n,0,100)))return null;
  for(const event of model.history.slice(1)){
   if(!event||!integer(event.index,0,width-1)||!same(event.before,counts))return null;
   const i=event.index,before=[...counts],quantityBefore=total(counts);
   if(event.action==='b11-exchange'){
    if(!keys(event,['action','index','dir','before']))return null;
    let from,to;
    if(event.dir==='up'){
     if(i>=width-1||counts[i]<10||counts[i+1]>=100)return null;
     counts[i]-=10;counts[i+1]++;up++;
     from={count:10,unit:10**i};to={count:1,unit:10**(i+1)};
    }else if(event.dir==='down'){
     if(i<=0||counts[i]<1||counts[i-1]>90)return null;
     counts[i]--;counts[i-1]+=10;down++;
     from={count:1,unit:10**i};to={count:10,unit:10**(i-1)};
    }else return null;
    if(total(counts)!==quantityBefore||from.count*from.unit!==to.count*to.unit)return null;
    exchanges.push({index:i,direction:event.dir,from,to,before,after:[...counts],total:quantityBefore});
   }else if(event.action==='b11-remove'){
    if(task.op!=='-'||!keys(event,['action','index','before','needed'])||
       !integer(event.needed,1,9)||event.needed!==remaining[i]||counts[i]<event.needed)return null;
    const quantity=event.needed*10**i;
    counts[i]-=event.needed;remaining[i]=0;removed+=quantity;
    if(total(counts)!==quantityBefore-quantity)return null;
    removals.push({index:i,count:event.needed,unit:10**i,quantity,before,after:[...counts]});
   }else return null;
   if(!counts.every(n=>integer(n,0,100))||total(counts)!==
      (task.op==='+'?target:task.values[0]-removed)||
      (task.op==='-'&&removed+total(remaining)!==task.values[1]))return null;
  }
  if(!exchanges.length||!same(model.counts,counts)||!same(model.remaining,remaining)||
     counts.some(n=>n>=10)||remaining.some(n=>n!==0)||total(counts)!==target||
     place.number(model.answer,1)!==target)return null;
  if(task.written){
   const last=Math.max(String(target).length-1,0);
   if(!Array.isArray(model.columnAnswers)||model.columnAnswers.length!==width||
      !Array.from({length:width},(_,i)=>i).every(i=>text(model.columnAnswers[i])&&
       (i<=last?model.columnAnswers[i]===String(counts[i]):['','0'].includes(model.columnAnswers[i]))))return null;
  }
  // Keep the original result and completion rules as an additional gate.
  if(!place.valid(task,model)||!place.inspect(task,model).correct)return null;
  return {operation:task.op,values:[...task.values],startCounts,counts,remaining,
   total:target,exchanges,removals,up,down,removed};
 }catch{return null;}
}
