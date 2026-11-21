// #342 P007c: original B23 ruler triangle, two sides and included angle.
// Development-only candidate. Screen-generated geometry is not physical ruler use.
import * as native from './phase5/b23-model.js';
import {isEvidenceContext,matchesNativeEvidenceTask,latestSubmissionMatches,
 hasExactKeys as exact,sameEvidence as same} from './evidence-contract.js';

const POSITION='shapemeasures:0';
const SOURCE={sessionId:'shapemeasures',index:0,nodeId:'mt_hdrMoiTgqu',
 sha256:'07b7c68d5d254f6042b17f6ba7f18f850caad412da75f82ee00f01ca7f236e36'};
const ORIGINAL={type:'x-s23-ruler',
 prompt:'画两条从同一点出发的边：5厘米、7厘米，夹角60°，再连成三角形。',
 mode:'triangle',target:[5,7,60],questions:[{label:'夹角多少度',value:60}]};
const MODEL_KEYS=Object.keys(native.initial(ORIGINAL,1));
const TASK_KEYS=Object.keys(ORIGINAL);
const EPS=1e-8;
const almost=(a,b)=>Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<EPS;
function original(task,context){
 return isEvidenceContext(context)&&context.sessionId===SOURCE.sessionId&&
  context.index===SOURCE.index&&exact(task,TASK_KEYS)&&same(task,ORIGINAL)&&
  matchesNativeEvidenceTask(task,context,
    {type:ORIGINAL.type,nodeId:SOURCE.nodeId});
}
function numeric(f){
 if(!exact(f,['first','second','angle'])||
    !Object.values(f).every(x=>typeof x==='string'&&x.length>0))return null;
 const a=Number(f.first),b=Number(f.second),degrees=Number(f.angle);
 if(!Number.isFinite(a)||!Number.isFinite(b)||!Number.isFinite(degrees)||
    a<=0||b<=0||a>10||b>10||degrees<=0||degrees>=180)return null;
 const theta=degrees*Math.PI/180,c=Math.cos(theta),s=Math.sin(theta);
 const pts=[[0,0],[a,0],[b*c,b*s]],thirdSquared=a*a+b*b-2*a*b*c;
 const area=a*b*s/2,third=Math.sqrt(thirdSquared);
 if(thirdSquared<=0||area<=0||!(a+b>third&&a+third>b&&b+third>a))return null;
 const first=[pts[1][0]-pts[0][0],pts[1][1]-pts[0][1]],
       second=[pts[2][0]-pts[0][0],pts[2][1]-pts[0][1]];
 const dot=first[0]*second[0]+first[1]*second[1],
       cross=first[0]*second[1]-first[1]*second[0];
 if(!almost(Math.hypot(...first),a)||!almost(Math.hypot(...second),b)||
    !almost(dot/(a*b),c)||!almost(cross/2,area))return null;
 return {a,b,degrees,thirdSide:third,area,points:pts};
}
function pointsEqual(a,b){
 return Array.isArray(a)&&Array.isArray(b)&&a.length===3&&b.length===3&&
   a.every((row,i)=>Array.isArray(row)&&Array.isArray(b[i])&&
     row.length===2&&b[i].length===2&&
     row.every((x,j)=>almost(x,b[i][j])));
}
export function triangleSasBinding(task,context={}){
 if(!original(task,context))return null;
 return {kind:'native-triangle-sas-drawing',originalPosition:POSITION,
  sourceNodeId:SOURCE.nodeId,originalTaskSha256:SOURCE.sha256,
  originalDrawControl:'g23-draw',strictAApproved:false};
}
export function replayTriangleSasEvidence(task,model,context={}){
 try{
  if(!original(task,context)||!exact(model,MODEL_KEYS)||
     !exact(model.board,['first','drawing'])||model.issue!==''||
     !Array.isArray(model.history)||model.history.length<1||
     model.history.length>650||!same(model.answers,['60'])||
     !native.valid(task,model)||native.inspect(task,model).correct!==true)
      return null;
  const first={},events=[];let drawing=null,draws=0,resets=0;
  for(const [step,event] of model.history.entries()){
   if(!exact(event,['a','f','d'])||!exact(event.d,[])||
      !['draw','reset'].includes(event.a))return null;
   if(event.a==='reset'){
    if(!exact(event.f,[]))return null;
    if(!Object.hasOwn(first,'reset'))first.reset={};
    drawing=null;resets++;
   }else{
    const geometry=numeric(event.f);
    if(!geometry)return null;
    if(!Object.hasOwn(first,'draw'))first.draw=structuredClone(event.f);
    drawing={raw:structuredClone(event.f),geometry};draws++;
   }
   events.push({step,action:event.a,
     originalDimensions:event.a==='draw'?structuredClone(event.f):null});
  }
  const g=drawing?.geometry;
  if(!g||!same(first,model.board.first)||
     !exact(model.board.drawing,['first','second','angle','points'])||
     !same([model.board.drawing.first,model.board.drawing.second,
       model.board.drawing.angle],
       [drawing.raw.first,drawing.raw.second,drawing.raw.angle])||
     !pointsEqual(model.board.drawing.points,g.points)||
     !same([model.first,model.second,model.angle],
       [drawing.raw.first,drawing.raw.second,drawing.raw.angle])||
     !almost(g.degrees,60)||
     !(almost(g.a,5)&&almost(g.b,7)||almost(g.a,7)&&almost(g.b,5))||
     !almost(g.thirdSide,Math.sqrt(39))||
     !almost(g.area,35*Math.sqrt(3)/4))return null;
  return {kind:'native-triangle-sas-drawing',
   originalPosition:POSITION,sourceNodeId:SOURCE.nodeId,
   originalTaskSha256:SOURCE.sha256,originalDrawEvents:draws,
   originalResetEvents:resets,originalControlEvents:events,
   independentGeometry:{firstSideCm:g.a,secondSideCm:g.b,
     includedAngleDegrees:g.degrees,thirdSideCm:g.thirdSide,
     areaSquareCm:g.area,triangleInequalitiesVerified:true,
     coordinateAndSasConsistencyVerified:true},
   originalDrawingHistoryReplayed:true,
   originalQuestionAnswerCorrect:true,
   actualRulerOrProtractorUseAssessed:false,
   independentPencilConstructionAssessed:false,
   freeTextExplanationAssessed:false,longTermMasteryAssessed:false,
   strictAApproved:false};
 }catch{return null;}
}
export function submittedTriangleSasEvidence(task,model,record,context={}){
 try{
  const proof=replayTriangleSasEvidence(task,model,context);
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
     !same(wrong.answers,model.answers)||
     wrong.first===model.first||wrong.second!==model.second||
     wrong.angle!==model.angle||
     !exact(wrong.board.drawing,['first','second','angle','points'])||
     !same([wrong.board.drawing.first,wrong.board.drawing.second,
       wrong.board.drawing.angle],[wrong.first,wrong.second,wrong.angle])||
     !pointsEqual(wrong.board.drawing.points,
       numeric({first:wrong.first,second:wrong.second,angle:wrong.angle})?.points))
      return null;
  // The first Check proves only an incorrect dimensioned drawing was saved.
  // The second Check saves one more original draw event and a correct triangle.
  return {...proof,originalCheckSnapshotsObserved:2,
   wrongToCorrectDrawingRevisionObserved:true,
   individualTextFieldEditTimelinePersisted:false};
 }catch{return null;}
}
