// #342 / P004l: source-locked five-edge marking on the original rotated pentagon.
// Candidate-only: replay screen controls and geometry, never claim strict-A approval.
import * as native from './phase5/b23-model.js';
import {isEvidenceContext,matchesNativeEvidenceTask,
  latestSubmissionMatches,hasExactKeys as keys,sameEvidence as same}
  from './evidence-contract.js';

const POSITION='words38:2', NODE='mt_lMz9nAs7VO';
function source(task,context){
  if(!isEvidenceContext(context)||
    context.sessionId+':'+context.index!==POSITION||
    !matchesNativeEvidenceTask(task,context,{type:'x-s23-sides',nodeId:NODE})||
    !keys(task,['type','prompt','shape','rotation','questions'])||
    task.shape!=='pentagon'||task.rotation!==24||
    !Array.isArray(task.questions)||task.questions.length!==2||
    task.questions.some(q=>!keys(q,['label','value'])||q.value!==5))
    return null;
  return {nodeId:NODE,edgeCount:5};
}
function independentGeometry(task){
  // Independent regular pentagon in the plane, with the original 24 degree rotation.
  // Never infer mental counting, hand drawing, or a spoken geometric proof.
  const n=5,angle=task.rotation*Math.PI/180;
  const points=Array.from({length:n},(_,i)=>{
    const a=(-Math.PI/2+2*Math.PI*i/n)+angle;
    return [2*Math.cos(a),2*Math.sin(a)];
  });
  const vectors=points.map((p,i)=>{
    const q=points[(i+1)%n];return[q[0]-p[0],q[1]-p[1]];
  });
  const squared=vectors.map(v=>v[0]*v[0]+v[1]*v[1]);
  const turns=vectors.map((v,i)=>{
    const w=vectors[(i+1)%n];return v[0]*w[1]-v[1]*w[0];
  });
  const signedDoubleArea=points.reduce((sum,p,i)=>{
    const q=points[(i+1)%n];return sum+p[0]*q[1]-p[1]*q[0];
  },0);
  if(squared.some(x=>x<1e-7)||
    squared.some(x=>Math.abs(x-squared[0])>1e-7)||
    !turns.every(x=>x>1e-7)||Math.abs(signedDoubleArea)<1e-7)
    return null;
  return {vertexCount:n,edgeCount:n,edgeLengthsSquared:squared,
    positiveTurns:n,closed:true,signedDoubleArea,rotationDegrees:task.rotation};
}
const isMark=x=>typeof x==='string'&&/^[0-4]$/.test(x);
export function words38PentagonSideTraceBinding(task,context={}){
  const s=source(task,context);
  return s?{nodeId:s.nodeId,kind:'native-pentagon-side-marking',edgeCount:5}:null;
}
export function replayWords38PentagonSideTraceEvidence(task,model,context={}){
  try{
    const s=source(task,context),geometry=s&&independentGeometry(task);
    if(!s||!geometry||
      !keys(model,Object.keys(native.initial(task,1)))||
      !keys(model.board,['first','marked'])||
      !Array.isArray(model.history)||model.history.length<5||
      Object.keys(model.history).length!==model.history.length||
      model.issue!==''||
      !same(model.answers,['5','5'])||
      !native.valid(task,model)||!native.inspect(task,model).correct)
      return null;
    const marked=[],events=[];
    for(const [step,e] of model.history.entries()){
      if(!keys(e,['a','f','d'])||!keys(e.f,[]))return null;
      if(e.a==='mark'){
        if(!keys(e.d,['index'])||!isMark(e.d.index))return null;
        const index=Number(e.d.index),at=marked.indexOf(index);
        if(at<0)marked.push(index);else marked.splice(at,1);
        events.push({step,action:'mark',edgeIndex:index,selected:at<0});
      }else if(e.a==='reset'){
        if(!keys(e.d,[]))return null;
        marked.length=0;events.push({step,action:'reset'});
      }else return null;
    }
    if(marked.length!==5||!same(marked,model.board.marked)||
      !same([...marked].sort((a,b)=>a-b),[0,1,2,3,4]))
      return null;
    return {kind:'native-pentagon-side-marking',nodeId:s.nodeId,
      sessionId:context.sessionId,index:context.index,
      independentGeometry:geometry,observedEdgeIndices:[...marked],
      originalControlEvents:events,observedAllFiveOriginalEdgeMarks:true,
      observedOriginalTaskAnswer:true,physicalMeasurementObserved:false,
      verbalProofAssessed:false,generalMasteryAssessed:false,
      strictAApproved:false};
  }catch{return null;}
}
export function submittedWords38PentagonSideTraceEvidence(task,model,record,context={}){
  return latestSubmissionMatches(model,record)?
    replayWords38PentagonSideTraceEvidence(task,model,context):null;
}
