// #342 P007h source-locked native compass angle; development only, never formal A.
import * as native from './phase5/b23-model.js';
import {isEvidenceContext,matchesNativeEvidenceTask,latestSubmissionMatches,hasExactKeys as exact,sameEvidence as same} from './evidence-contract.js';
const SESSION='compasswork',NODE='mt_ZrsqGVG-Wt',HASH='afc67970d24d820a8a7cedabd17eebeee81d46dbf74999cb27496b36bd029579',INDEX=1;
const TASK={"type":"x-s23-compass","prompt":"先从角的顶点画圆弧，得到两边上同样远的点；再画同宽的两段弧，连到角顶点。","mode":"angle","questions":[{"label":"90°被平分后每份多少度","value":45}]};
const OPS=[{"a":"arc","f":{"center":"O","radius":"2"},"d":{}},{"a":"arc","f":{"center":"C","radius":"2"},"d":{}},{"a":"arc","f":{"center":"D","radius":"3"},"d":{}},{"a":"arc","f":{"center":"D","radius":"2"},"d":{}},{"a":"meet","f":{},"d":{"index":"1"}},{"a":"line","f":{},"d":{}},{"a":"measure","f":{},"d":{}}];
const clone=x=>structuredClone(x),eps=1e-8,near=(a,b)=>Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<eps;
const dist=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
function source(t,ctx){return isEvidenceContext(ctx)&&ctx.sessionId===SESSION&&ctx.index===INDEX&&
 exact(t,Object.keys(TASK))&&same(t,TASK)&&matchesNativeEvidenceTask(t,ctx,{type:TASK.type,nodeId:NODE});}
function raw(t,m,ctx,allowWrong=false){
 try{
 if(!source(t,ctx)||!exact(m,Object.keys(native.initial(t,1)))||m.issue!==''||m.prose!==''||
 !Array.isArray(m.history)||!native.valid(t,m))return null;
 for(const [k,v] of Object.entries(native.fields(t)))if(!['center','radius','answers','prose'].includes(k)&&!same(m[k],v))return null;
 const count=allowWrong?3:OPS.length;
 if(m.history.length!==count||!Array.isArray(m.answers)||m.answers.length!==1)return null;
 const b={first:{},circles:{},marked:[],finished:false,measured:false,lastArc:null};
 for(let i=0;i<count;i++){
  const e=m.history[i],want=OPS[i];
  if(!exact(e,['a','f','d'])||e.a!==want.a||!exact(e.f,Object.keys(want.f))||
   !exact(e.d,Object.keys(want.d))||!same(e.f,want.f)||!same(e.d,want.d))return null;
  b.first[e.a]??=clone(e.f);
  if(e.a==='arc'){b.circles[e.f.center]=Number(e.f.radius);b.marked=[];
   b.finished=false;b.measured=false;b.lastArc={center:e.f.center,radius:e.f.radius};
   if(e.f.center==='O'||e.f.center==='P'){delete b.circles.C;delete b.circles.D;}}
  if(e.a==='meet'){b.marked=[Number(e.d.index)];b.finished=false;b.measured=false;}
  if(e.a==='line')b.finished=true;
  if(e.a==='measure')b.measured=true;
 }
 if(!same(m.board,b)||m.center!==b.lastArc.center||m.radius!==b.lastArc.radius)return null;
 if(allowWrong){if(m.answers[0]!==''||b.finished)return null;}
 else if(m.answers[0]!=='45'||!b.finished||b.measured!==true)return null;
 return {board:b,events:clone(m.history),kind:allowWrong?'wrong':'correct'};
 }catch{return null;}
}
function geometry(b){
 const r=b.circles.C,s=b.circles.D;
 if(!near(r,s)||r!==2||!same(b.marked,[1]))return null;
 const O=[2,2],C=[4,2],D=[2,4],Q=[4,4];const step=[Q[0]-O[0],Q[1]-O[1]];
 if(!near(dist(C,Q),r)||!near(dist(D,Q),s)||!near(dist(O,C),2)||!near(dist(O,D),2)||
 !near(step[0],step[1])||!(step[0]>0))return null;
 return {origin:O,rayCenters:[C,D],arcIntersection:Q,arcRadius:r,
  halfAnglesDegrees:[Math.atan2(step[1],step[0])*180/Math.PI,90-Math.atan2(step[1],step[0])*180/Math.PI],
  equalRayAngles:true};
}
export function nativeCompassBinding(t,ctx={}){
 return source(t,ctx)?{kind:'native-compass-angle',originalPosition:SESSION+':'+INDEX,
 sourceNodeId:NODE,originalTaskSha256:HASH,originalControls:['g23-arc','g23-meet','g23-line','g23-measure'],
 strictAApproved:false}:null;
}
export function replayNativeCompassEvidence(t,m,ctx={}){
 const proof=raw(t,m,ctx);
 if(!proof||!native.inspect(t,m).correct)return null;
 const independentGeometry=geometry(proof.board);if(!independentGeometry)return null;
 return {kind:'native-compass-angle',originalPosition:SESSION+':'+INDEX,
 sourceNodeId:NODE,originalTaskSha256:HASH,originalHistoryReplayed:true,
 originalControlEvents:proof.events,originalArcCount:4,originalMarkedIntersections:1,
 independentGeometry,physicalCompassOrRulerSkillAssessed:false,
 freeTextMeaningAssessed:false,fieldEditTimelinePersisted:false,
 longTermMasteryAssessed:false,strictAApproved:false};
}
export function submittedNativeCompassEvidence(t,m,record,ctx={}){
 try{
 const p=replayNativeCompassEvidence(t,m,ctx),bad=raw(t,record?.attempts?.[0]?.value,ctx,true);
 if(!p||!bad||!latestSubmissionMatches(m,record)||record.attempts.length!==2||
  bad.seed!==m.seed||!same(bad.events,m.history.slice(0,3))||
  native.inspect(t,record.attempts[0].value).correct!==false)return null;
 return {...p,originalCheckSnapshotsObserved:2,wrongToCorrectArcConstructionObserved:true};
 }catch{return null;}
}
