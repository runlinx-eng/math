import {rational} from './b16-model.js';

// Every amount is stored as an integer number of the stated currency's minor unit.
export const TYPES = new Set(['x-m33-coins','x-m33-sort','x-m33-cart','x-m33-compare','x-m33-calc','x-m33-sheet','x-m33-model']);
const copy=x=>structuredClone(x),same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const text=x=>typeof x==='string'&&x.length<=1200;
const integer=(n,lo=0,hi=1e7)=>Number.isSafeInteger(n)&&n>=lo&&n<=hi;
const num=x=>{const r=rational(String(x));return r?r[0]/r[1]:NaN;};
const approx=(x,y)=>Number.isFinite(num(x))&&Math.abs(num(x)-y)<1e-9;
const gcd=(a,b)=>b===0n?(a<0n?-a:a):gcd(b,a%b);
const fraction=(n,d=1n)=>{if(!d)throw Error('zero divisor');if(d<0n){n=-n;d=-d;}const g=gcd(n,d)||1n;return[n/g,d/g];};
const combine=(a,b,op)=>{switch(op){case '+':return fraction(a[0]*b[1]+b[0]*a[1],a[1]*b[1]);case '-':return fraction(a[0]*b[1]-b[0]*a[1],a[1]*b[1]);case '*':return fraction(a[0]*b[0],a[1]*b[1]);case '/':return fraction(a[0]*b[1],a[1]*b[0]);}};
const roundedCents=([n,d])=>{let v=n*100n,sign=v<0n?-1n:1n;v=v<0n?-v:v;const x=sign*((v+d/2n)/d);if(x>100000000n||x< -100000000n)throw Error('outside bounded example');return Number(x);};

// A deliberately small expression grammar. No eval, arbitrary JavaScript or network.
// Values represent whole currency units; references resolve to exact minor units.
export function evaluateFormula(raw,refs={}){
 try{
  if(typeof raw!=='string'||raw.length>100)return null;
  const s=raw.toUpperCase().replace(/\s/g,'').replace(/[×]/g,'*').replace(/[÷]/g,'/').replace(/^=/,'');
  const tokens=s.match(/A[1-9]|\d{1,6}(?:\.\d{1,4})?|[()+*/%\-]/g)||[];
  if(tokens.join('')!==s||tokens.length>50||!tokens.length)return null;
  let i=0;const used=new Set();let operators=0;
  const primary=()=>{let out,t=tokens[i++];if(t==='('){out=expression();if(tokens[i++]!==')')throw Error('paren');}else if(t==='-'){out=combine([0n,1n],primary(),'-');}else if(/^A[1-9]$/.test(t||'')){if(!integer(refs[t],-1e7,1e7))throw Error('reference');used.add(t);out=fraction(BigInt(refs[t]),100n);}else if(/^\d{1,6}(?:\.\d{1,4})?$/.test(t||'')){const parts=t.split('.'),scale=10n**BigInt(parts[1]?.length||0);out=fraction(BigInt(parts.join('')),scale);}else throw Error('number');if(tokens[i]==='%'){i++;out=combine(out,[100n,1n],'/');operators++;}return out;};
  const term=()=>{let v=primary();while(tokens[i]==='*'||tokens[i]==='/'){const op=tokens[i++];operators++;v=combine(v,primary(),op);}return v;};
  const expression=()=>{let v=term();while(tokens[i]==='+'||tokens[i]==='-'){const op=tokens[i++];operators++;v=combine(v,term(),op);}return v;};
  const result=expression();if(i!==tokens.length)return null;
  return{cents:roundedCents(result),references:[...used].sort(),operators};
 }catch{return null;}
}
export function parseMoney(raw,currency,mode='major'){
 if(typeof raw!=='string')return null;
 const s=raw.trim().replace(/\s/g,'');if(s.length>30)return null;
 if(mode==='minor'){
  const suffix=currency==='GBP'?'p':'(?:c|¢)';const m=new RegExp('^(\\d{1,7})(?:'+suffix+')?$','i').exec(s);return m?Number(m[1]):null;
 }
 const symbol=currency==='GBP'?'£':'\\$';const m=new RegExp('^(?:'+symbol+')?(\\d{1,6})(?:\\.(\\d{1,2}))?$').exec(s);
 if(!m)return null;return Number(m[1])*100+Number((m[2]||'').padEnd(2,'0'));
}
export const money=(n,currency)=>`${currency==='GBP'?'£':'$'}${Math.floor(n/100)}.${String(n%100).padStart(2,'0')}`;
export const coinTotal=(t,counts)=>counts.reduce((s,n,i)=>s+n*t.denoms[i].cents,0);
export function fewestCoins(target,denoms){const best=Array(target+1).fill(Infinity);best[0]=0;for(let n=1;n<=target;n++)for(const c of denoms)if(c<=n)best[n]=Math.min(best[n],best[n-c]+1);return best[target];}
function initialBoard(t){const common={first:{},bad:false};switch(t.type){
 case 'x-m33-coins':return{...common,counts:t.denoms.map(()=>0),saved:[]};
 case 'x-m33-sort':return{...common,group:null,placed:t.cards.map(()=>null)};
 case 'x-m33-cart':return{...common,selected:[],estimate:null,revealed:!t.estimate};
 case 'x-m33-compare':return{...common,guess:null,revealed:false,choice:null};
 case 'x-m33-model':return{...common,method:null};
 case 'x-m33-calc':case 'x-m33-sheet':return{...common,runs:[],last:null,estimate:null};
 }}
export const initial=t=>({board:initialBoard(t),history:[],issue:'',prose:'',formula:'',estimate:'',answers:Array(t.questions?.length||0).fill('')});
const actionNames=new Set(['add','remove','save','clear','group','place','choose','guess','reveal','pick','run','estimate','method']);
const validEvent=e=>e&&actionNames.has(e.a)&&text(e.i)&&text(e.v);
function apply(t,b,e){let issue='',i=Number(e.i);const fail=s=>{b.bad=true;issue=s;};
 if(t.type==='x-m33-coins'){
  if(e.a==='add'&&integer(i,0,t.denoms.length-1)&&b.counts[i]<50)b.counts[i]++;
  if(e.a==='remove'&&integer(i,0,t.denoms.length-1)&&b.counts[i]>0)b.counts[i]--;
  if(e.a==='clear')b.counts=b.counts.map(()=>0);
  if(e.a==='save'){
   const counts=b.counts.slice(),total=coinTotal(t,counts);b.first.build??={counts:counts.slice(),total};
   if(b.saved.length<12)b.saved.push({counts,total});
   if(total!==t.target)fail('先把每一枚的面值合起来，再看是否正好。');
  }
 }
 if(t.type==='x-m33-sort'){
  if(e.a==='group'&&t.groups.some(g=>g.id===e.i))b.group=e.i;
  if(e.a==='place'&&integer(i,0,t.cards.length-1)&&b.group!==null){b.first.place??={index:i,group:b.group};b.placed[i]=b.group;if(b.group!==t.cards[i].group)fail('看看这张钱的单位或类别，再换一个位置。');}
  if(e.a==='clear')b.placed=t.cards.map(()=>null);
 }
 if(t.type==='x-m33-cart'){
  if(e.a==='estimate'&&b.estimate===null&&e.v.trim()){b.estimate=e.v;b.first.estimate=e.v;if(t.estimateRange&&!(num(e.v)>=t.estimateRange[0]&&num(e.v)<=t.estimateRange[1]))fail('先和预算或整元比较，留下这个估计，再看看实际结果。');}
  if(e.a==='reveal'&&(!t.estimate||b.estimate!==null))b.revealed=true;
  if(e.a==='choose'&&integer(i,0,t.items.length-1)&&b.revealed){const j=b.selected.indexOf(i);j<0?b.selected.push(i):b.selected.splice(j,1);b.selected.sort((a,c)=>a-c);}
  if(e.a==='clear')b.selected=[];
 }
 if(t.type==='x-m33-compare'){
  if(e.a==='guess'&&b.guess===null&&['left','right','equal'].includes(e.i)){b.guess=e.i;b.first.guess=e.i;if(e.i!==t.want)b.bad=true;}
  if(e.a==='reveal'&&b.guess!==null)b.revealed=true;
  if(e.a==='pick'&&b.revealed&&['left','right','equal'].includes(e.i)){b.first.choice??=e.i;b.choice=e.i;if(e.i!==t.want)fail('换成相同的单位，再比较两边。');}
 }
 if(t.type==='x-m33-model'&&e.a==='method'&&['bar','line','equation'].includes(e.i)){b.method=e.i;b.first.method??=e.i;}
 if(t.type==='x-m33-calc'||t.type==='x-m33-sheet'){
  if(e.a==='estimate'&&b.estimate===null&&e.v.trim()){b.estimate=e.v;b.first.estimate=e.v;if(t.estimateRange&&!(num(e.v)>=t.estimateRange[0]&&num(e.v)<=t.estimateRange[1]))fail('这个估计先保留；算完后可以对照并说明。');}
  if(e.a==='run'&&(!t.estimate||b.estimate!==null)){
   const result=evaluateFormula(e.v,t.refs||{}),refs=t.requiredRefs||[];
   b.first.formula??=e.v;
   const usedAll=result&&refs.every(r=>result.references.includes(r));
   const ok=result&&result.operators>0&&usedAll&&result.cents===t.expected;
   const record={formula:e.v,result:result?.cents??null,valid:!!ok};if(b.runs.length<40)b.runs.push(record);b.last=record;
   if(!ok)fail(t.type==='x-m33-sheet'?'检查等号、单元格引用和计算符号，再试一次。':'核对要算的数和运算，再试一次。');
  }
 }
 return{board:b,issue};
}
export function act(t,m,action,data={}){const a=action.replace(/^m33-/,''),e={a,i:String(data.index??''),v:String(a==='run'?m.formula:a==='estimate'?m.estimate:'')};if(!validEvent(e)||m.history.length>=1200)return m;const r=apply(t,copy(m.board),e);m.board=r.board;m.issue=r.issue;m.history.push(e);return m;}
export function field(t,m,key){if(['prose','formula','estimate'].includes(key))m[key]=String(m[key]??'');if(key.startsWith('answers.'))m.answers[Number(key.split('.')[1])]=String(m.answers[Number(key.split('.')[1])]??'');}
export function valid(t,m){try{if(!TYPES.has(t.type)||!m||!['prose','formula','estimate','issue'].every(k=>text(m[k]))||!Array.isArray(m.answers)||m.answers.length!==(t.questions?.length||0)||!m.answers.every(text)||!Array.isArray(m.history)||m.history.length>1200||!m.history.every(validEvent))return false;const candidates=[initialBoard(t)];if(t.type==='x-m33-cart'&&!t.estimate)candidates.push({...initialBoard(t),revealed:false});return candidates.some(start=>{let b=start;for(const e of m.history)b=apply(t,b,e).board;return same(b,m.board);});}catch{return false;}}
const answerOK=(q,v,currency)=>q.kind==='number'?approx(v,q.value):q.kind==='minor'||q.kind==='major'?parseMoney(v,currency,q.kind)===q.value:q.accepted?q.accepted.includes(String(v).trim()):String(v).trim()===String(q.value);
export function inspect(t,m){if(!valid(t,m))return{correct:false,feedback:'这份作品暂时读不出来。'};const b=m.board;let ok=false,hint='先动手，再看看数量和记录是否对应。';
 if(t.type==='x-m33-coins'){
  const accepted=b.saved.filter(s=>s.total===t.target&&(!t.minCoins||s.counts.reduce((a,c)=>a+c,0)===fewestCoins(t.target,t.denoms.map(x=>x.cents)))&&(!t.mustCounts||t.mustCounts.every(([i,n])=>s.counts[i]===n)));
  const different=new Set(accepted.map(s=>s.counts.join(','))).size;ok=different>=(t.distinct||1);hint=accepted.length&&different<(t.distinct||1)?'这些金额相同，还需要再摆出不同的组合。':'先把选中的面值合起来；不同组合可能有同样的总额。';
 }
 if(t.type==='x-m33-sort'){ok=b.placed.every((g,i)=>g===t.cards[i].group);hint='先选类别，再逐张放入；面值要看标记，不只看大小。';}
 if(t.type==='x-m33-cart'){
  const total=b.selected.reduce((s,i)=>s+t.items[i].cents,0);ok=b.revealed&&b.selected.length>=(t.minimum||1)&&(!t.budget||total<=t.budget)&&(!t.required||t.required.every(i=>b.selected.includes(i)));hint='选中要买的东西，把价格合起来，再看是否在预算内。';
 }
 if(t.type==='x-m33-compare'){ok=b.guess!==null&&b.revealed&&b.choice===t.want;hint='换成相同的单位，再比较两边。';}
 if(t.type==='x-m33-model'){ok=b.method!==null;hint='先选一种表示，找出整段、剪掉的部分与未知的部分。';}
 if(t.type==='x-m33-calc'||t.type==='x-m33-sheet'){ok=!!b.last?.valid&&b.last.formula===m.formula&&(!t.estimate||b.estimate!==null);hint=t.type==='x-m33-sheet'?'写入引用单元格的公式，检查运算符和价格。':'先估一估，再输入运算；结果要放回故事里理解。';}
 ok=!!ok&&(t.questions||[]).every((q,i)=>answerOK(q,m.answers[i],t.currency));return{correct:ok,feedback:ok?'这次操作和记录对应上了。':hint,evidence:{kind:t.type,board:copy(b),history:copy(m.history),freeExplanationAssessed:false,physicalMoneyAssessed:false,generalMasteryAssessed:false}};
}
export function solveSteps(t){const s=[],f=(field,value)=>s.push({field,value:String(value)}),a=(name,index)=>s.push({action:'m33-'+name,data:index===undefined?{}:{index}});
 if(t.type==='x-m33-coins')for(const set of t.examples){set.forEach((n,i)=>{for(let j=0;j<n;j++)a('add',i);});a('save');a('clear');}
 if(t.type==='x-m33-sort')for(const [i,c]of t.cards.entries()){a('group',c.group);a('place',i);}
 if(t.type==='x-m33-cart'){if(t.estimate){f('estimate',t.estimateExample);a('estimate');a('reveal');}(t.exampleSelection||[0]).forEach(i=>a('choose',i));}
 if(t.type==='x-m33-compare'){a('guess',t.want);a('reveal');a('pick',t.want);}
 if(t.type==='x-m33-model')a('method','bar');
 if(t.type==='x-m33-calc'||t.type==='x-m33-sheet'){if(t.estimate){f('estimate',t.estimateExample);a('estimate');}f('formula',t.exampleFormula);a('run');}
 (t.questions||[]).forEach((q,i)=>f('answers.'+i,q.kind==='major'?money(q.value,t.currency):q.value));return s;}
export function example(t){const m=initial(t);for(const s of solveSteps(t)){if(s.field){const[k,i]=s.field.split('.');if(i!==undefined)m[k][+i]=s.value;else m[k]=s.value;field(t,m,s.field);}else act(t,m,s.action,s.data);}return m;}
