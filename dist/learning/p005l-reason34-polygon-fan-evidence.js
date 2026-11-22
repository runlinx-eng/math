// #342 P005l isolated B25 original convex-polygon triangulation evidence.
// Development candidate only: no strict-A admission, source/grader/State-v2 edits.
import * as native from './phase5/b25-model.js';
import {isEvidenceContext,matchesNativeEvidenceTask,latestSubmissionMatches,
 hasExactKeys as keys,sameEvidence as same} from './evidence-contract.js';

const q=(label,value)=>({label,value});
const CASES={
 'reason34:0':{node:'mt_iyovKgZC1q',n:6,math:'hexagon',
  prompt:'从一个顶点把六边形分成三角形。',
  questions:[q('有几个三角形',4),q('内角和是多少度',720)]}
};
const MODEL=['angle','length','base','a','b','other','prose','answers','seed','board','history','issue'];
const unused=['angle','length','base','a','b','other','prose'];
const difference=(a,b)=>[a[0]-b[0],a[1]-b[1]];
const cross=(a,b)=>a[0]*b[1]-a[1]*b[0];
const dot=(a,b)=>a[0]*b[0]+a[1]*b[1];
const close=(a,b)=>Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<1e-7;
const angle=(a,b,c)=>{
 const u=difference(a,b),v=difference(c,b);
 return Math.atan2(Math.abs(cross(u,v)),dot(u,v))*180/Math.PI;
};
function polygonGeometry(n){
 // Independent Euclidean coordinates, fan triangulation and oriented-area check;
 // this does not invoke the native model/grader or its ready-made angle formula.
 if(!Number.isInteger(n)||n<4||n>8)return null;
 const points=Array.from({length:n},(_,i)=>{
  const theta=2*Math.PI*i/n;
  return [Math.cos(theta),Math.sin(theta)];
 });
 const polygonArea=points.reduce((s,p,i)=>s+cross(p,points[(i+1)%n]),0)/2;
 const fans=Array.from({length:n-2},(_,i)=>[points[0],points[i+1],points[i+2]]);
 const fanAreas=fans.map(([a,b,c])=>cross(difference(b,a),difference(c,a))/2);
 const triangleSums=fans.map(([a,b,c])=>angle(b,a,c)+angle(a,b,c)+angle(a,c,b));
 const interiors=points.map((p,i)=>angle(points[(i+n-1)%n],p,points[(i+1)%n]));
 const exteriors=interiors.map(v=>180-v);
 const interiorSum=interiors.reduce((a,b)=>a+b,0);
 const exteriorSum=exteriors.reduce((a,b)=>a+b,0);
 if(!(polygonArea>0)&&n!==0)return null;
 if(!fanAreas.every(x=>x>1e-8)||!close(fanAreas.reduce((a,b)=>a+b,0),polygonArea)||
    !triangleSums.every(x=>close(x,180))||
    !close(interiorSum,triangleSums.reduce((a,b)=>a+b,0))||
    !close(exteriorSum,360)||!interiors.every(v=>v>0&&v<180)||
    !interiors.every(v=>close(v,interiors[0])))return null;
 return {triangulationCount:fans.length,polygonArea,fanAreas,
  independentInteriorSumDegrees:interiorSum,individualInteriorDegrees:interiors,
  individualExteriorDegrees:exteriors,independentExteriorSumDegrees:exteriorSum};
}
const expectedMath=(math,g)=>{
 if(math==='quadrilateral')return[g.triangulationCount,g.independentInteriorSumDegrees];
 if(math==='regular-hexagon')return[g.triangulationCount,g.independentInteriorSumDegrees,g.individualInteriorDegrees[0]];
 if(math==='hexagon')return[g.triangulationCount,g.independentInteriorSumDegrees];
 if(math==='regular-pentagon')return[g.individualInteriorDegrees[0],
  g.individualExteriorDegrees[0],g.independentExteriorSumDegrees];
 return null;
};
export function polygonBinding(task,context={}){
 if(!isEvidenceContext(context))return null;
 const position=context.sessionId+':'+context.index,spec=CASES[position];
 if(!spec||!matchesNativeEvidenceTask(task,context,
  {type:'x-g25-polygon',nodeId:spec.node}))return null;
 if(!keys(task,['type','prompt','n','questions'])||task.n!==spec.n||
    task.prompt!==spec.prompt||!same(task.questions,spec.questions))return null;
 return {position,nodeId:spec.node,math:spec.math};
}
export function replayPolygonEvidence(task,model,context={}){
 try{
  const source=polygonBinding(task,context);
  if(!source||!keys(model,MODEL)||!native.valid(task,model)||
    !native.inspect(task,model).correct||model.issue!==''||
    !keys(model.board,['first','diagonals'])||
    !keys(model.board.first,['diagonal'])||
    !keys(model.board.first.diagonal,[])||
    !unused.every(k=>model[k]==='')||
    !Array.isArray(model.answers)||model.answers.length!==task.questions.length||
    !task.questions.every((q,i)=>model.answers[i]===String(q.value))||
    !Array.isArray(model.history)||model.history.length!==task.n-3||
    !Array.isArray(model.board.diagonals)||model.board.diagonals.length!==task.n-3)return null;
  const order=[];
  for(const event of model.history){
   if(!keys(event,['a','f','d'])||event.a!=='diagonal'||
      !keys(event.f,[])||!keys(event.d,['index']))return null;
   const raw=event.d.index,i=Number(raw);
   if(typeof raw!=='string'||String(i)!==raw||
      !Number.isInteger(i)||i<2||i>task.n-2||order.includes(i))return null;
   order.push(i);
  }
  const expected=Array.from({length:task.n-3},(_,i)=>i+2);
  if(!same([...order].sort((a,b)=>a-b),expected)||
    !same(model.board.diagonals,order))return null;
  const geom=polygonGeometry(task.n);
  const math=geom&&expectedMath(source.math,geom);
  if(!math||math.length!==task.questions.length||
    !math.every((v,i)=>close(v,Number(task.questions[i].value))))return null;
  return {kind:'native-convex-polygon-fan-triangulation',
   nodeId:source.nodeId,position:source.position,
   originalDiagonalOrder:order,triangulationCount:geom.triangulationCount,
   independentInteriorSumDegrees:geom.independentInteriorSumDegrees,
   individualInteriorDegrees:geom.individualInteriorDegrees,
   individualExteriorDegrees:geom.individualExteriorDegrees,
   independentExteriorSumDegrees:geom.independentExteriorSumDegrees,
   independentAreaPartitionVerified:true,
   originalQuestionAnswers:structuredClone(model.answers),
   originalDiagonalClicksObserved:true,verbalProofAssessed:false,
   learnerStrategyAssessed:false,generalMasteryAssessed:false,strictAApproved:false};
 }catch{return null;}
}
export function submittedPolygonEvidence(task,model,record,context={}){
 return latestSubmissionMatches(model,record)?
  replayPolygonEvidence(task,model,context):null;
}
