// #342 P004b quadsort:3 only. Candidate mathematical replay; no public registration.
import * as native from './phase5/b23-model.js';
import {matchesNativeEvidenceTask,latestSubmissionMatches,
  hasExactKeys as keys,sameEvidence as same} from './evidence-contract.js';
const NODE='mt_Xt1cRqaBOW',EPS=1e-7;
const dot=(a,b)=>a[0]*b[0]+a[1]*b[1],cross=(a,b)=>a[0]*b[1]-a[1]*b[0];
const zero=x=>Number.isFinite(x)&&Math.abs(x)<EPS;
const source=(t,c)=>c?.sessionId==='quadsort'&&c?.index===3&&
 matchesNativeEvidenceTask(t,c,{type:'x-s23-nest',nodeId:NODE})&&
 keys(t,['type','prompt','cards','regions','questions'])&&
 Array.isArray(t.cards)&&t.cards.length===4&&same(t.regions,[2,1,0,0])&&
 t.questions?.length===1&&t.questions[0].value==='yes';
function classify(card){
 if(!keys(card,['kind','points'])||card.kind!=='polygon'||
    !Array.isArray(card.points)||card.points.length!==4)return null;
 const p=card.points;
 if(p.some(x=>!Array.isArray(x)||x.length!==2||x.some(v=>!Number.isFinite(v))))return null;
 const v=p.map((x,i)=>[p[(i+1)%4][0]-x[0],p[(i+1)%4][1]-x[1]]);
 const lens=v.map(e=>Math.hypot(...e));
 const turns=v.map((e,i)=>cross(e,v[(i+1)%4]));
 if(lens.some(x=>x<EPS)||!(turns.every(x=>x>EPS)||turns.every(x=>x< -EPS)))return null;
 const parallel=zero(cross(v[0],v[2]))&&zero(cross(v[1],v[3]));
 const right=v.every((e,i)=>zero(dot(e,v[(i+1)%4])));
 const equalSides=lens.every(x=>zero(x-lens[0]));
 const rectangle=parallel&&right,rhombus=parallel&&equalSides,square=rectangle&&rhombus;
 return {region:square?2:rectangle?1:0,parallel,right,equalSides,rectangle,rhombus,square};
}
export function quadrilateralNestingBinding(t,c={}){
 return source(t,c)?{nodeId:NODE,kind:'quadrilateral-nesting-actions'}:null;
}
export function replayQuadrilateralNestingEvidence(t,m,c={}){
 try{
  if(!source(t,c)||!keys(m,Object.keys(native.initial(t,1)))||
    !keys(m.board,['first','assigned'])||!Array.isArray(m.history)||
    m.history.length<4||Object.keys(m.history).length!==m.history.length||
    m.issue!==''||!same(m.answers,['yes'])||
    !native.valid(t,m)||!native.inspect(t,m).correct)return null;
  const math=t.cards.map(classify);
  if(math.some(x=>!x))return null;
  const regions=math.map(x=>x.region);
  if(!same(regions,[2,1,0,0])||!same(regions,t.regions)||
     !math[0].square||!math[1].rectangle||math[1].square||
     math[2].rectangle||!math[3].rhombus||math[3].rectangle)return null;
  const assigned=Array(4).fill(null),events=[],touched=new Set();
  for(const [step,e] of m.history.entries()){
   if(!keys(e,['a','d','f'])||!keys(e.d,[]))return null;
   if(e.a==='reset'){
    if(!keys(e.f,[]))return null;
    assigned.fill(null);touched.clear();events.push({step,action:'reset'});
   }else if(e.a==='sort'){
    if(!keys(e.f,['item','slot'])||
       typeof e.f.item!=='string'||!/^[0-3]$/.test(e.f.item)||
       typeof e.f.slot!=='string'||!/^[0-2]$/.test(e.f.slot))return null;
    const item=Number(e.f.item),slot=Number(e.f.slot);
    events.push({step,action:'sort',item,slot,previous:assigned[item],
      isCorrection:assigned[item]!==null&&assigned[item]!==slot});
    assigned[item]=slot;touched.add(item);
   }else return null;
  }
  if(touched.size!==4||!same(assigned,regions)||!same(assigned,m.board.assigned))return null;
  return {kind:'quadrilateral-nesting-actions',nodeId:NODE,
   sessionId:c.sessionId,index:c.index,originalControlEvents:events,
   independentlyCalculatedRegions:regions,originalFinalAssignments:[...assigned],
   geometricChecks:math.map(x=>({parallel:x.parallel,rightAngles:x.right,
     equalSides:x.equalSides,rectangle:x.rectangle,rhombus:x.rhombus,square:x.square})),
   regionSemantics:'0=quadrilateral region, 1=rectangle region, 2=square region',
   observedCardPlacementSequence:true,reasonForChosenRegionObserved:false,
   verbalProofAssessed:false,generalMasteryAssessed:false,strictAApproved:false};
 }catch{return null;}
}
export function submittedQuadrilateralNestingEvidence(t,m,record,c={}){
 return latestSubmissionMatches(m,record)?replayQuadrilateralNestingEvidence(t,m,c):null;
}
