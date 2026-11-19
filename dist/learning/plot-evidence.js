// Source-bound measurement-to-dot-plot evidence. No change to the original
// model, grading, task statements, attempts or State/v2 serialization.
import * as original from './phase5/b28-model.js';
import {sessionTaskFor} from './bridges.js';
import {matchesNativeEvidenceTask,isEvidenceContext,hasExactKeys as keys,sameEvidence as same} from './evidence-contract.js';

const TYPE='x-m28-plot';
const SOURCES=Object.freeze({
 measureplot:{indices:[0,1,2],nodeId:'mt_mayItsxMUu'},
 quarterplot:{indices:[0,1,2],nodeId:'mt_ghK1mnEstc'},
 eighthplot:{indices:[0,1,2],nodeId:'mt_42QD6nYjiZ'},
 modmoney:{indices:[2],nodeId:'mt_iQYPw8bMfN'},
 modelChoice38:{indices:[2],nodeId:'mt_yqZiX6vS7D'}
});
const ASSOCIATED=Object.freeze({
 'link-lengthtools-measureplot':[1],
 'link-measureplot-quarterplot':[0,1],
 'link-quarterplot-eighthplot':[0,1],
 'link-eighthplot-fractiondots':[0],
 'link-measureplot-plot':[], // Explicitly no invented source relationship.
});
const cp=structuredClone, text=s=>typeof s==='string'&&s.length<=1200;
const dense=a=>Array.isArray(a)&&Object.keys(a).length===a.length;
const sourceTask=t=>t?.type===TYPE&&
 Object.entries({...Object.fromEntries(Object.entries(SOURCES).map(([id,s])=>[id,s.indices])),
 ...ASSOCIATED,measureplot:[0,1,2,-1],quarterplot:[0,1,2,-1],
 eighthplot:[0,1,2,-1],modmoney:[2,-1],modelChoice38:[2,-1]})
 .some(([id,indices])=>indices.some(i=>same(sessionTaskFor(id,i),t)));
const gcd=(a,b)=>b?gcd(b,a%b):a<0n?-a:a;
function fraction(n,d){if(d<=0n)return null;const g=gcd(n,d);return{n:n/g,d:d/g};}
function entered(value){
 if(!text(value))return null;const s=value.trim();let m,n,d,v;
 if((m=/^(-?\d+)\s+(\d+)\/(\d+)$/.exec(s))&&BigInt(m[3])>0n){
  d=BigInt(m[3]);n=BigInt(m[1])*d+(m[1].startsWith('-')?-1n:1n)*BigInt(m[2]);
  v=Number(m[1])+(m[1].startsWith('-')?-1:1)*Number(m[2])/Number(m[3]);
 }else if((m=/^(-?\d+)\/(\d+)$/.exec(s))&&BigInt(m[2])>0n){
  n=BigInt(m[1]);d=BigInt(m[2]);v=Number(m[1])/Number(m[2]);
 }else if((m=/^(-?)(\d+)(?:\.(\d+))?$/.exec(s))){
  d=10n**BigInt((m[3]||'').length);
  n=(BigInt(m[2])*d+BigInt(m[3]||'0'))*(m[1]?-1n:1n);v=Number(s);
 }else return null;
 return Number.isFinite(v)?{...fraction(n,d),value:v}:null;
}
const equal=(q,n,d=1n)=>!!q&&q.n*d===n*q.d;
const quantity=(n,d=1n)=>{const q=fraction(n,d);return {numerator:String(q.n),denominator:String(q.d),text:q.d===1n?String(q.n):q.n+'/'+q.d};};
function mathematics(t){
 if(!Array.isArray(t.raw)||!t.raw.length||t.raw.length>100||
  ![1,2,4,8].includes(t.den)||!Number.isSafeInteger(t.rawDen)||t.rawDen<=0||
  !Number.isSafeInteger(t.start)||!Number.isSafeInteger(t.end)||t.end<t.start||
  !t.raw.every(n=>Number.isSafeInteger(n)&&n>=0)||t.end-t.start>200)return null;
 const rounded=t.raw.map(r=>Number((2n*BigInt(r)*BigInt(t.den)+BigInt(t.rawDen))/(2n*BigInt(t.rawDen))));
 if(rounded.some(n=>n<t.start||n>t.end))return null;
 const frequencies=Array(t.end-t.start+1).fill(0);
 for(const n of rounded)frequencies[n-t.start]++;
 const sorted=[...rounded].sort((a,b)=>a-b);
 return{rounded,frequencies,minimum:sorted[0],maximum:sorted.at(-1),range:sorted.at(-1)-sorted[0],
  total:rounded.reduce((a,b)=>a+b,0)};
}
function query(t,q,math){
 const label=q.label,den=BigInt(t.den),freq=math.frequencies;
 if(typeof label!=='string'||q.options)return null;
 let n,d=1n;
 const count=label.match(/^(.+?)(?:英寸| cm) ?(?:有几个|出现几次)$/);
 if(count){
  const value=count[1].replace('½','.5').replace(/\s*1\/8$/,'.125');
  const x=entered(value);if(!x||!(x.n*den%x.d===0n))return null;
  const tick=Number(x.n*den/x.d);n=BigInt(freq[tick-t.start]??0);
 }else if(label.includes('最长是多少')){n=BigInt(math.maximum);d=den;}
 else if(label.includes('最长')&&label.includes('最短')){n=BigInt(math.range);d=den;}
 else if(label.includes('合起来')||label.includes('一共多少')||label.includes('所有长度相加')){n=BigInt(math.total);d=den;}
 else return null;
 if(!equal(entered(String(q.value)),n,d))return null;
 return{label,expected:quantity(n,d)};
}

export function plotBinding(task,context={}){
 try{
  if(!isEvidenceContext(context)||!Object.hasOwn(SOURCES,context.sessionId))return null;
  const src=SOURCES[context.sessionId];
  if(!src.indices.includes(context.index)||!matchesNativeEvidenceTask(task,context,{type:TYPE,nodeId:src.nodeId}))return null;
  return{nodeId:src.nodeId,method:null,
   question:'每条测量记录怎样对应一个点？重复长度为什么仍要放多个点，读图时怎样从刻度和频数核对答案？'};
 }catch{return null;}
}
export function replayPlotEvidence(task,model){
 try{
  const math=mathematics(task);
  if(!math||!sourceTask(task)||!keys(model,['offset','estimate','error','measure','unit','prose','values','answers','seed','board','history','issue'])||
   !['offset','estimate','error','measure','unit','prose','issue'].every(k=>text(model[k]))||
   model.offset!=='2'||model.estimate!==''||model.error!==''||model.unit!==''||
   !dense(model.values)||model.values.length||!dense(model.answers)||
   model.answers.length!==task.questions.length||!model.answers.every(text)||
   !Number.isInteger(model.seed)||model.seed<1||model.seed>4294967295||
   !dense(model.history)||!model.history.length||model.history.length>2000||
   !keys(model.board,['first','bad','selected','records','marks'])||
   !original.valid(task,model)||!original.inspect(task,model).correct)return null;
  const questions=task.questions.map(q=>query(task,q,math));
  if(questions.some(q=>!q)||questions.some((q,i)=>{
    const expected=entered(q.expected.text),actual=entered(model.answers[i]);
    return !expected||!actual||actual.n*expected.d!==expected.n*actual.d;
  }))return null;
  const b={first:{},bad:false,selected:0,records:task.raw.map(()=>null),marks:math.frequencies.map(()=>0)};
  let issue='',first=null;const events=[],records=[];
  for(let index=0;index<model.history.length;index++){
   const e=model.history[index];
   if(!keys(e,['a','d','f']))return null;
   issue='';const event={index,action:e.a};
   if(e.a==='select'){
    if(!keys(e.d,['index'])||!keys(e.f,[])||!/^\d+$/.test(e.d.index))return null;
    const selected=Number(e.d.index);if(!Number.isInteger(selected)||selected>=task.raw.length)return null;
    b.selected=selected;event.selected=selected;
   }else if(e.a==='edit'){
    if(!keys(e.d,[])||!keys(e.f,[]))return null;
    event.invalidated=b.records[b.selected];b.records[b.selected]=null;event.selected=b.selected;
   }else if(e.a==='record'){
    if(!keys(e.d,[])||!keys(e.f,['measure'])||!text(e.f.measure))return null;
    const q=entered(e.f.measure),want=BigInt(math.rounded[b.selected]),selected=b.selected;
    b.records[selected]=null;
    event.selected=selected;event.raw=e.f.measure;
    event.accepted=!!q&&Math.abs(q.value-math.rounded[selected]/task.den)<1e-7;
    event.exact=equal(q,want,BigInt(task.den));
    if(!q)issue='先把这根物体的长度写下来。';
    else{
     b.first['measurement'+selected]??=e.f.measure;
     if(!event.accepted){b.bad=true;issue='再看一下尺上的刻度，按题目要求取最近的单位。';}
     else{b.records[selected]=e.f.measure;records.push({index,selected,raw:e.f.measure,
      expected:quantity(want,BigInt(task.den)),exact:event.exact});}
    }
   }else if(e.a==='mark'||e.a==='unmark'){
    if(!keys(e.d,['index'])||!keys(e.f,[])||!/^\d+$/.test(e.d.index))return null;
    const tick=Number(e.d.index);if(!Number.isInteger(tick)||tick>=b.marks.length)return null;
    const total=b.marks.reduce((a,c)=>a+c,0);
    const applied=e.a==='mark'?total<task.raw.length:b.marks[tick]>0;
    if(applied)b.marks[tick]+=e.a==='mark'?1:-1;
    event.tick=tick;event.applied=applied;
   }else return null;
   event.issue=issue;events.push(event);
  }
  if(!same(b,model.board)||model.issue!==issue||
   b.records.some((raw,i)=>!raw||!equal(entered(raw),BigInt(math.rounded[i]),BigInt(task.den)))||
   !same(b.marks,math.frequencies)||!first&&Object.keys(b.first).length===0)return null;
  // A correct original submission can contain approximate saved strings. It is
  // not promoted to strict evidence until every retained record is exact.
  const bins=math.frequencies.map((frequency,i)=>({length:quantity(BigInt(task.start+i),BigInt(task.den)),
    frequency,marks:b.marks[i]}));
  return{kind:'plot',eventCount:events.length,events,records,
   construction:{unit:task.unit,denominator:task.den,rounded:math.rounded.map(n=>quantity(BigInt(n),BigInt(task.den))),
    bins,questions:questions.map((q,i)=>({...q,raw:model.answers[i]})),
    firstMeasurements:cp(b.first),hadOriginalBad:b.bad,selected:b.selected},
   issue,historyAtCapacity:events.length===2000,historyLimit:2000,
   simulatedLengthsProvided:true,physicalMeasurementAssessed:false,independentRoundingStrategyAssessed:false,
   freeExplanationAssessed:false,generalMasteryAssessed:false};
 }catch{return null;}
}
