// #342 P007j: three source-locked native rectangle constructions and distinct inverse invariants.
// Development only; do not register formal strict A or infer physical ruler skill.
import * as native from './phase5/b23-model.js';
import {isEvidenceContext,matchesNativeEvidenceTask,latestSubmissionMatches,hasExactKeys as exact,sameEvidence as same} from './evidence-contract.js';
const SPECS=[{"sessionId":"rectanglefacts","index":0,"nodeId":"mt_KFKUR_gBg_","sha":"51525557b3ab785b3a256fc25dd26a594c233e27f89c4022977b9e01d3f4703b","prompt":"一边8厘米，周长28厘米。先想另一边，再画出长方形。","w":8,"h":6,"questions":[{"label":"另一边多少厘米","value":6}],"inference":"perimeter"},{"sessionId":"rectanglefacts","index":1,"nodeId":"mt_KFKUR_gBg_","sha":"5ead1dacb723f7815f8644c3ca88a37f9441430aa415fe830d521b54b5a097e0","prompt":"画长7厘米、宽3厘米的长方形，看看每个角。","w":7,"h":3,"questions":[{"label":"每个角多少度","value":90}],"inference":"right-angles"},{"sessionId":"rectanglefacts","index":2,"nodeId":"mt_KFKUR_gBg_","sha":"0426eaa9e4788cbcddee61834514a651dbb9bc068f45e3fc9f3abf3b7e856110","prompt":"一边6厘米，面积24平方厘米。先找另一边，再画出来。","w":6,"h":4,"questions":[{"label":"另一边多少厘米","value":4},{"label":"周长多少厘米","value":20}],"inference":"area"}],clone=x=>structuredClone(x),EPS=1e-9;
const near=(a,b)=>Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<EPS;
function source(task,ctx){
 if(!isEvidenceContext(ctx)||ctx.sessionId!=='rectanglefacts')return null;
 const s=SPECS.find(x=>x.index===ctx.index);if(!s)return null;
 const expected={type:'x-s23-ruler',prompt:s.prompt,mode:'rectangle',
  target:[s.w,s.h],questions:s.questions};
 return exact(task,Object.keys(expected))&&same(task,expected)&&
  matchesNativeEvidenceTask(task,ctx,{type:'x-s23-ruler',nodeId:s.nodeId})?s:null;
}
function raw(task,model,ctx,wrong=false){
 try{
 const s=source(task,ctx),needed=wrong?1:2;
 if(!s||!exact(model,Object.keys(native.initial(task,1)))||
  model.issue!==''||model.prose!==''||!native.valid(task,model)||
  !Array.isArray(model.history)||model.history.length!==needed)return null;
 for(const [k,v] of Object.entries(native.fields(task)))
  if(!['first','second','answers','prose'].includes(k)&&!same(model[k],v))return null;
 const b={first:{},drawing:null},events=[];
 for(let i=0;i<needed;i++){
  const e=model.history[i];
  if(!exact(e,['a','f','d'])||e.a!=='draw'||!exact(e.f,['first','second','angle'])||
   !exact(e.d,[])||e.f.angle!==''||!['first','second'].every(k=>typeof e.f[k]==='string'&&e.f[k].trim()))return null;
  const w=Number(e.f.first),h=Number(e.f.second);
  if(!Number.isFinite(w)||!Number.isFinite(h)||w<=0||h<=0||w>10||h>10)return null;
  b.first.draw??=clone(e.f);
  b.drawing={first:e.f.first,second:e.f.second,angle:'',points:[[0,0],[w,0],[w,h],[0,h]]};
  events.push(clone(e));
 }
 if(!same(model.board,b)||model.first!==b.drawing.first||
  model.second!==b.drawing.second||model.angle!=='')return null;
 if(wrong){if(!near(Number(b.drawing.first),s.w-1)||!near(Number(b.drawing.second),s.h))return null;}
 else if(!near(Number(b.drawing.first),s.w)||!near(Number(b.drawing.second),s.h)||
  !same(model.answers,s.questions.map(q=>String(q.value))))return null;
 return {s,b,events};
 }catch{return null;}
}
function geometry(w,h,kind){
 const vertices=[[0,0],[w,0],[w,h],[0,h]];
 const vs=vertices.map((p,i)=>[vertices[(i+1)%4][0]-p[0],vertices[(i+1)%4][1]-p[1]]);
 const lengths=vs.map(v=>Math.hypot(...v));
 const adjacentDot=vs.map((v,i)=>v[0]*vs[(i+1)%4][0]+v[1]*vs[(i+1)%4][1]);
 const area=Math.abs(vs[0][0]*vs[1][1]-vs[0][1]*vs[1][0]),perimeter=lengths.reduce((a,b)=>a+b,0);
 if(!near(lengths[0],lengths[2])||!near(lengths[1],lengths[3])||
  !adjacentDot.every(x=>near(x,0))||!near(area,w*h)||!near(perimeter,2*(w+h)))return null;
 if(kind==='perimeter'&&!near(perimeter,28))return null;
 if(kind==='area'&&!near(area,24))return null;
 return {vertices,sidesCm:lengths,rightAnglesDegrees:[90,90,90,90],
  areaSquareCm:area,perimeterCm:perimeter,
  inferredMissingSideCm:kind==='perimeter'?perimeter/2-w:kind==='area'?area/w:h,
  closedRectangleWithEqualOppositeSides:true};
}
export function nativeRectangleBinding(task,ctx={}){
 const s=source(task,ctx);return s?{kind:'native-rectangle-dimensions',
  originalPosition:s.sessionId+':'+s.index,sourceNodeId:s.nodeId,originalTaskSha256:s.sha,
  originalControls:['g23-draw'],strictAApproved:false}:null;
}
export function replayNativeRectangleEvidence(task,model,ctx={}){
 const p=raw(task,model,ctx);if(!p||!native.inspect(task,model).correct)return null;
 const geo=geometry(p.s.w,p.s.h,p.s.inference);
 if(!geo||!near(geo.inferredMissingSideCm,p.s.h))return null;
 return {kind:'native-rectangle-dimensions',
  originalPosition:p.s.sessionId+':'+p.s.index,sourceNodeId:p.s.nodeId,
  originalTaskSha256:p.s.sha,originalDraws:p.events.length,
  originalHistoryReplayed:true,originalControlEvents:p.events,
  independentGeometry:geo,inferenceContract:p.s.inference,
  physicalRulerSkillAssessed:false,fieldEditTimelinePersisted:false,
  freeTextMeaningAssessed:false,longTermMasteryAssessed:false,strictAApproved:false};
}
export function submittedNativeRectangleEvidence(task,model,record,ctx={}){
 try{
  const p=replayNativeRectangleEvidence(task,model,ctx),wrong=raw(task,record?.attempts?.[0]?.value,ctx,true);
  if(!p||!wrong||!latestSubmissionMatches(model,record)||record.attempts.length!==2||
   record.attempts[0].value.seed!==model.seed||
   !same(wrong.events,model.history.slice(0,wrong.events.length))||
   native.inspect(task,record.attempts[0].value).correct!==false)return null;
  return {...p,originalCheckSnapshotsObserved:2,wrongToCorrectNativeDrawObserved:true};
 }catch{return null;}
}
