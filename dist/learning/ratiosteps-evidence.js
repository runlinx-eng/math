// #284: independently replay five original map and area step tasks without touching the grader.
import * as native from './phase5/b37-model.js';
import {LESSONS} from './catalog.js';
import {matchesNativeEvidenceTask,hasExactKeys,sameEvidence} from './evidence-contract.js';

const TYPE='x-r37-steps';
const POSITIONS=Object.freeze({scaleMap37:Object.freeze([0,1,2]),scaleArea37:Object.freeze([1,2])});
const dense=a=>Array.isArray(a)&&Object.keys(a).length===a.length;
function gcd(a,b){a=a<0n?-a:a;while(b){const c=a%b;a=b;b=c;}return a||1n;}
function fraction(raw){
 if(typeof raw!=='string'||raw.length>96)return null;
 const s=raw.trim().replace(/\s*\/\s*/g,'/');
 let n,d;
 if(/^-?\d+\/[1-9]\d*$/.test(s)){
  const parts=s.split('/');n=BigInt(parts[0]);d=BigInt(parts[1]);
 }else if(/^-?\d+(?:\.\d+)?$/.test(s)){
  const [whole,decimal='']=s.split('.'),neg=whole.startsWith('-');
  n=BigInt((neg?whole.slice(1):whole)+decimal)*(neg?-1n:1n);d=10n**BigInt(decimal.length);
 }else return null;
 const g=gcd(n,d);return[n/g,d/g];
}
const f=n=>[BigInt(n),1n];
const mul=(a,b)=>{const n=a[0]*b[0],d=a[1]*b[1],g=gcd(n,d);return[n/g,d/g];};
const div=(a,b)=>b[0]===0n?null:mul(a,[b[1]*(b[0]<0n?-1n:1n),b[0]<0n?-b[0]:b[0]]);
const display=a=>a[1]===1n?String(a[0]):String(a[0])+'/'+String(a[1]);
const matches=(s,num)=>{const p=fraction(s);return!!p&&p[0]===num[0]&&p[1]===num[1];};
function arithmetic(id,index){
 const meter=f(100),km=f(100000);
 if(id==='scaleMap37'&&index===0){
  const wall=mul(f(9),f(50)),door=mul(fraction('1.2'),meter);
  return [wall,div(wall,meter),door,div(door,f(50))];
 }
 if(id==='scaleMap37'&&index===1){const real=mul(f(9),f(50));return[f(9),div(real,f(100)),real];}
 if(id==='scaleMap37'&&index===2){const real=mul(fraction('6.5'),f(25000));return[real,div(real,km)];}
 if(id==='scaleArea37'&&index===1){
  const x=div(mul(f(6),f(50)),meter),y=div(mul(f(4),f(50)),meter);
  return[x,y,mul(x,y),mul(f(50),f(50))];
 }
 if(id==='scaleArea37'&&index===2){
  const factor=mul(f(10000),f(10000)),area=mul(f(8),factor);
  return[factor,area,div(area,mul(meter,meter))];
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
 const nodeId=source(task,context),values=arithmetic(context.sessionId,context.index);
 if(!nodeId||!values||!dense(task.steps)||task.steps.length!==values.length||
    !dense(task.questions||[])||task.questions.length!==0||
    !task.steps.every((s,i)=>s&&s.kind!=='choice'&&typeof s.title==='string'&&
       typeof s.label==='string'&&matches(String(s.value),values[i])))return null;
 return {nodeId,values};
}
export function ratioStepsBinding(task,context={}){
 try{const p=plan(task,context);return p?{nodeId:p.nodeId,method:null,
  question:'How do map scale, consistent length units and squared area ratios connect?'}:null;}catch{return null;}
}
export function replayRatioStepsEvidence(task,model,context={}){
 try{
  const p=plan(task,context);
  if(!p||!native.valid(task,model)||!native.inspect(task,model).correct||
     !dense(model.history)||model.history.length<p.values.length||model.history.length>2000||
     !dense(model.board?.records)||model.board.index!==p.values.length||
     model.issue!=='')return null;
  let index=0;const wrong=[],first={},records=[];
  for(const [at,e] of model.history.entries()){
   if(!hasExactKeys(e,['a','i','v','w','c'])||e.a!=='step'||e.i!==''||index>=p.values.length)return null;
   const answer=e.v,correct=matches(answer,p.values[index]);
   first[index]??=answer;
   records.push({index,answer,correct});
   if(correct)index++;else wrong.push(at);
  }
  if(index!==p.values.length||!records.at(-1)?.correct||
     !sameEvidence(first,model.board.first)||!sameEvidence(records,model.board.records)||
     model.board.bad!==(wrong.length>0)||model.value!==''||model.choice!=='')return null;
  return {kind:'ratio-map-area-steps',nodeId:p.nodeId,method:null,
   construction:{steps:p.values.map((v,i)=>({index:i,quantity:display(v),
      originalLabel:task.steps[i].label})),records,firstAnswers:first,
      wrongStepIndices:wrong,completedSteps:index},
   eventCount:model.history.length,originalControlsReplayed:true,
   taskValuesProvided:true,independentStrategyAssessed:false,
   physicalMeasurementAssessed:false,checkedSubmissionAssessed:false,
   generalMasteryAssessed:false};
 }catch{return null;}
}
