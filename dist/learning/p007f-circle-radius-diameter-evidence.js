// #342 P007f: source-locked native B23 circle radius/diameter replay.
// Development-only evidence; neither real compass skill nor formal strict A.
import * as native from './phase5/b23-model.js';
import {isEvidenceContext,matchesNativeEvidenceTask,latestSubmissionMatches,
 hasExactKeys as exact,sameEvidence as same} from './evidence-contract.js';

const NODE='mt_xq3YHZ2zeR', SESSION='circleparts', EPS=1e-9;
const OPTIONS_EDGE=[['edge','绕圆一整圈的边界'],['radius','圆心到边缘的线']];
const OPTIONS_TURN=[['same','仍经过圆心，长度仍是两倍半径'],['different','只要转斜长度就变']];
const SPECS=[
 {index:0,hash:'a1466d51fcca03b4c7946c32cf66db3dc1eea6a4bf0fff0b1baea449ee38a234',
  task:{type:'x-s23-circle',prompt:'先画一个半径4.5厘米的圆，再画从圆心到边缘的线和穿过圆心的整条线。',
   radius:4.5,questions:[{label:'直径多少厘米',value:9},
    {label:'圆周指',value:'edge',options:OPTIONS_EDGE}]}},
 {index:1,hash:'bd59fb60e1bd3b60d6f5a1b8d798b976020c1e398fe8e8ab8a8ad80b1fee6153',
  task:{type:'x-s23-circle',prompt:'换一个半径3厘米的圆，把直径转斜再看长度。',
   radius:3,questions:[{label:'直径多少厘米',value:6},
    {label:'直径转向后',value:'same',options:OPTIONS_TURN}],turn:true}},
 {index:2,hash:'7f8e7528fbd4d96973c497478e732b2d213e2be8f92a64e691e8cd5fdd53ec27',
  task:{type:'x-s23-circle',prompt:'这次画半径2厘米的圆，从直径反推半径。',
   radius:2,questions:[{label:'直径多少厘米',value:4},
    {label:'直径的一半多少厘米',value:2}]}}
];
const close=(x,y)=>Number.isFinite(x)&&Number.isFinite(y)&&Math.abs(x-y)<EPS;
const clone=x=>structuredClone(x);
function source(task,context){
 if(!isEvidenceContext(context)||context.sessionId!==SESSION)return null;
 const s=SPECS.find(s=>s.index===context.index);
 return s&&exact(task,Object.keys(s.task))&&same(task,s.task)&&
  matchesNativeEvidenceTask(task,context,{type:'x-s23-circle',nodeId:NODE})?s:null;
}
function roundActions(task){return ['radial','diameter','rim',...(task.turn?['turn']:[])];}
// Rebuild the original bounded event-state transitions independently from saved events.
// Only claimed actions are those present in the raw original history.
function replayRaw(task,model,context){
 try{
  const s=source(task,context);
  if(!s||!exact(model,Object.keys(native.initial(task,1)))||
     model.issue!==''||model.prose!==''||
     !Array.isArray(model.history)||model.history.length<4||
     model.history.length>100||!native.valid(task,model))return null;
  for(const [key,value] of Object.entries(native.fields(task))){
   if(key!=='radius'&&key!=='answers'&&key!=='prose'&&!same(model[key],value))
    return null;
  }
  if(!same(model.answers,task.questions.map(q=>String(q.value))))return null;
  const b={first:{},radius:null,radial:false,diameter:false,rim:false,turns:0};
  const groups=[],events=[];
  const required=roundActions(task);
  for(const [step,e] of model.history.entries()){
   if(!exact(e,['a','f','d'])||!exact(e.d,[])||
      !['circle','radial','diameter','rim','turn','reset'].includes(e.a)||
      (e.a==='turn'&&!task.turn)||
      !exact(e.f,e.a==='circle'?['radius']:[]))return null;
   if(e.a==='circle'&&typeof e.f.radius!=='string')return null;
   if(!Object.hasOwn(b.first,e.a))b.first[e.a]=clone(e.f);
   if(e.a==='reset'){
    b.radius=null;b.radial=false;b.diameter=false;b.rim=false;b.turns=0;
   }else if(e.a==='circle'){
    const radius=Number(e.f.radius);
    if(!Number.isFinite(radius)||radius<=0||radius>10||e.f.radius.trim()==='')
     return null;
    b.radius=radius;b.radial=false;b.diameter=false;b.rim=false;b.turns=0;
    groups.push({radius,actions:[],start:step});
   }else{
    const current=groups.at(-1);
    if(b.radius===null||!current||current.actions.includes(e.a)||
       !required.includes(e.a))return null;
    current.actions.push(e.a);
    if(e.a==='radial')b.radial=true;
    if(e.a==='diameter')b.diameter=true;
    if(e.a==='rim')b.rim=true;
    if(e.a==='turn')b.turns++;
   }
   events.push({step,action:e.a,originalFields:clone(e.f)});
  }
  if(!same(model.board,b)||groups.length<1||
     !groups.every(g=>g.actions.length===required.length&&
       required.every(action=>g.actions.includes(action)))||
     !close(Number(model.radius),b.radius)||
     !b.radial||!b.diameter||!b.rim||
     b.turns!==(task.turn?1:0))return null;
  return {s,board:b,groups,events};
 }catch{return null;}
}
export function nativeCircleBinding(task,context={}){
 const s=source(task,context);
 return s?{kind:'native-circle-radius-diameter',position:SESSION+':'+s.index,
  sourceNodeId:NODE,originalTaskSha256:s.hash,
  originalControls:roundActions(task).map(x=>'g23-'+x).concat('g23-circle'),
  strictAApproved:false}:null;
}
export function replayNativeCircleEvidence(task,model,context={}){
 const raw=replayRaw(task,model,context);
 if(!raw||!close(raw.board.radius,task.radius)||
    native.inspect(task,model).correct!==true)return null;
 const r=raw.board.radius,d=2*r,t=raw.board.turns*Math.PI/4;
 const start=[-r*Math.cos(t),-r*Math.sin(t)];
 const end=[r*Math.cos(t),r*Math.sin(t)];
 const distance=Math.hypot(end[0]-start[0],end[1]-start[1]);
 const middle=[(start[0]+end[0])/2,(start[1]+end[1])/2];
 const circumference=2*Math.PI*r,area=Math.PI*r*r;
 if(!close(distance,d)||!close(Math.hypot(...start),r)||
    !close(Math.hypot(...end),r)||!middle.every(x=>close(x,0))||
    !close(circumference/d,Math.PI)||!close(area/(r*r),Math.PI))
   return null;
 return {kind:'native-circle-radius-diameter',
  originalPosition:SESSION+':'+raw.s.index,sourceNodeId:NODE,
  originalTaskSha256:raw.s.hash,
  originalEventCount:raw.events.length,originalCircleDraws:raw.groups.length,
  originalControlEvents:raw.events,originalCircleHistoryReplayed:true,
  independentGeometry:{radiusCm:r,diameterCm:d,halfDiameterCm:d/2,
   circumferenceCm:circumference,areaSquareCm:area,
   rotationDegrees:raw.board.turns*45,
   rotatedDiameterCm:distance,diameterMidpoint:middle,
   radialDistanceCm:Math.hypot(...end),
   diameterStillPassesCenter:true,diameterLengthInvariant:true},
  originalQuestionAnswersCorrect:true,
  originalScreenCircleNotMeasuredByPhysicalCompass:true,
  freeTextExplanationAssessed:false,fieldEditTimelinePersisted:false,
  physicalCompassOrRulerSkillAssessed:false,longTermMasteryAssessed:false,
  strictAApproved:false};
}
export function submittedNativeCircleEvidence(task,model,record,context={}){
 try{
  const proof=replayNativeCircleEvidence(task,model,context),
   good=replayRaw(task,model,context);
  if(!proof||!good||!latestSubmissionMatches(model,record)||
     record.attempts.length!==2)return null;
  const wrong=record.attempts[0].value,
   bad=replayRaw(task,wrong,context);
  if(!bad||bad.groups.length!==1||good.groups.length!==2||
     !same(bad.events,good.events.slice(0,bad.events.length))||
     !same(wrong.history,model.history.slice(0,wrong.history.length))||
     !close(bad.board.radius,task.radius+1)||
     !close(good.groups[0].radius,bad.board.radius)||
     !close(good.groups[1].radius,task.radius)||
     !same(bad.board.first,good.board.first)||
     wrong.seed!==model.seed||!same(wrong.answers,model.answers)||
     native.inspect(task,wrong).correct!==false||
     native.inspect(task,model).correct!==true)return null;
  return {...proof,originalCheckSnapshotsObserved:2,
   wrongToCorrectRadiusRedrawObserved:true};
 }catch{return null;}
}
