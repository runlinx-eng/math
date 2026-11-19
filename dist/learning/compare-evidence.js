// B28 direct, indirect and ordered lengths: replay only visible operations.
// Lengths, drawings and comparator choices are supplied by each original task.
// No physical measurement, independent inference or mastery is inferred here.
import * as original from './phase5/b28-model.js';
import {sessionTaskFor} from './bridges.js';
import {matchesNativeEvidenceTask,isEvidenceContext,hasExactKeys as keys,sameEvidence as same} from './evidence-contract.js';

const TYPE='x-m28-compare';
const SOURCES=Object.freeze({
 compareheight:{nodeId:'mt_uhuxX8sg9f',indices:[0,1,2]},
 ordermeasure:{nodeId:'mt_BFJ-ch_8QU',indices:[0,2]},
 indirectlength:{nodeId:'mt_skYly2Qm01',indices:[0,1,2]},
 lengthdifference:{nodeId:'mt_xWg0lI_gG4',indices:[0,1,2]}
});
const text=x=>typeof x==='string'&&x.length<=1200;
const dense=a=>Array.isArray(a)&&Object.keys(a).length===a.length;
const cp=structuredClone;
const integer=(n,min,max)=>Number.isSafeInteger(n)&&n>=min&&n<=max;
const canonicalIndex=(value,max)=>typeof value==='string'&&/^(?:0|[1-9]\d*)$/.test(value)&&
 integer(Number(value),0,max)?Number(value):null;
const sourceTask=t=>t?.type===TYPE&&Object.entries(SOURCES).some(([id,s])=>
 s.indices.some(index=>same(sessionTaskFor(id,index),t)));
const gcd=(a,b)=>b?gcd(b,a%b):a<0n?-a:a;
function parseNumber(raw){
 if(!text(raw))return null;
 const m=/^(-?)(\d+)(?:\.(\d+))?$/.exec(raw.trim());
 if(!m||m[2].length>120||((m[3]||'').length>120))return null;
 const d=10n**BigInt((m[3]||'').length);
 const n=(BigInt(m[2])*d+BigInt(m[3]||'0'))*(m[1]?-1n:1n);
 const g=gcd(n,d);return{n:n/g,d:d/g};
}
function mathematicalQuestions(task,lengths){
 const max=BigInt(Math.max(...lengths)),min=BigInt(Math.min(...lengths));
 const q=[];
 for(const question of task.questions){
  if(!keys(question,question.options?['label','value','options']:['label','value'])||
     typeof question.label!=='string')return null;
  const label=question.label;let n,d=1n,word=null,kind;
  if(typeof question.value==='number'){
   if(/几倍/.test(label)){if(min<=0n)return null;n=max;d=min;kind='ratio';}
   else if(/长多少|高多少|相差多少/.test(label)){n=max-min;kind='difference';}
   else return null;
   const g=gcd(n,d);n/=g;d/=g;
   const expected=parseNumber(String(question.value));
   if(!expected||expected.n*d!==n*expected.d||question.options)return null;
  }else if(typeof question.value==='string'&&Array.isArray(question.options)){
   if(/相等时用什么符号/.test(label)){word=lengths[0]===lengths[1]?'=':null;kind='equality';}
   else if(/与.*的关系/.test(label)){word=lengths[0]>lengths[1]?'>':lengths[0]<lengths[1]?'<':'=';kind='comparison';}
   else if(/A比B长、B比C长/.test(label)){
    word=lengths.length===3&&lengths[0]>lengths[1]&&lengths[1]>lengths[2]?'yes':null;
    kind='transitivity';
   }else return null;
   if(word===null||question.value!==word||!question.options.some(x=>
      Array.isArray(x)&&x[0]===word&&typeof x[1]==='string'))return null;
  }else return null;
  q.push({label,kind,expected:word===null?
    {numerator:String(n),denominator:String(d),text:d===1n?String(n):String(n)+'/'+String(d)}:
    {choice:word}});
 }
 return q;
}
function mathematicalPlan(t){
 if(t?.type!==TYPE||!dense(t.items)||t.items.length<2||t.items.length>4||
    !t.items.every(item=>keys(item,['name','length'])&&text(item.name)&&
      integer(item.length,1,1000000000))||!dense(t.questions))return null;
 const lengths=t.items.map(x=>x.length);
 const mode=t.mode||'compare';
 if(!['compare','order','indirect'].includes(mode))return null;
 let winner=null;
 if(mode==='order'){if(t.want!==null)return null;}
 else if(mode==='indirect'){
  if(t.items.length!==3)return null;
  const greatest=Math.max(...lengths),index=lengths.indexOf(greatest);
  if(lengths.filter(x=>x===greatest).length!==1)return null;
  winner=['left','right','third'][index];
 }else{
  if(t.items.length!==2)return null;
  winner=lengths[0]>lengths[1]?'left':lengths[0]<lengths[1]?'right':'equal';
 }
 if(mode!=='order'&&(t.want!==winner||!dense(t.choices)||!t.choices.some(c=>c.id===winner)))
  return null;
 const questions=mathematicalQuestions(t,lengths);
 if(!questions)return null;
 // Relations are computed from task-supplied integer lengths, not inferred student work.
 const pairwiseRelations=[];
 for(let i=0;i<lengths.length;i++)for(let j=i+1;j<lengths.length;j++){
  const signedDifference=lengths[i]-lengths[j];
  pairwiseRelations.push({firstIndex:i,secondIndex:j,
   relation:signedDifference>0?'>':signedDifference<0?'<':'=',
   signedDifference:String(signedDifference)});
 }
 return{mode,winner,questions,lengths,pairwiseRelations,
  sortedIndices:lengths.map((length,index)=>({length,index})).sort((a,b)=>a.length-b.length||a.index-b.index)
    .map(x=>x.index),
  difference:Math.max(...lengths)-Math.min(...lengths)};
}
export function compareBinding(task,context={}){
 try{
  if(!isEvidenceContext(context)||!Object.hasOwn(SOURCES,context.sessionId))return null;
  const s=SOURCES[context.sessionId];
  if(!s.indices.includes(context.index)||!matchesNativeEvidenceTask(task,context,{type:TYPE,nodeId:s.nodeId}))return null;
  return{nodeId:s.nodeId,method:null,
   question:'比较长短时，起点、长度和顺序各起什么作用？不能放在一起的物体，怎样用同一份记录比较？'};
 }catch{return null;}
}
export function replayCompareEvidence(task,model){
 try{
  const plan=mathematicalPlan(task);
  if(!plan||!sourceTask(task)||!keys(model,['offset','estimate','error','measure','unit','prose','values','answers','seed','board','history','issue'])||
   !['offset','estimate','error','measure','unit','prose','issue'].every(k=>text(model[k]))||
   model.estimate!==''||model.error!==''||model.measure!==''||model.unit!==''||
   model.issue!==''||!dense(model.values)||model.values.length||
   !dense(model.answers)||model.answers.length!==plan.questions.length||!model.answers.every(text)||
   !integer(model.seed,1,4294967295)||!dense(model.history)||
   !model.history.length||model.history.length>2000||
   !keys(model.board,['first','bad','offset','order','copied','choice'])||
   !original.valid(task,model)||!original.inspect(task,model).correct)return null;
  for(let i=0;i<plan.questions.length;i++){
   const expected=plan.questions[i].expected,raw=model.answers[i];
   if(Object.hasOwn(expected,'choice')){if(raw!==expected.choice)return null;}
   else{const q=parseNumber(raw);if(!q||
    q.n*BigInt(expected.denominator)!==BigInt(expected.numerator)*q.d)return null;}
  }
  const board={first:{},bad:false,offset:task.initialOffset??2,order:[],copied:[],choice:null};
  let lastOffset=String(task.initialOffset??2),aligned=false;
  const events=[],selections=[],firstWrong=[],copies=[],orders=[],resets=[];
  for(let index=0;index<model.history.length;index++){
   const e=model.history[index];
   if(!keys(e,['a','d','f']))return null;
   const event={index,action:e.a};
   if(e.a==='align'){
    if(plan.mode==='indirect'||!keys(e.d,[])||!keys(e.f,['offset'])||
       !text(e.f.offset)||!/^(?:0|[1-3]|-[1-3])$/.test(e.f.offset))return null;
    const offset=Number(e.f.offset);board.offset=offset;
    lastOffset=e.f.offset;aligned=true;
    event.offset=offset;event.zeroAligned=offset===0;
   }else if(e.a==='choice'){
    if(plan.mode==='order'||!keys(e.d,['index'])||!keys(e.f,[])||
      !task.choices?.some(c=>c.id===e.d.index))return null;
    const value=e.d.index,correct=value===plan.winner;
    board.first.choice??=value;if(!correct)board.bad=true;
    board.choice=value;event.choice=value;event.correct=correct;
    selections.push({index,value,correct});
    if(!correct)firstWrong.push({index,value});
   }else if(e.a==='copy'){
    if(plan.mode!=='indirect'||!keys(e.d,['index'])||!keys(e.f,[]))return null;
    const n=canonicalIndex(e.d.index,task.items.length-1);
    if(n===null)return null;
    const changed=!board.copied.includes(n);
    if(changed)board.copied.push(n);
    event.item=n;event.recorded=changed;copies.push({index,item:n,recorded:changed});
   }else if(e.a==='order'){
    if(plan.mode!=='order'||!keys(e.d,['index'])||!keys(e.f,[]))return null;
    const n=canonicalIndex(e.d.index,task.items.length-1);
    if(n===null)return null;
    const changed=!board.order.includes(n);
    if(changed)board.order.push(n);
    event.item=n;event.appended=changed;
    orders.push({index,item:n,appended:changed});
   }else if(e.a==='clear'){
    if(plan.mode!=='order'||!keys(e.d,[])||!keys(e.f,[]))return null;
    resets.push({index,previousOrder:board.order.slice()});
    board.order=[];event.cleared=true;
   }else return null; // No hidden help or cross-widget controller calls.
   events.push(event);
  }
  if(!same(board,model.board)||model.offset!==lastOffset||
   (plan.mode==='indirect'&&aligned)||
   (plan.mode!=='indirect'&&(!aligned||board.offset!==0))||
   (plan.mode==='order'?
    board.order.length!==plan.lengths.length||
    !board.order.every((n,i)=>i===0||plan.lengths[board.order[i-1]]<=plan.lengths[n]):
    board.choice!==plan.winner)||
   (plan.mode==='indirect'&&board.copied.length!==plan.lengths.length))return null;
  return{
   kind:'length-comparison',mode:plan.mode,eventCount:events.length,events,
   construction:{
    objects:task.items.map((x,i)=>({index:i,name:x.name,length:String(x.length)})),
    presentedLengths:true,measurementPerformed:false,
    suppliedPairwiseRelations:cp(plan.pairwiseRelations),
    alignmentObserved:aligned,finalZeroAligned:plan.mode!=='indirect'&&board.offset===0,
    choiceHistory:selections,firstWrongChoices:firstWrong,
    copyHistory:copies,recordedItems:board.copied.slice(),
    orderHistory:orders,clearedOrders:resets,
    orderedIndices:board.order.slice(),lengthDifference:String(plan.difference),
    questions:plan.questions.map((q,i)=>({...q,raw:model.answers[i]})),
    originalFirst:cp(board.first),originalBad:board.bad
   },
   method:null,
   independentMeasurementAssessed:false,independentStrategyAssessed:false,
   transferAssessed:false,freeExplanationAssessed:false,generalMasteryAssessed:false,
   originalHistoryLimit:2000,historyAtCapacity:model.history.length===2000
  };
 }catch{return null;}
}
