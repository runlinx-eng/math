// #342 P007n: native B25 triangle asa independently replayed from actual events.
 // No shared registry, original task/grader/State-v2 or physical tool assessments changed.
 import * as native from './phase5/b25-model.js';
 import {isEvidenceContext,matchesNativeEvidenceTask,latestSubmissionMatches,
 hasExactKeys as exact,sameEvidence as same} from './evidence-contract.js';
 const SPECS=[{"sessionId":"triangledraw","index":2,"nodeId":"mt_Jf8xcX4UTq","sha":"97dac8caa523064fba09be4f7e14cfb3e0b66a18028bae7d08e671b46238e357","prompt":"底边7厘米，两端的角分别是50°和60°。放出射线并找交点。","mode":"asa","target":{"base":7,"angle":50,"other":60},"chooseCount":1,"questions":[{"label":"第三个角是多少度","value":70}]},{"sessionId":"trianglecongruent","index":2,"nodeId":"mt_167X6Ax8P7","sha":"e861d76f1bf70dfb609609121750a2658e3c601b1c992f78a1488ce20562f5eb","prompt":"底边7厘米，两端的角是50°和60°。","mode":"asa","target":{"base":7,"angle":50,"other":60},"chooseCount":1,"questions":[{"label":"第三个角是多少度","value":70},{"label":"△ABC与△DEF对应时","value":"order","options":[["order","A对应D，B对应E，C对应F"],["reverse","A一定对应F"]]}]}],EPS=1e-7,clone=x=>structuredClone(x);
 const near=(a,b)=>Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<EPS;
 const rad=d=>d*Math.PI/180,dist=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
 function source(t,ctx){
  if(!isEvidenceContext(ctx))return null;
  const s=SPECS.find(x=>x.sessionId===ctx.sessionId&&x.index===ctx.index);
  if(!s)return null;
  const expected={type:'x-g25-triangle',prompt:s.prompt,mode:s.mode,target:s.target,
   chooseCount:s.chooseCount,questions:s.questions};
  return exact(t,Object.keys(expected))&&same(t,expected)&&
   matchesNativeEvidenceTask(t,ctx,{type:'x-g25-triangle',nodeId:s.nodeId})?s:null;
 }
 // Independent analytic constructors, without calling B25's construction functions.
 function independentPoints(mode,b){
  const d=b.base;if(!(d>0))return[];
  if(mode==='sas'){
   if(!(b.a>0&&b.angle>0&&b.angle<180))return[];
   return [[b.a*Math.cos(rad(b.angle)),b.a*Math.sin(rad(b.angle))]];
  }
  if(mode==='asa'){
   if(!(b.angle>0&&b.other>0&&b.angle+b.other<180))return[];
   const h=d*Math.sin(rad(b.other))/Math.sin(rad(180-b.angle-b.other));
   return [[h*Math.cos(rad(b.angle)),h*Math.sin(rad(b.angle))]];
  }
  if(mode==='sss'){
   const r=b.a,s=b.b;if(!(r>0&&s>0)||d>r+s+1e-8||d<Math.abs(r-s)-1e-8)return[];
   const x=(r*r-s*s+d*d)/(2*d),h2=r*r-x*x;
   if(h2< -1e-8)return[];
   const h=Math.sqrt(Math.max(0,h2));return h<1e-8?[[x,h]]:[[x,h],[x,-h]];
  }
  if(mode==='ssa'){
   const r=b.b,a=b.angle;if(!(r>0&&a>0&&a<180))return[];
   const co=Math.cos(rad(a)),si=Math.sin(rad(a)),v=r*r-d*d*si*si;
   if(v< -1e-8)return[];
   const z=Math.sqrt(Math.max(0,v)),xs=[d*co-z,d*co+z];
   return xs.filter((x,i)=>x>1e-8&&(i===0||Math.abs(x-xs[0])>=1e-8))
    .map(x=>[x*co,x*si]);
  }
  return[];
 }
 function equalPoints(a,b){
  return Array.isArray(a)&&Array.isArray(b)&&a.length===b.length&&
   a.every((p,i)=>Array.isArray(p)&&Array.isArray(b[i])&&p.length===2&&
    p.every((x,j)=>near(x,b[i][j])));
 }
 function raw(task,model,ctx){
  try{
   const s=source(task,ctx);
   if(!s||!exact(model,Object.keys(native.initial(task,1)))||
     model.issue!==''||model.prose!==''||!native.valid(task,model)||
     !Array.isArray(model.history)||model.history.length>35)return null;
   const used=Object.keys(s.target);
   for(const [k,v] of Object.entries(native.fields(task))){
    if(k==='answers'||k==='prose'||used.includes(k))continue;
    if(!same(model[k],v))return null;
   }
   const b={first:{},base:null,a:null,b:null,angle:null,other:null,
    constructed:false,points:[],chosen:[],finished:false};
   let built=0,finished=0;
   for(const e of model.history){
    if(!exact(e,['a','f','d'])||!['base','a','b','angle','other','construct','choose','finish'].includes(e.a))return null;
    const isField=['base','a','b','angle','other'].includes(e.a);
    if(!exact(e.f,isField?[e.a]:[])||!exact(e.d,e.a==='choose'?['index']:[]))return null;
    b.first[e.a]??=clone(e.f);
    if(isField){
     if(!used.includes(e.a)||typeof e.f[e.a]!=='string'||!e.f[e.a].trim())return null;
     const v=Number(e.f[e.a]),isAngle=['angle','other'].includes(e.a);
     if(!Number.isFinite(v)||v<=0||v>=(isAngle?180:12.00000001))return null;
     b[e.a]=v;b.constructed=false;b.points=[];b.chosen=[];b.finished=false;
    }else if(e.a==='construct'){
     if(!(b.base>0)||used.some(k=>!(b[k]>0)))return null;
     b.points=independentPoints(s.mode,b);b.chosen=[];b.constructed=true;b.finished=false;built++;
    }else if(e.a==='choose'){
     if(!b.constructed||!/^(0|[1-9][0-9]*)$/.test(e.d.index))return null;
     const i=Number(e.d.index);
     if(i>=b.points.length||!(Math.abs(b.points[i][1])>1e-7))return null;
     const at=b.chosen.indexOf(i);
     if(at<0)b.chosen.push(i);else b.chosen.splice(at,1);
     b.finished=false;
    }else{
     if(!b.constructed)return null;
     b.finished=true;finished++;
    }
   }
   if(!same(model.board.first,b.first)||!['base','a','b','angle','other','constructed','finished','chosen'].every(
    k=>typeof b[k]==='number'?near(model.board[k],b[k]):same(model.board[k],b[k]))||
    !equalPoints(model.board.points,b.points)||
    !used.every(k=>model[k]===String(b[k])))return null;
   return {s,b,built,finished,events:clone(model.history)};
  }catch{return null;}
 }
 function geometry(s,b){
  const A=[0,0],B=[s.target.base,0],ps=independentPoints(s.mode,s.target);
  const usable=ps.filter(p=>Math.abs(p[1])>1e-7);
  if(usable.length< s.chooseCount||!equalPoints(ps,b.points)||
   b.chosen.length!==s.chooseCount||
   !b.chosen.every(i=>ps[i]&&Math.abs(ps[i][1])>1e-7))return null;
  for(const p of usable){
   const x=dist(A,p),y=dist(B,p);
   if(s.mode==='sas'&&(!near(x,s.target.a)||
     !near(y*y,s.target.base**2+s.target.a**2-2*s.target.base*s.target.a*Math.cos(rad(s.target.angle)))))return null;
   if(s.mode==='sss'&&(!near(x,s.target.a)||!near(y,s.target.b)))return null;
   if(s.mode==='ssa'&&(!near(y,s.target.b)||!near(Math.atan2(p[1],p[0])*180/Math.PI,s.target.angle)))return null;
   if(s.mode==='asa'&&(!near(Math.atan2(p[1],p[0])*180/Math.PI,s.target.angle)||
     !near(Math.atan2(p[1],s.target.base-p[0])*180/Math.PI,s.target.other)))return null;
  }
  const area=usable.map(p=>Math.abs(s.target.base*p[1])/2);
  const third=s.mode==='asa'?180-s.target.angle-s.target.other:null;
  if(s.mode==='sss'){
   const [d,r,other]=[s.target.base,s.target.a,s.target.b];
   if((s.chooseCount===0)!==(d>=r+other||d<=Math.abs(r-other)))return null;
  }
  if(s.mode==='ssa'){
   if(ps.length!==2||!near(dist(ps[0],B),dist(ps[1],B))||
    near(dist(A,ps[0]),dist(A,ps[1])))return null;
  }
  return {baseCm:s.target.base,independentlyConstructedPoints:ps,
   distinctNondegeneratePoints:usable.length,chosenCount:s.chooseCount,
   triangleAreasSquareCm:area,thirdAngleDegrees:third,
   threeSideInequalityChecked:s.mode==='sss',nonIncludedAngleAmbiguity:s.mode==='ssa',
   includedAngleUnique:s.mode==='sas'||s.mode==='asa'};
 }
 export function nativeTriangleBinding(task,ctx={}){
  const s=source(task,ctx);return s?{kind:'native-triangle-asa',
   originalPosition:s.sessionId+':'+s.index,sourceNodeId:s.nodeId,
   originalTaskSha256:s.sha,originalControls:['g25-construct','g25-finish'],
   strictAApproved:false}:null;
 }
 export function replayNativeTriangleEvidence(task,model,ctx={}){
  const p=raw(task,model,ctx);
  if(!p||p.built!==2||p.finished!==2||!p.b.finished||
   !Object.entries(p.s.target).every(([k,v])=>near(p.b[k],v))||
   !same(model.answers,p.s.questions.map(q=>String(q.value)))||
   !native.inspect(task,model).correct)return null;
  const firstBase=p.events.find(e=>e.a==='base')?.f.base;
  if(!near(Number(firstBase),p.s.target.base-1))return null;
  const independentGeometry=geometry(p.s,p.b);if(!independentGeometry)return null;
  return {kind:'native-triangle-asa',originalPosition:p.s.sessionId+':'+p.s.index,
   sourceNodeId:p.s.nodeId,originalTaskSha256:p.s.sha,originalHistoryReplayed:true,
   originalControlEvents:p.events,originalConstructCount:p.built,originalFinishCount:p.finished,
   independentGeometry,physicalRulerOrCompassSkillAssessed:false,
   freeTextMeaningAssessed:false,fieldEditTimelinePersisted:false,longTermMasteryAssessed:false,
   strictAApproved:false};
 }
 export function submittedNativeTriangleEvidence(task,model,record,ctx={}){
  try{
   const p=replayNativeTriangleEvidence(task,model,ctx),
    wrong=raw(task,record?.attempts?.[0]?.value,ctx);
   if(!p||!wrong||!latestSubmissionMatches(model,record)||
    record.attempts.length!==2||wrong.built!==1||wrong.finished!==1||
    wrong.s.chooseCount!==p.independentGeometry.chosenCount||
    record.attempts[0].value.seed!==model.seed||
    !same(wrong.events,model.history.slice(0,wrong.events.length))||
    !near(wrong.b.base,wrong.s.target.base-1)||
    native.inspect(task,record.attempts[0].value).correct!==false)return null;
   return {...p,originalCheckSnapshotsObserved:2,
    wrongToCorrectOriginalConstructionObserved:true};
  }catch{return null;}
 }
