// #342 / P004m: quadsort:0/1 and quadhierarchy:0/1 only.
// Candidate mathematical replay; no public registry, grader, release or strict-A edits.
import * as native from './phase5/b23-model.js';
import {scenario} from './phase5/b23-geometry.js';
import {isEvidenceContext, matchesNativeEvidenceTask,
  latestSubmissionMatches, hasExactKeys as keys, sameEvidence as same} from './evidence-contract.js';

const SOURCES=Object.freeze({
  'shapefacts:1':{nodeId:'mt_DNYQLahbfa',shape:'square',rotation:30,answer:'yes'}
});
const EPS=1e-7;
const dot=(a,b)=>a[0]*b[0]+a[1]*b[1];
const cross=(a,b)=>a[0]*b[1]-a[1]*b[0];
const near=(a,b)=>Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<EPS;

function sourceFor(task,context){
  if(!isEvidenceContext(context))return null;
  const s=SOURCES[context.sessionId+':'+context.index];
  if(!s||!matchesNativeEvidenceTask(task,context,{type:'x-s23-quad',nodeId:s.nodeId})||
     !keys(task,['type','prompt','shape','rotation','questions'])||
     task.shape!==s.shape||task.rotation!==s.rotation||
     !Array.isArray(task.questions)||task.questions.length!==1||
     task.questions[0].value!==s.answer)return null;
  return s;
}

// Independent coordinate calculation, not a class label copied from the native grader.
function geometricClassification(task){
  const ps=scenario(task.shape,task.rotation);
  if(ps.length!==4||ps.some(p=>p.length!==2||p.some(v=>!Number.isFinite(v))))return null;
  const vs=ps.map((p,i)=>[ps[(i+1)%4][0]-p[0],ps[(i+1)%4][1]-p[1]]);
  const lengths=vs.map(v=>Math.hypot(v[0],v[1]));
  if(lengths.some(l=>l<EPS))return null;
  const parallel=near(cross(vs[0],vs[2]),0)&&near(cross(vs[1],vs[3]),0);
  const right=vs.every((v,i)=>near(dot(v,vs[(i+1)%4]),0));
  const equalSides=lengths.every(l=>near(l,lengths[0]));
  const rectangle=parallel&&right, rhombus=parallel&&equalSides;
  const square=rectangle&&rhombus;
  const classes=[0,...(parallel?[1]:[]),...(rectangle?[2]:[]),
    ...(rhombus?[3]:[]),...(square?[4,5]:[])];
  return {parallel,right,equalSides,rectangle,rhombus,square,classes,
    measuredSideLengths:lengths};
}

export function crossSourceSquareInclusionBinding(task,context={}){
  const s=sourceFor(task,context);
  if(!s)return null;
  return {nodeId:s.nodeId,kind:'cross-source-square-inclusion-controls',
    question:'原属性检查及多重分类点击是否与四边形的独立几何关系一致？'};
}

export function replayCrossSourceSquareInclusionEvidence(task,model,context={}){
  try{
    const src=sourceFor(task,context),geo=src&&geometricClassification(task);
    if(!geo||!native.valid(task,model)||!native.inspect(task,model).correct||
       !keys(model,Object.keys(native.initial(task,1)))||
       !keys(model.board,['first','tested','selected'])||
       model.issue!==''||!same(model.answers,[src.answer])||
       !Array.isArray(model.history)||!model.history.length||
       Object.keys(model.history).length!==model.history.length)return null;
    const tests=new Set(),chosen=new Set(),events=[];
    for(const [step,e] of model.history.entries()){
      if(!keys(e,['a','d','f'])||!keys(e.f,[])||
         !['test','class','reset'].includes(e.a))return null;
      if(e.a==='reset'){
        if(!keys(e.d,[]))return null;
        tests.clear();chosen.clear();
        events.push({step,action:'reset'});
        continue;
      }
      if(!keys(e.d,['index'])||typeof e.d.index!=='string'||
         !/^(0|[1-5])$/.test(e.d.index))return null;
      const i=Number(e.d.index);
      if(e.a==='test'){
        if(i>2)return null;
        tests.add(i);
      }else{
        // The original UI only reveals class controls after all three tests.
        if(tests.size!==3)return null;
        if(chosen.has(i))chosen.delete(i);else chosen.add(i);
      }
      events.push({step,action:e.a,index:i});
    }
    if(tests.size!==3||!same([...tests].sort((a,b)=>a-b),[0,1,2])||
       !same([...tests],model.board.tested)||
       !same([...chosen].sort((a,b)=>a-b),[...geo.classes].sort((a,b)=>a-b))||
       !same([...chosen],model.board.selected)||
       !same([...geo.classes].sort((a,b)=>a-b),
        [...native.classes(task)].sort((a,b)=>a-b)))return null;
    const last=e=>e.action==='class';
    if(!events.some(last))return null;
    return {
      kind:'cross-source-square-inclusion-controls',nodeId:src.nodeId,
      sessionId:context.sessionId,index:context.index,
      shape:src.shape,rotationDegrees:src.rotation,
      verifiedGeometry:{parallel:geo.parallel,allAnglesRight:geo.right,
        allSidesEqual:geo.equalSides,rectangle:geo.rectangle,
        rhombus:geo.rhombus,square:geo.square},
      independentlyCalculatedClasses:[...geo.classes],
      originalControlEvents:events,
      propertyButtonsActuallyTested:[...tests],
      classesActuallySelected:[...chosen],
      nativeQuestionAnswer:model.answers[0],
      observedControlSequence:true,classificationConsistentWithGeometry:true,
      physicalMeasurementObserved:false,verbalProofAssessed:false,
      mentalReasoningOrderObserved:false,
      generalMasteryAssessed:false
    };
  }catch{return null;}
}

export function submittedCrossSourceSquareInclusionEvidence(task,model,record,context={}){
  return latestSubmissionMatches(model,record)?
    replayCrossSourceSquareInclusionEvidence(task,model,context):null;
}
