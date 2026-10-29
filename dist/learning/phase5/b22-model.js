import{number}from'./b20-model.js';
import{randoms,tally}from'../phase4/b04-model.js';
export{number};
export const TYPES=new Set(['x-p22-pick','x-p22-order','x-p22-experiment','x-p22-mapping','x-p22-table','x-p22-draw','x-p22-grid','x-p22-venn','x-p22-branch','x-p22-sort']);
const cp=x=>structuredClone(x),same=(a,b)=>JSON.stringify(a)===JSON.stringify(b),txt=x=>typeof x==='string'&&x.length<=1500,int=(x,a,z)=>Number.isInteger(x)&&x>=a&&x<=z,near=(a,b)=>Number.isFinite(number(a))&&Number.isFinite(b)&&Math.abs(number(a)-b)<1e-7,seed=()=>globalThis.crypto.getRandomValues(new Uint32Array(1))[0]||1,arrEqual=(a,b)=>same([...a].sort((x,y)=>x-y),[...b].sort((x,y)=>x-y));
const scalars=['guess','rate','expected','prob','kind','choice','first','second','region','value','event','item','prose'];
export const fields=t=>({...Object.fromEntries(scalars.map(k=>[k,''])),answers:Array(t.questions?.length||0).fill(''),values:Array(t.type==='x-p22-table'?t.labels.length:t.type==='x-p22-venn'&&t.mode==='counts'?4:0).fill('')});
const masks={both:[1],either:[0,1,2],notA:[2,3]};
export const branchValues=(t,i)=>{const first=i<2?0:1,second=i%2,total=t.counts[0]+t.counts[1],n=t.counts[second]-(t.replace?0:first===second?1:0);return[t.counts[first]/total,n/(total-(t.replace?0:1))];};
function board(t,s){const b={first:{},cursor:0};switch(t.type){
case'x-p22-pick':return{...b,selected:[]};
case'x-p22-order':return{...b,order:[],started:false,drawA:null,drawB:null};
case'x-p22-experiment':return{...b,started:false,draws:[],checkpoints:[]};
case'x-p22-mapping':return{...b,selected:[],random:s,runs:[],pending:[]};
case'x-p22-table':return{...b,built:null};
case'x-p22-draw':return{...b,firstColor:null,observed:[]};
case'x-p22-grid':return{...b,rows:[],selected:[]};
case'x-p22-venn':return{...b,assigned:t.mode==='items'?t.items.map(()=>null):[],built:t.mode==='shade'?cp(t.counts):null,event:'',selected:[],shades:{}};
case'x-p22-branch':return{...b,paths:[]};
case'x-p22-sort':return{...b,placed:t.items.map(()=>null)};
}}
export const initial=(t,s=seed())=>({...fields(t),seed:s,board:board(t,s),history:[],issue:''});
const af={reset:[],toggle:[],group:[],put:[],undo:[],start:['guess'],sample:[],run:[],build:['values'],choose:['first'],observe:['choice'],row:[],place:['item','region'],activate:['event'],shade:[],save:['event'],branch:['first','second'],classify:['choice']};
const payloadValid=(t,e)=>e.f&&af[e.a]&&Object.keys(e.f).length===af[e.a].length&&af[e.a].every(k=>Array.isArray(fields(t)[k])?Array.isArray(e.f[k])&&e.f[k].length===fields(t)[k].length&&e.f[k].every(txt):txt(e.f[k]));
const validEvent=(t,e)=>e&&payloadValid(t,e)&&e.d&&Object.entries(e.d).every(([k,v])=>k==='index'&&txt(v));
const first=(b,a,f)=>{b.first[a+'-'+b.cursor]??=cp(f);},nextSeed=x=>{x^=x<<13;x^=x>>>17;x^=x<<5;return x>>>0;};
const flip=(a,n)=>{const i=a.indexOf(n);if(i<0)a.push(n);else a.splice(i,1);};
function apply(t,b,e,s){const{a,f,d}=e,i=number(d.index);let issue='';const fail=x=>issue=x;first(b,a,f);
 if(a==='reset'){const fresh=board(t,s);fresh.first=cp(b.first);return{board:fresh,issue};}
 if(t.type==='x-p22-pick'){
  if(a==='toggle'&&int(i,0,t.items.length-1))flip(b.selected,i);
  if(a==='group'&&t.groupAction){const xs=t.items.flatMap((v,j)=>v.group===t.groupAction?[j]:[]);b.selected=arrEqual(b.selected,xs)?[]:xs;}
 }
 if(t.type==='x-p22-order'){
  if(a==='put'&&int(i,0,t.cards.length-1)&&!b.order.includes(i))b.order.push(i);if(a==='undo')b.order.pop();
  if(a==='start'&&['a','b','same','unknown'].includes(f.guess))b.started=true;
  if(a==='sample'&&t.sampleBags&&b.started&&int(i,0,1)&&!b[i===0?'drawA':'drawB']){const n=((s+Math.imul(i+1,2654435761))>>>0)||1;b[i===0?'drawA':'drawB']=randoms(n,50,t.sampleBags[i]);}
 }
 if(t.type==='x-p22-experiment'){
  if(a==='start'&&['more','less','equal','unknown'].includes(f.guess))b.started=true;
  if(a==='run'&&b.started&&b.checkpoints.length<t.targets.length){const n=t.targets[b.checkpoints.length];b.draws=randoms(s,n,t.weights);b.checkpoints.push(n);}
 }
 if(t.type==='x-p22-mapping'){
  if(a==='toggle'&&int(i,0,9))flip(b.selected,i);
  if(a==='run'&&arrEqual(b.selected,[0,1,2,3])&&b.runs.length<t.targetRuns){let done=0;while(done<10&&b.runs.length<t.targetRuns){let found=false;for(let count=0;count<1000;count++){b.random=nextSeed(b.random);const digit=Math.floor(b.random/4294967296*10);b.pending.push(digit);if(digit<4){found=true;break;}}if(!found){fail('这一次还没有出现A，先保留已经读到的数字，再继续。');break;}b.runs.push(b.pending);b.pending=[];done++;}}
  else if(a==='run'&&!arrEqual(b.selected,[0,1,2,3]))fail('先让0、1、2、3这四个数字代表A，其他六个代表非A。');
 }
 if(t.type==='x-p22-table'&&a==='build')b.built=f.values.map(v=>Number.isFinite(number(v))?number(v):null);
 if(t.type==='x-p22-draw'){
  if(a==='choose'&&['red','blue'].includes(f.first))b.firstColor=f.first;
  if(a==='observe'&&b.firstColor&&['return','keep'].includes(f.choice)){const x={first:b.firstColor,mode:f.choice,red:3-(f.choice==='keep'&&b.firstColor==='red'?1:0),blue:2-(f.choice==='keep'&&b.firstColor==='blue'?1:0)};const n=b.observed.findIndex(v=>v.first===x.first&&v.mode===x.mode);if(n<0)b.observed.push(x);else b.observed[n]=x;}
 }
 if(t.type==='x-p22-grid'){
  if(a==='row'&&int(i,0,t.rows.length-1)&&!b.rows.includes(i))b.rows.push(i);
  if(a==='toggle'&&int(i,0,t.rows.length*t.cols.length-1)&&b.rows.includes(Math.floor(i/t.cols.length)))flip(b.selected,i);
 }
 if(t.type==='x-p22-venn'){
  if(a==='place'&&t.mode==='items'){const n=number(f.item),r=number(f.region);if(int(n,0,t.items.length-1)&&int(r,0,3))b.assigned[n]=r;else fail('先选一张卡，再选它应该去的区域。');}
  if(a==='build'&&t.mode==='counts')b.built=f.values.map(v=>Number.isFinite(number(v))?number(v):null);
  if(a==='activate'&&t.events.includes(f.event)){b.event=f.event;b.selected=cp(b.shades[f.event]||[]);}
  if(a==='shade'&&b.event&&int(i,0,3))flip(b.selected,i);
  if(a==='save'&&b.event&&b.event===f.event)b.shades[b.event]=cp(b.selected);else if(a==='save'&&b.event&&b.event!==f.event)fail('先开始标新的那句话，再留下这一种涂法。');
 }
 if(t.type==='x-p22-branch'&&a==='branch'&&int(i,0,3)){const v=branchValues(t,i);if(near(f.first,v[0])&&near(f.second,v[1])){const p={index:i,first:f.first,second:f.second};const j=b.paths.findIndex(x=>x.index===i);if(j<0)b.paths.push(p);else b.paths[j]=p;}else fail('先看第一次从5颗里拿什么，再看第二次还剩多少颗。每条路上的两个机会要分别对应。');}
 if(t.type==='x-p22-sort'&&a==='classify'&&b.cursor<t.items.length){b.placed[b.cursor]=f.choice;if(f.choice===t.items[b.cursor][1])b.cursor++;else fail('看前一次是否改变了下一次的条件；随机结果不同本身不代表机会改变。');}
 return{board:b,issue};
}
export function act(t,m,action,data={}){const a=action.replace(/^p22-/,''),f=Object.fromEntries((af[a]||[]).map(k=>[k,cp(m[k])])),d=Object.fromEntries(Object.entries(data).filter(([k])=>k==='index').map(([k,v])=>[k,String(v)])),e={a,f,d};if(!validEvent(t,e)||m.history.length>=650)return m;const r=apply(t,cp(m.board),e,m.seed);m.board=r.board;m.issue=r.issue;m.history.push(e);return m;}
export function field(t,m,k){const root=k.split('.')[0];if(root in fields(t)&&!Array.isArray(m[root]))m[root]=String(m[root]??'');}
export function valid(t,m){try{if(!m||!int(m.seed,1,4294967295)||!txt(m.issue)||!Array.isArray(m.history)||m.history.length>650)return false;for(const[k,v]of Object.entries(fields(t)))if(Array.isArray(v)?!Array.isArray(m[k])||m[k].length!==v.length||!m[k].every(txt):!txt(m[k]))return false;if(!m.history.every(e=>validEvent(t,e)))return false;let b=board(t,m.seed);for(const e of m.history)b=apply(t,b,e,m.seed).board;return same(b,m.board);}catch{return false;}}
function qs(t,m){return(t.questions||[]).every((q,i)=>{const v=m.answers[i];if(q.kind==='set'){const parts=v.split(/[,，、\s]+/).filter(Boolean).map(number);return parts.length===new Set(parts).size&&arrEqual(parts,q.value);}return q.options?String(v)===String(q.value):near(v,number(q.value));});}
export const rate=(t,b)=>t.type==='x-p22-experiment'?b.draws.filter(x=>x===t.event).length/b.draws.length:b.runs.filter(a=>a.length>=4).length/b.runs.length;
export function inspect(t,m){const b=m.board;let ok=false,hint='先把记录、操作和结论一一对上。';
 if(t.type==='x-p22-pick'){ok=arrEqual(b.selected,t.winners)&&near(m.prob,t.winners.length/t.items.length)&&m.kind==='equal';hint='圈出所有符合的结果，一次也不重复；分母是整个等可能结果的数量。';}
 if(t.type==='x-p22-order'){ok=b.order.length===t.cards.length&&b.order.every((n,i)=>!i||t.cards[b.order[i-1]].p<=t.cards[n].p)&&(!t.sampleBags||b.started&&b.drawA&&b.drawB);hint='比较有利的数量占全部的几分之几。先排从小到大；偶然一次结果不改变袋里的比例。';}
 if(t.type==='x-p22-experiment'){ok=b.checkpoints.length===t.targets.length&&near(m.rate,rate(t,b))&&(!t.expected||near(m.expected,t.expected));hint='用这次真实出现的次数除以这次总次数；理论预期不是强制发生的实际次数。';}
 if(t.type==='x-p22-mapping'){ok=arrEqual(b.selected,[0,1,2,3])&&b.runs.length===t.targetRuns&&!b.pending.length&&near(m.rate,rate(t,b));hint='0—3共四个数字对应A。每次一直读到第一次A，至少四个数字表示前三次都不是A。';}
 if(t.type==='x-p22-table'){const sum=t.weights.reduce((a,n)=>a+n,0);ok=!!b.built&&b.built.every((v,i)=>v!==null&&near(v,t.weights[i]/sum)&&near(m.values[i],v));hint='按各份占整个的比例搭表；四舍五入不替代相同的分数，也不能仅让总和为1。';}
 if(t.type==='x-p22-draw'){ok=b.observed.some(x=>x.first==='red'&&x.mode==='return'&&x.red===3&&x.blue===2)&&b.observed.some(x=>x.first==='red'&&x.mode==='keep'&&x.red===2&&x.blue===2);hint='先选第一次为红；对照放回和不放回，数剩余红珠与总数。';}
 if(t.type==='x-p22-grid'){ok=b.rows.length===t.rows.length&&arrEqual(b.selected,t.winners)&&near(m.prob,t.winners.length/(t.rows.length*t.cols.length));hint='每一行搭全所有搭配，再圈出符合条件的格子；顺序不同的骰子结果分别算。';}
 if(t.type==='x-p22-venn'){ok=t.mode==='items'?same(b.assigned,t.destinations):t.mode==='counts'?!!b.built&&same(b.built,t.counts)&&b.built.every((n,i)=>near(m.values[i],n)):t.events.every(e=>b.shades[e]&&arrEqual(b.shades[e],masks[e]))&&(!b.event||arrEqual(b.selected,b.shades[b.event]||[]));hint='重叠部分只放一次；两边都没有的也属于整个人群。涂区域时按当前说法留下对应区域。';}
 if(t.type==='x-p22-branch'){const z=branchValues(t,t.target);ok=b.paths.length===4&&[0,1,2,3].every(i=>b.paths.some(p=>p.index===i))&&near(m.prob,z[0]*z[1]);hint='先把四条有顺序的路径搭齐；同一路径两次机会相乘，不放回时第二次用剩余的数量。';}
 if(t.type==='x-p22-sort'){ok=b.cursor===t.items.length&&b.placed.every((v,i)=>v===t.items[i][1]);hint='判断前一次是否改变下一次的条件；不把“结果不一样”误当作“机会改变”。';}
 ok=!!ok&&qs(t,m);return{correct:ok,feedback:ok?(t.type==='x-p22-experiment'||t.type==='x-p22-mapping'||t.sampleBags?'这次操作和记录对上了。下次模拟可能不同。':'这次操作和记录对上了。'):hint,evidence:{kind:'B22 bounded probability construction',board:cp(b),history:cp(m.history),seed:m.seed,fields:Object.fromEntries(Object.keys(fields(t)).map(k=>[k,cp(m[k])])),freeTextMeaningAssessed:false,realExperimentAssessed:false,generalMasteryAssessed:false}};
}
export function solveSteps(t,s=314159){const m=initial(t,s),steps=[],f=(k,v)=>{if(v==='')return;const a=String(v);steps.push({field:k,value:a});const p=k.split('.');if(p.length===2)m[p[0]][+p[1]]=a;else m[k]=a;field(t,m,k);},a=(action,data={})=>{steps.push({action:'p22-'+action,data});act(t,m,'p22-'+action,data);};
 if(t.type==='x-p22-pick'){if(t.groupAction&&arrEqual(t.winners,t.items.flatMap((x,i)=>x.group===t.groupAction?[i]:[])))a('group');else t.winners.forEach(index=>a('toggle',{index}));f('kind','equal');f('prob',t.winners.length+'/'+t.items.length);}
 if(t.type==='x-p22-order'){if(t.sampleBags){f('guess','unknown');a('start');a('sample',{index:0});a('sample',{index:1});}t.cards.map((c,i)=>[c.p,i]).sort((a,b)=>a[0]-b[0]).forEach(([,index])=>a('put',{index}));}
 if(t.type==='x-p22-experiment'){f('guess','unknown');a('start');t.targets.forEach(()=>a('run'));f('rate',m.board.draws.filter(x=>x===t.event).length+'/'+m.board.draws.length);if(t.expected)f('expected',t.expected);}
 if(t.type==='x-p22-mapping'){[0,1,2,3].forEach(index=>a('toggle',{index}));while(m.board.runs.length<t.targetRuns)a('run');f('rate',m.board.runs.filter(x=>x.length>=4).length+'/'+m.board.runs.length);}
 if(t.type==='x-p22-table'){const sum=t.weights.reduce((a,n)=>a+n,0);t.weights.forEach((n,i)=>f('values.'+i,n+'/'+sum));a('build');}
 if(t.type==='x-p22-draw'){f('first','red');a('choose');f('choice','return');a('observe');f('choice','keep');a('observe');}
 if(t.type==='x-p22-grid'){t.rows.forEach((_,index)=>a('row',{index}));t.winners.forEach(index=>a('toggle',{index}));f('prob',t.winners.length+'/'+(t.rows.length*t.cols.length));}
 if(t.type==='x-p22-venn'){if(t.mode==='items')t.destinations.forEach((region,i)=>{f('item',i);f('region',region);a('place');});if(t.mode==='counts'){t.counts.forEach((v,i)=>f('values.'+i,v));a('build');}if(t.mode==='shade')for(const e of t.events){f('event',e);a('activate');masks[e].forEach(index=>a('shade',{index}));a('save');}}
 if(t.type==='x-p22-branch'){for(let i=0;i<4;i++){const x=branchValues(t,i);f('first',x[0]);f('second',x[1]);a('branch',{index:i});}const x=branchValues(t,t.target);f('prob',x[0]*x[1]);}
 if(t.type==='x-p22-sort')t.items.forEach(([,v])=>{f('choice',v);a('classify');});
 (t.questions||[]).forEach((q,i)=>f('answers.'+i,q.kind==='set'?q.value.join(','):q.value));return steps;
}
export function example(t){const s=314159,m=initial(t,s);for(const v of solveSteps(t,s))if(v.field){const p=v.field.split('.');if(p.length===2)m[p[0]][+p[1]]=v.value;else m[v.field]=v.value;field(t,m,v.field);}else act(t,m,v.action,v.data);return m;}
