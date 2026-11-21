// #342 P007b: one original B23 pyramid-view rotation; development evidence only.
// Records the original turn button events, NOT camera orientation or physical proof.
import * as native from './phase5/b23-model.js';
import {isEvidenceContext,matchesNativeEvidenceTask,latestSubmissionMatches,
 hasExactKeys as exact,sameEvidence as same} from './evidence-contract.js';

const SOURCE={sessionId:'shapedraw',index:5,nodeId:'mt_vJUa62bxeR',
 sha256:'fde74143edf21a92606e9f5c565cd883d0b714fb2d5cefd0ce18a4bde7727774'};
const QUESTIONS=[{label:'转动后仍是',value:'pyramid',options:[
 ['pyramid','四棱锥：一个方形底和四个三角形侧面'],['cube','正方体']
]}];
const TASK_KEYS=['type','prompt','mode','solid','questions'];
const PROMPT='转动这个四棱锥，从另一个方向看，再认出它。';
const MODEL_KEYS=Object.keys(native.initial({
 type:'x-s23-frame',mode:'view',solid:'pyramid',questions:QUESTIONS
},1));
const VERTICES=[[-1,-1,-1],[1,-1,-1],[1,-1,1],[-1,-1,1],[0,1,0]];
const FACES=[[0,3,2,1],[0,1,4],[1,2,4],[2,3,4],[3,0,4]];
function original(task,context){
 if(!isEvidenceContext(context)||context.sessionId!==SOURCE.sessionId||
    context.index!==SOURCE.index||!exact(task,TASK_KEYS)||
    task.type!=='x-s23-frame'||task.prompt!==PROMPT||
    task.mode!=='view'||task.solid!=='pyramid'||!same(task.questions,QUESTIONS)||
    !matchesNativeEvidenceTask(task,context,
       {type:'x-s23-frame',nodeId:SOURCE.nodeId}))return false;
 return true;
}
// Freeze the actual quadrilateral base and triangular lateral faces; calculate
// topology independently instead of treating the original grader as a proof.
function pyramidGeometry(){
 const edgeCounts=new Map(),degree=Array(5).fill(0);
 const vertices=VERTICES;
 if(vertices.length!==5||!vertices.slice(0,4).every(v=>v[1]===-1)||
    !same(vertices[4],[0,1,0])||FACES.length!==5||
    !same(FACES[0],[0,3,2,1]))return null;
 const baseEdges=new Set(['0:1','1:2','2:3','0:3']);
 const key=(a,b)=>Math.min(a,b)+':'+Math.max(a,b);
 for(const [i,face] of FACES.entries()){
  if(face.length!==(i===0?4:3)||new Set(face).size!==face.length||
     face.some(v=>!Number.isInteger(v)||v<0||v>=5)||
     (i>0&&!face.includes(4)))return null;
  for(let k=0;k<face.length;k++){
   const edge=key(face[k],face[(k+1)%face.length]);
   edgeCounts.set(edge,(edgeCounts.get(edge)||0)+1);
  }
 }
 if(![...edgeCounts.values()].every(x=>x===2)||edgeCounts.size!==8||
    [...baseEdges].some(k=>!edgeCounts.has(k)))return null;
 for(const edge of edgeCounts.keys()){
  const [a,b]=edge.split(':').map(Number);
  if(!baseEdges.has(edge)&&a!==4&&b!==4)return null;
  degree[a]++;degree[b]++;
 }
 if(!same(degree,[3,3,3,3,4])||5-8+5!==2)return null;
 return {vertices:5,edges:8,faces:5,squareBaseFaces:1,
  triangularSideFaces:4,vertexDegrees:degree,eulerCharacteristic:2};
}
export function pyramidViewBinding(task,context={}){
 if(!original(task,context)||!pyramidGeometry())return null;
 return {kind:'native-pyramid-view-identity',originalPosition:'shapedraw:5',
  sourceNodeId:SOURCE.nodeId,originalTaskSha256:SOURCE.sha256,
  originalTurnControl:'turn-extra',strictAApproved:false};
}
export function replayPyramidViewEvidence(task,model,context={}){
 try{
  const g=pyramidGeometry();
  if(!g||!original(task,context)||!exact(model,MODEL_KEYS)||
     !exact(model.board,['first','edges','turns'])||
     !Array.isArray(model.history)||model.history.length<1||
     model.history.length>650||model.issue!==''||
     !same(model.answers,['pyramid'])||!same(model.board.edges,[])||
     !native.valid(task,model)||native.inspect(task,model).correct!==true)return null;
  const first={},events=[];let turns=0,turnEvents=0,resets=0;
  for(const [step,event] of model.history.entries()){
   if(!exact(event,['a','f','d'])||!exact(event.f,[])||
      !exact(event.d,[])||!['turn','reset'].includes(event.a))return null;
   if(!Object.hasOwn(first,event.a))first[event.a]={};
   if(event.a==='turn'){turns++;turnEvents++;}
   else{turns=0;resets++;}
   events.push({step,action:event.a,observedTurnCountAfterEvent:turns});
  }
  if(!same(first,model.board.first)||model.board.turns!==turns||
     !Number.isInteger(turns)||turns<1||turnEvents<1)return null;
  return {kind:'native-pyramid-view-identity',originalPosition:'shapedraw:5',
   sourceNodeId:SOURCE.nodeId,originalTaskSha256:SOURCE.sha256,
   independentPyramidGeometry:g,originalTurnEvents:turnEvents,
   originalResetEvents:resets,observedTurnCount:turns,
   originalControlEvents:events,originalTurnHistoryReplayed:true,
   originalCurrentChoice:'pyramid',originalPyramidIdentityConsistent:true,
   cameraOrientationHistoryPersisted:false,distinctViewingAnglesIndependentlyMeasured:false,
   physicalModelRotationAssessed:false,spokenGeometricExplanationAssessed:false,
   longTermMasteryAssessed:false,strictAApproved:false};
 }catch{return null;}
}
export function submittedPyramidViewEvidence(task,model,record,context={}){
 try{
  const proof=replayPyramidViewEvidence(task,model,context);
  if(!proof||!latestSubmissionMatches(model,record)||
     record.attempts.length!==2)return null;
  const before=record.attempts[0]?.value;
  if(!exact(before,MODEL_KEYS)||!native.valid(task,before)||
     !same(before.answers,['cube'])||
     native.inspect(task,before).correct!==false)return null;
  const reconstructed=structuredClone(model);
  reconstructed.answers[0]='cube';
  if(!same(reconstructed,before))return null;
  return {...proof,originalCheckSnapshotsObserved:2,
   wrongToCorrectCheckRevisionObserved:true,
   individualChoiceClicksPersisted:false};
 }catch{return null;}
}
