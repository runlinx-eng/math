// Bounded constructions; free explanations are preserved but never graded.
import {rational} from './b16-model.js';
export const TYPES=new Set(['x-r38-chain','x-r38-counterexample']);
const copy=x=>structuredClone(x),same=(a,b)=>JSON.stringify(a)===JSON.stringify(b),text=x=>typeof x==='string'&&x.length<=2000;
const nval=x=>{const a=rational(String(x).trim());return a&&a[1]>0&&Number.isSafeInteger(a[0])&&Number.isSafeInteger(a[1])?a:null;};
const number=a=>a[0]/a[1],relation=(a,b)=>a<b?'less':a>b?'greater':'equal';
function base(t){return t.type==='x-r38-chain'?{selected:[],marked:null,removed:[],exchanged:false,bad:false}:{records:[],first:null,bad:false};}
export const initial=t=>({board:base(t),history:[],value:'',second:'',choice:'',prose:'',issue:''});
const allowed=new Set(['card','undo','mark','column','exchange','test']);
const eventOK=e=>e&&allowed.has(e.a)&&['i','v','w','c'].every(k=>text(e[k]));
function apply(t,b,e){let issue='';const fail=s=>{b.bad=true;issue=s;};
 if(t.type==='x-r38-chain'){
  if(e.a==='card'&&t.cards.some(c=>c.id===e.i)&&!b.selected.includes(e.i))b.selected.push(e.i);
  if(e.a==='undo')b.selected.pop();
  if(e.a==='mark'&&t.lines?.some(l=>l.id===e.i))b.marked=e.i;
  if(e.a==='exchange'&&t.scene==='exchange')b.exchanged=!b.exchanged;
  if(e.a==='column'&&t.scene==='array'&&/^\d+$/.test(e.i)&&+e.i<10){const i=+e.i,k=b.removed.indexOf(i);k>=0?b.removed.splice(k,1):b.removed.push(i);b.removed.sort((a,c)=>a-c);}
 }else if(e.a==='test'){
  const a=nval(e.v),f=nval(e.w);b.first??={value:e.v,factor:e.w,prediction:e.c};
  if(!a||!f||number(a)<=0||number(a)>12||number(f)<0||number(f)>3)fail('原来的数用大于0、不超过12的数；乘的数用0到3之间的数。');
  else if(!['less','equal','greater'].includes(e.c))fail('先猜一猜结果与原来的数相比怎样。');
  else {const actual=relation(f[0],f[1]);const match=e.c===actual,breaks=t.rule==='strict'?actual!=='greater':actual==='less';b.records.push({value:e.v,factor:e.w,prediction:e.c,actual,breaks,match});if(!match)fail('看看两条带子的长度，再改猜测试一次。');}
 }
 return{board:b,issue};
}
export function act(t,m,action,data={}){const e={a:action.replace(/^r38-/,''),i:String(data.index??''),v:String(m.value??''),w:String(m.second??''),c:String(m.choice??'')};if(!eventOK(e)||m.history.length>=1500)return m;const r=apply(t,copy(m.board),e);m.board=r.board;m.issue=r.issue;m.history.push(e);return m;}
export function field(t,m,k){if(['value','second','choice','prose'].includes(k))m[k]=String(m[k]??'');}
export function valid(t,m){try{if(!TYPES.has(t.type)||!m||!['value','second','choice','prose','issue'].every(k=>text(m[k]))||!Array.isArray(m.history)||m.history.length>1500||!m.history.every(eventOK))return false;let b=base(t);for(const e of m.history)b=apply(t,b,e).board;return same(b,m.board);}catch{return false;}}
export function inspect(t,m){if(!valid(t,m))return{correct:false,feedback:'这份记录暂时读不出来。'};const b=m.board;let ok=false,hint='先把能支持结论的步骤连起来，留意哪一步需要前面的事实。';
 if(t.type==='x-r38-chain'){ok=t.paths.some(p=>same(p,b.selected))&&(!t.lines||b.marked===t.error)&&(!t.scene||t.scene!=='array'||b.removed.length===2)&&(!t.scene||t.scene!=='exchange'||b.exchanged);if(t.lines&&b.marked!==t.error)hint='先指出哪一步第一次出了问题，再试着修好它。';else if(t.scene==='array'&&b.removed.length!==2)hint='先从十列里拿走两列，再用剩下的八列解释。';else if(t.scene==='exchange'&&!b.exchanged)hint='先把一捆十拆成十个一，看看两个位置各剩多少。';}
 else{const last=b.records.at(-1);ok=!!last&&last.match&&last.breaks&&last.value===m.value&&last.factor===m.second&&last.prediction===m.choice;hint='自己换一个数试试，找一个不符合这句话的例子。';}
 return{correct:ok,feedback:ok?'这次留下的关系对上了。':hint,evidence:{kind:t.type,board:copy(b),history:copy(m.history),freeExplanationAssessed:false,generalProofAssessed:false,generalMasteryAssessed:false}};
}
export function solveSteps(t){if(t.type==='x-r38-counterexample')return[{field:'value',value:'6'},{field:'second',value:'1/2'},{field:'choice',value:'less'},{action:'r38-test',data:{}}];const s=[];if(t.lines)s.push({action:'r38-mark',data:{index:t.error}});if(t.scene==='exchange')s.push({action:'r38-exchange',data:{}});if(t.scene==='array')for(const i of[0,1])s.push({action:'r38-column',data:{index:String(i)}});for(const i of t.paths[0])s.push({action:'r38-card',data:{index:i}});return s;}
export function example(t){const m=initial(t);for(const s of solveSteps(t))if(s.field){m[s.field]=s.value;field(t,m,s.field);}else act(t,m,s.action,s.data);return m;}
