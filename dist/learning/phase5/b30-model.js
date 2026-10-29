import {number} from './b20-model.js';
import {key,rectangleCells,boundaryRuns,perimeter,connected,isRectangle,hasHoles,polygonArea} from './b30-geometry.js';
export const TYPES=new Set(['x-a30-grid','x-a30-outline','x-a30-compare','x-a30-pieces','x-a30-circle','x-a30-solid']);
const cp=x=>structuredClone(x),same=(a,b)=>JSON.stringify(a)===JSON.stringify(b),txt=x=>typeof x==='string'&&x.length<=1200,int=(x,a,b)=>Number.isInteger(x)&&x>=a&&x<=b,near=(x,n)=>Number.isFinite(number(x))&&Math.abs(number(x)-n)<1e-7;
const names=['answer','area','areaUnit','perimeter','unit','base','volume','volumeUnit','part','w1','h1','w2','h2','radius','diameter','prose'];
const qs=t=>Array(t.questions?.length||0).fill(''),fs=t=>Array(t.faces?.length||0).fill(''),cs=t=>Array(t.calculations?.length||0).fill('');
export const gridCells=(t,b)=>t.mode==='design'?b.rects.flatMap(r=>r.cells):t.cells;
export const pieceArea=p=>p.area??polygonArea(p.points);
function board(t){const common={first:{},bad:false};switch(t.type){
 case'x-a30-grid':return{...common,tiles:[],edges:[],corners:[],rects:[]};
 case'x-a30-outline':return{...common,edges:[]};
 case'x-a30-compare':return{...common,rectangles:null};
 case'x-a30-pieces':return{...common,active:0,values:Array(t.pieces.length).fill(null),transformed:false};
 case'x-a30-circle':return{...common,unrolled:false,pieces:[],edges:[]};
 case'x-a30-solid':return{...common,selected:[],turned:false,split:false,splitSeen:false,joinedSeen:true};
}}
export const initial=t=>({...Object.fromEntries(names.map(k=>[k,''])),answers:qs(t),faceValues:fs(t),calcValues:cs(t),history:[],board:board(t),issue:''});
const actions=new Set(['tile','edge','corner','rect','undo','clear','build','active','part','transform','unroll','piece','face','turn','split']);
const eventValid=e=>e&&actions.has(e.a)&&txt(e.i)&&e.f&&typeof e.f==='object'&&Object.values(e.f).every(txt);
function apply(t,b,e){let issue='';const v=Number(e.i),f=e.f,bad=s=>{issue=s;b.bad=true;},toggle=(a,n)=>{const i=a.indexOf(n);if(i>=0)a.splice(i,1);else a.push(n);};
 if(t.type==='x-a30-grid'){
  const allowed=new Set(t.cells.map(([x,y])=>key(x,y)));
  if(e.a==='tile'&&t.mode==='tile'&&int(v,0,t.w*t.h-1)){if(allowed.has(key(v%t.w,Math.floor(v/t.w))))toggle(b.tiles,v);else bad('这一块在图形外面。');}
  if(e.a==='edge'&&t.mode==='edge'&&int(v,0,boundaryRuns(t.cells).length-1))toggle(b.edges,v);
  if(e.a==='corner'&&['partition','design'].includes(t.mode)&&int(v,0,t.w*t.h-1)){if(b.corners.length===2)b.corners=[];b.corners.push(v);}
  if(e.a==='rect'&&b.corners.length===2){const cells=rectangleCells(b.corners[0],b.corners[1],t.w),occupied=new Set(b.rects.flatMap(r=>r.cells.map(([x,y])=>key(x,y))));b.first.rect??=cp(b.corners);
   if(t.mode==='partition'&&cells.some(([x,y])=>!allowed.has(key(x,y))))bad('这一块伸到了图形外面。');
   else if(cells.some(([x,y])=>occupied.has(key(x,y))))bad('这块与已放的部分重叠了。');
   else b.rects.push({corners:cp(b.corners),cells});b.corners=[];
  }
  if(e.a==='undo'){if(['partition','design'].includes(t.mode)){b.rects.pop();b.corners=[];}else if(t.mode==='edge')b.edges.pop();else b.tiles.pop();}
  if(e.a==='clear'){b.tiles=[];b.edges=[];b.corners=[];b.rects=[];}
 }
 if(t.type==='x-a30-outline'&&e.a==='edge'&&int(v,0,t.points.length-1))toggle(b.edges,v);
 if(t.type==='x-a30-compare'&&e.a==='build'){
  const raw=['w1','h1','w2','h2'].map(k=>f[k]),ns=raw.map(number);b.first.rectangles??=cp(raw);
  if(!ns.every(n=>int(n,1,12)))bad('每条边先选 1 到 12 个单位。');
  else{b.rectangles=ns;const[a,c,d,e]=ns,A=a*c,B=d*e,P=2*(a+c),Q=2*(d+e);if(t.rule==='area'?(A!==t.target||B!==t.target||P===Q):(P!==t.target||Q!==t.target||A===B))bad('两个条件要同时成立；再调一调长和宽。');}
 }
 if(t.type==='x-a30-pieces'){
  if(e.a==='active'&&int(v,0,t.pieces.length-1))b.active=v;
  if(e.a==='transform')b.transformed=!b.transformed;
  if(e.a==='part'){const p=t.pieces[b.active],n=number(f.part);b.first['part'+b.active]??=f.part;if(!Number.isFinite(n)||Math.abs(n-pieceArea(p))>1e-7)bad('看看这一块的底和垂直高度，再算它占多少平方单位。');else b.values[b.active]=n;}
 }
 if(t.type==='x-a30-circle'){
  if(e.a==='unroll')b.unrolled=!b.unrolled;
  if(e.a==='piece'&&int(v,0,2))toggle(b.pieces,v);
  if(e.a==='edge'&&int(v,0,3)){b.first.edge??=v;if(v===3)b.bad=true;toggle(b.edges,v);}
 }
 if(t.type==='x-a30-solid'){
  if(e.a==='face'&&int(v,0,t.faces.length-1)){b.first.face??=v;toggle(b.selected,v);}
  if(e.a==='turn')b.turned=true;
  if(e.a==='split'&&t.canSplit){b.split=!b.split;if(b.split)b.splitSeen=true;else b.joinedSeen=true;}
 }
 return{board:b,issue};
}
export function act(t,m,action,data={}){const a=action.replace(/^a30-/,'');const keys=a==='part'?['part']:a==='build'?['w1','h1','w2','h2']:[];const e={a,i:String(data.index??''),f:Object.fromEntries(keys.map(k=>[k,String(m[k])]))};if(!eventValid(e)||m.history.length>=2000)return m;const r=apply(t,cp(m.board),e);m.board=r.board;m.issue=r.issue;m.history.push(e);return m;}
export function field(t,m,k){const root=k.split('.')[0];if(names.includes(root))m[root]=String(m[root]??'');if(['answers','faceValues','calcValues'].includes(root))m[root][Number(k.split('.')[1])]=String(m[root][Number(k.split('.')[1])]??'');}
export function valid(t,m){try{if(!m||!TYPES.has(t.type)||!names.every(k=>txt(m[k]))||!txt(m.issue)||!Array.isArray(m.answers)||m.answers.length!==qs(t).length||!m.answers.every(txt)||!Array.isArray(m.faceValues)||m.faceValues.length!==fs(t).length||!m.faceValues.every(txt)||!Array.isArray(m.calcValues)||m.calcValues.length!==cs(t).length||!m.calcValues.every(txt)||!Array.isArray(m.history)||m.history.length>2000||!m.history.every(eventValid))return false;let b=board(t);for(const e of m.history)b=apply(t,b,e).board;return same(b,m.board);}catch{return false;}}
const questionsRight=(t,m)=>(t.questions||[]).every((q,i)=>Array.isArray(q.value)?q.value.includes(m.answers[i]):q.options?m.answers[i]===String(q.value):near(m.answers[i],q.value));
export function inspect(t,m){if(!valid(t,m))return{correct:false,feedback:'这份作品暂时读不出来。'};const b=m.board;let ok=false,hint='再看看图与记录能否对应。';
 if(t.type==='x-a30-grid'){
  const cells=gridCells(t,b),indices=t.cells.map(([x,y])=>y*t.w+x).sort((a,c)=>a-c),covered=b.rects.flatMap(r=>r.cells.map(([x,y])=>y*t.w+x)).sort((a,c)=>a-c);
  if(t.mode==='tile')ok=same([...b.tiles].sort((a,c)=>a-c),indices)&&near(m.area,t.cells.length)&&m.unit===t.unit+'²';
  if(t.mode==='edge')ok=b.edges.length===boundaryRuns(t.cells).length&&near(m.perimeter,perimeter(t.cells))&&m.unit===t.unit;
  if(t.mode==='partition')ok=same(covered,indices)&&b.rects.length>=(t.minRects||2)&&(!t.partAreas||same(b.rects.map(r=>r.cells.length).sort((a,c)=>a-c),[...t.partAreas].sort((a,c)=>a-c)))&&near(m.area,t.cells.length)&&m.unit===t.unit+'²';
  if(t.mode==='design')ok=b.rects.length>=2&&connected(cells)&&!isRectangle(cells)&&!hasHoles(cells)&&perimeter(cells)===t.target&&near(m.perimeter,t.target)&&m.unit===t.unit;
  hint=t.mode==='edge'?'沿外边每条直边走一遍，内部分界不算外边。':t.mode==='tile'?'用同样大小的方片把里面铺满，不留空或重复。':t.mode==='partition'?'选两个角放一块长方形，不要出界、重叠或遗漏。':'搭出连通的组合图形，沿外边检查长度。';
 }
 if(t.type==='x-a30-outline'){ok=b.edges.length===t.points.length&&near(m.answer,t.answer)&&m.unit===t.unit;hint='沿所有外边走一遍；已知整圈时，未知边是剩下的长度。';}
 if(t.type==='x-a30-compare'){const a=b.rectangles;if(a){const[w,h,x,y]=a,A=w*h,B=x*y,P=2*(w+h),Q=2*(x+y);ok=(t.rule==='area'?A===t.target&&B===t.target&&P!==Q:P===t.target&&Q===t.target&&A!==B)&&['w1','h1','w2','h2'].every((k,i)=>near(m[k],a[i]));}hint='两个图形要同时满足指定的量，另一个量还要不同。';}
 if(t.type==='x-a30-pieces'){const result=t.mode==='subtract'?t.enclosingArea-t.pieces.reduce((s,p)=>s+pieceArea(p),0):t.pieces.reduce((s,p)=>s+pieceArea(p),0);ok=b.values.every((v,i)=>v!==null&&Math.abs(v-pieceArea(t.pieces[i]))<1e-7)&&(!t.transform||b.transformed)&&near(m.area,result)&&m.unit===t.unit+'²';hint=t.transform?'先把这块移过去或复制一块，看底和垂直高度；再计算面积。':'依次算每一块，不能重叠或漏掉；最后按图相加或从外框减去。';}
 if(t.type==='x-a30-circle'){const r=t.radius,d=2*r,p=t.kind==='stadium'?2*t.rectLength+2*3.14*r:2*3.14*r,a=t.kind==='stadium'?t.rectLength*2*r+3.14*r*r:3.14*r*r;ok=b.unrolled&&near(m.radius,r)&&near(m.diameter,d)&&near(m.perimeter,p)&&near(m.area,a)&&m.unit===t.unit&&m.areaUnit===t.unit+'²'&&(t.kind!=='stadium'||same([...b.pieces].sort(),[0,1,2])&&same([...b.edges].sort(),[0,1,2]));hint='半径到圆心，直径穿过圆心；边界和铺满的面积不同。组合图形里面的接缝不算外边。';}
 if(t.type==='x-a30-solid'){
  const need=t.requiredFaces||[],selected=[...b.selected].sort((a,c)=>a-c);ok=b.turned&&(!t.canSplit||b.splitSeen&&!b.split)&&(!need.length||same(selected,[...need].sort((a,c)=>a-c))&&need.every(i=>near(m.faceValues[i],t.faces[i].area))&&near(m.area,t.surface)&&m.unit===t.unit+'²')&&(!t.volumeRequired||(t.baseArea==null||near(m.base,t.baseArea))&&near(m.volume,t.volume)&&m.volumeUnit===t.unit+'³')&&(t.calculations||[]).every((c,i)=>near(m.calcValues[i],c.value));
  hint=t.canSplit?'先分开再接上；接触的面藏在里面，不属于外面。':'转一转，按需要选面并计算；体积是底面积乘垂直长度，表面用平方单位。';
 }
 ok=!!ok&&questionsRight(t,m);return{correct:ok,feedback:ok?'这次图和记录对应上了。':hint,evidence:{kind:t.type,board:cp(b),history:cp(m.history),freeExplanationAssessed:false,physicalUseAssessed:false,generalMasteryAssessed:false}};
}
export function solveSteps(t){const s=[],f=(field,value)=>s.push({field,value:String(value)}),a=(action,index)=>s.push({action:'a30-'+action,data:index===undefined?{}:{index}});
 if(t.type==='x-a30-grid'){
  if(t.mode==='tile'){for(const[x,y]of t.cells)a('tile',y*t.w+x);f('area',t.cells.length);f('unit',t.unit+'²');}
  if(t.mode==='edge'){boundaryRuns(t.cells).forEach((_,i)=>a('edge',i));f('perimeter',perimeter(t.cells));f('unit',t.unit);}
  if(['partition','design'].includes(t.mode)){for(const [one,two]of t.exampleRects){a('corner',one);a('corner',two);a('rect');}if(t.mode==='partition')f('area',t.cells.length);else f('perimeter',t.target);f('unit',t.mode==='partition'?t.unit+'²':t.unit);}
 }
 if(t.type==='x-a30-outline'){t.points.forEach((_,i)=>a('edge',i));f('answer',t.answer);f('unit',t.unit);}
 if(t.type==='x-a30-compare'){['w1','h1','w2','h2'].forEach((k,i)=>f(k,t.example[i]));a('build');}
 if(t.type==='x-a30-pieces'){if(t.transform)a('transform');t.pieces.forEach((p,i)=>{a('active',i);f('part',pieceArea(p));a('part');});f('area',t.mode==='subtract'?t.enclosingArea-t.pieces.reduce((x,p)=>x+pieceArea(p),0):t.pieces.reduce((x,p)=>x+pieceArea(p),0));f('unit',t.unit+'²');}
 if(t.type==='x-a30-circle'){a('unroll');if(t.kind==='stadium'){for(const i of [0,1,2]){a('piece',i);a('edge',i);}}const r=t.radius,round=n=>Number(n.toFixed(2));f('radius',r);f('diameter',2*r);f('perimeter',round(t.kind==='stadium'?2*t.rectLength+2*3.14*r:2*3.14*r));f('area',round(t.kind==='stadium'?t.rectLength*2*r+3.14*r*r:3.14*r*r));f('unit',t.unit);f('areaUnit',t.unit+'²');}
 if(t.type==='x-a30-solid'){if(t.canSplit){a('split');a('split');}for(const i of t.requiredFaces||[]){a('face',i);f('faceValues.'+i,t.faces[i].area);}if(t.requiredFaces?.length){f('area',t.surface);f('unit',t.unit+'²');}if(t.volumeRequired){if(t.baseArea!=null)f('base',t.baseArea);f('volume',t.volume);f('volumeUnit',t.unit+'³');}(t.calculations||[]).forEach((c,i)=>f('calcValues.'+i,c.value));s.push({action:'turn-extra',data:{}});}
 (t.questions||[]).forEach((q,i)=>f('answers.'+i,Array.isArray(q.value)?q.value[0]:q.value));return s;
}
export function example(t){const m=initial(t);for(const s of solveSteps(t)){if(s.field){const p=s.field.split('.');if(p.length===2)m[p[0]][+p[1]]=s.value;else m[s.field]=s.value;field(t,m,s.field);}else act(t,m,s.action==='turn-extra'?'a30-turn':s.action,s.data);}return m;}
