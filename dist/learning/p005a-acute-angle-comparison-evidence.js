// #342 P005a: only angletypes:0, real B25 test/choose geometry and Check.
import * as native from './phase5/b25-model.js';
import {isEvidenceContext,matchesNativeEvidenceTask,latestSubmissionMatches,
 hasExactKeys as keys,sameEvidence as same} from './evidence-contract.js';
const NODE='mt_h0CVtqI2xo', POSITION='angletypes:0';
const ANGLES=[35,90,125,65], LENGTHS=[3,1,1,2], SELECTED=[0,3];
const equivalent=(a,b)=>same(a,b);
function source(task,context){
 if(!isEvidenceContext(context)||context.sessionId+':'+context.index!==POSITION||
 !matchesNativeEvidenceTask(task,context,{type:'x-g25-compare',nodeId:NODE})||
 !keys(task,['type','prompt','angles','kind','questions','requireTest','lengths'])||
 !same(task.angles,ANGLES)||!same(task.lengths,LENGTHS)||
 task.kind!=='acute'||task.requireTest!==true||task.order!==undefined||
 !Array.isArray(task.questions)||task.questions.length!==1||
 !keys(task.questions[0],['label','value','options'])||
 task.questions[0].value!=='acute')return null;
 return {nodeId:NODE};
}
const index=e=>e&&keys(e.d,['index'])&&typeof e.d.index==='string'&&/^[0-3]$/.test(e.d.index)?Number(e.d.index):null;
const magnitude=degrees=>{
 const x=Math.cos(degrees*Math.PI/180);
 return Number.isFinite(x)&&degrees>0&&degrees<180?
  (Math.abs(x)<1e-12?'right':x>0?'acute':'obtuse'):null;
};
export function acuteAngleComparisonBinding(task,context={}){
 const s=source(task,context);
 return s?{nodeId:s.nodeId,kind:'native-angle-opening-comparison'}:null;
}
export function replayAcuteAngleComparisonEvidence(task,model,context={}){
 try{
  const s=source(task,context);
  if(!s||!keys(model,Object.keys(native.initial(task,1)))||
    !keys(model.board,['first','tested','selected','last'])||
    !native.valid(task,model)||!native.inspect(task,model).correct||
    model.issue!==''||!same(model.answers,['acute'])||
    !Array.isArray(model.history)||model.history.length<6||
    Object.keys(model.history).length!==model.history.length)return null;
  const kinds=task.angles.map(magnitude),independentWant=kinds.flatMap((v,i)=>v==='acute'?[i]:[]);
  if(!equivalent(independentWant,SELECTED)||
   kinds.some(v=>v===null))return null;
  const tested=[],selected=[],events=[];let last=null;
  for(const [step,e] of model.history.entries()){
   if(!keys(e,['a','f','d'])||!keys(e.f,[]))return null;
   if(e.a==='test'){
    const i=index(e);if(i===null)return null;
    if(!tested.includes(i))tested.push(i);
    last=i;events.push({step,action:'test',index:i,openingDegrees:ANGLES[i]});
   }else if(e.a==='choose'){
    const i=index(e);if(i===null||!tested.includes(i))return null;
    const at=selected.indexOf(i);
    if(at===-1)selected.push(i);else selected.splice(at,1);
    events.push({step,action:at===-1?'choose':'unchoose',index:i});
   }else if(e.a==='reset'){
    if(!keys(e.d,[]))return null;
    tested.length=0;selected.length=0;last=null;
    events.push({step,action:'reset'});
   }else return null;
  }
  if(!same([...tested].sort((a,b)=>a-b),[0,1,2,3])||
   !same([...selected].sort((a,b)=>a-b),SELECTED)||
   !same(tested,model.board.tested)||
   !same(selected,model.board.selected)||
   model.board.last!==last)return null;
  return {kind:'native-angle-opening-comparison',nodeId:s.nodeId,
   sessionId:context.sessionId,index:context.index,
   independentAnglesDegrees:[...ANGLES],independentClassification:kinds,
   selectedAcuteIndices:independentWant,originalControlEvents:events,
   openingNotArmLength:true,originalAnswersObserved:true,
   verbalProofAssessed:false,physicalToolsAssessed:false,
   generalMasteryAssessed:false,strictAApproved:false};
 }catch{return null;}
}
export function submittedAcuteAngleComparisonEvidence(task,model,record,context={}){
 return latestSubmissionMatches(model,record)?
  replayAcuteAngleComparisonEvidence(task,model,context):null;
}
