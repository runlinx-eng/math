// #342 / P004f: three exact native B23 four-point quadrilateral constructions.
// Independent development replay; not a strict-A registration or original grader change.
import * as native from './phase5/b23-model.js';
import {isEvidenceContext,matchesNativeEvidenceTask,
  latestSubmissionMatches,hasExactKeys as keys,sameEvidence as same}
  from './evidence-contract.js';

const CASES=Object.freeze({
  'shapeframe:1':{node:'mt_2VR963szuk',kind:'rectangle'},
  'shapedraw:1':{node:'mt_vJUa62bxeR',kind:'rectangle'},
  'quadsort:2':{node:'mt_Xt1cRqaBOW',kind:'otherquad'}
});
function source(task,context){
  if(!isEvidenceContext(context))return null;
  const target=CASES[context.sessionId+':'+context.index];
  if(!target||!matchesNativeEvidenceTask(task,context,
    {type:'x-s23-polygon',nodeId:target.node})||
    !keys(task,['type','prompt','n','kind','questions'])||
    task.n!==4||task.kind!==target.kind||
    !Array.isArray(task.questions)||task.questions.length!==1||
    !keys(task.questions[0],['label','value'])||
    task.questions[0].value!==4)return null;
  return target;
}
const point=i=>[i%7,Math.floor(i/7)];
const orient=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-
  (b[1]-a[1])*(c[0]-a[0]);
const dot=(a,b)=>a[0]*b[0]+a[1]*b[1];
const edge=(a,b)=>[b[0]-a[0],b[1]-a[1]];
const sq=v=>dot(v,v);
function between(a,b,c){
  return orient(a,b,c)===0&&
    c[0]>=Math.min(a[0],b[0])&&c[0]<=Math.max(a[0],b[0])&&
    c[1]>=Math.min(a[1],b[1])&&c[1]<=Math.max(a[1],b[1]);
}
function crossing(a,b,c,d){
  const x=orient(a,b,c),y=orient(a,b,d);
  const z=orient(c,d,a),w=orient(c,d,b);
  return (x*y<0&&z*w<0)||
    between(a,b,c)||between(a,b,d)||between(c,d,a)||between(c,d,b);
}
// All integer lattice arithmetic is independent of B23 geometry/grading.
function quadrilateral(indices){
  if(!Array.isArray(indices)||indices.length!==4||
    !indices.every(i=>Number.isInteger(i)&&i>=0&&i<49)||
    new Set(indices).size!==4)return null;
  const ps=indices.map(point);
  const vs=ps.map((p,i)=>edge(p,ps[(i+1)%4]));
  const sideSquares=vs.map(sq);
  if(sideSquares.some(x=>x===0)||
    ps.some((p,i)=>orient(ps[(i+3)%4],p,ps[(i+1)%4])===0)||
    crossing(ps[0],ps[1],ps[2],ps[3])||
    crossing(ps[1],ps[2],ps[3],ps[0]))return null;
  const areaTwice=ps.reduce((sum,p,i)=>
    sum+p[0]*ps[(i+1)%4][1]-p[1]*ps[(i+1)%4][0],0);
  if(areaTwice===0)return null;
  const right=vs.map((v,i)=>dot(v,vs[(i+1)%4])===0);
  const oppositeParallel=orient([0,0],vs[0],vs[2])===0&&
    orient([0,0],vs[1],vs[3])===0;
  const allRight=right.every(Boolean);
  const fourEqual=sideSquares.every(x=>x===sideSquares[0]);
  return {vertices:ps,sideLengthSquared:sideSquares,rightAngleAtVertex:right,
    signedDoubleArea:areaTwice,areaSquareGridUnits:Math.abs(areaTwice)/2,
    allFourRightAngles:allRight,oppositeSidesParallel:oppositeParallel,
    allFourSidesEqual:fourEqual,isRectangle:allRight,
    isRhombus:oppositeParallel&&fourEqual,
    isSquare:allRight&&oppositeParallel&&fourEqual,
    hasFourStraightSides:true,nonSelfIntersecting:true};
}
function targetMet(kind,g){
  return !!g&&(kind==='rectangle'?g.isRectangle:
    kind==='otherquad'?!g.isRectangle&&!g.isRhombus:false);
}
const isIndex=s=>typeof s==='string'&&/^(0|[1-9][0-9]*)$/.test(s)&&
  Number.isSafeInteger(Number(s))&&Number(s)<49;
export function fourPointQuadrilateralBinding(task,context={}){
  const t=source(task,context);
  return t?{nodeId:t.node,kind:'native-four-point-quadrilateral-'+t.kind}:null;
}
export function replayFourPointQuadrilateralEvidence(task,model,context={}){
  try{
    const t=source(task,context);
    if(!t||!keys(model,Object.keys(native.initial(task,1)))||
      !keys(model.board,['first','points','closed'])||
      !Array.isArray(model.history)||model.history.length<5||
      Object.keys(model.history).length!==model.history.length||
      model.issue!==''||!model.board.closed||
      !same(model.answers,task.questions.map(q=>String(q.value)))||
      !native.valid(task,model)||!native.inspect(task,model).correct)return null;
    const points=[],events=[];let closed=false,adds=0,closures=0;
    for(const [step,e] of model.history.entries()){
      if(!keys(e,['a','d','f'])||!keys(e.f,[]))return null;
      if(e.a==='add'){
        if(!keys(e.d,['index'])||!isIndex(e.d.index))return null;
        const index=Number(e.d.index);
        const applied=!closed&&points.length<4&&!points.includes(index);
        if(applied){points.push(index);adds++;}
        events.push({step,action:'add',pointIndex:index,applied});
      }else if(e.a==='undo'){
        if(!keys(e.d,[]))return null;
        const removed=points.length?points.pop():null;
        closed=false;
        events.push({step,action:'undo',removedPointIndex:removed});
      }else if(e.a==='close'){
        if(!keys(e.d,[]))return null;
        const accepted=!!quadrilateral(points);
        if(accepted){closed=true;closures++;}
        events.push({step,action:'close',geometryAccepted:accepted});
      }else if(e.a==='reset'){
        if(!keys(e.d,[]))return null;
        points.length=0;closed=false;
        events.push({step,action:'reset'});
      }else return null;
    }
    const g=quadrilateral(points);
    if(!closed||!closures||adds<4||!targetMet(t.kind,g)||
      !same(points,model.board.points)||model.board.closed!==closed)return null;
    return {kind:'native-four-point-quadrilateral-'+t.kind,
      nodeId:t.node,sessionId:context.sessionId,index:context.index,
      originalPointIndices:[...points],independentGeometry:g,
      originalControlEvents:events,observedPointSelectionAndUndo:true,
      observedOriginalClosure:true,originalToolGridProvided:true,
      physicalDrawingObserved:false,verbalProofObserved:false,
      generalMasteryAssessed:false,strictAApproved:false};
  }catch{return null;}
}
export function submittedFourPointQuadrilateralEvidence(task,model,record,context={}){
  return latestSubmissionMatches(model,record)?
    replayFourPointQuadrilateralEvidence(task,model,context):null;
}
