// #290: exact original equal-ratio integer notation step-event replay.
// Original task, grader, learner history and State-v2 remain unchanged.
import * as native from './phase5/b37-model.js';
import {LESSONS} from './catalog.js';
import {matchesNativeEvidenceTask,hasExactKeys,sameEvidence} from './evidence-contract.js';

const TYPE='x-r37-steps';
const POSITIONS=Object.freeze({ratioNotation37:Object.freeze([1,2])});
const dense=x=>Array.isArray(x)&&Object.keys(x).length===x.length;
function gcd(a,b){a=a<0n?-a:a;b=b<0n?-b:b;while(b){const t=a%b;a=b;b=t;}return a||1n;}
function rat(n,d){if(d===0n)return null;const sign=d<0n?-1n:1n,g=gcd(n,d);return [n*sign/g,d*sign/g];}
function parse(raw){
 if(typeof raw!=='string'||raw.length>96)return null;
 const s=raw.trim().replace(/\s*\/\s*/g,'/');
 if(/^-?\d+\/[1-9]\d*$/.test(s)){const [a,b]=s.split('/');return rat(BigInt(a),BigInt(b));}
 if(/^-?\d+(?:\.\d+)?$/.test(s)){
  const [whole,dec='']=s.split('.'),neg=whole.startsWith('-');
  return rat(BigInt((neg?whole.slice(1):whole)+dec)*(neg?-1n:1n),10n**BigInt(dec.length));
 }
 return null;
}
const eq=(p,q)=>!!p&&p[0]===q[0]&&p[1]===q[1];
const value=p=>p[1]===1n?String(p[0]):String(p[0])+'/'+String(p[1]);
const lcm=(a,b)=>a/gcd(a,b)*b;
function arithmetic(index){
 // Fractions come from the actual quantitative ratios in the original task,
 // not task.steps[].value, check/grade, or the learner model.
 const pair=index===1?[rat(1n,2n),rat(3n,2n)]:
   index===2?[rat(1n,2n),rat(3n,4n)]:null;
 if(!pair)return null;
 const factor=lcm(pair[0][1],pair[1][1]); // common positive integer multiplier
 const x=pair[0][0]*(factor/pair[0][1]),y=pair[1][0]*(factor/pair[1][1]);
 if(x<=0n||y<=0n||gcd(x,y)!==1n)return null; // truly simplest integer ratio
 return index===1?[[factor,1n],[x,1n],[y,1n]]:[[x,1n],[y,1n]];
}
function plan(task,context){
 if(!context||!Object.hasOwn(POSITIONS,context.sessionId)||
    !POSITIONS[context.sessionId].includes(context.index))return null;
 const nodeId=LESSONS[context.sessionId]?.topicId;
 if(!nodeId||!matchesNativeEvidenceTask(task,context,{type:TYPE,nodeId}))return null;
 const steps=arithmetic(context.index);
 if(!steps||!dense(task.steps)||task.steps.length!==steps.length||
    !dense(task.questions||[])||task.questions.length!==0||
    !task.steps.every((s,i)=>s&&s.kind!=='choice'&&typeof s.title==='string'&&
      typeof s.label==='string'&&eq(parse(String(s.value)),steps[i])))return null;
 return {nodeId,steps};
}
export function ratioNotationBinding(task,context={}){
 try{const p=plan(task,context);return p?{nodeId:p.nodeId,method:null,
  question:'比的两端为什么必须同乘一个非零倍数？怎样验证整数比已经最简？'}:null;}catch{return null;}
}
export function replayRatioNotationEvidence(task,model,context={}){
 try{
  const p=plan(task,context);
  if(!p||!native.valid(task,model)||!native.inspect(task,model).correct||
     !dense(model.history)||model.history.length<p.steps.length||model.history.length>2000||
     !dense(model.board?.records)||model.board.index!==p.steps.length||model.issue!=='')return null;
  let index=0;const wrong=[],first={},records=[];
  for(const [at,e] of model.history.entries()){
   if(!hasExactKeys(e,['a','i','v','w','c'])||e.a!=='step'||e.i!==''||index>=p.steps.length)return null;
   const answer=e.v,correct=eq(parse(answer),p.steps[index]);
   first[index]??=answer;
   records.push({index,answer,correct});
   if(correct)index++;else wrong.push(at);
  }
  if(index!==p.steps.length||!records.at(-1)?.correct||
     !sameEvidence(first,model.board.first)||!sameEvidence(records,model.board.records)||
     model.board.bad!==(wrong.length>0)||model.value!==''||model.choice!=='')return null;
  return {kind:'equal-ratio-integer-steps',nodeId:p.nodeId,method:null,
   construction:{steps:p.steps.map((v,i)=>({index:i,quantity:value(v),
    originalLabel:task.steps[i].label})),records,firstAnswers:first,
    wrongStepIndices:wrong,completedSteps:index,
    simplestIntegerRatio:true,originalTaskProvidesStepCards:true},
   eventCount:model.history.length,originalControlsReplayed:true,
   taskValuesProvided:true,independentStrategyAssessed:false,
   selfSelectedMultiplierAssessed:false,independentProofAssessed:false,
   checkedSubmissionAssessed:false,generalMasteryAssessed:false};
 }catch{return null;}
}
