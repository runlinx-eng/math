// #342 P007g: original B23 equal-radius arc intersection and perpendicular bisector.
// Development-only, source-locked proof; physical drawing and formal strict A are not claimed.
import * as native from './phase5/b23-model.js';
import {isEvidenceContext,matchesNativeEvidenceTask,latestSubmissionMatches,
 hasExactKeys as exact,sameEvidence as same} from './evidence-contract.js';

const SESSION='compasswork',NODE='mt_ZrsqGVG-Wt';
const HASH='05568f1f7538a0362961fc24bb1411c5e568e36abc065c1f6b1598554150aaba';
const TASK={type:'x-s23-compass',
 prompt:'用两端为圆心画同样宽的圆弧，找出交点并连起来，得到中间的垂线。',
 mode:'bisector',questions:[{label:'为什么交点连线经过中间',
 value:'equal',options:[['equal','交点到两端的距离相等'],['look','只因为看起来居中']]}]};
const A=[2,5],B=[8,5],EPS=1e-9,clone=x=>structuredClone(x);
const near=(a,b)=>Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<EPS;
const length=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
function source(task,context){
 return isEvidenceContext(context)&&context.sessionId===SESSION&&context.index===0&&
  exact(task,Object.keys(TASK))&&same(task,TASK)&&
  matchesNativeEvidenceTask(task,context,{type:'x-s23-compass',nodeId:NODE});
}
function intersectionPoints(rA,rB){
 const d=6,x=(rA*rA-rB*rB+d*d)/(2*d),h2=rA*rA-x*x;
 if(!(rA>0&&rB>0&&rA<=6&&rB<=6)||h2<=EPS||
  d>=rA+rB||d<=Math.abs(rA-rB))return [];
 const h=Math.sqrt(h2);return [[A[0]+x,A[1]+h],[A[0]+x,A[1]-h]];
}
function rawReplay(task,model,context){
 try{
  if(!source(task,context)||!exact(model,Object.keys(native.initial(task,1)))||
   model.issue!==''||model.prose!==''||!Array.isArray(model.history)||
   model.history.length<2||model.history.length>24||!native.valid(task,model))return null;
  for(const [key,value] of Object.entries(native.fields(task))){
   if(!['center','radius','answers','prose'].includes(key)&&!same(model[key],value))return null;
  }
  if(!Array.isArray(model.answers)||model.answers.length!==1||
   !['','equal','look'].includes(model.answers[0]))return null;
  const b={first:{},circles:{},marked:[],finished:false,measured:false,lastArc:null};
  const events=[],arcs=[],marks=[];
  for(const [step,e] of model.history.entries()){
   if(!exact(e,['a','f','d'])||!['arc','meet','line'].includes(e.a))return null;
   if(e.a==='arc'){
    if(!exact(e.f,['center','radius'])||!exact(e.d,[])||
     !['A','B'].includes(e.f.center)||typeof e.f.radius!=='string'||
     !e.f.radius.trim()||b.finished)return null;
    const r=Number(e.f.radius);
    if(!Number.isFinite(r)||r<=0||r>6)return null;
    if(!Object.hasOwn(b.first,'arc'))b.first.arc=clone(e.f);
    b.circles[e.f.center]=r;b.marked=[];b.finished=false;b.measured=false;
    b.lastArc={center:e.f.center,radius:e.f.radius};
    arcs.push({step,center:e.f.center,radius:r});
   }else if(e.a==='meet'){
    if(!exact(e.f,[])||!exact(e.d,['index'])||
     typeof e.d.index!=='string'||!(/^[01]$/).test(e.d.index)||
     b.finished||intersectionPoints(b.circles.A,b.circles.B).length!==2)return null;
    if(!Object.hasOwn(b.first,'meet'))b.first.meet={};
    const i=Number(e.d.index),at=b.marked.indexOf(i);
    if(at===-1)b.marked.push(i);else b.marked.splice(at,1);
    marks.push({step,index:i});
   }else{
    if(!exact(e.f,[])||!exact(e.d,[])||b.finished||
     !near(b.circles.A,b.circles.B)||!(b.circles.A>3)||
     b.marked.length!==2||!b.marked.includes(0)||!b.marked.includes(1))return null;
    if(!Object.hasOwn(b.first,'line'))b.first.line={};
    b.finished=true;
   }
   events.push({step,action:e.a,fields:clone(e.f),data:clone(e.d)});
  }
  if(!same(model.board,b)||b.measured||!b.lastArc||
   model.center!==b.lastArc.center||model.radius!==b.lastArc.radius)return null;
  return {board:b,events,arcs,marks};
 }catch{return null;}
}
export function nativeCompassBisectorBinding(task,context={}){
 return source(task,context)?{kind:'native-compass-perpendicular-bisector',
  originalPosition:SESSION+':0',sourceNodeId:NODE,originalTaskSha256:HASH,
  originalControls:['g23-arc','g23-meet','g23-line'],
  strictAApproved:false}:null;
}
export function replayNativeCompassBisectorEvidence(task,model,context={}){
 const raw=rawReplay(task,model,context);
 if(!raw||!raw.board.finished||raw.board.circles.A!==raw.board.circles.B||
  !same([...raw.board.marked].sort(),[0,1])||
  model.answers[0]!=='equal'||native.inspect(task,model).correct!==true)return null;
 const radius=raw.board.circles.A,h=Math.sqrt(radius*radius-9);
 const upper=[5,5+h],lower=[5,5-h],middle=[5,5];
 if(!(radius>3&&radius<=6&&h>0)||
  !near(length(upper,A),radius)||!near(length(upper,B),radius)||
  !near(length(lower,A),radius)||!near(length(lower,B),radius)||
  !near((upper[0]+lower[0])/2,middle[0])||
  !near((upper[1]+lower[1])/2,middle[1])||
  !near((A[0]+B[0])/2,middle[0])||
  !near((A[1]+B[1])/2,middle[1])||
  !near((lower[0]-upper[0])*(B[0]-A[0])+
   (lower[1]-upper[1])*(B[1]-A[1]),0))return null;
 return {kind:'native-compass-perpendicular-bisector',originalPosition:SESSION+':0',
  sourceNodeId:NODE,originalTaskSha256:HASH,
  originalHistoryReplayed:true,originalControlEvents:raw.events,
  originalArcCount:raw.arcs.length,originalMarkCount:raw.marks.length,
  independentGeometry:{endpoints:[A,B],midpoint:middle,arcRadius:radius,
   intersections:[upper,lower],distanceFromEachEndpoint:radius,
   bisectorLength:length(upper,lower),perpendicularDotProduct:0,
   equalRadiusAndDistanceProved:true,perpendicularAtMidpoint:true},
  originalQuestionAnswerCorrect:true,
  physicalCompassOrRulerSkillAssessed:false,freeTextMeaningAssessed:false,
  fieldEditTimelinePersisted:false,longTermMasteryAssessed:false,
  strictAApproved:false};
}
export function submittedNativeCompassBisectorEvidence(task,model,record,context={}){
 try{
  const proof=replayNativeCompassBisectorEvidence(task,model,context),
   good=rawReplay(task,model,context);
  if(!proof||!good||!latestSubmissionMatches(model,record)||
   record.attempts.length!==2)return null;
  const wrong=record.attempts[0].value,bad=rawReplay(task,wrong,context);
  if(!bad||bad.board.finished||bad.board.measured||
   near(bad.board.circles.A,bad.board.circles.B)||
   !same(bad.board.marked,[0])||
   !same(wrong.history,model.history.slice(0,wrong.history.length))||
   !same(wrong.board.first.arc,model.board.first.arc)||
   wrong.seed!==model.seed||native.inspect(task,wrong).correct!==false||
   good.arcs.length<3||good.marks.length<3||
   !good.arcs.some((v,i)=>i>1&&v.center==='B'&&near(v.radius,good.board.circles.A)))
   return null;
  return {...proof,originalCheckSnapshotsObserved:2,
   wrongToCorrectEqualRadiusAndBisectorObserved:true};
 }catch{return null;}
}
