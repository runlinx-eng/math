// B24 transformations: replay the actual parameter choices from the ORIGINAL
// shape each time. Images and measurement readouts are produced by the tool;
// they are not evidence of an independent construction, measurement or proof.
import * as transforms from './phase5/b24-model.js';
import {matchesNativeEvidenceTask,sameEvidence as same,hasExactKeys as keys} from './evidence-contract.js';

const SOURCES=Object.freeze({
 pointmove:{indices:[0,1,2],nodeId:'mt_Uq5vYqboCR'},
 gridmotion:{indices:[0,1,2],nodeId:'mt_SH7QgFl8-v'},
 flipandmove:{indices:[0,1,2],nodeId:'mt_efOeaGFyGM'},
 geometrylab:{indices:[0,1,2],nodeId:'mt_RdfzwInyAj'},
 axisrules:{indices:[0,1,2],nodeId:'mt_lxaM6iVpdr'},
 gridchange:{indices:[0,1,2],nodeId:'mt_K0Y15w48SY'},
 growshape:{indices:[0,1,2],nodeId:'mt_y-BuQAfw4B'},
 similar37:{indices:[1],nodeId:'mt_2OtRUM_0zW'},
 tooladv39:{indices:[1],nodeId:'mt_ZJC7JnnPCu'}
});

export function transformBinding(task,context={}){
 if(!context||typeof context!=='object'||Array.isArray(context))return null;
 const source=Object.hasOwn(SOURCES,context.sessionId)?SOURCES[context.sessionId]:null;
 if(!source||!source.indices.includes(context.index)||
    !matchesNativeEvidenceTask(task,context,{type:'x-p24-transform',nodeId:source.nodeId}))return null;
 const question={
  move:'从原来的图形出发，每个点的横向、竖向变化分别是多少？对应点有没有都按同一个方向和距离移动？',
  mirror:'沿这条镜线翻过去，哪个坐标改变了？对应点到镜线的距离怎样比较？',
  turn:'这次绕哪个中心、朝哪个方向转了多少？从原图出发，中心与各个对应点的位置怎样核对？',
  scale:'从同一个中心出发，各点到中心的距离乘了几？对应边长和对应角会怎样变化？'
 }[task.goal?.kind];
 return question?{nodeId:source.nodeId,question,method:null}:null;
}

const text=v=>typeof v==='string'&&v.length<=1500;
const integer=(v,min,max)=>Number.isSafeInteger(v)&&v>=min&&v<=max;
const fieldNames=['x','y','item','dx','dy','axis','angle','cx','cy','factor','predX','predY','kind','slot','amplitude','prose'];
const operationFields=['dx','dy','axis','angle','cx','cy','factor'];
const activeFields={move:['dx','dy'],mirror:['axis'],turn:['angle','cx','cy'],scale:['factor','cx','cy']};
const clone=v=>structuredClone(v);
const abs=n=>n<0n?-n:n;
function rational(n,d=1n){
 if(d===0n)throw Error('zero denominator');
 if(d<0n){n=-n;d=-d;}
 let a=abs(n),b=d;while(b){const next=a%b;a=b;b=next;}
 return{n:n/a,d:d/a};
}
const R=n=>rational(BigInt(n));
const add=(a,b)=>rational(a.n*b.d+b.n*a.d,a.d*b.d);
const negate=a=>({n:-a.n,d:a.d});
const sub=(a,b)=>add(a,negate(b));
const mul=(a,b)=>rational(a.n*b.n,a.d*b.d);
const equal=(a,b)=>a.n===b.n&&a.d===b.d;
const str=a=>a.d===1n?String(a.n):String(a.n)+'/'+String(a.d);
const number=a=>Number(a.n)/Number(a.d);
const pointStrings=points=>points.map(p=>p.map(str));
const pointNumbers=points=>points.map(p=>p.map(number));
const pointEqual=(a,b)=>a.length===b.length&&a.every((v,i)=>equal(v,b[i]));
// The original input grammar includes decimals, fractions and mixed numbers.
// Parse with bounded integer arithmetic: a near-integer decimal is never an
// integer parameter or an exactly correct answer merely because Number rounds.
function parse(value){
 if(!text(value))return null;
 const s=value.trim();if(s.length>200)return null;
 let m=s.match(/^(-?\d{1,64})\s+(\d{1,64})\/(\d{1,64})$/);
 if(m){const whole=BigInt(m[1]),d=BigInt(m[3]);return d?rational(whole*d+(m[1].startsWith('-')?-1n:1n)*BigInt(m[2]),d):null;}
 m=s.match(/^(-?\d{1,64})\/(\d{1,64})$/);
 if(m)return BigInt(m[2])?rational(BigInt(m[1]),BigInt(m[2])):null;
 m=s.match(/^(-?)(\d{1,64})(?:\.(\d{1,64}))?$/);
 if(!m)return null;
 const fraction=m[3]||'',d=10n**BigInt(fraction.length);
 return rational((m[1]?-1n:1n)*(BigInt(m[2])*d+BigInt(fraction||'0')),d);
}
function inputInteger(value,min,max){
 const v=parse(value);return v&&v.d===1n&&v.n>=BigInt(min)&&v.n<=BigInt(max)?Number(v.n):null;
}
function operation(kind,f){
 if(operationFields.some(k=>!activeFields[kind]?.includes(k)&&f[k]!==''))return null;
 if(kind==='move'){
  const dx=inputInteger(f.dx,-12,12),dy=inputInteger(f.dy,-12,12);
  return dx===null||dy===null?null:{value:{kind,dx,dy},factor:R(1)};
 }
 if(kind==='mirror')return ['x','y','y=x','y=-x'].includes(f.axis)?{value:{kind,line:f.axis},factor:R(1)}:null;
 const cx=inputInteger(f.cx,-8,8),cy=inputInteger(f.cy,-8,8);if(cx===null||cy===null)return null;
 if(kind==='turn'){
  // -180 is accepted by the original model, but is not a choice in this UI.
  if(!['90','-90','180'].includes(f.angle))return null;
  return{value:{kind,angle:Number(f.angle),center:[cx,cy]},factor:R(1)};
 }
 if(kind==='scale'){
  const factor=parse(f.factor);if(!factor||factor.n<=0n||factor.n>4n*factor.d)return null;
  return{value:{kind,factor:number(factor),center:[cx,cy]},factor};
 }
 return null;
}
function goalOperation(goal){
 const kind=goal?.kind,fields=Object.fromEntries(operationFields.map(k=>[k,'']));
 if(kind==='move'&&keys(goal,['kind','dx','dy'])&&integer(goal.dx,-12,12)&&integer(goal.dy,-12,12)){
  fields.dx=String(goal.dx);fields.dy=String(goal.dy);
 }else if(kind==='mirror'&&keys(goal,['kind','line']))fields.axis=goal.line;
 else if(['turn','scale'].includes(kind)&&keys(goal,['kind',kind==='turn'?'angle':'factor','center'])&&
  Array.isArray(goal.center)&&goal.center.length===2&&goal.center.every(v=>integer(v,-8,8))){
  const key=kind==='turn'?'angle':'factor';if(!Number.isFinite(goal[key]))return null;
  fields[key]=String(goal[key]);fields.cx=String(goal.center[0]);fields.cy=String(goal.center[1]);
 }else return null;
 const op=operation(kind,fields);return op&&same(op.value,goal)?op:null;
}
function apply(points,op){
 const g=op.value;
 return points.map(([x,y])=>{
  if(g.kind==='move')return[add(x,R(g.dx)),add(y,R(g.dy))];
  if(g.kind==='mirror')return g.line==='x'?[x,negate(y)]:g.line==='y'?[negate(x),y]:g.line==='y=x'?[y,x]:[negate(y),negate(x)];
  const center=g.center.map(R),u=sub(x,center[0]),v=sub(y,center[1]);
  if(g.kind==='scale')return[add(center[0],mul(u,op.factor)),add(center[1],mul(v,op.factor))];
  const rotated=g.angle===90?[negate(v),u]:g.angle===-90?[v,negate(u)]:[negate(u),negate(v)];
  return rotated.map((coordinate,i)=>add(coordinate,center[i]));
 });
}
const difference=(a,b)=>a.map((v,i)=>sub(v,b[i]));
const dot=(a,b)=>add(mul(a[0],b[0]),mul(a[1],b[1]));
const cross=(a,b)=>sub(mul(a[0],b[1]),mul(a[1],b[0]));
function invariants(source,image,op){
 const squaredFactor=mul(op.factor,op.factor),sign=op.value.kind==='mirror'?-1:1,edges=[],angles=[];
 if(source.length>1)for(let i=0;i<source.length;i++){
  const j=(i+1)%source.length,u=difference(source[j],source[i]),v=difference(image[j],image[i]);
  const before=dot(u,u),after=dot(v,v);
  if(before.n===0n||!equal(after,mul(before,squaredFactor)))return null;
  edges.push({from:i,to:j,before:str(before),after:str(after)});
 }
 if(source.length>2)for(let i=0;i<source.length;i++){
  const previous=(i+source.length-1)%source.length,next=(i+1)%source.length;
  const u=difference(source[previous],source[i]),v=difference(source[next],source[i]);
  const a=difference(image[previous],image[i]),b=difference(image[next],image[i]);
  const beforeDot=dot(u,v),afterDot=dot(a,b),beforeCross=cross(u,v),afterCross=cross(a,b);
  if(beforeCross.n===0n||!equal(afterDot,mul(beforeDot,squaredFactor))||
     !equal(afterCross,mul(mul(beforeCross,squaredFactor),R(sign))))return null;
  angles.push({vertex:i,beforeDot:str(beforeDot),afterDot:str(afterDot),beforeCross:str(beforeCross),afterCross:str(afterCross)});
 }
 return{lengthFactor:str(op.factor),squaredLengthFactor:str(squaredFactor),edgeSquared:edges,angleChecks:angles,
  anglesPreserved:angles.length?true:null,orientationPreserved:angles.length?sign===1:null};
}
function operationLabel(op){
 const g=op.value;
 if(g.kind==='move')return`横向 ${g.dx}、竖向 ${g.dy} 的平移`;
 if(g.kind==='mirror')return`沿 ${g.line==='x'?'横轴':g.line==='y'?'竖轴':'直线 '+g.line} 反射`;
 if(g.kind==='turn')return`绕 (${g.center.join(',')}) ${g.angle<0?'顺时针':'逆时针'}旋转 ${Math.abs(g.angle)}°`;
 return`以 (${g.center.join(',')}) 为中心放大到 ${str(op.factor)} 倍`;
}

export function replayTransformEvidence(task,model){
 try{
  if(!keys(task,['type','prompt','shape','goal','domain','predict','needsMeasure','questions'])||
     task.type!=='x-p24-transform'||!text(task.prompt)||task.predict!==true||typeof task.needsMeasure!=='boolean'||
     !Array.isArray(task.shape)||![1,3,4].includes(task.shape.length)||
     !task.shape.every(p=>Array.isArray(p)&&p.length===2&&p.every(v=>integer(v,-32,32)))||
     !Array.isArray(task.domain)||task.domain.length!==4||!task.domain.every(v=>integer(v,-32,32))||
     task.domain[0]>=task.domain[1]||task.domain[2]>=task.domain[3]||!Array.isArray(task.questions)||
     !task.questions.length||task.questions.length>10)return null;
  const goal=goalOperation(task.goal);if(!goal)return null;
  const source=task.shape.map(p=>p.map(R)),target=apply(source,goal),kind=task.goal.kind;
  if(!keys(model,[...fieldNames,'answers','seed','board','history','issue'])||
     !fieldNames.every(k=>text(model[k]))||model.issue!==''||!integer(model.seed,1,4294967295)||
     !Array.isArray(model.answers)||model.answers.length!==task.questions.length||!model.answers.every(text)||
     !Array.isArray(model.history)||model.history.length<2||model.history.length>1000||
     !['x','y','item','kind','slot','amplitude'].every(k=>model[k]===''))return null;
  const b={first:{},prediction:null,image:null,op:null,saved:null,measured:false},operations=[];
  let measured=0,prediction=null,last=null,lastImage=null,lastInvariants=null;
  for(const event of model.history){
   if(!keys(event,['a','f','d'])||!keys(event.d,[]))return null;
   if(event.a==='predict'){
    if(prediction||operations.length||!keys(event.f,['predX','predY']))return null;
    const point=[parse(event.f.predX),parse(event.f.predY)];if(point.some(v=>v===null))return null;
    if(!point.every((p,i)=>{
     const observed=transforms.number(event.f[i?'predY':'predX']);
     return Number.isFinite(observed)&&Math.sign(observed)===(p.n<0n?-1:p.n>0n?1:0);
    }))return null;
    b.first.predict=clone(event.f);b.prediction={x:event.f.predX,y:event.f.predY};b.first.prediction=clone(b.prediction);
    // Preserve the original metadata convention only. Exact prediction
    // correctness below does not borrow the original grader's tolerance.
    if(!point.every((_,i)=>Math.abs(transforms.number(event.f[i?'predY':'predX'])-number(target[0][i]))<1e-7))b.first.incorrectPrediction=true;
    prediction={point:[event.f.predX,event.f.predY],correct:pointEqual(point,target[0])};
   }else if(event.a==='operate'){
    if(!prediction||!keys(event.f,operationFields)||!operationFields.every(k=>text(event.f[k])))return null;
    const op=operation(kind,event.f);if(!op)return null;
    // The old parser treats a negative-zero mixed number as positive. Keep
    // native grading unchanged, but reject any historical parameter that the
    // native tool interpreted differently from this exact mathematical input.
    if(!same(transforms.opFromFields(task,event.f),op.value))return null;
    // No composition: the native UI applies every new choice to task.shape.
    const image=apply(source,op),checks=invariants(source,image,op);if(!checks)return null;
    // Compare corresponding vertices, not the unordered outline: rotating a
    // symmetric polygon can leave its outline while genuinely moving vertices.
    if(image.every((p,i)=>pointEqual(p,(lastImage||source)[i])))return null;
    // Scaling uses a floating display in the original tool. Preserve that
    // display, while the geometry above stays rational. A tiny input rounded
    // away by the tool cannot masquerade as a new visible transformation.
    const shown=kind==='scale'?task.shape.map(p=>p.map((v,i)=>op.value.center[i]+op.value.factor*(v-op.value.center[i]))):pointNumbers(image);
    if(same(shown,b.image||task.shape))return null;
    b.first.operate??=clone(event.f);b.op=clone(op.value);b.saved=clone(event.f);b.image=shown;b.measured=false;
    operations.push({operation:clone(op.value),exactFactor:str(op.factor),sourcePoints:clone(task.shape),
     imagePoints:clone(shown),exactImagePoints:pointStrings(image),invariants:checks});
    last=op;lastImage=image;lastInvariants=checks;
   }else if(event.a==='measure'){
    if(!task.needsMeasure||!last||b.measured||!keys(event.f,[]))return null;
    b.first.measure??={};b.measured=true;measured++;
   }else return null;
  }
  if(!prediction||!last||!same(last.value,goal.value)||!equal(last.factor,goal.factor)||
     !lastImage.every((p,i)=>pointEqual(p,target[i]))||!same(b,model.board)||
     model.predX!==b.prediction.x||model.predY!==b.prediction.y||
     (task.needsMeasure&&!b.measured))return null;
  const current=operation(kind,model);
  if(!current||!same(current.value,last.value)||!equal(current.factor,last.factor))return null;
  for(const [i,q]of task.questions.entries()){
   if(q?.options){
    if(!keys(q,['label','value','options'])||!text(q.label)||!text(q.value)||!Array.isArray(q.options)||
       !q.options.every(o=>Array.isArray(o)&&o.length===2&&o.every(text))||
       !q.options.some(o=>o[0]===q.value)||model.answers[i]!==q.value)return null;
   }else{
    if(!keys(q,['label','value'])||!text(q.label)||!Number.isSafeInteger(q.value))return null;
    const answer=parse(model.answers[i]);if(!answer||!equal(answer,R(q.value)))return null;
   }
  }
  // Original record validity and completion remain independent requirements.
  if(!transforms.valid(task,model)||!transforms.inspect(task,model).correct)return null;
  return{kind,operation:clone(last.value),sourcePoints:clone(task.shape),imagePoints:pointNumbers(lastImage),
   operations,operationCount:operations.length,measurementCount:measured,measured:b.measured,prediction,
   invariants:lastInvariants,automaticImage:true,independentMeasurementAssessed:false,
   display:{operation:operationLabel(last),sourcePoints:pointStrings(source).map(p=>'('+p.join(',')+')'),
    imagePoints:pointStrings(lastImage).map(p=>'('+p.join(',')+')'),lengthFactor:lastInvariants.lengthFactor,
    squaredLengthFactor:lastInvariants.squaredLengthFactor}};
 }catch{return null;}
}
