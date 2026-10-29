// Linked quantities and graphs; saved constructions are bounded evidence only.
import {rational} from './b16-model.js';
import {polynomial} from './b35-model.js';
export const TYPES=new Set(['x-f36-shape','x-f36-eval','x-f36-coord','x-f36-live','x-f36-plot','x-f36-ratio','x-f36-form']);
const cp=x=>structuredClone(x),same=(a,b)=>JSON.stringify(a)===JSON.stringify(b),str=x=>typeof x==='string'&&x.length<=1200,int=(n,a,b)=>Number.isSafeInteger(n)&&n>=a&&n<=b;
const gcd=(a,b)=>{a=Math.abs(a);b=Math.abs(b);while(b)[a,b]=[b,a%b];return a||1;};
export function rat(x){const p=Array.isArray(x)?x:rational(String(x));if(!p||!Number.isSafeInteger(p[0])||!Number.isSafeInteger(p[1])||p[1]===0)return null;let[n,d]=p;if(d<0){n=-n;d=-d;}const g=gcd(n,d);n/=g;d/=g;if(n===0)return[0,1];return int(n,-10000000,10000000)&&int(d,1,1000000)?[n,d]:null;}
export const rtext=r=>r[1]===1?String(r[0]):`${r[0]}/${r[1]}`;
const add=(a,b)=>a&&b?rat([a[0]*b[1]+b[0]*a[1],a[1]*b[1]]):null,mul=(a,b)=>a&&b?rat([a[0]*b[0],a[1]*b[1]]):null,div=(a,b)=>a&&b&&b[0]?rat([a[0]*b[1],a[1]*b[0]]):null;
export const eq=(a,b)=>{a=rat(a);b=rat(b);return!!a&&!!b&&a[0]===b[0]&&a[1]===b[1];};
export const val=x=>{const a=rat(x);return a?a[0]/a[1]:NaN;};
export function fn(t,x){x=rat(x);if(!x)return null;return add(add(mul(rat(t.a||0),mul(x,x)),mul(rat(t.b||0),x)),rat(t.c||0));}
export function caseResult(t,c){if(t.kind==='physical')return add(rat(c.u),mul(rat(c.a),rat(c.t)));return fn(t,c.x);}
export const shapeResult=(kind,[a,b])=>kind==='rectangle'?rat(2*(a+b)):rat([a*b,2]);
function qok(q,v){if(q.kind==='choice')return String(v).trim()===String(q.value);if(q.kind==='approx')return Number.isFinite(val(v))&&Math.abs(val(v)-q.value)<=q.tolerance;return eq(v,q.value);}
const monomials=['1','x','x2','y','y2','xy'];
function linearPoly(raw,aliases={}){
 let s=String(raw??'').trim().replace(/\s+/g,'').replace(/[−–]/g,'-').replace(/[×·]/g,'*');for(const [from,to]of Object.entries(aliases))s=s.split(from).join(to);
 s=s.replace(/(?<![a-zA-Z\d])([+-]?\d*)\*?([xy])\/(\d+)/g,(_,coef,variable,den)=>`${coef==='-'?'-':coef==='+'?'+':''}${coef.replace(/^[+-]/,'')||'1'}/${den}${variable}`);
 let fraction=/^\((.+)\)\/([1-9]\d*)$/.exec(s),poly=polynomial(fraction?fraction[1]:s);if(!poly)return null;if(fraction){const d=rat(fraction[2]);for(const k of monomials){poly[k]=div(poly[k],d);if(!poly[k])return null;}}return poly;
}
export function linearEquivalent(raw,expected,aliases={}){const a=linearPoly(raw,aliases),b=linearPoly(expected);return!!a&&!!b&&monomials.every(k=>eq(a[k],b[k]));}
function sideExpression(raw,subject){const sides=String(raw??'').replace(/[＝]/g,'=').split('=');if(sides.length===1)return sides[0];if(sides.length!==2)return null;const norm=s=>s.replace(/\s/g,'');if(norm(sides[0])===subject)return sides[1];if(norm(sides[1])===subject)return sides[0];return null;}
export function formCorrect(t,fields){if(t.mode==='linear'){const side=sideExpression(fields.value,t.subject);return side!==null&&linearEquivalent(side,t.expected,t.aliases||{});}if(t.mode==='fraction'){return linearEquivalent(fields.value,t.numerator,t.aliases||{})&&String(fields.second).trim()===t.denominator;}if(t.mode==='roots'){const nums=[val(fields.second),val(fields.third)].sort((a,b)=>a-b);return fields.value==='both'&&nums.length===2&&nums[0]===-3&&nums[1]===3;}return false;}
const board=t=>{let b={first:{},bad:false};switch(t.type){
 case'x-f36-shape':return{...b,dims:[...t.initial],trials:[]};
 case'x-f36-eval':return{...b,selected:0,trials:[]};
 case'x-f36-coord':return{...b,points:[]};
 case'x-f36-live':return{...b,m:t.initial.m||0,c:t.initial.c||0,a:t.initial.a||0,time:t.initial.time||0,views:[]};
 case'x-f36-plot':return{...b,points:[],roots:[]};
 case'x-f36-ratio':return{...b,selected:[]};
 case'x-f36-form':return{...b,trials:[]};
 }};
export const initial=t=>({board:board(t),history:[],value:'',second:'',third:'',prose:'',answers:Array(t.questions?.length||0).fill(''),issue:''});
const actions=new Set(['dim','case','trial','point','undo','change','save','select','form','root']);
const eventOK=e=>e&&actions.has(e.a)&&['i','v','w','z'].every(k=>str(e[k]));
function apply(t,b,e){let issue='';const fail=x=>{b.bad=true;issue=x;};
 if(t.type==='x-f36-shape'){
  if(e.a==='dim'){const p=/^([01]),(-?1)$/.exec(e.i);if(p){const i=+p[1],v=b.dims[i]+Number(p[2]);if(int(v,1,9))b.dims[i]=v;}}
  if(e.a==='trial'){const v=rat(e.v),correct=eq(v,shapeResult(t.kind,b.dims));b.first.trial??={dims:cp(b.dims),answer:e.v};if(!v)fail('先写一个数，再看看。');else{if(!correct)b.bad=true;b.trials.push({dims:cp(b.dims),answer:e.v,result:rtext(shapeResult(t.kind,b.dims)),correct});if(!correct)issue='再沿边走一圈，或看底和垂直高度的关系。';}}
 }
 if(t.type==='x-f36-eval'){
  if(e.a==='case'&&int(Number(e.i),0,t.cases.length-1))b.selected=Number(e.i);
  if(e.a==='trial'){const c=t.cases[b.selected],v=rat(e.v),correct=eq(v,caseResult(t,c));b.first.trial??={case:b.selected,answer:e.v};if(!v)fail('先写出你的结果。');else{if(!correct)b.bad=true;b.trials.push({case:b.selected,answer:e.v,result:rtext(caseResult(t,c)),correct});if(!correct)issue='把每个数放在对应的位置；负数先放进括号。';}}
 }
 if(t.type==='x-f36-coord'&&e.a==='point'){
  const x=val(e.v),y=val(e.w);b.first.point??=[e.v,e.w];if(!Number.isFinite(x)||!Number.isFinite(y)||Math.abs(x)>5||Math.abs(y)>5||!t.targets.some(p=>p[0]===x&&p[1]===y))fail('先看横向位置，再看竖向位置；留意负数的方向。');else if(!b.points.some(p=>p[0]===x&&p[1]===y))b.points.push([x,y]);
 }
 if(t.type==='x-f36-coord'&&e.a==='undo')b.points.pop();
 if(t.type==='x-f36-live'){
  if(e.a==='change'){const p=/^(m|c|a|time),(-?1)$/.exec(e.i);if(p&&t.controls.includes(p[1])){const k=p[1],n=b[k]+Number(p[2]),range=k==='time'?[0,7]:[-3,3];if(int(n,...range))b[k]=n;}}
  if(e.a==='save'){const v=Object.fromEntries(t.controls.map(k=>[k,b[k]]));if(!b.views.some(x=>same(x,v)))b.views.push(v);}
 }
 if(t.type==='x-f36-plot'&&e.a==='point'){
  const x=val(e.v),y=val(e.w);b.first.point??=[e.v,e.w];const result=fn(t,e.v);if(!Number.isFinite(x)||!Number.isFinite(y)||!t.xs.includes(x)||!result||!eq(e.w,result))fail('把横向的数放进规则，再找到它对应的纵向位置。');else if(!b.points.some(p=>p[0]===x))b.points.push([x,y]);
 }
 if(t.type==='x-f36-plot'&&e.a==='root'&&t.rootSelect){const i=Number(e.i);b.first.root??=e.i;if(int(i,0,b.points.length-1)){const k=b.roots.indexOf(i);if(k>=0)b.roots.splice(k,1);else if(b.points[i][1]===0)b.roots.push(i);else fail('交点在横轴上，纵向的数应为0。');}}
 if(t.type==='x-f36-plot'&&e.a==='undo'){b.points.pop();b.roots=[];}
 if(t.type==='x-f36-ratio'&&e.a==='select'){const i=Number(e.i);if(int(i,0,t.points.length-1)){const n=b.selected.indexOf(i);n<0?b.selected.push(i):b.selected.splice(n,1);b.selected.sort((a,c)=>a-c);}}
 if(t.type==='x-f36-form'&&e.a==='form'){
  const fields={value:e.v,second:e.w,third:e.z};b.first.form??=cp(fields);const correct=formCorrect(t,fields);b.trials.push({fields,correct});if(!correct)fail(t.mode==='roots'?'同一个平方结果可能来自两个相反的数。':'把每一项都处理到，并检查分母的限制。');
 }
 return{board:b,issue};
}
export function act(t,m,action,data={}){const a=action.replace(/^f36-/,''),e={a,i:String(data.index??''),v:String(data.px??m.value??''),w:String(data.py??m.second??''),z:String(m.third??'')};if(!eventOK(e)||m.history.length>=2000)return m;if(a==='point'&&data.px!==undefined&&data.py!==undefined){m.value=String(data.px);m.second=String(data.py);}const r=apply(t,cp(m.board),e);m.board=r.board;m.issue=r.issue;m.history.push(e);return m;}
export function field(t,m,k){if(['value','second','third','prose'].includes(k))m[k]=String(m[k]??'');if(k.startsWith('answers.'))m.answers[Number(k.split('.')[1])]=String(m.answers[Number(k.split('.')[1])]??'');}
export function valid(t,m){try{if(!TYPES.has(t.type)||!m||!['value','second','third','prose','issue'].every(k=>str(m[k]))||!Array.isArray(m.answers)||m.answers.length!==(t.questions?.length||0)||!m.answers.every(str)||!Array.isArray(m.history)||m.history.length>2000||!m.history.every(eventOK))return false;let b=board(t);for(const e of m.history)b=apply(t,b,e).board;return same(b,m.board);}catch{return false;}}
export function inspect(t,m){if(!valid(t,m))return{correct:false,feedback:'这份作品暂时读不出来。'};const b=m.board;let ok=false,hint='先动手改变一处，再看看对应的变化。';
 if(t.type==='x-f36-shape'){const last=b.trials.at(-1);ok=t.required.every(d=>b.trials.some(r=>r.correct&&same(r.dims,d)))&&!!last?.correct&&same(last.dims,b.dims)&&eq(last.answer,m.value);hint='观察图形的边、底和垂直高度；填写后再比较结果。';}
 if(t.type==='x-f36-eval'){const last=b.trials.at(-1);ok=t.required.every(i=>b.trials.some(r=>r.case===i&&r.correct))&&!!last?.correct&&last.case===b.selected&&eq(last.answer,m.value);hint='数放进对应的位置，先平方，再乘除，最后加减。';}
 if(t.type==='x-f36-coord'){ok=t.targets.every(p=>b.points.some(x=>same(x,p)));hint='先看横向数轴，再看纵向数轴；轴上的点不在象限内。';}
 if(t.type==='x-f36-live'){ok=t.required.every(x=>b.views.some(v=>same(v,x)));hint='改变一个量，留下几种不同情况，再比较线怎样变化。';}
 if(t.type==='x-f36-plot'){ok=t.xs.every(x=>b.points.some(p=>p[0]===x))&&(!t.rootSelect||b.points.filter(p=>p[1]===0).every(p=>b.roots.some(i=>same(b.points[i],p)))&&b.roots.length===t.rootCount);hint='每次把横向的数放入规则，再放下相应的点。';}
 if(t.type==='x-f36-ratio'){ok=b.selected.length===t.points.length;hint='先选左边的点，再选右边的点；横向和纵向变化分别算。';}
 if(t.type==='x-f36-form'){const last=b.trials.at(-1);ok=!!last?.correct&&same(last.fields,{value:m.value,second:m.second,third:m.third});hint='把每一项都处理到，检查不能除以零以及平方反推的分支。';}
 ok=!!ok&&(t.questions||[]).every((q,i)=>qok(q,m.answers[i]));return{correct:ok,feedback:ok?'这次操作和记录对应上了。':hint,evidence:{kind:t.type,board:cp(b),history:cp(m.history),freeExplanationAssessed:false,generalProofAssessed:false,generalMasteryAssessed:false}};
}
export function solveSteps(t){const s=[],f=(field,value)=>s.push({field,value:String(value)}),a=(name,index)=>s.push({action:'f36-'+name,data:index===undefined?{}:{index}});
 if(t.type==='x-f36-shape'){const dims=[...t.initial];for(const target of t.required){for(let i=0;i<2;i++)while(dims[i]!==target[i]){const d=Math.sign(target[i]-dims[i]);a('dim',`${i},${d}`);dims[i]+=d;}f('value',rtext(shapeResult(t.kind,dims)));a('trial');}}
 if(t.type==='x-f36-eval')for(const i of t.required){a('case',i);f('value',rtext(caseResult(t,t.cases[i])));a('trial');}
 if(t.type==='x-f36-coord')for(const[x,y]of t.targets){f('value',x);f('second',y);a('point');}
 if(t.type==='x-f36-live'){let current=cp(t.initial);for(const target of t.required){for(const k of t.controls)while((current[k]||0)!==target[k]){const d=Math.sign(target[k]-(current[k]||0));a('change',`${k},${d}`);current[k]=(current[k]||0)+d;}a('save');}}
 if(t.type==='x-f36-plot'){for(const x of t.xs){f('value',x);f('second',rtext(fn(t,x)));a('point');}if(t.rootSelect)t.xs.forEach((x,i)=>{if(eq(fn(t,x),0))a('root',i);});}
 if(t.type==='x-f36-ratio')t.points.forEach((_,i)=>a('select',i));
 if(t.type==='x-f36-form'){for(const[k,v]of Object.entries(t.example))f(k,v);a('form');}
 (t.questions||[]).forEach((q,i)=>f('answers.'+i,q.example??q.value));return s;}
export function example(t){const m=initial(t);for(const s of solveSteps(t)){if(s.field){const[k,i]=s.field.split('.');if(i===undefined)m[k]=s.value;else m[k][+i]=s.value;field(t,m,s.field);}else act(t,m,s.action,s.data);}return m;}
