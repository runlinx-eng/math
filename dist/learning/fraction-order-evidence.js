// Source-bound observations of fraction construction and ordering. This replay
// is independent of the original B17 grader and never assesses an explanation.
import * as fractions from './phase5/b17-model.js';
import {rational as originalRational} from './phase5/b16-model.js';
import {isEvidenceContext,matchesNativeEvidenceTask,sameEvidence as same,hasExactKeys as keys} from './evidence-contract.js';

const SOURCES=Object.freeze({
 unitorder:{indices:[0,1,2],nodeId:'mt_IfEgu0X449'},
 fractionchoices:{indices:[1],nodeId:'mt_SsLWS_APM7'},
 samepartcompare:{indices:[0,1,2],nodeId:'mt_HnKbuCliNS'},
 fractionbench:{indices:[0,1,2],nodeId:'mt_SXbZ3bC9z7'},
 beyondoneorder:{indices:[0,1,2,3],nodeId:'mt_PL9VkDwXfh'},
 simplestparts:{indices:[1],nodeId:'mt_b7T-CjOYUR'},
 fdpswitch:{indices:[2,4],nodeId:'mt_4K1dr204Hi'},
 fractionsanity:{indices:[2],nodeId:'mt_e7filQgayF'},
 representations39:{indices:[4,5],nodeId:'mt_IwEOCN6bL1'}
});

export function fractionOrderBinding(task,context={}){
 if(!isEvidenceContext(context))return null;
 const source=Object.hasOwn(SOURCES,context.sessionId)?SOURCES[context.sessionId]:null;
 if(!source||!source.indices.includes(context.index)||
    !matchesNativeEvidenceTask(task,context,{type:'x-fracorder',nodeId:source.nodeId}))return null;
 const question=task.common?'把每种小份继续平均分，怎样让它们变成同样大小的小份？换名字时，原来的量会改变吗？':
  task.gaps?'把每个量放在同一个整体上。它们离一个整体还差多少？差得少时，原来的量怎样？':
  task.benchmark?'每个量在一半的哪边？如果两个量都在同一边，只看一半够不够比较？':
  task.mismatch?'两张图的整体一样长吗？先把整体对齐，再比较小份的大小和取出的份数。':
  '这些名字都指向同一个单位。小份的大小和取的份数怎样一起决定位置？先预测，再动手核对。';
 return {nodeId:source.nodeId,question,method:null};
}

const fieldKeys=Object.keys(fractions.fields);
const text=s=>typeof s==='string'&&s.length<=500;
const integer=(n,min=0,max=1000000)=>Number.isSafeInteger(n)&&n>=min&&n<=max;
const gcd=(a,b)=>{while(b)[a,b]=[b,a%b];return a<0n?-a:a;};
const reduce=([n,d])=>{const g=gcd(n,d);return[n/g,d/g];};
const compare=(a,b)=>{const v=a[0]*b[1]-b[0]*a[1];return v<0n?-1:v>0n?1:0;};

// Parse the original string before any Number conversion. An inexact decimal
// must not become an exact fraction merely because floating point rounds it.
function amount(raw){
 if(!text(raw))return null;
 let s=raw.trim().replace(/[−–]/g,'-'),percent=s.endsWith('%');
 if(percent)s=s.slice(0,-1).trim();
 let n,d,m;
 if((m=/^(-?)(\d{1,12})\s+(\d{1,12})\/(\d{1,12})$/.exec(s))){
  const whole=BigInt(m[2]),part=BigInt(m[3]);d=BigInt(m[4]);
  if(d===0n||part>=d)return null;n=whole*d+part;if(m[1])n=-n;
 }else if((m=/^(-?\d{1,12})\/(\d{1,12})$/.exec(s))){n=BigInt(m[1]);d=BigInt(m[2]);}
 else if((m=/^([+-]?)(\d{1,12})(?:\.(\d{1,32}))?$/.exec(s))){
  d=10n**BigInt((m[3]||'').length);n=BigInt(m[2])*d+BigInt(m[3]||'0');if(m[1]==='-')n=-n;
 }else return null;
 if(d<=0n)return null;
 if(percent)d*=100n;
 if(percent||s.includes('.'))[n,d]=reduce([n,d]);
 if(n< -1000000000000n||n>1000000000000n||d>10000000000n)return null;
 return[n,d];
}
const smallPair=r=>r&&r.map(Number);
const index=(s,max)=>text(s)&&/^\d+$/.test(s)&&integer(Number(s),0,max)?Number(s):null;
const toggle=(list,i)=>list.includes(i)?list.filter(x=>x!==i):[...list,i];
const numberOfParts=s=>text(s)&&/^\+?\d+(?:\.0+)?$/.test(s.trim())&&integer(Number(s),1,240)?Number(s):null;

export function replayFractionOrderEvidence(task,model){
 try{
  if(task?.type!=='x-fracorder'||!Array.isArray(task.cards)||!integer(task.cards.length,2,12)||
     !keys(model,[...fieldKeys,'board','history','issue'])||!fieldKeys.every(k=>text(model[k]))||
     !text(model.issue)||!Array.isArray(model.history)||!model.history.length||model.history.length>1500)return null;
  for(const flag of ['desc','mismatch','common','gaps','benchmark'])
   if(task[flag]!==undefined&&typeof task[flag]!=='boolean')return null;
  if(task.gaps&&task.benchmark)return null;
  const values=task.cards.map(amount),low=amount(String(task.min??0)),high=amount(String(task.max??2));
  if(!low||!high||compare(low,high)>=0||values.some(r=>!r||r[0]<=0n||r[1]>240n||
     compare(r,low)<0||compare(r,high)>0)||task.gaps&&values.some(r=>compare(r,[1n,1n])>0))return null;
  if(!fractions.valid(task,model)||!fractions.inspect(task,model).correct)return null;
  const fresh=first=>({prediction:[],first,committed:false,aligned:!task.mismatch,selected:0,
   parts:task.cards.map(()=>[]),placements:{},ordered:[],common:0,renames:{},gaps:{},benchmarks:{}});
  let b=fresh(null),lastPlacement=null,lastRename=null,lastGap=null,lastBenchmark=null,issue='',resetCount=0;
  const events=[],failedRequests=[],ineffectiveRequests=[],placementAttempts=[],predictions=[];
  for(const [historyIndex,e] of model.history.entries()){
   if(!keys(e,['a','d','f'])||!keys(e.f,fieldKeys)||!fieldKeys.every(k=>text(e.f[k])))return null;
   const indexed=['card','select','order'].includes(e.a),shading=e.a==='shade';
   if(!keys(e.d,indexed?['index']:shading?['row','index']:[]))return null;
   const i=indexed?index(e.d.index,task.cards.length-1):null;
   if(indexed&&i===null)return null;
   const before=structuredClone(b);issue='';let accepted=true,reason=null;
   if(e.a==='reset'){
    b=fresh(b.first);lastPlacement=null;lastRename=null;lastGap=null;lastBenchmark=null;resetCount++;
   }else if(e.a==='card'){
    if(b.committed)return null;b.prediction=toggle(b.prediction,i);
   }else if(e.a==='predict'){
    if(b.committed)return null;
    if(b.prediction.length!==task.cards.length){accepted=false;reason='incomplete-prediction';}
    else{b.first??=[...b.prediction];b.committed=true;predictions.push({historyIndex,epoch:resetCount,order:[...b.prediction]});}
   }else if(e.a==='align'){
    if(!task.mismatch||!b.committed||b.aligned)return null;b.aligned=true;
   }else if(e.a==='select'){
    // Selecting the current card is legitimate navigation, not a claimed new
    // mathematical operation; all original solve paths do this for card zero.
    if(!b.committed)return null;b.selected=i;
   }else if(e.a==='shade'){
    const row=index(e.d.row,task.cards.length-1);if(row===null||!b.committed)return null;
    const [n,d]=values[row],capacity=Number(((n+d-1n)/d)*d),part=index(e.d.index,capacity-1);
    if(part===null)return null;
    // The original view renders these buttons before alignment, while the
    // model deliberately ignores them. Do not manufacture a painted part.
    if(!b.aligned){accepted=false;reason='whole-not-aligned';}
    else b.parts[row]=toggle(b.parts[row],part);
   }else if(e.a==='place'){
    if(!b.committed||!b.aligned)return null;
    const admitted=fractions.frac(e.f.position),position=amount(e.f.position);
    if(admitted&&(!position||compare(position,admitted.map(BigInt))!==0))return null;
    if(!admitted||!position||compare(position,low)<0||compare(position,high)>0){
     accepted=false;reason='outside-axis';issue='把位置写成分数或小数，放在这条线的范围里。';
    }else{
     b.placements[b.selected]=e.f.position;lastPlacement=e.f.position;
     placementAttempts.push({historyIndex,epoch:resetCount,index:b.selected,position:e.f.position,
      matchesCard:compare(position,values[b.selected])===0});
    }
   }else if(e.a==='order'){
    if(!b.committed)return null;b.ordered=toggle(b.ordered,i);
   }else if(e.a==='common'){
    if(!task.common||!b.committed||!b.aligned)return null;
    const original=Number(e.f.denom),den=numberOfParts(e.f.denom);
    if(!integer(original,1,240)||values.some(([,d])=>original%Number(d))){
     accepted=false;reason='invalid-common-parts';issue='新的小份要能把每一种原来的份都整齐细分。';
    }else{if(den===null)return null;b.common=den;b.renames={};lastRename=null;}
   }else if(e.a==='rename'){
    if(!task.common||!b.common||!b.committed||!b.aligned)return null;
    const [n,d]=values[b.selected],name=`${n*BigInt(b.common)/d}/${b.common}`;
    if(e.f.fraction.replace(/\s/g,'')!==name){accepted=false;reason='incorrect-rename';issue='一小份变小了，取的份数也要跟着变。';}
    else{b.renames[b.selected]=e.f.fraction;lastRename=e.f.fraction;}
   }else if(e.a==='landmark'){
    if(!b.committed||!b.aligned)return null;
    if(task.gaps){
     const [n,d]=values[b.selected],gap=amount(e.f.answer),admitted=originalRational(e.f.answer);
     if(admitted&&(!gap||compare(gap,admitted.map(BigInt))!==0))return null;
     if(!admitted||!gap||compare(gap,[d-n,d])!==0){
      accepted=false;reason='incorrect-gap';issue='从这个点到1，还差多少？';
     }else{
      b.gaps[b.selected]=e.f.answer;lastGap=e.f.answer;
     }
    }else if(task.benchmark){
     const relation=['<','=','>'][compare(values[b.selected],[1n,2n])+1];
     if(!['','<','=','>'].includes(e.f.relation))return null;
     if(e.f.relation!==relation){accepted=false;reason='incorrect-benchmark';issue='看一看它在一半的哪边。';}
     else{b.benchmarks[b.selected]=e.f.relation;lastBenchmark=e.f.relation;}
    }else return null;
   }else return null;
   const entry={historyIndex,epoch:resetCount,action:e.a,data:structuredClone(e.d),fields:structuredClone(e.f),
    accepted,reason,before,after:structuredClone(b),issue};events.push(entry);
   if(!accepted)failedRequests.push(entry);else if(same(before,b))ineffectiveRequests.push(entry);
  }
  if(!same(b,model.board)||model.issue!==issue||!b.committed||!b.aligned||model.position!==lastPlacement||
     task.common&&model.fraction!==lastRename||task.gaps&&model.answer!==lastGap||
     task.benchmark&&model.relation!==lastBenchmark||b.ordered.length!==task.cards.length||
     values.some(([n],i)=>BigInt(b.parts[i].length)!==n||!Object.hasOwn(b.placements,i)||
      compare(amount(b.placements[i]),values[i])!==0)||
     b.ordered.some((i,j)=>j>0&&(task.desc?compare(values[b.ordered[j-1]],values[i])<0:
      compare(values[b.ordered[j-1]],values[i])>0))||
     task.common&&(!b.common||numberOfParts(model.denom)!==b.common||values.some((_,i)=>!Object.hasOwn(b.renames,i)))||
     task.gaps&&values.some((_,i)=>!Object.hasOwn(b.gaps,i))||
     task.benchmark&&values.some((_,i)=>!Object.hasOwn(b.benchmarks,i)))return null;
  return {cards:[...task.cards],fractions:values.map(smallPair),prediction:b.first.map(i=>task.cards[i]),
   history:{events,failedRequests,ineffectiveRequests,placementAttempts,predictions,resetCount},
   ordered:b.ordered.map(i=>task.cards[i]),direction:task.desc?'descending':'ascending',
   placements:task.cards.map((card,i)=>({card,position:b.placements[i]})),
   shadeCounts:b.parts.map(parts=>parts.length),aligned:!!task.mismatch,
   common:task.common?{denominator:b.common,renames:task.cards.map((card,i)=>({card,name:b.renames[i]}))}:null,
   gaps:task.gaps?task.cards.map((card,i)=>({card,distance:b.gaps[i]})):null,
   benchmarks:task.benchmark?task.cards.map((card,i)=>({card,relation:b.benchmarks[i]})):null};
 }catch{return null;}
}
