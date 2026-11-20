// #318: source-bound, independently replayed unit-square area. The original
// B30 grader, model, learning history and task remain unchanged.
import * as b30 from './phase5/b30-model.js';
import {isEvidenceContext,matchesNativeEvidenceTask,hasExactKeys as keys,sameEvidence as same} from './evidence-contract.js';

const NODE='mt_6xNmQLzuqm';
const INDEX=[0,1];
const integer=Number.isSafeInteger;
const question='哪些单位正方形实际被铺到？逐格核对无重叠、无遗漏后，方片数为何就是平方厘米数？';
function geometry(task,context){
 if(!isEvidenceContext(context)||context.sessionId!=='gridarea'||!INDEX.includes(context.index)||
    !matchesNativeEvidenceTask(task,context,{type:'x-a30-grid',nodeId:NODE})||
    task.mode!=='tile'||task.unit!=='cm'||!integer(task.w)||!integer(task.h)||
    task.w<1||task.h<1||task.w*task.h>2000||
    !Array.isArray(task.cells)||!task.cells.length||task.cells.length>task.w*task.h||
    (task.questions?.length||0)!==0)return null;
 const cells=new Set();
 for(const cell of task.cells){
  if(!Array.isArray(cell)||cell.length!==2||!cell.every(integer))return null;
  const [x,y]=cell;
  if(x<0||y<0||x>=task.w||y>=task.h)return null;
  const i=y*task.w+x;
  if(cells.has(i))return null;
  cells.add(i);
 }
 return cells;
}
export function unitTileAreaBinding(task,context={}){
 const cells=geometry(task,context);
 return cells?{nodeId:NODE,kind:'unit-tile-area',method:null,question}:null;
}
function exactArea(raw,value){
 if(typeof raw!=='string'||raw.length>1200||!/^[+]?(?:0|[1-9]\d*)(?:\.0+)?$/.test(raw.trim()))return false;
 const s=raw.trim().replace(/^\+/,'').split('.')[0];
 try{return BigInt(s)===BigInt(value);}catch{return false;}
}
export function replayUnitTileAreaEvidence(task,model,context={}){
 try{
  const cells=geometry(task,context),initial=b30.initial(task);
  if(!cells||!keys(model,Object.keys(initial))||
     !Object.keys(initial).filter(k=>typeof initial[k]==='string').every(k=>
       typeof model[k]==='string'&&model[k].length<=1200&&
       (['area','unit','prose','issue'].includes(k)||model[k]===initial[k]))||
     !keys(model.board,Object.keys(initial.board))||
     !same(model.board.first,{})||model.board.bad!==false||
     !same(model.board.edges,[])||!same(model.board.corners,[])||
     !same(model.board.rects,[])||model.issue!==''||
     !Array.isArray(model.history)||model.history.length<cells.size||
     model.history.length>2000||Object.keys(model.history).length!==model.history.length||
     !same(model.answers,initial.answers)||!same(model.faceValues,initial.faceValues)||
     !same(model.calcValues,initial.calcValues)||model.unit!=='cm²'||
     !exactArea(model.area,cells.size)||!b30.valid(task,model)||
     !b30.inspect(task,model).correct)return null;
  const selected=[],events=[],toggles=[],undos=[],clears=[];
  for(const [at,e] of model.history.entries()){
   if(!keys(e,['a','i','f'])||!keys(e.f,[])||
      !['tile','undo','clear'].includes(e.a))return null;
   const before=[...selected];
   if(e.a==='tile'){
    if(typeof e.i!=='string'||!/^(0|[1-9]\d*)$/.test(e.i))return null;
    const index=Number(e.i);
    if(!integer(index)||!cells.has(index))return null;
    const old=selected.indexOf(index);
    if(old!==-1){selected.splice(old,1);toggles.push({at,index});}
    else selected.push(index);
   }else{
    if(e.i!=='')return null;
    if(e.a==='undo'){
     const index=selected.pop();
     undos.push({at,index:index??null});
    }else{
     clears.push({at,removed:[...selected]});
     selected.length=0;
    }
   }
   events.push({at,action:e.a,index:e.a==='tile'?Number(e.i):null,before,after:[...selected]});
  }
  if(selected.length!==cells.size||!same(selected,model.board.tiles)||
     !selected.every(i=>cells.has(i))||!same([...selected].sort((a,b)=>a-b),[...cells].sort((a,b)=>a-b)))return null;
  return {kind:'unit-tile-area',nodeId:NODE,sessionId:context.sessionId,index:context.index,
   unitSquareCentimeters:cells.size,areaSquareCentimeters:cells.size,
   requiredGridIndices:[...cells].sort((a,b)=>a-b),selectedOrder:[...selected],
   chronologicalRequests:events,toggles,undos,clears,
   toolProvidedGrid:true,studentPlacedTiles:true,areaUnit:'cm²',
   independentAreaExplanationAssessed:false,freeExplanationAssessed:false,
   learnerMasteryAssessed:false};
 }catch{return null;}
}
