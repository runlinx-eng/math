import {rational} from './b16-model.js';
export const TYPES=new Set(['x-m31-compare','x-m31-fill','x-m31-balance','x-m31-meter','x-m31-cubes','x-m31-product']);
const cp=x=>structuredClone(x),same=(a,b)=>JSON.stringify(a)===JSON.stringify(b),txt=x=>typeof x==='string'&&x.length<=1200,int=(x,a,b)=>Number.isInteger(x)&&x>=a&&x<=b;
const ratio=(raw,n,d=1)=>{const r=rational(raw);return !!r&&r[0]*d===n*r[1];};
const scalar=(raw,n)=>ratio(raw,n,1),num=s=>{const r=rational(s);return r?r[0]/r[1]:NaN;};
const keys=['estimate','count','amount','step','reading','unit','perLayer','layers','total','oneCube','base','volume','product','prose'];
const qfields=t=>Array(t.questions?.length||0).fill('');
function board(t){const common={first:{},bad:false};switch(t.type){
 case'x-m31-compare':return{...common,prediction:null,amounts:t.amounts.slice(),poured:t.amounts.map(()=>0),choice:null};
 case'x-m31-fill':return{...common,unit:null,level:0,count:0,runs:[]};
 case'x-m31-balance':return{...common,tested:[],last:null,order:[]};
 case'x-m31-meter':return{...common,prediction:null,saved:null};
 case'x-m31-cubes':return{...common,filled:[],spread:false,opened:false,turned:false,plan:null,part:null};
 case'x-m31-product':return{...common,selected:[],turned:false};
}}
export const initial=t=>({...Object.fromEntries(keys.map(k=>[k,''])),answers:qfields(t),history:[],issue:'',board:board(t)});
const af={predict:['estimate'],guess:[],pour:[],choice:[],choose:[],add:[],reset:[],record:['count','amount','unit'],test:[],order:[],clear:[],meter:['step','reading','unit'],fill:[],remove:[],spread:[],turn:[],plan:['perLayer','layers','total'],part:['oneCube','base']};
const eventOK=e=>e&&af[e.a]&&txt(e.i)&&e.f&&Object.keys(e.f).length===af[e.a].length&&af[e.a].every(k=>txt(e.f[k]));
const goodChoice=(t,v)=>['left','right','equal'].includes(v);
function apply(t,b,e){const v=e.i,i=Number(v),f=e.f;let issue='';const fail=s=>{issue=s;b.bad=true;};
 if(t.type==='x-m31-compare'){
  if(e.a==='guess'&&goodChoice(t,v)&&b.prediction===null){b.prediction=v;b.first.guess??=v;}
  if(e.a==='pour'&&int(i,0,t.amounts.length-1)){if(b.prediction===null)issue='先猜一猜，再倒进一样的杯子比较。';else if(b.amounts[i]>0){b.poured[i]+=b.amounts[i];b.amounts[i]=0;}}
  if(e.a==='choice'&&goodChoice(t,v)){if(b.poured.some((n,j)=>n!==t.amounts[j]))issue='先把两份都倒进一样的杯子。';else{b.first.choice??=v;b.choice=v;if(v!==t.answer)b.bad=true;}}
 }
 if(t.type==='x-m31-fill'){
  if(e.a==='choose'&&t.units.some(u=>u.id===v)){b.unit=v;b.level=0;b.count=0;}
  if(e.a==='reset'&&b.unit){b.level=0;b.count=0;}
  if(e.a==='add'){const u=t.units.find(u=>u.id===b.unit);if(!u)issue='先选一个量杯。';else if(b.level+u.amount>t.capacity)fail('这一整杯会超过容器的容量。');else{b.level+=u.amount;b.count++;}}
  if(e.a==='record'){const u=t.units.find(u=>u.id===b.unit);b.first.record??=cp(f);if(!u||b.level!==t.goal||!scalar(f.count,b.count)||!scalar(f.amount,t.goal)||f.unit!==t.unit)fail('先用同样满的量杯倒到要求的位置，再对照杯数、数量和单位。');else{b.runs=b.runs.filter(x=>x.unit!==u.id);b.runs.push({unit:u.id,count:b.count,amount:b.level,fields:cp(f)});}}
 }
 if(t.type==='x-m31-balance'){
  if(e.a==='test'&&int(i,0,t.pairs.length-1)){if(!b.tested.includes(i))b.tested.push(i);b.last=i;}
  if(e.a==='order'&&int(i,0,t.objects.length-1)&&!b.order.includes(i)){b.order.push(i);if(b.order.length===t.objects.length){b.first.order??=b.order.slice();if(!b.order.every((n,j)=>!j||t.objects[b.order[j-1]].mass<=t.objects[n].mass))b.bad=true;}}
  if(e.a==='clear')b.order=[];
 }
 if(t.type==='x-m31-meter'){
  if(e.a==='predict'){if(!Number.isFinite(num(f.estimate))||num(f.estimate)<0)issue='先留下一个估计，不需要猜得刚好。';else if(b.prediction===null){b.prediction=f.estimate;b.first.estimate=f.estimate;}}
  if(e.a==='meter'){b.first.meter??=cp(f);if(b.prediction===null)issue='先估一估，再显示仪器。';else if(!ratio(f.step,t.minorN,t.minorD)||!ratio(f.reading,t.valueN,t.valueD)||f.unit!==t.unit)fail('找相邻数字之间有几段，先算一段的值，再读出水面或指针。');else b.saved=cp(f);}
 }
 if(t.type==='x-m31-cubes'){
  const total=t.grid.reduce((a,x)=>a*x,1);
  if(e.a==='fill'&&int(i,0,total-1)&&!b.filled.includes(i)){b.filled.push(i);b.plan=null;b.part=null;}
  if(e.a==='remove'&&b.filled.length){b.filled.pop();b.plan=null;b.part=null;}
  if(e.a==='spread'){b.spread=!b.spread;if(b.spread)b.opened=true;}
  if(e.a==='turn')b.turned=true;
  if(e.a==='plan'){
   b.first.plan??=cp(f);const [w,d,h]=t.grid;
   if(b.filled.length!==total||!b.opened||!scalar(f.perLayer,w*d)||!scalar(f.layers,h)||!scalar(f.total,total))fail('先填满并打开层：每层多少块、共有几层、全部多少块要对应。');
   else{b.plan=cp(f);b.part=null;}
  }
  if(e.a==='part'){
   b.first.part??=cp(f);const [w,d]=t.grid;
   if(!b.plan||!ratio(f.oneCube,1,t.den**3)||!ratio(f.base,w*d,t.den**2))fail('边长分成几份，要在长、宽、高三个方向都分；底面则只看一层的长和宽。');
   else b.part=cp(f);
  }
 }
 if(t.type==='x-m31-product'&&e.a==='turn')b.turned=true;
 return{board:b,issue};
}
export function act(t,m,action,data={}){const a=action.replace(/^m31-/,'');if(!af[a]||m.history.length>=1200)return m;const e={a,i:String(data.index??''),f:Object.fromEntries(af[a].map(k=>[k,String(m[k])]))};if(!eventOK(e))return m;const r=apply(t,cp(m.board),e);m.board=r.board;m.issue=r.issue;m.history.push(e);if(t.type==='x-m31-fill'&&(a==='choose'||a==='reset')){m.count='';m.amount='';m.unit='';}return m;}
export function field(t,m,k){if(keys.includes(k))m[k]=String(m[k]??'');else if(k.startsWith('answers.'))m.answers[Number(k.split('.')[1])]=String(m.answers[Number(k.split('.')[1])]??'');}
export function valid(t,m){try{if(!TYPES.has(t.type)||!m||!keys.every(k=>txt(m[k]))||!txt(m.issue)||!Array.isArray(m.answers)||m.answers.length!==qfields(t).length||!m.answers.every(txt)||!Array.isArray(m.history)||m.history.length>1200||!m.history.every(eventOK))return false;let b=board(t);for(const e of m.history)b=apply(t,b,e).board;return same(b,m.board);}catch{return false;}}
const questionsRight=(t,m)=>(t.questions||[]).every((q,i)=>q.options?m.answers[i]===String(q.value):ratio(m.answers[i],q.value));
export function inspect(t,m){if(!valid(t,m))return{correct:false,feedback:'这份作品暂时读不出来。'};const b=m.board;let ok=false,hint='先完成眼前的操作，再对照记录。';
 if(t.type==='x-m31-compare'){ok=b.prediction!==null&&b.poured.every((n,i)=>n===t.amounts[i])&&b.choice===t.answer;hint='先猜，再把两份倒进同样的杯子，比较的是水量还是装满的容量？';}
 if(t.type==='x-m31-fill'){const r=b.runs.find(x=>x.unit===b.unit);ok=t.requiredUnits.every(id=>b.runs.some(x=>x.unit===id))&&!!r&&m.count===r.fields.count&&m.amount===r.fields.amount&&m.unit===r.fields.unit;hint='每次倒入同样满的一杯，停在要求的位置；数字和单位一起记录。';}
 if(t.type==='x-m31-balance'){ok=t.pairs.every((_,i)=>b.tested.includes(i))&&b.order.length===t.objects.length&&b.order.every((n,i)=>!i||t.objects[b.order[i-1]].mass<=t.objects[n].mass);hint='先分别用同一件东西比较，较低的一边较重；再从轻到重排列。';}
 if(t.type==='x-m31-meter'){ok=b.prediction!==null&&!!b.saved&&same(b.saved,{step:m.step,reading:m.reading,unit:m.unit});hint='先看相邻数字差多少，数中间的间隔，再读液面或指针。';}
 if(t.type==='x-m31-cubes'){const[w,d,h]=t.grid,total=w*d*h;ok=b.turned&&b.opened&&b.filled.length===total&&!!b.plan&&!!b.part&&ratio(m.volume,total,t.den**3)&&ratio(m.product,total,t.den**3)&&m.unit===t.unit+'³';hint='先填满并打开每层；一小块的体积是三个边长相乘，不是一个边长。';}
 if(t.type==='x-m31-product'){ok=b.turned&&ratio(m.base,t.baseN,t.baseD)&&ratio(m.volume,t.volumeN,t.volumeD)&&ratio(m.product,t.volumeN,t.volumeD)&&m.unit===t.unit+'³';hint='先算底面积，再乘深度；三条边的单位相同，总体积用立方单位。';}
 ok=!!ok&&questionsRight(t,m);return{correct:ok,feedback:ok?'这次操作和记录对应上了。':hint,evidence:{kind:t.type,board:cp(b),history:cp(m.history),freeExplanationAssessed:false,physicalUseAssessed:false,generalMasteryAssessed:false}};
}
export function solveSteps(t){const s=[],f=(field,value)=>s.push({field,value:String(value)}),a=(name,index)=>s.push({action:'m31-'+name,data:index===undefined?{}:{index}});
 if(t.type==='x-m31-compare'){a('guess',t.answer);t.amounts.forEach((_,i)=>a('pour',i));a('choice',t.answer);}
 if(t.type==='x-m31-fill'){for(const id of t.requiredUnits){const u=t.units.find(x=>x.id===id);a('choose',id);for(let j=0;j<t.goal/u.amount;j++)a('add');f('count',t.goal/u.amount);f('amount',t.goal);f('unit',t.unit);a('record');}}
 if(t.type==='x-m31-balance'){t.pairs.forEach((_,i)=>a('test',i));t.objects.map((o,i)=>[o.mass,i]).sort((a,b)=>a[0]-b[0]).forEach(x=>a('order',x[1]));}
 if(t.type==='x-m31-meter'){f('estimate',t.estimateExample);a('predict');f('step',`${t.minorN}/${t.minorD}`);f('reading',`${t.valueN}/${t.valueD}`);f('unit',t.unit);a('meter');}
 if(t.type==='x-m31-cubes'){const[w,d,h]=t.grid;for(let i=0;i<w*d*h;i++)a('fill',i);a('spread');s.push({action:'turn-extra',data:{}});f('perLayer',w*d);f('layers',h);f('total',w*d*h);a('plan');f('oneCube',`1/${t.den**3}`);f('base',`${w*d}/${t.den**2}`);a('part');f('volume',`${w*d*h}/${t.den**3}`);f('product',`${w*d*h}/${t.den**3}`);f('unit',t.unit+'³');}
 if(t.type==='x-m31-product'){s.push({action:'turn-extra',data:{}});f('base',`${t.baseN}/${t.baseD}`);f('volume',`${t.volumeN}/${t.volumeD}`);f('product',`${t.volumeN}/${t.volumeD}`);f('unit',t.unit+'³');}
 (t.questions||[]).forEach((q,i)=>f('answers.'+i,q.value));return s;
}
export function example(t){const m=initial(t);for(const s of solveSteps(t)){if(s.field){const [k,i]=s.field.split('.');if(i!==undefined)m[k][+i]=s.value;else m[k]=s.value;field(t,m,s.field);}else act(t,m,s.action==='turn-extra'?'m31-turn':s.action,s.data);}return m;}
