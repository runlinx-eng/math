// #296: independently derived proportional-unit-rate and function-step evidence.
// This proves recorded original card operations, not independent strategies or mastery.
import * as native from './phase5/b37-model.js';
import {LESSONS} from './catalog.js';
import {matchesNativeEvidenceTask,hasExactKeys,sameEvidence} from './evidence-contract.js';

const TYPE='x-r37-steps';
const CASES=Object.freeze({
 'proportion37:2':{source:'mt_5mIcmKRCgA',steps:['3/2','15'],units:['元/支','元'],
  relation:'unit price = total price / count; total price = unit price x count',
  equation:'6 元 / 4 支 = 3/2 元/支; (3/2 元/支) x 10 支 = 15 元'},
 'ratioLink37:2':{source:'mt_yK51ZnKA8m',steps:['4','12'],units:['x','y'],
  relation:'y = 3x',
  equation:'x = 4; y = 3 x 4 = 12'}
});
const dense=x=>Array.isArray(x)&&Object.keys(x).length===x.length;
function gcd(a,b){a=a<0n?-a:a;b=b<0n?-b:b;while(b){const c=a%b;a=b;b=c;}return a||1n;}
function rational(a,b=1n){if(b===0n)return null;const sign=b<0n?-1n:1n,g=gcd(a,b);return [a*sign/g,b*sign/g];}
function parse(raw){
 if(typeof raw!=='string'||raw.length>96)return null;
 const v=raw.trim().replace(/\s*\/\s*/g,'/');
 if(/^-?\d+\/[1-9]\d*$/.test(v)){const [n,d]=v.split('/');return rational(BigInt(n),BigInt(d));}
 if(!/^-?\d+(?:\.\d+)?$/.test(v))return null;
 const [i,dec='']=v.split('.'),negative=i.startsWith('-');
 return rational(BigInt((negative?i.slice(1):i)+dec)*(negative?-1n:1n),10n**BigInt(dec.length));
}
const eq=(a,b)=>!!a&&!!b&&a[0]===b[0]&&a[1]===b[1];
const fmt=r=>r[1]===1n?String(r[0]):String(r[0])+'/'+String(r[1]);
function independentMath(key){
 if(key==='proportion37:2'){
  const cost=6n,count=4n,newCount=10n;
  const unit=rational(cost,count),total=rational(unit[0]*newCount,unit[1]);
  return [unit,total];
 }
 if(key==='ratioLink37:2'){
  const coefficient=3n,input=4n;
  return [rational(input),rational(coefficient*input)];
 }
 return null;
}
function plan(task,context){
 if(!context||typeof context.sessionId!=='string'||!Number.isSafeInteger(context.index))return null;
 const key=context.sessionId+':'+context.index,c=CASES[key],steps=independentMath(key);
 if(!c||!steps||LESSONS[context.sessionId]?.topicId!==c.source||
  !matchesNativeEvidenceTask(task,context,{type:TYPE,nodeId:c.source})||
  !dense(task.steps)||task.steps.length!==steps.length||
  !dense(task.questions||[])||task.questions.length!==0||
  !task.steps.every((s,i)=>s&&typeof s.title==='string'&&typeof s.label==='string'&&
   (s.kind||'number')==='number'&&eq(parse(String(s.value)),steps[i])))return null;
 return {c,steps,key};
}
export function proportionalStepsBinding(task,context={}){
 try{const p=plan(task,context);return p?{nodeId:p.c.source,method:null,
  question:'怎样先核单位率，再联系输入量与输出量？哪些关系由题卡提供、哪些步骤是实际填写的？'}:null;}
 catch{return null;}
}
export function replayProportionalStepsEvidence(task,model,context={}){
 try{
  const p=plan(task,context);
  if(!p||!native.valid(task,model)||!native.inspect(task,model).correct||
   !dense(model.history)||model.history.length<p.steps.length||model.history.length>2000||
   !dense(model.board?.records)||model.board.index!==p.steps.length||
   model.issue!==''||model.value!==''||model.second!==''||model.choice!==''||
   !dense(model.answers)||model.answers.length!==0)return null;
  let index=0;const wrongStepIndices=[],first={},records=[];
  for(const [at,e] of model.history.entries()){
   if(!hasExactKeys(e,['a','i','v','w','c'])||e.a!=='step'||e.i!==''||
    e.w!==''||e.c!==''||index>=p.steps.length)return null;
   const correct=eq(parse(e.v),p.steps[index]);
   first[index]??=e.v;
   records.push({index,answer:e.v,correct});
   if(correct)index++;else wrongStepIndices.push(at);
  }
  if(index!==p.steps.length||!records.at(-1)?.correct||
   !sameEvidence(first,model.board.first)||!sameEvidence(records,model.board.records)||
   model.board.bad!==(wrongStepIndices.length>0))return null;
  return {kind:'proportional-steps',nodeId:p.c.source,method:null,
   construction:{steps:p.steps.map((r,i)=>({index:i,quantity:fmt(r),unit:p.c.units[i],
    originalLabel:task.steps[i].label})),relation:p.c.relation,equation:p.c.equation,
    records,firstAnswers:first,wrongStepIndices,completedSteps:index,
    originalTaskProvidesStepCards:true},
   eventCount:model.history.length,originalControlsReplayed:true,
   independentRationalMath:true,taskValuesProvided:true,
   independentStrategyAssessed:false,unitExplanationAssessed:false,
   generalProportionalityProofAssessed:false,checkedSubmissionAssessed:false,
   generalMasteryAssessed:false};
 }catch{return null;}
}
