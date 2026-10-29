import {number,clock} from './b20-model.js';

// Small, replayable constructions. Values used for money and mass are integer
// subunits; decimal formatting is only applied when displaying the answer.
export const TYPES=new Set(['x-m29-tape','x-m29-combine','x-m29-share','x-m29-interval','x-m29-order','x-m29-clock']);
const cp=x=>structuredClone(x),same=(a,b)=>JSON.stringify(a)===JSON.stringify(b),txt=x=>typeof x==='string'&&x.length<=300,int=(n,a,b)=>Number.isSafeInteger(n)&&n>=a&&n<=b;
const fields=['cut','equation','answer','unit','amount','jump','prose'];
const close=(a,b)=>Number.isFinite(number(a))&&Math.abs(number(a)-b)<1e-8;
const total=a=>a.reduce((s,n)=>s+n,0);
const norm=s=>String(s).replace(/\s+/g,'').replace(/[?？xX]/g,'□').replace(/[−–－]/g,'-').replace(/[＋]/g,'+').replace(/[＝]/g,'=');
export function equationMatches(t,s){const a=t.whole,b=t.known,u='□';return new Set([`${a}-${b}=${u}`,`${u}=${a}-${b}`,`${b}+${u}=${a}`,`${u}+${b}=${a}`,`${a}=${b}+${u}`,`${a}=${u}+${b}`,`${a}-${u}=${b}`,`${b}=${a}-${u}`]).has(norm(s));}
function board(t){const first={};switch(t.type){
 case'x-m29-tape':return{cut:null,first,bad:false};
 case'x-m29-combine':return{chosen:[],first,bad:false};
 case'x-m29-share':return{moves:[],first,bad:false};
 case'x-m29-interval':case'x-m29-clock':return{moves:[],first,bad:false};
 case'x-m29-order':return{chosen:[],first,bad:false};
}}
export const initial=t=>({...Object.fromEntries(fields.map(k=>[k,''])),board:board(t),history:[],issue:''});
const validEvent=e=>e&&typeof e.a==='string'&&['cut','choose','give','move','undo','clear'].includes(e.a)&&txt(e.v)&&txt(e.i);
function apply(t,b,e){let issue='';const v=number(e.v),i=Number(e.i),bad=msg=>{b.bad=true;issue=msg;};
 if(t.type==='x-m29-tape'&&e.a==='cut'){
  b.first.cut??=e.v;
  if(!int(v,0,t.whole))bad('先把分界放在整条范围内。');
  else{b.cut=v;if(v!==(t.knownSide==='right'?t.whole-t.known:t.known))bad('看看已知的那一段有多长，分界还可以移动。');}
 }
 if(t.type==='x-m29-combine'){
  if(e.a==='choose'&&int(i,0,t.parts.length-1)&&!b.chosen.includes(i))b.chosen.push(i);
  if(e.a==='undo')b.chosen.pop();if(e.a==='clear')b.chosen=[];
 }
 if(t.type==='x-m29-share'){
  if(e.a==='give'&&int(i,0,t.people-1)){
   b.first.give??={index:i,amount:e.v};const remaining=t.total-total(b.moves.map(x=>x.amount));
   if(!int(v,1,remaining))bad('这次放进去的克数，要在剩余量以内。');
   else b.moves.push({index:i,amount:v});
  }
  if(e.a==='undo')b.moves.pop();if(e.a==='clear')b.moves=[];
 }
 if(t.type==='x-m29-interval'||t.type==='x-m29-clock'){
  if(e.a==='move'){
   b.first.move??=e.v;const span=t.type==='x-m29-clock'?t.duration:Math.abs(t.end-t.start),remaining=span-total(b.moves);
   if(!int(v,1,remaining))bad('每次走正数步，不能越过终点。');else b.moves.push(v);
  }
  if(e.a==='undo')b.moves.pop();if(e.a==='clear')b.moves=[];
 }
 if(t.type==='x-m29-order'){
  if(e.a==='choose'&&int(i,0,t.values.length-1)&&!b.chosen.includes(i)){
   b.first.choice??=i;const sorted=t.values.map((v,j)=>[v,j]).sort((a,b)=>a[0]-b[0]);
   if(sorted[b.chosen.length][1]!==i)b.bad=true;b.chosen.push(i);
  }
  if(e.a==='undo')b.chosen.pop();if(e.a==='clear')b.chosen=[];
 }
 return{board:b,issue};
}
export function act(t,m,action,data={}){const a=action.replace(/^m29-/,''),e={a,i:String(data.index??''),v:String(a==='cut'?m.cut:a==='give'?m.amount:a==='move'?m.jump:'')};if(!validEvent(e)||m.history.length>=500)return m;const r=apply(t,cp(m.board),e);m.board=r.board;m.issue=r.issue;m.history.push(e);return m;}
export function field(t,m,key){if(fields.includes(key))m[key]=String(m[key]??'');}
export function valid(t,m){try{if(!TYPES.has(t.type)||!m||!fields.every(k=>txt(m[k]))||!txt(m.issue)||!Array.isArray(m.history)||m.history.length>500||!m.history.every(validEvent))return false;let b=board(t);for(const e of m.history)b=apply(t,b,e).board;return same(b,m.board);}catch{return false;}}
export function inspect(t,m){if(!valid(t,m))return{correct:false,feedback:'这份操作记录暂时读不出来。'};const b=m.board;let ok=false,hint='看看摆出的图和记录是否对上。';
 if(t.type==='x-m29-tape'){const wanted=t.knownSide==='right'?t.whole-t.known:t.known;ok=b.cut===wanted&&number(m.cut)===b.cut&&equationMatches(t,m.equation)&&close(m.answer,t.whole-t.known)&&m.unit===t.unit;hint='先让已知的一段对上，再用 □ 写出未知量，并带上单位。';}
 if(t.type==='x-m29-combine'){const result=t.mode==='difference'?Math.abs(t.parts[0]-t.parts[1]):total(t.parts);ok=b.chosen.length===t.parts.length&&close(m.answer,result/(t.scale||1))&&m.unit===t.unit;hint=t.mode==='difference'?'先把两段放到同一起点，看看多出的部分。':'每一段都放进来，单位要一样，再看合起来的量。';}
 if(t.type==='x-m29-share'){const amounts=Array.from({length:t.people},(_,i)=>total(b.moves.filter(x=>x.index===i).map(x=>x.amount)));ok=total(amounts)===t.total&&amounts.every(x=>x===t.total/t.people)&&close(m.answer,t.total/t.people/1000)&&m.unit==='kg';hint='所有量都要分完，每份一样多；1000 g 是 1 kg。';}
 if(t.type==='x-m29-interval'){const span=Math.abs(t.end-t.start);ok=total(b.moves)===span&&b.moves.length>0&&close(m.answer,span)&&m.unit===t.unit;hint='从起点走到终点，数走过的间隔；零只是一个位置，不多算一步。';}
 if(t.type==='x-m29-clock'){ok=total(b.moves)===t.duration&&b.moves.length>0&&m.answer===clock(t.start+t.duration);hint='走过的分钟要合起来等于这段时间；每满60分钟进一小时。';}
 if(t.type==='x-m29-order'){const want=t.values.map((v,i)=>[v,i]).sort((a,b)=>a[0]-b[0]).map(x=>x[1]);ok=same(b.chosen,want);hint='从数轴左边较小的位置开始，零左侧是负数。';}
 return{correct:!!ok,feedback:ok?'图和这次记录对上了。':hint,evidence:{kind:t.type,board:cp(b),history:cp(m.history),fields:Object.fromEntries(fields.map(k=>[k,m[k]])),freeExplanationAssessed:false,physicalMeasurementAssessed:false,generalMasteryAssessed:false}};
}
export function solveSteps(t){const s=[],f=(field,value)=>s.push({field,value:String(value)}),a=(action,data={})=>s.push({action:'m29-'+action,data});
 if(t.type==='x-m29-tape'){f('cut',t.knownSide==='right'?t.whole-t.known:t.known);a('cut');f('equation',`${t.whole}-${t.known}=□`);f('answer',t.whole-t.known);f('unit',t.unit);}
 if(t.type==='x-m29-combine'){t.parts.forEach((_,index)=>a('choose',{index}));f('answer',(t.mode==='difference'?Math.abs(t.parts[0]-t.parts[1]):total(t.parts))/(t.scale||1));f('unit',t.unit);}
 if(t.type==='x-m29-share'){f('amount',t.total/t.people);for(let index=0;index<t.people;index++)a('give',{index});f('answer',t.total/t.people/1000);f('unit','kg');}
 if(t.type==='x-m29-interval'){const span=Math.abs(t.end-t.start),first=t.start*t.end<0?Math.abs(t.start):span;f('jump',first);a('move');if(span>first){f('jump',span-first);a('move');}f('answer',span);f('unit',t.unit);}
 if(t.type==='x-m29-clock'){const first=Math.min(t.duration,60-t.start%60);f('jump',first);a('move');if(t.duration>first){f('jump',t.duration-first);a('move');}f('answer',clock(t.start+t.duration));}
 if(t.type==='x-m29-order')t.values.map((v,i)=>[v,i]).sort((a,b)=>a[0]-b[0]).forEach(([,index])=>a('choose',{index}));
 return s;
}
export function example(t){const m=initial(t);for(const s of solveSteps(t)){if(s.field){m[s.field]=s.value;field(t,m,s.field);}else act(t,m,s.action,s.data);}return m;}
