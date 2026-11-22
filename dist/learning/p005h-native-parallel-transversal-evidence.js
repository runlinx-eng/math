// #342 P005h: three original B25 parallel-transversal positions.
// Isolated development evidence only; no official strict-A promotion.
import * as native from './phase5/b25-model.js';
import {isEvidenceContext,matchesNativeEvidenceTask,latestSubmissionMatches,
 hasExactKeys as keys,sameEvidence as same} from './evidence-contract.js';

const q=(label,value)=>({label,value});
const ch=(label,value,options)=>({label,value,options});
const NODE='mt_H_pNJ3ZI_S';
const CASES={
 'parallelangle:0':{
  prompt:'已知角A是70°。把上面一组角移到下面，找同一位置。',
  questions:[q('角E是多少度',70),ch('A与E','correspond',
   [['correspond','是同位角'],['neighbor','是同一个交点的邻角']])]
 },
 'parallelangle:1':{
  prompt:'把一组角移过去。角C与角E在两条平行线之间、斜线两侧。',
  questions:[ch('C与E的关系','alternate',
   [['alternate','内错角，相等'],['supplement','总和一定是180°']])]
 },
 'parallelangle:2':{
  prompt:'已知角A是70°。先找同位角，再看同旁内角。',
  questions:[q('角C是多少度',70),q('角F是多少度',110),
   q('角C和F合计多少度',180)]
 }
};
function binding(task,context){
 if(!isEvidenceContext(context))return null;
 const id=context.sessionId+':'+context.index,spec=CASES[id];
 if(!spec||!matchesNativeEvidenceTask(task,context,
  {type:'x-g25-parallel',nodeId:NODE}))return null;
 if(!keys(task,['type','prompt','questions'])||
    task.prompt!==spec.prompt||!same(task.questions,spec.questions))return null;
 return {position:id,nodeId:NODE,prompt:spec.prompt};
}
// Independent Euclidean calculation from the original B25 visual geometry:
// two horizontal lines 170 px apart and a transversal leaning 70 degrees.
// This is fixed screen geometry, not a reconstruction of learner reasoning.
function anglesFromTransversal(){
 const dy=170,dx=dy/Math.tan(70*Math.PI/180);
 const a=Math.atan2(Math.abs(dy),dx)*180/Math.PI;
 const supplementary=180-a;
 if(!Number.isFinite(a)||Math.abs(a-70)>1e-9||
    Math.abs(a+supplementary-180)>1e-9)return null;
 return {A:a,E:a,C:a,F:supplementary,
  correspondingEqual:true,alternateInteriorEqual:true,
  sameSideInteriorSum:Csum(a,supplementary)};
}
const Csum=(a,b)=>a+b;
const canonicalAnswers=(task,model)=>
 Array.isArray(model.answers)&&model.answers.length===task.questions.length&&
 task.questions.every((question,i)=>model.answers[i]===String(question.value));
export function parallelBinding(task,context={}){
 return binding(task,context);
}
export function replayParallelEvidence(task,model,context={}){
 try{
  const source=binding(task,context);
  if(!source||!keys(model,['angle','length','base','a','b','other',
   'prose','answers','seed','board','history','issue'])||
   !native.valid(task,model)||!native.inspect(task,model).correct||
   !canonicalAnswers(task,model)||model.issue!=='')return null;
  if(!keys(model.board,['first','slid'])||model.board.slid!==true||
   !keys(model.board.first,['slide'])||
   !keys(model.board.first.slide,[])||
   !Array.isArray(model.history)||model.history.length!==1||
   !same(model.history[0],{a:'slide',f:{},d:{}}))return null;
  if(['angle','length','base','a','b','other','prose']
   .some(k=>model[k]!==''))return null;
  const angles=anglesFromTransversal();
  if(!angles||Math.abs(angles.sameSideInteriorSum-180)>1e-9||
   !angles.correspondingEqual||!angles.alternateInteriorEqual)return null;
  return {kind:'native-parallel-transversal-relations',
   nodeId:NODE,sessionId:context.sessionId,index:context.index,
   originalSlideEvents:[{step:0,action:'slide'}],
   originalQuestionAnswers:structuredClone(model.answers),
   screenGeometryAngles:angles,
   independentCorrespondingAngleDegrees:angles.E,
   independentAlternateInteriorAngleDegrees:angles.C,
   independentSameSideSupplementDegrees:angles.F,
   originalControlSlideObserved:true,
   originalAnswersObserved:true,
   freeTextMeaningAssessed:false,verbalProofAssessed:false,
   strategyAssessed:false,generalMasteryAssessed:false,
   strictAApproved:false};
 }catch{return null;}
}
export function submittedParallelEvidence(task,model,record,context={}){
 return latestSubmissionMatches(model,record)?
  replayParallelEvidence(task,model,context):null;
}
