// #342 P007k: bounded original circle construction and C / diameter = pi relation.
// Source locked, development-only. Original math grader, records and UI unchanged.
import * as native from './phase5/b23-model.js';
import {isEvidenceContext,matchesNativeEvidenceTask,latestSubmissionMatches,hasExactKeys as exact,sameEvidence as same} from './evidence-contract.js';
const NODE='mt_DNYQLahbfa',SESSION='shapefacts',INDEX=2,HASH='bc230723f50cd5fc792097e4690916ea1b6c9cb2935c042f40005569f0d3c825';
const TASK={"type":"x-s23-circle","prompt":"画一个半径4.5厘米的圆，再画直径与圆周。","radius":4.5,"questions":[{"label":"直径多少厘米","value":9},{"label":"圆周长与直径","value":"pi","options":[["pi","圆周长等于直径乘π"],["twice","圆周长等于直径乘2"]]}]},EPS=1e-8,clone=x=>structuredClone(x);
const near=(a,b)=>Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<EPS;
function source(t,ctx){return isEvidenceContext(ctx)&&ctx.sessionId===SESSION&&ctx.index===INDEX&&
 exact(t,Object.keys(TASK))&&same(t,TASK)&&matchesNativeEvidenceTask(t,ctx,{type:TASK.type,nodeId:NODE});}
function raw(t,m,ctx,wrong=false){
 try{
 if(!source(t,ctx)||!exact(m,Object.keys(native.initial(t,1)))||
 m.issue!==''||m.prose!==''||!native.valid(t,m)||m.history.length!==(wrong?4:8))return null;
 for(const [k,v] of Object.entries(native.fields(t)))
  if(!['radius','answers','prose'].includes(k)&&!same(m[k],v))return null;
 const b={first:{},radius:null,radial:false,diameter:false,rim:false,turns:0};
 for(let i=0;i<m.history.length;i++){
  const e=m.history[i],a=['circle','radial','diameter','rim'][i%4];
  if(!exact(e,['a','f','d'])||e.a!==a||!exact(e.f,a==='circle'?['radius']:[])||
    !exact(e.d,[]))return null;
  b.first[e.a]??=clone(e.f);
  if(a==='circle'){
   const r=Number(e.f.radius);
   if(typeof e.f.radius!=='string'||!e.f.radius.trim()||!near(r,i===0?5.5:4.5))return null;
   b.radius=r;b.radial=false;b.diameter=false;b.rim=false;b.turns=0;
  }else b[a]=true;
 }
 if(!same(m.board,b)||!near(Number(m.radius),b.radius))return null;
 if(wrong){if(!near(b.radius,5.5))return null;}
 else if(!near(b.radius,4.5)||!same(m.answers,['9','pi']))return null;
 return {board:b,events:clone(m.history)};
 }catch{return null;}
}
export function nativeCirclePiBinding(t,ctx={}){
 return source(t,ctx)?{kind:'native-circle-circumference-pi',
 originalPosition:'shapefacts:2',sourceNodeId:NODE,originalTaskSha256:HASH,
 originalControls:['g23-circle','g23-radial','g23-diameter','g23-rim'],strictAApproved:false}:null;
}
export function replayNativeCirclePiEvidence(t,m,ctx={}){
 const r=raw(t,m,ctx);if(!r||!native.inspect(t,m).correct)return null;
 const radius=r.board.radius,diameter=2*radius,circumference=Math.PI*diameter,area=Math.PI*radius*radius;
 if(!near(radius,4.5)||!near(diameter,9)||!near(circumference/diameter,Math.PI)||
 !near(area/(radius*radius),Math.PI)||!r.board.radial||!r.board.diameter||!r.board.rim)return null;
 return {kind:'native-circle-circumference-pi',originalPosition:'shapefacts:2',
  originalTaskSha256:HASH,sourceNodeId:NODE,originalHistoryReplayed:true,
  originalControlEvents:r.events,originalCircleDraws:2,
  independentGeometry:{radiusCm:radius,diameterCm:diameter,
   circumferenceCm:circumference,areaSquareCm:area,
   circumferenceToDiameterRatio:Math.PI,diameterToRadiusRatio:2,
   circleCenterDistanceInvariant:true},physicalCompassOrRulerSkillAssessed:false,
  freeTextMeaningAssessed:false,fieldEditTimelinePersisted:false,
  longTermMasteryAssessed:false,strictAApproved:false};
}
export function submittedNativeCirclePiEvidence(t,m,record,ctx={}){
 try{
 const p=replayNativeCirclePiEvidence(t,m,ctx),w=raw(t,record?.attempts?.[0]?.value,ctx,true);
 if(!p||!w||!latestSubmissionMatches(m,record)||record.attempts.length!==2||
  record.attempts[0].value.seed!==m.seed||
  !same(w.events,m.history.slice(0,4))||
  native.inspect(t,record.attempts[0].value).correct!==false)return null;
 return {...p,originalCheckSnapshotsObserved:2,wrongToCorrectCircleObserved:true};
 }catch{return null;}
}
