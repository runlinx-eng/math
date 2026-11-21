// #342 P007d: native B23 rectangle drawn from exact 6 cm x 4 cm dimensions.
// Development-only math replay; screen drawing is not physical ruler use.
import * as native from './phase5/b23-model.js';
import {isEvidenceContext,matchesNativeEvidenceTask,latestSubmissionMatches,
 hasExactKeys as exact,sameEvidence as same} from './evidence-contract.js';

const POSITION='shapemeasures:1';
const SOURCE={sessionId:'shapemeasures',index:1,nodeId:'mt_hdrMoiTgqu',
 sha256:'5280a44cd6f5b3b782ec4184a213a613064f914e42b465e79e5c616930492fd9'};
const ORIGINAL={type:'x-s23-ruler',
 prompt:'设定长6厘米、宽4厘米，画一个四角是直角的长方形。',
 mode:'rectangle',target:[6,4],questions:[{label:'四个角各是多少度',value:90}]};
const MODEL_KEYS=Object.keys(native.initial(ORIGINAL,1));
const TASK_KEYS=Object.keys(ORIGINAL);
const EPS=1e-8;
const near=(a,b)=>Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<EPS;
function original(task,context){
 return isEvidenceContext(context)&&context.sessionId===SOURCE.sessionId&&
  context.index===SOURCE.index&&exact(task,TASK_KEYS)&&same(task,ORIGINAL)&&
  matchesNativeEvidenceTask(task,context,{type:ORIGINAL.type,nodeId:SOURCE.nodeId});
}
function geometry(f){
 if(!exact(f,['first','second','angle'])||
    typeof f.first!=='string'||typeof f.second!=='string'||f.angle!=='')return null;
 const a=Number(f.first),b=Number(f.second);
 if(!Number.isFinite(a)||!Number.isFinite(b)||a<=0||b<=0||a>10||b>10)return null;
 const points=[[0,0],[a,0],[a,b],[0,b]];
 const vectors=points.map((p,i)=>{
  const q=points[(i+1)%4];return[q[0]-p[0],q[1]-p[1]];
 });
 const lengths=vectors.map(v=>Math.hypot(v[0],v[1]));
 const dot=(u,v)=>u[0]*v[0]+u[1]*v[1];
 const cross=(u,v)=>u[0]*v[1]-u[1]*v[0];
 const shoelace=points.reduce((s,p,i)=>{
  const q=points[(i+1)%4];return s+p[0]*q[1]-p[1]*q[0];
 },0)/2;
 const fourRights=vectors.every((v,i)=>near(dot(v,vectors[(i+1)%4]),0));
 const parallel=near(cross(vectors[0],vectors[2]),0)&&
  near(cross(vectors[1],vectors[3]),0);
 if(!fourRights||!parallel||!near(lengths[0],lengths[2])||
    !near(lengths[1],lengths[3])||!near(lengths[0],a)||
    !near(lengths[1],b)||!near(shoelace,a*b)||a===b)return null;
 return {a,b,points,area:a*b,perimeter:lengths.reduce((s,v)=>s+v,0),
  diagonal:Math.hypot(a,b),rightAnglesVerified:true,
  oppositeSidesParallelVerified:true,oppositeSidesEqualVerified:true};
}
function pointsEqual(a,b){
 return Array.isArray(a)&&Array.isArray(b)&&a.length===4&&b.length===4&&
  a.every((p,i)=>Array.isArray(p)&&Array.isArray(b[i])&&
   p.length===2&&b[i].length===2&&p.every((v,j)=>near(v,b[i][j])));
}
export function rectangleDimensionsBinding(task,context={}){
 if(!original(task,context))return null;
 return {kind:'native-rectangle-dimensions',originalPosition:POSITION,
  sourceNodeId:SOURCE.nodeId,originalTaskSha256:SOURCE.sha256,
  originalDrawControl:'g23-draw',strictAApproved:false};
}
export function replayRectangleDimensionsEvidence(task,model,context={}){
 try{
  if(!original(task,context)||!exact(model,MODEL_KEYS)||
     !exact(model.board,['first','drawing'])||model.issue!==''||
     !Array.isArray(model.history)||model.history.length<1||
     model.history.length>650||!same(model.answers,['90'])||
     !native.valid(task,model)||native.inspect(task,model).correct!==true)
      return null;
  const first={},events=[];let latest=null,draws=0,resets=0;
  for(const [step,event] of model.history.entries()){
   if(!exact(event,['a','f','d'])||!exact(event.d,[])||
      !['draw','reset'].includes(event.a))return null;
   if(event.a==='reset'){
    if(!exact(event.f,[]))return null;
    if(!Object.hasOwn(first,'reset'))first.reset={};
    latest=null;resets++;
   }else{
    const g=geometry(event.f);if(!g)return null;
    if(!Object.hasOwn(first,'draw'))first.draw=structuredClone(event.f);
    latest={raw:structuredClone(event.f),g};draws++;
   }
   events.push({step,action:event.a,
    originalDimensions:event.a==='draw'?structuredClone(event.f):null});
  }
  const g=latest?.g,raw=latest?.raw;
  if(!g||!same(first,model.board.first)||
     !exact(model.board.drawing,['first','second','angle','points'])||
     !same([model.board.drawing.first,model.board.drawing.second,
       model.board.drawing.angle],[raw.first,raw.second,raw.angle])||
     !pointsEqual(model.board.drawing.points,g.points)||
     !same([model.first,model.second,model.angle],
       [raw.first,raw.second,raw.angle])||
     !(near(g.a,6)&&near(g.b,4)||near(g.a,4)&&near(g.b,6))||
     !near(g.area,24)||!near(g.perimeter,20)||!near(g.diagonal,Math.sqrt(52)))
      return null;
  return {kind:'native-rectangle-dimensions',originalPosition:POSITION,
   sourceNodeId:SOURCE.nodeId,originalTaskSha256:SOURCE.sha256,
   originalDrawEvents:draws,originalResetEvents:resets,
   originalControlEvents:events,originalDrawingHistoryReplayed:true,
   independentGeometry:{lengthCm:g.a,widthCm:g.b,areaSquareCm:g.area,
    perimeterCm:g.perimeter,diagonalCm:g.diagonal,vertices:g.points.length,
    rightAnglesVerified:g.rightAnglesVerified,
    oppositeSidesParallelVerified:g.oppositeSidesParallelVerified,
    oppositeSidesEqualVerified:g.oppositeSidesEqualVerified},
   originalQuestionAnswerCorrect:true,physicalRulerUseAssessed:false,
   fieldEditTimelinePersisted:false,freeTextExplanationAssessed:false,
   longTermMasteryAssessed:false,strictAApproved:false};
 }catch{return null;}
}
export function submittedRectangleDimensionsEvidence(task,model,record,context={}){
 try{
  const proof=replayRectangleDimensionsEvidence(task,model,context);
  if(!proof||!latestSubmissionMatches(model,record)||
     record.attempts.length!==2)return null;
  const wrong=record.attempts[0].value;
  if(!exact(wrong,MODEL_KEYS)||!exact(wrong.board,['first','drawing'])||
     !native.valid(task,wrong)||native.inspect(task,wrong).correct!==false||
     !Array.isArray(wrong.history)||wrong.history.length+1!==model.history.length||
     !same(model.history.slice(0,-1),wrong.history)||
     model.history.at(-1)?.a!=='draw'||
     !same(wrong.board.first,model.board.first)||
     wrong.seed!==model.seed||wrong.issue!==''||
     !same(wrong.answers,model.answers)||wrong.first===model.first||
     wrong.second!==model.second||wrong.angle!==model.angle||
     !exact(wrong.board.drawing,['first','second','angle','points'])||
     !same([wrong.board.drawing.first,wrong.board.drawing.second,
       wrong.board.drawing.angle],[wrong.first,wrong.second,wrong.angle])||
     !pointsEqual(wrong.board.drawing.points,
       geometry({first:wrong.first,second:wrong.second,angle:wrong.angle})?.points))
      return null;
  return {...proof,originalCheckSnapshotsObserved:2,
   wrongToCorrectDrawingRevisionObserved:true};
 }catch{return null;}
}
