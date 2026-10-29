import{units}from'./b07.js';
export const TYPES=new Set(['x-pvbench','x-pvshift','x-pvcompare','x-pvline','x-pvorder','x-pvestimate','x-pvpair']);
export const total=u=>u[0]*100+u[1]*10+u[2]+u[3]*1000;
const int=(v,a=0,b=1000)=>Number.isInteger(v)&&v>=a&&v<=b,nullable=v=>v===null||int(v),eq=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const goodUnits=u=>Array.isArray(u)&&u.length===4&&u.every(v=>int(v))&&u[0]<=10&&u[1]<=100&&u[2]<=100&&u[3]<=1&&total(u)<=1000;
const nums=(a,n)=>Array.isArray(a)&&a.length===n&&a.every(nullable),text=s=>typeof s==='string'&&s.length<=2000;
const unique=(a,n)=>Array.isArray(a)&&a.length<=n&&new Set(a).size===a.length&&a.every(v=>int(v,0,n-1));
const swaps=['up1','down1','up10','down10','up100','down100'];
export function chinese(n){const d='零一二三四五六七八九';if(n===1000)return'一千';if(n<10)return d[n];if(n<100)return(n<20?'':d[Math.floor(n/10)])+'十'+(n%10?d[n%10]:'');return d[Math.floor(n/100)]+'百'+(n%100?(n%100<10?'零'+d[n%10]:n%100<20?'一'+chinese(n%100):chinese(n%100)):'');}
const canonical=n=>n===1000?[0,0,0,1]:units(n);
export const changed=t=>{const a=String(t.start).padStart(3,'0'),b=String(t.start+t.delta).padStart(3,'0');return['h','t','o'].filter((x,i)=>a[i]!==b[i]).join('');};
export function initial(t){switch(t.type){
 case'x-pvbench':return{u:[...(t.start||[0,0,0,0])],history:[],saved:[],form:t.forms?.[0]||'blocks',answer:null,parts:[null,null,null],words:(t.words||[]).map(()=>''),mark:0,touched:false,cell:null,packs:null,remainder:null,why:''};
 case'x-pvshift':return{u:canonical(t.start),guess:null,committed:null,moves:[],history:[],answer:null,changed:''};
 case'x-pvcompare':return{a:[0,0,0,0],b:[0,0,0,0],relation:'',first:''};
 case'x-pvline':return{mark:0,touched:false,estimate:null,left:null,right:null};
 case'x-pvorder':return{order:[],positions:t.values.map(()=>0),touched:t.values.map(()=>false)};
 case'x-pvestimate':return{guess:null,committed:null,taps:[],answer:null};
 case'x-pvpair':return{selected:null,pairs:[],pairsCount:null,leftover:null,kind:'',a:null,b:null,counts:Array.from({length:Math.floor(t.n/2)},()=>null)};
}}
export function valid(t,m){if(!m||!TYPES.has(t.type))return false;switch(t.type){
 case'x-pvbench':return goodUnits(m.u)&&Array.isArray(m.history)&&m.history.length<=200&&m.history.every(x=>swaps.includes(x))&&Array.isArray(m.saved)&&m.saved.length<=20&&m.saved.every(s=>goodUnits(s.u)&&['blocks','sticks'].includes(s.form))&&['blocks','sticks'].includes(m.form)&&nullable(m.answer)&&nums(m.parts,3)&&Array.isArray(m.words)&&m.words.length===(t.words||[]).length&&m.words.every(text)&&int(m.mark)&&typeof m.touched==='boolean'&&nullable(m.cell)&&nullable(m.packs)&&nullable(m.remainder)&&text(m.why)&&(!t.fixed||total(m.u)===t.n)&&m.saved.every(s=>!t.fixed||total(s.u)===t.n);
 case'x-pvshift':return goodUnits(m.u)&&nullable(m.guess)&&nullable(m.committed)&&nullable(m.answer)&&text(m.changed)&&Array.isArray(m.moves)&&m.moves.length<=100&&m.moves.every(v=>[-100,-10,10,100].includes(v))&&Array.isArray(m.history)&&m.history.length<=200&&m.history.every(x=>swaps.includes(x))&&total(m.u)===t.start+m.moves.reduce((a,b)=>a+b,0);
 case'x-pvcompare':return goodUnits(m.a)&&goodUnits(m.b)&&text(m.relation)&&text(m.first);
 case'x-pvline':return int(m.mark,0,t.max)&&typeof m.touched==='boolean'&&nullable(m.estimate)&&nullable(m.left)&&nullable(m.right);
 case'x-pvorder':return unique(m.order,t.values.length)&&nums(m.positions,t.values.length)&&m.positions.every(v=>v!==null&&v<=t.max)&&Array.isArray(m.touched)&&m.touched.length===t.values.length&&m.touched.every(v=>typeof v==='boolean');
 case'x-pvestimate':return nullable(m.guess)&&nullable(m.committed)&&unique(m.taps,t.n)&&nullable(m.answer);
 case'x-pvpair':return (m.selected===null||int(m.selected,0,t.n-1))&&Array.isArray(m.pairs)&&m.pairs.length<=Math.floor(t.n/2)&&m.pairs.every(p=>Array.isArray(p)&&p.length===2)&&unique(m.pairs.flat(),t.n)&&nullable(m.pairsCount)&&nullable(m.leftover)&&text(m.kind)&&nullable(m.a)&&nullable(m.b)&&nums(m.counts,Math.floor(t.n/2));
}return false;}
function sequenceHas(list,required){let i=0;for(const x of list)if(x===required[i])i++;return i===required.length;}
export function inspect(t,m){let correct=false,feedback='再看看每一部分和记录是否对应。';if(!valid(t,m))return{correct:false,feedback:'这份记录不完整，请重新试一试。'};
 switch(t.type){
 case'x-pvbench':{
  const value=total(m.u),states=m.saved.filter(s=>total(s.u)===t.n),different=new Set(states.map(s=>s.u.join(',')));
  correct=value===t.n&&m.answer===t.n&&(!t.end||eq(m.u,t.end))&&(!t.exchanges||sequenceHas(m.history,t.exchanges))&&(!t.saveCount||different.size>=t.saveCount)&&(!t.forms||t.forms.every((f,i)=>states.some(s=>s.form===f&&(!i&&t.firstEnd?eq(s.u,t.firstEnd):true))))&&(!t.expanded||eq(m.parts,[Math.floor(t.n/100)*100,Math.floor(t.n/10)%10*10,t.n%10]))&&(!t.words||t.words.every((n,i)=>m.words[i].replace(/\s/g,'')===chinese(n)))&&(!t.position||(m.touched&&m.mark===t.n))&&(!t.chart||m.cell===t.n)&&(!t.packReport||(m.packs===Math.floor(t.n/10)&&m.remainder===t.n%10))&&(!t.why||m.why===t.why);
  feedback=value!==t.n?'搭出来的数量还不对应。每条是十颗，每板是十条。':t.exchanges&&!sequenceHas(m.history,t.exchanges)?'总量对了。还要亲自合起、拆开，把要求的换装过程试出来。':t.saveCount&&different.size<t.saveCount?'每种不同装法都留下来；同样的装法重复保存只算一种。':t.forms&&!t.forms.every(f=>states.some(s=>s.form===f))?'换一种画法后重新搭，把两种表示分别留下。':'检查总数、空位和每部分的值。交换不会凭空多出物品。';break;}
 case'x-pvshift':{const end=t.start+t.delta,move=Math.sign(t.delta)*(Math.abs(t.delta)>=100?100:10);correct=m.committed!==null&&m.moves.length>0&&m.moves.reduce((s,x)=>s+x,0)===t.delta&&eq(m.u,canonical(end))&&m.answer===end&&m.changed===changed(t);feedback=m.committed===null?'先留下猜想，再动手改变数量。':total(m.u)!==end?'看看该添或拿走几条、几板。没有可拿的条时，先拆一板。':!eq(m.u,canonical(end))?'总量已经到了。把能合成的十条或十颗合起来，再对应数字。':'把实际总数与发生变化的位置记下来；跨过整百时不一定只变一位。';break;}
 case'x-pvcompare':{const a=canonical(t.a),b=canonical(t.b),first=['h','t','o'].find((x,i)=>a[i]!==b[i])||'same';correct=total(m.a)===t.a&&total(m.b)===t.b&&m.relation===(t.a===t.b?'=':t.a<t.b?'<':'>')&&m.first===first;feedback='两堆都要搭对。从百、十到一，相同才往后比，找到第一次不同的位置。';break;}
 case'x-pvline':correct=(t.readPoint?m.estimate!==null&&Math.abs(m.estimate-t.n)<=t.tolerance:m.touched&&Math.abs(m.mark-t.n)<=(t.tolerance||0))&&(!t.bounds||(m.mark>=t.bounds[0]&&m.mark<=t.bounds[1]))&&(!t.near||(m.left===t.near[0]&&m.right===t.near[1]));feedback='用两边标好的数作参照，看看点在它们之间的哪个位置。估计允许小范围差别。';break;
 case'x-pvorder':correct=m.order.length===t.values.length&&m.order.every((x,i)=>i===0||t.values[m.order[i-1]]<=t.values[x])&&m.positions.every((x,i)=>m.touched[i]&&x===t.values[i]);feedback='先按数量排队；数轴上的位置也要表达这张卡的数量。';break;
 case'x-pvestimate':correct=m.committed!==null&&m.taps.length===t.n&&m.answer===t.n;feedback='先保留估计，再逐颗标记核对；估得不准也可以完成这次检查。';break;
 case'x-pvpair':correct=m.pairs.length===Math.floor(t.n/2)&&m.pairsCount===Math.floor(t.n/2)&&m.leftover===t.n%2&&m.kind===(t.n%2?'odd':'even')&&(!t.equation||(m.a===t.n/2&&m.b===t.n/2&&m.counts.every((v,i)=>v===2*(i+1))));feedback='每颗只能配一次；配成几对、剩几颗，都要与记录相同。两组相加时，两边应一样多。';break;
 }return{correct,feedback:correct?'这次的操作和记录对上了。也可以说说你为什么这样做。':feedback};
}
export function swap(u,kind){const map={up1:[2,1,10,1],down1:[1,2,1,10],up10:[1,0,10,1],down10:[0,1,1,10],up100:[0,3,10,1],down100:[3,0,1,10]},s=map[kind];if(!s||u[s[0]]<s[2])return false;const v=[...u];v[s[0]]-=s[2];v[s[1]]+=s[3];if(!goodUnits(v))return false;u.splice(0,4,...v);return true;}
export function act(t,m,a,d={}){const i=Number(d.index),delta=Number(d.delta);
 if(a==='pv-add'&&!t.fixed&&['x-pvbench','x-pvcompare'].includes(t.type)&&int(i,0,3)&&[-1,1].includes(delta)){const u=t.type==='x-pvcompare'?m[d.side]:m.u;if(!u)return;const v=[...u];v[i]+=delta;if(goodUnits(v))u.splice(0,4,...v);}
 if(a==='pv-swap'&&m.u&&m.history.length<200&&swap(m.u,d.kind))m.history.push(d.kind);
 if(a==='pv-save'&&m.saved.length<20&&!m.saved.some(s=>s.form===m.form&&eq(s.u,m.u)))m.saved.push({u:[...m.u],form:m.form});
 if(a==='pv-form'&&t.forms?.includes(d.form)&&d.form!==m.form){m.form=d.form;m.u=[0,0,0,0];}
 if(a==='pv-cell'&&int(i,1,t.chart))m.cell=i;
 if(a==='pv-predict'&&m.committed===null&&nullable(m.guess)&&m.guess!==null)m.committed=m.guess;
 if(a==='pv-move'&&m.committed!==null&&m.moves.length<100&&[-100,-10,10,100].includes(delta)){const k=Math.abs(delta)===100?0:1,v=[...m.u];v[k]+=Math.sign(delta);if(goodUnits(v)){m.u=v;m.moves.push(delta);}}
 if(a==='pv-order'&&int(i,0,t.values.length-1)){const pos=m.order.indexOf(i);if(pos<0)m.order.push(i);else m.order.splice(pos,1);}
 if(a==='pv-tap'&&t.type==='x-pvestimate'&&m.committed!==null&&int(i,0,t.n-1)){const j=m.taps.indexOf(i);if(j<0)m.taps.push(i);else m.taps.splice(j,1);}
 if(a==='pv-pair'&&t.type==='x-pvpair'&&int(i,0,t.n-1)&&!m.pairs.flat().includes(i)){if(m.selected===i)m.selected=null;else if(m.selected===null)m.selected=i;else{m.pairs.push([m.selected,i]);m.selected=null;}}
 if(a==='pv-unpair'&&int(i,0,m.pairs.length-1))m.pairs.splice(i,1);
}
export function field(t,m,key){if(key==='mark')m.touched=true;if(t.type==='x-pvorder'&&key.startsWith('positions.'))m.touched[Number(key.split('.')[1])]=true;}
export function example(t){const m=initial(t);switch(t.type){
 case'x-pvbench':m.u=t.end?[...t.end]:canonical(t.n);m.history=[...(t.exchanges||[])];m.answer=t.n;m.parts=[Math.floor(t.n/100)*100,Math.floor(t.n/10)%10*10,t.n%10];m.words=(t.words||[]).map(chinese);m.mark=t.n;m.touched=true;m.cell=t.chart?t.n:null;m.packs=Math.floor(t.n/10);m.remainder=t.n%10;m.why=t.why||'';
  if(t.forms)m.saved=t.forms.map((f,i)=>({form:f,u:!i&&t.firstEnd?[...t.firstEnd]:canonical(t.n)}));
  if(t.saveCount){const u=[...(t.start||canonical(t.n))];m.saved=[{u:[...u],form:m.form}];for(let j=1;j<t.saveCount;j++){if(!swap(u,'down1'))swap(u,'down10');m.saved.push({u:[...u],form:m.form});}if(!t.end)m.u=[...u];}break;
 case'x-pvshift':m.u=canonical(t.start+t.delta);m.guess=t.start+t.delta;m.committed=m.guess;m.answer=m.guess;m.changed=changed(t);m.moves=Array.from({length:Math.abs(t.delta)/(Math.abs(t.delta)>=100?100:10)},()=>Math.sign(t.delta)*(Math.abs(t.delta)>=100?100:10));break;
 case'x-pvcompare':m.a=canonical(t.a);m.b=canonical(t.b);m.relation=t.a===t.b?'=':t.a<t.b?'<':'>';m.first=['h','t','o'].find((x,i)=>m.a[i]!==m.b[i])||'same';break;
 case'x-pvline':m.mark=t.n;m.touched=true;m.estimate=t.n;if(t.near)[m.left,m.right]=t.near;break;
 case'x-pvorder':m.order=t.values.map((_,i)=>i).sort((a,b)=>t.values[a]-t.values[b]);m.positions=[...t.values];m.touched=t.values.map(()=>true);break;
 case'x-pvestimate':m.guess=t.n-3;m.committed=m.guess;m.taps=Array.from({length:t.n},(_,i)=>i);m.answer=t.n;break;
 case'x-pvpair':m.pairs=Array.from({length:Math.floor(t.n/2)},(_,i)=>[2*i,2*i+1]);m.pairsCount=Math.floor(t.n/2);m.leftover=t.n%2;m.kind=t.n%2?'odd':'even';if(t.equation){m.a=t.n/2;m.b=t.n/2;m.counts=m.counts.map((_,i)=>(i+1)*2);}break;
}return m;}
