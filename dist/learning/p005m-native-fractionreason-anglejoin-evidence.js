// #342 P005m: two original B16 angle-joining tasks, development evidence only.
// No source, grader, shared registry or State-v2 mutation. No strict-A admission.
import * as native from './phase5/b16-model.js';
import {isEvidenceContext,matchesNativeEvidenceTask,latestSubmissionMatches,
 hasExactKeys as keys,sameEvidence as same} from './evidence-contract.js';

const CASES={
 'fractionreason:2':{
  node:'mt_2ESZh70NyS',angles:[45,90,45],
  prompt:'点原图的三个角，分别搬到右边同一点，转动后摆成无缝的半圈。最后把理由排成一条。'
 },
 'fractionreason:3':{
  node:'mt_2ESZh70NyS',angles:[30,60,90],
  prompt:'换一种三角形再试。三个角形状变了，拼到同一点以后怎样相接？'
 }
};
const historyFields=Object.keys(native.fields);
const modelFields=[...historyFields,'board','history','issue'];
const unused=historyFields.filter(k=>!['answer','rotation'].includes(k));
const rad=x=>x*Math.PI/180;
const degrees=x=>x*180/Math.PI;
const close=(a,b)=>Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<1e-8;
function independentTriangleAngles(given){
 // Separate Euclidean reconstruction: AB = 5; intersect rays of angles A and B.
 // This checks geometry, rather than trusting B16's ready-made sum or grader.
 if(!Array.isArray(given)||given.length!==3||
    !given.every(x=>Number.isFinite(x)&&x>0&&x<180))return null;
 const [a,b,c]=given;
 if(!close(a+b+c,180)||Math.sin(rad(c))<=0)return null;
 const ac=5*Math.sin(rad(b))/Math.sin(rad(c));
 const pts=[[0,0],[5,0],[ac*Math.cos(rad(a)),ac*Math.sin(rad(a))]];
 const angles=pts.map((p,i)=>{
  const u=[pts[(i+1)%3][0]-p[0],pts[(i+1)%3][1]-p[1]];
  const v=[pts[(i+2)%3][0]-p[0],pts[(i+2)%3][1]-p[1]];
  return degrees(Math.atan2(Math.abs(u[0]*v[1]-u[1]*v[0]),
   u[0]*v[0]+u[1]*v[1]));
 });
 return angles.every((x,i)=>close(x,given[i]))&&
  close(angles.reduce((sum,x)=>sum+x,0),180)?angles:null;
}
export function angleJoinBinding(task,context={}){
 if(!isEvidenceContext(context))return null;
 const position=context.sessionId+':'+context.index,spec=CASES[position];
 if(!spec||!matchesNativeEvidenceTask(task,context,
   {type:'x-anglejoin',nodeId:spec.node})||
   !keys(task,['type','angles','prompt'])||
   !same(task.angles,spec.angles)||task.prompt!==spec.prompt)return null;
 return {position,nodeId:spec.node};
}
export function replayAngleJoinEvidence(task,model,context={}){
 try{
  const source=angleJoinBinding(task,context);
  if(!source||!keys(model,modelFields)||model.issue!==''||
    !unused.every(k=>model[k]===native.fields[k])||
    model.answer!=='180'||!native.valid(task,model)||
    !native.inspect(task,model).correct||
    !keys(model.board,['taken','selected','placed','chain'])||
    !Array.isArray(model.history)||model.history.length!==9)return null;
  const measured=independentTriangleAngles(task.angles);
  if(!measured)return null;
  const picked=[],placed=[],chain=[];
  let selected=null,lastRotation=native.fields.rotation,stage='angle';
  for(const event of model.history){
   if(!keys(event,['action','data'])||!keys(event.data.fields,historyFields)||
      !unused.every(k=>event.data.fields[k]===native.fields[k])||
      event.data.fields.answer!==native.fields.answer)return null;
   const data=event.data;
   if(stage==='angle'){
    if(event.action!=='angle'||!keys(data,['index','fields'])||
      !/^[012]$/.test(data.index)||picked.includes(Number(data.index)))return null;
    selected=Number(data.index);picked.push(selected);stage='place';
   }else if(stage==='place'){
    if(event.action!=='rotate-place'||!keys(data,['fields']))return null;
    const raw=data.fields.rotation,start=Number(raw);
    if(typeof raw!=='string'||String(start)!==raw||!Number.isInteger(start)||
       start<0||start>180||start+measured[selected]>180+1e-8)return null;
    placed.push({index:selected,start,end:start+task.angles[selected]});
    lastRotation=raw;
    stage=picked.length===3?'chain':'angle';
   }else{
    if(event.action!=='chain'||!keys(data,['value','fields'])||
      data.value!==['original','together','straight'][chain.length]||
      data.fields.rotation!==lastRotation)return null;
    chain.push(data.value);
   }
   if(stage==='place'&&data.fields.rotation!==lastRotation)return null;
   if(event.action==='angle'&&data.fields.rotation!==lastRotation)return null;
  }
  if(picked.length!==3||placed.length!==3||chain.length!==3||
    !same([...picked].sort(),[0,1,2])||
    model.rotation!==lastRotation||model.board.selected!==selected||
    !same(model.board.taken,picked)||!same(model.board.placed,placed)||
    !same(model.board.chain,chain))return null;
  const ordered=[...placed].sort((x,y)=>x.start-y.start);
  if(!close(ordered[0].start,0)||!close(ordered[2].end,180)||
    !ordered.every((p,i)=>i===0||close(ordered[i-1].end,p.start))||
    !close(ordered.reduce((s,p)=>s+(p.end-p.start),0),180))return null;
  return {kind:'native-three-angle-straight-join',nodeId:source.nodeId,
   position:source.position,independentTriangleAnglesDegrees:measured,
   independentTriangleSumDegrees:measured.reduce((s,x)=>s+x,0),
   originalAnglePickOrder:picked,originalSectorPlacements:placed,
   originalChainControlOrder:chain,unbrokenHalfTurnVerified:true,
   screenAngleMovesObserved:true,verbalProofAssessed:false,
   learnerStrategyAssessed:false,generalMasteryAssessed:false,
   strictAApproved:false};
 }catch{return null;}
}
export function submittedAngleJoinEvidence(task,model,record,context={}){
 return latestSubmissionMatches(model,record)?
  replayAngleJoinEvidence(task,model,context):null;
}
