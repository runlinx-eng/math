// B11 number-line paths: every move and undo is checked independently of the
// original grader. This describes the current saved work, never the learner's
// independent reasoning, mental strategy, fluency or long-term mastery.
import * as routes from './phase5/b11-model.js';
import {isEvidenceContext,matchesNativeEvidenceTask,sameEvidence as same,hasExactKeys as keys} from './evidence-contract.js';

const SOURCES=Object.freeze({
 onesbridge:{indices:[2,3],nodeId:'mt_AKAtWEwpcj'},
 twodigitpair:{indices:[2],nodeId:'mt_UQnAFPs83F'},
 addhundred:{indices:[0,2],nodeId:'mt_glPPG-kTQY'},
 flexhundred:{indices:[2,3],nodeId:'mt_cChv2j_-Da'},
 oneslarge:{indices:[0,1],nodeId:'mt_oDU_8zMZjp'},
 showwhy:{indices:[1],nodeId:'mt_zxST3MarI9'},
 flexthousand:{indices:[0,1],nodeId:'mt_HFRYjTb-Z5'},
 mentalbig:{indices:[0,1,2],nodeId:'mt_MWXPiaTnEu'}
});

export function routeBinding(task,context={}){
 if(!isEvidenceContext(context))return null;
 const source=Object.hasOwn(SOURCES,context.sessionId)?SOURCES[context.sessionId]:null;
 if(!source||!source.indices.includes(context.index)||
    !matchesNativeEvidenceTask(task,context,{type:'x-routecalc',nodeId:source.nodeId}))return null;
 const question=task.countup?
  '从哪里出发，到哪里停下？每一步走过多少？最后的位置和两数之间的距离是同一个数吗？':task.compensation?
  '每一步从哪里出发、在哪里停下？如果先走过了目标，多走的部分应该怎样还回来？':
  '每一步从哪里出发、走了多少、在哪里停下？把变化分成几步以后，合起来的变化有没有改变？';
 return {nodeId:source.nodeId,question,method:null};
}

const text=value=>typeof value==='string'&&value.length<=2000;
const integer=(value,min=-1000000000,max=1000000000)=>Number.isSafeInteger(value)&&value>=min&&value<=max;
const scales=[1,10,100,1000];
// The source input syntax is retained, but decimal conversion uses integer
// arithmetic before Number conversion. No rounded fractional residue is lost.
function exactUnits(value,scale){
 if(!text(value)||!scales.includes(scale))return null;
 const input=value.trim().replace(/[−–－]/g,'-').replace(/＋/g,'+');
 if(!/^[+-]?\d{1,10}(?:\.\d{1,6})?$/.test(input))return null;
 const negative=input[0]==='-',[whole,fraction='']=input.replace(/^[+-]/,'').split('.');
 const places=String(scale).length-1;
 if(fraction.slice(places)&&!/^[0]+$/.test(fraction.slice(places)))return null;
 const units=BigInt(whole)*BigInt(scale)+BigInt(fraction.slice(0,places).padEnd(places,'0')||'0');
 if(units>1000000000n)return null;
 return Number(negative?-units:units);
}
const format=(units,scale)=>{
 const places=String(scale).length-1,sign=units<0?'-':'',absolute=Math.abs(units);
 return sign+Math.floor(absolute/scale)+(places?'.'+String(absolute%scale).padStart(places,'0'):'');
};

export function replayRouteEvidence(task,model){
 try{
  if(task?.type!=='x-routecalc'||!integer(task.a,0)||!integer(task.b,1)||
     !['+','-'].includes(task.op)||!text(task.prompt)||
     Object.keys(task).some(key=>!['type','a','b','op','prompt','scale','minSteps','countup','compensation'].includes(key)))return null;
  const scale=task.scale??1,minSteps=task.minSteps??1;
  if(!scales.includes(scale)||!integer(minSteps,1,100)||
     ['countup','compensation'].some(flag=>task[flag]!==undefined&&typeof task[flag]!=='boolean')||
     (task.countup&&task.op!=='-'))return null;
  const answer=task.op==='+'?task.a+task.b:task.a-task.b;
  const origin=task.countup?task.b:task.a,target=task.countup?task.a:answer;
  const netChange=target-origin,direction=Math.sign(netChange);
  if(!integer(answer,0)||!integer(target)||!integer(netChange)||!direction||
     !keys(model,['history','issue','guess','first','started','jump','landing','hops','answer'])||
     !['issue','guess','first','jump','landing','answer'].every(key=>text(model[key]))||
     model.issue!==''||model.started!==true||!Array.isArray(model.history)||
     model.history.length<2||model.history.length>10000||!Array.isArray(model.hops))return null;
  const start=model.history[0];
  if(!keys(start,['action','guess'])||start.action!=='b11-route-start'||
     exactUnits(start.guess,scale)===null||model.first!==start.guess||model.guess!==start.guess)return null;

  const hops=[],steps=[];
  let at=origin,forwardMoves=0,backwardMoves=0,undos=0;
  for(const event of model.history.slice(1)){
   const from=at;
   if(event?.action==='b11-hop'){
    if(!keys(event,['action','jump','landing','from'])||!integer(event.from)||event.from!==at||hops.length>=100)return null;
    const delta=exactUnits(event.jump,scale),to=exactUnits(event.landing,scale);
    if(delta===null||delta===0||to===null||!integer(at+delta)||to!==at+delta)return null;
    hops.push({delta,to});at=to;
    steps.push({kind:'hop',from,delta,to});
    if(delta>0)forwardMoves++;else backwardMoves++;
   }else if(event?.action==='b11-hop-undo'){
    if(!keys(event,['action','hop'])||!keys(event.hop,['delta','to'])||!hops.length||
       !same(event.hop,hops.at(-1)))return null;
    const undone=hops.pop();at=hops.at(-1)?.to??origin;undos++;
    if(at!==from-undone.delta)return null;
    steps.push({kind:'undo',from,delta:-undone.delta,to:at});
   }else return null;
  }
  if(!hops.length||hops.length<minSteps||at!==target||!same(model.hops,hops)||
     exactUnits(model.answer,scale)!==answer||hops.reduce((sum,hop)=>sum+hop.delta,0)!==netChange)return null;

  const retained=hops.map((hop,index)=>({from:index?hops[index-1].to:origin,...hop}));
  let compensation=null;
  if(task.compensation){
   // A backwards step alone is insufficient: a retained point must actually
   // pass the target in the intended direction. The remaining path must return
   // exactly the excess. Detours remain legitimate; only the NET return is
   // called compensation, with its actual moves separately retained above.
   let turnIndex=-1,excess=0;
   for(const [index,hop] of retained.entries()){
    const over=(hop.to-target)*direction;
    if(over>excess){turnIndex=index;excess=over;}
   }
   if(turnIndex<0||turnIndex===retained.length-1)return null;
   const returning=retained.slice(turnIndex+1),returnDelta=returning.reduce((sum,hop)=>sum+hop.delta,0);
   if(returnDelta!==-direction*excess||!returning.some(hop=>Math.sign(hop.delta)===-direction))return null;
   compensation={turnIndex,overshoot:retained[turnIndex].to,excess,returnDelta,
    returnDistance:Math.abs(returnDelta),returnedInOneDirection:returning.every(hop=>Math.sign(hop.delta)===-direction)};
  }
  // Original completion and validity remain independent requirements.
  if(!routes.valid(task,model)||!routes.inspect(task,model).correct)return null;
  return {operation:task.op,scale,origin,target,answer,netChange,countup:!!task.countup,
   hops:retained,steps,forwardMoves,backwardMoves,undos,compensation,
   display:{origin:format(origin,scale),target:format(target,scale),answer:format(answer,scale),
    netChange:format(netChange,scale),values:[format(task.a,scale),format(task.b,scale)],
    hops:retained.map(hop=>({from:format(hop.from,scale),delta:format(hop.delta,scale),to:format(hop.to,scale)}))}};
 }catch{return null;}
}
