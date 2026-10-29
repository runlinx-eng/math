// Manipulation evidence is bounded here; speech, writing quality and strategy remain unassessed.
export const TYPES=new Set(['x-counttrail','x-paircounts','x-onechange','x-numberfaces','x-flashcount','x-fingers','x-partbuild','x-bundlecount','x-countboard','x-countwalk','x-digitcompare','x-orderline','x-teenbuild','x-numberwrite']);
const int=(v,a=0,b=1000000)=>Number.isInteger(v)&&v>=a&&v<=b;
const ids=(a,n,unique=true)=>Array.isArray(a)&&a.length<=n&&(unique?new Set(a).size===a.length:true)&&a.every(i=>int(i,0,n-1));
const eq=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const toggle=(a,i)=>{const j=a.indexOf(i);j<0?a.push(i):a.splice(j,1);};
const full=(a,n)=>a.length===n&&ids(a,n);
export const cn=n=>{if(n===100)return'一百';const d='零一二三四五六七八九';if(n<10)return d[n];return(n<20?'':d[Math.floor(n/10)])+'十'+(n%10?d[n%10]:'');};
export const amount=m=>100*m.hundreds+10*m.tens+m.ones;
export function initial(t){switch(t.type){
case'x-counttrail':return{taps:[],total:null,badStep:null,why:'',prediction:null,before:null,moved:false,again:[],after:null};
case'x-paircounts':return{pairs:[],pending:null,a:null,b:null,relation:'',most:'',least:''};
case'x-onechange':return{guess:null,committed:null,changed:false,total:null,why:''};
case'x-numberfaces':return{selected:[],dots:[],mark:0,numeral:null,before:null,after:null};
case'x-flashcount':return{open:false,until:0,reveals:0,answer:null,a:null,b:null};
case'x-fingers':return{selected:[],shown:false,total:null};
case'x-partbuild':return{red:0,blue:0,saved:[],total:null};
case'x-bundlecount':return{selected:[],groups:[],groupsCount:null,remainder:null,total:null,why:''};
case'x-countboard':return{values:t.holes.map(()=>null)};
case'x-countwalk':return{hops:[],next:null,step:null,why:''};
case'x-digitcompare':return{a:0,b:0,relation:''};
case'x-orderline':return{order:[]};
case'x-teenbuild':return{selected:[],bundle:[],unpacked:false,rebundled:false,tens:null,ones:null,total:null,why:''};
case'x-numberwrite':return{hundreds:0,tens:0,ones:0,numeral:'',word:'',heard:0,textHelp:false,ink:[]};
}}
function tree(v,depth=0){if(depth>6)return false;if(v===null||typeof v==='boolean')return true;if(typeof v==='number')return Number.isFinite(v)&&Math.abs(v)<=1e13;if(typeof v==='string')return v.length<=2000;if(Array.isArray(v))return v.length<=512&&v.every(x=>tree(x,depth+1));if(v&&typeof v==='object')return Object.keys(v).length<=32&&Object.values(v).every(x=>tree(x,depth+1));return false;}
function base(t,m){const seed=initial(t);return !!seed&&m&&tree(m)&&Object.entries(seed).every(([k,v])=>Object.hasOwn(m,k)&&(v===null?m[k]===null||int(m[k],-1000000):Array.isArray(v)?Array.isArray(m[k]):typeof m[k]===typeof v));}
export function valid(t,m){if(!base(t,m))return false;switch(t.type){
case'x-counttrail':return m.taps.length<=t.n*3&&m.again.length<=t.n*3&&[...m.taps,...m.again].every(i=>int(i,0,t.n-1))&&(!m.moved||m.before!==null);
case'x-paircounts':return m.pairs.length<=Math.min(t.a,t.b)&&m.pairs.every(p=>Array.isArray(p)&&p.length===2&&int(p[0],0,t.a-1)&&int(p[1],0,t.b-1))&&new Set(m.pairs.map(p=>p[0])).size===m.pairs.length&&new Set(m.pairs.map(p=>p[1])).size===m.pairs.length&&(m.pending===null||int(m.pending,0,t.a-1));
case'x-onechange':return !m.changed||m.committed!==null;
case'x-numberfaces':return ids(m.selected,t.pool)&&ids(m.dots,20)&&int(m.mark,0,20);
case'x-flashcount':return int(m.reveals,0,10000)&&int(m.until,0,1e13)&&(!m.open||m.reveals>0);
case'x-fingers':return ids(m.selected,5);
case'x-partbuild':return int(m.red,0,10)&&int(m.blue,0,10)&&m.saved.length<=20&&m.saved.every(p=>Array.isArray(p)&&p.length===2&&p.every(n=>int(n,0,10))&&p[0]+p[1]===t.n);
case'x-bundlecount':{const used=m.groups.flat();return m.groups.length<=Math.floor(t.n/t.size)&&m.groups.every(g=>ids(g,t.n)&&g.length===t.size)&&ids(used,t.n)&&ids(m.selected,t.n)&&m.selected.every(i=>!used.includes(i));}
case'x-countboard':return m.values.length===t.holes.length&&m.values.every(v=>v===null||int(v,-1000000));
case'x-countwalk':return m.hops.length<=t.count&&m.hops.every(n=>int(n,0,1000000));
case'x-digitcompare':return int(m.a,0,10)&&int(m.b,0,10);
case'x-orderline':return ids(m.order,t.values.length);
case'x-teenbuild':return ids(m.selected,t.n)&&ids(m.bundle,t.n)&&[0,10].includes(m.bundle.length)&&!m.selected.some(i=>m.bundle.includes(i));
case'x-numberwrite':return int(m.hundreds,0,1)&&int(m.tens,0,10)&&int(m.ones,0,20)&&int(m.heard,0,10000)&&m.ink.length<=64&&m.ink.every(s=>Array.isArray(s)&&s.length<=512&&s.every(p=>Array.isArray(p)&&p.length===2&&p.every(n=>typeof n==='number'&&n>=0&&n<=1)));
}return false;}
export function inspect(t,m){if(!valid(t,m))return{correct:false,feedback:'操作记录不完整，请重新试一次。'};let ok=false,help='';switch(t.type){
case'x-counttrail':ok=full(m.taps,t.n)&&m.total===t.n&&(!t.error||m.badStep===t.error.findIndex((x,i)=>t.error.indexOf(x)!==i)+1&&m.why==='twice')&&(!t.crooked||m.why==='start')&&(!t.rearrange||m.moved&&m.before===t.n&&m.prediction===t.n&&m.after===t.n&&m.why==='same')&&(!t.recount||full(m.again,t.n)&&!eq(m.taps,m.again));help=t.crooked?'从一开始，每颗只数一次。喊到七不一定有七颗，要检查从哪里开始。':t.error?'找同一颗第二次拿到序号的位置，再亲自做到每颗恰好数一次。':t.recount?'第二次换一个起点或次序，每颗仍只数一次；没有增减珠子，两次总数相同。':t.rearrange?'先数全，再记挪动前的猜测；只有位置变了，没有添取珠子。':'每颗恰好点一次，所有珠子都数到，最后的序号才表示总数。';break;
case'x-paircounts':{const relation=t.a===t.b?'equal':t.a>t.b?'more':'fewer',v=[t.a,t.b,t.c];ok=m.pairs.length===Math.min(t.a,t.b)&&m.a===t.a&&m.b===t.b&&m.relation===relation&&(!t.c||m.most===String(v.indexOf(Math.max(...v)))&&m.least===String(v.indexOf(Math.min(...v))));help='一颗只配一个伙伴。配完后看剩余，再核对每组总数；排得长不代表多。';break;}
case'x-onechange':ok=m.changed&&m.total===t.n+t.delta&&m.why===(t.delta>0?'next':'previous');help='先留下猜测，再真正增加或拿走一颗；总数会到相邻的后一个或前一个。原猜测即使改正也会保留。';break;
case'x-numberfaces':ok=m.selected.length===t.n&&m.numeral===t.n&&(t.give||m.dots.length===t.n&&m.mark===t.n)&&(!t.neighbors||m.before===t.n-1&&m.after===t.n+1);help='珠子、点图和数轴位置要表示同样多；零是起点，不是第一个物品。';break;
case'x-flashcount':ok=m.reveals>0&&!m.open&&m.answer===t.n&&(!t.parts||m.a===t.parts[0]&&m.b===t.parts[1]);help='盖住后再记录；有两部分时，分别记下每部分与总数。可以再看，重复观察会留下记录。';break;
case'x-fingers':ok=m.shown&&m.selected.length===t.n&&m.total===t.n;help='先选出三根，再同时亮出。屏幕只记录这次表示，不判断真实手指动作。';break;
case'x-partbuild':ok=m.red+m.blue===t.n&&m.total===t.n&&new Set(m.saved.map(p=>[...p].sort((a,b)=>a-b).join(','))).size>=2;help='两部分合起来保持八，再保存另一种分法；只交换两种颜色，不算新的数量分法。';break;
case'x-bundlecount':ok=m.groups.length===Math.floor(t.n/t.size)&&m.groupsCount===m.groups.length&&m.remainder===t.n-m.groups.length*t.size&&m.total===t.n&&(!t.reason||m.why==='units');help=`每组恰好 ${t.size} 个，每件只进一组。总数是整组里的所有物品，加零散的；组数和物品数不同。`;break;
case'x-countboard':ok=eq(m.values,t.holes);help='每排从左向右增加一，过整十时别漏掉那个数。口头练习不自动评分。';break;
case'x-countwalk':ok=m.hops.length===t.count&&m.hops.every((v,i)=>v===t.start+(i+1)*t.step)&&(!t.infer||m.step===t.step)&&(!t.reason||m.why===(t.reason==='ones'?'ones':'carry'));help='检查每相邻两站的差，方向和步长都要保持。跨过整十、整百或更大边界时，要把进位或退位带过去。';break;
case'x-digitcompare':ok=m.a===t.a&&m.b===t.b&&m.relation===(t.a===t.b?'equal':t.a>t.b?'greater':'less');help='先在数轴上定位；越右越大。符号开口向较大的数，同一位置用等号。';break;
case'x-orderline':ok=m.order.length===t.values.length&&m.order.every((v,i,a)=>i===0||t.values[v]>t.values[a[i-1]]);help='按数量从小到大排；零也占一个位置，不能按数字写了几位排序。';break;
case'x-teenbuild':ok=m.bundle.length===10&&m.tens===1&&m.ones===t.n-10&&m.total===t.n&&m.why==='ten'&&(!t.unpack||m.unpacked&&m.rebundled);help='亲自把十颗扎成一束，剩下的是几个一。拆开再扎好不改变总数；十位的 1 代表十颗。';break;
case'x-numberwrite':ok=amount(m)===t.n&&m.numeral===String(t.n)&&m.word===cn(t.n)&&(t.mode!=='audio'||m.heard>0||m.textHelp);help='把数量、数字和中文名字对起来。整十代表十个一，零也有含义；手写只保存，不自动判断字形。';break;
}return{correct:!!ok,feedback:ok?'这次操作和记录对上了。':help};}
export function act(t,m,action,d={}){const i=Number(d.index);switch(action){
case'count-tap':{const a=m.moved&&t.recount?m.again:m.taps;if(int(i,0,t.n-1)&&a.length<t.n*3)a.push(i);break;}
case'count-undo':(m.moved&&t.recount?m.again:m.taps).pop();break;
case'count-move':if(full(m.taps,t.n)&&m.total!==null&&m.prediction!==null&&!m.moved){m.before=m.total;m.moved=true;}break;
case'count-reset':Object.assign(m,initial(t));break;
case'pair-a':if(int(i,0,t.a-1)&&!m.pairs.some(p=>p[0]===i))m.pending=i;break;
case'pair-b':if(m.pending!==null&&int(i,0,t.b-1)&&!m.pairs.some(p=>p[1]===i)){m.pairs.push([m.pending,i]);m.pending=null;}break;
case'pair-undo':m.pairs.pop();m.pending=null;break;
case'one-change':if(m.guess!==null&&!m.changed){m.committed=m.guess;m.changed=true;}break;
case'face-take':if(int(i,0,t.pool-1))toggle(m.selected,i);break;
case'face-dot':if(int(i,0,19))toggle(m.dots,i);break;
case'flash-open':if(m.reveals<10000){m.open=true;m.reveals++;m.until=Number(d.now)||Date.now();m.until+=1000;}break;
case'flash-close':m.open=false;break;
case'finger-toggle':if(int(i,0,4)){toggle(m.selected,i);m.shown=false;}break;
case'finger-show':m.shown=true;break;
case'parts-save':if(m.red+m.blue===t.n&&m.saved.length<20&&!m.saved.some(p=>eq(p,[m.red,m.blue])))m.saved.push([m.red,m.blue]);break;
case'bundle-pick':case'teen-pick':{const used=action==='bundle-pick'?m.groups.flat():m.bundle;if(int(i,0,t.n-1)&&!used.includes(i))toggle(m.selected,i);break;}
case'bundle-wrap':if(m.selected.length===t.size){m.groups.push([...m.selected]);m.selected=[];}break;
case'bundle-repeat':if(m.groups.length){const used=m.groups.flat(),free=Array.from({length:t.n},(_,i)=>i).filter(i=>!used.includes(i));if(free.length>=t.size)m.groups.push(free.slice(0,t.size));m.selected=[];}break;
case'bundle-reset':m.groups=[];m.selected=[];break;
case'walk-hop':if(m.hops.length<t.count&&int(m.next,0,1000000)){m.hops.push(m.next);m.next=null;}break;
case'walk-undo':m.next=m.hops.pop()??null;break;
case'walk-reset':m.hops=[];m.next=null;break;
case'order-pick':if(int(i,0,t.values.length-1))toggle(m.order,i);break;
case'teen-wrap':if(m.selected.length===10&&!m.bundle.length){m.bundle=[...m.selected];m.selected=[];if(m.unpacked)m.rebundled=true;}break;
case'teen-unpack':if(m.bundle.length===10){m.bundle=[];m.unpacked=true;m.rebundled=false;}break;
case'write-add':{const k=d.unit,delta=Number(d.delta);if(['hundreds','tens','ones'].includes(k)&&[-1,1].includes(delta))m[k]=Math.max(0,Math.min(k==='hundreds'?1:k==='tens'?10:20,m[k]+delta));break;}
case'write-exchange':if(m.ones>=10&&m.tens<10){m.ones-=10;m.tens++;}else if(m.tens===10&&m.hundreds===0){m.tens=0;m.hundreds++;}break;
case'write-heard':m.heard=Math.min(10000,m.heard+1);break;
case'write-text':m.textHelp=true;break;
case'write-clear-ink':m.ink=[];break;
}}
export function field(t,m,k){if(t.type==='x-counttrail'&&m.moved&&['total','prediction'].includes(k)){m.total=m.before;}if(t.type==='x-numberwrite'&&k==='word')m.word=m.word.trim();}
export function example(t){const m=initial(t);switch(t.type){
case'x-counttrail':m.taps=Array.from({length:t.n},(_,i)=>i);m.total=t.n;if(t.error){m.badStep=t.error.findIndex((x,i)=>t.error.indexOf(x)!==i)+1;m.why='twice';}if(t.crooked)m.why='start';if(t.rearrange){m.before=t.n;m.prediction=t.n;m.moved=true;m.after=t.n;m.why='same';}if(t.recount)m.again=[...m.taps].reverse();break;
case'x-paircounts':m.pairs=Array.from({length:Math.min(t.a,t.b)},(_,i)=>[i,i]);m.a=t.a;m.b=t.b;m.relation=t.a===t.b?'equal':t.a>t.b?'more':'fewer';if(t.c){const a=[t.a,t.b,t.c];m.most=String(a.indexOf(Math.max(...a)));m.least=String(a.indexOf(Math.min(...a)));}break;
case'x-onechange':m.guess=t.n+t.delta;m.committed=m.guess;m.changed=true;m.total=m.guess;m.why=t.delta>0?'next':'previous';break;
case'x-numberfaces':m.selected=Array.from({length:t.n},(_,i)=>i);m.dots=[...m.selected];m.mark=t.n;m.numeral=t.n;m.before=t.n-1;m.after=t.n+1;break;
case'x-flashcount':m.reveals=1;m.answer=t.n;if(t.parts)[m.a,m.b]=t.parts;break;
case'x-fingers':m.selected=Array.from({length:t.n},(_,i)=>i);m.shown=true;m.total=t.n;break;
case'x-partbuild':m.red=5;m.blue=t.n-5;m.saved=[[4,t.n-4],[5,t.n-5]];m.total=t.n;break;
case'x-bundlecount':m.groups=Array.from({length:Math.floor(t.n/t.size)},(_,g)=>Array.from({length:t.size},(_,i)=>g*t.size+i));m.groupsCount=m.groups.length;m.remainder=t.n%t.size;m.total=t.n;m.why='units';break;
case'x-countboard':m.values=[...t.holes];break;
case'x-countwalk':m.hops=Array.from({length:t.count},(_,i)=>t.start+(i+1)*t.step);m.step=t.step;m.why=t.reason==='ones'?'ones':'carry';break;
case'x-digitcompare':m.a=t.a;m.b=t.b;m.relation=t.a===t.b?'equal':t.a>t.b?'greater':'less';break;
case'x-orderline':m.order=t.values.map((_,i)=>i).sort((a,b)=>t.values[a]-t.values[b]);break;
case'x-teenbuild':m.bundle=Array.from({length:10},(_,i)=>i);m.unpacked=!!t.unpack;m.rebundled=!!t.unpack;m.tens=1;m.ones=t.n-10;m.total=t.n;m.why='ten';break;
case'x-numberwrite':m.hundreds=Math.floor(t.n/100);m.tens=Math.floor(t.n%100/10);m.ones=t.n%10;m.numeral=String(t.n);m.word=cn(t.n);m.heard=t.mode==='audio'?1:0;break;
}return m;}
