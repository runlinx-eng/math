// #342 P004n: source-locked preset regular hexagon, original B23 controls only.
import * as native from './phase5/b23-model.js';
import {isEvidenceContext,matchesNativeEvidenceTask,latestSubmissionMatches,
 hasExactKeys as keys,sameEvidence as same} from './evidence-contract.js';

const POSITION='geometrynotation:3', NODE='mt_WtIFJSCQIT', EPS=1e-7;
function source(task,context){
 if(!isEvidenceContext(context)||context.sessionId+':'+context.index!==POSITION||
 !matchesNativeEvidenceTask(task,context,{type:'x-s23-polygon',nodeId:NODE})||
 !keys(task,['type','prompt','n','kind','preset','questions'])||
 task.n!==6||task.kind!=='regular'||task.preset!==true||
 !Array.isArray(task.questions)||task.questions.length!==1||
 task.questions.some(q=>!keys(q,['label','value'])||q.value!==6))return null;
 return {nodeId:NODE};
}
const cross=(a,b)=>a[0]*b[1]-a[1]*b[0];
const orient=(a,b,c)=>cross([b[0]-a[0],b[1]-a[1]],[c[0]-a[0],c[1]-a[1]]);
const nearly=(a,b)=>Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<EPS;
function geometry(indices){
 if(!Array.isArray(indices)||indices.length!==6||
 !indices.every(i=>Number.isInteger(i)&&i>=0&&i<6)||
 new Set(indices).size!==6)return null;
 // Independent trigonometric construction of the six fixed native preset vertices.
 const ps=indices.map(i=>{const a=(-90+60*i)*Math.PI/180;
  return [2*Math.cos(a),2*Math.sin(a)];});
 const edges=ps.map((p,i)=>[ps[(i+1)%6][0]-p[0],ps[(i+1)%6][1]-p[1]]);
 const lengths=edges.map(v=>v[0]*v[0]+v[1]*v[1]);
 const turns=edges.map((v,i)=>cross(v,edges[(i+1)%6]));
 const area2=ps.reduce((s,p,i)=>s+cross(p,ps[(i+1)%6]),0);
 // All turns positive and 120-degree interior angles; nonadjacent edges cannot cross.
 const angleCos=edges.map((v,i)=>{
  const w=edges[(i+1)%6];return -(v[0]*w[0]+v[1]*w[1])/
   Math.sqrt(lengths[i]*lengths[(i+1)%6]);});
 function between(a,b,p){return Math.abs(orient(a,b,p))<EPS&&
   p[0]>=Math.min(a[0],b[0])-EPS&&p[0]<=Math.max(a[0],b[0])+EPS&&
   p[1]>=Math.min(a[1],b[1])-EPS&&p[1]<=Math.max(a[1],b[1])+EPS;}
 function crossing(a,b,c,d){const x=orient(a,b,c),y=orient(a,b,d),
   z=orient(c,d,a),w=orient(c,d,b);
  return x*y< -EPS&&z*w< -EPS||
    between(a,b,c)||between(a,b,d)||between(c,d,a)||between(c,d,b);}
 if(lengths.some(v=>v<EPS||!nearly(v,lengths[0]))||
 turns.some(v=>v<=EPS)||area2<=EPS||
 angleCos.some(v=>!nearly(v,-0.5)))return null;
 for(let i=0;i<6;i++)for(let j=i+1;j<6;j++){
  if(j===i+1||(i===0&&j===5))continue;
  if(crossing(ps[i],ps[(i+1)%6],ps[j],ps[(j+1)%6]))return null;
 }
 return {vertexCount:6,edgeCount:6,sideLengthsSquared:lengths,
  interiorDegrees:Array(6).fill(120),interiorAngleSumDegrees:720,
  signedDoubleArea:area2,closed:true,regular:true,nonSelfIntersecting:true};
}
const isIndex=v=>typeof v==='string'&&/^[0-5]$/.test(v);
export function geometryNotationHexagonBinding(task,context={}){
 const s=source(task,context);return s?{nodeId:s.nodeId,
  kind:'native-preset-regular-hexagon-construction'}:null;
}
export function replayGeometryNotationHexagonEvidence(task,model,context={}){
 try{
  const s=source(task,context);
  if(!s||!keys(model,Object.keys(native.initial(task,1)))||
  !keys(model.board,['first','points','closed'])||
  !Array.isArray(model.history)||model.history.length<7||
  Object.keys(model.history).length!==model.history.length||
  model.issue!==''||!model.board.closed||
  !same(model.answers,['6'])||
  !native.valid(task,model)||!native.inspect(task,model).correct)return null;
  const points=[],events=[];let closed=false,successfulCloses=0;
  for(const [step,e] of model.history.entries()){
   if(!keys(e,['a','f','d'])||!keys(e.f,[]))return null;
   if(e.a==='add'){
    if(!keys(e.d,['index'])||!isIndex(e.d.index)||closed||
      points.length>=6||points.includes(Number(e.d.index)))return null;
    points.push(Number(e.d.index));
    events.push({step,action:'add',pointIndex:Number(e.d.index)});
   }else if(e.a==='undo'){
    if(!keys(e.d,[])||!points.length)return null;
    const removed=points.pop();closed=false;
    events.push({step,action:'undo',removedPointIndex:removed});
   }else if(e.a==='close'){
    if(!keys(e.d,[]))return null;
    const accepted=!!geometry(points);
    if(accepted){closed=true;successfulCloses++;}
    events.push({step,action:'close',geometryAccepted:accepted});
   }else if(e.a==='reset'){
    if(!keys(e.d,[]))return null;
    points.length=0;closed=false;events.push({step,action:'reset'});
   }else return null;
  }
  const g=geometry(points);
  if(!closed||!successfulCloses||!g||!same(points,model.board.points)||
   model.board.closed!==closed)return null;
  return {kind:'native-preset-regular-hexagon-construction',nodeId:s.nodeId,
   sessionId:context.sessionId,index:context.index,originalPointIndices:[...points],
   independentGeometry:g,originalControlEvents:events,
   originalAnswersObserved:true,physicalDrawingObserved:false,
   verbalProofAssessed:false,generalMasteryAssessed:false,strictAApproved:false};
 }catch{return null;}
}
export function submittedGeometryNotationHexagonEvidence(task,model,record,context={}){
 return latestSubmissionMatches(model,record)?
  replayGeometryNotationHexagonEvidence(task,model,context):null;
}
