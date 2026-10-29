import {number} from './b20-model.js';
import * as G from './b24-geometry.js';
export {number};
export const TYPES=new Set(['x-p24-place','x-p24-walk','x-p24-grid','x-p24-read','x-p24-distance','x-p24-transform','x-p24-mirror','x-p24-spin','x-p24-fan','x-p24-tiles','x-p24-frieze','x-p24-studio']);
const cp=x=>structuredClone(x),same=(a,b)=>JSON.stringify(a)===JSON.stringify(b),txt=x=>typeof x==='string'&&x.length<=1500,int=(x,a,b)=>Number.isInteger(x)&&x>=a&&x<=b,near=(a,b)=>Number.isFinite(number(a))&&G.eq(number(a),Number(b)),seed=()=>globalThis.crypto.getRandomValues(new Uint32Array(1))[0]||1;
const names=['x','y','item','dx','dy','axis','angle','cx','cy','factor','predX','predY','kind','slot','amplitude','prose'];
export const fields=t=>({...Object.fromEntries(names.map(k=>[k,''])),answers:Array(t.questions?.length||0).fill('')});
export const zones=t=>t.scene==='table'?['on','under']:t.scene==='depth'?['behind','front']:['left','right'];
export const gridIndex=(t,x,y)=>{const[xmin,xmax,ymin,ymax]=t.domain;return(x-xmin)+(y-ymin)*(xmax-xmin+1);};
export const gridPoint=(t,index)=>{const[xmin,xmax,ymin]=t.domain,w=xmax-xmin+1;return[xmin+index%w,ymin+Math.floor(index/w)];};
const inGrid=(t,p)=>{const[xmin,xmax,ymin,ymax]=t.domain;return p.length===2&&int(p[0],xmin,xmax)&&int(p[1],ymin,ymax);};
export const mirrorTargets=t=>t.half.map(p=>G.reflect(p,t.line)).filter((p,i)=>!G.pointEq(p,t.half[i]));
export const goalImage=t=>G.applyOp(t.shape,t.goal);
const tileOk=b=>b.designed&&b.placements.every(x=>x!==null)&&new Set(b.placements).size===4&&b.rotations.every(a=>a===0||a===180)&&b.rotations.includes(180);
function board(t){const common={first:{}};switch(t.type){
 case'x-p24-place':return{...common,zone:null};
 case'x-p24-walk':return{...common,state:cp(t.start),ops:[],states:[cp(t.start)]};
 case'x-p24-grid':return{...common,placed:[],closed:false};
 case'x-p24-read':return{...common,readings:Array(t.points.length).fill(null)};
 case'x-p24-distance':return{...common,measured:[]};
 case'x-p24-transform':return{...common,prediction:null,image:null,op:null,saved:null,measured:false};
 case'x-p24-mirror':return{...common,placed:[],folded:false};
 case'x-p24-spin':return t.mode==='square'?{...common,angle:0,matches:[]} :t.mode==='classify'?{...common,tested:[],selected:[],last:null}:{...common,rotations:[0,0,0,0],placed:[]};
 case'x-p24-fan':return{...common,shape:null,count:0,runs:[]};
 case'x-p24-tiles':return{...common,amplitude:0,designed:false,rotations:[0,0,0,0],placements:[null,null,null,null]};
 case'x-p24-frieze':return{...common,mirror:false,repeated:false};
 case'x-p24-studio':return{...common,mirror:false,rotated:false};
 }}
export const initial=(t,s=seed())=>({...fields(t),seed:s,board:board(t),history:[],issue:''});
const af={reset:[],place:[],F:[],B:[],L:[],R:[],undo:[],plot:['x','y'],dot:[],close:[],record:['item','x','y'],measure:[],predict:['predX','predY'],operate:['dx','dy','axis','angle','cx','cy','factor'],fold:[],spin:[],choose:[],pieceTurn:[],piecePlace:[],fanChoose:['kind'],fanAdd:[],fanClear:[],fanRecord:[],design:['amplitude'],tileTurn:['item'],tilePlace:['item','slot'],friezeMirror:[],friezeRepeat:[],studioMirror:[],studioRotate:[]};
const validEvent=(t,e)=>e&&e.f&&af[e.a]&&Object.keys(e.f).length===af[e.a].length&&af[e.a].every(k=>txt(e.f[k]))&&e.d&&Object.keys(e.d).every(k=>k==='index'&&txt(e.d[k]));
const toggle=(a,n)=>{const i=a.indexOf(n);if(i<0)a.push(n);else a.splice(i,1);};
export function opFromFields(t,f){const kind=t.goal.kind;if(kind==='move'){const dx=number(f.dx),dy=number(f.dy);return int(dx,-12,12)&&int(dy,-12,12)?{kind,dx,dy}:null;}if(kind==='mirror')return['x','y','y=x','y=-x'].includes(f.axis)?{kind,line:f.axis}:null;if(kind==='turn'){const angle=number(f.angle),cx=number(f.cx),cy=number(f.cy);return[-180,-90,90,180].includes(angle)&&int(cx,-8,8)&&int(cy,-8,8)?{kind,angle,center:[cx,cy]}:null;}if(kind==='scale'){const factor=number(f.factor),cx=number(f.cx),cy=number(f.cy);return Number.isFinite(factor)&&factor>0&&factor<=4&&int(cx,-8,8)&&int(cy,-8,8)?{kind,factor,center:[cx,cy]}:null;}return null;}
function addPoint(t,b,p){const existing=t.type==='x-p24-grid'?[...t.given,...b.placed]:[...t.half,...b.placed];if(!inGrid(t,p))return'点要放在画面中的整数交点上。';if(existing.some(q=>G.pointEq(p,q)))return'这个点已经在图上；可以选择另一个点。';if(b.placed.length>=16)return'先撤回不需要的点。';b.placed.push(p);if('closed'in b)b.closed=false;if('folded'in b)b.folded=false;return'';}
function apply(t,b,e){const{a,f,d}=e,i=number(d.index);let issue='';const fail=x=>issue=x;b.first[a]??=cp(f);
 if(a==='reset'){const fresh=board(t);fresh.first=cp(b.first);return{board:fresh,issue};}
 if(t.type==='x-p24-place'&&a==='place'&&int(i,0,zones(t).length-1))b.zone=zones(t)[i];
 if(t.type==='x-p24-walk'){
  if(['F','B','L','R'].includes(a)){let[x,y,dir]=b.state;if(a==='R')dir=(dir+1)%4;if(a==='L')dir=(dir+3)%4;if(a==='F'||a==='B'){const delta=[[0,1],[1,0],[0,-1],[-1,0]][dir],sign=a==='F'?1:-1;x+=sign*delta[0];y+=sign*delta[1];}if(x<0||x>4||y<0||y>4)fail('先留在画面里的小路上。');else{b.state=[x,y,dir];b.ops.push(a);b.states.push(cp(b.state));}}
  if(a==='undo'&&b.ops.length){b.ops.pop();b.states.pop();b.state=cp(b.states.at(-1));}
 }
 if(t.type==='x-p24-grid'||t.type==='x-p24-mirror'){
  if(a==='plot'){const p=[number(f.x),number(f.y)];issue=addPoint(t,b,p);}
  if(a==='dot'){const[x0,x1,y0,y1]=t.domain,max=(x1-x0+1)*(y1-y0+1)-1;if(int(i,0,max))issue=addPoint(t,b,gridPoint(t,i));}
  if(a==='undo'){b.placed.pop();if('closed'in b)b.closed=false;if('folded'in b)b.folded=false;}
  if(a==='close'&&t.type==='x-p24-grid'){const ps=[...t.given,...b.placed];if(G.simple(ps))b.closed=true;else fail('按顺序连接三个以上不同的点；边不要交叉。');}
  if(a==='fold'&&t.type==='x-p24-mirror'){b.folded=true;if(!G.pointSetEq(b.placed,mirrorTargets(t)))fail('折过去看看：每个对应点要与原来的点重合。');}
 }
 if(t.type==='x-p24-read'&&a==='record'){const index=number(f.item),x=number(f.x),y=number(f.y);if(int(index,0,t.points.length-1)&&Number.isFinite(x)&&Number.isFinite(y))b.readings[index]={x:f.x,y:f.y};else fail('先选一个点，再写横向和纵向的数。');}
 if(t.type==='x-p24-distance'&&a==='measure'&&int(i,0,t.segments.length-1)&&!b.measured.includes(i))b.measured.push(i);
 if(t.type==='x-p24-transform'){
  if(a==='predict'&&b.image===null){const x=number(f.predX),y=number(f.predY);if(!Number.isFinite(x)||!Number.isFinite(y))fail('先留下你猜的两个数。');else{b.prediction={x:f.predX,y:f.predY};b.first.prediction??=cp(b.prediction);const expected=goalImage(t)[0];if(!G.pointEq([x,y],expected))b.first.incorrectPrediction=true;}}
  if(a==='operate'){const op=opFromFields(t,f);if(!b.prediction&&t.predict)fail('先留下对A点的预测，再动图形。');else if(!op)fail('先填完整的移动、镜线、角度或中心。');else{b.op=op;b.saved=cp(f);b.image=G.applyOp(t.shape,op);b.measured=false;}}
  if(a==='measure'&&b.image)b.measured=true;
 }
 if(t.type==='x-p24-spin'){
  if(t.mode==='square'&&a==='spin'){b.angle+=90;if(G.motifMatches('square',b.angle)&&!b.matches.includes(b.angle))b.matches.push(b.angle);}
  if(t.mode==='classify'){
   const shapes=['pinwheel','heart','triangle'],steps=[90,180,120];if(a==='spin'&&int(i,0,2)){b.last=i;if(!b.tested.includes(i))b.tested.push(i);}if(a==='choose'&&int(i,0,2))toggle(b.selected,i);
  }
  if(t.mode==='build'){if(a==='pieceTurn'&&int(i,0,3))b.rotations[i]=(b.rotations[i]+90)%360;if(a==='piecePlace'&&int(i,0,3))toggle(b.placed,i);}
 }
 if(t.type==='x-p24-fan'){
  if(a==='fanChoose'){const n=number(f.kind);if([3,4,5,6].includes(n)){b.shape=n;b.count=0;}else fail('先选择一种形状。');}
  if(a==='fanAdd'&&b.shape&&b.count<6)b.count++;
  if(a==='fanClear')b.count=0;
  if(a==='fanRecord'&&b.shape&&b.count){const run=[b.shape,b.count];if(!b.runs.some(x=>same(x,run)))b.runs.push(run);}
 }
 if(t.type==='x-p24-tiles'){
  if(a==='design'){const v=number(f.amplitude);if([-1,1].includes(v)){b.amplitude=v;b.designed=true;}else fail('选一个方向，改变方块的相对两条边。');}
  if(a==='tileTurn'){const n=number(f.item);if(int(n,0,3))b.rotations[n]=(b.rotations[n]+90)%360;else fail('先选一块。');}
  if(a==='tilePlace'){const n=number(f.item),s=number(f.slot);if(int(n,0,3)&&int(s,0,3)&&b.designed){b.placements=b.placements.map(x=>x===n?null:x);b.placements[s]=n;}else fail('先改变边缘，再选小块和位置。');}
 }
 if(t.type==='x-p24-frieze'){if(a==='friezeMirror')b.mirror=true;if(a==='friezeRepeat'){if(b.mirror)b.repeated=true;else fail('先把这一块翻到另一边。');}}
 if(t.type==='x-p24-studio'){if(a==='studioMirror')b.mirror=true;if(a==='studioRotate'){if(b.mirror)b.rotated=true;else fail('先把这一块沿竖线翻过去。');}}
 return{board:b,issue};
}
export function act(t,m,action,data={}){const a=action.replace(/^p24-/,''),f=Object.fromEntries((af[a]||[]).map(k=>[k,cp(m[k])])),d=Object.fromEntries(Object.entries(data).filter(([k])=>k==='index').map(([k,v])=>[k,String(v)])),e={a,f,d};if(!validEvent(t,e)||m.history.length>=1000)return m;const r=apply(t,cp(m.board),e);m.board=r.board;m.issue=r.issue;m.history.push(e);return m;}
export function field(t,m,k){const root=k.split('.')[0];if(root in fields(t)&&!Array.isArray(m[root]))m[root]=String(m[root]??'');}
export function valid(t,m){try{if(!m||!TYPES.has(t.type)||!int(m.seed,1,4294967295)||!txt(m.issue)||!Array.isArray(m.history)||m.history.length>1000)return false;for(const[k,v]of Object.entries(fields(t)))if(Array.isArray(v)?!Array.isArray(m[k])||m[k].length!==v.length||!m[k].every(txt):!txt(m[k]))return false;if(!m.history.every(e=>validEvent(t,e)))return false;let b=board(t);for(const e of m.history)b=apply(t,b,e).board;return same(b,m.board);}catch{return false;}}
const qs=(t,m)=>(t.questions||[]).every((q,i)=>q.options?String(m.answers[i])===String(q.value):near(m.answers[i],q.value));
export function inspect(t,m){const b=m.board;let ok=false,hint='先做出图上的变化，再看它和记录是否对上。';
 if(t.type==='x-p24-place'){ok=b.zone===t.want;hint='先找到参照物和观察者，再看小球在哪一边。';}
 if(t.type==='x-p24-walk'){ok=same(b.ops,t.ops);hint='按箭头当前朝向前进；转弯不等于向前走。可以退回一步。';}
 if(t.type==='x-p24-grid'){ok=G.pointSetEq(b.placed,t.target)&&(!t.close||b.closed&&G.simple([...t.given,...b.placed]));hint='先从原点看横向，再看竖向；需要连线时让边不交叉。';}
 if(t.type==='x-p24-read'){const i=number(m.item),current=int(i,0,t.points.length-1)&&b.readings[i];ok=b.readings.every((v,j)=>v&&near(v.x,t.points[j][0])&&near(v.y,t.points[j][1]))&&current&&m.x===current.x&&m.y===current.y;hint='先选点，按横轴再按纵轴读数；每个点都要留下自己的地址。';}
 if(t.type==='x-p24-distance'){ok=b.measured.length===t.segments.length;hint='先逐段量一量；跨零的线段两边都要数。';}
 if(t.type==='x-p24-transform'){const current=opFromFields(t,m);ok=!!b.prediction&&!!b.op&&same(b.op,t.goal)&&same(current,b.op)&&!!b.image&&b.image.every((p,i)=>G.pointEq(p,goalImage(t)[i]))&&(!t.needsMeasure||b.measured);hint='先留下猜想，再按指定的方向、镜线、中心和角度操作；改了输入要重新变换。';}
 if(t.type==='x-p24-mirror'){ok=G.pointSetEq(b.placed,mirrorTargets(t))&&b.folded;hint='每个点从镜线垂直走到另一侧同样远，再折过去检查。';}
 if(t.type==='x-p24-spin'){if(t.mode==='square')ok=[90,180,270,360].every(x=>b.matches.includes(x));else if(t.mode==='classify')ok=b.tested.length===3&&same([...b.selected].sort(),[0,2]);else ok=b.placed.length===4&&same([...b.rotations].sort((a,b)=>a-b),[0,90,180,270]);hint='把图形围着中心转动；不到一整圈重合与只在360°重合不同。';}
 if(t.type==='x-p24-fan'){ok=t.samples.every(s=>b.runs.some(r=>same(r,s)));hint='每一种都围着同一个点试；五边形试三块，再试四块。';}
 if(t.type==='x-p24-tiles'){ok=tileOk(b)&&near(m.amplitude,b.amplitude);hint='先改变两侧边缘，再放四块；检查是否有重叠或空隙。';}
 if(t.type==='x-p24-frieze'){ok=b.mirror&&b.repeated;hint='先把一块翻过去，再把这一对一起平移。';}
 if(t.type==='x-p24-studio'){ok=b.mirror&&b.rotated;hint='先翻出另一半，再把这两块一起绕中心转半圈。';}
 ok=!!ok&&qs(t,m);return{correct:ok,feedback:ok?'这次操作和记录对上了。':hint,evidence:{kind:'B24 bounded positional and transformation work',board:cp(b),history:cp(m.history),fields:Object.fromEntries(Object.keys(fields(t)).map(k=>[k,cp(m[k])])),freeTextMeaningAssessed:false,physicalMovementAssessed:false,generalMasteryAssessed:false}};
}
export function solveSteps(t,s=314159){const m=initial(t,s),steps=[],f=(k,v)=>{if(v==='')return;const z=String(v);steps.push({field:k,value:z});const p=k.split('.');if(p.length===2)m[p[0]][+p[1]]=z;else m[k]=z;field(t,m,k);},a=(action,data={})=>{steps.push({action:'p24-'+action,data});act(t,m,'p24-'+action,data);};
 if(t.type==='x-p24-place')a('place',{index:zones(t).indexOf(t.want)});
 if(t.type==='x-p24-walk')t.ops.forEach(a);
 if(t.type==='x-p24-grid'){t.target.forEach(([x,y])=>{f('x',x);f('y',y);a('plot');});if(t.close)a('close');}
 if(t.type==='x-p24-read')t.points.forEach(([x,y],i)=>{f('item',i);f('x',x);f('y',y);a('record');});
 if(t.type==='x-p24-distance')t.segments.forEach((_,index)=>a('measure',{index}));
 if(t.type==='x-p24-transform'){const [x,y]=goalImage(t)[0];f('predX',x);f('predY',y);a('predict');const g=t.goal;if(g.kind==='move'){f('dx',g.dx);f('dy',g.dy);}if(g.kind==='mirror')f('axis',g.line);if(g.kind==='turn'){f('angle',g.angle);f('cx',g.center[0]);f('cy',g.center[1]);}if(g.kind==='scale'){f('factor',g.factor);f('cx',g.center[0]);f('cy',g.center[1]);}a('operate');if(t.needsMeasure)a('measure');}
 if(t.type==='x-p24-mirror'){mirrorTargets(t).forEach(([x,y])=>{f('x',x);f('y',y);a('plot');});a('fold');}
 if(t.type==='x-p24-spin'){if(t.mode==='square')for(let i=0;i<4;i++)a('spin');if(t.mode==='classify'){for(let i=0;i<3;i++)a('spin',{index:i});[0,2].forEach(index=>a('choose',{index}));}if(t.mode==='build')for(let i=0;i<4;i++){for(let j=0;j<i;j++)a('pieceTurn',{index:i});a('piecePlace',{index:i});}}
 if(t.type==='x-p24-fan')for(const[n,count]of t.samples){f('kind',n);a('fanChoose');for(let i=0;i<count;i++)a('fanAdd');a('fanRecord');}
 if(t.type==='x-p24-tiles'){f('amplitude',1);a('design');for(let i=0;i<4;i++){f('item',i);if(i===1){a('tileTurn');a('tileTurn');}f('slot',i);a('tilePlace');}}
 if(t.type==='x-p24-frieze'){a('friezeMirror');a('friezeRepeat');}
 if(t.type==='x-p24-studio'){a('studioMirror');a('studioRotate');}
 (t.questions||[]).forEach((q,i)=>f('answers.'+i,q.value));return steps;
}
export function example(t){const m=initial(t,314159);for(const v of solveSteps(t))if(v.field){const p=v.field.split('.');if(p.length===2)m[p[0]][+p[1]]=v.value;else m[v.field]=v.value;field(t,m,v.field);}else act(t,m,v.action,v.data);return m;}
