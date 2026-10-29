import{number,five,median}from'./b20-model.js';
export {number};
export const TYPES=new Set(['x-statcentre','x-meandistance','x-distribution','x-statbrief','x-digitalsets','x-mediarepair','x-samplelab','x-estimate']);
const cp=x=>structuredClone(x),same=(a,b)=>JSON.stringify(a)===JSON.stringify(b),txt=x=>typeof x==='string'&&x.length<=1500,int=(v,a,z)=>Number.isInteger(v)&&v>=a&&v<=z,eq=(a,b)=>Number.isFinite(a)&&Math.abs(a-b)<1e-7;
export function stats(v){const sum=v.reduce((s,n)=>s+n,0),mean=sum/v.length,ordered=[...v].sort((a,b)=>a-b),frequencies=new Map();v.forEach(n=>frequencies.set(n,(frequencies.get(n)||0)+1));const max=Math.max(...frequencies.values()),modes=max===1?[]:[...frequencies].filter(([,n])=>n===max).map(([n])=>n).sort((a,b)=>a-b),s=five(v);return{n:v.length,sum,mean,median:median(ordered),modes,range:s[4]-s[0],q1:s[1],q3:s[3],iqr:s[3]-s[1],mad:v.reduce((s,n)=>s+Math.abs(n-mean),0)/v.length,min:s[0],max:s[4]};}
export const near=(s,n,places=8)=>eq(number(s),Math.round(n*10**places)/10**places);
const scalar=['from','to','amount','guess','value','total','anchor','distance','lowA','highA','lowB','highB','outlier','index','pair','who','attribute','method','unit','center','spread','scope','reason','choice','axis','headline','n','k','population','rate','estimate','precision','target','report','prose'];
export const fields=t=>({...Object.fromEntries(scalar.map(k=>[k,''])),answers:Array(t.questions?.length||0).fill(''),metrics:Array(t.metrics?.length||0).fill(''),heights:Array((t.a?.length||0)*2).fill('')});
export function population(t){return Array.from({length:t.N},(_,i)=>({id:i+1,group:i<t.N/2?'A':'B',club:i<t.N/4,value:t.profile==='exercise'?(i<t.N/4?5+i%4:i%4):t.profile==='sleep'?6+i%6:(i%10<3?1:0)}));}
export function draw(t,seed,n,method){const ps=population(t).filter(p=>method!=='club'||p.club),pool=ps.map(p=>p.id),ids=[];for(let i=0;i<n;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;const j=i+Math.floor(seed/4294967296*(pool.length-i));[pool[i],pool[j]]=[pool[j],pool[i]];ids.push(pool[i]);}return{seed,ids,values:ids.map(id=>populationValue(t,id)),n,method};}
const populationValue=(t,id)=>t.profile==='exercise'?(id-1<t.N/4?5+(id-1)%4:(id-1)%4):t.profile==='sleep'?6+(id-1)%6:((id-1)%10<3?1:0);
export const round1=n=>Math.round((n+Number.EPSILON)*10)/10;
export const sampleValue=(t,r)=>r.values.reduce((s,n)=>s+n,0)/r.n*(t.mode==='proportion'?100:1);
function board(t){const c={first:{},cursor:0};switch(t.type){
 case'x-statcentre':return{...c,values:cp(t.values),piles:cp(t.values),order:[],changed:false,started:false,total:null,moves:0};
 case'x-meandistance':return{...c,anchor:null,distances:t.values.map(()=>null)};
 case'x-distribution':return{...c,a:cp(t.a),b:cp(t.b),swapped:false,marked:false};
 case'x-statbrief':return{...c,saved:null};
 case'x-digitalsets':return{...c,heights:null};
 case'x-mediarepair':return{...c,axis:90,seen:[90],decisions:[],saved:null};
 case'x-samplelab':return{...c,seed:t.seed,pending:null,runs:[]};
 case'x-estimate':return{...c,parts:0,total:null,saved:false};
 }}
export const initial=t=>({...fields(t),board:board(t),history:[],issue:''});
const actions=new Set(['reset','put','undo','start','change','transfer','whole','missing','anchor','distance','row','mark','swap','report','build','axis','handle','headline','draw','record','expand','estimate']);
const fvalid=(t,f)=>f&&Object.keys(fields(t)).every(k=>Array.isArray(fields(t)[k])?Array.isArray(f[k])&&f[k].length===fields(t)[k].length&&f[k].every(txt):txt(f[k]));
const actionFields={reset:[],put:[],undo:[],start:['guess'],change:[],transfer:['from','to','amount'],whole:['total'],missing:['value'],anchor:['anchor'],distance:['distance'],row:[],mark:['lowA','highA','lowB','highB','outlier'],swap:[],report:['who','attribute','method','unit','pair','center','spread','n','outlier','scope','reason','prose'],build:['heights'],axis:['axis'],handle:['choice'],headline:['scope','headline','precision','n','k'],draw:[],record:['estimate'],expand:[],estimate:['target','population','n','rate','estimate','precision','scope']};
const compactValid=(t,e)=>{const keys=actionFields[e.a];return e.f&&keys&&Object.keys(e.f).length===keys.length&&keys.every(k=>Array.isArray(fields(t)[k])?Array.isArray(e.f[k])&&e.f[k].length===fields(t)[k].length&&e.f[k].every(txt):txt(e.f[k]));};
const serial=(t,e)=>e&&actions.has(e.a)&&(compactValid(t,e)||fvalid(t,e.f))&&e.d&&Object.entries(e.d).every(([k,v])=>['index'].includes(k)&&txt(v));
const first=(b,a,f)=>{b.first[a+'-'+b.cursor]??=cp(f);};
const totals=t=>({total:t.targetMean*t.targetCount,missing:t.targetMean*t.targetCount-t.values.reduce((s,n)=>s+n,0)});
export const metricValues=(t,b)=>{const s=stats(b.values);return(t.metrics||[]).map(k=>k==='mode'?s.modes.join(','):k==='total'||k==='missing'?totals(t)[k]:s[k]);};
const rightMetrics=(t,m)=>(t.metrics||[]).every((k,i)=>k==='mode'?same(m.metrics[i].split(/[,，、\s]+/).filter(Boolean).map(number).sort((a,b)=>a-b),stats(m.board.values).modes):near(m.metrics[i],metricValues(t,m.board)[i],8));
function apply(t,b,e){const{a,f,d}=e,n=k=>number(f[k]),i=number(d.index);let issue='';const fail=s=>issue=s;first(b,a,f);
 if(a==='reset'){const v=board(t);v.first=cp(b.first);return{board:v,issue};}
 if(a==='row'&&int(i,0,(t.values?.length||0)-1))b.cursor=i;
 if(t.type==='x-statcentre'){
  if(a==='put'&&int(i,0,t.values.length-1)&&!b.order.includes(i))b.order.push(i);
  if(a==='undo')b.order.pop();
  if(a==='start'&&['up','down','same','unknown'].includes(f.guess)){b.started=true;}
  if(a==='change'&&b.started&&!b.changed){const target=t.mode==='append'?t.append:t.change[1],old=t.mode==='append'?stats(t.values).mean:t.values[t.change[0]],direction=target>old?'up':target<old?'down':'same';if(t.mode==='append')b.values.push(t.append);else b.values[t.change[0]]=t.change[1];b.changed=true;if(b.first['start-0'].guess!==direction)fail('记录改变后再比较总量与份数。最初的猜想也保留，可以看它哪里需要调整。');}
  if(a==='transfer'){const from=n('from'),to=n('to'),amt=n('amount');if(int(from,0,b.piles.length-1)&&int(to,0,b.piles.length-1)&&from!==to&&amt>0&&amt<=b.piles[from]&&eq(amt/(t.step||1),Math.round(amt/(t.step||1)))){b.piles[from]-=amt;b.piles[to]+=amt;b.moves++;}else fail('从一堆拿出有的数量，交给另一堆；总量保持不变。');}
  if(a==='whole'&&n('total')>=0&&n('total')<=10000)b.total=n('total');
  if(a==='missing'&&n('value')>=0&&n('value')<=10000)b.values=[...t.values,n('value')];
 }
 if(t.type==='x-meandistance'){
  if(a==='anchor'){if(eq(n('anchor'),stats(t.values).mean))b.anchor=n('anchor');else fail('先把全部值相加，再按记录份数平均。共同位置不是随便选的点。');}
  if(a==='distance'&&b.anchor!==null&&n('distance')>=0&&n('distance')<=1000){b.distances[b.cursor]=n('distance');const next=b.distances.indexOf(null);if(next>=0)b.cursor=next;}
 }
 if(t.type==='x-distribution'){
  if(a==='mark')b.marked=Object.fromEntries(['lowA','highA','lowB','highB','outlier'].map(k=>[k,Number.isFinite(n(k))?n(k):null]));
  if(a==='swap'&&t.swap){b.a=cp(t.alternate[0]);b.b=cp(t.alternate[1]);b.swapped=true;b.marked=false;}
 }
 if(t.type==='x-statbrief'&&a==='report')b.saved={who:f.who,attribute:f.attribute,method:f.method,unit:f.unit,pair:f.pair,center:f.center,spread:f.spread,n:f.n,outlier:f.outlier,scope:f.scope,reason:f.reason,prose:f.prose};
 if(t.type==='x-digitalsets'&&a==='build')b.heights=f.heights.map(number);
 if(t.type==='x-mediarepair'){
  if(a==='axis'&&[0,90].includes(n('axis'))){b.axis=n('axis');if(!b.seen.includes(b.axis))b.seen.push(b.axis);}
  if(a==='handle'&&b.cursor<t.records?.length){b.decisions[b.cursor]=f.choice;if(f.choice!==t.records[b.cursor].answer)fail('处理远点要靠原文件或背景；不能因为不合群就删，也不能没有凭据硬改。');else b.cursor++;}
  if(a==='headline')b.saved={scope:f.scope,headline:f.headline,precision:f.precision,n:f.n,k:f.k};
 }
 if(t.type==='x-samplelab'){
  if(a==='draw'&&!b.pending&&b.runs.length<t.runs){const n=t.sizes?.[b.runs.length]||t.n,method=t.methods[Math.min(b.runs.length,t.methods.length-1)];const r=draw(t,b.seed,n,method);b.seed=r.seed;b.pending=r;}
  if(a==='record'&&b.pending){const target=round1(sampleValue(t,b.pending));if(eq(n('estimate'),target)){b.runs.push({...cp(b.pending),estimate:n('estimate')});b.pending=null;}else fail('使用这一次抽到的记录：总量÷份数。比例再乘100%，按一位小数记录；不要沿用上一次的结果。');}
 }
 if(t.type==='x-estimate'){
  if(a==='expand'&&t.mode==='count'&&b.parts<t.N/t.n){b.parts++;b.total=b.parts*t.k;}
  if(a==='estimate')b.saved={target:f.target,population:f.population,n:f.n,rate:f.rate,estimate:f.estimate,precision:f.precision,scope:f.scope};
 }
 return{board:b,issue};
}
export function act(t,m,action,data={}){const e={a:action.replace(/^b21-/,''),d:Object.fromEntries(Object.entries(data).filter(([k])=>k==='index').map(([k,v])=>[k,String(v)])),f:Object.fromEntries((actionFields[action.replace(/^b21-/,'')]||[]).map(k=>[k,cp(m[k])]))};if(!serial(t,e)||m.history.length>=600)return m;const r=apply(t,cp(m.board),e);m.board=r.board;m.issue=r.issue;m.history.push(e);return m;}
export function field(t,m,key){const root=key.split('.')[0];if(root in fields(t)&&!Array.isArray(m[root]))m[root]=String(m[root]??'');}
export function valid(t,m){try{if(!m||!fvalid(t,m)||!txt(m.issue)||!Array.isArray(m.history)||m.history.length>600||!m.history.every(e=>serial(t,e)))return false;let b=board(t);for(const e of m.history)b=apply(t,b,e).board;return same(b,m.board);}catch{return false;}}
const qs=(t,m)=>(t.questions||[]).every((q,i)=>Array.isArray(q.value)?q.value.includes(m.answers[i]):near(m.answers[i],number(q.value),8));
export const heights=t=>[...t.a.map(n=>t.mode==='ordinal'?100*n/stats(t.a).sum:n),...t.b.map(n=>t.mode==='ordinal'?100*n/stats(t.b).sum:n)];
export function inspect(t,m){const b=m.board;let ok=false,hint='让操作、原记录和这次结论互相对得上。';
 if(t.type==='x-statcentre'){const s=stats(t.values);ok=t.mode==='level'?b.moves>0&&b.piles.every(n=>eq(n,s.mean)):t.mode==='change'||t.mode==='append'?b.changed:t.mode==='missing'?b.total===totals(t).total&&b.values.length===t.targetCount&&b.values.at(-1)===totals(t).missing:b.order.length===t.values.length&&b.order.every((id,i)=>i===0||t.values[b.order[i-1]]<=t.values[id]);ok=ok&&rightMetrics(t,m);hint='先做出同总量的均分或完整排队。中间位置要看排序；最常出现要算次数；最大最小之差才是一个距离。';}
 if(t.type==='x-meandistance'){const s=stats(t.values);ok=b.anchor!==null&&b.distances.every((n,i)=>n!==null&&eq(n,Math.abs(t.values[i]-s.mean)))&&eq(number(m.value),s.mad);hint='距离不带正负，等于共同位置的那条距离是0，但仍算一份。最后把所有距离再平均。';}
 if(t.type==='x-distribution'){const a=stats(b.a),z=b.b?stats(b.b):null,p=b.marked;ok=!!p&&(t.mode==='cluster'?['lowA','highA','outlier']:['lowA','highA','lowB','highB']).every(k=>eq(number(m[k]),p[k]))&&(t.mode==='cluster'?p.lowA<=t.cluster[0]&&p.lowA>=.2&&p.highA>=t.cluster[1]&&p.highA<=.5&&eq(p.outlier,t.unusual):eq(p.lowA,a.min)&&eq(p.highA,a.max)&&eq(p.lowB,z.min)&&eq(p.highB,z.max))&&(!t.swap||b.swapped);hint='比较需要同一把尺，既看位置也看散开。先用端点留下你读到的范围；原因还需要额外证据。';}
 if(t.type==='x-statbrief'){const s=stats(t.values),p=b.saved;ok=!!p&&p.who==='who'&&p.attribute==='attribute'&&p.method==='method'&&p.unit===t.unit&&(t.allowedPairs||[t.pair]).includes(p.pair)&&number(p.n)===t.values.length&&near(p.center,p.pair==='median'?s.median:s.mean)&&near(p.spread,p.pair==='median'?s.iqr:s.mad)&&(!t.allowedPairs||p.reason===(p.pair==='median'?'middle':'all'))&&p.scope==='records'&&(!t.unusual||eq(number(p.outlier),t.unusual))&&['who','attribute','method','unit','pair','center','spread','n','outlier','scope','reason'].every(k=>p[k]===m[k]);hint='交代几份、量了什么、怎么量和单位，再放上一对匹配的中心与散开程度。只写平均14会丢掉背景。';}
 if(t.type==='x-digitalsets'){ok=!!b.heights&&b.heights.every((n,i)=>eq(n,heights(t)[i])&&eq(n,number(m.heights[i])))&&m.axis==='same'&&(t.mode!=='ordinal'||m.choice==='ordered');hint='两组用同一零点和刻度。人数不同的等级比较先换比例，类别按同一顺序对齐，不能任意重排等级。';}
 if(t.type==='x-mediarepair'){ok=t.mode==='axis'?b.seen.includes(0)&&b.seen.includes(90):t.mode==='context'?b.cursor===t.records.length&&t.records.every((r,i)=>b.decisions[i]===r.answer):!!b.saved&&b.saved.scope==='sample'&&b.saved.headline==='bounded'&&b.saved.precision==='limited'&&number(b.saved.n)===t.n&&number(b.saved.k)===t.k&&['scope','headline','precision','n','k'].every(k=>b.saved[k]===m[k]);hint='查看轴的起点、到底问了谁、样本怎样选。标题只说记录支持的范围；异常记录凭证据处理。';}
 if(t.type==='x-samplelab'){ok=b.runs.length===t.runs&&!b.pending;if(ok&&t.compareSizes){const a=b.runs.slice(0,5).map(r=>r.estimate),z=b.runs.slice(5).map(r=>r.estimate);ok=near(m.lowA,Math.min(...a))&&near(m.highA,Math.max(...a))&&near(m.lowB,Math.min(...z))&&near(m.highB,Math.max(...z));}hint='每次抽完，按这一份记录计算，再放回整个总体重新抽。所有实际抽到的编号会保存，结果不同不等于做错。';}
 if(t.type==='x-estimate'){const p=b.saved;ok=!!p&&number(p.population)===t.N&&number(p.n)===t.n&&p.target==='population'&&p.precision==='approx'&&p.scope===(t.validSample===false?'invalid':'random')&&(t.mode==='mean'?eq(number(p.estimate),t.mean):b.parts===t.N/t.n&&eq(number(p.rate),t.k/t.n)&&eq(number(p.estimate),t.N*t.k/t.n))&&['target','population','n','rate','estimate','precision','scope'].every(k=>p[k]===m[k]);hint='比例放大得到估计，不是精确清点。样本平均估计的是总体平均；选人方法若不合适，数字能算也不能放心推广。';}
 ok=ok&&qs(t,m);return{correct:!!ok,feedback:ok?'这次操作与记录对上了。别忘了结论能说到哪里。':hint,evidence:{kind:'B21 bounded statistical reasoning',board:cp(b),history:cp(m.history),fields:Object.fromEntries(Object.keys(fields(t)).map(k=>[k,cp(m[k])])),freeTextMeaningAssessed:false,generalMasteryAssessed:false,realSurveyAssessed:false}};
}
export function solveSteps(t){const ss=[],f=(field,value)=>value!==''&&ss.push({field,value:String(value)}),a=(action,data={})=>ss.push({action:'b21-'+action,data});
 if(t.type==='x-statcentre'){
  if(['sort','quartile'].includes(t.mode))t.values.map((v,i)=>[v,i]).sort((a,b)=>a[0]-b[0]).forEach(([,index])=>a('put',{index}));
  if(t.mode==='change'||t.mode==='append'){const old=t.mode==='append'?stats(t.values).mean:t.values[t.change[0]],to=t.mode==='append'?t.append:t.change[1];f('guess',to>old?'up':to<old?'down':'same');a('start');a('change');}
  if(t.mode==='level'){const piles=[...t.values],mean=stats(t.values).mean;for(let i=0;i<piles.length;i++)while(piles[i]>mean+1e-8){const j=piles.findIndex(v=>v<mean-1e-8),n=Math.min(piles[i]-mean,mean-piles[j]);f('from',i);f('to',j);f('amount',n);a('transfer');piles[i]-=n;piles[j]+=n;}}
  if(t.mode==='missing'){f('total',totals(t).total);a('whole');f('value',totals(t).missing);a('missing');}
  let b=board(t);if(t.mode==='change')b.values[t.change[0]]=t.change[1];if(t.mode==='append')b.values.push(t.append);metricValues(t,b).forEach((v,i)=>f('metrics.'+i,typeof v==='number'?Math.round(v*1e8)/1e8:v));
 }
 if(t.type==='x-meandistance'){const s=stats(t.values);f('anchor',s.mean);a('anchor');t.values.forEach(n=>{f('distance',Math.abs(n-s.mean));a('distance');});f('value',s.mad);}
 if(t.type==='x-distribution'){if(t.swap)a('swap');const av=t.swap?t.alternate[0]:t.a,bv=t.swap?t.alternate[1]:t.b;f('lowA',t.cluster?.[0]??stats(av).min);f('highA',t.cluster?.[1]??stats(av).max);if(bv){f('lowB',stats(bv).min);f('highB',stats(bv).max);}if(t.unusual)f('outlier',t.unusual);a('mark');}
 if(t.type==='x-statbrief'){const s=stats(t.values);for(const[k,v]of Object.entries({who:'who',attribute:'attribute',method:'method',unit:t.unit,pair:t.pair,n:t.values.length,center:t.pair==='median'?s.median:s.mean,spread:t.pair==='median'?s.iqr:s.mad,scope:'records',reason:t.allowedPairs?'middle':'',outlier:t.unusual||''}))f(k,v);a('report');}
 if(t.type==='x-digitalsets'){f('axis','same');if(t.mode==='ordinal')f('choice','ordered');heights(t).forEach((v,i)=>f('heights.'+i,v));a('build');}
 if(t.type==='x-mediarepair'){if(t.mode==='axis'){f('axis',0);a('axis');}else if(t.mode==='context')t.records.forEach(r=>{f('choice',r.answer);a('handle');});else{for(const[k,v]of Object.entries({n:t.n,k:t.k,scope:'sample',headline:'bounded',precision:'limited'}))f(k,v);a('headline');}}
 if(t.type==='x-samplelab'){let seed=t.seed;const samples=[];for(let j=0;j<t.runs;j++){const r=draw(t,seed,t.sizes?.[j]||t.n,t.methods[Math.min(j,t.methods.length-1)]);seed=r.seed;samples.push(round1(sampleValue(t,r)));a('draw');f('estimate',round1(sampleValue(t,r)));a('record');}if(t.compareSizes){f('lowA',Math.min(...samples.slice(0,5)));f('highA',Math.max(...samples.slice(0,5)));f('lowB',Math.min(...samples.slice(5)));f('highB',Math.max(...samples.slice(5)));}}
 if(t.type==='x-estimate'){for(const[k,v]of Object.entries({target:'population',population:t.N,n:t.n,rate:t.mode==='count'?t.k+'/'+t.n:'',estimate:t.mode==='mean'?t.mean:t.N*t.k/t.n,precision:'approx',scope:t.validSample===false?'invalid':'random'}))f(k,v);if(t.mode==='count')for(let j=0;j<t.N/t.n;j++)a('expand');a('estimate');}
 (t.questions||[]).forEach((q,i)=>f('answers.'+i,Array.isArray(q.value)?q.value[0]:q.value));return ss;
}
export function example(t){const m=initial(t);for(const s of solveSteps(t))if(s.field){const p=s.field.split('.');if(p.length===2)m[p[0]][+p[1]]=s.value;else m[s.field]=s.value;field(t,m,s.field);}else act(t,m,s.action,s.data);return m;}
