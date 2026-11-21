// #342 / P004d: exact native B23 triangle drawing positions only.
// Development-only independent replay; never changes original grader or strict-A registry.
import * as native from './phase5/b23-model.js';
import {isEvidenceContext,matchesNativeEvidenceTask,
  latestSubmissionMatches,hasExactKeys as keys,sameEvidence as same}
  from './evidence-contract.js';

const NODES=Object.freeze({
  'shapehello:2':'mt_KJeEeTutJI',
  'shapeframe:0':'mt_2VR963szuk',
  'shapeidentity:0':'mt_bfhng6mOuy',
  'shapedraw:0':'mt_vJUa62bxeR'
});
const source=(task,context)=>{
  if(!isEvidenceContext(context))return null;
  const nodeId=NODES[context.sessionId+':'+context.index];
  if(!nodeId||!matchesNativeEvidenceTask(task,context,
    {type:'x-s23-polygon',nodeId})||
    !keys(task,['type','prompt','n','kind','questions'])||
    task.n!==3||task.kind!=='any'||!Array.isArray(task.questions)||
    task.questions.length<1||
    task.questions.some(q=>!Number.isFinite(Number(q.value))&&
      !Array.isArray(q.options)))return null;
  return nodeId;
};
const integerIndex=x=>typeof x==='string'&&/^(0|[1-9][0-9]*)$/.test(x)&&
  Number.isSafeInteger(Number(x))&&Number(x)<49;
// Independent geometry from the original 7x7 grid indices, not the original grader.
const gridPoint=i=>[i%7,Math.floor(i/7)];
function triangle(points){
  if(!Array.isArray(points)||points.length!==3||
     !points.every(i=>Number.isInteger(i)&&i>=0&&i<49)||
     new Set(points).size!==3)return null;
  const [a,b,c]=points.map(gridPoint);
  const twice=(b[0]-a[0])*(c[1]-a[1])-
    (b[1]-a[1])*(c[0]-a[0]);
  if(!Number.isFinite(twice)||twice===0)return null;
  return {vertices:[a,b,c],signedDoubleArea:twice,
    areaSquareGridUnits:Math.abs(twice)/2,hasThreeStraightSides:true,
    closesWithoutSelfIntersection:true};
}
export function triangleDrawingBinding(task,context={}){
  const nodeId=source(task,context);
  return nodeId?{nodeId,kind:'native-triangle-point-construction'}:null;
}
export function replayTriangleDrawingEvidence(task,model,context={}){
  try{
    const nodeId=source(task,context);
    if(!nodeId||!keys(model,Object.keys(native.initial(task,1)))||
      !keys(model.board,['first','points','closed'])||
      !Array.isArray(model.history)||model.history.length<4||
      Object.keys(model.history).length!==model.history.length||
      model.issue!==''||!model.board.closed||
      !same(model.answers,task.questions.map(q=>String(q.value)))||
      !native.valid(task,model)||!native.inspect(task,model).correct)return null;
    const points=[],events=[];
    let closed=false,successfulAdds=0,closedEvents=0;
    for(const [step,e] of model.history.entries()){
      if(!keys(e,['a','d','f'])||!keys(e.f,[]))return null;
      if(e.a==='add'){
        if(!keys(e.d,['index'])||!integerIndex(e.d.index))return null;
        const index=Number(e.d.index);
        const applied=!closed&&points.length<3&&!points.includes(index);
        if(applied){points.push(index);successfulAdds++;}
        events.push({step,action:'add',pointIndex:index,applied});
      }else if(e.a==='undo'){
        if(!keys(e.d,[]))return null;
        const removed=points.length?points.pop():null;
        closed=false;
        events.push({step,action:'undo',removedPointIndex:removed});
      }else if(e.a==='close'){
        if(!keys(e.d,[]))return null;
        const accepted=!!triangle(points);
        if(accepted){closed=true;closedEvents++;}
        events.push({step,action:'close',geometryAccepted:accepted});
      }else if(e.a==='reset'){
        if(!keys(e.d,[]))return null;
        points.length=0;closed=false;
        events.push({step,action:'reset'});
      }else return null;
    }
    const geometry=triangle(points);
    if(!geometry||!closed||!closedEvents||successfulAdds<3||
      !same(points,model.board.points)||model.board.closed!==closed)return null;
    return {kind:'native-triangle-point-construction',
      nodeId,sessionId:context.sessionId,index:context.index,
      originalPointIndices:[...points],independentGeometry:geometry,
      originalControlEvents:events,observedPointOrderAndUndo:true,
      observedFinalClosure:true,toolProvidedGrid:true,
      independentFreehandDrawingObserved:false,verbalJustificationObserved:false,
      generalMasteryAssessed:false,strictAApproved:false};
  }catch{return null;}
}
export function submittedTriangleDrawingEvidence(task,model,record,context={}){
  return latestSubmissionMatches(model,record)?
    replayTriangleDrawingEvidence(task,model,context):null;
}
