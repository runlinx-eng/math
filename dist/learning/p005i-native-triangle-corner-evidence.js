// #342 P005i isolated original B25 three-corner sum evidence; not formal A.
import * as native from './phase5/b25-model.js';
import {isEvidenceContext,matchesNativeEvidenceTask,latestSubmissionMatches,
 hasExactKeys as keys,sameEvidence as same} from './evidence-contract.js';

const q=(label,value)=>({label,value});
const CASES={
 'triangleangles:0':{node:'mt_cdMlC7EpTJ',a:50,b:60,
  prompt:'把三角形的三个角搬到一条直线上。',
  questions:[q('三个角合起来是多少度',180),q('已知两个角是50°和60°，第三个角是多少度',70)]},
 'polygonangles:0':{node:'mt_J03RFlVdas',a:35,b:80,
  prompt:'换一个三角形，再把三个角搬到一条直线上。',
  questions:[q('三个角合计多少度',180),q('第三个角是多少度',65)]}
};
const MODEL=['angle','length','base','a','b','other','prose','answers','seed','board','history','issue'];
const UNUSED=['angle','length','base','a','b','other','prose'];
const rad=x=>x*Math.PI/180;
const deg=x=>x*180/Math.PI;
function triangleAngles(a,b){
 // Independent Euclidean construction: AB=5, angle A=a, angle B=b.
 const c=180-a-b;
 if(![a,b,c].every(x=>Number.isFinite(x)&&x>0&&x<180))return null;
 const ac=5*Math.sin(rad(b))/Math.sin(rad(c));
 const p=[[0,0],[5,0],[ac*Math.cos(rad(a)),ac*Math.sin(rad(a))]];
 const angles=p.map((v,i)=>{
  const u=[p[(i+1)%3][0]-v[0],p[(i+1)%3][1]-v[1]];
  const w=[p[(i+2)%3][0]-v[0],p[(i+2)%3][1]-v[1]];
  return deg(Math.atan2(Math.abs(u[0]*w[1]-u[1]*w[0]),u[0]*w[0]+u[1]*w[1]));
 });
 return angles.every(Number.isFinite)&&angles.every((x,i)=>Math.abs(x-[a,b,c][i])<1e-8)
  &&Math.abs(angles.reduce((x,y)=>x+y,0)-180)<1e-8?angles:null;
}
export function cornerBinding(task,context={}){
 if(!isEvidenceContext(context))return null;
 const pos=context.sessionId+':'+context.index, spec=CASES[pos];
 if(!spec||!matchesNativeEvidenceTask(task,context,
  {type:'x-g25-corners',nodeId:spec.node}))return null;
 if(!keys(task,['type','prompt','a','b','questions'])||
  task.prompt!==spec.prompt||task.a!==spec.a||task.b!==spec.b||
  !same(task.questions,spec.questions))return null;
 return {position:pos,nodeId:spec.node};
}
export function replayCornerEvidence(task,model,context={}){
 try{
  const source=cornerBinding(task,context);
  if(!source||!keys(model,MODEL)||!native.valid(task,model)||
    !native.inspect(task,model).correct||model.issue!==''||
    !keys(model.board,['first','selected'])||
    !keys(model.board.first,['choose'])||
    !keys(model.board.first.choose,[])||
    !UNUSED.every(k=>model[k]==='')||
    !Array.isArray(model.answers)||model.answers.length!==task.questions.length||
    !task.questions.every((q,i)=>model.answers[i]===String(q.value))||
    !Array.isArray(model.history)||model.history.length!==3||
    !Array.isArray(model.board.selected)||model.board.selected.length!==3)return null;
  const chosen=[];
  for(const e of model.history){
   if(!keys(e,['a','f','d'])||e.a!=='choose'||!keys(e.f,[])||
     !keys(e.d,['index'])||!['0','1','2'].includes(e.d.index))return null;
   const i=Number(e.d.index);
   if(chosen.includes(i))return null;
   chosen.push(i);
  }
  if(!same([...chosen].sort(),[0,1,2])||
    !same([...model.board.selected].sort(),[0,1,2]))return null;
  const angles=triangleAngles(task.a,task.b);
  if(!angles)return null;
  const sum=angles.reduce((a,b)=>a+b,0);
  if(!task.questions.some(q=>q.value===180)||
    !task.questions.some(q=>q.value===angles[2]))return null;
  return {kind:'native-three-corner-sum',nodeId:source.nodeId,
   position:source.position,angles,independentAngleSumDegrees:sum,
   originalChooseOrder:chosen,originalQuestionAnswers:structuredClone(model.answers),
   screenCornerMovesObserved:true,verbalProofAssessed:false,
   generalMasteryAssessed:false,strictAApproved:false};
 }catch{return null;}
}
export function submittedCornerEvidence(task,model,record,context={}){
 return latestSubmissionMatches(model,record)?
  replayCornerEvidence(task,model,context):null;
}
