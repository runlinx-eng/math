// #342 P005d. Four cross-source original B25 vertex-angle tasks; one bounded invariant.
// Candidate only: no shared registration, original grader changes, or strict-A claim.
import * as native from './phase5/b25-model.js';
import {isEvidenceContext,matchesNativeEvidenceTask,latestSubmissionMatches,
 hasExactKeys as keys,sameEvidence as same} from './evidence-contract.js';

const RECTANGLE=[[0,0],[5,0],[5,3],[0,3]];
const TILTED_RECTANGLE=[[0,0],[2.4,1.8],[1.32,3.24],[-1.08,1.44]];
const TRIANGLE=[[0,0],[6,0],[1,1]];
// Four actual B25 native positions; each has an independent lesson/source and
// exact task, even where original polygons or UI controls are shared.
const CASES={
 'anglecorner:2':{
  nodeId:'mt_8OAGVdeTJ_',prompt:'在长方形的四个角中，标出所有直角。',
  points:RECTANGLE,kind:'right',questions:[{label:'一共有几个直角',value:4}],
  expected:[0,1,2,3]},
 'rightcheck:1':{
  nodeId:'mt_MFfYcnv6Tv',prompt:'这个图转斜后，找出仍然是直角的四个角。',
  points:TILTED_RECTANGLE,kind:'right',questions:[{label:'长方形有几个直角',value:4}],
  expected:[0,1,2,3]},
 'linemark:2':{
  nodeId:'mt_QysgF57dxh',prompt:'在这个三角形中，标出比直角大的角。',
  points:TRIANGLE,kind:'obtuse',questions:[{label:'这个角的顶点',value:'meeting',
   options:[['meeting','是两条边相遇的位置'],['end','是另一条边的末端']]}],
  expected:[2]},
 'linenotation:0':{
  nodeId:'mt_e4V6hvcuEJ',prompt:'给长方形的四个直角做标记。',
  points:RECTANGLE,kind:'right',questions:[{label:'角上的小方框表示',value:'right',
   options:[['right','这个角是直角'],['edge','这一边长1']]}],
  expected:[0,1,2,3]}
};
function source(task,context){
 if(!isEvidenceContext(context))return null;
 const spec=CASES[context.sessionId+':'+context.index];
 if(!spec||!matchesNativeEvidenceTask(task,context,{
    type:'x-g25-vertices',nodeId:spec.nodeId})||
    !keys(task,['type','prompt','points','kind','questions']))return null;
 if(task.prompt!==spec.prompt||task.kind!==spec.kind||
    !same(task.points,spec.points)||!same(task.questions,spec.questions))return null;
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
 const spec=source(task,context);
 return spec?{nodeId:spec.nodeId,kind:'native-polygon-interior-angle-classification'}:null;
}
export function replayVertexAngleEvidence(task,model,context={}){
 try{
  const spec=source(task,context);
  if(!spec||!keys(model,Object.keys(native.initial(task,1)))||
   !keys(model.board,['first','selected'])||
   !native.valid(task,model)||!native.inspect(task,model).correct||
   model.issue!==''||!same(model.answers,[String(spec.questions[0].value)])||
   !Array.isArray(model.history)||model.history.length<1||
   model.history.length>24||Object.keys(model.history).length!==model.history.length)return null;
  const geo=polygonAngles(task.points);
  if(!geo)return null;
  const expected=geo.kinds.flatMap((kind,i)=>kind===spec.kind?[i]:[]);
  if(!same(expected,spec.expected)||expected.length===0)return null;
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
   sessionId:context.sessionId,index:context.index,nodeId:spec.nodeId,
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
