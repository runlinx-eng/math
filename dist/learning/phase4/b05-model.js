import{int,ids,shape,same,outcome}from'./common.js';
import{toggle}from'./ui.js';
export const TYPES=new Set(['x-repeat','x-commute','x-placevalue','x-shapefacts','x-grow','x-balance','x-unknown','x-story','x-reason','x-regroup','x-proof']);
export const PROOF=['paired','join','none','even'];
export const balanceValues=(t,m)=>t.mode==='add'?[8+m.box,11]:t.mode==='subtract'?[5,m.box-3]:[12,m.box];
const given=(t,i)=>t.given?t.given.includes(i):i<t.known;
export function initial(t){switch(t.type){
case'x-repeat':return{length:1,unit:[],chain:[]};
case'x-commute':return{swapped:false,a:null,b:null,total:null};
case'x-placevalue':return{added:0,tens:null,ones:null,total:null};
case'x-shapefacts':return{width:3,height:2,shape:0,marks:[{sides:[],corners:[]},{sides:[],corners:[]}],kind:'sides',sides:null,corners:null,extra:''};
case'x-grow':return{start:null,step:'',heights:t.values.map((v,i)=>given(t,i)?v:0),prediction:null,committed:null};
case'x-balance':return{left:0,right:0,guess:'',runs:[],released:false,symbol:''};
case'x-unknown':return{box:t.mode==='subtract'?3:0,written:null,checked:false};
case'x-story':return{a:0,b:0,total:null,first:null,op:'',second:null,result:null,whole:'',role:''};
case'x-reason':return{split:0,remaining:null,total:null,position:8,jumps:0,error:'',why:''};
case'x-regroup':return{joined:false,tens:0,ones:0,swaps:0,total:null,reason:''};
case'x-proof':return{a:2,b:3,examples:[],chain:[],counterA:0,counterB:0,counterBuilt:false,why:''};
}}
export function valid(t,m){if(!shape(m,initial(t)))return false;switch(t.type){
case'x-repeat':return int(m.length,1,8)&&m.unit.length<=8&&m.chain.length<=40&&[...m.unit,...m.chain].every(x=>t.palette.includes(x));
case'x-shapefacts':return int(m.width,2,6)&&int(m.height,2,6)&&int(m.shape,0,1)&&['sides','corners'].includes(m.kind)&&m.marks.length===2&&m.marks.every(x=>ids(x.sides,4)&&ids(x.corners,4));
case'x-grow':return m.heights.length===t.values.length&&m.heights.every((v,i)=>int(v,0,60)&&(!given(t,i)||v===t.values[i]));
case'x-balance':return int(m.left,0,20)&&int(m.right,0,20)&&m.runs.length<=100&&m.runs.every(r=>int(r.left,0,20)&&int(r.right,0,20)&&['level','left','right'].includes(r.guess));
case'x-unknown':return int(m.box,t.mode==='subtract'?3:0,20);
case'x-story':return int(m.a,0,20)&&int(m.b,0,20);
case'x-reason':return int(m.split,0,5)&&int(m.position,8,13)&&int(m.jumps,0,5)&&m.position===8+m.jumps;
case'x-regroup':return int(m.swaps,0,1)&&(!m.joined?m.tens===0&&m.ones===0:m.tens===3+m.swaps&&m.ones===15-10*m.swaps);
case'x-proof':return int(m.a,1,6)&&int(m.b,1,6)&&int(m.counterA,0,12)&&int(m.counterB,0,12)&&m.chain.length<=4&&new Set(m.chain).size===m.chain.length&&m.chain.every(x=>PROOF.includes(x))&&m.examples.length<=20&&m.examples.every(x=>Array.isArray(x)&&x.length===2&&x.every(v=>int(v,1,6)));
case'x-placevalue':return int(m.added,0,3);
case'x-commute':return true;
}return false;}
export function inspect(t,m){let ok=false,help='';switch(t.type){
case'x-repeat':ok=m.length===t.unit.length&&same(m.unit,t.unit)&&same(m.chain,[...t.unit,...t.unit,...t.unit]);help='找从开头开始、能反复拼成整条的最短一段。单元里的先后和数量都要保持，搭三次。';break;
case'x-commute':ok=m.swapped&&m.a===t.b&&m.b===t.a&&m.total===t.a+t.b;help='交换的是两堆的位置，没有增加或拿走珠子。写出交换后的两个数。';break;
case'x-placevalue':ok=m.added===1&&m.tens===5&&m.ones===7&&m.total===57;help='一束就是十颗。只增加一个十，原来的七颗单珠没有变。';break;
case'x-shapefacts':ok=m.marks.every(x=>x.sides.length===4&&x.corners.length===4)&&m.sides===4&&m.corners===4&&m.extra==='same-length';help='两种图形都要检查四条边和四个直角。正方形还要每条边一样长，长方形不要求。';break;
case'x-grow':ok=m.start===t.values[0]&&Number(m.step)===t.values[1]-t.values[0]&&m.step.trim()!==''&&same(m.heights,t.values)&&(!t.towers||m.committed!==null);help='按约定的固定变化，从第一项开始，每相邻两项增加或减少相同数量。第六项只经历五次变化；预测可修正，但原来的猜测保留。';break;
case'x-balance':{const r=m.runs.at(-1),dir=t.l===t.r?'level':t.l>t.r?'left':'right';ok=m.left===t.l&&m.right===t.r&&r?.left===t.l&&r?.right===t.r&&r?.guess===dir&&m.released&&m.symbol===(t.l===t.r?'equal':'different');help='按表达式搭出每盘的总数，再预测。只有两边数量相同才用等号，不是看到加法就自动相等。';break;}
case'x-unknown':ok=m.box===t.answer&&m.written===t.answer&&m.checked;help='调整空盒中的数量，让两边的值相同；再代回原式检查，空盒在左边或右边都一样。';break;
case'x-story':{const equation=m.op==='plus'?m.first+m.second===m.result:m.op==='minus'?m.first-m.second===m.result:false;const matching=t.missing?m.op==='minus'&&m.first===t.total&&m.second===t.a&&m.result===t.b||m.op==='plus'&&[m.first,m.second].includes(t.a)&&[m.first,m.second].includes(t.b)&&m.result===t.total:m.op==='plus'&&same([m.first,m.second].sort((a,b)=>a-b),[t.a,t.b].sort((a,b)=>a-b))&&m.result===t.total;ok=m.a===t.a&&m.b===t.b&&m.total===t.total&&equation&&matching&&m.whole==='total'&&m.role===(t.missing?'known-part':'new-part');help='先确定哪个数是全部、哪些是部分。图中的两部分合成整体，算式还要表达这个故事的关系。';break;}
case'x-reason':ok=m.total===13&&(t.mode==='line'?m.jumps===5:m.split===2&&m.remaining===3)&&(t.mode!=='repair'||m.error==='five'&&m.why==='twice');help='五颗拿出两颗后还剩三颗，不能再保留原来的五颗。数轴走五步也会得到相同结果。';break;
case'x-regroup':ok=m.joined&&m.swaps===1&&m.tens===4&&m.ones===5&&m.total===45&&(!t.error||m.reason==='exchange');help='十五个一可以换出一个十，留下五个一。原来的三个十再多一个十，不能把 3 与 15 直接拼成 315。';break;
case'x-proof':ok=m.examples.length>=2&&new Set(m.examples.map(x=>x.join(','))).size>=2&&same(m.chain,PROOF)&&m.counterBuilt&&(m.counterA+m.counterB)%2===1;help='例子让你看见结构，完整的理由才能覆盖没试过的偶数。把任意两组完整的对放在一起，不会产生剩余；但任意两个数可以搭出奇数总和作为反例。';break;
}return outcome(ok,help);}
export function example(t){const m=initial(t);switch(t.type){
case'x-repeat':m.length=t.unit.length;m.unit=[...t.unit];m.chain=[...t.unit,...t.unit,...t.unit];break;
case'x-commute':Object.assign(m,{swapped:true,a:t.b,b:t.a,total:t.a+t.b});break;
case'x-placevalue':Object.assign(m,{added:1,tens:5,ones:7,total:57});break;
case'x-shapefacts':m.marks=[0,1].map(()=>({sides:[0,1,2,3],corners:[0,1,2,3]}));m.sides=4;m.corners=4;m.extra='same-length';break;
case'x-grow':Object.assign(m,{start:t.values[0],step:String(t.values[1]-t.values[0]),heights:[...t.values],prediction:t.values.at(-1),committed:t.values.at(-1)});break;
case'x-balance':Object.assign(m,{left:t.l,right:t.r,guess:t.l===t.r?'level':t.l>t.r?'left':'right',released:true,symbol:t.l===t.r?'equal':'different'});m.runs=[{left:m.left,right:m.right,guess:m.guess}];break;
case'x-unknown':Object.assign(m,{box:t.answer,written:t.answer,checked:true});break;
case'x-story':Object.assign(m,{a:t.a,b:t.b,total:t.total,first:t.missing?t.total:t.a,second:t.missing?t.a:t.b,result:t.missing?t.b:t.total,op:t.missing?'minus':'plus',whole:'total',role:t.missing?'known-part':'new-part'});break;
case'x-reason':Object.assign(m,{split:2,remaining:3,total:13,position:13,jumps:5,error:'five',why:'twice'});break;
case'x-regroup':Object.assign(m,{joined:true,tens:4,ones:5,swaps:1,total:45,reason:'exchange'});break;
case'x-proof':Object.assign(m,{examples:[[2,3],[3,4]],chain:[...PROOF],counterA:2,counterB:3,counterBuilt:true});break;
}return m;}
export function field(t,m,k){if(t.type==='x-unknown'&&k==='box')m.checked=false;if(t.type==='x-grow'&&t.towers&&k.startsWith('heights.')&&m.committed===null)m.committed=m.prediction;if(t.type==='x-proof'&&k.startsWith('counter'))m.counterBuilt=false;}
export function act(t,m,a,d){switch(a){
case'unit-token':if(m.unit.length<8)m.unit.push(d.value);break;case'unit-undo':m.unit.pop();break;case'repeat-unit':if(m.unit.length&&m.chain.length+m.unit.length<=40)m.chain.push(...m.unit);break;case'clear-chain':m.chain=[];break;
case'swap-piles':m.swapped=!m.swapped;break;case'add-ten':m.added=Math.max(0,Math.min(3,m.added+ +d.delta));break;
case'shape-select':m.shape=+d.index;break;case'shape-kind':m.kind=d.value;break;case'shape-mark':toggle(m.marks[m.shape][m.kind],+d.index);break;
case'balance-add':m[d.side]=Math.max(0,Math.min(20,m[d.side]+ +d.delta));m.released=false;break;case'balance-release':if(['level','left','right'].includes(m.guess)&&m.runs.length<100){m.runs.push({left:m.left,right:m.right,guess:m.guess});m.released=true;}break;
case'unknown-check':m.checked=true;break;case'reason-jump':if(m.jumps<5){m.jumps++;m.position++;}break;
case'join-units':if(!m.joined){m.joined=true;m.tens=3;m.ones=15;}break;case'exchange':if(m.joined&&m.ones>=10){m.tens++;m.ones-=10;m.swaps++;}break;
case'join-pairs':if(m.examples.length<20&&!m.examples.some(x=>same(x,[m.a,m.b])))m.examples.push([m.a,m.b]);break;case'proof-step':if(!m.chain.includes(d.value))m.chain.push(d.value);else m.chain=m.chain.filter(x=>x!==d.value);break;case'counter-build':m.counterBuilt=true;break;
}}
