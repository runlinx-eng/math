import {number} from './b20-model.js';
import * as G from './b23-geometry.js';
export {number};
export const TYPES=new Set(['x-s23-pick','x-s23-nest','x-s23-polygon','x-s23-frame','x-s23-tile','x-s23-sides','x-s23-symmetry','x-s23-quad','x-s23-lines','x-s23-ruler','x-s23-objects','x-s23-scene','x-s23-pixels','x-s23-circle','x-s23-notation','x-s23-compass']);
const cp=x=>structuredClone(x),same=(a,b)=>JSON.stringify(a)===JSON.stringify(b),txt=x=>typeof x==='string'&&x.length<=1500,int=(n,a,b)=>Number.isInteger(n)&&n>=a&&n<=b,eq=(a,b)=>Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<1e-7,near=(a,b)=>eq(number(a),b),arrEqual=(a,b)=>same([...a].sort((x,y)=>x-y),[...b].sort((x,y)=>x-y));
const seed=()=>globalThis.crypto.getRandomValues(new Uint32Array(1))[0]||1;
const names=['first','second','angle','radius','center','piece','slot','item','choice','kind','segment','angleName','parallelName','perpName','prose'];
export const fields=t=>({...Object.fromEntries(names.map(n=>[n,''])),answers:Array(t.questions?.length||0).fill('')});
export const pixels=[9,10,15,16,17,22,23,24,25,29,30,31,36,37,38];
export const pieceStep=t=>t.pattern==='hex'?60:t.pattern==='halves'?180:90;
export const wantedRotation=(t,i)=>i*(t.pattern==='rect'?180:pieceStep(t));
export const tileCorrect=(t,b)=>b.slots.every(p=>p!==null)&&arrEqual(b.slots.map(p=>b.rotations[p]),Array.from({length:t.slots},(_,i)=>wantedRotation(t,i)));
export const axes=t=>t.candidates.flatMap((v,i)=>G.symmetric(G.scenario(t.shape,t.rotation),v)?[i]:[]);
export const classes=t=>{const p=G.properties(G.scenario(t.shape,t.rotation));return[...(p.n===4?[0]:[]),...(p.parallel?[1]:[]),...(p.rectangle?[2]:[]),...(p.rhombus?[3]:[]),...(p.square?[4]:[]),...(p.regular?[5]:[])];};
export const gridPoints=t=>t.preset?G.regular(t.n):Array.from({length:49},(_,i)=>G.gridPoint(i));
export const targets=t=>t.cards.flatMap((c,i)=>c.kind==='polygon'&&G.simple(c.points)&&c.points.length===(t.want==='triangle'?3:4)?[i]:[]);
function board(t){const common={first:{}};switch(t.type){
 case'x-s23-pick':return{...common,selected:[]};
 case'x-s23-nest':return{...common,assigned:Array(t.cards.length).fill(null)};
 case'x-s23-polygon':return{...common,points:[],closed:false};
 case'x-s23-frame':return{...common,edges:[],turns:0};
 case'x-s23-tile':return{...common,rotations:Array(t.slots).fill(0),slots:Array(t.slots).fill(null),assembledOnce:false,separated:false};
 case'x-s23-sides':return{...common,marked:[]};
 case'x-s23-symmetry':return{...common,tested:[],marked:[],last:null,none:false,turns:0};
 case'x-s23-quad':return{...common,tested:[],selected:[]};
 case'x-s23-lines':return{...common,tests:[]};
 case'x-s23-ruler':return{...common,drawing:null};
 case'x-s23-objects':return{...common,shape:'',orientation:'upright',rolled:false,stacked:false,packed:[]};
 case'x-s23-scene':return{...common,slots:Array(t.slots.length).fill(null)};
 case'x-s23-pixels':return{...common,selected:[]};
 case'x-s23-circle':return{...common,radius:null,radial:false,diameter:false,rim:false,turns:0};
 case'x-s23-notation':return{...common,saved:null};
 case'x-s23-compass':return{...common,circles:{},marked:[],finished:false,measured:false,lastArc:null};
 }}
export const initial=(t,s=seed())=>({...fields(t),seed:s,board:board(t),history:[],issue:''});
const af={reset:[],toggle:[],sort:['item','slot'],unplace:['piece'],add:[],undo:[],close:[],stick:[],turn:[],rotate:['piece'],place:['piece'],test:[],mark:[],none:[],class:[],lineTest:['first','second'],draw:['first','second','angle'],object:['choice'],flip:[],roll:[],stack:[],pack:[],scene:['choice','slot'],circle:['radius'],radial:[],diameter:[],rim:[],measure:[],label:['segment','angleName','parallelName','perpName'],arc:['center','radius'],meet:[],line:[]};
const validEvent=(t,e)=>e&&e.f&&af[e.a]&&Object.keys(e.f).length===af[e.a].length&&af[e.a].every(k=>txt(e.f[k]))&&e.d&&Object.keys(e.d).every(k=>k==='index'&&txt(e.d[k]));
const flip=(arr,n)=>{const i=arr.indexOf(n);if(i<0)arr.push(n);else arr.splice(i,1);};
const compassCenters=t=>t.mode==='bisector'?{A:[2,5],B:[8,5]}:t.mode==='angle'?{O:[2,2],C:[4,2],D:[2,4]}:{P:[5,8],C:[1,5],D:[9,5]};
export function compassPoints(t,b){const c=compassCenters(t),a=t.mode==='bisector'?'A':'C',d=t.mode==='bisector'?'B':'D';if(!Number.isFinite(b.circles[a])||!Number.isFinite(b.circles[d]))return[];return G.intersections(c[a],b.circles[a],c[d],b.circles[d]);}
export function requiredMeet(t,b){const ps=compassPoints(t,b);if(ps.length!==2||G.dist(ps[0],ps[1])<1e-7)return[];if(t.mode==='bisector')return[0,1];if(t.mode==='angle')return[G.dist(ps[0],[2,2])>G.dist(ps[1],[2,2])?0:1];return[ps[0][1]<ps[1][1]?0:1];}
function compassReady(t,b){const a=t.mode==='bisector'?'A':'C',c=t.mode==='bisector'?'B':'D',r=b.circles[a],s=b.circles[c],min=t.mode==='bisector'?3:t.mode==='angle'?Math.SQRT2:4,seedOk=t.mode==='bisector'||t.mode==='angle'&&eq(b.circles.O,2)||t.mode==='perpendicular'&&eq(b.circles.P,5);return seedOk&&Number.isFinite(r)&&Number.isFinite(s)&&eq(r,s)&&r>min&&r<=6&&requiredMeet(t,b).length>0;}
function apply(t,b,e){const{a,f,d}=e,i=number(d.index);let issue='';const fail=s=>issue=s;b.first[a]??=cp(f);
 if(a==='reset'){const fresh=board(t);fresh.first=cp(b.first);return{board:fresh,issue};}
 if(t.type==='x-s23-nest'&&a==='sort'){const n=number(f.item),r=number(f.slot);if(int(n,0,t.cards.length-1)&&int(r,0,2))b.assigned[n]=r;else fail('先选择图形和要放的范围。');}
 if(t.type==='x-s23-pick'&&a==='toggle'&&int(i,0,t.cards.length-1))flip(b.selected,i);
 if(t.type==='x-s23-polygon'){
  if(a==='add'&&int(i,0,gridPoints(t).length-1)&&!b.closed&&!b.points.includes(i)&&b.points.length<t.n)b.points.push(i);
  if(a==='undo'){b.points.pop();b.closed=false;}
  if(a==='close'){if(b.points.length===t.n&&G.simple(b.points.map(k=>gridPoints(t)[k])))b.closed=true;else fail('先按顺序连够点；线不能交叉，也不能把同一条直线上的点当作一个角。');}
 }
 if(t.type==='x-s23-frame'){if(a==='stick'&&t.mode==='build'&&int(i,0,11))flip(b.edges,i);if(a==='turn')b.turns++;}
 if(t.type==='x-s23-tile'){
  const p=number(f.piece);
  if(a==='rotate'){if(int(p,0,t.slots-1)){b.rotations[p]=(b.rotations[p]+pieceStep(t))%360;if(tileCorrect(t,b))b.assembledOnce=true;}else fail('先选一块，再转动。');}
  if(a==='place'){if(int(p,0,t.slots-1)){b.slots[p]=p;if(tileCorrect(t,b))b.assembledOnce=true;}else fail('先选一块。');}
  if(a==='unplace'){if(int(p,0,t.slots-1)&&b.slots.includes(p)&&b.assembledOnce){b.slots=b.slots.map(x=>x===p?null:x);b.separated=true;}else fail('先完整拼好，再选一块取出。');}
 }
 if(t.type==='x-s23-sides'&&a==='mark'&&int(i,0,G.shapes[t.shape].length-1))flip(b.marked,i);
 if(t.type==='x-s23-symmetry'){
  if(a==='test'&&int(i,0,t.candidates.length-1)){if(!b.tested.includes(i))b.tested.push(i);b.last=i;}
  if(a==='mark'&&int(i,0,t.candidates.length-1)){flip(b.marked,i);b.none=false;}
  if(a==='none'){b.none=!b.none;b.marked=[];}
  if(a==='turn')b.turns++;
 }
 if(t.type==='x-s23-quad'){
  if(a==='test'&&int(i,0,2)&&!b.tested.includes(i))b.tested.push(i);
  if(a==='class'&&int(i,0,5))flip(b.selected,i);
 }
 if(t.type==='x-s23-lines'&&a==='lineTest'){
  const x=number(f.first),y=number(f.second),ps=G.scenario(t.shape,t.rotation);
  if(int(x,0,ps.length-1)&&int(y,0,ps.length-1)&&x!==y){const relation=G.lineRelation(ps,x,y);b.tests.push({first:x,second:y,...relation});}else fail('选两条不同的边，再把它们延长比较。');
 }
 if(t.type==='x-s23-ruler'&&a==='draw'){
  const ps=G.pointsForMeasure(t,f);if(ps)b.drawing={first:f.first,second:f.second,angle:f.angle,points:ps};else fail('先填写允许的长度和角度，再画出来。');
 }
 if(t.type==='x-s23-objects'){
  if(a==='object'&&['cylinder','cuboid','cube','sphere'].includes(f.choice)){b.shape=f.choice;b.orientation='upright';b.rolled=false;b.stacked=false;b.packed=[];}
  if(a==='flip'&&b.shape)b.orientation=b.orientation==='upright'?'side':'upright';
  if(a==='roll'){if(b.shape==='cylinder'&&b.orientation==='side')b.rolled=true;else fail('在这个模型里，先把圆柱放倒，再让曲面接触地面。');}
  if(a==='stack'){if(['cuboid','cube'].includes(b.shape)||b.shape==='cylinder'&&b.orientation==='upright')b.stacked=true;else fail('看看接触面：在没有支撑的水平面上，先找平的一面。');}
  if(a==='pack'&&int(i,0,3)){if(b.shape==='cuboid')flip(b.packed,i);else fail('先选择长方体。');}
 }
 if(t.type==='x-s23-scene'&&a==='scene'){const s=number(f.slot);if(int(s,0,t.slots.length-1)&&['cuboid','roof','rectangle','triangle','slope'].includes(f.choice))b.slots[s]=f.choice;else fail('先选一块，再选放的位置。');}
 if(t.type==='x-s23-pixels'&&a==='toggle'&&int(i,0,48))flip(b.selected,i);
 if(t.type==='x-s23-circle'){
  if(a==='circle'){const r=number(f.radius);if(Number.isFinite(r)&&r>0&&r<=10){b.radius=r;b.radial=false;b.diameter=false;b.rim=false;b.turns=0;}else fail('先填一个大于0、不超过10的半径。');}
  if(a==='radial'&&b.radius!==null)b.radial=true;
  if(a==='diameter'&&b.radius!==null)b.diameter=true;
  if(a==='rim'&&b.radius!==null)b.rim=true;
  if(a==='turn'&&b.radius!==null)b.turns++;
 }
 if(t.type==='x-s23-notation'&&a==='label')b.saved=cp(f);
 if(t.type==='x-s23-compass'){
  const cs=compassCenters(t),r=number(f.radius);
  if(a==='arc'){
   if(!Object.hasOwn(cs,f.center)||!Number.isFinite(r)||r<=0||r>6)fail('先选圆心，再给圆规一个大于0、不超过6的张口。');
   else if((t.mode==='angle'&&['C','D'].includes(f.center)&&!eq(b.circles.O,2))||(t.mode==='perpendicular'&&['C','D'].includes(f.center)&&!eq(b.circles.P,5)))fail('先用顶点或线外的点画第一圈，找出两个圆心。');
   else{b.circles[f.center]=r;b.marked=[];b.finished=false;b.measured=false;b.lastArc={center:f.center,radius:f.radius};if(t.mode==='angle'&&f.center==='O'||t.mode==='perpendicular'&&f.center==='P'){delete b.circles.C;delete b.circles.D;}}
  }
  if(a==='meet'){const ps=compassPoints(t,b);if(int(i,0,ps.length-1)&&G.dist(ps[0],ps[1])>1e-7)flip(b.marked,i);else fail('先让两段圆弧真正相交。');b.finished=false;b.measured=false;}
  if(a==='line'){if(compassReady(t,b)&&arrEqual(b.marked,requiredMeet(t,b)))b.finished=true;else fail('先检查两个圆的张口相同、确实相交，再标出需要的交点。');}
  if(a==='measure'&&t.mode==='angle'&&b.finished)b.measured=true;
 }
 return{board:b,issue};
}
export function act(t,m,action,data={}){const a=action.replace(/^g23-/,''),f=Object.fromEntries((af[a]||[]).map(k=>[k,cp(m[k])])),d=Object.fromEntries(Object.entries(data).filter(([k])=>k==='index').map(([k,v])=>[k,String(v)])),e={a,f,d};if(!validEvent(t,e)||m.history.length>=650)return m;const r=apply(t,cp(m.board),e);m.board=r.board;m.issue=r.issue;m.history.push(e);return m;}
export function field(t,m,k){const root=k.split('.')[0];if(root in fields(t)&&!Array.isArray(m[root]))m[root]=String(m[root]??'');}
export function valid(t,m){try{if(!m||!int(m.seed,1,4294967295)||!txt(m.issue)||!Array.isArray(m.history)||m.history.length>650)return false;for(const[k,v]of Object.entries(fields(t)))if(Array.isArray(v)?!Array.isArray(m[k])||m[k].length!==v.length||!m[k].every(txt):!txt(m[k]))return false;if(!m.history.every(e=>validEvent(t,e)))return false;let b=board(t);for(const e of m.history)b=apply(t,b,e).board;return same(b,m.board);}catch{return false;}}
const qs=(t,m)=>(t.questions||[]).every((q,i)=>q.options?String(m.answers[i])===String(q.value):near(m.answers[i],number(q.value)));
const word=s=>String(s).trim().toUpperCase().replace(/\s/g,'');
const edge=(s,a,b)=>{s=word(s);return s===a+b||s===b+a;};
function notation(saved){if(!saved)return false;const seg=edge(saved.segment,'A','B'),angle=['ABC','CBA'].includes(word(saved.angleName).replace(/^∠/,''));const rel=(s,symbol,a,b,c,d)=>{const parts=word(s).split(symbol);return parts.length===2&&(edge(parts[0],a,b)&&edge(parts[1],c,d)||edge(parts[1],a,b)&&edge(parts[0],c,d));};return seg&&angle&&(rel(saved.parallelName,'∥','A','B','C','D')||rel(saved.parallelName,'//','A','B','C','D'))&&rel(saved.perpName,'⊥','A','B','B','C');}
export function inspect(t,m){const b=m.board;let ok=false,hint='先把画面上的操作做完，再回来看一看。';
 if(t.type==='x-s23-nest'){ok=same(b.assigned,t.regions);hint='先数边和直角；正方形也属于长方形，长方形也属于四边形。';}
 if(t.type==='x-s23-pick'){ok=arrEqual(b.selected,targets(t));hint='沿着边走一圈：直边、数量和是否闭合，都要对上。';}
 if(t.type==='x-s23-polygon'){const ps=b.points.map(i=>gridPoints(t)[i]),p=ps.length===t.n&&G.simple(ps)?G.properties(ps):null;ok=b.closed&&!!p&&(t.kind==='any'||t.kind==='rectangle'&&p.rectangle||t.kind==='otherquad'&&!p.rectangle&&!p.rhombus||t.kind==='regular'&&p.regular);hint='先连接成不交叉的封闭图形；再检查需要的边、角和关系。';}
 if(t.type==='x-s23-frame'){ok=t.mode==='build'?b.edges.length===12:b.turns>0;hint=t.mode==='build'?'转一转，别忘了被挡住的边。':'转动立体，看看它在新方向是否仍是同一个形状。';}
 if(t.type==='x-s23-tile'){ok=t.decompose?b.assembledOnce&&b.separated&&b.slots.filter(p=>p===null).length===1:tileCorrect(t,b);hint='移动并转动小块，让轮廓内没有重叠或空隙。';}
 if(t.type==='x-s23-sides'){ok=b.marked.length===G.shapes[t.shape].length;hint='每条边各点一次，沿着轮廓走一圈。';}
 if(t.type==='x-s23-symmetry'){const target=axes(t);ok=b.tested.length===t.candidates.length&&arrEqual(b.marked,target)&&(target.length>0?!b.none:b.none)&&(!t.turn||b.turns>0);hint='试每条候选线：反射后的整个轮廓要与原图完全重合。';}
 if(t.type==='x-s23-quad'){ok=b.tested.length===3&&arrEqual(b.selected,classes(t));hint='先检查边、角和对边，再放进所有符合条件的家族。';}
 if(t.type==='x-s23-lines'){ok=t.required.every(k=>b.tests.some(x=>x[k]));hint='选不同边并延长，看是否平行、是否形成直角。';}
 if(t.type==='x-s23-ruler'){const x=b.drawing,unchanged=x&&['first','second','angle'].every(k=>x[k]===m[k]);ok=!!unchanged&&(t.mode==='triangle'?arrEqual([number(x.first),number(x.second)],t.target.slice(0,2))&&near(x.angle,t.target[2]):t.mode==='rectangle'?arrEqual([number(x.first),number(x.second)],t.target):near(x.first,t.target[0])&&near(x.angle,t.target[1]));hint='用题目中的长度和角度重新画一次，检查你实际画出的图形。';}
 if(t.type==='x-s23-objects'){ok=(t.allowed==='blocks'?['cube','cuboid'].includes(b.shape):b.shape===t.allowed)&&t.required.every(k=>k==='roll'?b.rolled:k==='stack'?b.stacked:b.packed.length===4);hint='先选合适形状，再调整摆放方向，尝试滚动、叠放或排列。';}
 if(t.type==='x-s23-scene'){ok=same(b.slots,t.slots);hint='看每个位置需要哪一种形状；图只是一个简化模型。';}
 if(t.type==='x-s23-pixels'){const hit=b.selected.filter(x=>pixels.includes(x)).length,out=b.selected.filter(x=>!pixels.includes(x)).length;ok=hit>=Math.ceil(pixels.length*.8)&&out<=1;hint='覆盖叶子的大部分，同时少涂到轮廓外；近似不需要每格完全一致。';}
 if(t.type==='x-s23-circle'){ok=eq(b.radius,t.radius)&&near(m.radius,b.radius)&&b.radial&&b.diameter&&b.rim&&(!t.turn||b.turns>0);hint='先画圆，再从圆心画到圆周，画出穿过圆心的整条线。';}
 if(t.type==='x-s23-notation'){ok=notation(b.saved)&&['segment','angleName','parallelName','perpName'].every(k=>b.saved[k]===m[k]);hint='角名中间字母是顶点；线段可以从任一端开始命名。';}
 if(t.type==='x-s23-compass'){ok=b.finished&&(t.mode!=='angle'||b.measured)&&compassReady(t,b)&&b.lastArc&&b.lastArc.center===m.center&&b.lastArc.radius===m.radius;hint='先画出需要的圆弧并标真实交点，再用直尺连接。';}
 ok=!!ok&&qs(t,m);return{correct:ok,feedback:ok?'这次操作和记录对上了。':hint,evidence:{kind:'B23 bounded geometry construction',board:cp(b),history:cp(m.history),fields:Object.fromEntries(Object.keys(fields(t)).map(k=>[k,cp(m[k])])),freeTextMeaningAssessed:false,physicalManipulationAssessed:false,generalMasteryAssessed:false}};
}
export function solveSteps(t,s=314159){const m=initial(t,s),steps=[],f=(k,v)=>{if(v==='')return;const z=String(v);steps.push({field:k,value:z});const p=k.split('.');if(p.length===2)m[p[0]][+p[1]]=z;else m[k]=z;field(t,m,k);},a=(action,data={})=>{steps.push({action:'g23-'+action,data});act(t,m,'g23-'+action,data);};
 if(t.type==='x-s23-nest')t.regions.forEach((r,i)=>{f('item',i);f('slot',r);a('sort');});
 if(t.type==='x-s23-pick')targets(t).forEach(index=>a('toggle',{index}));
 if(t.type==='x-s23-polygon'){const ex=t.preset?Array.from({length:t.n},(_,i)=>i):t.n===3?[8,12,38]:t.n===4&&t.kind==='otherquad'?[8,12,32,36]:t.n===4?[8,12,33,29]:t.n===5?[3,12,32,38,22]:[2,4,13,32,37,21];ex.forEach(index=>a('add',{index}));a('close');}
 if(t.type==='x-s23-frame'){if(t.mode==='build')for(let i=0;i<12;i++)a('stick',{index:i});else{steps.push({action:'turn-extra',data:{}});act(t,m,'g23-turn');}}
 if(t.type==='x-s23-tile')for(let i=0;i<t.slots;i++){f('piece',i);for(let j=0;j<wantedRotation(t,i)/pieceStep(t);j++)a('rotate');a('place');}if(t.type==='x-s23-tile'&&t.decompose){f('piece',0);a('unplace');}
 if(t.type==='x-s23-sides')for(let i=0;i<G.shapes[t.shape].length;i++)a('mark',{index:i});
 if(t.type==='x-s23-symmetry'){t.candidates.forEach((_,index)=>a('test',{index}));axes(t).forEach(index=>a('mark',{index}));if(!axes(t).length)a('none');if(t.turn)a('turn');}
 if(t.type==='x-s23-quad'){for(let i=0;i<3;i++)a('test',{index:i});classes(t).forEach(index=>a('class',{index}));}
 if(t.type==='x-s23-lines'){if(t.required.includes('parallel')){f('first',0);f('second',2);a('lineTest');}if(t.required.includes('perpendicular')){f('first',0);f('second',t.shape==='righttriangle'?2:1);a('lineTest');}}
 if(t.type==='x-s23-ruler'){f('first',t.target[0]);if(t.mode!=='regular')f('second',t.target[1]);if(t.mode==='triangle')f('angle',t.target[2]);if(t.mode==='regular')f('angle',t.target[1]);a('draw');}
 if(t.type==='x-s23-objects'){f('choice',t.allowed==='blocks'?'cube':t.allowed);a('object');if(t.required.includes('roll')){a('flip');a('roll');a('flip');}if(t.required.includes('stack'))a('stack');if(t.required.includes('pack'))for(let i=0;i<4;i++)a('pack',{index:i});}
 if(t.type==='x-s23-scene')t.slots.forEach((x,i)=>{f('choice',x);f('slot',i);a('scene');});
 if(t.type==='x-s23-pixels')pixels.forEach(index=>a('toggle',{index}));
 if(t.type==='x-s23-circle'){f('radius',t.radius);a('circle');a('radial');a('diameter');a('rim');if(t.turn)a('turn');}
 if(t.type==='x-s23-notation'){f('segment','AB');f('angleName','ABC');f('parallelName','AB∥CD');f('perpName','AB⊥BC');a('label');}
 if(t.type==='x-s23-compass'){if(t.mode!=='bisector'){f('center',t.mode==='angle'?'O':'P');f('radius',t.mode==='angle'?2:5);a('arc');}for(const c of t.mode==='bisector'?['A','B']:['C','D']){f('center',c);f('radius',t.mode==='angle'?2:5);a('arc');}requiredMeet(t,m.board).forEach(index=>a('meet',{index}));a('line');if(t.mode==='angle')a('measure');}
 (t.questions||[]).forEach((q,i)=>f('answers.'+i,q.value));return steps;
}
export function example(t){const m=initial(t,314159);for(const v of solveSteps(t))if(v.field){const p=v.field.split('.');if(p.length===2)m[p[0]][+p[1]]=v.value;else m[v.field]=v.value;field(t,m,v.field);}else act(t,m,v.action==='turn-extra'?'g23-turn':v.action,v.data);return m;}
