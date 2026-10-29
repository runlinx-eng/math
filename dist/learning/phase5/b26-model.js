import {number} from './b20-model.js';
import * as G from './b26-geometry.js';
export const TYPES=new Set(['x-g26-area','x-g26-check','x-g26-length','x-g26-trig']);
const cp=x=>structuredClone(x),same=(a,b)=>JSON.stringify(a)===JSON.stringify(b),txt=x=>typeof x==='string'&&x.length<=1500,int=(n,a,b)=>Number.isInteger(n)&&n>=a&&n<=b,near=(a,b,t=1e-7)=>Number.isFinite(number(a))&&G.close(number(a),b,t),seed=()=>globalThis.crypto.getRandomValues(new Uint32Array(1))[0]||1;
const names=['scale','square','result','calcKind','calcInput','prose'];
export const fields=t=>({...Object.fromEntries(names.map(k=>[k,''])),answers:Array(t.questions?.length||0).fill('')});
function board(t){const common={first:{}};switch(t.type){
 case'x-g26-area':return{...common,hyp:null,scale:1,seen:[]};
 case'x-g26-check':return{...common,tested:[],choice:null};
 case'x-g26-length':return{...common,corner:null,hyp:null,op:null,saved:null,help:false};
 case'x-g26-trig':return{...common,ref:null,selected:null,editing:true,roles:{'1':{hyp:null,opp:null,adj:null},'2':{hyp:null,opp:null,adj:null}},confirmed:[],scale:1,observations:[],ratio:null,saved:null,calculator:null,help:false};
 }}
export const initial=(t,s=seed())=>({...fields(t),seed:s,board:board(t),history:[],issue:''});
const af={hyp:[],scale:['scale'],look:[],probe:[],choose:[],corner:[],op:[],save:['square','result'],ref:[],edge:[],assign:[],confirm:[],observe:[],ratio:[],edit:[],calc:['calcKind','calcInput'],answer:['result'],help:[],reset:[]};
const eventValid=e=>e&&e.f&&af[e.a]&&Object.keys(e.f).length===af[e.a].length&&af[e.a].every(k=>txt(e.f[k]))&&e.d&&Object.keys(e.d).every(k=>k==='index'&&txt(e.d[k]));
export const roleCorrect=(b,ref)=>!!G.roles(ref)&&same(b.roles[String(ref)],G.roles(ref));
export const sides=t=>{if(t.angle!==undefined&&t.hyp!==undefined)return[t.hyp*Math.cos(G.rad(t.angle)),t.hyp*Math.sin(G.rad(t.angle)),t.hyp];return[t.a,t.b,Math.hypot(t.a,t.b)];};
export function lengthGoal(t){const a=t.coord?Math.abs(t.points[1][0]-t.points[0][0]):t.a,b=t.coord?Math.abs(t.points[1][1]-t.points[0][1]):t.b,c=Math.hypot(a,b);return t.unknown==='leg'?{op:'subtract',square:c*c-a*a,result:b}:{op:'add',square:a*a+b*b,result:c};}
export function trigGoal(t){if(t.mode==='inverse')return G.angleAtB(t.a,t.b);return t.unknown==='opp'?t.hyp*Math.sin(G.rad(t.angle)):t.hyp*Math.cos(G.rad(t.angle));}
function apply(t,b,e){const{a,f,d}=e,i=number(d.index);let issue='';const fail=s=>issue=s;b.first[a]??=cp(f);
 if(a==='reset'){const z=board(t);z.first=cp(b.first);return{board:z,issue};}
 if(['x-g26-area','x-g26-length'].includes(t.type)&&a==='hyp'&&int(i,0,2)){
  if(t.coord&&!b.corner)fail('先在两个点之间画出水平和竖直两段。');else{b.first.hypChoice??=i;if(b.first.hypChoice!==1)b.first.badHyp=true;b.hyp=i;if(t.type==='x-g26-length'){b.op=null;b.saved=null;}}}
 if(t.type==='x-g26-area'){
  if(a==='scale'){const v=number(f.scale);if([1,2].includes(v))b.scale=v;else fail('先选择原大小或两倍。');}
  if(a==='look'){if(b.hyp!==1)fail('先找直角对面的那条边。');else if(!b.seen.includes(b.scale))b.seen.push(b.scale);}
 }
 if(t.type==='x-g26-check'){
  if(a==='probe'&&int(i,0,t.shapes.length-1)&&!b.tested.includes(i))b.tested.push(i);
  if(a==='choose'&&int(i,0,t.shapes.length-1))b.choice=i;
 }
 if(['x-g26-length','x-g26-trig'].includes(t.type)&&a==='help')b.help=true;
 if(t.type==='x-g26-length'){
  if(a==='corner'&&['hfirst','vfirst'].includes(d.index)){b.corner=d.index;b.hyp=null;b.op=null;b.saved=null;}
  if(a==='op'){if(b.hyp!==1)fail('先在图上找直角对面的边。');else if(['add','subtract'].includes(d.index)){b.op=d.index;b.saved=null;}}
  if(a==='save'){if(!b.op)fail('先选择相加或相减。');else if(!Number.isFinite(number(f.square))||!Number.isFinite(number(f.result)))fail('先填写平方后的面积和边长。');else b.saved=cp(f);}
 }
 if(t.type==='x-g26-trig'){
  if(a==='ref'&&[1,2].includes(i)){b.ref=i;b.selected=null;b.editing=!b.confirmed.includes(i);b.ratio=null;b.saved=null;b.calculator=null;}
  if(a==='edit'&&b.ref)b.editing=true;
  if(a==='edge'&&int(i,0,2)){if(b.ref){b.selected=i;b.editing=true;}else fail('先选择从哪个角看。');}
  if(a==='assign'&&['hyp','opp','adj'].includes(d.index)){if(!b.ref||b.selected===null)fail('先选择角，再选择一条边。');else{const r=b.roles[String(b.ref)];b.editing=true;for(const k of Object.keys(r))if(r[k]===b.selected)r[k]=null;r[d.index]=b.selected;b.confirmed=b.confirmed.filter(x=>x!==b.ref);b.observations=[];b.ratio=null;b.saved=null;}}
  if(a==='confirm'){if(b.ref&&roleCorrect(b,b.ref)){if(!b.confirmed.includes(b.ref))b.confirmed.push(b.ref);b.editing=false;b.selected=null;}else{b.first.badRoles=true;fail('斜边在直角对面；对边和邻边要相对选中的角看。');}}
  if(a==='scale'){const v=number(f.scale);if([1,2].includes(v))b.scale=v;else fail('选择原大小或两倍。');}
  if(a==='observe'){if(b.ref!==1||!b.confirmed.includes(1)||!roleCorrect(b,1))fail('先选B角并正确标出三条边。');else{const[a0,b0,h0]=sides(t),r={scale:b.scale,opposite:b0*b.scale,adjacent:a0*b.scale,hypotenuse:h0*b.scale,ratio:b0/h0};if(!b.observations.some(x=>x.scale===b.scale))b.observations.push(r);}}
  if(a==='ratio'){if(b.ref!==1||!b.confirmed.includes(1)||!roleCorrect(b,1))fail('先选B角并标出对边、邻边和斜边。');else if(['sin','cos','tan'].includes(d.index)){b.first.ratioChoice??=d.index;if(b.first.ratioChoice!==t.ratio)b.first.badRatio=true;b.ratio=d.index;b.saved=null;b.calculator=null;}}
  if(a==='calc'){const val=number(f.calcInput),out=G.calculate(f.calcKind,val);if(b.ratio&&out!==null)b.calculator={kind:f.calcKind,input:f.calcInput,result:out};else fail('先选关系，再输入这个计算器能计算的数。');}
  if(a==='answer'){if(!b.ratio)fail('先选用哪两个边之间的比例。');else if(!Number.isFinite(number(f.result)))fail('先填写计算结果。');else b.saved=cp(f);}
 }
 return{board:b,issue};
}
export function act(t,m,action,data={}){const a=action.replace(/^g26-/,''),f=Object.fromEntries((af[a]||[]).map(k=>[k,cp(m[k])])),d=Object.fromEntries(Object.entries(data).filter(([k])=>k==='index').map(([k,v])=>[k,String(v)])),e={a,f,d};if(!eventValid(e)||m.history.length>=1000)return m;const r=apply(t,cp(m.board),e);m.board=r.board;m.issue=r.issue;m.history.push(e);return m;}
export function field(t,m,k){const root=k.split('.')[0];if(root in fields(t)&&!Array.isArray(m[root]))m[root]=String(m[root]??'');}
export function valid(t,m){try{if(!m||!TYPES.has(t.type)||!int(m.seed,1,4294967295)||!txt(m.issue)||!Array.isArray(m.history)||m.history.length>1000)return false;for(const[k,v]of Object.entries(fields(t)))if(Array.isArray(v)?!Array.isArray(m[k])||m[k].length!==v.length||!m[k].every(txt):!txt(m[k]))return false;if(!m.history.every(eventValid))return false;let b=board(t);for(const e of m.history)b=apply(t,b,e).board;return same(b,m.board);}catch{return false;}}
const qs=(t,m)=>(t.questions||[]).every((q,i)=>q.options?String(m.answers[i])===String(q.value):near(m.answers[i],Number(q.value)));
export function inspect(t,m){const b=m.board;let ok=false,hint='先操作图形，再看一看结果。';
 if(t.type==='x-g26-area'){ok=b.hyp===1&&[1,2].every(s=>b.seen.includes(s));hint='先找直角对面的边，再比较原大小和两倍时三个正方形的面积。';}
 if(t.type==='x-g26-check'){const right=t.shapes.flatMap((p,i)=>G.rightVertex(p)>=0?[i]:[]);ok=b.tested.length===t.shapes.length&&right.length===1&&b.choice===right[0];hint='先检查每个图形是否有直角，再选一个。';}
 if(t.type==='x-g26-length'){const g=lengthGoal(t);ok=(!t.coord||!!b.corner)&&b.hyp===1&&b.op===g.op&&!!b.saved&&m.square===b.saved.square&&m.result===b.saved.result&&near(m.square,g.square,0.02)&&near(m.result,g.result,0.02);hint='先找斜边；求斜边时面积相加，求另一条直角边时从总面积中减去，再开平方。';}
 if(t.type==='x-g26-trig'){const confirmed=ref=>b.confirmed.includes(ref)&&roleCorrect(b,ref);if(t.mode==='roles')ok=confirmed(1)&&confirmed(2);else if(t.mode==='compare')ok=b.ref===1&&confirmed(1)&&[1,2].every(s=>b.observations.some(o=>o.scale===s));else ok=b.ref===1&&confirmed(1)&&b.ratio===t.ratio&&!!b.saved&&m.result===b.saved.result&&near(m.result,trigGoal(t),t.tolerance);hint='先选观察的角，再找斜边、对边和邻边；选包含已知与未知两边的比例。';}
 ok=!!ok&&qs(t,m);return{correct:ok,feedback:ok?'这次操作和记录对上了。':hint,evidence:{kind:'B26 bounded right-triangle investigation',board:cp(b),history:cp(m.history),fields:Object.fromEntries(Object.keys(fields(t)).map(k=>[k,cp(m[k])])),freeTextMeaningAssessed:false,physicalMeasurementAssessed:false,generalMasteryAssessed:false}};
}
export function solveSteps(t,s=314159){const m=initial(t,s),steps=[],f=(k,v)=>{const z=String(v);steps.push({field:k,value:z});const p=k.split('.');if(p.length===2)m[p[0]][+p[1]]=z;else m[k]=z;field(t,m,k);},a=(action,data={})=>{steps.push({action:'g26-'+action,data});act(t,m,'g26-'+action,data);};
 if(t.type==='x-g26-area'){a('hyp',{index:1});a('look');f('scale',2);a('scale');a('look');}
 if(t.type==='x-g26-check'){t.shapes.forEach((_,index)=>a('probe',{index}));a('choose',{index:t.shapes.findIndex(x=>G.rightVertex(x)>=0)});}
 if(t.type==='x-g26-length'){if(t.coord)a('corner',{index:'hfirst'});a('hyp',{index:1});const g=lengthGoal(t);a('op',{index:g.op});f('square',Math.round(g.square*100)/100);f('result',Math.round(g.result*100)/100);a('save');}
 if(t.type==='x-g26-trig'){const refs=t.mode==='roles'?[1,2]:[1];for(const ref of refs){a('ref',{index:ref});for(const[role,index]of Object.entries(G.roles(ref))){a('edge',{index});a('assign',{index:role});}a('confirm');}if(t.mode==='compare'){a('observe');f('scale',2);a('scale');a('observe');}if(['solve','inverse'].includes(t.mode)){a('ratio',{index:t.ratio});f('result',Number(trigGoal(t).toFixed(t.mode==='inverse'?1:2)));a('answer');}}
 (t.questions||[]).forEach((q,i)=>f('answers.'+i,q.value));return steps;
}
export function example(t){const m=initial(t,314159);for(const v of solveSteps(t))if(v.field){const p=v.field.split('.');if(p.length===2)m[p[0]][+p[1]]=v.value;else m[p[0]]=v.value;field(t,m,v.field);}else act(t,m,v.action,v.data);return m;}
