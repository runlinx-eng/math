// #342 P005c. Three source-locked B25 polygon vertex tasks, one bounded invariant.
// Candidate only: no shared registration, original grader changes, or strict-A claim.
import * as native from './phase5/b25-model.js';
import {isEvidenceContext,matchesNativeEvidenceTask,latestSubmissionMatches,
 hasExactKeys as keys,sameEvidence as same} from './evidence-contract.js';

const NODE='mt_h0CVtqI2xo';
const TRIANGLE=[[0,0],[6,0],[1,1]];
const RHOMBUS=[[0,0],[5,0],[6,3],[1,3]];
const CASES={
 2:{prompt:'标出这个三角形里比直角大的角。',points:TRIANGLE,
    kind:'obtuse',label:'这个三角形中有几个钝角',answer:1,expected:[2]},
 3:{prompt:'在这个倾斜的四边形里标出所有比直角小的角。',points:RHOMBUS,
    kind:'acute',label:'有几个锐角',answer:2,expected:[0,2]},
 4:{prompt:'在同一个四边形里标出所有比直角大的角。',points:RHOMBUS,
    kind:'obtuse',label:'有几个钝角',answer:2,expected:[1,3]}
};
function source(task,context){
 if(!isEvidenceContext(context)||context.sessionId!=='angletypes'||
   !Object.hasOwn(CASES,context.index)||
   !matchesNativeEvidenceTask(task,context,{type:'x-g25-vertices',nodeId:NODE})||
   !keys(task,['type','prompt','points','kind','questions']))return null;
 const spec=CASES[context.index];
 if(task.prompt!==spec.prompt||task.kind!==spec.kind||
   !same(task.points,spec.points)||!Array.isArray(task.questions)||
   task.questions.length!==1||!keys(task.questions[0],['label','value'])||
   task.questions[0].label!==spec.label||task.questions[0].value!==spec.answer)return null;
 return spec;
}
// Independent of the original B25 acos-based grader: use each pair of
// adjacent edge vectors, atan2(|cross|,dot), and the sign of dot for kind.
function polygonAngles(points){
 if(!Array.isArray(points)||points.length<3)return null;
 const result=[],kinds=[];let winding=0;
 for(let i=0;i<points.length;i++){
  const p=points[i],prev=points[(i+points.length-1)%points.length],
   next=points[(i+1)%points.length];
  if(![p,prev,next].every(a=>Array.isArray(a)&&a.length===2&&
    a.every(v=>typeof v==='number'&&Number.isFinite(v))))return null;
  const u=[prev[0]-p[0],prev[1]-p[1]],
   v=[next[0]-p[0],next[1]-p[1]];
  const lu=Math.hypot(...u),lv=Math.hypot(...v);
  const cross=u[0]*v[1]-u[1]*v[0],dot=u[0]*v[0]+u[1]*v[1];
  if(lu<1e-9||lv<1e-9||Math.abs(cross)<1e-9)return null;
  const s=Math.sign(cross);if(winding!==0&&winding!==s)return null;winding=s;
  const angle=Math.atan2(Math.abs(cross),dot)*180/Math.PI;
  if(!Number.isFinite(angle)||angle<=0||angle>=180)return null;
  const kind=Math.abs(dot)<=lu*lv*1e-10?'right':dot>0?'acute':'obtuse';
  result.push(angle);kinds.push(kind);
 }
 return {result,kinds};
}
export function vertexAngleBinding(task,context={}){
 return source(task,context)?{nodeId:NODE,kind:'native-polygon-interior-angle-classification'}:null;
}
export function replayVertexAngleEvidence(task,model,context={}){
 try{
  const spec=source(task,context);
  if(!spec||!keys(model,Object.keys(native.initial(task,1)))||
   !keys(model.board,['first','selected'])||
   !native.valid(task,model)||!native.inspect(task,model).correct||
   model.issue!==''||!same(model.answers,[String(spec.answer)])||
   !Array.isArray(model.history)||model.history.length<1||
   model.history.length>24||Object.keys(model.history).length!==model.history.length)return null;
  const geo=polygonAngles(task.points);
  if(!geo)return null;
  const expected=geo.kinds.flatMap((kind,i)=>kind===spec.kind?[i]:[]);
  if(!same(expected,spec.expected)||expected.length!==spec.answer)return null;
  const selected=[],events=[];let correctionObserved=false;
  for(const [step,e] of model.history.entries()){
   if(!keys(e,['a','f','d'])||e.a!=='choose'||
     !keys(e.f,[])||!keys(e.d,['index'])||
     typeof e.d.index!=='string'||!/^(0|[1-9][0-9]*)$/.test(e.d.index))return null;
   const i=Number(e.d.index);
   if(!Number.isInteger(i)||i<0||i>=task.points.length)return null;
   const old=selected.indexOf(i),unchoose=old>=0;
   if(unchoose){selected.splice(old,1);correctionObserved=true;}else selected.push(i);
   events.push({step,action:unchoose?'unchoose':'choose',index:i,
    interiorAngleDegrees:geo.result[i],classification:geo.kinds[i]});
  }
  if(!same(model.board.first,{choose:{}})||
    !same(selected,model.board.selected)||
    !same([...selected].sort((a,b)=>a-b),spec.expected))return null;
  return {kind:'native-polygon-interior-angle-classification',
   sessionId:context.sessionId,index:context.index,nodeId:NODE,
   measuredInteriorDegrees:geo.result,independentClassification:geo.kinds,
   selectedVertexIndices:spec.expected,originalControlEvents:events,
   correctionObserved,originalAnswersObserved:true,
   physicalProtractorAssessed:false,verbalProofAssessed:false,
   generalMasteryAssessed:false,strictAApproved:false};
 }catch{return null;}
}
export function submittedVertexAngleEvidence(task,model,record,context={}){
 return latestSubmissionMatches(model,record)?
  replayVertexAngleEvidence(task,model,context):null;
}
