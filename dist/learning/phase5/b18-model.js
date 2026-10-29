import * as F from './b17-model.js';
import {equal,toggle} from './b16-model.js';
export const TYPES=new Set(['x-fracdecompose','x-mixedtrade','x-fracshare','x-scalechain','x-fractioncase']);
const cp=x=>structuredClone(x),same=(a,b)=>JSON.stringify(a)===JSON.stringify(b),int=(n,a=0,b=10000)=>Number.isSafeInteger(n)&&n>=a&&n<=b;
const text=s=>typeof s==='string'&&s.length<=1000;
export const fields={guess:'',equation:'',answer:'',whole:'',part:'',factor:'',choice:'',low:'',high:'',inside:'',story:'',tile:'',count:'',simple:'',inverse:'',scaledA:'',scaledB:'',decimal:'',denom:'',unit:'',amount:'',result:''};
export const inner=t=>({...t,type:'x-fracoperations'});
export const value=s=>F.frac(s);
export const fmt=r=>r[1]===1?String(r[0]):r.join('/');
export const mul=(a,b)=>F.reduced(a[0]*b[0],a[1]*b[1]);
export const add=(a,b,sign=1)=>F.reduced(a[0]*b[1]+sign*b[0]*a[1],a[1]*b[1]);
const eq=(s,r)=>!!r&&equal(s,...r),sum=t=>F.operation(inner(t));
export const groups=(t,b)=>{const ends=[0,...b.cuts,t.n];return ends.slice(1).map((n,i)=>n-ends[i]);};
const key=a=>[...a].sort((a,b)=>a-b).join(',');
export function sumEquation(s,t,parts){const e=String(s).trim().split('=');if(e.length!==2||!eq(e[0],[t.n,t.d]))return false;const rhs=e[1].split('+').map(value);return rhs.length===parts.length&&rhs.every(r=>r&&r[0]>0&&int(r[0]*t.d/r[1],1,200))&&key(rhs.map(r=>r[0]*t.d/r[1]))===key(parts);}
export function inverseEquation(s,a,b,c){const e=String(s).trim().replace(/[×·]/g,'*').split('=');if(e.length!==2||!eq(e[1],c))return false;const p=e[0].split('*');return p.length===2&&((eq(p[0],a)&&eq(p[1],b))||(eq(p[0],b)&&eq(p[1],a)));}
function board(t){switch(t.type){
 case'x-fracdecompose':return{cuts:[],saved:[],first:null};
 case'x-mixedtrade':return{started:false,w:0,p:0,takenW:0,takenP:0,trades:0,first:null};
 case'x-fracshare':return{started:false,factor:0,selected:0,owners:[],first:null};
 case'x-scalechain':return{index:0,current:value(t.start),denom:0,selected:[],records:[],first:[]};
 case'x-fractioncase':return{started:false,first:null,estimate:null,normalized:null};
}}
export const initial=t=>({...fields,board:board(t),history:[],issue:'',...(t.type==='x-fractioncase'?{work:F.initial(inner(t))}:{})});
const actions=new Set(['reset','cut','new-groups','save','start','split','merge','all-pieces','take-whole','take-part','person','give','piece','commit','normalize']);
const serial=e=>e&&actions.has(e.a)&&Object.keys(fields).every(k=>text(e.f?.[k]))&&Object.entries(e.d||{}).every(([k,v])=>['index'].includes(k)&&text(v));
function apply(t,b,e){const{a,f,d}=e;let issue='';const fail=s=>issue=s,N=k=>Number(f[k]),index=Number(d.index);
 if(a==='reset'){const n=board(t);n.first=cp(b.first);return{board:n,issue};}
 if(t.type==='x-fracdecompose'){
  if(a==='cut'&&int(index,1,t.n-1))b.cuts=toggle(b.cuts,index).sort((a,b)=>a-b);
  if(a==='new-groups')b.cuts=[];
  if(a==='save'){const p=groups(t,b);b.first??={parts:cp(p),equation:f.equation};if(p.length<2||!sumEquation(f.equation,t,p))fail('每组有几小份，就写出那组的量；等号两边要保留原来的总量。');else if(b.saved.some(x=>key(x.parts)===key(p)))fail('交换先后还是同一组拆法。试着改变每组拿几份。');else b.saved.push({parts:cp(p),equation:f.equation});}
 }
 if(t.type==='x-mixedtrade'){
  if(a==='start'&&value(f.guess)){b.first??=f.guess;b.started=true;b.w=t.a[0]+(t.op==='+'?t.b[0]:0);b.p=t.a[1]+(t.op==='+'?t.b[1]:0);b.takenW=0;b.takenP=0;b.trades=0;}
  if(b.started){
   if(a==='split'&&b.w>0){b.w--;b.p+=t.d;b.trades++;}
   if(a==='all-pieces'&&b.w>0){b.p+=b.w*t.d;b.trades+=b.w;b.w=0;}
   if(a==='merge'&&b.p>=t.d){b.p-=t.d;b.w++;b.trades++;}
   if(a==='take-whole'&&t.op==='-'&&b.takenW<t.b[0]){if(b.w>0){b.w--;b.takenW++;}else if(b.p>=t.d){b.p-=t.d;b.takenW++;}else fail('现在没有足够的一整份可以拿走。');}
   if(a==='take-part'&&t.op==='-'&&b.takenP<t.b[1]){if(b.p>0){b.p--;b.takenP++;}else fail('小份不够了，可以把一个整体换开；量不会变。');}
  }
 }
 if(t.type==='x-fracshare'){
  if(a==='start'&&value(f.guess)){b.first??=f.guess;b.started=true;}
  if(a==='cut'&&b.started){const k=N('factor');if(!int(k,1,40)||t.d*k>120||t.n*k%t.people)fail('再分以后，要能让每个人拿到同样多的小块。可以换一种分法。');else{b.factor=k;b.owners=Array(t.n*k).fill(-1);}}
  if(a==='person'&&int(index,0,t.people-1))b.selected=index;
  if(a==='give'&&b.factor&&int(index,0,b.owners.length-1))b.owners[index]=b.owners[index]===b.selected?-1:b.selected;
 }
 if(t.type==='x-scalechain'&&b.index<t.stages.length){const st=t.stages[b.index],r=value(st.ratio);
  if(a==='cut'){const n=N('denom');if(!int(n,1,100)||!int(r[0]*n/r[1],1,160))fail('每一小份要一样大，而且能整齐取出所需的比例。');else{b.denom=n;b.selected=[];}}
  if(a==='piece'&&b.denom&&int(index,0,Math.ceil(r[0]/r[1])*b.denom-1))b.selected=toggle(b.selected,index);
  if(a==='commit'){b.first[b.index]??={denom:f.denom,unit:f.unit,amount:f.amount,result:f.result,decimal:f.decimal,selected:cp(b.selected)};const amount=mul(b.current,r),out=st.mode==='off'?add(b.current,amount,-1):st.mode==='add'?add(b.current,amount):amount;
   if(!b.denom||Number(f.denom)!==b.denom||b.selected.length*r[1]!==r[0]*b.denom)fail('图中取出的份数，要和这一轮的比例一致。');
   else if(!eq(f.unit,[b.current[0],b.current[1]*b.denom])||!eq(f.amount,amount))fail('先用这一轮的整个量分出一小份，再数你取出了几份。');
   else if(st.decimal&&(!/^(?:\d+(?:\.\d+)?|\.\d+)$/.test(f.decimal)||!eq(f.decimal,r)))fail('把这一轮的百分数写成等值小数；20%表示0.2倍，不是20倍。');
   else if(!eq(f.result,out))fail(st.mode==='off'?'折扣是拿走的量，还要从原量中减去。':st.mode==='add'?'这一轮算出的是增加量，还要加到当前的量上。':'把取出的量作为这一轮的结果。');
   else{b.records.push({before:cp(b.current),ratio:cp(r),mode:st.mode,denom:b.denom,selected:cp(b.selected),unit:f.unit,amount:f.amount,result:f.result,decimal:f.decimal});b.current=out;b.index++;b.denom=0;b.selected=[];}
  }
 }
 if(t.type==='x-fractioncase'){
  if(a==='start'){b.first??={choice:f.choice,low:f.low,high:f.high,guess:f.guess,story:f.story};if(f.choice!==t.op)fail('先区分是在接起来、拿走、取几倍，还是看能装几组。');else if(t.estimate&&(!value(f.low)||!value(f.high)||F.cmp(f.low,f.high)>=0))fail('先留下一个从小到大的估计范围，之后再用实际结果回看。');else if(!t.estimate&&!['negative','zero','part','one','more'].includes(f.guess))fail('先留下你对结果大小的猜想。');else{b.started=true;if(t.estimate)b.estimate=[f.low,f.high];}}
  if(a==='normalize'&&b.started){const a0=value(t.a),b0=value(t.b),k=value(f.inverse);if(!k||!eq(f.scaledA,mul(a0,k))||!eq(f.scaledB,mul(b0,k))||!eq(f.scaledB,[1,1]))fail('两边都乘同一个数，让“每组多少”变成1；不能只翻转前面的数。');else b.normalized={factor:f.inverse,a:f.scaledA,b:f.scaledB};}
 }
 return{board:b,issue};
}
export function act(t,m,action,data={}){
 if(action.startsWith('b18-op-')&&t.type==='x-fractioncase'){if(m.board.started){F.act(inner(t),m.work,action.replace('b18-op-','b17-'),data);m.issue=m.work.issue;}return m;}
 const e={a:action.replace(/^b18-/,''),d:Object.fromEntries(Object.entries(data).filter(([k])=>k==='index').map(([k,v])=>[k,String(v)])),f:Object.fromEntries(Object.keys(fields).map(k=>[k,m[k]]))};if(!serial(e)||m.history.length>=1200)return m;
 const before=m.board.index,r=apply(t,cp(m.board),e);m.board=r.board;m.issue=r.issue;m.history.push(e);
 if(t.type==='x-fractioncase'){
  if(e.a==='reset')F.act(inner(t),m.work,'b17-reset');
  if(e.a==='start'&&m.board.started&&!m.work.board.prediction){const low=value(m.low),high=value(m.high);m.work.prediction=t.estimate?F.estimateKind(add(low,high).map((x,i)=>i===1?x*2:x)):m.guess;F.act(inner(t),m.work,'b17-predict-op');}
 }
 if(t.type==='x-scalechain'&&m.board.index!==before)for(const k of['denom','unit','amount','result','decimal'])m[k]='';
 return m;
}
export function field(t,m,k){if(k.startsWith('work.')&&t.type==='x-fractioncase'){F.field(inner(t),m.work,k.slice(5));}else if(k in fields)m[k]=String(m[k]??'');}
export function valid(t,m){try{if(!TYPES.has(t.type)||!m||!Object.keys(fields).every(k=>text(m[k]))||!text(m.issue)||!Array.isArray(m.history)||m.history.length>1200||!m.history.every(serial))return false;let b=board(t);for(const e of m.history)b=apply(t,b,e).board;return same(b,m.board)&&(t.type!=='x-fractioncase'||F.valid(inner(t),m.work));}catch{return false;}}
export function inspect(t,m){const b=m.board;let ok=false,feedback='把实际操作与写下的量对起来。';
 if(t.type==='x-fracdecompose'){ok=b.saved.length>=(t.count||t.required?.length||1)&&(!t.required||t.required.every(p=>b.saved.some(x=>key(x.parts)===key(p))));feedback='留下不同的分组，每一种都要能拼回原来的量；顺序交换不算新的拆法。';}
 if(t.type==='x-mixedtrade'){const total=(t.a[0]*t.d+t.a[1])+(t.op==='+'?1:-1)*(t.b[0]*t.d+t.b[1]);ok=b.started&&(!t.trade||b.trades>0)&&(t.op==='+'||b.takenW===t.b[0]&&b.takenP===t.b[1])&&b.p<t.d&&b.w*t.d+b.p===total&&eq(m.whole,[b.w,1])&&eq(m.part,[b.p,t.d])&&eq(m.answer,[total,t.d]);feedback='拿走的量要完整；够一个整个的小份可以合起来。最后同时记录整份、零头与总量。';}
 if(t.type==='x-fracshare'){const counts=Array.from({length:t.people},(_,i)=>b.owners.filter(x=>x===i).length),r=F.reduced(t.n,t.d*t.people);ok=b.started&&b.factor>0&&Number(m.factor)===b.factor&&b.owners.every(x=>x>=0)&&counts.every(n=>n===t.n*b.factor/t.people)&&eq(m.answer,r)&&inverseEquation(m.equation,r,[t.people,1],[t.n,t.d])&&(!t.story||m.story.trim().length>0);feedback='原来这一小份全部分出去，每人一样多；把每人的量乘回人数，应回到原来的量。';}
 if(t.type==='x-scalechain'){ok=b.index===t.stages.length;feedback='每一轮先确认这次的整体。取出的量和最终留下的量，可能是两个不同的数。';}
 if(t.type==='x-fractioncase'){
  const r=sum(t),p=value(m.simple),w=m.work.board;
  ok=b.started&&F.inspect(inner(t),m.work).correct;
  if(t.estimate){const hit=!!b.estimate&&F.cmp(fmt(r),b.estimate[0])>=0&&F.cmp(fmt(r),b.estimate[1])<=0;ok=ok&&!!b.estimate&&m.inside===(hit?'yes':'no');}
  if(t.simple)ok=ok&&p&&eq(m.simple,r)&&F.gcd(...p)===1;
  if(t.mixed)ok=ok&&eq(m.whole,[Math.floor(r[0]/r[1]),1])&&eq(m.part,[r[0]%r[1],r[1]]);
  if(t.tile)ok=ok&&w.forms&&eq(m.tile,[1,w.forms[0][1]*w.forms[1][1]])&&eq(m.count,[w.columns.length*w.rows.length,1]);
  if(t.inverse)ok=ok&&inverseEquation(m.equation,r,value(t.b),value(t.a));
  if(t.reciprocal)ok=ok&&b.normalized&&same([m.inverse,m.scaledA,m.scaledB],[b.normalized.factor,b.normalized.a,b.normalized.b]);
  if(t.story)ok=ok&&m.story.trim().length>0;
  feedback='先让图、数量和运算关系一致，再记录这次发现。估计可以改，但最初的想法会留下。';
 }
 return{correct:!!ok,feedback:ok?'这次的构造与记录对上了。':feedback,evidence:{construction:cp(b),history:cp(m.history),fields:Object.fromEntries(Object.keys(fields).map(k=>[k,m[k]])),...(m.work?{work:F.inspect(inner(t),m.work).evidence}:{}),storyProvided:!!m.story.trim(),openExplanationAssessed:false,storyMeaningAssessed:false,physicalActionAssessed:false,generalMasteryAssessed:false}};
}
export function solveSteps(t){const s=[],f=(field,value)=>s.push({field,value:String(value)}),a=(action,data={})=>s.push({action:'b18-'+action,data});
 if(t.type==='x-fracdecompose'){const ps=t.required||[[1,t.n-1],[2,t.n-2]];for(const p of ps.slice(0,t.count||ps.length)){a('new-groups');let n=0;for(const q of p.slice(0,-1)){n+=q;a('cut',{index:n});}f('equation',`${t.n}/${t.d}=${p.map(n=>fmt(F.reduced(n,t.d))).join('+')}`);a('save');}}
 if(t.type==='x-mixedtrade'){const n=(t.a[0]*t.d+t.a[1])+(t.op==='+'?1:-1)*(t.b[0]*t.d+t.b[1]);f('guess',fmt(F.reduced(n,t.d)));a('start');let w=t.a[0]+(t.op==='+'?t.b[0]:0),p=t.a[1]+(t.op==='+'?t.b[1]:0);if(t.op==='-'){for(let i=0;i<t.b[0];i++){a('take-whole');w--;}for(let i=0;i<t.b[1];i++){if(!p){a('split');w--;p+=t.d;}a('take-part');p--;}}while(p>=t.d){a('merge');w++;p-=t.d;}f('whole',w);f('part',fmt(F.reduced(p,t.d)));f('answer',fmt(F.reduced(n,t.d)));}
 if(t.type==='x-fracshare'){const r=F.reduced(t.n,t.d*t.people);f('guess',fmt(r));if(t.story)f('story',t.exampleStory);a('start');f('factor',t.people);a('cut');for(let p=0;p<t.people;p++){a('person',{index:p});for(let j=0;j<t.n;j++)a('give',{index:p*t.n+j});}f('answer',fmt(r));f('equation',`${fmt(r)}×${t.people}=${t.n}/${t.d}`);}
 if(t.type==='x-scalechain'){let current=value(t.start);for(const st of t.stages){const r=value(st.ratio),amount=mul(current,r),out=st.mode==='off'?add(current,amount,-1):st.mode==='add'?add(current,amount):amount;f('denom',r[1]);a('cut');for(let i=0;i<r[0];i++)a('piece',{index:i});f('unit',fmt(F.reduced(current[0],current[1]*r[1])));f('amount',fmt(amount));if(st.decimal)f('decimal',r[0]/r[1]);f('result',fmt(out));a('commit');current=out;}}
 if(t.type==='x-fractioncase'){const r=sum(t);f('choice',t.op);if(t.estimate){f('low',t.estimate[0]);f('high',t.estimate[1]);}else f('guess',F.estimateKind(r));if(t.story)f('story',t.exampleStory);a('start');for(const st of F.solveSteps(inner(t)).filter(x=>x.field!=='prediction'&&x.action!=='b17-predict-op'))s.push(st.field?{field:'work.'+st.field,value:st.value}:{action:st.action.replace('b17-','b18-op-'),data:st.data});if(t.estimate)f('inside',F.cmp(fmt(r),String(t.estimate[0]))>=0&&F.cmp(fmt(r),String(t.estimate[1]))<=0?'yes':'no');if(t.simple)f('simple',fmt(r));if(t.mixed){f('whole',Math.floor(r[0]/r[1]));f('part',fmt(F.reduced(r[0]%r[1],r[1])));}if(t.tile){f('tile','1/'+(value(t.a)[1]*value(t.b)[1]));f('count',value(t.a)[0]*value(t.b)[0]);}if(t.inverse)f('equation',`${fmt(r)}×${t.b}=${t.a}`);if(t.reciprocal){const b=value(t.b),k=F.reduced(b[1],b[0]);f('inverse',fmt(k));f('scaledA',fmt(mul(value(t.a),k)));f('scaledB','1');a('normalize');}}
 return s;
}
export function example(t){const m=initial(t);for(const s of solveSteps(t)){if(s.field){if(s.field.startsWith('work.'))m.work[s.field.slice(5)]=s.value;else m[s.field]=s.value;field(t,m,s.field);}else act(t,m,s.action,s.data);}return m;}
