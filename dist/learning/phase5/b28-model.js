import {number} from './b20-model.js';
export const TYPES=new Set(['x-m28-compare','x-m28-units','x-m28-refine','x-m28-ruler','x-m28-balance','x-m28-scale','x-m28-convert','x-m28-vessels','x-m28-plot']);
const cp=x=>structuredClone(x),same=(a,b)=>JSON.stringify(a)===JSON.stringify(b),txt=x=>typeof x==='string'&&x.length<=1200,int=(n,a,b)=>Number.isInteger(n)&&n>=a&&n<=b;
const near=(a,b)=>Number.isFinite(number(a))&&Math.abs(number(a)-b)<1e-7;
const seed=()=>globalThis.crypto.getRandomValues(new Uint32Array(1))[0]||1;
export const measured=t=>t.raw.map(v=>Math.floor(v*t.den/t.rawDen+.5));
export const frequencies=t=>{const a=Array(t.end-t.start+1).fill(0);for(const v of measured(t))a[v-t.start]++;return a;};
export const cover=(t,positions)=>Array.from({length:t.length},(_,i)=>positions.filter(p=>i>=p&&i<p+t.size).length);
const fields=t=>({offset:String(t.initialOffset??2),estimate:'',error:'',measure:'',unit:'',prose:'',values:Array(t.rows?.length||0).fill(''),answers:Array(t.questions?.length||0).fill('')});
function board(t){const c={first:{},bad:false};switch(t.type){
 case'x-m28-compare':return {...c,offset:t.initialOffset??2,order:[],copied:[],choice:null};
 case'x-m28-units':return {...c,positions:[],saved:null};
 case'x-m28-refine':return {...c,size:null,count:0,runs:[]};
 case'x-m28-ruler':return {...c,offset:t.initialOffset??2,tool:null,prediction:null,saved:null};
 case'x-m28-balance':return {...c,tested:false,weights:[],choice:null,saved:null};
 case'x-m28-scale':return {...c,saved:null};
 case'x-m28-convert':return {...c,saved:null};
 case'x-m28-vessels':return {...c,selected:0,unit:null,levels:t.capacities.map(()=>0),seen:[],order:[]};
 case'x-m28-plot':return {...c,selected:0,records:t.raw.map(()=>null),marks:Array(t.end-t.start+1).fill(0)};
 }}
export const initial=(t,s=seed())=>({...fields(t),seed:s,board:board(t),history:[],issue:''});
const af={align:['offset'],predict:['estimate'],tool:[],choice:[],copy:[],order:[],clear:[],place:[],size:[],add:[],record:['measure','unit'],edit:[],test:[],weight:[],remove:[],convert:['values'],select:[],vunit:[],pour:[],seen:[],mark:[],unmark:[],help:[]};
const validEvent=(t,e)=>e&&af[e.a]&&e.d&&Object.keys(e.d).every(k=>k==='index'&&txt(e.d[k]))&&e.f&&Object.keys(e.f).length===af[e.a].length&&af[e.a].every(k=>k==='values'?Array.isArray(e.f[k])&&e.f[k].length===(t.rows?.length||0)&&e.f[k].every(txt):txt(e.f[k]));
const safeChoice=(t,v)=>(t.choices||[]).some(x=>x.id===v);
function apply(t,b,e){
 const {a,d,f}=e,v=d.index??'',i=Number(v);let issue='';const fail=s=>issue=s;
 if(a==='help')b.first.help=true;
 if(t.type==='x-m28-compare'){
  if(a==='align'){const n=number(f.offset);if(int(n,-3,3))b.offset=n;else fail('把两条的起点对齐。');}
  if(a==='choice'&&safeChoice(t,v)){b.first.choice??=v;if(v!==t.want)b.bad=true;b.choice=v;}
  if(a==='copy'&&int(i,0,t.items.length-1)&&!b.copied.includes(i))b.copied.push(i);
  if(a==='order'&&int(i,0,t.items.length-1)&&!b.order.includes(i))b.order.push(i);
  if(a==='clear')b.order=[];
 }
 if(t.type==='x-m28-units'){
  if(a==='place'&&int(i,0,t.length-t.size)){
   const j=b.positions.indexOf(i);if(j>=0)b.positions.splice(j,1);else b.positions.push(i);
   b.positions.sort((x,y)=>x-y);if(cover(t,b.positions).some(n=>n>1))b.bad=true;b.saved=null;
  }
  if(a==='clear'){b.positions=[];b.saved=null;}
  if(a==='record'){
   if(!Number.isFinite(number(f.measure)))fail('先数一数，写下用了几个单位。');
   else{b.first.measure??=f.measure;b.saved=cp(f);if(!near(f.measure,t.length/t.size)||f.unit!==t.unit)b.bad=true;}
  }
 }
 if(t.type==='x-m28-refine'){
  if(a==='size'&&t.sizes.some(x=>x.size===i)){b.size=i;b.count=0;b.runs=b.runs.filter(r=>r.size!==i);}
  if(a==='add'){if(b.size===null)fail('先选一种单位。');else if((b.count+1)*b.size>t.total)fail('放不下完整的一块，看看还剩多少。');else{b.count++;b.runs=b.runs.filter(r=>r.size!==b.size);}}
  if(a==='remove'&&b.count>0){b.count--;b.runs=b.runs.filter(r=>r.size!==b.size);}
  if(a==='record'){
   if(b.size===null)fail('先选单位、放上去。');
   else{b.first['count'+b.size]??=f.measure;if(!near(f.measure,b.count)||b.count!==Math.floor(t.total/b.size)){b.bad=true;fail('先把能放下的完整单位排满，再数一数。');}
   else{b.runs=b.runs.filter(r=>r.size!==b.size);b.runs.push({size:b.size,count:b.count,remainder:t.total-b.count*b.size});}}
  }
 }
 if(t.type==='x-m28-ruler'){
  if(a==='align'){const n=number(f.offset);if(int(n,-3,3))b.offset=n;}
  if(a==='tool'&&(t.tools||[]).some(x=>x.id===v)){b.first.tool??=v;if(v!==t.tool)b.bad=true;b.tool=v;b.saved=null;}
  if(a==='predict'){if(!Number.isFinite(number(f.estimate)))fail('先写一个估计，再用尺看。');else if(b.prediction===null)b.prediction=f.estimate;}
  if(a==='record'){
   if(t.estimate&&b.prediction===null)fail('先留下估计。');
   else if(t.tool&&b.tool!==t.tool)fail('先选适合这件物体的工具。');
   else if(b.offset!==0)fail('把尺子的零刻度对准物体的起点。');
   else if(!Number.isFinite(number(f.measure)))fail('先读出长度。');
   else{b.first.measure??=f.measure;b.saved=cp(f);if(!near(f.measure,t.value)||f.unit!==t.unit)b.bad=true;}
  }
 }
 if(t.type==='x-m28-balance'){
  if(a==='test')b.tested=true;
  if(a==='choice'&&safeChoice(t,v)){b.first.choice??=v;if(v!==t.want)b.bad=true;b.choice=v;}
  if(a==='weight'&&t.weights?.includes(i)&&b.weights.length<30){b.weights.push(i);b.tested=true;b.saved=null;}
  if(a==='remove'&&b.weights.length){b.weights.pop();b.saved=null;}
  if(a==='record'){
   if(!Number.isFinite(number(f.measure)))fail('先记录用了多少单位。');
   else{b.first.measure??=f.measure;b.saved=cp(f);if(!near(f.measure,t.mass)||f.unit!==t.unit)b.bad=true;}
  }
 }
 if(t.type==='x-m28-scale'&&a==='record'){
  if(!Number.isFinite(number(f.measure)))fail('先写下读到的数字。');
  else{b.first.measure??=f.measure;b.saved=cp(f);if(!near(f.measure,t.value)||f.unit!==t.unit)b.bad=true;}
 }
 if(t.type==='x-m28-convert'&&a==='convert'){
  if(f.values.some(x=>!Number.isFinite(number(x))))fail('先把下面的数量填完整。');
  else{b.first.values??=cp(f.values);b.saved=cp(f.values);if(!t.rows.every((r,j)=>near(f.values[j],r.expected)))b.bad=true;}
 }
 if(t.type==='x-m28-vessels'){
  if(a==='select'&&int(i,0,t.capacities.length-1))b.selected=i;
  if(a==='vunit'&&t.units.some(u=>u.id===v)){b.first.unit??=v;b.unit=v;}
  if(a==='pour'){
   const u=t.units.find(x=>x.id===b.unit),n=b.selected;if(!u)fail('先选一个量杯。');
   else if(b.levels[n]+u.amount>t.capacities[n]){b.first.overflow??=u.id;fail('这一杯会装不下，换小一点的量杯试试。');}
   else b.levels[n]+=u.amount;
  }
  if(a==='seen'){const n=b.selected;if(b.levels[n]!==t.capacities[n])fail('先把这个容器装满。');else if(!b.seen.includes(n))b.seen.push(n);}
  if(a==='order'&&int(i,0,t.capacities.length-1)&&!b.order.includes(i))b.order.push(i);
  if(a==='clear')b.order=[];
 }
 if(t.type==='x-m28-plot'){
  if(a==='select'&&int(i,0,t.raw.length-1))b.selected=i;
  if(a==='edit')b.records[b.selected]=null;
  if(a==='record'){
   const n=number(f.measure),want=measured(t)[b.selected]/t.den;
   b.records[b.selected]=null;
   if(!Number.isFinite(n))fail('先把这根物体的长度写下来。');
   else{b.first['measurement'+b.selected]??=f.measure;if(!near(f.measure,want)){b.bad=true;fail('再看一下尺上的刻度，按题目要求取最近的单位。');}else b.records[b.selected]=f.measure;}
  }
  if(a==='mark'&&int(i,0,b.marks.length-1)&&b.marks.reduce((x,y)=>x+y,0)<t.raw.length)b.marks[i]++;
  if(a==='unmark'&&int(i,0,b.marks.length-1)&&b.marks[i]>0)b.marks[i]--;
 }
 return {board:b,issue};
}
export function act(t,m,action,data={}){
 const a=action.replace(/^m28-/,'');if(!af[a]||m.history.length>=2000)return m;
 const e={a,d:Object.fromEntries(Object.entries(data).filter(([k])=>k==='index').map(([k,v])=>[k,String(v)])),f:Object.fromEntries(af[a].map(k=>[k,cp(m[k])]))};
 if(!validEvent(t,e))return m;const r=apply(t,cp(m.board),e);m.board=r.board;m.issue=r.issue;m.history.push(e);return m;
}
export function field(t,m,key){
 const root=key.split('.')[0];if(root in fields(t)&&!Array.isArray(m[root]))m[root]=String(m[root]??'');
 if(key==='offset'&&['x-m28-compare','x-m28-ruler'].includes(t.type))act(t,m,'m28-align');
 if(key==='measure'&&t.type==='x-m28-plot')act(t,m,'m28-edit');
}
export function valid(t,m){
 try{if(!m||!TYPES.has(t.type)||!int(m.seed,1,4294967295)||!txt(m.issue)||!Array.isArray(m.history)||m.history.length>2000)return false;
 for(const[k,v]of Object.entries(fields(t)))if(Array.isArray(v)?!Array.isArray(m[k])||m[k].length!==v.length||!m[k].every(txt):!txt(m[k]))return false;
 if(!m.history.every(e=>validEvent(t,e)))return false;let b=board(t);for(const e of m.history)b=apply(t,b,e).board;return same(b,m.board);}catch{return false;}
}
const qs=(t,m)=>(t.questions||[]).every((q,i)=>q.options?String(m.answers[i])===String(q.value):near(m.answers[i],Number(q.value)));
export function inspect(t,m){
 const b=m.board;let ok=false,hint='先把图上的东西操作好，再留下结果。';
 if(t.type==='x-m28-compare'){
  const aligned=t.mode==='indirect'||b.offset===0,ordered=b.order.length===t.items.length&&b.order.every((n,i)=>!i||t.items[b.order[i-1]].length<=t.items[n].length);
  ok=aligned&&(t.mode==='order'?ordered:b.choice===t.want)&&(t.mode!=='indirect'||b.copied.length===t.items.length);hint=t.mode==='indirect'?'分别把长度记到同一根纸条上，再比较。':'先让起点对齐，再比较另一端；排序时从最短的开始。';
 }
 if(t.type==='x-m28-units'){ok=cover(t,b.positions).every(n=>n===1)&&!!b.saved&&m.measure===b.saved.measure&&m.unit===b.saved.unit&&near(m.measure,t.length/t.size)&&m.unit===t.unit;hint='让同样大小的单位从头到尾挨着，不留空隙也不重叠，再记录数量和单位。';}
 if(t.type==='x-m28-refine'){ok=t.sizes.every(s=>b.runs.some(r=>r.size===s.size&&r.count===Math.floor(t.total/s.size)&&r.remainder===t.total%s.size))&&near(m.measure,b.count);hint='用每种单位分别放满能放下的完整块；小块能让剩下的部分更少。';}
 if(t.type==='x-m28-ruler'){ok=b.offset===0&&(!t.tool||b.tool===t.tool)&&(!t.estimate||b.prediction!==null&&near(m.error,Math.abs(number(b.prediction)-t.value)))&&!!b.saved&&m.measure===b.saved.measure&&m.unit===b.saved.unit&&near(m.measure,t.value)&&m.unit===t.unit;hint='先对齐零刻度，再从起点读到终点，写出数字和单位；估计后再比较相差多少。';}
 if(t.type==='x-m28-balance'){ok=t.mode==='compare'?b.tested&&b.choice===t.want:b.tested&&b.weights.reduce((a,x)=>a+x,0)===t.mass&&!!b.saved&&m.measure===b.saved.measure&&m.unit===b.saved.unit&&near(m.measure,t.mass)&&m.unit===t.unit;hint=t.mode==='compare'?'先放上天平，较低的一边更重；一样平表示一样重。':'让两边平衡，把右边的砝码加起来，再写数字和单位。';}
 if(t.type==='x-m28-scale'){ok=!!b.saved&&m.measure===b.saved.measure&&m.unit===b.saved.unit&&near(m.measure,t.value)&&m.unit===t.unit;hint='先看相邻数字差多少，再看指针或液面在中间的什么位置。';}
 if(t.type==='x-m28-convert'){ok=!!b.saved&&same(m.values,b.saved)&&t.rows.every((r,i)=>near(m.values[i],r.expected));hint='把下面的数量调到和上面一样长；单位换了，表示的量没有变。';}
 if(t.type==='x-m28-vessels'){const full=b.seen.length===t.capacities.length,ordered=b.order.length===t.capacities.length&&b.order.every((n,i)=>!i||t.capacities[b.order[i-1]]<=t.capacities[n]);ok=full&&(t.mode==='precision'?b.unit===t.requiredUnit:ordered);hint=t.mode==='precision'?'换成能装得下的小单位，装满后记录。':'先量完每个容器，再从能装得最少的开始排列。';}
 if(t.type==='x-m28-plot'){ok=b.records.every(x=>x!==null)&&same(b.marks,frequencies(t));hint='先逐个用同一把尺量，再把每条记录放到相应刻度，一条记录放一个点。';}
 ok=!!ok&&qs(t,m);return{correct:ok,feedback:ok?'这次操作和记录对应上了。':hint,evidence:{kind:'B28 bounded measurement investigation',board:cp(b),history:cp(m.history),prose:m.prose,freeTextMeaningAssessed:false,physicalMeasurementAssessed:false,generalMasteryAssessed:false}};
}
export function solveSteps(t){
 const out=[],a=(name,index)=>out.push({action:'m28-'+name,data:index===undefined?{}:{index}}),f=(field,value)=>out.push({field,value:String(value)});
 if(t.type==='x-m28-compare'){if(t.mode!=='indirect')f('offset',0);if(t.mode==='indirect')t.items.forEach((_,i)=>a('copy',i));if(t.mode==='order')t.items.map((x,i)=>[x.length,i]).sort((x,y)=>x[0]-y[0]).forEach(x=>a('order',x[1]));else a('choice',t.want);}
 if(t.type==='x-m28-units'){for(let i=0;i<t.length;i+=t.size)a('place',i);f('measure',t.length/t.size);f('unit',t.unit);a('record');}
 if(t.type==='x-m28-refine'){for(const u of t.sizes){a('size',u.size);for(let i=0;i<Math.floor(t.total/u.size);i++)a('add');f('measure',Math.floor(t.total/u.size));a('record');}}
 if(t.type==='x-m28-ruler'){if(t.tool)a('tool',t.tool);if(t.estimate){f('estimate',t.estimateExample??t.value);a('predict');f('error',Math.abs((t.estimateExample??t.value)-t.value));}f('offset',0);f('measure',t.value);f('unit',t.unit);a('record');}
 if(t.type==='x-m28-balance'){if(t.mode==='compare'){a('test');a('choice',t.want);}else{for(const x of t.exampleWeights)a('weight',x);f('measure',t.mass);f('unit',t.unit);a('record');}}
 if(t.type==='x-m28-scale'){f('measure',t.value);f('unit',t.unit);a('record');}
 if(t.type==='x-m28-convert'){t.rows.forEach((r,i)=>f('values.'+i,r.expected));a('convert');}
 if(t.type==='x-m28-vessels'){for(let i=0;i<t.capacities.length;i++){a('select',i);const u=t.units.find(u=>u.id===(t.requiredUnit||t.units[0].id));a('vunit',u.id);for(let j=0;j<t.capacities[i]/u.amount;j++)a('pour');a('seen');}if(t.mode!=='precision')t.capacities.map((x,i)=>[x,i]).sort((a,b)=>a[0]-b[0]).forEach(x=>a('order',x[1]));}
 if(t.type==='x-m28-plot'){measured(t).forEach((v,i)=>{a('select',i);f('measure',v/t.den);a('record');});measured(t).forEach(v=>a('mark',v-t.start));}
 (t.questions||[]).forEach((q,i)=>f('answers.'+i,q.value));return out;
}
export function example(t){const m=initial(t,314159);for(const s of solveSteps(t))if(s.field){const [k,i]=s.field.split('.');if(i!==undefined)m[k][+i]=s.value;else m[k]=s.value;field(t,m,s.field);}else act(t,m,s.action,s.data);return m;}
