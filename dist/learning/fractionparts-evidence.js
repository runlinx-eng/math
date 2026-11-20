// #288: independently replay original part/whole and unit-conversion step cards.
// The native task, evaluator, learning history and State-v2 remain unchanged.
import * as native from './phase5/b37-model.js';
import {LESSONS} from './catalog.js';
import {matchesNativeEvidenceTask,hasExactKeys,sameEvidence} from './evidence-contract.js';

const TYPE='x-r37-steps';
const POSITIONS=Object.freeze({fractionOf37:Object.freeze([0,1,2])});
const dense=a=>Array.isArray(a)&&Object.keys(a).length===a.length;
function gcd(a,b){a=a<0n?-a:a;while(b){const c=a%b;a=b;b=c;}return a||1n;}
function parse(raw){
 if(typeof raw!=='string'||raw.length>96)return null;
 const s=raw.trim().replace(/\s*\/\s*/g,'/');
 let n,d,form;
 if(/^-?\d+\/[1-9]\d*$/.test(s)){
  const parts=s.split('/');n=BigInt(parts[0]);d=BigInt(parts[1]);form='fraction';
 }else if(/^-?\d+(?:\.\d+)?$/.test(s)){
  const [whole,decimal='']=s.split('.'),negative=whole.startsWith('-');
  n=BigInt((negative?whole.slice(1):whole)+decimal)*(negative?-1n:1n);
  d=10n**BigInt(decimal.length);form='decimal';
 }else return null;
 return {n,d,form};
}
const rat=(a,b)=>{if(b<=0n)return null;const g=gcd(a,b);return {n:a/g,d:b/g};};
const display=p=>p.d===1n?String(p.n):String(p.n)+'/'+String(p.d);
const same=(a,b)=>a.n*b.d===a.d*b.n;
function arithmetic(index){
 if(index===0){
  const minutes=2n*60n,portion=45n;
  return [{kind:'number',quantity:{n:minutes,d:1n}},
   {kind:'simple',quantity:rat(portion,minutes)}];
 }
 if(index===1){
  const comparison=rat(15n,6n);
  return [{kind:'simple',quantity:comparison},
   {kind:'choice',quantity:comparison.n>comparison.d?'larger':'smaller'}];
 }
 if(index===2){
  const part=18n,whole=24n;
  return [{kind:'rawfraction',quantity:{n:part,d:whole}},
   {kind:'simple',quantity:rat(part,whole)}];
 }
 return null;
}
function accept(raw,step){
 if(step.kind==='choice')return raw===step.quantity;
 const actual=parse(raw);if(!actual)return false;
 const target=step.quantity;
 if(step.kind==='rawfraction')return actual.form==='fraction'&&actual.n===target.n&&actual.d===target.d;
 if(step.kind==='simple')return actual.form==='fraction'&&gcd(actual.n,actual.d)===1n&&same(actual,target);
 return same(actual,target);
}
function source(task,context){
 if(!context||!Object.hasOwn(POSITIONS,context.sessionId)||
    !POSITIONS[context.sessionId].includes(context.index))return null;
 const nodeId=LESSONS[context.sessionId]?.topicId;
 return nodeId&&matchesNativeEvidenceTask(task,context,{type:TYPE,nodeId})?nodeId:null;
}
function plan(task,context){
 const nodeId=source(task,context);if(!nodeId)return null;
 const values=arithmetic(context.index);
 if(!values||!dense(task.steps)||task.steps.length!==values.length||
    !dense(task.questions||[])||task.questions.length!==0||
    !task.steps.every((s,i)=>s&&typeof s.title==='string'&&typeof s.label==='string'&&
      (s.kind||'number')===values[i].kind&&accept(String(s.value),values[i])))return null;
 return {nodeId,values};
}
export function fractionPartsBinding(task,context={}){
 try{const p=plan(task,context);return p?{nodeId:p.nodeId,method:null,
  question:'先统一单位，再明确哪个量作为整体；为什么有时结果大于1，未约分与最简分数又有什么区别？'}:null;}catch{return null;}
}
export function replayFractionPartsEvidence(task,model,context={}){
 try{
  const p=plan(task,context);
  if(!p||!native.valid(task,model)||!native.inspect(task,model).correct||
     !dense(model.history)||model.history.length<p.values.length||model.history.length>2000||
     !dense(model.board?.records)||model.board.index!==p.values.length||model.issue!=='')return null;
  let index=0;const wrong=[],first={},records=[];
  for(const [at,e] of model.history.entries()){
   if(!hasExactKeys(e,['a','i','v','w','c'])||e.a!=='step'||e.i!==''||index>=p.values.length)return null;
   const kind=p.values[index].kind,answer=kind==='choice'?e.c:e.v;
   const correct=accept(answer,p.values[index]);
   first[index]??=answer;
   records.push({index,answer,correct});
   if(correct)index++;else wrong.push(at);
  }
  if(index!==p.values.length||!records.at(-1)?.correct||
     !sameEvidence(first,model.board.first)||!sameEvidence(records,model.board.records)||
     model.board.bad!==(wrong.length>0)||model.value!==''||model.choice!=='')return null;
  return {kind:'fraction-of-whole-steps',nodeId:p.nodeId,method:null,
   construction:{steps:p.values.map((v,i)=>({index:i,kind:v.kind,
    quantity:v.kind==='choice'?v.quantity:display(v.quantity),
    originalLabel:task.steps[i].label})),
    records,firstAnswers:first,wrongStepIndices:wrong,completedSteps:index},
   eventCount:model.history.length,originalControlsReplayed:true,
   taskValuesProvided:true,independentStrategyAssessed:false,
   independentExplanationAssessed:false,realWorldMeasurementAssessed:false,
   checkedSubmissionAssessed:false,generalMasteryAssessed:false};
 }catch{return null;}
}
