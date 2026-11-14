// The B18 outer choices and the B17 construction are separate recorded streams.
// Start/reset pair them exactly; other cross-stream times are compatibility
// ranges, never invented timestamps or additional child-authored actions.
import * as cases from './phase5/b18-model.js';
import * as fractions from './phase5/b17-model.js';
import {rational as originalRational} from './phase5/b16-model.js';
import {matchesNativeEvidenceTask,sameEvidence as same,hasExactKeys as keys} from './evidence-contract.js';
import {replayFractionOperationsEvidence} from './fraction-operations-evidence.js';

const SOURCES=Object.freeze({
 joinfractions:{indices:[0,1,2,3],nodeId:'mt_a1FdAsRKOF'},
 fractioncarry:{indices:[0,1,2],nodeId:'mt_CBHwluE6Lp'},
 mixedexchange:{indices:[3],nodeId:'mt_70qDTI14td'},
 relatedparts:{indices:[0,1,2,3],nodeId:'mt_-V7EnqU7gG'},
 fractionstories:{indices:[0,1,2],nodeId:'mt_ZLqYE7la4Z'},
 unlikeparts:{indices:[0,1,2],nodeId:'mt_14T5yPXUq_'},
 fractionarea:{indices:[0,1,2],nodeId:'mt_gx6KQK5-Kx'},
 productfractions:{indices:[0,1,2],nodeId:'mt_AabJisinfi'},
 fractionrecipe:{indices:[0,1,2],nodeId:'mt_lvaSGHwvQ5'},
 countsmallgroups:{indices:[0,1,2],nodeId:'mt_1PAWhRhpdg'},
 fractiondividewords:{indices:[1],nodeId:'mt_rCMdwG-YOE'},
 fractionsanity:{indices:[0,1,3],nodeId:'mt_e7filQgayF'},
 fractionquotient:{indices:[0,1,2],nodeId:'mt_9Y96vxG_LH'},
 argument38:{indices:[1],nodeId:'mt_j5YqQnN6xe'}
});
export function fractionCaseBinding(task,context={}){
 if(!context||typeof context!=='object'||Array.isArray(context)||typeof context.sessionId!=='string'||
    !Number.isInteger(context.index))return null;
 const source=Object.hasOwn(SOURCES,context.sessionId)?SOURCES[context.sessionId]:null;
 if(!source||!source.indices.includes(context.index)||
    !matchesNativeEvidenceTask(task,context,{type:'x-fractioncase',nodeId:source.nodeId}))return null;
 return {nodeId:source.nodeId,method:null,question:task.op==='/'?
  '原来的量和每组的量各是多少？最后不足一组的部分，用哪一个整体作单位？':task.op==='*'?
  '选出的行和列怎样对应两个量？一个小格与一个完整面积单位有什么关系？':
  '这件事要把量接起来还是拿走？换成一样大的小份时，原来的两个量怎样保持？'};
}

const fieldKeys=Object.keys(cases.fields),workKeys=Object.keys(fractions.fields);
const text=s=>typeof s==='string'&&s.length<=1000;
const gcd=(a,b)=>{while(b)[a,b]=[b,a%b];return a<0n?-a:a;};
const reduce=([n,d])=>{const g=gcd(n,d);return[n/g,d/g];};
const equal=(a,b)=>!!a&&!!b&&a[0]*b[1]===b[0]*a[1];
const multiply=(a,b)=>reduce([a[0]*b[0],a[1]*b[1]]);
const compare=(a,b)=>a[0]*b[1]<b[0]*a[1]?-1:a[0]*b[1]>b[0]*a[1]?1:0;
const pair=r=>r.map(Number),big=r=>r.map(BigInt),one=[1n,1n];
const kind=r=>r[0]<0n?'negative':r[0]===0n?'zero':r[0]<r[1]?'part':r[0]===r[1]?'one':'more';
function amount(raw){
 if(!text(raw))return null;
 let s=raw.trim().replace(/[−–]/g,'-'),percent=s.endsWith('%');if(percent)s=s.slice(0,-1).trim();
 let n,d,m;
 if((m=/^(-?)(\d{1,12})\s+(\d{1,12})\/(\d{1,12})$/.exec(s))){
  d=BigInt(m[4]);const p=BigInt(m[3]);if(!d||p>=d)return null;
  n=BigInt(m[2])*d+p;if(m[1])n=-n;
 }else if((m=/^(-?\d{1,12})\/(\d{1,12})$/.exec(s))){n=BigInt(m[1]);d=BigInt(m[2]);}
 else if((m=/^([+-]?)(\d{1,12})(?:\.(\d{1,32}))?$/.exec(s))){
  d=10n**BigInt((m[3]||'').length);n=BigInt(m[2])*d+BigInt(m[3]||'0');if(m[1]==='-')n=-n;
 }else return null;
 if(d<=0n)return null;if(percent)d*=100n;
 if(percent||s.includes('.'))[n,d]=reduce([n,d]);
 if(n< -1000000000000n||n>1000000000000n||d>10000000000n)return null;return[n,d];
}
// An exact mathematical name must also have been accepted by the actual input.
// The original parser is a capability check, not the mathematical proof.
function actualAmount(raw,percent=false){
 const exact=amount(raw),accepted=percent?fractions.frac(raw):originalRational(raw);
 return exact&&accepted&&accepted.every(Number.isSafeInteger)&&equal(exact,big(accepted))?exact:null;
}
const beforeFields=t=>['choice',...(t.estimate?['low','high']:['guess']),...(t.story?['story']:[])];
const recordFields=t=>[...(t.estimate?['inside']:[]),...(t.simple?['simple']:[]),
 ...(t.mixed?['whole','part']:[]),...(t.tile?['tile','count']:[]),...(t.inverse?['equation']:[]),
 ...(t.reciprocal?['inverse','scaledA','scaledB']:[]),...(t.story?['story']:[])];
const fresh=first=>({started:false,first,estimate:null,normalized:null});
const projected=t=>({type:'x-fracoperations',a:t.a,b:t.b,op:t.op,prompt:t.prompt});
function readyPrefixes(t,events){
 let forms=null,combined=false,rest=false,columns=new Set(),rows=new Set();const ready=[false];
 for(const e of events){
  if(e.action==='reset'){forms=null;combined=rest=false;columns.clear();rows.clear();}
  if(e.action==='forms')forms=e.forms;
  if(e.action==='common'||e.action==='shade')combined=rest=false;
  if(e.action==='combine')combined=true;
  if(e.action==='rest')rest=true;
  if(e.action==='column'||e.action==='row'){
   const list=e.action==='column'?columns:rows;e.selected?list.add(e.part):list.delete(e.part);
  }
  ready.push(!!forms&&(t.op==='*'?columns.size===forms[0][0]&&rows.size===forms[1][0]:t.op==='/'?rest:combined));
 }
 return ready;
}
function ranges(ready,start,end){
 const result=[];
 for(let i=start;i<=end;i++)if(ready[i]){
  if(result.length&&result.at(-1)[1]===i-1)result.at(-1)[1]=i;else result.push([i,i]);
 }
 return result;
}
function inverseEquation(raw,result,b,a){
 if(!text(raw))return false;
 const sides=raw.trim().replace(/[×·]/g,'*').split('=');if(sides.length!==2)return false;
 const factors=sides[0].split('*');if(factors.length!==2||!equal(actualAmount(sides[1]),a))return false;
 const x=actualAmount(factors[0]),y=actualAmount(factors[1]);
 return equal(x,result)&&equal(y,b)||equal(x,b)&&equal(y,result);
}

export function replayFractionCaseEvidence(task,model){
 try{
  const required=['type','a','b','op','prompt','scene'],flags=['simple','mixed','tile','inverse','reciprocal','story'];
  if(!task||required.some(k=>!Object.hasOwn(task,k))||
     Object.keys(task).some(k=>![...required,...flags,'estimate','exampleStory'].includes(k))||
     task.type!=='x-fractioncase'||!['a','b','prompt','scene'].every(k=>text(task[k]))||
     !['+','-','*','/'].includes(task.op)||flags.some(k=>Object.hasOwn(task,k)&&task[k]!==true)||
     task.tile&&task.op!=='*'||(task.inverse||task.reciprocal)&&task.op!=='/'||
     Object.hasOwn(task,'exampleStory')&&(!task.story||!text(task.exampleStory))||
     Object.hasOwn(task,'estimate')&&(!Array.isArray(task.estimate)||task.estimate.length!==2||
      task.estimate.some(v=>!(typeof v==='string'||typeof v==='number'&&Number.isFinite(v))||!amount(String(v))))||
     !keys(model,[...fieldKeys,'board','history','issue','work'])||!fieldKeys.every(k=>text(model[k]))||
     model.issue!==''||!Array.isArray(model.history)||!model.history.length||model.history.length>1200||
     !cases.valid(task,model)||!cases.inspect(task,model).correct)return null;
  const core=replayFractionOperationsEvidence(projected(task),model.work);if(!core)return null;
  const a=big(core.quantities.a),b=big(core.quantities.b),result=big(core.quantities.result),
   ready=readyPrefixes(task,core.events),anchors=core.events.filter(e=>['predict-op','reset'].includes(e.action));
  let board=fresh(null),previous={...cases.fields},anchorIndex=0,lower=0;
  const starts=[],resets=[],normalizations=[],outerEvents=[];
  for(let index=0;index<model.history.length;index++){
   const e=model.history[index];
   if(!keys(e,['a','d','f'])||!keys(e.d,[])||!keys(e.f,fieldKeys)||
      !fieldKeys.every(k=>text(e.f[k]))||!['start','reset','normalize'].includes(e.a))return null;
   const allowed=board.started?recordFields(task):beforeFields(task),
    changed=fieldKeys.filter(k=>e.f[k]!==previous[k]);
   if(changed.some(k=>!allowed.includes(k)))return null;
   const next=anchors[anchorIndex],upper=next?next.index:model.work.history.length;
   let compatibility=null;
   if(board.started&&(changed.length||e.a==='normalize')){
    compatibility=ranges(ready,lower,upper);if(!compatibility.length)return null;
    lower=compatibility[0][0];
   }
   const event={index,action:e.a,changedFields:changed,compatibleReadyPrefixes:compatibility,exactTimingKnown:false};
   if(e.a==='start'){
    if(board.started||!next||next.action!=='predict-op'||next.index!==lower||e.f.choice!==task.op)return null;
    let prediction,estimate=null;
    if(task.estimate){
     const lo=actualAmount(e.f.low,true),hi=actualAmount(e.f.high,true);
     if(!lo||!hi||compare(lo,hi)>=0||fractions.cmp(e.f.low,e.f.high)>=0)return null;
     prediction=kind([lo[0]*hi[1]+hi[0]*lo[1],2n*lo[1]*hi[1]]);estimate=[e.f.low,e.f.high];
    }else{prediction=e.f.guess;if(!['negative','zero','part','one','more'].includes(prediction))return null;}
    const workEvent=model.work.history[next.index],prior=next.index?model.work.history[next.index-1].f:fractions.fields;
    if(next.value!==prediction||workKeys.some(k=>k!=='prediction'&&workEvent.f[k]!==prior[k]))return null;
    board.first??={choice:e.f.choice,low:e.f.low,high:e.f.high,guess:e.f.guess,story:e.f.story};
    board.started=true;board.estimate=estimate;
    const start={outerIndex:index,innerIndex:next.index,epoch:next.epoch,choice:e.f.choice,
     guess:task.estimate?null:e.f.guess,estimate,automaticPrediction:prediction,
     predictionAttribution:task.estimate?'tool-derived-from-interval':'tool-copied-from-outer-guess'};
    starts.push(start);event.innerIndex=next.index;lower=next.index+1;anchorIndex++;
   }else if(e.a==='reset'){
    if(!next||next.action!=='reset')return null;
    if(!board.started){
     const prior=next.index?model.work.history[next.index-1].f:fractions.fields;
     if(next.index!==lower||!same(model.work.history[next.index].f,prior))return null;
    }
    resets.push({outerIndex:index,innerIndex:next.index,fromEpoch:next.epoch,toEpoch:next.nextEpoch,preservedFirst:board.first});
    board=fresh(board.first);event.innerIndex=next.index;lower=next.index+1;anchorIndex++;
   }else{
    if(!task.reciprocal||!board.started||!compatibility)return null;
    const factor=actualAmount(e.f.inverse,true),scaledA=actualAmount(e.f.scaledA),scaledB=actualAmount(e.f.scaledB);
    if(!factor||!equal(multiply(b,factor),one)||!equal(scaledA,multiply(a,factor))||!equal(scaledB,one))return null;
    board.normalized={factor:e.f.inverse,a:e.f.scaledA,b:e.f.scaledB};
    normalizations.push({outerIndex:index,factor:pair(reduce(factor)),scaledA:pair(reduce(scaledA)),scaledB:[1,1],
     submitted:{...board.normalized},compatibleReadyPrefixes:compatibility,exactTimingKnown:false});
   }
   previous={...e.f};outerEvents.push(event);
  }
  if(anchorIndex!==anchors.length||!board.started||!same(board,model.board)||!ready.at(-1)||
     fieldKeys.some(k=>!recordFields(task).includes(k)&&model[k]!==previous[k]))return null;
  let estimate=null,simple=null,mixed=null,tile=null,inverse=null,normalized=null;
  if(task.estimate){
   const [lo,hi]=board.estimate.map(s=>actualAmount(s,true));
   const inside=compare(result,lo)>=0&&compare(result,hi)<=0;
   if(model.inside!==(inside?'yes':'no'))return null;
   estimate={bounds:board.estimate.map(String),lower:pair(reduce(lo)),upper:pair(reduce(hi)),
    inclusive:true,result:core.quantities.result,inside,submitted:model.inside};
  }
  if(task.simple){
   const named=actualAmount(model.simple,true);
   if(!equal(named,result)||gcd(...named)!==1n)return null;
   simple={raw:model.simple,value:pair(named),scope:'submitted-name'};
  }
  if(task.mixed){
   const whole=result[0]/result[1],part=[result[0]%result[1],result[1]];
   if(!equal(actualAmount(model.whole),[whole,1n])||!equal(actualAmount(model.part),part))return null;
   mixed={whole:Number(whole),part:pair(reduce(part)),submitted:{whole:model.whole,part:model.part}};
  }
  if(task.tile){
   if(!core.product||!equal(actualAmount(model.tile),big(core.product.cellArea))||
      !equal(actualAmount(model.count),[BigInt(core.product.cellCount),1n]))return null;
   tile={unit:core.product.cellArea,count:core.product.cellCount,area:core.product.area,
    submitted:{tile:model.tile,count:model.count}};
  }
  if(task.inverse){if(!inverseEquation(model.equation,result,b,a))return null;inverse={raw:model.equation,result:core.quantities.result,group:core.quantities.b,total:core.quantities.a,scope:'submitted-equation'};}
  if(task.reciprocal){
   if(!board.normalized||!same([model.inverse,model.scaledA,model.scaledB],
     [board.normalized.factor,board.normalized.a,board.normalized.b]))return null;
   normalized=normalizations.at(-1);
  }
  if(task.story&&!model.story.trim())return null;
  return {operator:task.op,quantities:core.quantities,firstAttempt:board.first,currentStart:starts.at(-1),
   starts,resets,normalizations,outerEvents,construction:core,estimate,simple,mixed,tile,inverse,normalized,
   storyProvided:!!task.story&&!!model.story.trim(),storyMeaningAssessed:false,independentExplanationAssessed:false,
   crossStreamTiming:'paired-start-reset-and-compatible-ready-prefixes',exactCrossStreamTimingKnown:false};
 }catch{return null;}
}
