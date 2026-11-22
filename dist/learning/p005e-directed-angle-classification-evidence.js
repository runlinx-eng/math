// #342 P005e: two cross-source, native B25 directed-opening classifications.
// Development-only candidate; does not register formal A or replace original grading.
import * as native from './phase5/b25-model.js';
import {isEvidenceContext,matchesNativeEvidenceTask,latestSubmissionMatches,
 hasExactKeys as keys,sameEvidence as same} from './evidence-contract.js';

const CASES={
 'rightcheck:0':{
  nodeId:'mt_MFfYcnv6Tv',
  prompt:'把每个角叠到直角参照上，选出恰好一样大的角。',
  angles:[50,90,130],kind:'right',lengths:[3,1,2],
  questions:[{label:'直角是转过多少度',value:90}],
  expected:[1],answer:'90'
 },
 'anglestraight:1':{
  nodeId:'mt_LBT-9jz7kR',
  prompt:'叠放这些开口，选出大于半圈但不到一整圈的那个。',
  angles:[45,90,180,270],kind:'reflex',
  questions:[{label:'这样的开口叫',value:'reflex',
   options:[['reflex','优角'],['straight','平角']]}],
  expected:[3],answer:'reflex'
 }
};
function source(task,context){
 if(!isEvidenceContext(context))return null;
 const spec=CASES[context.sessionId+':'+context.index];
 if(!spec||!matchesNativeEvidenceTask(task,context,{
  type:'x-g25-compare',nodeId:spec.nodeId}))return null;
 const taskKeys=['type','prompt','angles','kind','questions','requireTest',
  ...(spec.lengths?['lengths']:[])];
 if(!keys(task,taskKeys)||task.prompt!==spec.prompt||task.kind!==spec.kind||
  task.requireTest!==true||!same(task.angles,spec.angles)||
  !same(task.questions,spec.questions)||
  (spec.lengths&&!same(task.lengths,spec.lengths)))return null;
 return spec;
}
// Independent of B25 angleKind: directed atan2(cross,dot), preserving reflex
// turns beyond 180 degrees instead of collapsing to their smaller opening.
function directedOpening(degrees,length){
 if(!Number.isFinite(degrees)||degrees<=0||degrees>=360||
  !Number.isFinite(length)||length<=0)return null;
 const rad=degrees*Math.PI/180;
 const ux=length,uy=0,vx=length*Math.cos(rad),vy=length*Math.sin(rad);
 const cross=ux*vy-uy*vx,dot=ux*vx+uy*vy;
 let v=Math.atan2(cross,dot)*180/Math.PI;
 if(v<0)v+=360;
 return Number.isFinite(v)?v:null;
}
function classify(degrees){
 if(!Number.isFinite(degrees))return null;
 if(Math.abs(degrees-90)<1e-8)return 'right';
 if(Math.abs(degrees-180)<1e-8)return 'straight';
 if(degrees<90)return 'acute';
 if(degrees<180)return 'obtuse';
 return degrees<360?'reflex':null;
}
const idx=(e,n)=>e&&keys(e.d,['index'])&&
 typeof e.d.index==='string'&&/^(0|[1-9][0-9]*)$/.test(e.d.index)&&
 Number(e.d.index)<n?Number(e.d.index):null;
export function directedAngleBinding(task,context={}){
 const spec=source(task,context);
 return spec?{nodeId:spec.nodeId,kind:'native-directed-opening-classification'}:null;
}
export function replayDirectedAngleEvidence(task,model,context={}){
 try{
  const spec=source(task,context);
  if(!spec||!keys(model,Object.keys(native.initial(task,1)))||
   !keys(model.board,['first','tested','selected','last'])||
   !native.valid(task,model)||!native.inspect(task,model).correct||
   model.issue!==''||!same(model.answers,[spec.answer])||
   !Array.isArray(model.history)||model.history.length<spec.angles.length+1||
   model.history.length>24||
   Object.keys(model.history).length!==model.history.length)return null;
  const measured=spec.angles.map((angle,i)=>
   directedOpening(angle,spec.lengths?.[i]??1));
  if(measured.some(v=>v===null))return null;
  const classifications=measured.map(classify);
  const expected=classifications.flatMap((k,i)=>k===spec.kind?[i]:[]);
  if(!same(expected,spec.expected)||expected.length!==1)return null;
  const tested=[],selected=[],events=[];
  let last=null,correctionObserved=false;
  for(const [step,e] of model.history.entries()){
   if(!keys(e,['a','f','d'])||!keys(e.f,[]))return null;
   if(e.a==='test'){
    const i=idx(e,spec.angles.length);
    if(i===null||tested.includes(i))return null;
    tested.push(i);last=i;
    events.push({step,action:'test',index:i,directedDegrees:measured[i]});
   }else if(e.a==='choose'){
    const i=idx(e,spec.angles.length);
    if(i===null||!tested.includes(i))return null;
    const found=selected.indexOf(i);
    if(found===-1)selected.push(i);
    else {selected.splice(found,1);correctionObserved=true;}
    events.push({step,action:found===-1?'choose':'unchoose',index:i});
   }else if(e.a==='reset'){
    if(!keys(e.d,[]))return null;
    tested.length=0;selected.length=0;last=null;
    events.push({step,action:'reset'});
   }else return null;
  }
  if(!same([...tested].sort((a,b)=>a-b),
    [...spec.angles.keys()])||
   !same([...selected].sort((a,b)=>a-b),spec.expected)||
   !same(tested,model.board.tested)||
   !same(selected,model.board.selected)||last!==model.board.last)return null;
  return {kind:'native-directed-opening-classification',
   nodeId:spec.nodeId,sessionId:context.sessionId,index:context.index,
   measuredDirectedDegrees:measured,independentClassification:classifications,
   selectedOriginalIndices:expected,originalControlEvents:events,
   correctionObserved,originalAnswersObserved:true,
   armLengthNotOpening:true,verbalProofAssessed:false,
   physicalMeasurementAssessed:false,generalMasteryAssessed:false,
   strictAApproved:false};
 }catch{return null;}
}
export function submittedDirectedAngleEvidence(task,model,record,context={}){
 return latestSubmissionMatches(model,record)?
  replayDirectedAngleEvidence(task,model,context):null;
}
