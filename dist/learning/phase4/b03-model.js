import{int,ids,shape,same,near,fractionValue,outcome}from'./common.js';
import{toggle}from'./ui.js';
export const TYPES=new Set(['x-circlecut','x-mosaic','x-fraction','x-foldpaper','x-fgroups','x-fline','x-fwall','x-hundredsplit','x-decvalue','x-scale','x-ratio']);
const colors=a=>Array.isArray(a)&&a.length===16&&a.every(n=>int(n,-1,3));
const equal=a=>colors(a)&&[0,1,2,3].every(c=>a.filter(v=>v===c).length===4);
const canonical=a=>{const seen=[];return a.map(c=>{if(!seen.includes(c))seen.push(c);return seen.indexOf(c);});};
const direction=t=>t.n<t.d?'shorter':t.n>t.d?'longer':'same';
const classes=t=>t.n===1&&t.d>1?['unit','proper']:t.n<t.d?['proper']:['improper'];
export function initial(t){switch(t.type){
case'x-circlecut':return{cuts:[90,180],den:null};
case'x-mosaic':return{cells:Array(16).fill(-1),color:0,saved:[],den:null,why:''};
case'x-fraction':return{den:1,selected:[],n:null,d:null,top:'',bottom:'',classes:[],whole:null,remainder:null};
case'x-foldpaper':return{folds:0,history:[],labels:[null,null,null]};
case'x-fgroups':return{groups:Array(t.count).fill(-1),group:0,take:null,answer:null};
case'x-fline':return{parts:t.read?t.d:1,mark:t.read?t.n:0,jumps:[],unitDen:null,n:null,d:null};
case'x-fwall':return{counts:t.denominators.map(()=>0),names:t.denominators.map(()=>''),equal:''};
case'x-hundredsplit':return{parts:1,den:null,count:3,visited:[3],final:null};
case'x-decvalue':return{ones:0,selected:[],decimal:'',fraction:'',percent:null,digits:[null,null,null]};
case'x-scale':return{n:1,d:1,prediction:'',runs:[],applied:false,reason:''};
case'x-ratio':return{a:0,b:0,value:1,left:null,right:null,view:'bar',visited:['bar'],preferred:'',why:''};
}}
export function valid(t,m){if(!shape(m,initial(t)))return false;switch(t.type){
case'x-circlecut':return m.cuts.length===2&&m.cuts.every(v=>int(v,1,359));
case'x-mosaic':return colors(m.cells)&&int(m.color,0,3)&&m.saved.length<=20&&m.saved.every(colors);
case'x-fraction':return int(m.den,1,12)&&ids(m.selected,m.den*(t.n>t.d?2:1))&&m.classes.length<=3&&new Set(m.classes).size===m.classes.length&&m.classes.every(c=>['unit','proper','improper'].includes(c));
case'x-foldpaper':return int(m.folds,0,3)&&same(m.history,Array.from({length:m.folds},(_,i)=>2**(i+1)))&&m.labels.length===3&&m.labels.every(v=>v===null||int(v,0,100));
case'x-fgroups':return m.groups.length===t.count&&m.groups.every(v=>int(v,-1,t.groups-1))&&int(m.group,0,t.groups-1);
case'x-fline':return int(m.parts,1,12)&&int(m.mark,0,m.parts)&&m.jumps.length<=100&&m.jumps.every(v=>int(v,0,12));
case'x-fwall':return m.counts.length===t.denominators.length&&m.counts.every((n,i)=>int(n,0,t.denominators[i]))&&m.names.length===m.counts.length&&m.names.every(s=>typeof s==='string'&&s.length<=40);
case'x-hundredsplit':return int(m.parts,1,10)&&int(m.count,3,12)&&same(m.visited,Array.from({length:m.count-2},(_,i)=>3+i));
case'x-decvalue':return int(m.ones,0,3)&&ids(m.selected,100)&&m.digits.length===3&&m.digits.every(v=>v===null||int(v,0,9));
case'x-scale':return int(m.n,0,12)&&int(m.d,1,12)&&m.runs.length<=100&&m.runs.every(r=>int(r.n,0,12)&&int(r.d,1,12)&&['shorter','longer','same'].includes(r.prediction));
case'x-ratio':return int(m.a,0,10)&&int(m.b,0,10)&&int(m.value,1,10)&&m.visited.length<=3&&m.visited.every(s=>['bar','table','line'].includes(s));
}return false;}
export function inspect(t,m){let ok=false,help='';switch(t.type){
case'x-circlecut':ok=m.cuts[0]===120&&m.cuts[1]===240&&m.den===3;help='三块要一样大。比较三片的张开角度，不只数出了几片。';break;
case'x-mosaic':ok=equal(m.cells)&&m.saved.some(a=>equal(a)&&!same(canonical(a),canonical(m.cells)))&&m.den===4;help='每种颜色都要占 4 格。保存一种分法，再画不同的分界；只换颜色名字不算新的分法。';break;
case'x-fraction':ok=m.den===t.d&&m.selected.length===t.n&&m.n===t.n&&m.d===t.d&&(!t.classify||(m.top==='taken'&&m.bottom==='whole'&&same([...m.classes].sort(),classes(t).sort())))&&(!t.mixed||(m.whole===Math.floor(t.n/t.d)&&m.remainder===t.n%t.d));help='先把一个整体平均分成要求的份数，再取足小份。上面的数数取了几份，下面的数管一个整体分几份；只取一份且不到整体，同时属于前两类。';break;
case'x-foldpaper':ok=m.folds===3&&same(m.labels,[2,4,8]);help='每次对折会把所有小份再一分为二。摊开后的份数会怎样改变？';break;
case'x-fgroups':ok=Array.from({length:t.groups},(_,i)=>m.groups.filter(g=>g===i).length).every(n=>n===t.count/t.groups)&&int(m.take,0,t.groups-1)&&m.answer===t.count/t.groups;help='全部珠子都要分进去，而且每组一样多。三分之一是三组中的一组，不是固定的三颗。';break;
case'x-fline':ok=m.parts===t.d&&m.mark===t.n&&m.unitDen===(t.end===.1?100:t.d)&&m.n===t.n&&m.d===(t.end===.1?100:t.d)&&(t.read||m.jumps.includes(t.n));help='先确定右端代表 1 还是 1/10，再数等长间隔。每走一段增加一个单位份，刻度点数不等于段数。';break;
case'x-fwall':ok=m.counts.every((n,i)=>n===(t.unequal?t.n:t.n/t.d*t.denominators[i]))&&m.names.every((s,i)=>near(fractionValue(s),m.counts[i]/t.denominators[i]))&&m.equal===(t.unequal?'no':'yes');help='每条纸的整体一样长。先按要求涂，再看末端是否对齐；只把总份数翻倍而不增加所取份数，量会减半。';break;
case'x-hundredsplit':ok=m.parts===10&&m.den===100&&m.count===12&&m.final===12;help='整个纸带先分十条，每条再分十小格。数到 10 小格只是十分之一，还能继续 11、12 小格。';break;
case'x-decvalue':ok=m.ones*100+m.selected.length===t.cents&&near(Number(m.decimal),t.cents/100)&&near(fractionValue(m.fraction),t.cents/100)&&m.percent===t.cents&&same(m.digits,[Math.floor(t.cents/100),Math.floor(t.cents%100/10),t.cents%10]);help='先搭出量，再按个位、十分位、百分位读。百分数是相对于一整个百格的份数，超过整体也可以大于 100%。';break;
case'x-scale':{const r=m.runs.at(-1);ok=m.applied&&m.n===t.n&&m.d===t.d&&r?.n===t.n&&r?.d===t.d&&r?.prediction===direction(t)&&m.reason===(t.n<t.d?'below':t.n>t.d?'above':'one');help='把倍数调到题目要求，再留下预测并试。和 1 比倍数，而不是只看乘法这个符号。错误预测会保留，可以重新预测再试。';break;}
case'x-ratio':ok=m.a===t.a&&m.b===t.b&&m.value*(m.a+m.b)===t.total&&m.left===t.a*m.value&&m.right===t.b*m.value&&(!t.compare||(m.visited.length===3&&m.preferred==='table'));help='两行的每小块一样大。先数总共几块，再让总量对上；表格最方便查准确数，条形和双数轴有不同用途。';break;
}return outcome(ok,help);}
export function example(t){const m=initial(t);switch(t.type){
case'x-circlecut':m.cuts=[120,240];m.den=3;break;
case'x-mosaic':m.saved=[Array.from({length:16},(_,i)=>Math.floor(i/4))];m.cells=[0,0,0,0,1,1,2,2,1,1,2,2,3,3,3,3];m.den=4;break;
case'x-fraction':Object.assign(m,{den:t.d,selected:Array.from({length:t.n},(_,i)=>i),n:t.n,d:t.d,top:'taken',bottom:'whole',classes:classes(t),whole:Math.floor(t.n/t.d),remainder:t.n%t.d});break;
case'x-foldpaper':m.folds=3;m.history=[2,4,8];m.labels=[2,4,8];break;
case'x-fgroups':m.groups=m.groups.map((_,i)=>i%t.groups);m.take=0;m.answer=t.count/t.groups;break;
case'x-fline':Object.assign(m,{parts:t.d,mark:t.n,jumps:Array.from({length:t.n},(_,i)=>i+1),unitDen:t.end===.1?100:t.d,n:t.n,d:t.end===.1?100:t.d});break;
case'x-fwall':m.counts=t.denominators.map(d=>t.unequal?t.n:t.n/t.d*d);m.names=m.counts.map((n,i)=>n+'/'+t.denominators[i]);m.equal=t.unequal?'no':'yes';break;
case'x-hundredsplit':Object.assign(m,{parts:10,den:100,count:12,visited:Array.from({length:10},(_,i)=>i+3),final:12});break;
case'x-decvalue':Object.assign(m,{ones:Math.floor(t.cents/100),selected:Array.from({length:t.cents%100},(_,i)=>i),decimal:String(t.cents/100),fraction:t.cents+'/100',percent:t.cents,digits:[Math.floor(t.cents/100),Math.floor(t.cents%100/10),t.cents%10]});break;
case'x-scale':Object.assign(m,{n:t.n,d:t.d,prediction:direction(t),runs:[{n:t.n,d:t.d,prediction:direction(t)}],applied:true,reason:t.n<t.d?'below':t.n>t.d?'above':'one'});break;
case'x-ratio':Object.assign(m,{a:t.a,b:t.b,value:t.total/(t.a+t.b),left:t.a*t.total/(t.a+t.b),right:t.b*t.total/(t.a+t.b),visited:['bar','table','line'],preferred:'table'});break;
}return m;}
export function field(t,m,key){if(key==='den'&&t.type==='x-fraction')m.selected=[];if(key==='parts'&&t.type==='x-fline'&&!t.read){m.mark=0;m.jumps=[];}if(t.type==='x-scale'&&['n','d'].includes(key))m.applied=false;}
export function act(t,m,a,d){switch(a){
case'paint-color':m.color=+d.index;break;case'paint':m.cells[+d.index]=m.color;break;case'save-mosaic':if(equal(m.cells)&&m.saved.length<20&&!m.saved.some(x=>same(x,m.cells)))m.saved.push([...m.cells]);break;
case'fraction-cell':toggle(m.selected,+d.index);break;case'fraction-class':toggle(m.classes,d.value);break;
case'fold-paper':if(m.folds<3){m.folds++;m.history.push(2**m.folds);}break;
case'group-select':m.group=+d.index;break;case'group-token':m.groups[+d.index]=m.group;break;case'take-group':m.take=+d.index;break;
case'jump':if(m.mark<m.parts){m.mark++;m.jumps.push(m.mark);}break;case'zero':m.mark=0;m.jumps=[];break;
case'wall-cell':m.counts[+d.row]=+d.index+1===m.counts[+d.row]?0:+d.index+1;break;
case'count-hundred':if(m.count<12){m.count++;m.visited.push(m.count);}break;
case'dec-cell':toggle(m.selected,+d.index);break;case'dec-row':m.selected.push(...Array.from({length:100},(_,i)=>i).filter(i=>!m.selected.includes(i)).slice(0,10));break;
case'scale-try':if(['shorter','longer','same'].includes(m.prediction)&&m.runs.length<100){m.runs.push({n:m.n,d:m.d,prediction:m.prediction});m.applied=true;}break;
case'ratio-block':m[d.row]=Math.max(0,Math.min(10,m[d.row]+ +d.delta));break;case'ratio-view':m.view=d.value;if(!m.visited.includes(d.value))m.visited.push(d.value);break;
}}
