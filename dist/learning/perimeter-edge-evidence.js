// #310: replay only six reviewed B30 native grid-perimeter visits.
// Original SVG segment clicks are actions. The displayed formula, selected
// count, and original grader alone do not establish an independent proof.
import * as b30 from './phase5/b30-model.js';
import {boundaryRuns} from './phase5/b30-geometry.js';
import {isEvidenceContext,matchesNativeEvidenceTask,hasExactKeys as keys,sameEvidence as same} from './evidence-contract.js';

const SOURCES=Object.freeze({
 walkperim:{nodeId:'mt_wE7-Gs9ENL',indices:[0,1,2]},
 polyperim:{nodeId:'mt_WtcFrxGOgw',indices:[0]},
 lperim:{nodeId:'mt_n0AlyLQwC9',indices:[0,1]}
});
const question='怎样沿着外边每条直段走完一圈？长边要算实际单位长度，凹角不能漏，里面的分界不计入。';
const integer=n=>Number.isSafeInteger(n);
const edgeKey=(x1,y1,x2,y2)=>x1===x2?
 'v:'+x1+':'+Math.min(y1,y2):'h:'+y1+':'+Math.min(x1,x2);

// Independently enumerate every exposed unit edge, rather than accepting the
// clicked number of straight runs as a claimed perimeter.
function geometry(task){
 const cells=task.cells;
 if(!integer(task.w)||!integer(task.h)||task.w<1||task.h<1||
    !Array.isArray(cells)||!cells.length||cells.length>task.w*task.h)return null;
 const occupied=new Set();
 for(const cell of cells){
  if(!Array.isArray(cell)||cell.length!==2||!integer(cell[0])||!integer(cell[1])||
    cell[0]<0||cell[1]<0||cell[0]>=task.w||cell[1]>=task.h)return null;
  const k=cell.join(',');
  if(occupied.has(k))return null;
  occupied.add(k);
 }
 const exterior=new Set();
 for(const [x,y] of cells){
  if(!occupied.has(x+','+(y-1)))exterior.add(edgeKey(x,y,x+1,y));
  if(!occupied.has((x+1)+','+y))exterior.add(edgeKey(x+1,y,x+1,y+1));
  if(!occupied.has(x+','+(y+1)))exterior.add(edgeKey(x,y+1,x+1,y+1));
  if(!occupied.has((x-1)+','+y))exterior.add(edgeKey(x,y,x,y+1));
 }
 const originalRuns=boundaryRuns(cells),seen=new Set(),runs=[];
 if(!originalRuns.length||originalRuns.length>2000)return null;
 for(const [index,segment] of originalRuns.entries()){
  if(!Array.isArray(segment)||segment.length!==2||
     !segment.every(p=>Array.isArray(p)&&p.length===2&&p.every(integer)))return null;
  const [[x1,y1],[x2,y2]]=segment;
  const horizontal=y1===y2&&x1!==x2;
  const vertical=x1===x2&&y1!==y2;
  if(!horizontal&&!vertical)return null;
  const len=Math.abs(x2-x1)+Math.abs(y2-y1),units=[];
  for(let n=0;n<len;n++){
   const x=horizontal?Math.min(x1,x2)+n:x1;
   const y=horizontal?y1:Math.min(y1,y2)+n;
   const k=horizontal?edgeKey(x,y,x+1,y):edgeKey(x,y,x,y+1);
   if(!exterior.has(k)||seen.has(k))return null;
   seen.add(k);units.push(k);
  }
  runs.push({index,from:[x1,y1],to:[x2,y2],length:len,unitEdges:units});
 }
 const length=runs.reduce((s,r)=>s+r.length,0);
 if(seen.size!==exterior.size||length!==exterior.size)return null;
 return {perimeter:length,runs,exteriorUnitEdges:[...exterior].sort(),
  areaUnitSquares:occupied.size};
}

export function perimeterEdgeBinding(task,context={}){
 if(!isEvidenceContext(context))return null;
 const source=Object.hasOwn(SOURCES,context.sessionId)?SOURCES[context.sessionId]:null;
 if(!source||!source.indices.includes(context.index)||
    !matchesNativeEvidenceTask(task,context,{type:'x-a30-grid',nodeId:source.nodeId})||
    task.mode!=='edge'||task.unit!=='cm'||!geometry(task))return null;
 return {nodeId:source.nodeId,kind:'area-edge',method:null,question};
}

function exactNonnegative(raw,want){
 if(typeof raw!=='string'||raw.length>1200||!/^\+?\d+(?:\.\d+)?$/.test(raw.trim()))return false;
 try{
  const parts=raw.trim().replace(/^\+/,'').split('.');
  const denom=10n**BigInt(parts[1]?.length||0);
  return BigInt(parts.join(''))===BigInt(want)*denom;
 }catch{return false;}
}
export function replayPerimeterEdgeEvidence(task,model,context={}){
 try{
  const source=perimeterEdgeBinding(task,context),shape=geometry(task),initial=b30.initial(task);
  if(!source||!shape||!keys(model,Object.keys(initial))||
    !keys(model.board,Object.keys(initial.board))||
    !same(model.board.first,{})||model.board.bad!==false||
    !same(model.board.tiles,[])||!same(model.board.corners,[])||
    !same(model.board.rects,[])||model.issue!==''||
    !Array.isArray(model.history)||model.history.length<shape.runs.length||
    model.history.length>2000||Object.keys(model.history).length!==model.history.length||
    !Array.isArray(model.answers)||model.answers.length!==(task.questions?.length||0)||
    !Object.keys(initial).filter(k=>typeof initial[k]==='string').every(k=>
      typeof model[k]==='string'&&model[k].length<=1200&&
      (['perimeter','unit','prose','issue'].includes(k)||model[k]===initial[k]))||
    !same(model.faceValues,initial.faceValues)||!same(model.calcValues,initial.calcValues)||
    model.unit!==task.unit||!exactNonnegative(model.perimeter,shape.perimeter))return null;
  if(!model.answers.every((answer,i)=>integer(task.questions[i].value)&&
    exactNonnegative(answer,task.questions[i].value)))return null;
  // Reproduce the original toggling, last-selected undo and clear semantics;
  // preserve every request, including repeats, failed attempts and corrections.
  const selected=[],events=[],clears=[],undone=[],toggles=[];
  for(const [at,event] of model.history.entries()){
   if(!keys(event,['a','i','f'])||!keys(event.f,[])||
      !['edge','undo','clear'].includes(event.a))return null;
   const before=[...selected];
   let run=null,action=event.a;
   if(action==='edge'){
    if(typeof event.i!=='string'||! /^(0|[1-9]\d*)$/.test(event.i))return null;
    const index=Number(event.i);
    if(!integer(index)||index<0||index>=shape.runs.length)return null;
    run=shape.runs[index];
    const old=selected.indexOf(index);
    if(old>=0){selected.splice(old,1);toggles.push({at,index,removedLength:run.length});}
    else selected.push(index);
   }else{
    if(event.i!=='')return null;
    if(action==='undo'){
     const index=selected.pop();
     undone.push({at,index:index??null,length:index===undefined?0:shape.runs[index].length});
    }else{
     clears.push({at,removed:[...selected]});
     selected.length=0;
    }
   }
   events.push({at,action,index:run?.index??null,length:run?.length??0,
    before,after:[...selected]});
  }
  if(selected.length!==shape.runs.length||
    !selected.every((n,i)=>integer(n)&&selected.indexOf(n)===i)||
    !same(selected,model.board.edges)||
    !shape.runs.every(r=>selected.includes(r.index))||
    !b30.valid(task,model)||!b30.inspect(task,model).correct)return null;
  return {kind:'area-edge',nodeId:source.nodeId,sessionId:context.sessionId,index:context.index,
   unit:task.unit,perimeter:String(shape.perimeter),areaUnitSquares:shape.areaUnitSquares,
   runs:shape.runs.map(({index,from,to,length})=>({index,from,to,length})),
   unitEdgesVerified:shape.exteriorUnitEdges.length,chronologicalRequests:events,
   clears,undone,toggles,selectedOrder:[...selected],
   answers:task.questions?.map((q,i)=>({label:q.label,raw:model.answers[i],expected:String(q.value)}))||[],
   toolProvidedGeometry:true,studentConstructedShape:false,internalSeamsCounted:false,
   independentLengthExplanationAssessed:false,freeExplanationAssessed:false,
   learnerMasteryAssessed:false};
 }catch{return null;}
}
