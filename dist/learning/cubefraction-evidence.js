// B31 unit-fraction cubes: recorded cell identities and saved quantities.
// The grid and block size come from the tool; no independent drawing,
// measurement, mental arithmetic or explanation is inferred from this record.
import * as cubes from './phase5/b31-model.js';
import {sessionTasks} from './bridges.js';
import {matchesNativeEvidenceTask,isEvidenceContext,hasExactKeys as keys,sameEvidence as same} from './evidence-contract.js';

const SOURCES=Object.freeze({
 fractionvolume:{nodeId:'mt_IlDaxVr60U',indices:[0,1,2]},
 term38:{nodeId:'mt_xfwv0M83mJ',indices:[3]},
 advancedWords38:{nodeId:'mt_3rTIyJDw7-',indices:[2]},
 modelChoice38:{nodeId:'mt_yqZiX6vS7D',indices:[1]}
});
const TYPE='x-m31-cubes',cp=structuredClone,text=x=>typeof x==='string'&&x.length<=1200;
const FIELDS=['estimate','count','amount','step','reading','unit','perLayer','layers','total','oneCube','base','volume','product','prose'];
const UNUSED=['estimate','count','amount','step','reading'];
const PLAN=['perLayer','layers','total'],PART=['oneCube','base'];
const PLAN_ISSUE='先填满并打开层：每层多少块、共有几层、全部多少块要对应。';
const PART_ISSUE='边长分成几份，要在长、宽、高三个方向都分；底面则只看一层的长和宽。';
const integer=(v,min,max)=>Number.isSafeInteger(v)&&v>=min&&v<=max;
const index=(v,max)=>typeof v==='string'&&/^(?:0|[1-9]\d*)$/.test(v)&&integer(Number(v),0,max)?Number(v):null;
const list=(v,n,p)=>Array.isArray(v)&&v.length===n&&Object.keys(v).length===n&&v.every(p);

export function cubeFractionBinding(task,context={}){
 try{
  if(!isEvidenceContext(context))return null;
  const source=Object.hasOwn(SOURCES,context.sessionId)?SOURCES[context.sessionId]:null;
  if(!source||!source.indices.includes(context.index)||!matchesNativeEvidenceTask(task,context,{type:TYPE,nodeId:source.nodeId}))return null;
  return{nodeId:source.nodeId,method:null,question:'每层的小块与整个盒子的块数怎样对应？小块的边长、底面积和体积为什么是不同的量？'};
 }catch{return null;}
}
// Replay can also inspect the identical associated/old-practice task, while
// only the exact native binding above can grant its optional guide/feedback.
const sourceTask=task=>task?.type===TYPE&&sessionTasks('fractionvolume').slice(0,3).some(original=>same(original,task));
const gcd=(a,b)=>{a=a<0n?-a:a;while(b){const next=a%b;a=b;b=next;}return a;};
const rational=(n,d=1n)=>{const g=gcd(n,d);return{n:n/g,d:d/g};};
const shown=q=>q.d===1n?String(q.n):`${q.n}/${q.d}`;
const quantity=q=>({numerator:String(q.n),denominator:String(q.d),text:shown(q)});
const multiply=(a,b)=>rational(a.n*b.n,a.d*b.d);
// Independently parse precisely the original B16 spelling and integer bounds.
// In these fixed sources all original cross-products fit safely in Number;
// the proof still keeps the exact integer numerator/denominator throughout.
function parse(raw){
 if(!text(raw))return null;
 const s=raw.trim().replace(/[−–]/g,'-');let n,d,m;
 if(m=/^(-?\d+)\s+(\d+)\/(\d+)$/.exec(s)){
  d=BigInt(m[3]);const part=BigInt(m[2]);if(d<1n||part>=d)return null;
  const whole=BigInt(m[1]);n=(whole<0n?-whole:whole)*d+part;if(m[1][0]==='-')n=-n;
 }else if(m=/^(-?\d+)\/(\d+)$/.exec(s)){n=BigInt(m[1]);d=BigInt(m[2]);}
 else if(/^[+-]?\d+(?:\.\d+)?$/.test(s)){d=10n**BigInt(s.split('.')[1]?.length||0);n=BigInt(s.replace('.',''));}
 else return null;
 if(n < -1000000000000n||n>1000000000000n||d<1n||d>100000000n)return null;
 return rational(n,d);
}
const equals=(raw,want)=>{const value=parse(raw);return!!value&&value.n*want.d===want.n*value.d;};
const fields=(e,names)=>keys(e.f,names)&&names.every(k=>text(e.f[k]));

export function replayCubeFractionEvidence(task,model){
 try{
  if(!sourceTask(task)||!keys(model,[...FIELDS,'answers','history','issue','board'])||!FIELDS.every(k=>text(model[k]))||
     !UNUSED.every(k=>model[k]==='')||!list(model.answers,0,()=>true)||!text(model.issue)||
     !Array.isArray(model.history)||Object.keys(model.history).length!==model.history.length||model.history.length>1200||
     !cubes.valid(task,model)||!cubes.inspect(task,model).correct)return null;
  const[w,d,h]=task.grid,total=w*d*h,perLayer=w*d,den=BigInt(task.den),edge=rational(1n,den),oneCube=multiply(multiply(edge,edge),edge);
  const dimensions=task.grid.map(n=>rational(BigInt(n),den)),base=multiply(dimensions[0],dimensions[1]),volume=multiply(base,dimensions[2]);
  const cell=i=>[i%w,Math.floor(i/perLayer),Math.floor(i/w)%d];
  const layerCounts=filled=>Array.from({length:h},(_,layer)=>filled.filter(i=>cell(i)[1]===layer).length);
  const board={first:{},bad:false,filled:[],spread:false,opened:false,turned:false,plan:null,part:null};
  const events=[];let issue='',turnRequests=0,failedPlans=0,failedParts=0,emptyRemovals=0;
  for(const[position,event]of model.history.entries()){
   if(!keys(event,['a','i','f'])||!text(event.a)||!text(event.i))return null;
   const action=event.a,before=board.filled.length;let changedCell=null,outcome='recorded',success=null;
   issue='';
   if(action==='fill'){
    const i=index(event.i,total-1);
    // The original button offers the next empty cell; the canvas callback may
    // offer another unfilled ray hit. A duplicate/full/foreign cell has no
    // corresponding original fill control. No camera angle is claimed here.
    if(i===null||board.filled.includes(i)||!fields(event,[]))return null;
    board.filled.push(i);board.plan=null;board.part=null;changedCell=i;outcome='cell-added';
   }else{
    if(event.i!=='')return null;
    if(action==='remove'){
     if(!fields(event,[]))return null;
     if(board.filled.length){changedCell=board.filled.pop();board.plan=null;board.part=null;outcome='cell-removed';}
     else{outcome='visible-empty-no-op';emptyRemovals++;}
    }else if(action==='spread'){
     if(!fields(event,[]))return null;board.spread=!board.spread;if(board.spread)board.opened=true;outcome=board.spread?'layers-opened':'layers-closed';
    }else if(action==='turn'){
     if(!fields(event,[]))return null;board.turned=true;turnRequests++;outcome='turn-request';
    }else if(action==='plan'){
     // Fill-to-capacity exposes these text inputs and this button even before
     // the first spread: that reachable failure must remain in the history.
     if(board.filled.length!==total||board.plan||!fields(event,PLAN))return null;
     board.first.plan??=cp(event.f);
     success=board.opened&&equals(event.f.perLayer,rational(BigInt(perLayer)))&&equals(event.f.layers,rational(BigInt(h)))&&equals(event.f.total,rational(BigInt(total)));
     if(success){board.plan=cp(event.f);board.part=null;outcome='plan-saved';}
     else{board.bad=true;issue=PLAN_ISSUE;failedPlans++;outcome='visible-plan-failure';}
    }else if(action==='part'){
     if(!board.plan||board.part||!fields(event,PART))return null;
     board.first.part??=cp(event.f);success=equals(event.f.oneCube,oneCube)&&equals(event.f.base,base);
     if(success){board.part=cp(event.f);outcome='part-saved';}
     else{board.bad=true;issue=PART_ISSUE;failedParts++;outcome='visible-part-failure';}
    }else return null;
   }
   events.push({index:position,action:'m31-'+action,sourceIndex:event.i,fields:cp(event.f),outcome,success,
    changedCell,coordinate:changedCell===null?null:cell(changedCell),beforeCount:before,afterCount:board.filled.length,layerCounts:layerCounts(board.filled),issue});
  }
  if(!same(board,model.board)||issue!==model.issue||!board.turned||!board.opened||board.filled.length!==total||!board.plan||!board.part)return null;
  // The last successful plan/part save hides precisely these fields. Any
  // later remove/fill would invalidate it and require another visible save.
  // Thus a retained final save fixes the current hidden roots byte for byte.
  if(!PLAN.every(k=>model[k]===board.plan[k])||!PART.every(k=>model[k]===board.part[k])||
     !equals(model.volume,volume)||!equals(model.product,volume)||model.unit!==task.unit+'³')return null;
  const filledCells=board.filled.map(i=>({index:i,coordinate:cell(i)})),layers=layerCounts(board.filled);
  if(!layers.every(n=>n===perLayer)||new Set(board.filled).size!==total||!same(quantity(multiply(rational(BigInt(total)),oneCube)),quantity(volume)))return null;
  return{
   kind:'cubefraction',unit:task.unit,cubicUnit:task.unit+'³',squareUnit:task.unit+'²',eventCount:events.length,events,
   retainedHistoryOnly:true,historyAtCapacity:events.length===1200,
   construction:{grid:task.grid.slice(),toolProvided:true,edge:quantity(edge),dimensions:dimensions.map(quantity),
    filledCells,layerCounts:layers,perLayer,layers:h,total,oneCube:quantity(oneCube),base:quantity(base),volume:quantity(volume),
    countTimesCube:quantity(multiply(rational(BigInt(total)),oneCube)),baseTimesHeight:quantity(multiply(base,dimensions[2])),
    plan:cp(board.plan),part:cp(board.part),first:cp(board.first),hadRecordedFailure:board.bad,
    failedPlans,failedParts,emptyRemovals,currentlySpread:board.spread,previouslyOpened:board.opened,turnRequests},
   submittedValues:[{field:'volume',raw:model.volume,value:quantity(parse(model.volume))},{field:'product',raw:model.product,value:quantity(parse(model.product))}],
   issue:model.issue,prose:model.prose,freeExplanationAssessed:false,independentMultiplicationAssessed:false,
   physicalMeasurementAssessed:false,spatialMasteryAssessed:false
  };
 }catch{return null;}
}
