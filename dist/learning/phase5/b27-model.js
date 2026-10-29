import {section,sectionShape,sizeRelation} from './b27-geometry.js';
export const TYPES=new Set(['x-g27-sort','x-g27-face','x-g27-build','x-g27-net','x-g27-cut']);
const cp=x=>structuredClone(x),same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const text=x=>typeof x==='string'&&x.length<=1500,int=(n,a,b)=>Number.isInteger(n)&&n>=a&&n<=b;
const seed=()=>globalThis.crypto.getRandomValues(new Uint32Array(1))[0]||1;
const initBoard=t=>{
 if(['x-g27-sort','x-g27-face'].includes(t.type))return {card:0,choices:Array(t.cards.length).fill(null),probed:[],revealed:[],turned:false,first:{},bad:false};
 if(t.type==='x-g27-build')return {parts:[],turned:false,first:{},bad:false};
 if(t.type==='x-g27-net')return {parts:[],fold:0,prediction:null,attempts:[],turned:false,first:{},bad:false};
 return {card:0,predictions:Array(t.cards.length).fill(null),answers:Array(t.cards.length).fill(null),observations:t.cards.map(()=>[]),position:0,turned:false,first:{},bad:false};
};
export const fields=()=>({position:'2',foldPosition:'0',prose:''});
export const initial=(t,s=seed())=>({...fields(),seed:s,board:initBoard(t),history:[],issue:''});
const actions=new Set(['card','choose','probe','show','add','remove','piece','predict','fold','unfold','cut','answer','turn','reset','help']);
const validEvent=e=>e&&actions.has(e.a)&&e.d&&Object.keys(e.d).every(k=>k==='index'&&text(e.d[k]))&&typeof e.d==='object';
const inBin=(t,v)=>t.bins?.some(b=>b.id===v);
function apply(t,b,e){
 const {a,d}=e,v=d.index??'',i=Number(v),fail=s=>s;let issue='';
 if(a==='turn')b.turned=true;
 if(a==='help'){b.first.help=true;return {board:b,issue};}
 if(a==='reset'){const n=initBoard(t);n.first=cp(b.first);n.bad=b.bad;return {board:n,issue};}
 if(['x-g27-sort','x-g27-face'].includes(t.type)){
  if(a==='card'&&int(i,0,t.cards.length-1))b.card=i;
  if(a==='probe'&&t.type==='x-g27-face'&&!b.probed.includes(b.card))b.probed.push(b.card);
  if(a==='choose'&&inBin(t,v)){
   if(t.type==='x-g27-face'&&!b.probed.includes(b.card))issue=fail('先点亮要观察的那一面。');
   else {b.first['card'+b.card]??=v;if(v!==t.cards[b.card].answer)b.bad=true;b.choices[b.card]=v;b.revealed=b.revealed.filter(x=>x!==b.card);}
  }
  if(a==='show'&&t.cards[b.card].reveal){if(b.choices[b.card]===null)issue=fail('先猜它是什么，再展开立体看看。');else if(!b.revealed.includes(b.card))b.revealed.push(b.card);}
 }
 if(t.type==='x-g27-build'){
  if(a==='add'&&t.options.includes(v)){if(b.parts.length>=t.target.length)issue=fail('已经放满了，可以先拿走最上面的一块。');else{b.first['part'+b.parts.length]??=v;b.parts.push(v);if(v!==t.target[b.parts.length-1])b.bad=true;}}
  if(a==='remove'&&b.parts.length)b.parts.pop();
 }
 if(t.type==='x-g27-net'){
  if(a==='piece'&&int(i,0,3)){if(b.fold)issue=fail('先把纸片摊开，再调整。');else{const at=b.parts.indexOf(i);if(at<0)b.parts.push(i);else b.parts.splice(at,1);b.parts.sort();b.prediction=null;}}
  if(a==='predict'&&['yes','no'].includes(v)){b.first.prediction??=v;b.prediction=v;if(v!==(b.parts.length===4?'yes':'no'))b.bad=true;}
  if(a==='fold'){const next=v===''?100:i;if(b.prediction===null)issue=fail('先猜一猜，它能合成一个两头是三角形的盒子吗？');else if(int(next,0,100)){if(next===100&&b.fold!==100)b.attempts.push({parts:[...b.parts],prediction:b.prediction});b.fold=next;}}
  if(a==='unfold'){b.fold=0;b.prediction=null;}
 }
 if(t.type==='x-g27-cut'){
  const card=t.cards[b.card],expected=card.mode==='compare'?sizeRelation(card.shape):sectionShape(card.shape,card.axis);
  if(a==='card'&&int(i,0,t.cards.length-1)){b.card=i;b.position=0;}
  if(a==='predict'&&inBin(t,v)){b.first['prediction'+b.card]??=v;b.predictions[b.card]=v;if(v!==expected)b.bad=true;b.position=0;b.observations[b.card]=[];b.answers[b.card]=null;}
  if(a==='cut'&&int(i,1,3)){
   if(b.predictions[b.card]===null)issue=fail('先猜，再移动切面看看。');
   else if(!section(card.shape,card.axis,i))issue=fail('这里选择穿过尖顶和底面中心的一刀。');
   else{b.position=i;if(!b.observations[b.card].includes(i))b.observations[b.card].push(i);}
  }
  if(a==='answer'&&inBin(t,v)){
   const required=card.required||[1,3];if(!required.every(x=>b.observations[b.card].includes(x)))issue=fail('先移动切面，比较要求的位置。');
   else{b.first['answer'+b.card]??=v;b.answers[b.card]=v;if(v!==expected)b.bad=true;}
  }
 }
 return {board:b,issue};
}
export function act(t,m,action,data={}){
 const a=action.replace(/^g27-/,'');
 const e={a,d:Object.fromEntries(Object.entries(data).filter(([k])=>k==='index').map(([k,v])=>[k,String(v)]))};
 if(!validEvent(e)||m.history.length>=1000)return m;
 const r=apply(t,cp(m.board),e);m.board=r.board;m.issue=r.issue;m.history.push(e);return m;
}
export function field(t,m,key){
 if(key==='position'){m.position=String(m.position??'2');if(t.type==='x-g27-cut')act(t,m,'g27-cut',{index:m.position});}
 if(key==='foldPosition'){m.foldPosition=String(m.foldPosition??'0');if(t.type==='x-g27-net')act(t,m,'g27-fold',{index:m.foldPosition});}
 if(key==='prose')m.prose=String(m.prose??'');
}
export function valid(t,m){
 try{
  if(!m||!TYPES.has(t.type)||!int(m.seed,1,4294967295)||!text(m.issue)||!text(m.position)||!text(m.foldPosition)||!text(m.prose)||!Array.isArray(m.history)||m.history.length>1000||!m.history.every(validEvent))return false;
  let b=initBoard(t);for(const e of m.history)b=apply(t,b,e).board;return same(b,m.board);
 }catch{return false;}
}
export function inspect(t,m){
 const b=m.board;let ok=false,hint='';
 if(['x-g27-sort','x-g27-face'].includes(t.type)){
  ok=t.cards.every((c,i)=>b.choices[i]===c.answer&&(t.type!=='x-g27-face'||b.probed.includes(i))&&(!c.reveal||b.revealed.includes(i)))&&(!t.rotate||b.turned);
  hint=t.type==='x-g27-face'?'先点亮一面，看看这一个平面是什么形状，再逐个选择。':'逐个看清模型；可以转动后再把它们放到相应的位置。';
 }
 if(t.type==='x-g27-build'){ok=same(b.parts,t.target)&&(!t.rotate||b.turned);hint='从下面开始放，看看每块的形状；不合适就先拿走上面的一块。';}
 if(t.type==='x-g27-net'){ok=b.parts.length===4&&b.prediction==='yes'&&b.fold===100&&b.attempts.at(-1)?.parts.length===4&&(!t.rotate||b.turned);hint='把三个长方形和两个三角形连起来，先猜，再折回去查看。';}
 if(t.type==='x-g27-cut'){
  ok=t.cards.every((c,i)=>b.predictions[i]!==null&&(c.required||[1,3]).every(n=>b.observations[i].includes(n))&&b.answers[i]===(c.mode==='compare'?sizeRelation(c.shape):sectionShape(c.shape,c.axis)))&&(!t.rotate||b.turned);
  hint='先猜，再移动切面；看看实际出现的形状，或者比较两个位置的大小。';
 }
 return {correct:!!ok,feedback:ok?'这次操作和发现对应上了。':hint,evidence:{kind:'B27 bounded spatial investigation',board:cp(b),history:cp(m.history),prose:m.prose,freeTextMeaningAssessed:false,physicalManipulationAssessed:false,generalMasteryAssessed:false}};
}
export function solveSteps(t){
 const out=[],a=(name,index)=>out.push({action:'g27-'+name,data:index===undefined?{}:{index}}),f=(field,value)=>out.push({field,value:String(value)});
 if(['x-g27-sort','x-g27-face'].includes(t.type))t.cards.forEach((c,i)=>{a('card',i);if(t.type==='x-g27-face')a('probe');a('choose',c.answer);if(c.reveal)a('show');});
 if(t.type==='x-g27-build')for(const p of t.target)a('add',p);
 if(t.type==='x-g27-net'){for(let i=0;i<4;i++)a('piece',i);a('predict','yes');a('fold');}
 if(t.type==='x-g27-cut')t.cards.forEach((c,i)=>{a('card',i);a('predict',c.mode==='compare'?sizeRelation(c.shape):sectionShape(c.shape,c.axis));for(const p of c.required||[1,3]){if(c.axis==='vertical')a('cut',p);else f('position',p);}a('answer',c.mode==='compare'?sizeRelation(c.shape):sectionShape(c.shape,c.axis));});
 if(t.rotate)out.push({action:'turn-extra',data:{}});return out;
}
export function example(t){
 const m=initial(t,314159);for(const s of solveSteps(t))if(s.field){m[s.field]=s.value;field(t,m,s.field);}else act(t,m,s.action==='turn-extra'?'g27-turn':s.action,s.data);return m;
}
