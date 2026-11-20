// #286/B37: replay three original percentage changes using independent exact
// arithmetic and the native step-event history. Never change grading or records.
import * as native from './phase5/b37-model.js';
import {LESSONS} from './catalog.js';
import {matchesNativeEvidenceTask,hasExactKeys,sameEvidence} from './evidence-contract.js';

const TYPE='x-r37-steps';
const POSITIONS=Object.freeze({pctChange37:Object.freeze([0,1,2])});
const dense=a=>Array.isArray(a)&&Object.keys(a).length===a.length;
function gcd(a,b){a=a<0n?-a:a;while(b){const c=a%b;a=b;b=c;}return a||1n;}
function fraction(raw){
 if(typeof raw!=='string'||raw.length>96)return null;
 const s=raw.trim().replace(/\s*\/\s*/g,'/');
 let n,d;
 if(/^-?\d+\/[1-9]\d*$/.test(s)){
  const a=s.split('/');n=BigInt(a[0]);d=BigInt(a[1]);
 }else if(/^-?\d+(?:\.\d+)?$/.test(s)){
  const [whole,dec='']=s.split('.'),neg=whole.startsWith('-');
  n=BigInt((neg?whole.slice(1):whole)+dec)*(neg?-1n:1n);d=10n**BigInt(dec.length);
 }else return null;
 const g=gcd(n,d);return [n/g,d/g];
}
const integer=n=>[BigInt(n),1n];
const norm=(n,d)=>{if(d===0n)return null;const sign=d<0n?-1n:1n,g=gcd(n,d);return[n*sign/g,d*sign/g];};
const mul=(a,b)=>norm(a[0]*b[0],a[1]*b[1]);
const div=(a,b)=>b[0]===0n?null:norm(a[0]*b[1],a[1]*b[0]);
const add=(a,b)=>norm(a[0]*b[1]+b[0]*a[1],a[1]*b[1]);
const value=a=>a[1]===1n?String(a[0]):String(a[0])+'/'+String(a[1]);
const equal=(raw,r)=>{const p=fraction(raw);return !!p&&p[0]===r[0]&&p[1]===r[1];};
function arithmetic(index){
 if(index===0){
  const original=integer(240),increase=mul(original,div(integer(15),integer(100)));
  const after=add(original,increase);
  return [original,increase,after,div(after,original)];
 }
 if(index===1){
  const after=integer(64),part=div(after,integer(4));
  return [after,part,mul(part,integer(5))];
 }
 if(index===2){
  const principal=integer(500),annual=mul(principal,div(integer(3),integer(100)));
  const four=mul(annual,integer(4));
  return [annual,four,add(principal,four)];
 }
 return null;
}
function source(task,context){
 if(!context||!Object.hasOwn(POSITIONS,context.sessionId)||
    !POSITIONS[context.sessionId].includes(context.index))return null;
 const nodeId=LESSONS[context.sessionId]?.topicId;
 return nodeId&&matchesNativeEvidenceTask(task,context,{type:TYPE,nodeId})?nodeId:null;
}
function plan(task,context){
 const nodeId=source(task,context);
 if(!nodeId)return null;
 const amounts=arithmetic(context.index);
 if(!amounts||!dense(task.steps)||task.steps.length!==amounts.length||
    !dense(task.questions||[])||task.questions.length!==0||
    !task.steps.every((s,i)=>s&&s.kind!=='choice'&&typeof s.title==='string'&&
      typeof s.label==='string'&&equal(String(s.value),amounts[i])))return null;
 return {nodeId,amounts};
}
export function pctChangeBinding(task,context={}){
 try{const p=plan(task,context);return p?{nodeId:p.nodeId,method:null,
   question:'原来的量、变化的部分和变化后的量怎么分清？简单利息每年按谁来算？'}:null;}catch{return null;}
}
export function replayPctChangeEvidence(task,model,context={}){
 try{
  const p=plan(task,context);
  if(!p||!native.valid(task,model)||!native.inspect(task,model).correct||
     !dense(model.history)||model.history.length<p.amounts.length||model.history.length>2000||
     !dense(model.board?.records)||model.board.index!==p.amounts.length||
     model.issue!=='')return null;
  let index=0;const wrong=[],first={},records=[];
  for(const [at,e] of model.history.entries()){
   if(!hasExactKeys(e,['a','i','v','w','c'])||e.a!=='step'||e.i!==''||index>=p.amounts.length)return null;
   const answer=e.v,correct=equal(answer,p.amounts[index]);
   first[index]??=answer;records.push({index,answer,correct});
   if(correct)index++;else wrong.push(at);
  }
  if(index!==p.amounts.length||!records.at(-1)?.correct||
     !sameEvidence(first,model.board.first)||!sameEvidence(records,model.board.records)||
     model.board.bad!==(wrong.length>0)||model.value!==''||model.choice!=='')return null;
  return {kind:'percent-change-steps',nodeId:p.nodeId,method:null,
   construction:{steps:p.amounts.map((a,i)=>({index:i,quantity:value(a),label:task.steps[i].label})),
     records,firstAnswers:first,wrongStepIndices:wrong,completedSteps:index},
   eventCount:model.history.length,originalControlsReplayed:true,
   taskValuesProvided:true,independentStrategyAssessed:false,
   realWorldMeasurementAssessed:false,checkedSubmissionAssessed:false,
   compoundInterestAssessed:false,generalMasteryAssessed:false};
 }catch{return null;}
}
