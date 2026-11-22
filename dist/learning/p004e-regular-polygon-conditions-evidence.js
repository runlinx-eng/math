// #342 / P004e: four native regularity positions only, development evidence.
// Geometry is measured from original vertices, not copied from native class labels.
// Do not modify the original grader, strict-A registries, or release files.
import * as native from './phase5/b23-model.js';
import {scenario} from './phase5/b23-geometry.js';
import {isEvidenceContext,matchesNativeEvidenceTask,
  latestSubmissionMatches,hasExactKeys as keys,sameEvidence as same}
  from './evidence-contract.js';

const SOURCES=Object.freeze({
  'regularity:0':{nodeId:'mt_8H2kO4k2B9',shape:'pentagon',rotation:0,answers:['5','equal']},
  'regularity:1':{nodeId:'mt_8H2kO4k2B9',shape:'square',rotation:0,answers:['yes']},
  'regularity:2':{nodeId:'mt_8H2kO4k2B9',shape:'rectangle',rotation:0,answers:['irregular']},
  'regularity:3':{nodeId:'mt_8H2kO4k2B9',shape:'rhombus',rotation:0,answers:['irregular']}
});
const EPS=1e-7;
const close=(a,b)=>Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<EPS;
const dot=(a,b)=>a[0]*b[0]+a[1]*b[1];
const cross=(a,b)=>a[0]*b[1]-a[1]*b[0];

function sourceFor(task,context){
  if(!isEvidenceContext(context))return null;
  const s=SOURCES[context.sessionId+':'+context.index];
  if(!s||!matchesNativeEvidenceTask(task,context,
    {type:'x-s23-quad',nodeId:s.nodeId})||
    !keys(task,['type','prompt','shape','rotation','questions'])||
    task.shape!==s.shape||task.rotation!==s.rotation||
    !Array.isArray(task.questions)||
    !same(task.questions.map(q=>String(q.value)),s.answers))return null;
  return s;
}

// Independent straight-edge lengths and interior angles, including the
// five-sided case that cannot be classified by a quadrilateral-only formula.
function polygonProperties(task){
  const vertices=scenario(task.shape,task.rotation);
  const n=vertices.length;
  if(![4,5].includes(n)||!vertices.every(p=>Array.isArray(p)&&p.length===2&&
    p.every(Number.isFinite)))return null;
  const edges=vertices.map((p,i)=>[
    vertices[(i+1)%n][0]-p[0],vertices[(i+1)%n][1]-p[1]]);
  const lengths=edges.map(v=>Math.hypot(...v));
  if(lengths.some(x=>x<EPS))return null;
  const turns=edges.map((v,i)=>cross(v,edges[(i+1)%n]));
  if(turns.some(x=>Math.abs(x)<EPS)||
    turns.some(x=>Math.sign(x)!==Math.sign(turns[0])))return null;
  const area2=vertices.reduce((s,p,i)=>
    s+cross(p,vertices[(i+1)%n]),0);
  if(Math.abs(area2)<EPS)return null;
  const angles=edges.map((v,i)=>{
    const next=edges[(i+1)%n];
    const cosine=Math.max(-1,Math.min(1,
      -dot(v,next)/(lengths[i]*lengths[(i+1)%n])));
    return Math.acos(cosine)*180/Math.PI;
  });
  const allSidesEqual=lengths.every(x=>close(x,lengths[0]));
  const allAnglesEqual=angles.every(x=>close(x,angles[0]));
  const allAnglesRight=angles.every(x=>close(x,90));
  const oppositePairsParallel=n===4&&
    close(cross(edges[0],edges[2]),0)&&
    close(cross(edges[1],edges[3]),0);
  const rectangle=n===4&&oppositePairsParallel&&allAnglesRight;
  const rhombus=n===4&&oppositePairsParallel&&allSidesEqual;
  const square=rectangle&&rhombus;
  const regular=allSidesEqual&&allAnglesEqual;
  const classes=[...(n===4?[0]:[]),
    ...(oppositePairsParallel?[1]:[]),...(rectangle?[2]:[]),
    ...(rhombus?[3]:[]),...(square?[4]:[]),...(regular?[5]:[])];
  return {vertices,sideLengths:lengths,interiorAnglesDegrees:angles,
    allSidesEqual,allAnglesEqual,allAnglesRight,
    oppositePairsParallel,rectangle,rhombus,square,regular,classes};
}

export function regularPolygonConditionsBinding(task,context={}){
  const s=sourceFor(task,context);
  return s?{nodeId:s.nodeId,kind:'regular-polygon-edge-angle-controls',
    question:'Are the original three property checks and family selections consistent with independently measured edge lengths and angles?'}:null;
}

export function replayRegularPolygonConditionsEvidence(task,model,context={}){
  try{
    const src=sourceFor(task,context),geo=src&&polygonProperties(task);
    if(!geo||!native.valid(task,model)||!native.inspect(task,model).correct||
      !keys(model,Object.keys(native.initial(task,1)))||
      !keys(model.board,['first','tested','selected'])||
      model.issue!==''||!same(model.answers,src.answers)||
      !Array.isArray(model.history)||model.history.length<4||
      Object.keys(model.history).length!==model.history.length)return null;
    const tested=new Set(),selected=new Set(),events=[];
    let classificationActions=0;
    for(const [step,e] of model.history.entries()){
      if(!keys(e,['a','d','f'])||!keys(e.f,[])||
        !['test','class','reset'].includes(e.a))return null;
      if(e.a==='reset'){
        if(!keys(e.d,[]))return null;
        tested.clear();selected.clear();
        events.push({step,action:'reset'});
        continue;
      }
      if(!keys(e.d,['index'])||typeof e.d.index!=='string'||
        !/^(0|[1-5])$/.test(e.d.index))return null;
      const index=Number(e.d.index);
      if(e.a==='test'){
        if(index>2)return null;
        tested.add(index);
      }else{
        // Original UI hides family buttons until the three property checks.
        if(tested.size!==3)return null;
        classificationActions++;
        if(selected.has(index))selected.delete(index);else selected.add(index);
      }
      events.push({step,action:e.a,index});
    }
    if(classificationActions<1||tested.size!==3||
      !same([...tested].sort((a,b)=>a-b),[0,1,2])||
      !same([...tested],model.board.tested)||
      !same([...selected],model.board.selected)||
      !same([...selected].sort((a,b)=>a-b),geo.classes)||
      !same([...native.classes(task)].sort((a,b)=>a-b),geo.classes))
      return null;
    return {kind:'regular-polygon-edge-angle-controls',nodeId:src.nodeId,
      sessionId:context.sessionId,index:context.index,shape:task.shape,
      observedControlSequence:true,originalControlEvents:events,
      propertyButtonsActuallyTested:[...tested],
      classesActuallySelected:[...selected],
      independentlyCalculatedClasses:geo.classes,
      independentlyMeasured:{sideLengths:geo.sideLengths,
        interiorAnglesDegrees:geo.interiorAnglesDegrees,
        allSidesEqual:geo.allSidesEqual,allAnglesEqual:geo.allAnglesEqual,
        allAnglesRight:geo.allAnglesRight,
        oppositePairsParallel:geo.oppositePairsParallel,
        regularPolygon:geo.regular},
      originalAnswers:src.answers,classificationConsistentWithGeometry:true,
      virtualGeometryOnly:true,physicalMeasurementObserved:false,
      verbalProofAssessed:false,mentalReasoningOrderObserved:false,
      generalMasteryAssessed:false};
  }catch{return null;}
}

export function submittedRegularPolygonConditionsEvidence(task,model,record,context={}){
  return latestSubmissionMatches(model,record)?
    replayRegularPolygonConditionsEvidence(task,model,context):null;
}
