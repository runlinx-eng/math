// B30 constructions: preserve the original visible history, then independently
// check the mathematics of the work that remains. No grading or storage changes.
import * as area from './phase5/b30-model.js';
import {TASKS} from './phase5/b30.js';
import {number as originalNumber} from './phase5/b20-model.js';
import {matchesNativeEvidenceTask,sameEvidence as same,hasExactKeys as keys} from './evidence-contract.js';

const SOURCES=Object.freeze({
 areadistrib:{nodeId:'mt_AQo4u7O4sM',tasks:{0:'partition',1:'partition',2:'partition'}},
 rectsplit:{nodeId:'mt_eMtV6tBSJm',tasks:{0:'partition',1:'partition',2:'partition'}},
 lperim:{nodeId:'mt_n0AlyLQwC9',tasks:{2:'design'}},
 polyperim:{nodeId:'mt_WtcFrxGOgw',tasks:{2:'compare'}},
 areaPerim:{nodeId:'mt_MJZA90uc6H',tasks:{0:'compare',1:'compare',2:'compare'}},
 polyArea:{nodeId:'mt_i2-QaXbyzB',tasks:{0:'pieces',1:'pieces',2:'pieces'}},
 prismFormulas:{nodeId:'mt_tAJH5BrpOx',tasks:{0:'pieces'}},
 circleArea:{nodeId:'mt_svFa6_mjO_',tasks:{2:'stadium'}},
 netSurface:{nodeId:'mt_tegkuJA5gM',tasks:{2:'openbox'}}
});
const TYPE={partition:'x-a30-grid',design:'x-a30-grid',compare:'x-a30-compare',pieces:'x-a30-pieces',stadium:'x-a30-circle',openbox:'x-a30-solid'};
const QUESTION={
 partition:'每一块实际放在哪里？怎样确认没有重叠或遗漏，并把各块的面积接起来？',
 design:'搭出的形状怎样保持一个 L？哪些边在外面，哪些只是两块之间的分界？',
 compare:'两个长方形同时满足了哪些条件？怎样分别核对面积和围边，而不由一个量猜另一个？',
 pieces:'每次记下的是哪一部分的面积？这些部分应相加，还是从外框中减去？',
 stadium:'整个图形的外边经过哪些部分？两个半圆与中间直线怎样分别参与面积和周长？',
 openbox:'做一个没有上盖的盒子，六个给定的面中哪些要保留？怎样把它们的面积合起来？'
};
export function areaBinding(task,context={}){
 if(!context||typeof context!=='object'||Array.isArray(context)||typeof context.sessionId!=='string'||!Number.isInteger(context.index)||context.index<0)return null;
 const source=Object.hasOwn(SOURCES,context.sessionId)?SOURCES[context.sessionId]:null;
 const kind=source&&Object.hasOwn(source.tasks,context.index)?source.tasks[context.index]:null;
 if(!kind||!matchesNativeEvidenceTask(task,context,{type:TYPE[kind],nodeId:source.nodeId}))return null;
 return {nodeId:source.nodeId,kind,question:QUESTION[kind],method:null};
}
function sourceFor(task){
 for(const [id,s]of Object.entries(SOURCES))for(const [index,kind]of Object.entries(s.tasks))
  if(task?.type===TYPE[kind]&&same(task,TASKS[id][index]))return{id,index:Number(index),kind};
 return null;
}
const cp=structuredClone,text=x=>typeof x==='string'&&x.length<=1200;
const integer=(n,min,max)=>Number.isSafeInteger(n)&&n>=min&&n<=max;
const index=(s,max)=>typeof s==='string'&&/^(?:0|[1-9]\d*)$/.test(s)&&integer(Number(s),0,max)?Number(s):null;
const list=(v,n,p)=>Array.isArray(v)&&v.length===n&&Object.keys(v).length===n&&v.every(p);
const gcd=(a,b)=>{a=a<0n?-a:a;while(b){const t=a%b;a=b;b=t;}return a;};
const rational=(n,d=1n)=>{const g=gcd(n,d);return{n:n/g,d:d/g};};
const shown=q=>q.d===1n?String(q.n):`${q.n}/${q.d}`;
const add=(a,b)=>rational(a.n*b.d+b.n*a.d,a.d*b.d);
const subtract=(a,b)=>rational(a.n*b.d-b.n*a.d,a.d*b.d);
const multiply=(a,b)=>rational(a.n*b.n,a.d*b.d);
const equal=(a,b)=>!!a&&!!b&&a.n*b.d===b.n*a.d;
// Match the spellings accepted by the unchanged B20 parser, but retain every
// decimal digit. There is no invented short precision cutoff. Historical
// approximate acceptance is replayed below; it is not an exact quantity claim.
function parse(raw){
 if(!text(raw))return null;const s=raw.trim();let n,d,m;
 if(m=/^(-?\d+)\s+(\d+)\/(\d+)$/.exec(s)){d=BigInt(m[3]);if(!d)return null;const a=BigInt(m[1]);n=(a<0n?-a:a)*d+BigInt(m[2]);if(m[1][0]==='-')n=-n;}
 else if(m=/^(-?\d+)\/(\d+)$/.exec(s)){n=BigInt(m[1]);d=BigInt(m[2]);if(!d)return null;}
 else if(/^-?\d+(?:\.\d+)?$/.test(s)){d=10n**BigInt(s.split('.')[1]?.length||0);n=BigInt(s.replace('.',''));}
 else return null;return rational(n,d);
}
const exact=(raw,value)=>equal(parse(raw),typeof value==='bigint'?rational(value):value);
function polygon(points){
 if(!Array.isArray(points)||points.length<3||!points.every(p=>list(p,2,n=>integer(n,-1000,1000))))return null;
 let twice=0n;points.forEach(([x,y],i)=>{const[a,b]=points[(i+1)%points.length];twice+=BigInt(x)*BigInt(b)-BigInt(a)*BigInt(y);});
 return rational(twice<0n?-twice:twice,2n);
}
const cellKey=([x,y])=>`${x},${y}`;
function rectangle(corners,width){
 const [a,b]=corners,x=Math.min(a%width,b%width),y=Math.min(Math.floor(a/width),Math.floor(b/width));
 const w=Math.abs(a%width-b%width)+1,h=Math.abs(Math.floor(a/width)-Math.floor(b/width))+1;
 return {x,y,width:w,height:h,area:String(BigInt(w)*BigInt(h)),cells:Array.from({length:w*h},(_,i)=>[x+i%w,y+Math.floor(i/w)])};
}
function boundary(cells){
 const set=new Set(cells.map(cellKey)),edges=[];
 for(const [x,y]of cells)for(const [dx,dy,a,b]of [[0,-1,[x,y],[x+1,y]],[1,0,[x+1,y],[x+1,y+1]],[0,1,[x+1,y+1],[x,y+1]],[-1,0,[x,y+1],[x,y]]])
  if(!set.has(`${x+dx},${y+dy}`))edges.push([a,b]);
 return edges;
}
function lShape(cells){
 if(!cells.length)return null;
 const set=new Set(cells.map(cellKey)),xs=cells.map(p=>p[0]),ys=cells.map(p=>p[1]);
 const x=Math.min(...xs),y=Math.min(...ys),width=Math.max(...xs)-x+1,height=Math.max(...ys)-y+1,missing=[];
 for(let b=y;b<y+height;b++)for(let a=x;a<x+width;a++)if(!set.has(`${a},${b}`))missing.push([a,b]);
 if(!missing.length)return null;const mx=missing.map(p=>p[0]),my=missing.map(p=>p[1]);
 const cut={x:Math.min(...mx),y:Math.min(...my),width:Math.max(...mx)-Math.min(...mx)+1,height:Math.max(...my)-Math.min(...my)+1};
 if(cut.width>=width||cut.height>=height||missing.length!==cut.width*cut.height||
    ![x,x+width-cut.width].includes(cut.x)||![y,y+height-cut.height].includes(cut.y))return null;
 return {box:{x,y,width,height},removedCorner:cut,removedArea:missing.length};
}
function dimensionsMatch(rectangles,dimensions){
 return same(rectangles.map(r=>[r.width,r.height]).sort((a,b)=>a[0]-b[0]||a[1]-b[1]),dimensions.slice().sort((a,b)=>a[0]-b[0]||a[1]-b[1]));
}
function questionValues(source,task,construction){
 if(source.id==='areadistrib')return [[12n,6n],[60n,18n],[35n,15n]][source.index];
 if(source.id==='rectsplit'&&source.index===2)return[15n,8n];
 if(source.id==='areaPerim'&&source.index===2)return['sides'];
 if(source.kind==='pieces'&&task.questions?.length)return[32n];
 return[];
}

export function replayAreaEvidence(task,model){
 try{
  const source=sourceFor(task);if(!source)return null;const{kind}=source,initial=area.initial(task);
  if(!keys(model,Object.keys(initial))||!Object.keys(initial).filter(k=>typeof initial[k]==='string').every(k=>text(model[k]))||
     !list(model.answers,initial.answers.length,text)||!list(model.faceValues,initial.faceValues.length,text)||!list(model.calcValues,0,text)||
     !Array.isArray(model.history)||!model.history.length||model.history.length>2000||Object.keys(model.history).length!==model.history.length)return null;
  const visible=new Set(['prose',...(kind==='partition'?['area','unit']:kind==='design'?['perimeter','unit']:kind==='compare'?['w1','h1','w2','h2']:
   kind==='pieces'?['part','area','unit']:kind==='stadium'?['radius','diameter','perimeter','unit','area','areaUnit']:['area','unit'])]);
  for(const [k,v]of Object.entries(initial))if(typeof v==='string'&&k!=='issue'&&!visible.has(k)&&model[k]!==v)return null;
  const replay=area.initial(task),history={events:[],failedRequests:[],noops:[],clears:[],undone:[],approximateAccepted:[]};
  const acceptedParts=Array(task.pieces?.length||0).fill(null),visibleFaces=new Set();
  let lastBuild=null,lastPart=null;
  for(const [at,e]of model.history.entries()){
   if(!keys(e,['a','i','f'])||!text(e.a)||!text(e.i))return null;
   const allowed=kind==='partition'||kind==='design'?['corner','rect','undo','clear']:kind==='compare'?['build']:
    kind==='pieces'?['active','part']:kind==='stadium'?['unroll','piece','edge']:['face','turn'];
   if(!allowed.includes(e.a)||!keys(e.f,e.a==='build'?['w1','h1','w2','h2']:e.a==='part'?['part']:[])||!Object.values(e.f).every(text))return null;
   const indexed=['corner','active','piece','edge','face'].includes(e.a),limit=e.a==='corner'?task.w*task.h-1:e.a==='active'?task.pieces.length-1:e.a==='piece'?2:e.a==='edge'?3:task.faces?.length-1;
   const i=indexed?index(e.i,limit):null;if(indexed&&i===null||!indexed&&e.i!=='')return null;
   if(e.a==='corner'&&kind==='partition'&&!task.cells.some(([x,y])=>y*task.w+x===i))return null;
   const before=cp(replay.board),active=before.active;
   for(const [k,v]of Object.entries(e.f))replay[k]=v;
   // Historical state uses the unchanged real action semantics, including the
   // original Number tolerance. The exact mathematics below is separate.
   area.act(task,replay,'a30-'+e.a,indexed?{index:i}:{});
   if(!same(replay.history.at(-1),e))return null;
   let acceptedByOriginal=null,exactQuantity=null;
   if(e.a==='build'){
    const raw=['w1','h1','w2','h2'].map(k=>e.f[k]),numbers=raw.map(originalNumber),parsed=raw.map(parse);
    acceptedByOriginal=numbers.every(n=>Number.isInteger(n)&&n>=1&&n<=12);
    exactQuantity=parsed.every(q=>q&&q.d===1n&&q.n>=1n&&q.n<=12n);
    if(acceptedByOriginal)lastBuild={index:at,raw,exact:exactQuantity,dimensions:numbers};
   }else if(e.a==='part'){
    const expected=polygon(task.pieces[active].points);if(!expected)return null;
    acceptedByOriginal=replay.issue==='';exactQuantity=exact(e.f.part,expected);
    lastPart={index:at,identity:active,raw:e.f.part,acceptedByOriginal,exact:exactQuantity};
    if(acceptedByOriginal)acceptedParts[active]=cp(lastPart);
   }
   if(e.a==='face'&&replay.board.selected.includes(i))visibleFaces.add(i);
   const entry={index:at,action:e.a,input:cp(e),before,after:cp(replay.board),issue:replay.issue,acceptedByOriginal,exactQuantity,noEffect:same(before,replay.board)};
   history.events.push(entry);if(replay.issue)history.failedRequests.push(entry);
   if(entry.noEffect&&!replay.issue)history.noops.push(entry);
   if(acceptedByOriginal&&!exactQuantity)history.approximateAccepted.push(entry);
   if(e.a==='clear')history.clears.push({index:at,removed:cp(before.rects)});
   if(e.a==='undo'&&before.rects?.length)history.undone.push({index:at,removed:cp(before.rects.at(-1))});
  }
  if(!same(replay.board,model.board)||replay.issue!==model.issue)return null;
  const b=replay.board;let construction,pending=null;
  if(kind==='partition'||kind==='design'){
   if(b.rects.length<2)return null;const rectangles=b.rects.map(r=>({...rectangle(r.corners,task.w),corners:cp(r.corners)}));
   if(rectangles.some((r,i)=>!same(r.cells,b.rects[i].cells)))return null;
   const cells=rectangles.flatMap(r=>r.cells),set=new Set(cells.map(cellKey));if(set.size!==cells.length)return null;
   const edges=boundary(cells),total=BigInt(cells.length),perimeter=BigInt(edges.length);let shape=null;
   if(kind==='partition'){
    if(set.size!==task.cells.length||task.cells.some(p=>!set.has(cellKey(p)))||!exact(model.area,total)||model.unit!==task.unit+'²')return null;
    if(source.id==='areadistrib'&&!dimensionsMatch(rectangles,[[[4,3],[2,3]],[[10,6],[3,6]],[[7,5],[3,5]]][source.index]))return null;
    if(source.id==='rectsplit'&&source.index===2&&(!dimensionsMatch(rectangles,[[3,5],[2,4]])||!rectangles.some(r=>r.x===0&&r.y===0&&r.width===3&&r.height===5)||!rectangles.some(r=>r.x===3&&r.y===0&&r.width===2&&r.height===4)))return null;
   }else{
    shape=lShape(cells);if(!shape||perimeter!==40n||!exact(model.perimeter,perimeter)||model.unit!==task.unit)return null;
   }
   construction={rectangles,cells:cp(cells),totalArea:String(total),perimeter:String(perimeter),boundaryEdges:edges,unit:task.unit,shape};
   pending={corners:cp(b.corners),unapplied:b.corners.length>0,notPlaced:true};
  }else if(kind==='compare'){
   if(!lastBuild?.exact||!same(lastBuild.dimensions,b.rectangles))return null;
   const d=lastBuild.raw.map(raw=>parse(raw).n),[w,h,x,y]=d,A=w*h,B=x*y,P=2n*(w+h),Q=2n*(x+y),target=BigInt(task.target);
   if(!(task.rule==='area'?A===target&&B===target&&P!==Q:P===target&&Q===target&&A!==B))return null;
   if(source.id==='areaPerim'&&source.index===2){const pairs=[[w,h],[x,y]].map(p=>p.sort((a,b)=>a<b?-1:1).join(',')).sort();if(!same(pairs,['2,12','4,6']))return null;}
   construction={dimensions:d.map(String),areas:[String(A),String(B)],perimeters:[String(P),String(Q)],condition:task.rule,target:String(target),appliedEvent:lastBuild.index,rawDimensions:cp(lastBuild.raw),geometryByTool:true,unit:'cm'};
   pending={dimensions:['w1','h1','w2','h2'].map(k=>model[k]),lastApplied:cp(lastBuild.raw),mathExact:['w1','h1','w2','h2'].every((k,i)=>exact(model[k],d[i])),unapplied:['w1','h1','w2','h2'].some((k,i)=>model[k]!==lastBuild.raw[i])};
  }else if(kind==='pieces'){
   const areas=task.pieces.map(p=>polygon(p.points));if(areas.some(q=>!q))return null;
   if(acceptedParts.some((r,i)=>!r?.exact||!exact(r.raw,areas[i])||b.values[i]!==Number(areas[i].n)/Number(areas[i].d)))return null;
   const sum=areas.reduce(add,rational(0n)),outer=task.mode==='subtract'?polygon(task.enclosing):null,result=outer?subtract(outer,sum):sum;
   if(!exact(model.area,result)||model.unit!==task.unit+'²')return null;
   construction={operation:outer?'subtract':'sum',parts:areas.map((q,i)=>({identity:i,name:task.pieces[i].name,area:shown(q),raw:acceptedParts[i].raw,appliedEvent:acceptedParts[i].index})),partsTotal:shown(sum),outerArea:outer?shown(outer):null,area:shown(result),unit:task.unit+'²',partitionByTool:true};
   pending={part:model.part,active:b.active,lastRequest:lastPart,mathExact:exact(model.part,areas[b.active]),unapplied:!lastPart||lastPart.identity!==b.active||lastPart.raw!==model.part};
  }else if(kind==='stadium'){
   if(!b.unrolled||!same([...b.pieces].sort(),[0,1,2])||!same([...b.edges].sort(),[0,1,2]))return null;
   const r=rational(BigInt(task.radius)),length=rational(BigInt(task.rectLength)),pi=rational(157n,50n),diameter=multiply(r,rational(2n));
   const rectangular=multiply(length,diameter),circular=multiply(pi,multiply(r,r)),perimeter=add(multiply(length,rational(2n)),multiply(pi,diameter)),total=add(rectangular,circular);
   if(!exact(model.radius,r)||!exact(model.diameter,diameter)||!exact(model.perimeter,perimeter)||!exact(model.area,total)||model.unit!==task.unit||model.areaUnit!==task.unit+'²')return null;
   construction={pieces:cp(b.pieces),edges:cp(b.edges),radius:shown(r),diameter:shown(diameter),straightLength:shown(length),piApproximation:shown(pi),rectangleArea:shown(rectangular),circleArea:shown(circular),perimeter:shown(perimeter),area:shown(total),displayPerimeter:'28.56',displayArea:'44.56',unit:task.unit,partitionByTool:true};
  }else{
   const selected=[...b.selected].sort((a,b)=>a-b);if(!b.turned||!same(selected,[0,1,2,3,5]))return null;
   const [w,d,h]=task.size.map(BigInt),areas=[w*h,w*h,d*h,d*h,w*d,w*d],surface=selected.reduce((sum,i)=>sum+areas[i],0n);
   if(!selected.every(i=>exact(model.faceValues[i],areas[i]))||!exact(model.area,surface)||model.unit!==task.unit+'²')return null;
   if(model.faceValues.some((value,i)=>value!==''&&!visibleFaces.has(i)))return null;
   construction={selected,excluded:[4],faces:selected.map(i=>({identity:i,name:task.faces[i].name,area:String(areas[i]),raw:model.faceValues[i]})),surface:String(surface),unit:task.unit+'²',storedUnselected:[{identity:4,raw:model.faceValues[4],wasVisible:visibleFaces.has(4),counted:false}],fieldEditTimingKnown:false,partitionByTool:true};
  }
  const expected=questionValues(source,task,construction);
  if(expected.length!==model.answers.length||!expected.every((q,i)=>typeof q==='string'?model.answers[i]===q:exact(model.answers[i],q)))return null;
  if(!area.valid(task,model)||!area.inspect(task,model).correct)return null;
  return {kind,construction,pending,history,first:cp(b.first),bad:b.bad,issue:model.issue,answers:expected.map((q,i)=>({raw:model.answers[i],expected:String(q)}))};
 }catch{return null;}
}
