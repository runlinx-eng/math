// #342 / P001: source-bound perimeter-versus-area evidence for gridarea:2.
// Candidate-only module: no shared adapter registration or formal A promotion.
// The original B30 task, grader and State-v2 format are never changed.
import * as b30 from './phase5/b30-model.js';
import {boundaryRuns} from './phase5/b30-geometry.js';
import {
 isEvidenceContext,matchesNativeEvidenceTask,latestSubmissionMatches,
 hasExactKeys as keys,sameEvidence as same
} from './evidence-contract.js';

const NODE='mt_6xNmQLzuqm';
const PROMPT='还是这片地，沿外边走一圈；面积和围边是两种量。';
const TASK_SHA256='79cadc478abf5d9d742c2ff5cd2cb0f090cbbbef9dcd21bc34d5451a1900997f';
const QUESTION='为什么这里面积是 12 cm²，而走完四段外边的周长是 14 cm？';
const integer=Number.isSafeInteger;
const edgeKey=(x1,y1,x2,y2)=>x1===x2?
 'v:'+x1+':'+Math.min(y1,y2):'h:'+y1+':'+Math.min(x1,x2);

function shapeFor(task,context){
 if(!isEvidenceContext(context)||context.sessionId!=='gridarea'||context.index!==2||
    !matchesNativeEvidenceTask(task,context,{type:'x-a30-grid',nodeId:NODE})||
    task.mode!=='edge'||task.prompt!==PROMPT||task.w!==4||task.h!==3||
    task.unit!=='cm'||!Array.isArray(task.cells)||task.cells.length!==12||
    !Array.isArray(task.questions)||task.questions.length!==1||
    !keys(task.questions[0],['label','value'])||
    task.questions[0].label!=='里面有多少平方厘米'||task.questions[0].value!==12)return null;
 const occupied=new Set();
 for(const cell of task.cells){
  if(!Array.isArray(cell)||cell.length!==2||!cell.every(integer))return null;
  const [x,y]=cell;
  if(x<0||x>=4||y<0||y>=3||occupied.has(x+','+y))return null;
  occupied.add(x+','+y);
 }
 for(let y=0;y<3;y++)for(let x=0;x<4;x++)
  if(!occupied.has(x+','+y))return null;
 // Independently count the 12 unit squares and exposed unit edges. No
 // interior seam may be counted as perimeter, even if the original grader
 // happens to accept four selected straight segments.
 const exterior=new Set();
 for(const [x,y] of task.cells){
  if(!occupied.has(x+','+(y-1)))exterior.add(edgeKey(x,y,x+1,y));
  if(!occupied.has((x+1)+','+y))exterior.add(edgeKey(x+1,y,x+1,y+1));
  if(!occupied.has(x+','+(y+1)))exterior.add(edgeKey(x,y+1,x+1,y+1));
  if(!occupied.has((x-1)+','+y))exterior.add(edgeKey(x,y,x,y+1));
 }
 if(exterior.size!==14)return null;
 const original=boundaryRuns(task.cells);
 if(!Array.isArray(original)||original.length!==4)return null;
 const seen=new Set(),runs=[];
 for(const [index,segment] of original.entries()){
  if(!Array.isArray(segment)||segment.length!==2||
     !segment.every(p=>Array.isArray(p)&&p.length===2&&p.every(integer)))return null;
  const [[x1,y1],[x2,y2]]=segment;
  const horizontal=y1===y2&&x1!==x2,vertical=x1===x2&&y1!==y2;
  if(!horizontal&&!vertical)return null;
  const length=Math.abs(x2-x1)+Math.abs(y2-y1);
  for(let offset=0;offset<length;offset++){
   const x=horizontal?Math.min(x1,x2)+offset:x1;
   const y=horizontal?y1:Math.min(y1,y2)+offset;
   const edge=horizontal?edgeKey(x,y,x+1,y):edgeKey(x,y,x,y+1);
   if(!exterior.has(edge)||seen.has(edge))return null;
   seen.add(edge);
  }
  runs.push({index,from:[x1,y1],to:[x2,y2],length});
 }
 if(seen.size!==exterior.size||
    !same(runs.map(r=>r.length).sort((a,b)=>a-b),[3,3,4,4]))return null;
 return {area:occupied.size,perimeter:exterior.size,runs,exterior:[...exterior].sort()};
}

export function gridareaPerimeterContrastBinding(task,context={}){
 return shapeFor(task,context)?
  {nodeId:NODE,kind:'gridarea-perimeter-contrast',method:null,question:QUESTION}:null;
}

// Exact nonnegative decimal equality: no exponent, tolerance, Infinity,
// near misses or a change of unit may constitute strict mathematical proof.
function exactNumber(raw,want){
 if(typeof raw!=='string'||raw.length>1200||
    !/^\+?(?:0|[1-9]\d*)(?:\.\d+)?$/.test(raw.trim()))return false;
 try{
  const [whole,fraction='']=raw.trim().replace(/^\+/,'').split('.');
  return BigInt(whole+fraction)===BigInt(want)*10n**BigInt(fraction.length);
 }catch{return false;}
}

export function replayGridareaPerimeterContrastEvidence(task,model,context={}){
 try{
  const shape=shapeFor(task,context),initial=b30.initial(task);
  if(!shape||!keys(model,Object.keys(initial))||
     !keys(model.board,Object.keys(initial.board))||
     !same(model.board.first,{})||model.board.bad!==false||
     !same(model.board.tiles,[])||!same(model.board.corners,[])||
     !same(model.board.rects,[])||model.issue!==''||
     !same(model.faceValues,initial.faceValues)||!same(model.calcValues,initial.calcValues)||
     !Array.isArray(model.answers)||model.answers.length!==1||
     Object.keys(model.answers).length!==1||!exactNumber(model.answers[0],shape.area)||
     !Object.keys(initial).filter(k=>typeof initial[k]==='string').every(k=>
      typeof model[k]==='string'&&model[k].length<=1200&&
      (['perimeter','unit','prose','issue'].includes(k)||model[k]===initial[k]))||
     model.unit!=='cm'||!exactNumber(model.perimeter,shape.perimeter)||
     !Array.isArray(model.history)||model.history.length<shape.runs.length||
     model.history.length>2000||Object.keys(model.history).length!==model.history.length)return null;
  const selected=[],events=[],toggles=[],undos=[],clears=[];
  for(const [at,event] of model.history.entries()){
   if(!keys(event,['a','i','f'])||!keys(event.f,[])||
      !['edge','undo','clear'].includes(event.a))return null;
   const before=[...selected];
   let index=null,length=0;
   if(event.a==='edge'){
    if(typeof event.i!=='string'||!/^(0|[1-9]\d*)$/.test(event.i))return null;
    index=Number(event.i);
    if(!integer(index)||index<0||index>=shape.runs.length)return null;
    length=shape.runs[index].length;
    const previous=selected.indexOf(index);
    if(previous>=0){
     selected.splice(previous,1);toggles.push({at,index,removedLength:length});
    }else selected.push(index);
   }else{
    if(event.i!=='')return null;
    if(event.a==='undo'){
     const removed=selected.pop();
     undos.push({at,index:removed??null,length:removed===undefined?0:shape.runs[removed].length});
    }else{
     clears.push({at,removed:[...selected]});selected.length=0;
    }
   }
   events.push({at,action:event.a,index,length,before,after:[...selected]});
  }
  if(selected.length!==shape.runs.length||
     !shape.runs.every(run=>selected.includes(run.index))||
     !same(selected,model.board.edges)||
     !b30.valid(task,model)||!b30.inspect(task,model).correct)return null;
  return {
   kind:'gridarea-perimeter-contrast',nodeId:NODE,
   sessionId:context.sessionId,index:context.index,
   frozenTaskSha256:TASK_SHA256,
   areaSquareCentimeters:shape.area,perimeterCentimeters:shape.perimeter,
   straightRunCount:shape.runs.length,
   runs:shape.runs,exteriorUnitEdgesVerified:shape.exterior.length,
   interiorSeamsCounted:false,selectedOrder:[...selected],
   chronologicalRequests:events,toggles,undos,clears,
   answers:[{label:task.questions[0].label,raw:model.answers[0],expected:String(shape.area)}],
   toolProvidedGeometry:true,studentPlacedAreaTiles:false,
   independentPerimeterFormulaAssessed:false,independentAreaStrategyAssessed:false,
   freeExplanationAssessed:false,learnerMasteryAssessed:false
  };
 }catch{return null;}
}

// Only the latest saved Check may authorize display of this candidate proof.
// An earlier correct attempt followed by an unsubmitted edit is not current.
export function submittedGridareaPerimeterContrastEvidence(task,model,record,context={}){
 if(!latestSubmissionMatches(model,record))return null;
 return replayGridareaPerimeterContrastEvidence(task,model,context);
}
