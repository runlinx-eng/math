// #342 P005n: source-bound B15 original quadrilateral motion; development only.
// Independent screen-geometry replay. No grader, registry, State-v2 or main edits.
import * as native from './phase5/b15-model.js';
import {isEvidenceContext,matchesNativeEvidenceTask,latestSubmissionMatches,
 hasExactKeys as keys,sameEvidence as same} from './evidence-contract.js';

const POSITION='structurebridge:0';
const NODE='mt_hImiKNiaNh';
const PROMPT='先把斜四边形摆正，再斜回去比较，最后摆正。标出始终平行的两对边，用A角90°推出另外三个角。';
const ACTIONS=[
 {action:'b15-parallel',index:0,skew:'30'},
 {action:'b15-parallel',index:1,skew:'30'},
 {action:'b15-shape',index:null,skew:'0'},
 {action:'b15-shape',index:null,skew:'30'},
 {action:'b15-shape',index:null,skew:'0'}
];
const vec=(a,b)=>[b[0]-a[0],b[1]-a[1]];
const dot=(a,b)=>a[0]*b[0]+a[1]*b[1];
const cross=(a,b)=>a[0]*b[1]-a[1]*b[0];
const norm2=a=>dot(a,a);
function independentRenderedQuadrilateral(skew){
 // Read-only Euclidean reconstruction of the B15 SVG's four screen vertices.
 // The learner sees one parallelogram, not a physical shape manipulation.
 if(!Number.isInteger(skew)||skew<0||skew>60)return null;
 const p=[[50+skew,35],[330+skew,35],[330,190],[50,190]];
 const e=p.map((v,i)=>vec(v,p[(i+1)%4]));
 const area=Math.abs(p.reduce((s,v,i)=>s+cross(v,p[(i+1)%4]),0))/2;
 const parallel=cross(e[0],e[2])===0&&cross(e[1],e[3])===0&&
   dot(e[0],e[2])<0&&dot(e[1],e[3])<0;
 const equalOpposites=norm2(e[0])===norm2(e[2])&&norm2(e[1])===norm2(e[3]);
 const rightAngles=p.every((v,i)=>{
  const before=vec(v,p[(i+3)%4]),after=vec(v,p[(i+1)%4]);
  return dot(before,after)===0;
 });
 return {skew,vertices:p,parallel,equalOpposites,rightAngles,
  nondegenerate:area>0,areaSquareScreenUnits:area};
}
const rootFields=task=>{
 const m=native.initial(task);
 return Object.fromEntries(Object.entries(m).filter(([k])=>!['board','history','issue'].includes(k)));
};
export function structureBridgeBinding(task,context={}){
 if(!isEvidenceContext(context)||context.sessionId+':'+context.index!==POSITION||
    !matchesNativeEvidenceTask(task,context,{type:'x-shapeangle',nodeId:NODE})||
    !keys(task,['type','prompt'])||task.prompt!==PROMPT)return null;
 return {position:POSITION,nodeId:NODE};
}
export function replayStructureBridgeEvidence(task,model,context={}){
 try{
  const binding=structureBridgeBinding(task,context);
  if(!binding||!model||typeof model!=='object'||Array.isArray(model))return null;
  const initial=rootFields(task);
  const fields=Object.keys(initial);
  if(!keys(model,[...fields,'board','history','issue'])||
    !keys(model.board,['parallel','seen'])||
    model.issue!==''||!native.valid(task,model)||!native.inspect(task,model).correct||
    !Array.isArray(model.history)||model.history.length!==ACTIONS.length||
    !same(model.board.parallel,[0,1])||!same(model.board.seen,[0,30]))return null;
  const final={...initial,skew:'0',angleB:'90',angleC:'90',angleD:'90',
   reason:'opposite-adjacent'};
  if(!fields.every(k=>model[k]===final[k]))return null;
  for(let i=0;i<ACTIONS.length;i++){
   const actual=model.history[i],planned=ACTIONS[i];
   if(!keys(actual,['action','data'])||!keys(actual.data,['fields','index','value'])||
     !keys(actual.data.fields,fields)||actual.action!==planned.action||
     actual.data.index!==planned.index||actual.data.value!==null)return null;
   const prior={...initial,skew:planned.skew};
   if(!fields.every(k=>actual.data.fields[k]===prior[k]))return null;
  }
  const sequence=[0,30,0].map(independentRenderedQuadrilateral);
  if(sequence.some(s=>!s||!s.parallel||!s.equalOpposites||!s.nondegenerate||
     s.areaSquareScreenUnits!==43400)||
     !sequence[0].rightAngles||sequence[1].rightAngles||
     !sequence[2].rightAngles)return null;
  return {kind:'b15-native-parallelogram-rectangle-transformation',
   position:binding.position,nodeId:binding.nodeId,
   originalParallelPairMarking:[0,1],originalCapturedSkewSequence:[0,30,0],
   independentlyVerifiedScreenArea:43400,
   independentlyVerifiedParallelOppositeEdges:true,
   independentlyVerifiedRightAnglesOnlyAtZeroSkew:true,
   originalFinalAnglesDegrees:[90,90,90],
   originalReasonSelection:'opposite-adjacent',
   observedActions:'two original parallel toggles and three original shape captures',
   sliderMovementTimelineObserved:false,freeGeometricProofAssessed:false,
   learnerStrategyAssessed:false,generalMasteryAssessed:false,
   strictAApproved:false};
 }catch{return null;}
}
export function submittedStructureBridgeEvidence(task,model,record,context={}){
 return latestSubmissionMatches(model,record)?
   replayStructureBridgeEvidence(task,model,context):null;
}
