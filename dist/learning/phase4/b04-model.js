import{int,shape,same,near,outcome}from'./common.js';
export const TYPES=new Set(['x-sort','x-questionsort','x-questionbuild','x-chartlab','x-variable','x-likelihood','x-experiment','x-spinner','x-simulation']);
export const likelihoodEvents=[['袋中没有绿珠，抽到绿珠',0],['袋中 1 红 3 蓝，抽到红珠',1],['袋中 2 红 2 蓝，抽到红珠',2],['袋中 3 红 1 蓝，抽到红珠',3],['袋里全是红珠，抽到红珠',4]];
export const statisticalQuestions=[['我现在多高？','fixed'],['这些孩子的身高怎样分布？','vary'],['三月有几天？','fixed'],['一群孩子通常各睡几小时？','vary'],['这个班一共有几个人？','fixed'],['我一周里每天阅读多久？','vary']];
export const countsOf=(t)=>t.labels.map((_,i)=>t.items.filter(o=>o[t.rule]===i).length);
const seed=()=>Math.floor(Math.random()*4294967295)+1;
export function randoms(s,n,weights){let x=s>>>0;const sum=weights.reduce((a,b)=>a+b,0),out=[];for(let i=0;i<n;i++){x^=x<<13;x^=x>>>17;x^=x<<5;x>>>=0;let u=x/4294967296*sum,j=0;while(j<weights.length-1&&u>=weights[j]){u-=weights[j];j++;}out.push(j);}return out;}
export const tally=(draws,k)=>Array.from({length:k},(_,i)=>draws.filter(x=>x===i).length);
export const simRun=(s,n,index)=>{const start=((s+Math.imul(index+1,2654435761))>>>0)||1;return{n,seed:start,hits:randoms(start,n,[1,1,1,1,1,1]).filter(x=>x===5).length};};
export function initial(t){switch(t.type){
case'x-sort':return{bin:0,dest:Array(t.items.length).fill(-1),counts:t.labels.map(()=>null),most:'',fewest:'',order:[]};
case'x-questionsort':return{choices:statisticalQuestions.map(()=>''),reason:''};
case'x-questionbuild':return{population:'',variable:'',expected:'',answerA:'',answerB:'',question:'',why:''};
case'x-chartlab':return{scale:1,heights:t.counts.map(()=>0),view:t.view||'bar',visited:[t.view||'bar'],title:'',x:'',y:'',terms:{tally:'',frequency:'',picture:''},answer:null,difference:null,most:'',preferred:'',reason:'',why:''};
case'x-variable':return{choices:t.labels.map(()=>''),half:''};
case'x-likelihood':return{event:0,places:likelihoodEvents.map(()=>null),shown:false,word:''};
case'x-experiment':return{seed:seed(),guess:null,prediction:null,draws:[],counts:t.labels.map(()=>0),comparison:''};
case'x-spinner':return{seed:seed(),color:0,sectors:Array(t.sectors).fill(-1),prediction:'',runs:[],why:''};
case'x-simulation':return{seed:seed(),sample:'10',runs:[],trend:'',guarantee:'',why:''};
}}
export function valid(t,m){if(!shape({...m,seed:m.seed===undefined?undefined:1},{...initial(t),...(m.seed===undefined?{}:{seed:1})}))return false;const seedOK=()=>int(m.seed,1,4294967295);switch(t.type){
case'x-sort':return int(m.bin,0,t.labels.length-1)&&m.dest.length===t.items.length&&m.dest.every(n=>int(n,-1,t.labels.length-1))&&m.counts.length===t.labels.length&&m.counts.every(v=>v===null||int(v,0,100))&&m.order.length<=t.labels.length&&new Set(m.order).size===m.order.length&&m.order.every(v=>int(v,0,t.labels.length-1));
case'x-questionsort':return m.choices.length===6&&m.choices.every(v=>['','fixed','vary'].includes(v));
case'x-questionbuild':return true;
case'x-chartlab':return int(m.scale,1,10)&&m.heights.length===t.counts.length&&m.heights.every(v=>int(v,0,30))&&m.visited.length<=4&&new Set(m.visited).size===m.visited.length&&m.visited.every(v=>['bar','table','picture','tally'].includes(v));
case'x-variable':return m.choices.length===t.labels.length&&m.choices.every(v=>['','count','measure'].includes(v));
case'x-likelihood':return int(m.event,0,4)&&m.places.length===5&&m.places.every(v=>v===null||int(v,0,4));
case'x-experiment':return seedOK()&&m.draws.length<=t.count&&same(m.draws,randoms(m.seed,m.draws.length,t.weights))&&m.counts.length===t.labels.length&&m.counts.every(v=>int(v,0,t.count));
case'x-spinner':return seedOK()&&int(m.color,0,t.colors-1)&&m.sectors.length===t.sectors&&m.sectors.every(c=>int(c,-1,t.colors-1))&&m.runs.length<=20&&m.runs.every((r,i)=>Array.isArray(r.sectors)&&r.sectors.length===t.sectors&&r.sectors.every(c=>int(c,0,t.colors-1))&&['equal','unequal'].includes(r.prediction)&&same(r.counts,tally(randoms(((m.seed+Math.imul(i+1,2654435761))>>>0)||1,100,tally(r.sectors,t.colors)),t.colors)));
case'x-simulation':return seedOK()&&m.runs.length<=15&&m.runs.every((r,i)=>[10,100,1000].includes(r.n)&&same(r,simRun(m.seed,r.n,i)))&&[10,100,1000].every(n=>m.runs.filter(r=>r.n===n).length<=5);
}return false;}
export function inspect(t,m){let ok=false,help='';switch(t.type){
case'x-sort':{const c=countsOf(t);ok=m.dest.every((v,i)=>v===t.items[i][t.rule])&&same(m.counts,c)&&c[+m.most]===Math.max(...c)&&m.most!==''&&c[+m.fewest]===Math.min(...c)&&m.fewest!==''&&(!t.ordered||(m.order.length===c.length&&m.order.every((v,i)=>i===0||c[m.order[i-1]]>=c[v])));help='每个物品按同一个规则进一组。再数各组，核对总数。数量并列时，先后都可以。';break;}
case'x-questionsort':ok=m.choices.every((v,i)=>v===statisticalQuestions[i][1])&&m.reason==='one-total';help='想的是答案有没有需要研究的变化。“班里有几人”虽提到一群人，仍只问一个固定总数。';break;
case'x-questionbuild':ok=m.population===(t.self?'self-days':'group')&&m.variable===t.variable&&m.expected==='vary'&&m.answerA!==m.answerB&&(t.variable==='sport'?['足球','游泳','羽毛球'].includes(m.answerA)&&['足球','游泳','羽毛球'].includes(m.answerB):['10','20','30'].includes(m.answerA)&&['10','20','30'].includes(m.answerB));help='问题要说清观察谁、记录什么，并允许得到不同结果。一个人的不同日子也能产生一组变化的记录。自由写的解释只保存，不自动判懂。';break;
case'x-chartlab':{const answer=t.topTwo?[...t.counts].sort((a,b)=>b-a).slice(0,2).reduce((a,b)=>a+b):t.purpose==='exact'?t.counts[1]:Math.max(...t.counts)-Math.min(...t.counts);ok=m.scale===t.scale&&m.heights.every((v,i)=>v*m.scale===t.counts[i])&&m.answer===answer&&(!t.diffPair||m.difference===t.counts[t.diffPair[0]]-t.counts[t.diffPair[1]])&&(!t.vocab||(m.title==='preference'&&m.x==='category'&&m.y==='count'&&same(m.terms,{tally:'marks',frequency:'times',picture:'symbols'})&&m.visited.length===4))&&(!t.compare||(m.visited.includes('bar')&&m.visited.includes('table')&&m.most!==''&&t.counts[+m.most]===Math.max(...t.counts)&&['bar','table'].includes(m.preferred)&&m.reason===t.purpose));help='每格代表的量 × 格数才是记录里的数量。换画法也不能换数据。选择画法的理由要对应眼前要回答的问题；不按某个唯一按钮判理解。';break;}
case'x-variable':ok=same(m.choices,t.answers)&&m.half==='height';help='身高可以在两个整数中间，写成整数也没有改变它的性质；宠物只数不能有半只。';break;
case'x-likelihood':ok=m.places.every((v,i)=>v===likelihoodEvents[i][1])&&m.shown&&m.word==='likely';help='没有这种颜色才是不可能，全是这种颜色才是一定。展示一颗蓝珠是专门举出的反例，不是伪装的随机抽取。';break;
case'x-experiment':{const c=tally(m.draws,t.labels.length),actual=c[0],cmp=actual===m.prediction?'same':actual>m.prediction?'higher':'lower';ok=m.prediction!==null&&m.draws.length===t.count&&same(m.counts,c)&&m.comparison===cmp;help='每次结果只记一笔，记录必须和已经发生的结果对应。预测不必准确，最后按这次真实结果比较。';break;}
case'x-spinner':{const c=tally(m.sectors,t.colors),r=m.runs.at(-1),correct=t.target==='equal'?m.sectors.every(v=>v>=0)&&c.every(n=>n===t.sectors/t.colors):c[0]===1&&c[1]===5;ok=correct&&same(r?.sectors,m.sectors)&&r?.prediction===t.target&&m.why==='area';help='检查同色扇区合起来占多少等大份。机会看规则与面积，不要求这 100 次每色恰好一样多。';break;}
case'x-simulation':ok=[10,100,1000].every(n=>m.runs.filter(r=>r.n===n).length===5)&&m.trend==='usually'&&m.guarantee==='no';help='比较比例的散开程度，不比较出现六的总次数。通常更集中，不代表每轮都更接近；五轮只是一次观察，不是证明。';break;
}return outcome(ok,help);}
export function example(t){const m=initial(t);m.seed&&=314159;switch(t.type){
case'x-sort':m.dest=t.items.map(o=>o[t.rule]);m.counts=countsOf(t);m.most=String(m.counts.indexOf(Math.max(...m.counts)));m.fewest=String(m.counts.indexOf(Math.min(...m.counts)));m.order=m.counts.map((_,i)=>i).sort((a,b)=>m.counts[b]-m.counts[a]);break;
case'x-questionsort':m.choices=statisticalQuestions.map(x=>x[1]);m.reason='one-total';break;
case'x-questionbuild':Object.assign(m,{population:t.self?'self-days':'group',variable:t.variable,expected:'vary',answerA:t.variable==='sport'?'足球':'10',answerB:t.variable==='sport'?'游泳':'20'});break;
case'x-chartlab':Object.assign(m,{scale:t.scale,heights:t.counts.map(v=>v/t.scale),title:'preference',x:'category',y:'count',visited:['bar','table','picture','tally'],terms:{tally:'marks',frequency:'times',picture:'symbols'},answer:t.topTwo?[...t.counts].sort((a,b)=>b-a).slice(0,2).reduce((a,b)=>a+b):t.purpose==='exact'?t.counts[1]:Math.max(...t.counts)-Math.min(...t.counts),difference:t.diffPair?t.counts[t.diffPair[0]]-t.counts[t.diffPair[1]]:null,most:String(t.counts.indexOf(Math.max(...t.counts))),preferred:t.purpose==='exact'?'table':'bar',reason:t.purpose||''});break;
case'x-variable':m.choices=[...t.answers];m.half='height';break;
case'x-likelihood':m.places=[0,1,2,3,4];m.shown=true;m.word='likely';break;
case'x-experiment':m.guess=t.count*t.weights[0]/t.weights.reduce((a,b)=>a+b);m.prediction=m.guess;m.draws=randoms(m.seed,t.count,t.weights);m.counts=tally(m.draws,t.labels.length);m.comparison=m.counts[0]===m.prediction?'same':m.counts[0]>m.prediction?'higher':'lower';break;
case'x-spinner':m.sectors=Array.from({length:t.sectors},(_,i)=>t.target==='equal'?i%t.colors:i===0?0:1);m.prediction=t.target;m.runs=[{sectors:[...m.sectors],prediction:m.prediction,counts:tally(randoms(((m.seed+Math.imul(m.runs.length+1,2654435761))>>>0)||1,100,tally(m.sectors,t.colors)),t.colors)}];m.why='area';break;
case'x-simulation':for(const n of [10,100,1000])for(let i=0;i<5;i++)m.runs.push(simRun(m.seed,n,m.runs.length));m.trend='usually';m.guarantee='no';break;
}return m;}
export function act(t,m,a,d){switch(a){
case'sort-bin':m.bin=+d.index;break;case'sort-item':m.dest[+d.index]=m.bin;break;case'sort-order':{const i=+d.index;if(!m.order.includes(i))m.order.push(i);else m.order=m.order.filter(x=>x!==i);break;}
case'chart-view':m.view=d.value;if(!m.visited.includes(d.value))m.visited.push(d.value);break;
case'likely-event':m.event=+d.index;break;case'likely-place':m.places[m.event]=+d.index;break;case'counterexample':m.shown=true;break;
case'experiment-draw':if(m.guess!==null&&m.draws.length<t.count&&same(m.counts,tally(m.draws,t.labels.length))){if(m.prediction===null)m.prediction=m.guess;m.draws=randoms(m.seed,m.draws.length+1,t.weights);}break;
case'experiment-tally':{const i=+d.index;m.counts[i]=Math.max(0,Math.min(t.count,m.counts[i]+ +d.delta));break;}
case'spinner-color':m.color=+d.index;break;case'spinner-sector':m.sectors[+d.index]=m.color;break;
case'spinner-run':if(m.sectors.every(v=>v>=0)&&['equal','unequal'].includes(m.prediction)&&m.runs.length<20)m.runs.push({sectors:[...m.sectors],prediction:m.prediction,counts:tally(randoms(((m.seed+Math.imul(m.runs.length+1,2654435761))>>>0)||1,100,tally(m.sectors,t.colors)),t.colors)});break;
case'simulate':{const n=+m.sample;if([10,100,1000].includes(n)&&m.runs.filter(r=>r.n===n).length<5)m.runs.push(simRun(m.seed,n,m.runs.length));break;}
}}
