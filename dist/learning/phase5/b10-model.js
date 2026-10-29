export const TYPES=new Set(['x-joinstory','x-splitbench','x-tenbridge','x-factfamily','x-recallbench','x-countsteps','x-threegroups','x-unitadd','x-subgroups']);
const int=(x,min=0,max=100)=>Number.isInteger(x)&&x>=min&&x<=max;
export const num=x=>typeof x==='string'&&/^\s*-?\d{1,4}\s*$/.test(x)?Number(x):null;
export const clean=x=>String(x??'').replace(/\s/g,'').replace(/[＋]/g,'+').replace(/[−–－]/g,'-').replace(/[＝]/g,'=');
function expression(s){if(!/^\d{1,3}(?:[+-]\d{1,3})*$/.test(s))return null;const bits=s.match(/[+-]?\d+/g);return bits.reduce((n,b)=>n+Number(b),0);}
export function equalStatement(s){const sides=clean(s).split('=');return sides.length===2&&sides.every(x=>expression(x)!==null)&&expression(sides[0])===expression(sides[1]);}
export function equation(s,a,b,op,result=a+(op==='+'?b:-b)){
 const sides=clean(s).split('=');if(sides.length!==2)return false;const terms=[`${a}${op}${b}`,...(op==='+'?[`${b}+${a}`]:[])];return terms.some(term=>(sides[0]===term&&sides[1]===String(result))||(sides[1]===term&&sides[0]===String(result)));
}
const range=n=>Array.from({length:n},(_,i)=>i),sum=a=>a.reduce((a,b)=>a+b,0);
const string=x=>typeof x==='string'&&x.length<=2000;
const ids=(x,n)=>Array.isArray(x)&&x.length<=n&&new Set(x).size===x.length&&x.every(v=>int(v,0,n-1));
const history=x=>Array.isArray(x)&&x.length<=10000&&x.every(v=>v&&typeof v==='object'&&!Array.isArray(v));
const toggle=(xs,i)=>{const j=xs.indexOf(i);j<0?xs.push(i):xs.splice(j,1);};
export function initial(t){const common={history:[],issue:''};switch(t.type){
 case'x-joinstory':return{...common,left:0,right:0,op:'',guess:'',first:null,done:null,equation:'',swapped:false,otherEquation:'',shortage:''};
 case'x-splitbench':return{...common,left:[],equation:'',saved:[]};
 case'x-tenbridge':return{...common,guess:'',first:null,moved:[],landmark:null,firstPart:'',secondPart:'',equation:'',finished:false};
 case'x-factfamily':return{...common,mode:'',equation:'',saved:[]};
 case'x-recallbench':return{...common,cursor:0,answer:'',saved:[],help:[]};
 case'x-countsteps':return{...common,start:'',next:'',hops:[],equation:''};
 case'x-threegroups':return{...common,selected:[],merged:false,sub:'',total:'',saved:[]};
 case'x-unitadd':return{...common,tens:0,ones:0,joined:false,exchanges:0,equation:''};
 case'x-subgroups':return{...common,branch:0,next:'',paths:[[],[]]};
}return null;}
const snapshotGood=s=>s&&int(s.a,0,40)&&int(s.b,0,40)&&['+','-'].includes(s.op)&&s.result===s.a+(s.op==='+'?s.b:-s.b);
export function valid(t,m){try{if(!m||!history(m.history)||!string(m.issue))return false;switch(t.type){
 case'x-joinstory':return int(m.left,0,40)&&int(m.right,0,40)&&['','+','-'].includes(m.op)&&string(m.guess)&&(m.first===null||string(m.first))&&(m.done===null||snapshotGood(m.done))&&string(m.equation)&&typeof m.swapped==='boolean'&&string(m.otherEquation)&&string(m.shortage);
 case'x-splitbench':return ids(m.left,t.total)&&string(m.equation)&&Array.isArray(m.saved)&&m.saved.length<=t.total+1&&m.saved.every(s=>ids(s.ids,t.total)&&s.a===s.ids.length&&s.b===t.total-s.a&&string(s.eq));
 case'x-tenbridge':return string(m.guess)&&(m.first===null||string(m.first))&&ids(m.moved,t.op==='+'?t.b:t.a)&&(m.landmark===null||(ids(m.landmark.ids,t.op==='+'?t.b:t.a)&&m.landmark.count===m.landmark.ids.length))&&string(m.firstPart)&&string(m.secondPart)&&string(m.equation)&&typeof m.finished==='boolean';
 case'x-factfamily':return ['',...MODES].includes(m.mode)&&string(m.equation)&&Array.isArray(m.saved)&&m.saved.length<=4&&m.saved.every(s=>MODES.includes(s.mode)&&string(s.eq));
 case'x-recallbench':return int(m.cursor,0,t.cases.length)&&string(m.answer)&&ids(m.help,t.cases.length)&&Array.isArray(m.saved)&&m.saved.length===m.cursor&&m.saved.every(s=>string(s.answer)&&typeof s.help==='boolean');
 case'x-countsteps':return string(m.start)&&string(m.next)&&Array.isArray(m.hops)&&m.hops.length<=40&&m.hops.every(x=>int(x,0,40))&&string(m.equation);
 case'x-threegroups':return ids(m.selected,3)&&m.selected.length<=2&&typeof m.merged==='boolean'&&(!m.merged||m.selected.length===2)&&string(m.sub)&&string(m.total)&&Array.isArray(m.saved)&&m.saved.length<=3&&m.saved.every(s=>ids(s.pair,3)&&s.pair.length===2&&string(s.sub)&&string(s.total));
 case'x-unitadd':return int(m.tens,0,10)&&int(m.ones,0,20)&&typeof m.joined==='boolean'&&int(m.exchanges,0,3)&&string(m.equation)&&(!m.exchanges||m.joined)&&m.exchanges<=Math.floor((t.start%10+m.ones)/10);
 case'x-subgroups':return int(m.branch,0,1)&&string(m.next)&&Array.isArray(m.paths)&&m.paths.length===2&&m.paths.every(p=>Array.isArray(p)&&p.length<=2&&p.every(n=>int(n,0,30)));
}return false;}catch{return false;}}
export const MODES=['add','swap','take-a','take-b'];
export function familyNumbers(t,mode){return mode==='add'?[t.a,t.b,'+']:mode==='swap'?[t.b,t.a,'+']:mode==='take-a'?[t.a+t.b,t.a,'-']:[t.a+t.b,t.b,'-'];}
const familyEquation=(t,mode,s)=>{const[a,b,op]=familyNumbers(t,mode);return equation(s,a,b,op)&&clean(s).split('=').includes(`${a}${op}${b}`);};
const keyPair=(a,b)=>[a,b].sort((a,b)=>a-b).join(':');
export const tenFirst=t=>t.op==='+'?10-t.a:t.a-10;
export const currentTen=(t,m)=>t.op==='+'?t.a+m.moved.length:t.a-m.moved.length;
export function unitState(t,m){return{tens:Math.floor(t.start/10)+(m.joined?m.tens:0)+m.exchanges,ones:t.start%10+(m.joined?m.ones:0)-m.exchanges*10};}
export const stepStart=t=>t.op==='+'?Math.max(t.a,t.b):t.a;
export const stepCount=t=>t.op==='+'?Math.min(t.a,t.b):t.b;
export function inspect(t,m){if(!valid(t,m))return{correct:false,feedback:'这份操作记录不能读，试着重新开始这一步。'};let ok=false,feedback='';switch(t.type){
 case'x-joinstory':{const d=m.done;ok=!!d&&d.a===t.a&&d.b===t.b&&d.op===t.op&&m.left===d.a&&m.right===d.b&&m.op===d.op&&m.first!==null;
 if(t.balance){const [a,b]=t.balance,ss=clean(m.equation).split('=');ok&&=equalStatement(m.equation)&&ss.includes(`${a}+${b}`)&&ss.includes(`${t.a}+${t.b}`);}else ok&&=equation(m.equation,t.a,t.b,t.op);
 if(t.swap)ok&&=m.swapped&&(t.op==='+'?equation(m.otherEquation,t.b,t.a,'+'):m.shortage==='not-enough');
 feedback='检查原来的两部分、选的动作，再让算式对应实际发生的事情。';break;}
 case'x-splitbench':{const saved=m.saved.filter(s=>equation(s.eq,s.a,s.b,'+',t.total)),keys=new Set(saved.map(s=>keyPair(s.a,s.b)));ok=t.pairs?t.pairs.every(([a,b])=>keys.has(keyPair(a,b))):keys.size>=(t.count??Math.floor(t.total/2)+1);feedback='整体要保持不变。移动圆片，再写下这次分法；交换左右还是同一对。';break;}
 case'x-tenbridge':ok=m.first!==null&&!!m.landmark&&m.landmark.count===tenFirst(t)&&m.landmark.ids.every(i=>m.moved.includes(i))&&m.moved.length===t.b&&m.finished&&num(m.firstPart)===tenFirst(t)&&num(m.secondPart)===t.b-tenFirst(t)&&equation(m.equation,t.a,t.b,t.op);feedback='先把圆片移到十，留下这一站，再继续。拆出的两部分合起来仍要是原来的变化量。';break;
 case'x-factfamily':ok=MODES.every(mode=>m.saved.some(s=>s.mode===mode&&familyEquation(t,mode,s.eq)));feedback='用同样的两部分，正着合两次、分别倒着取走一部分。每个动作写一句对应的算式。';break;
 case'x-recallbench':ok=m.cursor===t.cases.length&&m.saved.every((s,i)=>num(s.answer)===t.cases[i].a+(t.cases[i].op==='+'?t.cases[i].b:-t.cases[i].b));feedback='接着试剩下的几组；忘记时可以看圆片，不扣分。';break;
 case'x-countsteps':ok=num(m.start)===stepStart(t)&&m.hops.length===stepCount(t)&&m.hops.every((n,i)=>n===stepStart(t)+(t.op==='+'?1:-1)*(i+1))&&equation(m.equation,t.a,t.b,t.op);feedback='起点不算一步。加法从较大的一堆接着数，减法从原来的整体倒着数。';break;
 case'x-threegroups':{const paths=m.saved.filter(s=>num(s.sub)===sum(s.pair.map(i=>t.values[i]))&&num(s.total)===sum(t.values));ok=new Set(paths.map(s=>s.pair.slice().sort().join(':'))).size>=2&&(!t.useful||paths.some(s=>sum(s.pair.map(i=>t.values[i]))===10||t.values[s.pair[0]]===t.values[s.pair[1]]));feedback='每种配对都能算，只要第三堆没丢、没重复。留两种不同配对，再看看有没有凑十或相同的一对。';break;}
 case'x-unitadd':ok=m.joined&&m.tens*10+m.ones===t.amount&&(!t.exchange||m.exchanges>0)&&equation(m.equation,t.start,t.amount,'+');feedback='看清增加的是几个一还是几个十。满十的散颗可以换成一捆，总数不变。';break;
 case'x-subgroups':ok=JSON.stringify(m.paths)===JSON.stringify([[7,5],[1,9]]);feedback='左边先算10−3，再减2；右边先算括号里的3−2，再用10减去那一份。';break;
}return{correct:ok,feedback:ok?'这次操作和记录对上了。':feedback,evidence:{kind:t.type,construction:structuredClone(m),explanationAssessed:false,fluencyAssessed:false}};}
export function act(t,m,action,d={}){m.issue='';switch(t.type){
 case'x-joinstory':
  if(action==='story-counter'&&['left','right'].includes(d.group)&&[-1,1].includes(Number(d.delta))){m[d.group]=Math.max(0,Math.min(40,m[d.group]+Number(d.delta)));m.done=null;m.swapped=false;}
  if(action==='story-do'){if(num(m.guess)===null||!['+','-'].includes(m.op)){m.issue='先写一个猜想，再选合起来或拿走。';break;}m.first??=m.guess;m.done={a:m.left,b:m.right,op:m.op,result:m.left+(m.op==='+'?m.right:-m.right)};m.history.push({...m.done,guess:m.guess});m.swapped=false;}
  if(action==='story-swap'&&m.done){m.swapped=!m.swapped;m.history.push({action:'swap',swapped:m.swapped});}break;
 case'x-splitbench':
  if(action==='split-token'&&int(Number(d.index),0,t.total-1))toggle(m.left,Number(d.index));
  if(action==='split-save'){const a=m.left.length,b=t.total-a;m.history.push({a,b,eq:m.equation});if(!equation(m.equation,a,b,'+',t.total)){m.issue='算式要和你刚摆出的两堆相同；整体也可以写在等号前。';break;}const key=keyPair(a,b);if(m.saved.some(s=>keyPair(s.a,s.b)===key)){m.issue='这一对已经留下了，换个真正不同的分法。';break;}m.saved.push({a,b,ids:[...m.left],eq:m.equation});m.equation='';}break;
 case'x-tenbridge':
  if(action==='ten-predict'&&num(m.guess)!==null)m.first??=m.guess;
  if(action==='ten-token'&&m.first!==null){const i=Number(d.index),limit=t.op==='+'?t.b:t.a;if(!int(i,0,limit-1))break;if(m.landmark?.ids.includes(i))break;if(t.op==='+'&&!m.landmark&&m.moved.length>=10-t.a&&!m.moved.includes(i))break;if(t.op==='-'&&!m.landmark&&i<10)break;toggle(m.moved,i);m.finished=false;}
  if(action==='ten-landmark'&&m.first!==null&&!m.landmark){m.history.push({action:'landmark',ids:[...m.moved],count:currentTen(t,m)});if(currentTen(t,m)!==10){m.issue='现在还没有到十。先看一看十格里留下了多少。';break;}m.landmark={ids:[...m.moved],count:m.moved.length};}
  if(action==='ten-finish'&&m.landmark){m.finished=true;m.history.push({action:'finish',ids:[...m.moved]});}
  if(action==='ten-reset'){m.history.push({action:'reset',ids:[...m.moved],landmark:m.landmark});m.moved=[];m.landmark=null;m.finished=false;}break;
 case'x-factfamily':
  if(action==='family-mode'&&MODES.includes(d.mode)){m.mode=d.mode;m.equation='';m.history.push({action:'move',mode:d.mode});}
  if(action==='family-save'&&m.mode){m.history.push({mode:m.mode,eq:m.equation});if(!familyEquation(t,m.mode,m.equation)){m.issue='这句话还没有对应刚才的动作。看清整体、拿走的部分和摆放顺序。';break;}m.saved=m.saved.filter(s=>s.mode!==m.mode);m.saved.push({mode:m.mode,eq:m.equation});}break;
 case'x-recallbench':
  if(action==='recall-help'&&m.cursor<t.cases.length&&!m.help.includes(m.cursor))m.help.push(m.cursor);
  if(action==='recall-save'&&m.cursor<t.cases.length){const c=t.cases[m.cursor],right=num(m.answer)===c.a+(c.op==='+'?c.b:-c.b);m.history.push({index:m.cursor,answer:m.answer,help:m.help.includes(m.cursor),correct:right});if(!right){m.issue='再看一看两部分和动作，也可以打开圆片。';break;}m.saved.push({answer:m.answer,help:m.help.includes(m.cursor)});m.cursor++;m.answer='';}break;
 case'x-countsteps':
  if(action==='steps-next'&&num(m.start)!==null&&int(num(m.next),0,40)&&m.hops.length<40){m.hops.push(num(m.next));m.history.push({start:m.start,next:m.next});m.next='';}
  if(action==='steps-undo')m.hops.pop();break;
 case'x-threegroups':
  if(action==='triple-pick'&&!m.merged&&int(Number(d.index),0,2)){const i=Number(d.index);if(m.selected.includes(i)||m.selected.length<2)toggle(m.selected,i);}
  if(action==='triple-merge'&&m.selected.length===2){m.merged=true;m.history.push({action:'merge',pair:[...m.selected]});}
  if(action==='triple-save'&&m.merged){const s={pair:[...m.selected],sub:m.sub,total:m.total};m.history.push({...s});if(num(m.sub)!==sum(m.selected.map(i=>t.values[i]))||num(m.total)!==sum(t.values)){m.issue='先合的两堆只算一次，剩下那一堆也只算一次。';break;}const key=m.selected.slice().sort().join(':');if(!m.saved.some(s=>s.pair.slice().sort().join(':')===key))m.saved.push(s);m.selected=[];m.merged=false;m.sub='';m.total='';}
  if(action==='triple-reset'){m.history.push({action:'reset',pair:[...m.selected]});m.selected=[];m.merged=false;}break;
 case'x-unitadd':
  if(action==='unit-counter'&&['tens','ones'].includes(d.unit)&&[-1,1].includes(Number(d.delta))){m[d.unit]=Math.max(0,Math.min(d.unit==='tens'?10:20,m[d.unit]+Number(d.delta)));m.joined=false;m.exchanges=0;}
  if(action==='unit-join'){m.joined=true;m.history.push({action:'join',tens:m.tens,ones:m.ones});}
  if(action==='unit-exchange'&&m.joined&&unitState(t,m).ones>=10){m.exchanges++;m.history.push({action:'exchange',tens:m.tens,ones:m.ones});}break;
 case'x-subgroups':
  if(action==='subgroups-branch'&&int(Number(d.index),0,1)){m.branch=Number(d.index);m.next='';}
  if(action==='subgroups-next'&&int(num(m.next),0,30)&&m.paths[m.branch].length<2){m.history.push({branch:m.branch,next:m.next});m.paths[m.branch].push(num(m.next));m.next='';}
  if(action==='subgroups-undo')m.paths[m.branch].pop();break;
}return m;}
export function field(t,m,key){if(t.type==='x-countsteps'&&key==='start'){m.history.push({action:'start',start:m.start,hops:[...m.hops]});m.hops=[];}if(t.type==='x-joinstory'&&key==='op'){m.done=null;m.swapped=false;}}
export function example(t){const m=initial(t);switch(t.type){
 case'x-joinstory':m.left=t.a;m.right=t.b;m.op=t.op;m.guess=String(t.a+(t.op==='+'?t.b:-t.b));act(t,m,'story-do');m.equation=t.balance?`${t.a}+${t.b}=${t.balance[0]}+${t.balance[1]}`:`${t.a}${t.op}${t.b}=${m.done.result}`;if(t.swap){act(t,m,'story-swap');m.otherEquation=`${t.b}+${t.a}=${t.a+t.b}`;m.shortage='not-enough';}break;
 case'x-splitbench':for(const [a,b]of(t.pairs||range(t.count??Math.floor(t.total/2)+1).map(i=>[i,t.total-i]))){m.left=range(a);m.equation=`${a}+${b}=${t.total}`;act(t,m,'split-save');}break;
 case'x-tenbridge':m.guess=String(t.a+(t.op==='+'?t.b:-t.b));act(t,m,'ten-predict');for(let i=0;i<tenFirst(t);i++)act(t,m,'ten-token',{index:t.op==='+'?i:10+i});act(t,m,'ten-landmark');for(let i=0;m.moved.length<t.b;i++)if(!m.moved.includes(i))act(t,m,'ten-token',{index:i});act(t,m,'ten-finish');m.firstPart=String(tenFirst(t));m.secondPart=String(t.b-tenFirst(t));m.equation=`${t.a}${t.op}${t.b}=${m.guess}`;break;
 case'x-factfamily':for(const mode of MODES){act(t,m,'family-mode',{mode});const[a,b,op]=familyNumbers(t,mode);m.equation=`${a}${op}${b}=${a+(op==='+'?b:-b)}`;act(t,m,'family-save');}break;
 case'x-recallbench':for(const c of t.cases){m.answer=String(c.a+(c.op==='+'?c.b:-c.b));act(t,m,'recall-save');}break;
 case'x-countsteps':m.start=String(stepStart(t));for(let i=0;i<stepCount(t);i++){m.next=String(stepStart(t)+(t.op==='+'?1:-1)*(i+1));act(t,m,'steps-next');}m.equation=`${t.a}${t.op}${t.b}=${t.a+(t.op==='+'?t.b:-t.b)}`;break;
 case'x-threegroups':for(const pair of [[0,1],[1,2],[0,2]]){for(const index of pair)act(t,m,'triple-pick',{index});act(t,m,'triple-merge');m.sub=String(sum(pair.map(i=>t.values[i])));m.total=String(sum(t.values));act(t,m,'triple-save');if(inspect(t,m).correct)break;}break;
 case'x-unitadd':m.tens=Math.floor(t.amount/10);m.ones=t.amount%10;act(t,m,'unit-join');if(t.exchange)act(t,m,'unit-exchange');m.equation=`${t.start}+${t.amount}=${t.start+t.amount}`;break;
 case'x-subgroups':for(let j=0;j<2;j++){act(t,m,'subgroups-branch',{index:j});for(const n of [[7,5],[1,9]][j]){m.next=String(n);act(t,m,'subgroups-next');}}break;
}return m;}
