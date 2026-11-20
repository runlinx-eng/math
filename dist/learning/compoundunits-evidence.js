// #292: independently derived compound-unit operations and original step-event replay.
// Source cards remain intact; this contract proves only observable saved steps.
import * as native from './phase5/b37-model.js';
import {LESSONS} from './catalog.js';
import {matchesNativeEvidenceTask,hasExactKeys,sameEvidence} from './evidence-contract.js';

const TYPE='x-r37-steps',SESSION='rateUnit37',SOURCE='mt_kLQOzZYrd5';
const POSITIONS=Object.freeze([0,2,3]);
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
function mathematics(index){
 // These independently fixed physical quantities come from reviewed story inputs,
 // not task.steps[].value, the grade result or an observed learner answer.
 if(index===0){
  const distanceKm=72n,metresPerKm=1000n,secondsPerMinute=60n,minutesPerHour=60n;
  const distanceMetres=distanceKm*metresPerKm;
  const secondsPerHour=secondsPerMinute*minutesPerHour;
  const metresPerSecond=divide(distanceMetres,secondsPerHour);
  return metresPerSecond===null?null:{
   steps:[distanceMetres,secondsPerHour,metresPerSecond],
   units:['m','s','m/s'],relation:'distance / time = speed',
   equation:'72 km/h = (72 x 1000 m)/(60 x 60 s) = 20 m/s'};
 }
 if(index===2){
  const massGrams=240n,volumeCubicCentimetres=80n;
  const density=divide(massGrams,volumeCubicCentimetres);
  return density===null?null:{
   steps:[massGrams,volumeCubicCentimetres,density],
   units:['g','cm^3','g/cm^3'],relation:'mass / volume = density',
   equation:'240 g / 80 cm^3 = 3 g/cm^3'};
 }
 if(index===3){
  const density=3n,volumeCubicCentimetres=80n;
  const massGrams=density*volumeCubicCentimetres;
  const recoveredVolume=divide(massGrams,density);
  return recoveredVolume===null?null:{
   steps:[massGrams,recoveredVolume],units:['g','cm^3'],
   relation:'density x volume = mass; mass / density = volume',
   equation:'3 g/cm^3 x 80 cm^3 = 240 g; 240 g / (3 g/cm^3) = 80 cm^3'};
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
      (s.kind||'number')==='number'&&equal(parse(String(s.value)),fraction(math.steps[i],1n))))return null;
 return {nodeId,...math};
}
export function compoundUnitsBinding(task,context={}){
 try{
  const p=plan(task,context);
  return p?{nodeId:p.nodeId,method:null,
   question:'速度、密度的分子和分母分别是什么单位？换单位后怎样用乘除逆运算核对？'}:null;
 }catch{return null;}
}
export function replayCompoundUnitsEvidence(task,model,context={}){
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
   const answer=e.v,correct=equal(parse(answer),fraction(p.steps[index],1n));
   first[index]??=answer;
   records.push({index,answer,correct});
   if(correct)index++;else wrongStepIndices.push(at);
  }
  if(index!==p.steps.length||!records.at(-1)?.correct||
     !sameEvidence(first,model.board.first)||!sameEvidence(records,model.board.records)||
     model.board.bad!==(wrongStepIndices.length>0))return null;
  return {kind:'compound-units-steps',nodeId:p.nodeId,method:null,
   construction:{steps:p.steps.map((quantity,i)=>({
    index:i,quantity:String(quantity),unit:p.units[i],originalLabel:task.steps[i].label
   })),relation:p.relation,equation:p.equation,
    records,firstAnswers:first,wrongStepIndices,completedSteps:index,
    originalTaskProvidesStepCards:true},
   eventCount:model.history.length,originalControlsReplayed:true,
   unitsIndependentlyChecked:true,taskValuesProvided:true,
   independentStrategyAssessed:false,unitExplanationAssessed:false,
   realWorldMeasurementAssessed:false,checkedSubmissionAssessed:false,
   generalMasteryAssessed:false};
 }catch{return null;}
}
