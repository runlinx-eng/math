// #325: exact B38 original estimation-step evidence. This file alone grants no A rating.
// The task supplies the estimation steps; only the original saved actions are observed.
import * as native from './phase5/b37-model.js';
import {matchesNativeEvidenceTask,hasExactKeys,sameEvidence} from './evidence-contract.js';

const TYPE='x-r37-steps';
const CASES=Object.freeze({
 'complex38:1':Object.freeze({nodeId:'mt_GpltXPoaoc',values:['5000','35000'],choice:'yes',
  prompt:'4832×7先估一估。有人算得33824，量级是否说得通？',
  scene:'估计只检查大致范围，不证明准确。',
  labels:['4832取到最近的千是多少','5000×7是多少','33824与估计的量级是否接近']}),
 'advancedPlan38:3':Object.freeze({nodeId:'mt_FieL-vVTI_',values:['20','4','5'],choice:'yes',
  prompt:'19.8÷4.1有人得到约4.83。先估一估，这个数量级说得通吗？',
  scene:'用20÷4先估范围；估计接近不等于准确证明。',
  labels:['19.8接近多少','4.1接近多少','20÷4约是多少','4.83与估计是否接近']})
});
const dense=a=>Array.isArray(a)&&Object.keys(a).length===a.length;
const gcd=(a,b)=>{a=a<0n?-a:a;b=b<0n?-b:b;while(b)[a,b]=[b,a%b];return a||1n;};
const rat=(a,b=1n)=>{if(b===0n)return null;const sign=b<0n?-1n:1n,g=gcd(a,b);return[a*sign/g,b*sign/g];};
function parse(raw){
 if(typeof raw!=='string'||raw.length>96)return null;
 const s=raw.trim().replace(/\s*\/\s*/g,'/');
 if(/^-?\d+\/[1-9]\d*$/.test(s)){const [a,b]=s.split('/');return rat(BigInt(a),BigInt(b));}
 if(!/^-?\d+(?:\.\d+)?$/.test(s))return null;
 const [whole,decimal='']=s.split('.'),negative=whole.startsWith('-');
 return rat(BigInt((negative?whole.slice(1):whole)+decimal)*(negative?-1n:1n),10n**BigInt(decimal.length));
}
const eq=(a,b)=>!!a&&!!b&&a[0]===b[0]&&a[1]===b[1];
const abs=n=>n<0n?-n:n;
function independentlyCalculated(key){
 if(key==='complex38:1'){
  const original=4832n,nearestThousand=((original+500n)/1000n)*1000n;
  const estimatedProduct=nearestThousand*7n,actual=original*7n,claimed=33824n;
  if(actual!==claimed||estimatedProduct!==35000n||
   abs(estimatedProduct-actual)*100n>=estimatedProduct*5n)return null;
  return {numbers:[rat(nearestThousand),rat(estimatedProduct)],actual:rat(actual),
   estimate:rat(estimatedProduct),reference:'4832 × 7 = 33824; nearest-thousand estimate 5000 × 7 = 35000',
   relation:'This particular exact product is within 5% of its supplied estimate; no universal closeness rule is asserted'};
 }
 if(key==='advancedPlan38:3'){
  const numerator=rat(198n,10n),denominator=rat(41n,10n);
  const exact=rat(numerator[0]*denominator[1],numerator[1]*denominator[0]);
  const reported=rat(483n,100n),estimate=rat(20n,4n);
  // Check two-decimal rounding of 198/41 and the supplied rough comparison separately.
  if(!eq(exact,rat(198n,41n))||!eq(reported,rat(483n,100n))||
   abs(exact[0]*reported[1]-reported[0]*exact[1])*200n>=exact[1]*reported[1]||
   abs(estimate[0]*exact[1]-exact[0]*estimate[1])*100n>=estimate[0]*exact[1]*5n)return null;
  return {numbers:[rat(20n),rat(4n),estimate],actual:exact,estimate,
   reference:'19.8 ÷ 4.1 = 198/41, whose two-decimal rounding is 4.83; 20 ÷ 4 = 5',
   relation:'This particular exact quotient is within 5% of its supplied estimate; no universal closeness rule is asserted'};
 }
 return null;
}
function plan(task,context){
 if(!context||typeof context.sessionId!=='string'||!Number.isSafeInteger(context.index))return null;
 const key=context.sessionId+':'+context.index,c=CASES[key],math=independentlyCalculated(key);
 if(!c||!math||!matchesNativeEvidenceTask(task,context,{type:TYPE,nodeId:c.nodeId})||
  task.prompt!==c.prompt||task.scene!==c.scene||!dense(task.steps)||
  task.steps.length!==c.labels.length||!dense(task.questions||[])||(task.questions||[]).length)return null;
 for(let i=0;i<c.labels.length;i++){
  const step=task.steps[i];
  if(!step||typeof step.title!=='string'||step.label!==c.labels[i]||
   typeof step.hint!=='undefined')return null;
  if(i<c.values.length){
   if(step.kind==='choice'||!eq(parse(String(step.value)),math.numbers[i]))return null;
  }else if(step.kind!=='choice'||step.value!==c.choice||!dense(step.options)||
   step.options.length!==2||!step.options.every(x=>Array.isArray(x)&&x.length===2&&
   typeof x[0]==='string'&&typeof x[1]==='string')||
   !step.options.some(x=>x[0]===c.choice))return null;
 }
 return {key,c,math};
}
export function estimateStepsBinding(task,context={}){
 try{const p=plan(task,context);return p?{nodeId:p.c.nodeId,method:null,
  question:'题卡给出的近似步骤是怎样逐次保存的？估算值与本题的精确计算是否在同一数量级？'}:null;}
 catch{return null;}
}
export function replayEstimateStepsEvidence(task,model,context={}){
 try{
  const p=plan(task,context);
  if(!p||!native.valid(task,model)||!native.inspect(task,model).correct||
   !dense(model.history)||model.history.length<p.c.labels.length||model.history.length>2000||
   !dense(model.board?.records)||model.board.index!==p.c.labels.length||
   model.issue!==''||model.value!==''||model.second!==''||model.choice!==''||
   !dense(model.answers)||model.answers.length!==0)return null;
  const records=[],first={},wrongStepIndices=[];
  let index=0;
  for(const [at,e] of model.history.entries()){
   if(!hasExactKeys(e,['a','i','v','w','c'])||e.a!=='step'||e.i!==''||
    e.w!==''||index>=p.c.labels.length)return null;
   const terminal=index===p.c.values.length;
   if(terminal?e.v!=='':e.c!=='')return null;
   const answer=terminal?e.c:e.v;
   const correct=terminal?answer===p.c.choice:eq(parse(answer),p.math.numbers[index]);
   first[index]??=answer;
   records.push({index,answer,correct});
   if(correct)index++;else wrongStepIndices.push(at);
  }
  if(index!==p.c.labels.length||!records.at(-1)?.correct||
   !sameEvidence(records,model.board.records)||!sameEvidence(first,model.board.first)||
   model.board.bad!==(wrongStepIndices.length>0))return null;
  return {kind:'b38-estimate-saved-steps',nodeId:p.c.nodeId,method:null,
   construction:{originalPosition:p.key,
    steps:p.math.numbers.map((v,i)=>({index:i,quantity:v[1]===1n?String(v[0]):v[0]+'/'+v[1],
     originalLabel:task.steps[i].label})),
    terminalChoice:p.c.choice,terminalLabel:task.steps.at(-1).label,
    reference:p.math.reference,comparison:p.math.relation,
    records,firstAnswers:first,wrongStepIndices,completedSteps:index,
    originalTaskProvidesStepCards:true,choiceRecorded:true},
   eventCount:model.history.length,originalControlsReplayed:true,
   independentExactMath:true,independentEstimationStrategyAssessed:false,
   mathematicalProofAssessed:false,freeExplanationAssessed:false,
   checkedSubmissionAssessed:false,generalMasteryAssessed:false};
 }catch{return null;}
}
