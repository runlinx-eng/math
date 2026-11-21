// #342 P007a: bounded evidence for two ORIGINAL cube-frame build tasks only.
// This development candidate does not change grading, learning storage, or formal strict A.
import * as native from './phase5/b23-model.js';
import {isEvidenceContext,matchesNativeEvidenceTask,latestSubmissionMatches,
  hasExactKeys as exact,sameEvidence as same} from './evidence-contract.js';

const SPECS=Object.freeze({
 'shapeframe:2':{
  nodeId:'mt_2VR963szuk',
  sha256:'1c0ff827c79b8f6dcd423ae54c45e4a9e39faba861dba0d6c4badbb155d5fd4e',
  prompt:'先搭8个连接点之间的12根边；转一转，看看背后的边。'
 },
 'shapedraw:4':{
  nodeId:'mt_vJUa62bxeR',
  sha256:'ccbb859c4d93758378686ab0e62edd7e69a3d3b137913aec8b14f144d537dbdd',
  prompt:'搭一个正方体的12条棱，再转动查看。'
 }
});
const QUESTIONS=[
 {label:'这个框架有几个连接点',value:8},
 {label:'一共几根边',value:12},
 {label:'若装上外面，每面是正方形，共几个面',value:6}
];
const VERTICES=[
 [-1,-1,-1],[1,-1,-1],[1,1,-1],[-1,1,-1],
 [-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]
];
// Independent frozen index-to-edge contract for original 12 controls.
// This table is checked geometrically, not inferred from the original grader.
const EDGES=[
 [0,3],[2,3],[1,2],[0,1],[4,5],[5,6],
 [6,7],[4,7],[1,5],[0,4],[3,7],[2,6]
];
const FACES=[
 [0,3,2,1],[4,5,6,7],[0,1,5,4],
 [3,7,6,2],[1,2,6,5],[0,4,7,3]
];
const MODEL_KEYS=Object.keys(native.initial({
 type:'x-s23-frame',mode:'build',solid:'cube',questions:QUESTIONS
},1));
const TASK_KEYS=['type','prompt','mode','solid','questions'];
const validIndex=value=>typeof value==='string'&&/^(?:[0-9]|1[01])$/.test(value);
const canonicalPair=(a,b)=>a<b?a+':'+b:b+':'+a;

function original(task,context){
 if(!isEvidenceContext(context))return null;
 const key=context.sessionId+':'+context.index;
 if(!Object.hasOwn(SPECS,key))return null;
 const spec=SPECS[key];
 if(!exact(task,TASK_KEYS)||task.type!=='x-s23-frame'||
    task.mode!=='build'||task.solid!=='cube'||
    task.prompt!==spec.prompt||!same(task.questions,QUESTIONS)||
    !matchesNativeEvidenceTask(task,context,
      {type:'x-s23-frame',nodeId:spec.nodeId}))return null;
 return spec;
}
function geometry(){
 const degrees=Array(VERTICES.length).fill(0),edgeKeys=new Set();
 for(const pair of EDGES){
  const [a,b]=pair;
  if(!Number.isInteger(a)||!Number.isInteger(b)||
     a<0||b<0||a>=VERTICES.length||b>=VERTICES.length||a===b)return null;
  const key=canonicalPair(a,b);
  if(edgeKeys.has(key))return null;
  edgeKeys.add(key);degrees[a]++;degrees[b]++;
  const differingAxes=VERTICES[a].filter((n,i)=>n!==VERTICES[b][i]).length;
  if(differingAxes!==1)return null;
 }
 for(const face of FACES){
  if(new Set(face).size!==4)return null;
  for(let j=0;j<4;j++)
   if(!edgeKeys.has(canonicalPair(face[j],face[(j+1)%4])))return null;
 }
 if(degrees.some(d=>d!==3)||VERTICES.length-EDGES.length+FACES.length!==2)return null;
 return {vertexCount:8,edgeCount:12,faceCount:6,vertexDegrees:degrees,
  EulerCharacteristic:2,facesHaveFourEdges:true};
}
export function cubeFrameEdgeBinding(task,context={}){
 const spec=original(task,context);
 return spec?{kind:'native-cube-frame-edge-build',nodeId:spec.nodeId,
  originalPosition:context.sessionId+':'+context.index,
  originalTaskSha256:spec.sha256,originalControlsAvailable:true,
  physicalCubeBuilt:false,strictAApproved:false}:null;
}
export function replayCubeFrameEdgeEvidence(task,model,context={}){
 try{
  const spec=original(task,context),g=geometry();
  if(!spec||!g||!exact(model,MODEL_KEYS)||
     !exact(model.board,['first','edges','turns'])||
     !Array.isArray(model.history)||model.history.length<12||
     model.history.length>650||model.issue!==''||
     !same(model.answers,QUESTIONS.map(q=>String(q.value)))||
     !native.valid(task,model)||native.inspect(task,model).correct!==true)return null;
  const selected=[],first={},events=[];
  let turns=0,adds=0,removals=0;
  for(const [step,e] of model.history.entries()){
   if(!exact(e,['a','f','d'])||!exact(e.f,[])||
      !['stick','turn','reset'].includes(e.a))return null;
   if(!Object.hasOwn(first,e.a))first[e.a]={};
   if(e.a==='stick'){
    if(!exact(e.d,['index'])||!validIndex(e.d.index))return null;
    const index=Number(e.d.index),old=selected.indexOf(index);
    if(old<0){selected.push(index);adds++;}else{selected.splice(old,1);removals++;}
    events.push({step,action:'stick',edgeIndex:index,
      endpoints:[...EDGES[index]],effect:old<0?'add':'remove'});
   }else if(e.a==='turn'){
    if(!exact(e.d,[]))return null;
    turns++;events.push({step,action:'turn'});
   }else{
    if(!exact(e.d,[]))return null;
    selected.length=0;turns=0;
    events.push({step,action:'reset'});
   }
  }
  if(!same(first,model.board.first)||!same(selected,model.board.edges)||
     turns!==model.board.turns||selected.length!==12||adds<12||
     new Set(selected).size!==12||
     !selected.every(i=>Number.isInteger(i)&&i>=0&&i<12))return null;
  return {kind:'native-cube-frame-edge-build',
   originalPosition:context.sessionId+':'+context.index,
   sourceNodeId:spec.nodeId,originalTaskSha256:spec.sha256,
   independentCubeGeometry:g,originalSelectedEdgeIndices:[...selected],
   originalStickEvents:events.filter(x=>x.action==='stick').length,
   observedEffectiveEdgeAdds:adds,observedEffectiveEdgeRemovals:removals,
   originalTurnEvents:turns,originalControlEvents:events,
   originalEdgeToggleHistoryReplayed:true,originalCompleteFrameObserved:true,
   independentPhysicalCubeConstructionObserved:false,
   hiddenEdgeExplanationAssessed:false,verbalGeometricProofAssessed:false,
   longTermMasteryAssessed:false,strictAApproved:false};
 }catch{return null;}
}
export function submittedCubeFrameEdgeEvidence(task,model,record,context={}){
 try{
  const proof=replayCubeFrameEdgeEvidence(task,model,context);
  if(!proof||!latestSubmissionMatches(model,record)||
     record.attempts.length!==2)return null;
  const before=record.attempts[0]?.value;
  if(!exact(before,MODEL_KEYS)||!native.valid(task,before)||
     native.inspect(task,before).correct!==false||
     !Array.isArray(before.answers)||before.answers.length!==3||
     typeof before.answers[0]!=='string'||
     before.answers[0]===String(QUESTIONS[0].value)||
     before.answers[1]!==String(QUESTIONS[1].value)||
     before.answers[2]!==String(QUESTIONS[2].value))return null;
  const reconstructed=structuredClone(model);
  reconstructed.answers[0]=before.answers[0];
  if(!same(reconstructed,before))return null;
  return {...proof,originalCheckSnapshotsObserved:2,
   wrongToCorrectCheckRevisionObserved:true,
   individualAnswerFieldKeystrokesPersisted:false};
 }catch{return null;}
}
