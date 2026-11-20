// Issue #323: exact two-position unit-rate step evidence, intentionally unregistered.
// Only original saved r37-step events are replayed; source cards supply the plan.
import * as native from './phase5/b37-model.js';
import {matchesNativeEvidenceTask,hasExactKeys,sameEvidence} from './evidence-contract.js';

const TYPE='x-r37-steps';
const CASES=Object.freeze({
 'rateWords37:2':Object.freeze({nodeId:'mt_ATYLKt0je-',choice:'mph',
  units:['英里','英里/小时','英里/小时'],meaning:'120 miles across 2 hours; average miles per hour'}),
 'proportionGraph37:2':Object.freeze({nodeId:'mt_FspV_imUGK',choice:'zero',
  units:['元/千克','元','元'],meaning:'6 yuan for 3 kilograms at a constant unit price'})
});
const dense=a=>Array.isArray(a)&&Object.keys(a).length===a.length;
const gcd=(a,b)=>{a=a<0n?-a:a;b=b<0n?-b:b;while(b){[a,b]=[b,a%b];}return a||1n;};
const fraction=(n,d=1n)=>{if(d===0n)return null;const sign=d<0n?-1n:1n,g=gcd(n,d);return[n*sign/g,d*sign/g];};
function parse(raw){
 if(typeof raw!=='string'||raw.length>96)return null;
 const s=raw.trim().replace(/\s*\/\s*/g,'/');
 if(/^-?\d+\/[1-9]\d*$/.test(s)){const [a,b]=s.split('/');return fraction(BigInt(a),BigInt(b));}
 if(!/^-?\d+(?:\.\d+)?$/.test(s))return null;
 const [whole,decimal='']=s.split('.'),negative=whole.startsWith('-');
 return fraction(BigInt((negative?whole.slice(1):whole)+decimal)*(negative?-1n:1n),10n**BigInt(decimal.length));
}
const eq=(a,b)=>!!a&&!!b&&a[0]===b[0]&&a[1]===b[1];
const show=a=>a[1]===1n?String(a[0]):String(a[0])+'/'+String(a[1]);
function independent(key){
 if(key==='rateWords37:2'){
  const miles=120n,hours=2n,rate=fraction(miles,hours);
  return [fraction(miles),rate];
 }
 if(key==='proportionGraph37:2'){
  const yuan=6n,kilograms=3n,targetKilograms=5n,rate=fraction(yuan,kilograms);
  return [rate,fraction(rate[0]*targetKilograms,rate[1])];
 }
 return null;
}
function plan(task,context){
 if(!context||typeof context.sessionId!=='string'||!Number.isSafeInteger(context.index))return null;
 const key=context.sessionId+':'+context.index,c=CASES[key],values=independent(key);
 if(!c||!values||!matchesNativeEvidenceTask(task,context,{type:TYPE,nodeId:c.nodeId})||
  !dense(task.steps)||task.steps.length!==3||
  !dense(task.questions||[])||task.questions.length!==0)return null;
 for(let i=0;i<3;i++){
  const s=task.steps[i];if(!s||typeof s.title!=='string'||typeof s.label!=='string')return null;
  if(i<2){if(s.kind==='choice'||!eq(parse(String(s.value)),values[i]))return null;}
  else if(s.kind!=='choice'||s.value!==c.choice||!dense(s.options)||
   s.options.length!==2||!s.options.some(o=>Array.isArray(o)&&o[0]===c.choice)||
   !s.options.every(o=>Array.isArray(o)&&o.length===2&&typeof o[1]==='string'))return null;
 }
 return {key,c,values};
}
export function unitRateStepsBinding(task,context={}){
 try{const p=plan(task,context);return p?{nodeId:p.c.nodeId,method:null,
  question:'题卡给出了哪些量？实际记录的每步怎样形成单位率？最后选择的单位或零输入是否对应这个关系？'}:null;}
 catch{return null;}
}
export function replayUnitRateStepsEvidence(task,model,context={}){
 try{
  const p=plan(task,context);
  if(!p||!native.valid(task,model)||!native.inspect(task,model).correct||
   !dense(model.history)||model.history.length<3||model.history.length>2000||
   !dense(model.board?.records)||model.board.index!==3||model.issue!==''||
   model.value!==''||model.second!==''||model.choice!==''||
   !dense(model.answers)||model.answers.length!==0)return null;
  const records=[],first={},wrongStepIndices=[];
  let index=0;
  for(const [at,e] of model.history.entries()){
   if(!hasExactKeys(e,['a','i','v','w','c'])||e.a!=='step'||e.i!==''||e.w!==''||index>=3)return null;
   if(index<2&&e.c!=='')return null;
   if(index===2&&e.v!=='')return null;
   const answer=index===2?e.c:e.v;
   const correct=index===2?answer===p.c.choice:eq(parse(answer),p.values[index]);
   first[index]??=answer;
   records.push({index,answer,correct});
   if(correct)index++;else wrongStepIndices.push(at);
  }
  if(index!==3||!records.at(-1)?.correct||
   !sameEvidence(records,model.board.records)||!sameEvidence(first,model.board.first)||
   model.board.bad!==(wrongStepIndices.length>0))return null;
  return {kind:'unit-rate-saved-steps',nodeId:p.c.nodeId,method:null,
   construction:{originalPosition:p.key,steps:[
    ...p.values.map((v,i)=>({index:i,quantity:show(v),unit:p.c.units[i],originalLabel:task.steps[i].label})),
    {index:2,choice:p.c.choice,originalLabel:task.steps[2].label}],
    meaning:p.c.meaning,records,firstAnswers:first,wrongStepIndices,completedSteps:index,
    originalTaskProvidesStepCards:true,choiceRecorded:true},
   eventCount:model.history.length,originalControlsReplayed:true,independentRationalMath:true,
   independentStrategyAssessed:false,unitExplanationAssessed:false,
   generalProportionalityProofAssessed:false,checkedSubmissionAssessed:false,generalMasteryAssessed:false};
 }catch{return null;}
}
