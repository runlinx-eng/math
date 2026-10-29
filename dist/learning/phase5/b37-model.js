// Ratio constructions, equal parts, scale comparisons and recorded reasoning steps.
import {rat,eq,val,rtext} from './b36-model.js';
import {rational} from './b16-model.js';
export const TYPES=new Set(['x-r37-pair','x-r37-share','x-r37-shape','x-r37-steps']);
const cp=x=>structuredClone(x),same=(a,b)=>JSON.stringify(a)===JSON.stringify(b),str=x=>typeof x==='string'&&x.length<=1000,int=(x,a,b)=>Number.isSafeInteger(x)&&x>=a&&x<=b;
const mul=(a,b)=>{a=rat(a);b=rat(b);return a&&b?rat([a[0]*b[0],a[1]*b[1]]):null;};
const tidy=x=>String(x).trim().replace(/\s*\/\s*/g,'/');
const raw=x=>Array.isArray(x)?x:rational(tidy(x));
const eqExact=(a,b)=>{a=raw(a);b=raw(b);return!!a&&!!b&&a[1]>0&&b[1]>0&&BigInt(a[0])*BigInt(b[1])===BigInt(b[0])*BigInt(a[1]);};
const gcd=(a,b)=>{a=Math.abs(a);b=Math.abs(b);while(b)[a,b]=[b,a%b];return a;};
const stepOK=(step,answer)=>{if(step.kind==='choice')return answer===step.value;if(step.kind==='simple'){const p=raw(answer);return /^-?\d+\/\d+$/.test(tidy(answer))&&!!p&&gcd(...p)===1&&eqExact(answer,step.value);}if(step.kind==='rawfraction'){const p=raw(answer),q=raw(step.value);return /^-?\d+\/\d+$/.test(tidy(answer))&&!!p&&!!q&&p[0]===q[0]&&p[1]===q[1];}return eqExact(answer,step.value);};
const qok=(q,v)=>q.kind==='choice'?String(v).trim()===String(q.value):eqExact(v,q.value);
function matches(t,pair){const [a,b]=pair;return t.relation==='inverse'?eq(mul(a,b),mul(t.base[0],t.base[1])):eq(mul(a,t.base[1]),mul(b,t.base[0]));}
const board=t=>{const common={bad:false,first:{}};if(t.type==='x-r37-pair')return {...common,preview:null,records:[]};if(t.type==='x-r37-share')return {...common,owner:0,slots:Array(t.parts.reduce((a,b)=>a+b,0)).fill(-1)};if(t.type==='x-r37-shape')return {...common,factor:t.factors[0],records:[]};return {...common,index:0,records:[]};};
export const initial=t=>({board:board(t),history:[],value:'',second:'',choice:'',answers:Array(t.questions?.length||0).fill(''),prose:'',issue:''});
const actions=new Set(['place','save','person','slot','factor','step']);
const eventOK=e=>e&&actions.has(e.a)&&['i','v','w','c'].every(k=>str(e[k]));
function apply(t,b,e){let issue='';const fail=s=>{b.bad=true;issue=s;};
 if(t.type==='x-r37-pair'){
  if(e.a==='place'){const a=rat(e.v),c=rat(e.w);b.first.place??=[e.v,e.w];if(!a||!c||val(a)<0||val(c)<0||val(a)>10000||val(c)>10000)fail('先写出0到10000之间的两个数量。');else if(!val(a)&&!val(c))fail('两个量都是0时，不能用它们表示配比。');else if(t.relation==='inverse'&&(!val(a)||!val(c)))fail('这次固定工作量的反向变化中，人数和时间都不能为0。');else b.preview=[rtext(a),rtext(c)];}
  if(e.a==='save'){const samePreview=b.preview&&eq(e.v,b.preview[0])&&eq(e.w,b.preview[1]);const relation=samePreview&&matches(t,b.preview),guess=e.c==='same'||e.c==='different',correct=!!samePreview&&guess&&(e.c==='same')===relation;b.first.save??={pair:cp(b.preview),guess:e.c};if(!samePreview)fail('改过数量后，先重新摆出来。');else if(!guess)fail('先选一选关系是否保持。');else{b.records.push({pair:cp(b.preview),guess:e.c,relation:relation?'same':'different',correct});if(!correct)fail(t.relation==='inverse'?'让两个数相乘，看看是否还是原来的积。':'先看两边是否乘了同一个数；只加同样多不一定保持。');}}
 }
 if(t.type==='x-r37-share'){
  if(e.a==='person'&&int(Number(e.i),0,t.parts.length-1))b.owner=Number(e.i);
  if(e.a==='slot'&&int(Number(e.i),0,b.slots.length-1)){const i=Number(e.i);b.slots[i]=b.slots[i]===b.owner?-1:b.owner;}
 }
 if(t.type==='x-r37-shape'){
  if(e.a==='factor'&&t.factors.includes(e.i))b.factor=e.i;
  if(e.a==='save'){const w=mul(t.base[0],b.factor),h=mul(t.base[1],b.factor),correct=eq(e.v,w)&&eq(e.w,h);b.first.save??={factor:b.factor,width:e.v,height:e.w};b.records.push({factor:b.factor,width:e.v,height:e.w,correct});if(!correct)fail('比较对应的两条边：它们都要乘同一个倍数。');}
 }
 if(t.type==='x-r37-steps'&&e.a==='step'&&b.index<t.steps.length){const step=t.steps[b.index],answer=step.kind==='choice'?e.c:e.v,correct=stepOK(step,answer);b.first[b.index]??=answer;b.records.push({index:b.index,answer,correct});if(correct)b.index++;else fail(step.hint||'先确认这一小步在找什么，再回到图上看看。');}
 return {board:b,issue};
}
export function act(t,m,action,data={}){const e={a:action.replace(/^r37-/,''),i:String(data.index??''),v:String(m.value??''),w:String(m.second??''),c:String(m.choice??'')};if(!eventOK(e)||m.history.length>=2000)return m;const before=m.board.index,r=apply(t,cp(m.board),e);m.board=r.board;m.issue=r.issue;m.history.push(e);if(t.type==='x-r37-steps'&&m.board.index!==before){m.value='';m.choice='';}if(t.type==='x-r37-pair'&&e.a==='place'&&!m.issue)m.choice='';return m;}
export function field(t,m,k){if(['value','second','choice','prose'].includes(k))m[k]=String(m[k]??'');else if(k.startsWith('answers.'))m.answers[Number(k.split('.')[1])]=String(m.answers[Number(k.split('.')[1])]??'');}
export function valid(t,m){try{if(!TYPES.has(t.type)||!m||!['value','second','choice','prose','issue'].every(k=>str(m[k]))||!Array.isArray(m.answers)||m.answers.length!==(t.questions?.length||0)||!m.answers.every(str)||!Array.isArray(m.history)||m.history.length>2000||!m.history.every(eventOK))return false;let b=board(t);for(const e of m.history)b=apply(t,b,e).board;return same(b,m.board);}catch{return false;}}
export function inspect(t,m){if(!valid(t,m))return{correct:false,feedback:'这份作品暂时读不出来。'};const b=m.board;let ok=false,hint='把图中的量和你留下的记录对起来。';
 if(t.type==='x-r37-pair'){const last=b.records.at(-1);ok=t.targets.every(p=>b.records.some(r=>r.correct&&eq(r.pair[0],p[0])&&eq(r.pair[1],p[1])))&&!!last?.correct&&same(last.pair,b.preview)&&eq(m.value,b.preview[0])&&eq(m.second,b.preview[1])&&m.choice===last.guess;hint='先摆两个量，再比较乘的倍数；最后留下要求的几种情况。';}
 if(t.type==='x-r37-share'){const counts=t.parts.map((_,i)=>b.slots.filter(s=>s===i).length);ok=b.slots.every(s=>s>=0)&&same(counts,t.parts);hint='每一块必须一样大，全部分出去；各人的块数要与给定的比对应。';}
 if(t.type==='x-r37-shape'){const last=b.records.at(-1);ok=t.required.every(f=>b.records.some(r=>r.correct&&eq(r.factor,f)))&&!!last?.correct&&eq(last.factor,b.factor)&&eq(last.width,m.value)&&eq(last.height,m.second);hint='两条对应边都按同一个倍数改变；面积要看两方向。';}
 if(t.type==='x-r37-steps'){ok=b.index===t.steps.length;hint='先确认每一步在找哪个量，再把结果带到下一步。';}
 ok=!!ok&&(t.questions||[]).every((q,i)=>qok(q,m.answers[i]));return{correct:ok,feedback:ok?'这次构造和记录对上了。':hint,evidence:{kind:t.type,board:cp(b),history:cp(m.history),openExplanationAssessed:false,generalProofAssessed:false,generalMasteryAssessed:false}};
}
export function solveSteps(t){const s=[],f=(field,value)=>s.push({field,value:String(value)}),a=(action,index)=>s.push({action:'r37-'+action,data:index===undefined?{}:{index}});
 if(t.type==='x-r37-pair')for(const p of t.targets){f('value',p[0]);f('second',p[1]);a('place');f('choice',matches(t,p)?'same':'different');a('save');}
 if(t.type==='x-r37-share'){let i=0;for(let owner=0;owner<t.parts.length;owner++){a('person',owner);for(let n=0;n<t.parts[owner];n++)a('slot',i++);}}
 if(t.type==='x-r37-shape')for(const factor of t.required){a('factor',factor);f('value',rtext(mul(t.base[0],factor)));f('second',rtext(mul(t.base[1],factor)));a('save');}
 if(t.type==='x-r37-steps')for(const step of t.steps){f(step.kind==='choice'?'choice':'value',step.value);a('step');}
 (t.questions||[]).forEach((q,i)=>f('answers.'+i,q.value));return s;}
export function example(t){const m=initial(t);for(const s of solveSteps(t)){if(s.field){const[k,i]=s.field.split('.');if(i===undefined)m[k]=s.value;else m[k][+i]=s.value;field(t,m,s.field);}else act(t,m,s.action,s.data);}return m;}
