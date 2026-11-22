// #342 P004g: original five- and six-vertex B23 polygon construction.
// Candidate-only independent integer geometry and replay; no strict-A registration.
import * as native from './phase5/b23-model.js';
import {isEvidenceContext,matchesNativeEvidenceTask,
  latestSubmissionMatches,hasExactKeys as keys,sameEvidence as same}
  from './evidence-contract.js';

const CASES=Object.freeze({
  'shapedraw:2':{node:'mt_vJUa62bxeR',n:5},
  'shapedraw:3':{node:'mt_vJUa62bxeR',n:6},
  'shapesides:0':{node:'mt_zuOGOGFAKb',n:5}
});
function source(task,context){
  if(!isEvidenceContext(context))return null;
  const entry=CASES[context.sessionId+':'+context.index];
  if(!entry||!matchesNativeEvidenceTask(task,context,
    {type:'x-s23-polygon',nodeId:entry.node})||
    !keys(task,['type','prompt','n','kind','questions'])||
    task.kind!=='any'||task.n!==entry.n||
    !Array.isArray(task.questions)||task.questions.length!==1||
    !keys(task.questions[0],['label','value'])||
    task.questions[0].value!==entry.n)return null;
  return entry;
}
const point=i=>[i%7,Math.floor(i/7)];
const orient=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-
  (b[1]-a[1])*(c[0]-a[0]);
const between=(a,b,c)=>orient(a,b,c)===0&&
  c[0]>=Math.min(a[0],b[0])&&c[0]<=Math.max(a[0],b[0])&&
  c[1]>=Math.min(a[1],b[1])&&c[1]<=Math.max(a[1],b[1]);
function intersects(a,b,c,d){
  const x=orient(a,b,c),y=orient(a,b,d);
  const z=orient(c,d,a),w=orient(c,d,b);
  return (x*y<0&&z*w<0)||between(a,b,c)||between(a,b,d)||
    between(c,d,a)||between(c,d,b);
}
function independentPolygon(indices,n){
  if(!Array.isArray(indices)||indices.length!==n||
    !indices.every(i=>Number.isInteger(i)&&i>=0&&i<49)||
    new Set(indices).size!==n)return null;
  const p=indices.map(point);
  const sides=p.map((v,i)=>{
    const w=p[(i+1)%n];
    return [w[0]-v[0],w[1]-v[1]];
  });
  if(sides.some(v=>v[0]===0&&v[1]===0)||
    p.some((v,i)=>orient(p[(i+n-1)%n],v,p[(i+1)%n])===0))
    return null;
  for(let i=0;i<n;i++)for(let j=i+1;j<n;j++){
    if(j===i+1||(i===0&&j===n-1))continue;
    if(intersects(p[i],p[(i+1)%n],p[j],p[(j+1)%n]))return null;
  }
  const twice=p.reduce((sum,v,i)=>
    sum+v[0]*p[(i+1)%n][1]-v[1]*p[(i+1)%n][0],0);
  if(twice===0)return null;
  return {vertices:p,vertexCount:n,edgeCount:n,
    edgeLengthsSquared:sides.map(v=>v[0]*v[0]+v[1]*v[1]),
    signedDoubleArea:twice,absoluteDoubleArea:Math.abs(twice),
    closed:true,nonSelfIntersecting:true,straightEdges:true};
}
const isIndex=s=>typeof s==='string'&&/^(0|[1-9][0-9]*)$/.test(s)&&
  Number.isSafeInteger(Number(s))&&Number(s)<49;
export function nativePolygonBinding(task,context={}){
  const t=source(task,context);
  return t?{nodeId:t.node,kind:'native-polygon-vertex-count',n:t.n}:null;
}
export function replayNativePolygonEvidence(task,model,context={}){
  try{
    const t=source(task,context);
    if(!t||!keys(model,Object.keys(native.initial(task,1)))||
      !keys(model.board,['first','points','closed'])||
      !Array.isArray(model.history)||model.history.length<t.n+1||
      Object.keys(model.history).length!==model.history.length||
      model.issue!==''||!model.board.closed||
      !same(model.answers,task.questions.map(q=>String(q.value)))||
      !native.valid(task,model)||!native.inspect(task,model).correct)
      return null;
    const points=[],events=[];let closed=false,validCloses=0,adds=0;
    for(const [step,e] of model.history.entries()){
      if(!keys(e,['a','d','f'])||!keys(e.f,[]))return null;
      if(e.a==='add'){
        if(!keys(e.d,['index'])||!isIndex(e.d.index))return null;
        const index=Number(e.d.index);
        if(closed||points.length>=t.n||points.includes(index))return null;
        points.push(index);adds++;
        events.push({step,action:'add',pointIndex:index});
      }else if(e.a==='undo'){
        if(!keys(e.d,[])||!points.length)return null;
        const removed=points.pop();closed=false;
        events.push({step,action:'undo',removedPointIndex:removed});
      }else if(e.a==='close'){
        if(!keys(e.d,[]))return null;
        const accepted=!!independentPolygon(points,t.n);
        if(accepted){closed=true;validCloses++;}
        events.push({step,action:'close',geometryAccepted:accepted});
      }else if(e.a==='reset'){
        if(!keys(e.d,[]))return null;
        points.length=0;closed=false;
        events.push({step,action:'reset'});
      }else return null;
    }
    const g=independentPolygon(points,t.n);
    if(!closed||!validCloses||adds<t.n||!g||
      !same(points,model.board.points)||model.board.closed!==closed)
      return null;
    return {kind:'native-polygon-vertex-count',nodeId:t.node,
      sessionId:context.sessionId,index:context.index,
      originalPointIndices:[...points],independentGeometry:g,
      originalControlEvents:events,
      observedPointSelectionUndoAndClosure:true,
      observedOriginalTaskAnswer:true,
      physicalDrawingObserved:false,verbalProofObserved:false,
      generalMasteryAssessed:false,strictAApproved:false};
  }catch{return null;}
}
export function submittedNativePolygonEvidence(task,model,record,context={}){
  return latestSubmissionMatches(model,record)?
    replayNativePolygonEvidence(task,model,context):null;
}
