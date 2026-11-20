// #294: source-bound dimensional conversions with independently computed exact values.
// Only preserved native steps are evidence; no independent strategy is inferred.
import * as native from './phase5/b37-model.js';
import {LESSONS} from './catalog.js';
import {matchesNativeEvidenceTask,hasExactKeys,sameEvidence} from './evidence-contract.js';

const TYPE='x-r37-steps',SESSION='convertUnits37',SOURCE='mt_tpT9brpI6D';
const POSITIONS=Object.freeze([0,1,2]);
const dense=x=>Array.isArray(x)&&Object.keys(x).length===x.length;
function gcd(a,b){a=a<0n?-a:a;b=b<0n?-b:b;while(b){const t=a%b;a=b;b=t;}return a||1n;}
function fraction(a,b){if(b===0n)return null;const sign=b<0n?-1n:1n,g=gcd(a,b);return [a*sign/g,b*sign/g];}
function divide(a,b){if(b===0n||a%b!==0n)return null;return a/b;}
function parse(raw){
 if(typeof raw!=='string'||raw.length>96)return null;
 const value=raw.trim().replace(/\s*\/\s*/g,'/');
 if(/^-?\d+\/[1-9]\d*$/.test(value)){
  const [a,b]=value.split('/');return fraction(BigInt(a),BigInt(b));
 }
 if(!/^-?\d+(?:\.\d+)?$/.test(value))return null;
 const [integer,decimal='']=value.split('.'),negative=integer.startsWith('-');
 return fraction(BigInt((negative?integer.slice(1):integer)+decimal)*(negative?-1n:1n),
  10n**BigInt(decimal.length));
}
const equal=(a,b)=>!!a&&!!b&&a[0]===b[0]&&a[1]===b[1];
const format=([n,d])=>d===1n?String(n):String(n)+'/'+String(d);
function mathematics(index){
 // Values originate from physical unit definitions and frozen story quantities,
 // never from a task's answer cards, grading or learner event contents.
 const cmPerM=100n, minutesPerHour=60n,secondsPerMinute=60n,cm3PerL=1000n;
 if(index===0){
  const sideA=1n*cmPerM,sideB=1n*cmPerM,area=sideA*sideB;
  return {steps:[fraction(sideA,1n),fraction(sideB,1n),fraction(area,1n)],
   units:['cm','cm','cm^2'],relation:'area = length x width',
   equation:'1 m^2 = (1 x 100 cm) x (1 x 100 cm) = 10000 cm^2'};
 }
 if(index===1){
  const hours=fraction(5n,2n);
  const minutes=fraction(hours[0]*minutesPerHour,hours[1]);
  const seconds=fraction(minutes[0]*secondsPerMinute,minutes[1]);
  return {steps:[minutes,seconds],units:['min','s'],
   relation:'hours x 60 = minutes; minutes x 60 = seconds',
   equation:'2.5 h = (5/2 x 60) min = 150 min = 9000 s'};
 }
 if(index===2){
  const volumeCm3=2500n;
  const litres=fraction(volumeCm3,cm3PerL);
  return {steps:[fraction(cm3PerL,1n),litres],units:['cm^3/L','L'],
   relation:'litres = cubic centimetres / 1000',
   equation:'1 L = 1000 cm^3; 2500 cm^3 / 1000 = 5/2 L'};
 }
 return null;
}
function plan(task,context){
 if(!context||context.sessionId!==SESSION||!POSITIONS.includes(context.index))return null;
 const nodeId=LESSONS[SESSION]?.topicId;
 if(nodeId!==SOURCE||!matchesNativeEvidenceTask(task,context,{type:TYPE,nodeId}))return null;
 const math=mathematics(context.index);
 if(!math||!dense(task.steps)||task.steps.length!==math.steps.length||
    !dense(task.questions||[])||task.questions.length!==0||
    !task.steps.every((s,i)=>s&&typeof s.title==='string'&&typeof s.label==='string'&&
      (s.kind||'number')==='number'&&equal(parse(String(s.value)),math.steps[i])))return null;
 return {nodeId,...math};
}
export function unitConversionsBinding(task,context={}){
 try{
  const p=plan(task,context);
  return p?{nodeId:p.nodeId,method:null,
   question:'面积为什么要换两条边？小时如何逐步换秒？立方厘米与升怎样保持同一体积？'}:null;
 }catch{return null;}
}
export function replayUnitConversionsEvidence(task,model,context={}){
 try{
  const p=plan(task,context);
  if(!p||!native.valid(task,model)||!native.inspect(task,model).correct||
     !dense(model.history)||model.history.length<p.steps.length||model.history.length>2000||
     !dense(model.board?.records)||model.board.index!==p.steps.length||model.issue!==''||
     model.value!==''||model.second!==''||model.choice!==''||
     !dense(model.answers)||model.answers.length!==0)return null;
  let index=0;
  const wrongStepIndices=[],first={},records=[];
  for(const [at,e] of model.history.entries()){
   if(!hasExactKeys(e,['a','i','v','w','c'])||e.a!=='step'||e.i!==''||
      e.w!==''||e.c!==''||index>=p.steps.length)return null;
   const answer=e.v,correct=equal(parse(answer),p.steps[index]);
   first[index]??=answer;
   records.push({index,answer,correct});
   if(correct)index++;else wrongStepIndices.push(at);
  }
  if(index!==p.steps.length||!records.at(-1)?.correct||
     !sameEvidence(first,model.board.first)||!sameEvidence(records,model.board.records)||
     model.board.bad!==(wrongStepIndices.length>0))return null;
  return {kind:'unit-conversions-steps',nodeId:p.nodeId,method:null,
   construction:{steps:p.steps.map((quantity,i)=>({
    index:i,quantity:format(quantity),unit:p.units[i],originalLabel:task.steps[i].label
   })),relation:p.relation,equation:p.equation,
    records,firstAnswers:first,wrongStepIndices,completedSteps:index,
    originalTaskProvidesStepCards:true},
   eventCount:model.history.length,originalControlsReplayed:true,
   unitsIndependentlyChecked:true,dimensionsIndependentlyChecked:true,taskValuesProvided:true,
   independentStrategyAssessed:false,unitExplanationAssessed:false,
   realWorldMeasurementAssessed:false,checkedSubmissionAssessed:false,
   generalMasteryAssessed:false};
 }catch{return null;}
}
