// B11 arithmetic is stored in integer smallest units; display never drives math.
export const TYPES=new Set(['x-placecalc','x-routecalc','x-groupfour','x-storyledger','x-estimatecheck']);
const int=(n,min=0,max=1000000000)=>Number.isSafeInteger(n)&&n>=min&&n<=max;
const str=x=>typeof x==='string'&&x.length<=2000;
const sum=a=>a.reduce((a,b)=>a+b,0);
const scale=t=>t.scale||1;
export const decimalPlaces=s=>[1,10,100,1000].includes(s)?Math.log10(s):null;
export const fmt=(n,s=1)=>{const p=decimalPlaces(s);if(p===null)throw new RangeError('Unsupported decimal scale');return p?(n/s).toFixed(p):String(n);};
export function number(s,unit=1){if(!str(s))return null;const p=decimalPlaces(unit);if(p===null)return null;const x=s.trim().replace(/[−–－]/g,'-').replace(/＋/g,'+');if(!/^[+-]?\d{1,10}(?:\.\d{1,6})?$/.test(x))return null;const negative=x[0]==='-',raw=x.replace(/^[+-]/,''),[whole,frac='']=raw.split('.');if(frac.slice(p)&&!/^0+$/.test(frac.slice(p)))return null;const n=Number(whole)*unit+Number(frac.slice(0,p).padEnd(p,'0'));return int(n)?(negative?-n:n):null;}
export const answer=t=>t.type==='x-placecalc'?(t.op==='+'?sum(t.values):t.values[0]-t.values[1]):t.a+(t.op==='+'?t.b:-t.b);
export const width=t=>Math.max(String(Math.max(...t.values,answer(t))).length+1,decimalPlaces(scale(t))+2);
export const digits=(n,w)=>Array.from({length:w},(_,i)=>Math.floor(n/10**i)%10);
export const rowLabel=(t,i)=>t.labels?.[i]&&(t.labels[i].split('.')[1]?.length||0)<=decimalPlaces(scale(t))&&number(t.labels[i],scale(t))===t.values[i]?t.labels[i]:fmt(t.values[i],scale(t));
export const rowOffset=(t,i)=>decimalPlaces(scale(t))-(rowLabel(t,i).split('.')[1]?.length||0);
export const lastWrittenColumn=t=>Math.max(String(Math.max(0,answer(t))).length-1,decimalPlaces(scale(t)));
export const writtenMatches=(t,m)=>!t.written||Array.isArray(m.columnAnswers)&&m.columnAnswers.length===width(t)&&m.columnAnswers.every((x,i)=>i>lastWrittenColumn(t)?x===''||x==='0':x===String(m.counts[i]));
export const total=cs=>sum(cs.map((c,i)=>c*10**i));
export const placeLabel=(t,i)=>{const names=['一','十','百','千','万','十万','百万','千万','亿','十亿','百亿'];const p=decimalPlaces(scale(t));return i<p?['','十分之一','百分之一','千分之一'][p-i]:names[i-p];};
export const origin=t=>t.countup?t.b:t.a;
export const destination=t=>t.countup?t.a:answer(t);
export const location=(t,m)=>m.hops.at(-1)?.to??origin(t);
export const round=(n,u)=>Math.floor((n+u/2)/u)*u;
export function estimateBounds(t,u){const a=round(t.a,u),b=round(t.b,u),loA=Math.max(0,a-u/2),hiA=a+u/2,loB=Math.max(0,b-u/2),hiB=b+u/2;return t.op==='+'?{low:loA+loB,high:hiA+hiB,lowerInclusive:true}:{low:loA-hiB,high:hiA-loB,lowerInclusive:false};}
export function plausible(t,u,n){const b=estimateBounds(t,u);return(b.lowerInclusive?n>=b.low:n>b.low)&&n<b.high;}
export function initial(t){const common={history:[],issue:''};switch(t.type){
 case'x-placecalc':return{...common,guess:'',first:null,align:t.values.map(()=>''),started:false,counts:digits(t.values[0],width(t)),remaining:digits(t.op==='-'?t.values[1]:0,width(t)),answer:'',...(t.written?{columnAnswers:Array(width(t)).fill('')}:{} )};
 case'x-routecalc':return{...common,guess:'',first:null,started:false,jump:'',landing:'',hops:[],answer:''};
 case'x-groupfour':return{...common,groups:t.values.map((value,i)=>({ids:[i],value})),selected:[],subtotal:'',merges:[]};
 case'x-storyledger':return{...common,cursor:0,saved:[],op:'',amount:'',result:'',method:'',first:[]};
 case'x-estimatecheck':return{...common,unit:'',roundedA:'',roundedB:'',estimate:'',first:null,locked:null,answer:'',inverseStart:'',inverseOp:'',inversePart:'',inverseResult:'',judgment:''};
}return null;}
const validHistory=h=>Array.isArray(h)&&h.length<=10000&&h.every(x=>x&&typeof x==='object'&&!Array.isArray(x));
const allstr=m=>Object.values(m).every(str);
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
function groupValid(t,g){return g&&Array.isArray(g.ids)&&g.ids.length>0&&new Set(g.ids).size===g.ids.length&&g.ids.every(i=>int(i,0,t.values.length-1))&&g.value===sum(g.ids.map(i=>t.values[i]));}
export function valid(t,m){try{if(!m||!validHistory(m.history)||!str(m.issue))return false;switch(t.type){
 case'x-placecalc':{const w=width(t);if(!str(m.guess)||!(m.first===null||str(m.first))||!Array.isArray(m.align)||m.align.length!==t.values.length||!m.align.every(x=>x===''||/^\d+$/.test(x)&&int(Number(x),0,w-1))||typeof m.started!=='boolean'||!str(m.answer)||![m.counts,m.remaining].every(a=>Array.isArray(a)&&a.length===w&&a.every(x=>int(x,0,100))))return false;
  if(m.columnAnswers!==undefined&&(!Array.isArray(m.columnAnswers)||m.columnAnswers.length!==w||!m.columnAnswers.every(x=>str(x)&&x.length<=1)))return false;
  const goal=digits(t.op==='-'?t.values[1]:0,w);if(!m.remaining.every((x,i)=>x<=goal[i]))return false;
  if(!m.started)return same(m.counts,digits(t.values[0],w))&&same(m.remaining,goal);
  return m.first!==null&&m.align.every((x,i)=>x===String(rowOffset(t,i)))&&total(m.counts)===(t.op==='+'?answer(t):t.values[0]-(t.values[1]-total(m.remaining)));}
 case'x-routecalc':{if(!str(m.guess)||!(m.first===null||str(m.first))||typeof m.started!=='boolean'||!str(m.jump)||!str(m.landing)||!str(m.answer)||!Array.isArray(m.hops)||m.hops.length>100)return false;let at=origin(t);for(const h of m.hops){if(!h||!int(h.delta,-1000000000)||h.delta===0||!int(h.to,-1000000000)||h.to!==at+h.delta)return false;at=h.to;}return m.started?m.first!==null:m.first===null&&m.hops.length===0;}
 case'x-groupfour':{if(!Array.isArray(m.groups)||m.groups.length<1||m.groups.length>t.values.length||!m.groups.every(g=>groupValid(t,g))||!Array.isArray(m.selected)||m.selected.length>2||new Set(m.selected).size!==m.selected.length||!m.selected.every(i=>int(i,0,m.groups.length-1))||!str(m.subtotal)||!Array.isArray(m.merges)||m.merges.length!==t.values.length-m.groups.length)return false;const ids=m.groups.flatMap(g=>g.ids);return ids.length===t.values.length&&new Set(ids).size===ids.length&&m.merges.every(x=>groupValid(t,x.left)&&groupValid(t,x.right)&&!x.left.ids.some(i=>x.right.ids.includes(i))&&number(x.answer)===x.left.value+x.right.value);}
 case'x-storyledger':{if(!int(m.cursor,0,t.steps.length)||!Array.isArray(m.saved)||m.saved.length!==m.cursor||!Array.isArray(m.first)||m.first.length>t.steps.length||!allstr({op:m.op,amount:m.amount,result:m.result,method:m.method}))return false;let at=t.start;for(let i=0;i<m.saved.length;i++){const r=m.saved[i],s=t.steps[i];if(!r||r.op!==s.op||number(r.amount,scale(t))!==s.amount||!['mental','written','tool'].includes(r.method)||number(r.result,scale(t))!==at+(s.op==='+'?s.amount:-s.amount))return false;at=number(r.result,scale(t));}return m.first.every(x=>x&&allstr(x));}
 case'x-estimatecheck':{if(!allstr({unit:m.unit,roundedA:m.roundedA,roundedB:m.roundedB,estimate:m.estimate,answer:m.answer,inverseStart:m.inverseStart,inverseOp:m.inverseOp,inversePart:m.inversePart,inverseResult:m.inverseResult,judgment:m.judgment})||!(m.first===null||m.first&&allstr(m.first)))return false;if(m.locked===null)return true;const l=m.locked,u=Number(l.unit);return allstr(l)&&t.units.includes(u)&&(!t.accuracy||u<=t.accuracy)&&number(l.roundedA,scale(t))===round(t.a,u)&&number(l.roundedB,scale(t))===round(t.b,u)&&number(l.estimate,scale(t))===round(t.a,u)+(t.op==='+'?round(t.b,u):-round(t.b,u))&&m.first!==null;}
}return false;}catch{return false;}}
const record=(m,e)=>m.history.push(structuredClone(e));
const fail=(m,s)=>{m.issue=s;};
export function act(t,m,action,d={}){m.issue='';const s=scale(t);switch(t.type){
 case'x-placecalc':{
  if(action==='b11-place-start'&&!m.started){if(number(m.guess,s)===null){fail(m,'先留下一个猜想，猜错也可以。');break;}m.first??=m.guess;record(m,{action,guess:m.guess,align:[...m.align]});if(!m.align.every((x,i)=>x===String(rowOffset(t,i)))){fail(m,'相同大小的单位要放在同一列。看一看每个数的最后一位。');break;}m.started=true;m.counts=t.op==='+'?Array.from({length:width(t)},(_,i)=>sum(t.values.map(n=>digits(n,width(t))[i]))):digits(t.values[0],width(t));}
  if(action==='b11-exchange'&&m.started){const i=Number(d.index);if(!int(i,0,width(t)-1))break;record(m,{action,index:i,dir:d.dir,before:[...m.counts]});if(d.dir==='up'&&i<width(t)-1&&m.counts[i]>=10&&m.counts[i+1]<100){m.counts[i]-=10;m.counts[i+1]++;}else if(d.dir==='down'&&i>0&&m.counts[i]>=1&&m.counts[i-1]<=90){m.counts[i]--;m.counts[i-1]+=10;}else fail(m,'大单位换小单位要有一份；小单位换大单位要先凑够十份。格子太满时先向左合一合。');}
  if(action==='b11-remove'&&m.started&&t.op==='-'){const i=Number(d.index);if(!int(i,0,width(t)-1))break;record(m,{action,index:i,before:[...m.counts],needed:m.remaining[i]});if(m.counts[i]<m.remaining[i]){fail(m,'这一列还不够拿。可以把左边一份换成这里的十份，总量不变。');break;}m.counts[i]-=m.remaining[i];m.remaining[i]=0;}
  break;}
 case'x-routecalc':
  if(action==='b11-route-start'&&!m.started&&number(m.guess,s)!==null){m.started=true;m.first??=m.guess;record(m,{action,guess:m.guess});}
  if(action==='b11-hop'&&m.started){const delta=number(m.jump,s),to=number(m.landing,s);record(m,{action,jump:m.jump,landing:m.landing,from:location(t,m)});if(delta===null||delta===0||to===null||to!==location(t,m)+delta||m.hops.length>=100){fail(m,'每一步都要从刚到的地方出发；落点要和这次的变化量一致。');break;}m.hops.push({delta,to});m.jump='';m.landing='';}
  if(action==='b11-hop-undo'&&m.hops.length){record(m,{action,hop:m.hops.pop()});}break;
 case'x-groupfour':
  if(action==='b11-group-pick'&&int(Number(d.index),0,m.groups.length-1)){const i=Number(d.index),j=m.selected.indexOf(i);if(j>=0)m.selected.splice(j,1);else if(m.selected.length<2)m.selected.push(i);}
  if(action==='b11-group-merge'&&m.selected.length===2){const [a,b]=m.selected.map(i=>m.groups[i]),r={left:structuredClone(a),right:structuredClone(b),answer:m.subtotal};record(m,{action,...r});if(number(m.subtotal)!==a.value+b.value){fail(m,'只合你选中的两堆；另外的还要留下。先检查这两堆合起来是多少。');break;}m.merges.push(r);m.groups=m.groups.filter((_,i)=>!m.selected.includes(i));m.groups.push({ids:[...a.ids,...b.ids],value:a.value+b.value});m.selected=[];m.subtotal='';}break;
 case'x-storyledger':
  if(action==='b11-event'&&m.cursor<t.steps.length){const step=t.steps[m.cursor],before=m.cursor?number(m.saved.at(-1).result,s):t.start,r={op:m.op,amount:m.amount,result:m.result,method:m.method};m.first[m.cursor]??=structuredClone(r);record(m,{action,index:m.cursor,...r});if(r.op!==step.op||number(r.amount,s)!==step.amount||number(r.result,s)!==before+(step.op==='+'?step.amount:-step.amount)||!['mental','written','tool'].includes(r.method)){fail(m,'先想这一件事让数量增加还是减少，再检查变化量、现在的数量和选用的方法。');break;}m.saved.push(r);m.cursor++;m.op='';m.amount='';m.result='';m.method='';}break;
 case'x-estimatecheck':
  if(action==='b11-estimate'&&!m.locked){const r={unit:m.unit,roundedA:m.roundedA,roundedB:m.roundedB,estimate:m.estimate};m.first??=structuredClone(r);record(m,{action,...r});const u=Number(m.unit);if(!t.units.includes(u)||(t.accuracy&&u>t.accuracy)||number(m.roundedA,s)!==round(t.a,u)||number(m.roundedB,s)!==round(t.b,u)||number(m.estimate,s)!==round(t.a,u)+(t.op==='+'?round(t.b,u):-round(t.b,u))){fail(m,'先决定每隔多少取一个近似数，再让两边都按这个间隔靠近，最后计算粗略结果。');break;}m.locked=r;}break;
}return m;}
export function field(t,m,key){if(t.type==='x-placecalc'&&m.started&&key.startsWith('align.')){const i=Number(key.split('.')[1]);m.align[i]=String(rowOffset(t,i));}}
export function inspect(t,m){if(!valid(t,m))return{correct:false,feedback:'这份操作记录不能读，试着重新开始这一步。'};let ok=false,feedback='';const s=scale(t);switch(t.type){
 case'x-placecalc':ok=m.started&&m.first!==null&&m.counts.every(x=>x<10)&&m.remaining.every(x=>x===0)&&number(m.answer,s)===answer(t)&&writtenMatches(t,m)&&m.history.some(x=>x.action==='b11-place-start');feedback=t.written?'先把同样的单位对齐并实际换好、拿好，再把每列留下的数字写在对应位置，最后读出整个结果。':'先对齐相同单位，再实际合并或拿走。需要换单位时动手换，最后写下剩下的数量。';break;
 case'x-routecalc':ok=m.started&&m.hops.length>=(t.minSteps??1)&&location(t,m)===destination(t)&&number(m.answer,s)===answer(t)&&(!t.compensation||m.hops.some(h=>Math.sign(h.delta)!==Math.sign(destination(t)-origin(t))));feedback=t.compensation?'先走过一点，再反向退还多走的部分；变化量合起来仍要等于原来的变化。':(t.minSteps??1)>1?`把一次变化拆成至少${t.minSteps}步，自己决定每步多远。最后落点和所有变化要对上。`:'自己决定每步多远；一步也可以。最后落点和所有变化要对上。';break;
 case'x-groupfour':ok=m.groups.length===1&&m.merges.length===t.values.length-1&&m.groups[0].value===sum(t.values);feedback='每次选两堆合起来，直到全部汇合。每一堆只能算一次，也不能丢掉。';break;
 case'x-storyledger':ok=m.cursor===t.steps.length;feedback='接着把每件事按顺序做完；每一步都从刚才留下的数量继续。';break;
 case'x-estimatecheck':{const part=number(m.inversePart,s),back=number(m.inverseResult,s),inverse=part===t.b&&back===t.a||t.op==='+'&&part===t.a&&back===t.b;ok=!!m.locked&&number(m.answer,s)===answer(t)&&number(m.inverseStart,s)===answer(t)&&m.inverseOp===(t.op==='+'?'-':'+')&&inverse&&(t.claimed===undefined||m.judgment===(plausible(t,Number(m.locked.unit),t.claimed)?'plausible':'impossible'));feedback='先留下估算，再精算。用相反的动作检查能不能回到原来的数；落在估计范围里还不能证明答案正确。';break;}
}return{correct:ok,feedback:ok?'这次操作和记录对上了。':feedback,evidence:{kind:t.type,construction:structuredClone(m),explanationAssessed:false,fluencyAssessed:false,mentalStrategyAssessed:false}};}
// Replayable demonstrations use the same public actions as the learner.
// Browser verification replays these steps through real controls, never state injection.
export function solveSteps(t){const out=[],m=initial(t),s=scale(t);const f=(key,value)=>{value=String(value);out.push({field:key,value});const path=key.split('.');let p=m;for(const k of path.slice(0,-1))p=p[k];p[path.at(-1)]=value;field(t,m,key);};const a=(action,data={})=>{out.push({action,data});act(t,m,action,data);};switch(t.type){
 case'x-placecalc':f('guess',fmt(answer(t),s));t.values.forEach((_,i)=>f(`align.${i}`,rowOffset(t,i)));a('b11-place-start');if(t.op==='+'){for(let i=0;i<width(t)-1;i++)while(m.counts[i]>=10)a('b11-exchange',{index:i,dir:'up'});}else{for(let i=0;i<width(t)-1;i++){while(m.counts[i]<m.remaining[i]){let j=i+1;while(j<width(t)&&!m.counts[j])j++;if(j===width(t))throw Error('cannot exchange');for(;j>i;j--)a('b11-exchange',{index:j,dir:'down'});}if(m.remaining[i])a('b11-remove',{index:i});}for(let i=0;i<width(t)-1;i++)while(m.counts[i]>=10)a('b11-exchange',{index:i,dir:'up'});}if(t.written)for(let i=0;i<=lastWrittenColumn(t);i++)f('columnAnswers.'+i,m.counts[i]);f('answer',fmt(answer(t),s));break;
 case'x-routecalc':{f('guess',fmt(answer(t),s));a('b11-route-start');const delta=destination(t)-origin(t),direction=Math.sign(delta)||1,amount=Math.abs(delta);let hops;if(t.compensation){const extra=10**Math.max(0,String(amount).length-1),rounded=Math.ceil((amount+1)/extra)*extra;hops=[direction*rounded,delta-direction*rounded];}else{const first=Math.max(1,Math.floor(amount/2));hops=[direction*first,delta-direction*first];if(!hops[1])hops=[direction*(amount+1),-direction];}while(hops.length<(t.minSteps??1)){const h=hops.pop();hops.push(h+direction,-direction);}for(const d of hops){f('jump',fmt(d,s));f('landing',fmt(location(t,m)+d,s));a('b11-hop');}f('answer',fmt(answer(t),s));break;}
 case'x-groupfour':while(m.groups.length>1){let pair=[0,1];outer:for(let i=0;i<m.groups.length;i++)for(let j=i+1;j<m.groups.length;j++)if((m.groups[i].value+m.groups[j].value)%10===0){pair=[i,j];break outer;}const n=sum(pair.map(i=>m.groups[i].value));for(const index of pair)a('b11-group-pick',{index});f('subtotal',n);a('b11-group-merge');}break;
 case'x-storyledger':{let at=t.start;for(const step of t.steps){at+=step.op==='+'?step.amount:-step.amount;f('op',step.op);f('amount',fmt(step.amount,s));f('result',fmt(at,s));f('method','written');a('b11-event');}break;}
 case'x-estimatecheck':{const u=t.units.find(u=>!t.accuracy||u<=t.accuracy);f('unit',u);f('roundedA',fmt(round(t.a,u),s));f('roundedB',fmt(round(t.b,u),s));f('estimate',fmt(round(t.a,u)+(t.op==='+'?round(t.b,u):-round(t.b,u)),s));a('b11-estimate');f('answer',fmt(answer(t),s));f('inverseStart',fmt(answer(t),s));f('inverseOp',t.op==='+'?'-':'+');f('inversePart',fmt(t.b,s));f('inverseResult',fmt(t.a,s));if(t.claimed!==undefined)f('judgment',plausible(t,u,t.claimed)?'plausible':'impossible');break;}
}return out;}
export function example(t){const m=initial(t);for(const step of solveSteps(t)){if(step.field){const ps=step.field.split('.');let p=m;for(const key of ps.slice(0,-1))p=p[key];p[ps.at(-1)]=step.value;field(t,m,step.field);}else act(t,m,step.action,step.data);}return m;}
