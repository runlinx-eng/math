// #342 P007e: source-locked original B23 regular pentagon draw replay.
// Development only. A screen-generated polygon is not physical ruler/protractor work.
import * as native from './phase5/b23-model.js';
import {isEvidenceContext,matchesNativeEvidenceTask,latestSubmissionMatches,
 hasExactKeys as exact,sameEvidence as same} from './evidence-contract.js';

const POSITION='shapemeasures:2';
const SOURCE={sessionId:'shapemeasures',index:2,nodeId:'mt_hdrMoiTgqu',
 sha256:'52776a525512c4e7505d49436d3289d6c31b2d8e9600268aca5916f8a7c66dfb'};
const ORIGINAL={type:'x-s23-ruler',
 prompt:'设定边长4厘米、每个内角108°，画一个正五边形。',
 mode:'regular',target:[4,108],
 questions:[{label:'共有几条边',value:5},{label:'每个内角多少度',value:108}]};
const MODEL_KEYS=Object.keys(native.initial(ORIGINAL,1));
const TASK_KEYS=Object.keys(ORIGINAL);
const EPS=1e-8;
const near=(a,b)=>Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<EPS;
const cross=(a,b)=>a[0]*b[1]-a[1]*b[0];
const dot=(a,b)=>a[0]*b[0]+a[1]*b[1];
const vec=(a,b)=>[b[0]-a[0],b[1]-a[1]];
const dist=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
function original(task,context){
 return isEvidenceContext(context)&&context.sessionId===SOURCE.sessionId&&
  context.index===SOURCE.index&&exact(task,TASK_KEYS)&&same(task,ORIGINAL)&&
  matchesNativeEvidenceTask(task,context,{type:ORIGINAL.type,nodeId:SOURCE.nodeId});
}
function polygon(f){
 if(!exact(f,['first','second','angle'])||
    typeof f.first!=='string'||f.second!==''||
    typeof f.angle!=='string')return null;
 const side=Number(f.first),angle=Number(f.angle);
 if(!Number.isFinite(side)||side<=0||side>10||!near(angle,108))return null;
 const radius=side/(2*Math.sin(Math.PI/5));
 const points=Array.from({length:5},(_,i)=>{
  const t=(-90+72*i)*Math.PI/180;
  return [radius*Math.cos(t),radius*Math.sin(t)];
 });
 const lengths=points.map((p,i)=>dist(p,points[(i+1)%5]));
 const interior=points.map((p,i)=>{
  const u=vec(p,points[(i+4)%5]),v=vec(p,points[(i+1)%5]);
  const cos=Math.max(-1,Math.min(1,dot(u,v)/(Math.hypot(...u)*Math.hypot(...v))));
  return Math.acos(cos)*180/Math.PI;
 });
 const turns=points.map((p,i)=>cross(vec(p,points[(i+1)%5]),
  vec(points[(i+1)%5],points[(i+2)%5])));
 const area=Math.abs(points.reduce((s,p,i)=>{
  const q=points[(i+1)%5];return s+cross(p,q);
 },0))/2;
 const expectedArea=5*side*side/(4*Math.tan(Math.PI/5));
 const center=points.reduce((p,q)=>[p[0]+q[0]/5,p[1]+q[1]/5],[0,0]);
 if(!lengths.every(n=>near(n,side))||!interior.every(n=>near(n,108))||
    !turns.every(n=>n>EPS)||!points.every(p=>near(Math.hypot(...p),radius))||
    !near(center[0],0)||!near(center[1],0)||!near(area,expectedArea)||
    !near(interior.reduce((s,v)=>s+v,0),540))return null;
 return {side,points,radius,area,perimeter:lengths.reduce((s,v)=>s+v,0),
  apothem:radius*Math.cos(Math.PI/5),interior,turns,center};
}
function pointsEqual(a,b){
 return Array.isArray(a)&&Array.isArray(b)&&a.length===5&&b.length===5&&
  a.every((p,i)=>Array.isArray(p)&&Array.isArray(b[i])&&
   p.length===2&&b[i].length===2&&p.every((v,j)=>near(v,b[i][j])));
}
export function regularPentagonBinding(task,context={}){
 if(!original(task,context))return null;
 return {kind:'native-regular-pentagon-drawing',originalPosition:POSITION,
  sourceNodeId:SOURCE.nodeId,originalTaskSha256:SOURCE.sha256,
  originalDrawControl:'g23-draw',strictAApproved:false};
}
export function replayRegularPentagonEvidence(task,model,context={}){
 try{
  if(!original(task,context)||!exact(model,MODEL_KEYS)||
     !exact(model.board,['first','drawing'])||model.issue!==''||
     !Array.isArray(model.history)||model.history.length<1||
     model.history.length>650||!same(model.answers,['5','108'])||
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
    const g=polygon(event.f);if(!g)return null;
    if(!Object.hasOwn(first,'draw'))first.draw=structuredClone(event.f);
    latest={raw:structuredClone(event.f),g};draws++;
   }
   events.push({step,action:event.a,
    originalFields:event.a==='draw'?structuredClone(event.f):null});
  }
  const g=latest?.g,raw=latest?.raw;
  if(!g||!same(first,model.board.first)||
     !exact(model.board.drawing,['first','second','angle','points'])||
     !same([model.board.drawing.first,model.board.drawing.second,
       model.board.drawing.angle],[raw.first,raw.second,raw.angle])||
     !pointsEqual(model.board.drawing.points,g.points)||
     !same([model.first,model.second,model.angle],
       [raw.first,raw.second,raw.angle])||
     !near(g.side,4)||!near(g.perimeter,20)||
     !near(g.area,20/Math.tan(Math.PI/5))||
     !near(g.radius,2/Math.sin(Math.PI/5)))return null;
  return {kind:'native-regular-pentagon-drawing',originalPosition:POSITION,
   sourceNodeId:SOURCE.nodeId,originalTaskSha256:SOURCE.sha256,
   originalDrawEvents:draws,originalResetEvents:resets,
   originalControlEvents:events,originalDrawingHistoryReplayed:true,
   independentGeometry:{vertices:5,equalSideCm:g.side,sideCount:5,
    interiorAngleDegrees:108,interiorAngleSumDegrees:540,
    perimeterCm:g.perimeter,areaSquareCm:g.area,circumradiusCm:g.radius,
    apothemCm:g.apothem,convexVerified:g.turns.every(n=>n>EPS),
    equalSidesVerified:true,equalAnglesVerified:true},
   originalQuestionAnswersCorrect:true,physicalRulerOrProtractorUseAssessed:false,
   fieldEditTimelinePersisted:false,freeTextExplanationAssessed:false,
   longTermMasteryAssessed:false,strictAApproved:false};
 }catch{return null;}
}
export function submittedRegularPentagonEvidence(task,model,record,context={}){
 try{
  const proof=replayRegularPentagonEvidence(task,model,context);
  if(!proof||!latestSubmissionMatches(model,record)||
     record.attempts.length!==2)return null;
  const wrong=record.attempts[0].value;
  if(!exact(wrong,MODEL_KEYS)||!exact(wrong.board,['first','drawing'])||
     !native.valid(task,wrong)||native.inspect(task,wrong).correct!==false||
     !Array.isArray(wrong.history)||wrong.history.length+1!==model.history.length||
     !same(model.history.slice(0,-1),wrong.history)||
     model.history.at(-1)?.a!=='draw'||!same(wrong.board.first,model.board.first)||
     wrong.seed!==model.seed||wrong.issue!==''||
     !same(wrong.answers,model.answers)||wrong.first===model.first||
     wrong.second!==model.second||wrong.angle!==model.angle||
     !exact(wrong.board.drawing,['first','second','angle','points'])||
     !same([wrong.board.drawing.first,wrong.board.drawing.second,
       wrong.board.drawing.angle],[wrong.first,wrong.second,wrong.angle])||
     !pointsEqual(wrong.board.drawing.points,polygon({
       first:wrong.first,second:wrong.second,angle:wrong.angle})?.points))
      return null;
  return {...proof,originalCheckSnapshotsObserved:2,
   wrongToCorrectDrawingRevisionObserved:true};
 }catch{return null;}
}
