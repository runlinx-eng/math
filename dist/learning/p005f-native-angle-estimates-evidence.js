// #342 P005f: original B25 estimate/reveal events with two source-locked tasks.
// Development candidate only: no original grader, shared registration or formal A changes.
import * as native from './phase5/b25-model.js';
import {isEvidenceContext,matchesNativeEvidenceTask,latestSubmissionMatches,
 hasExactKeys as keys,sameEvidence as same} from './evidence-contract.js';

const CASES={
 'angleestimate:0':{
  nodeId:'mt_YUJ5pwalqL',
  prompt:'先和直角比较：这个开口大约是多少度？',
  amount:130,tolerance:15,
  questions:[{label:'它与直角相比',value:'more',
   options:[['more','比直角大'],['less','比直角小']]}],
  className:'obtuse',answer:'more'
 },
 'angleestimate:1':{
  nodeId:'mt_YUJ5pwalqL',
  prompt:'先和半圈、一整圈比较，再估这个开口。',
  amount:270,tolerance:20,
  questions:[{label:'这个开口',value:'reflex',
   options:[['reflex','大于半圈而小于一圈'],['acute','小于直角']]}],
  className:'reflex',answer:'reflex'
 }
};
function source(task,context){
 if(!isEvidenceContext(context))return null;
 const spec=CASES[context.sessionId+':'+context.index];
 if(!spec||!matchesNativeEvidenceTask(task,context,{
  type:'x-g25-estimate',nodeId:spec.nodeId}))return null;
 if(!keys(task,['type','prompt','amount','tolerance','questions'])||
  task.prompt!==spec.prompt||task.amount!==spec.amount||
  task.tolerance!==spec.tolerance||!same(task.questions,spec.questions))return null;
 return spec;
}
// Recover the directed screen opening independently from two coordinate rays.
// atan2(cross,dot) is adjusted to [0,360): 270° must not become 90°.
function measureDirected(angle){
 if(!Number.isInteger(angle)||angle<=0||angle>=360)return null;
 const rad=angle*Math.PI/180;
 const a=[1,0],b=[Math.cos(rad),Math.sin(rad)];
 const cross=a[0]*b[1]-a[1]*b[0];
 const dot=a[0]*b[0]+a[1]*b[1];
 let measured=Math.atan2(cross,dot)*180/Math.PI;
 if(measured<0)measured+=360;
 return Number.isFinite(measured)?measured:null;
}
function classify(a){
 if(!Number.isFinite(a))return null;
 if(Math.abs(a-90)<1e-8)return 'right';
 if(Math.abs(a-180)<1e-8)return 'straight';
 if(a<90)return 'acute';
 if(a<180)return 'obtuse';
 return a<360?'reflex':null;
}
const integerValue=s=>typeof s==='string'&&/^(0|[1-9][0-9]*)$/.test(s)&&
 Number.isSafeInteger(Number(s))&&Number(s)<=360?Number(s):null;

export function angleEstimateBinding(task,context={}){
 const spec=source(task,context);
 return spec?{nodeId:spec.nodeId,kind:'native-angle-estimate-reveal'}:null;
}
export function replayAngleEstimateEvidence(task,model,context={}){
 try{
  const spec=source(task,context);
  if(!spec||!keys(model,Object.keys(native.initial(task,1)))||
   !keys(model.board,['first','guess','revealed'])||
   !native.valid(task,model)||!native.inspect(task,model).correct||
   model.issue!==''||!same(model.answers,[spec.answer])||
   !Array.isArray(model.history)||model.history.length<2||
   model.history.length>20||model.history.length%2!==0||
   Object.keys(model.history).length!==model.history.length)return null;
  const measured=measureDirected(spec.amount);
  if(measured===null||Math.abs(measured-spec.amount)>1e-8||
   classify(measured)!==spec.className)return null;
  const events=[],guesses=[];
  for(const [i,e] of model.history.entries()){
   if(!keys(e,['a','f','d'])||!keys(e.d,[]))return null;
   if(i%2===0){
    if(e.a!=='guess'||!keys(e.f,['angle']))return null;
    const v=integerValue(e.f.angle);
    if(v===null||(guesses.length&&guesses.at(-1)===v))return null;
    guesses.push(v);
    events.push({step:i,action:'guess',value:v,
     absoluteError:Math.abs(measured-v)});
   }else{
    if(e.a!=='reveal'||!keys(e.f,[]))return null;
    events.push({step:i,action:'reveal',value:guesses.at(-1)});
   }
  }
  const first=guesses[0],last=guesses.at(-1);
  const anyWrong=guesses.some(v=>Math.abs(v-measured)>spec.tolerance+1e-8);
  const correction=guesses.slice(0,-1).some(v=>
   Math.abs(v-measured)>spec.tolerance+1e-8);
  if(!Number.isInteger(first)||!Number.isInteger(last)||
   !model.board.revealed||model.board.guess!==last||
   model.angle!==String(last)||Math.abs(last-measured)>spec.tolerance+1e-8||
   !keys(model.board.first,['guess','guessValue','reveal',
    ...(anyWrong?['incorrectPrediction']:[])])||
   !same(model.board.first.guess,{angle:String(first)})||
   model.board.first.guessValue!==first||
   !same(model.board.first.reveal,{})||
   (anyWrong&&model.board.first.incorrectPrediction!==true))return null;
  return {kind:'native-angle-estimate-reveal',
   nodeId:spec.nodeId,sessionId:context.sessionId,index:context.index,
   measuredDirectedDegrees:measured,independentClass:spec.className,
   estimateDegrees:last,absoluteErrorDegrees:Math.abs(last-measured),
   allowedErrorDegrees:spec.tolerance,originalControlEvents:events,
   correctionObserved:correction,initialEstimateDegrees:first,
   initialMistakePersisted:anyWrong,originalAnswersObserved:true,
   physicalProtractorAssessed:false,verbalProofAssessed:false,
   generalMasteryAssessed:false,strictAApproved:false};
 }catch{return null;}
}
export function submittedAngleEstimateEvidence(task,model,record,context={}){
 return latestSubmissionMatches(model,record)?
  replayAngleEstimateEvidence(task,model,context):null;
}
