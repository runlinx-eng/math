// Exact, bounded calculator input and visual graph reading. Prose is never scored.
import {parse,value} from './b15-model.js';
export const TYPES=new Set(['x-s39-graph','x-s39-calc','x-s39-choose','x-s39-chart']);
const copy=x=>structuredClone(x),same=(a,b)=>JSON.stringify(a)===JSON.stringify(b),txt=x=>typeof x==='string'&&x.length<=2000;
const numeric=s=>{const v=String(s).trim();if(!/^-?(?:\d+(?:\.\d{1,8})?|\.\d{1,8})$/.test(v))return null;const n=Number(v);return Number.isFinite(n)?n:null;};
const near=(a,b,tol=1e-8)=>a!==null&&Number.isFinite(a)&&Math.abs(a-b)<=tol;
function leaves(tree,op){if(tree.op===op)return [...leaves(tree.a,op),...leaves(tree.b,op)];return tree.op==='num'?[tree.v]:[NaN];}
export function sameInput(entry,t){try{const tree=parse(entry),got=leaves(tree,t.operator).sort((a,b)=>a-b),expected=t.operands.slice().sort((a,b)=>a-b);return same(got,expected);}catch{return false;}}
export function graphY(t,x){if(t.graph==='curve')return x*x+t.offset;if(t.graph==='journey'){const ps=t.points;for(let i=1;i<ps.length;i++)if(x<=ps[i][0]){const[a,b]=ps[i-1],[c,d]=ps[i];return b+(d-b)*(x-a)/(c-a);}return ps.at(-1)[1];}return NaN;}
const start=t=>t.type==='x-s39-graph'?{marks:[],first:null,bad:false}:t.type==='x-s39-chart'?{current:t.start,moves:[],first:null,bad:false}:{estimate:null,estimates:[],runs:[],first:null,bad:false};
export const initial=t=>({board:start(t),history:[],cursor:'0',guess:'',estimate:'',entry:'',answer:'',method:'',judgment:'',prose:'',issue:''});
const actions=new Set(['mark','undo','estimate','run','hop']);
const okEvent=e=>e&&actions.has(e.a)&&['i','v','w','c'].every(k=>txt(e[k]));
function apply(t,b,e){let issue='';const fail=s=>{b.bad=true;issue=s;};
 if(t.type==='x-s39-graph'){
  if(e.a==='mark'){const x=numeric(e.v);b.first??=e.v;if(x===null||x<t.xMin||x>t.xMax)fail('先在图的范围里选一个位置。');else b.marks.push(x);}
  if(e.a==='undo')b.marks.pop();
 }else if(t.type==='x-s39-chart'){
  if(e.a==='hop'&&b.moves.filter(x=>x.correct).length<t.count){const n=numeric(e.v),want=b.current+t.step;b.first??=e.v;const correct=n===want;b.moves.push({from:b.current,guess:e.v,to:want,correct});if(!correct)fail('再看当前的位置：这次要增加'+t.step+'。');else b.current=want;}
 }else{
  if(e.a==='estimate'&&t.type==='x-s39-calc'){const n=numeric(e.v);b.first??=e.v;if(n===null||n<0||n>1000000)fail('先留下一个0到1000000之间的大概值。');else{b.estimates.push(n);b.estimate=n;}}
  if(e.a==='run'&&(t.type==='x-s39-choose'||b.estimate!==null)){let v=null;try{v=value(parse(e.w));}catch{}const r={entry:e.w,value:v,matched:sameInput(e.w,t)};b.runs.push(r);if(v===null)fail('检查输入的数字、运算符和括号。');}
 }
 return{board:b,issue};
}
export function act(t,m,action,data={}){const e={a:action.replace(/^s39-/,''),i:String(data.index??''),v:String(t.type==='x-s39-graph'?m.cursor:t.type==='x-s39-chart'?m.guess:m.estimate),w:String(m.entry),c:String(m.method)};if(!okEvent(e)||m.history.length>=1500)return m;const r=apply(t,copy(m.board),e);m.board=r.board;m.issue=r.issue;m.history.push(e);if(t.type==='x-s39-chart'&&e.a==='hop'&&!m.issue)m.guess='';return m;}
export function field(t,m,k){if(['cursor','guess','estimate','entry','answer','method','judgment','prose'].includes(k))m[k]=String(m[k]??'');}
export function valid(t,m){try{if(!TYPES.has(t.type)||!m||!['cursor','guess','estimate','entry','answer','method','judgment','prose','issue'].every(k=>txt(m[k]))||!Array.isArray(m.history)||m.history.length>1500||!m.history.every(okEvent))return false;if(t.type==='x-s39-graph'){const x=numeric(m.cursor);if(x===null||x<t.xMin||x>t.xMax)return false;}let b=start(t);for(const e of m.history)b=apply(t,b,e).board;return same(b,m.board);}catch{return false;}}
export function inspect(t,m){if(!valid(t,m))return{correct:false,feedback:'这份记录暂时读不出来。'};const b=m.board;let ok=false,hint='看看刻度、当前位置和你的记录能否对起来。';
 if(t.type==='x-s39-graph'){
  if(t.mode==='roots'||t.mode==='intersection')ok=t.targets.every(x=>b.marks.some(y=>near(y,x,t.tolerance)));
  else ok=b.marks.some(x=>near(x,t.targetX,.051))&&near(numeric(m.answer),graphY(t,t.targetX),t.tolerance)&&(!t.judgment||m.judgment===t.judgment);
  hint=t.mode==='roots'?'横轴的高度是0，曲线可能在两处碰到它。':t.mode==='intersection'?'两条线在同一位置相遇；看看是否还有另一处。':'先看每一格代表多少，沿横向位置找到曲线，再读纵向的值。';
 }else if(t.type==='x-s39-chart'){
  ok=b.moves.filter(x=>x.correct).length===t.count&&(!t.judgment||m.judgment===t.judgment);hint='从当前位置一次增加'+t.step+'，经过一行末尾时要接到下一行开头。';
 }else if(t.type==='x-s39-calc'){
  const last=b.runs.at(-1),estimate=numeric(m.estimate);ok=b.estimate!==null&&near(estimate,b.estimate)&&estimate>=t.estimateRange[0]&&estimate<=t.estimateRange[1]&&!!last?.matched&&last.entry===m.entry&&near(last.value,t.result)&&near(numeric(m.answer),t.result)&&(!t.candidate||m.judgment==='suspect');
  hint='估计看大概；再检查输入的每个数和运算符。接近估计也不保证答案精确。';
 }else{
  const last=b.runs.at(-1),calculator=m.method==='calculator';ok=['mental','written','calculator'].includes(m.method)&&near(numeric(m.answer),t.result)&&(!calculator||!!last?.matched&&last.entry===m.entry&&near(last.value,t.result));
  hint='选自己愿意用的方法，算出结果；选择计算器时，输入对应算式并核对。';
 }
 return{correct:!!ok,feedback:ok?'这次操作和记录对应上了。':hint,evidence:{kind:t.type,board:copy(b),history:copy(m.history),openExplanationAssessed:false,actualMentalMethodAssessed:false,realToolUseAssessed:false,generalMasteryAssessed:false}};
}
export function solveSteps(t){const s=[],f=(field,value)=>s.push({field,value:String(value)}),a=action=>s.push({action:'s39-'+action,data:{}});
 if(t.type==='x-s39-graph'){for(const x of t.mode==='roots'||t.mode==='intersection'?t.targets:[t.targetX]){f('cursor',Number(x.toFixed(1)));a('mark');}if(t.mode!=='roots'&&t.mode!=='intersection')f('answer',graphY(t,t.targetX));if(t.judgment)f('judgment',t.judgment);}
 if(t.type==='x-s39-chart'){for(let i=1;i<=t.count;i++){f('guess',t.start+t.step*i);a('hop');}if(t.judgment)f('judgment',t.judgment);}
 if(t.type==='x-s39-calc'){f('estimate',t.estimateExample);a('estimate');f('entry',t.exampleEntry);a('run');f('answer',t.result);if(t.candidate)f('judgment','suspect');}
 if(t.type==='x-s39-choose'){f('method','mental');f('answer',t.result);}
 return s;
}
export function example(t){const m=initial(t);for(const s of solveSteps(t))if(s.field){m[s.field]=s.value;field(t,m,s.field);}else act(t,m,s.action,s.data);return m;}
