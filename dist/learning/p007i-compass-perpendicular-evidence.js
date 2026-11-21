// #342 P007i source-locked native compass perpendicular; development only, never formal A.
import * as native from './phase5/b23-model.js';
import {isEvidenceContext,matchesNativeEvidenceTask,latestSubmissionMatches,hasExactKeys as exact,sameEvidence as same} from './evidence-contract.js';
const SESSION='compasswork',NODE='mt_ZrsqGVG-Wt',HASH='1eebbac570ca690187b7b129b88c541663d8c12e9ebfe7b76c0e0ab01de11a9a',INDEX=2;
const TASK={"type":"x-s23-compass","prompt":"线外有一点。先用圆弧找出线上两个点，再以它们为圆心画同宽圆弧，连出垂线。","mode":"perpendicular","questions":[{"label":"垂线与原线夹角多少度","value":90}]};
const OPS=[{"a":"arc","f":{"center":"P","radius":"5"},"d":{}},{"a":"arc","f":{"center":"C","radius":"5"},"d":{}},{"a":"arc","f":{"center":"D","radius":"4"},"d":{}},{"a":"arc","f":{"center":"D","radius":"5"},"d":{}},{"a":"meet","f":{},"d":{"index":"1"}},{"a":"line","f":{},"d":{}}];
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
 else if(m.answers[0]!=='90'||!b.finished||b.measured!==false)return null;
 return {board:b,events:clone(m.history),kind:allowWrong?'wrong':'correct'};
 }catch{return null;}
}
function geometry(b){
 const r=b.circles.C,s=b.circles.D;
 if(!near(r,s)||r!==5||!same(b.marked,[1]))return null;
 const P=[5,8],C=[1,5],D=[9,5],Q=[5,2],foot=[5,5];
 if(!near(dist(P,C),5)||!near(dist(P,D),5)||!near(dist(C,Q),r)||
 !near(dist(D,Q),s)||!near((P[0]+Q[0])/2,foot[0])||
 !near((P[1]+Q[1])/2,foot[1])||
 !near((Q[0]-P[0])*(D[0]-C[0])+(Q[1]-P[1])*(D[1]-C[1]),0))return null;
 return {exteriorPoint:P,lineCenters:[C,D],arcIntersection:Q,footOnLine:foot,
  arcRadius:r,perpendicularDotProduct:0,perpendicularAtOriginalLine:true};
}
export function nativeCompassBinding(t,ctx={}){
 return source(t,ctx)?{kind:'native-compass-perpendicular',originalPosition:SESSION+':'+INDEX,
 sourceNodeId:NODE,originalTaskSha256:HASH,originalControls:['g23-arc','g23-meet','g23-line'],
 strictAApproved:false}:null;
}
export function replayNativeCompassEvidence(t,m,ctx={}){
 const proof=raw(t,m,ctx);
 if(!proof||!native.inspect(t,m).correct)return null;
 const independentGeometry=geometry(proof.board);if(!independentGeometry)return null;
 return {kind:'native-compass-perpendicular',originalPosition:SESSION+':'+INDEX,
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
  record.attempts[0].value.seed!==m.seed||!same(bad.events,m.history.slice(0,3))||
  native.inspect(t,record.attempts[0].value).correct!==false)return null;
 return {...p,originalCheckSnapshotsObserved:2,wrongToCorrectArcConstructionObserved:true};
 }catch{return null;}
}
