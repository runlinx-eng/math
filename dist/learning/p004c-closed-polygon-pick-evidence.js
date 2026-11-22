// #342 / P004c: six exact native B23 closed-polygon picking positions only.
// Development candidate: no shared registry, original grader, SW or formal A changes.
import * as original from './phase5/b23-model.js';
import {isEvidenceContext,matchesNativeEvidenceTask,
  latestSubmissionMatches,hasExactKeys as keys,sameEvidence as same}
  from './evidence-contract.js';

const SOURCES=Object.freeze({
  'shapehello:0':{nodeId:'mt_KJeEeTutJI',want:'triangle',expected:[0,3]},
  'shapehello:1':{nodeId:'mt_KJeEeTutJI',want:'triangle',expected:[0,1,2]},
  'shapeidentity:1':{nodeId:'mt_bfhng6mOuy',want:'triangle',expected:[0,1,2]},
  'shapeidentity:2':{nodeId:'mt_bfhng6mOuy',want:'triangle',expected:[1,3]},
  'sidesfold:2':{nodeId:'mt_sBcRdUfAzV',want:'quadrilateral',expected:[1,4]},
  'shapesides:1':{nodeId:'mt_zuOGOGFAKb',want:'quadrilateral',expected:[1,4]}
});
const EPS=1e-7;
const cross=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
const near=(x,y)=>Math.abs(x-y)<=EPS;
function intersects(a,b,c,d){
  const p=cross(a,b,c),q=cross(a,b,d),r=cross(c,d,a),s=cross(c,d,b);
  const within=(x,y,z)=>near(cross(x,y,z),0)&&
    z[0]>=Math.min(x[0],y[0])-EPS&&z[0]<=Math.max(x[0],y[0])+EPS&&
    z[1]>=Math.min(x[1],y[1])-EPS&&z[1]<=Math.max(x[1],y[1])+EPS;
  return (p*q< -EPS&&r*s< -EPS)||within(a,b,c)||within(a,b,d)||
    within(c,d,a)||within(c,d,b);
}
// Independently establish closed straight sides, nondegenerate corners and
// non-self-intersection. Do not call the original grader or its targets helper.
function closedStraightPolygon(card,n){
  if(!keys(card,['kind','points'])||card.kind!=='polygon'||
     !Array.isArray(card.points)||card.points.length!==n)return false;
  const p=card.points;
  if(p.some(v=>!Array.isArray(v)||v.length!==2||
    v.some(x=>typeof x!=='number'||!Number.isFinite(x))))return false;
  if(new Set(p.map(v=>JSON.stringify(v))).size!==n)return false;
  for(let i=0;i<n;i++){
    const a=p[i],b=p[(i+1)%n],prev=p[(i+n-1)%n];
    if(Math.hypot(a[0]-b[0],a[1]-b[1])<=EPS||
       near(cross(prev,a,b),0))return false;
    for(let j=i+1;j<n;j++){
      if(j===(i+1)%n||i===(j+1)%n)continue;
      if(intersects(a,b,p[j],p[(j+1)%n]))return false;
    }
  }
  const area=p.reduce((v,a,i)=>v+
    a[0]*p[(i+1)%n][1]-a[1]*p[(i+1)%n][0],0)/2;
  return Math.abs(area)>EPS;
}
function source(t,c){
  if(!isEvidenceContext(c))return null;
  const s=SOURCES[c.sessionId+':'+c.index];
  if(!s||!matchesNativeEvidenceTask(t,c,
    {type:'x-s23-pick',nodeId:s.nodeId})||
    !keys(t,['type','prompt','cards','want','questions'])||
    t.want!==s.want||!Array.isArray(t.cards)||
    !Array.isArray(t.questions)||t.cards.length<4)return null;
  return s;
}
export function closedPolygonPickBinding(task,context={}){
  const s=source(task,context);
  return s?{nodeId:s.nodeId,kind:'closed-straight-polygon-pick-controls'}:null;
}
export function replayClosedPolygonPickEvidence(task,model,context={}){
  try{
    const s=source(task,context),m=model;
    if(!s||!keys(m,Object.keys(original.initial(task,1)))||
      !keys(m.board,['first','selected'])||
      !Array.isArray(m.history)||m.history.length<1||
      Object.keys(m.history).length!==m.history.length||
      !Array.isArray(m.board.selected)||m.issue!==''||
      !same(m.answers,task.questions.map(q=>String(q.value)))||
      !original.valid(task,m)||!original.inspect(task,m).correct)return null;
    const count=s.want==='triangle'?3:4;
    const calculated=task.cards.flatMap((card,i)=>
      closedStraightPolygon(card,count)?[i]:[]);
    if(!same(calculated,s.expected))return null;
    const selected=[],events=[];
    let selectedEvents=0;
    for(const [step,e] of m.history.entries()){
      if(!keys(e,['a','d','f'])||!keys(e.f,[]))return null;
      if(e.a==='reset'){
        if(!keys(e.d,[]))return null;
        selected.length=0;events.push({step,action:'reset'});
      }else if(e.a==='toggle'){
        if(!keys(e.d,['index'])||typeof e.d.index!=='string'||
          !/^(0|[1-9][0-9]*)$/.test(e.d.index))return null;
        const index=Number(e.d.index);
        if(!Number.isSafeInteger(index)||index>=task.cards.length)return null;
        const pos=selected.indexOf(index),wasSelected=pos>=0;
        if(wasSelected)selected.splice(pos,1);else selected.push(index);
        selectedEvents++;
        events.push({step,action:'toggle',cardIndex:index,
          wasSelected,isNowSelected:!wasSelected,
          matchesClosedPolygon:calculated.includes(index)});
      }else return null;
    }
    if(!selectedEvents||!same(selected,m.board.selected)||
      !same([...selected].sort((a,b)=>a-b),calculated))return null;
    return {kind:'closed-straight-polygon-pick-controls',
      nodeId:s.nodeId,sessionId:context.sessionId,index:context.index,
      expectedStraightSides:count,independentlyCalculatedMatches:calculated,
      originalSelectedCards:[...selected],originalControlEvents:events,
      observedToggleAndCorrectionHistory:true,visualCardGeometryChecked:true,
      verbalJustificationObserved:false,mentalStrategyObserved:false,
      generalMasteryAssessed:false,strictAApproved:false};
  }catch{return null;}
}
export function submittedClosedPolygonPickEvidence(task,model,record,context={}){
  return latestSubmissionMatches(model,record)?
    replayClosedPolygonPickEvidence(task,model,context):null;
}
