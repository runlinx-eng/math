// #342 P005b only angletypes:1. Independent opening geometry and exact native event replay.
import * as native from './phase5/b25-model.js';
import {isEvidenceContext,matchesNativeEvidenceTask,latestSubmissionMatches,
 hasExactKeys as keys,sameEvidence as same} from './evidence-contract.js';
const NODE='mt_h0CVtqI2xo',POSITION='angletypes:1';
const ANGLES=[120,35,90,65],LENGTHS=[1,3,2,3],EXPECTED=[1,3,2,0];
function source(task,context){
 if(!isEvidenceContext(context)||context.sessionId+':'+context.index!==POSITION||
 !matchesNativeEvidenceTask(task,context,{type:'x-g25-compare',nodeId:NODE})||
 !keys(task,['type','prompt','angles','kind','questions','requireTest','order','lengths'])||
 !same(task.angles,ANGLES)||!same(task.lengths,LENGTHS)||
 task.kind!==null||task.order!==true||task.requireTest!==true||
 !Array.isArray(task.questions)||task.questions.length!==1||
 !keys(task.questions[0],['label','value'])||task.questions[0].value!==90)return null;
 return {nodeId:NODE};
}
const idx=e=>e&&keys(e.d,['index'])&&typeof e.d.index==='string'&&
 /^[0-3]$/.test(e.d.index)?Number(e.d.index):null;
const opening=(degrees,length)=>{
 if(!Number.isFinite(degrees)||degrees<=0||degrees>=180||
 !Number.isFinite(length)||length<=0)return null;
 const u=[length,0],v=[length*Math.cos(degrees*Math.PI/180),length*Math.sin(degrees*Math.PI/180)];
 const cross=u[0]*v[1]-u[1]*v[0],dot=u[0]*v[0]+u[1]*v[1];
 const a=Math.atan2(cross,dot)*180/Math.PI;
 return Number.isFinite(a)?a:null;
};
export function angleOrderingBinding(task,context={}) {
 return source(task,context)?{nodeId:NODE,kind:'native-opening-ascending-order'}:null;
}
export function replayAngleOrderingEvidence(task,model,context={}) {
 try{
  const src=source(task,context);
  if(!src||!keys(model,Object.keys(native.initial(task,1)))||
   !keys(model.board,['first','tested','selected','last'])||
   !native.valid(task,model)||!native.inspect(task,model).correct||
   model.issue!==''||!same(model.answers,['90'])||
   !Array.isArray(model.history)||model.history.length<8||
   Object.keys(model.history).length!==model.history.length)return null;
  const measured=ANGLES.map((angle,i)=>opening(angle,LENGTHS[i]));
  if(measured.some(x=>x===null))return null;
  const ascending=measured.map((v,i)=>({v,i})).sort((a,b)=>a.v-b.v).map(x=>x.i);
  if(!same(ascending,EXPECTED)||ascending.some((i,k)=>k&&
   !(measured[ascending[k-1]]+1e-8<measured[i])))return null;
  const tested=[],selected=[],events=[];let last=null,hasUndo=false;
  for(const [step,e] of model.history.entries()){
   if(!keys(e,['a','f','d'])||!keys(e.f,[]))return null;
   if(e.a==='test'){
    const i=idx(e);if(i===null||tested.includes(i))return null;
    tested.push(i);last=i;
    events.push({step,action:'test',index:i,openingDegrees:measured[i]});
   }else if(e.a==='choose'){
    const i=idx(e);
    if(i===null||!tested.includes(i)||selected.includes(i)||selected.length>=ANGLES.length)return null;
    selected.push(i);events.push({step,action:'choose',index:i});
   }else if(e.a==='undo'){
    if(!keys(e.d,[])||!selected.length)return null;
    const removed=selected.pop();hasUndo=true;
    events.push({step,action:'undo',index:removed});
   }else if(e.a==='reset'){
    if(!keys(e.d,[]))return null;
    tested.length=0;selected.length=0;last=null;
    events.push({step,action:'reset'});
   }else return null;
  }
  if(!same([...tested].sort((a,b)=>a-b),[0,1,2,3])||
   !same(selected,EXPECTED)||!same(tested,model.board.tested)||
   !same(selected,model.board.selected)||last!==model.board.last)return null;
  return {kind:'native-opening-ascending-order',nodeId:src.nodeId,sessionId:context.sessionId,
   index:context.index,measuredOpeningsDegrees:measured,ascendingOriginalIndices:ascending,
   originalControlEvents:events,undoObserved:hasUndo,
   originalAnswersObserved:true,armLengthNotAngle:true,
   physicalMeasurementAssessed:false,verbalProofAssessed:false,
   generalMasteryAssessed:false,strictAApproved:false};
 }catch{return null;}
}
export function submittedAngleOrderingEvidence(task,model,record,context={}) {
 return latestSubmissionMatches(model,record)?
  replayAngleOrderingEvidence(task,model,context):null;
}
