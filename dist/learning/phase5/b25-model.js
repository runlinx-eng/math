import {number} from './b20-model.js';
import * as G from './b25-geometry.js';
export const TYPES=new Set(['x-g25-turn','x-g25-compare','x-g25-protractor','x-g25-polygon','x-g25-triangle','x-g25-parallel','x-g25-estimate','x-g25-vertices','x-g25-corners','x-g25-similar','x-g25-ticks']);
const cp=x=>structuredClone(x),same=(a,b)=>JSON.stringify(a)===JSON.stringify(b),text=x=>typeof x==='string'&&x.length<=1500,int=(x,a,b)=>Number.isInteger(x)&&x>=a&&x<=b,near=(a,b)=>Number.isFinite(number(a))&&Math.abs(number(a)-b)<1e-7;
const names=['angle','length','base','a','b','other','prose'];
const seed=()=>globalThis.crypto.getRandomValues(new Uint32Array(1))[0]||1;
export const fields=t=>({...Object.fromEntries(names.map(k=>[k,''])),answers:Array(t.questions?.length||0).fill('')});
function board(t){const common={first:{}};switch(t.type){
 case'x-g25-turn':return{...common,angle:0,length:1,records:[]};
 case'x-g25-compare':return{...common,tested:[],selected:[],last:null};
 case'x-g25-protractor':return{...common,x:-40,y:20,rotation:180,drawn:null};
 case'x-g25-polygon':return{...common,diagonals:[]};
 case'x-g25-triangle':return{...common,base:null,a:null,b:null,angle:null,other:null,constructed:false,points:[],chosen:[],finished:false};
 case'x-g25-parallel':return{...common,slid:false};
 case'x-g25-estimate':return{...common,guess:null,revealed:false};
 case'x-g25-vertices':return{...common,selected:[]};
 case'x-g25-corners':return{...common,selected:[]};
 case'x-g25-similar':return{...common,scale:1};
 case'x-g25-ticks':return{...common,marks:[0,0,0,0]};
 }}
export const initial=(t,s=seed())=>({...fields(t),seed:s,board:board(t),history:[],issue:''});
const af={set:['angle'],quarter:[],length:['length'],record:[],test:[],choose:[],undo:[],move:[],flip:[],draw:['angle'],diagonal:[],base:['base'],a:['a'],b:['b'],angle:['angle'],other:['other'],construct:[],finish:[],slide:[],markSide:[],guess:['angle'],reveal:[],reset:[]};
const eventValid=e=>e&&e.f&&af[e.a]&&Object.keys(e.f).length===af[e.a].length&&af[e.a].every(k=>text(e.f[k]))&&e.d&&Object.keys(e.d).every(k=>k==='index'&&text(e.d[k]));
const toggle=(xs,n)=>{const i=xs.indexOf(n);if(i<0)xs.push(n);else xs.splice(i,1);};
export function candidatePoints(t,b){if(!(b.base>0))return[];const A=[0,0],B=[b.base,0];if(t.mode==='sss'&&b.a>0&&b.b>0)return G.circleIntersections(A,b.a,B,b.b);if(t.mode==='ssa'&&b.b>0&&b.angle>0&&b.angle<180)return G.ssa(b.base,b.b,b.angle);if(t.mode==='sas'&&b.a>0){const p=G.sas(b.base,b.a,b.angle);return p?[p[2]]:[];}if(t.mode==='asa'){const p=G.asa(b.base,b.angle,b.other);return p?[p[2]]:[];}return[];}
export const usablePoints=(t,b)=>candidatePoints(t,b).filter(p=>Math.abs(p[1])>1e-7);
function apply(t,b,e){const{a,f,d}=e,i=number(d.index);let issue='';const fail=s=>issue=s;b.first[a]??=cp(f);
 if(a==='reset'){const fresh=board(t);fresh.first=cp(b.first);return{board:fresh,issue};}
 if(t.type==='x-g25-turn'){
  if(a==='set'){let v=number(f.angle);if(int(v,0,360))b.angle=v;else fail('先填0到360之间的整数，再转动。');}
  if(a==='quarter')b.angle=b.angle===360?90:Math.min(360,b.angle+90);
  if(a==='length'){let v=number(f.length);if(int(v,1,3))b.length=v;else fail('选择一条短、中或长的边。');}
  if(a==='record'&&!b.records.some(r=>r.angle===b.angle&&r.length===b.length))b.records.push({angle:b.angle,length:b.length});
 }
 if(t.type==='x-g25-compare'){
  if(a==='test'&&int(i,0,t.angles.length-1)){if(!b.tested.includes(i))b.tested.push(i);b.last=i;}
  if(a==='choose'&&int(i,0,t.angles.length-1)){if(t.order){if(!b.selected.includes(i))b.selected.push(i);}else toggle(b.selected,i);}
  if(a==='undo')b.selected.pop();
 }
 if(t.type==='x-g25-protractor'){
  if(a==='move'){const moves={left:[-20,0],right:[20,0],up:[0,-20],down:[0,20]},delta=moves[d.index];if(delta&&Math.abs(b.x+delta[0])<=100&&Math.abs(b.y+delta[1])<=100){b.x+=delta[0];b.y+=delta[1];b.drawn=null;}else fail('量角器先留在画面里。');}
  if(a==='flip'){b.rotation=(b.rotation+180)%360;b.drawn=null;}
  if(a==='draw'){const v=number(f.angle);if(int(v,1,179)){b.drawn=v;}else fail('先输入1到179之间的整度数。');}
 }
 if(t.type==='x-g25-polygon'&&a==='diagonal'&&int(i,2,t.n-2))toggle(b.diagonals,i);
 if(t.type==='x-g25-ticks'&&a==='markSide'&&int(i,0,3))b.marks[i]=(b.marks[i]+1)%3;
 if(t.type==='x-g25-vertices'&&a==='choose'&&int(i,0,t.points.length-1))toggle(b.selected,i);
 if(t.type==='x-g25-corners'&&a==='choose'&&int(i,0,2))toggle(b.selected,i);
 if(t.type==='x-g25-similar'&&a==='length'){const v=number(f.length);if(Number.isFinite(v)&&v>=0.5&&v<=3)b.scale=v;else fail('选择0.5到3之间的倍数。');}
 if(t.type==='x-g25-parallel'&&a==='slide')b.slid=!b.slid;
 if(t.type==='x-g25-estimate'){if(a==='guess'){const v=number(f.angle);if(int(v,0,360)){b.guess=v;b.revealed=false;b.first.guessValue??=v;if(Math.abs(v-t.amount)>t.tolerance)b.first.incorrectPrediction=true;}else fail('先估一个0到360之间的度数。');}if(a==='reveal'){if(b.guess!==null)b.revealed=true;else fail('先留下自己的估计，再量一量。');}}
 if(t.type==='x-g25-triangle'){
  if(['base','a','b'].includes(a)){const v=number(f[a]);if(Number.isFinite(v)&&v>0&&v<=12){b[a]=v;b.constructed=false;b.points=[];b.chosen=[];b.finished=false;}else fail('长度要大于0，且不超过12。');}
  if(['angle','other'].includes(a)){const v=number(f[a]);if(Number.isFinite(v)&&v>0&&v<180){b[a]=v;b.constructed=false;b.points=[];b.chosen=[];b.finished=false;}else fail('角要大于0°，小于180°。');}
  if(a==='construct'){const ready=b.base>0&&(t.mode==='sss'?b.a>0&&b.b>0:t.mode==='ssa'?b.b>0&&b.angle>0:t.mode==='sas'?b.a>0&&b.angle>0:b.angle>0&&b.other>0);if(ready){b.constructed=true;b.points=candidatePoints(t,b);b.chosen=[];b.finished=false;}else fail('先把题目给出的边和角逐项放到图上。');}
  if(a==='choose'&&b.constructed&&int(i,0,b.points.length-1)){if(Math.abs(b.points[i][1])>1e-7)toggle(b.chosen,i);else fail('这个交点在底边上，三条边躺成一条线，不能围成三角形。');b.finished=false;}
  if(a==='finish'){if(b.constructed)b.finished=true;else fail('先把给定条件画出来。');}
 }
 return{board:b,issue};
}
export function act(t,m,action,data={}){const a=action.replace(/^g25-/,''),f=Object.fromEntries((af[a]||[]).map(k=>[k,cp(m[k])])),d=Object.fromEntries(Object.entries(data).filter(([k])=>k==='index').map(([k,v])=>[k,String(v)])),e={a,f,d};if(!eventValid(e)||m.history.length>=1000)return m;const r=apply(t,cp(m.board),e);m.board=r.board;m.issue=r.issue;m.history.push(e);return m;}
export function field(t,m,k){const root=k.split('.')[0];if(root in fields(t)&&!Array.isArray(m[root]))m[root]=String(m[root]??'');}
export function valid(t,m){try{if(!m||!TYPES.has(t.type)||!int(m.seed,1,4294967295)||!text(m.issue)||!Array.isArray(m.history)||m.history.length>1000)return false;for(const[k,v]of Object.entries(fields(t)))if(Array.isArray(v)?!Array.isArray(m[k])||m[k].length!==v.length||!m[k].every(text):!text(m[k]))return false;if(!m.history.every(eventValid))return false;let b=board(t);for(const e of m.history)b=apply(t,b,e).board;return same(b,m.board);}catch{return false;}}
const qs=(t,m)=>(t.questions||[]).every((q,i)=>q.options?String(m.answers[i])===String(q.value):near(m.answers[i],Number(q.value)));
const required=t=>Array.from({length:Math.max(0,t.n-3)},(_,i)=>i+2);
export function inspect(t,m){const b=m.board;let ok=false,hint='先在图上试一试，再核对记录。';
 if(t.type==='x-g25-turn'){ok=t.targets.every(x=>b.records.some(r=>r.angle===x))&&(!t.compareLengths||[1,3].every(length=>b.records.some(r=>r.angle===t.targets[0]&&r.length===length)));hint='调整开口并记下要求的每次转动；角度看开口，不由边的长短决定。';}
 if(t.type==='x-g25-compare'){const want=t.order?[...t.angles.keys()].sort((a,b)=>t.angles[a]-t.angles[b]):t.angles.flatMap((a,i)=>G.angleKind(a)===t.kind?[i]:[]);ok=(!t.requireTest||b.tested.length===t.angles.length)&&same(t.order?b.selected:[...b.selected].sort((a,b)=>a-b),t.order?want:want.sort((a,b)=>a-b));hint='可以先把每个开口放到同一个角上比较，再选择或排列。';}
 if(t.type==='x-g25-protractor'){const aligned=b.x===0&&b.y===0&&b.rotation===0;ok=aligned&&(t.mode==='measure'||b.drawn===t.amount&&near(m.angle,b.drawn));hint='把量角器的中心放在顶点，0°基线贴住一条边，再沿正确刻度读或画。';}
 if(t.type==='x-g25-polygon'){ok=same([...b.diagonals].sort((a,b)=>a-b),required(t));hint='从同一个顶点连向不相邻的顶点，看看分成几块三角形。';}
 if(t.type==='x-g25-ticks'){ok=same(b.marks,[1,2,1,2])||same(b.marks,[2,1,2,1]);hint='两条等长的边要有同样刻痕，另一组用另一种刻痕。';}
 if(t.type==='x-g25-similar'){ok=G.close(b.scale,2)&&near(m.length,b.scale);hint='保持三个角不变，把第二个三角形放大到两倍。';}
 if(t.type==='x-g25-corners'){ok=b.selected.length===3;hint='把三个角都搬到同一个点，比较它们合起来的开口。';}
 if(t.type==='x-g25-vertices'){const want=G.interiorAngles(t.points).flatMap((a,i)=>Math.abs(a-90)<1e-6?t.kind==='right'?[i]:[]:G.angleKind(a)===t.kind?[i]:[]);ok=same([...b.selected].sort((a,b)=>a-b),want)&&want.length>0;hint='从每个顶点看两条边的开口，再和直角比较。';}
 if(t.type==='x-g25-estimate'){ok=b.revealed&&near(m.angle,b.guess)&&Math.abs(b.guess-t.amount)<=t.tolerance;hint='先和直角或半圈比较，留下估计，再量一量检查。';}
 if(t.type==='x-g25-parallel'){ok=b.slid;hint='把上面交点的整组角沿着斜线平移到下面，比较对应位置。';}
 if(t.type==='x-g25-triangle'){const expected=Object.entries(t.target).every(([k,v])=>G.close(b[k],v)&&near(m[k],v));const chosen=b.chosen.filter(i=>b.points[i]&&Math.abs(b.points[i][1])>1e-7);ok=expected&&b.constructed&&b.finished&&chosen.length===t.chooseCount;hint='先按条件画边和角或圆弧，再看交点能不能围成三角形；贴成一条线不算。';}
 ok=!!ok&&qs(t,m);return{correct:ok,feedback:ok?'这次操作和记录对上了。':hint,evidence:{kind:'B25 bounded angle and triangle investigation',board:cp(b),history:cp(m.history),fields:Object.fromEntries(Object.keys(fields(t)).map(k=>[k,cp(m[k])])),freeTextMeaningAssessed:false,physicalToolsAssessed:false,generalMasteryAssessed:false}};
}
export function solveSteps(t,s=314159){const m=initial(t,s),steps=[],f=(k,v)=>{const z=String(v);steps.push({field:k,value:z});const p=k.split('.');if(p.length===2)m[p[0]][+p[1]]=z;else m[k]=z;field(t,m,k);},a=(action,data={})=>{steps.push({action:'g25-'+action,data});act(t,m,'g25-'+action,data);};
 if(t.type==='x-g25-turn'){for(const v of t.targets){f('angle',v);a('set');a('record');}if(t.compareLengths){f('angle',t.targets[0]);a('set');f('length',3);a('length');a('record');}}
 if(t.type==='x-g25-compare'){if(t.requireTest)t.angles.forEach((_,index)=>a('test',{index}));const want=t.order?[...t.angles.keys()].sort((a,b)=>t.angles[a]-t.angles[b]):t.angles.flatMap((v,i)=>G.angleKind(v)===t.kind?[i]:[]);want.forEach(index=>a('choose',{index}));}
 if(t.type==='x-g25-protractor'){a('move',{index:'right'});a('move',{index:'right'});a('move',{index:'up'});a('flip');if(t.mode==='draw'){f('angle',t.amount);a('draw');}}
 if(t.type==='x-g25-polygon')required(t).forEach(index=>a('diagonal',{index}));
 if(t.type==='x-g25-parallel')a('slide');
 if(t.type==='x-g25-corners')[0,1,2].forEach(index=>a('choose',{index}));
 if(t.type==='x-g25-similar'){f('length',2);a('length');}
 if(t.type==='x-g25-ticks'){for(const[i,n]of [1,2,1,2].entries())for(let k=0;k<n;k++)a('markSide',{index:i});}
 if(t.type==='x-g25-vertices')G.interiorAngles(t.points).forEach((v,index)=>{if((Math.abs(v-90)<1e-6?'right':G.angleKind(v))===t.kind)a('choose',{index});});
 if(t.type==='x-g25-estimate'){f('angle',t.amount);a('guess');a('reveal');}
 if(t.type==='x-g25-triangle'){for(const[k,v]of Object.entries(t.target)){f(k,v);a(k);}a('construct');const good=usablePoints(t,m.board);for(let n=0;n<t.chooseCount;n++){const index=m.board.points.findIndex(p=>same(p,good[n]));a('choose',{index});}a('finish');}
 (t.questions||[]).forEach((q,i)=>f('answers.'+i,q.value));return steps;}
export function example(t){const m=initial(t,314159);for(const v of solveSteps(t))if(v.field){const p=v.field.split('.');if(p.length===2)m[p[0]][+p[1]]=v.value;else m[p[0]]=v.value;field(t,m,v.field);}else act(t,m,v.action,v.data);return m;}
