// Grouped fraction advances have a different event contract from unit walks:
// forward adds chunk small units; backward removes exactly one small unit.
// This checks recorded mathematics without changing the B16 grader or v2 data.
import * as walks from './phase5/b16-model.js';
import {parse,norm} from './phase5/b15-model.js';
import {isEvidenceContext,matchesNativeEvidenceTask,sameEvidence as same,hasExactKeys as keys} from './evidence-contract.js';

const SOURCES=Object.freeze({
 manycopies:{indices:[0,1,2],nodeId:'mt_HJA2Oz-Zh1'},
 repeatfraction:{indices:[0,1,2],nodeId:'mt_TgHxujL81r'}
});

export function groupwalkBinding(task,context={}){
 if(!isEvidenceContext(context))return null;
 const source=Object.hasOwn(SOURCES,context.sessionId)?SOURCES[context.sessionId]:null;
 if(!source||!source.indices.includes(context.index)||
    !matchesNativeEvidenceTask(task,context,{type:'x-unitwalk',nodeId:source.nodeId}))return null;
 return {nodeId:source.nodeId,method:null,
  question:'一次前进接上几小份？退回按钮每次退几小份？每一小份的长度变了吗？怎样用每组的量和组数写出总量？'};
}

const fieldKeys=Object.keys(walks.fields);
const text=value=>typeof value==='string'&&value.length<=2000;
const integer=(value,min=0,max=2000)=>Number.isSafeInteger(value)&&value>=min&&value<=max;
const scalar=value=>text(value)&&/^[+-]?\d{1,12}(?:\.\d{1,8})?$/.test(value.trim())?Number(value):null;
const equal=(raw,n,d=1)=>{
 if(!text(raw))return false;
 const r=walks.rational(raw);
 return !!r&&r.every(Number.isSafeInteger)&&r[1]>0&&
  BigInt(r[0])*BigInt(d)===BigInt(n)*BigInt(r[1]);
};

// Reuse only the existing bounded expression parser for syntax. Independently
// require two factors with the reviewed mathematical roles and an exact result;
// a bare equal number is not evidence of recording groups times group amount.
const rationalNode=node=>{
 if(node?.op==='num'&&integer(node.v,0,1000000000))return [node.v,1];
 if(node?.op==='/'&&node.a?.op==='num'&&node.b?.op==='num'&&
    integer(node.a.v,0,1000000000)&&integer(node.b.v,1,1000000000))return [node.a.v,node.b.v];
 return null;
};
const sameRational=(r,n,d=1)=>!!r&&BigInt(r[0])*BigInt(d)===BigInt(n)*BigInt(r[1]);
function multiplicationMatches(raw,n,d,chunk){
 if(!text(raw))return false;
 const sides=raw.split('=');if(sides.length!==2)return false;
 // The syntax parser stores Number leaves. Check the original literals before
 // that conversion: 3.0000000000000001 must never become an exact integer 3.
 // These six equations require integer factors/numerators/denominators; decimal
 // spellings with zero tails preserve those integers without numeric rounding.
 // Inspect exactly the token stream the parser will see after normalization;
 // otherwise whitespace after a decimal point could hide its nonzero tail.
 const literals=norm(raw).match(/\d+(?:\.\d+)?/g);
 if(!literals||literals.some(literal=>{
  const [whole,fraction='']=literal.split('.');
  return !/^0*$/.test(fraction)||BigInt(whole)>1000000000n;
 }))return false;
 const trees=sides.map(parse),groups=n/chunk;
 return [trees,[...trees].reverse()].some(([product,result])=>{
  if(product.op!=='*'||!sameRational(rationalNode(result),n,d))return false;
  const left=rationalNode(product.a),right=rationalNode(product.b);
  if(!left||!right)return false;
  const roles=(sameRational(left,chunk,d)&&sameRational(right,groups))||
   (sameRational(right,chunk,d)&&sameRational(left,groups));
  return roles&&BigInt(left[0])*BigInt(right[0])*BigInt(d)===
   BigInt(n)*BigInt(left[1])*BigInt(right[1]);
 });
}

export function replayGroupwalkEvidence(task,model){
 try{
  if(task?.type!=='x-unitwalk'||!integer(task.n,1)||!integer(task.d,2,12)||
     !integer(task.chunk,1)||task.n%task.chunk!==0||task.whole!==true||
     ['copies','decimal','halfBound'].some(key=>Object.hasOwn(task,key))||
     !keys(model,[...fieldKeys,'board','history','issue'])||
     !fieldKeys.every(key=>text(model[key]))||model.issue!==''||
     !Array.isArray(model.history)||model.history.length<2||model.history.length>2000)return null;
  for(const flag of ['bounds','buy'])if(task[flag]!==undefined&&typeof task[flag]!=='boolean')return null;
  if(task.axisMax!==undefined&&!integer(task.axisMax,1))return null;
  const {n,d,chunk}=task,groups=n/chunk,whole=Math.floor(n/d),remainder=n%d;
  const ceiling=whole+(remainder?1:0),limit=(ceiling+1)*d;
  const b={parts:1,steps:[],first:null},steps=[];
  let advances=0,retreats=0;
  for(const [index,event] of model.history.entries()){
   if(!keys(event,['action','data'])||!keys(event.data,['fields'])||
      !keys(event.data.fields,fieldKeys)||!fieldKeys.every(key=>text(event.data.fields[key]))||
      scalar(event.data.fields.parts)!==d)return null;
   if(index===0){
    if(event.action!=='partition')return null;
    b.parts=d;continue;
   }
   const from=b.steps.length;let delta;
   if(event.action==='walk'){
    // Preserve the original PRE-move guard. A legitimate grouped advance may
    // cross the limit; applying a new post-move cap would reject valid routes.
    if(from>=limit)return null;
    delta=chunk;b.first??=event.data.fields.parts;
    for(let i=1;i<=chunk;i++)b.steps.push(from+i);
    advances++;
   }else if(event.action==='walk-back'){
    if(from===0)return null;
    delta=-1;b.steps.pop();retreats++;
   }else return null;
   steps.push({delta,from:[from,d],to:[from+delta,d]});
  }
  if(!advances||!same(b,model.board)||b.steps.length!==n||advances*chunk-retreats!==n||
     scalar(model.parts)!==d||!equal(model.answer,n,d)||
     !equal(model.whole,whole)||!equal(model.remainder,remainder,d)||
     !multiplicationMatches(model.equation,n,d,chunk))return null;
  if(task.bounds&&(scalar(model.left)!==whole||scalar(model.right)!==ceiling))return null;
  if(task.buy&&scalar(model.total)!==ceiling)return null;
  if(!walks.valid(task,model)||!walks.inspect(task,model).correct)return null;
  return {start:[0,d],end:[n,d],unit:[1,d],group:[chunk,d],groups,
   steps,advances,retreats,whole,remainder:[remainder,d],
   bounds:task.bounds?[whole,ceiling]:null,purchase:task.buy?ceiling:null};
 }catch{return null;}
}
