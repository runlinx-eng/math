export const TYPES=new Set(['x-eventchart','x-timeplot','x-timetable','x-dotdraw','x-piesector','x-histbuild','x-boxsummary','x-scatterbuild','x-graphcompare','x-correlationlab']);
const cp=x=>structuredClone(x),same=(a,b)=>JSON.stringify(a)===JSON.stringify(b),int=(x,a,z)=>Number.isInteger(x)&&x>=a&&x<=z,txt=x=>typeof x==='string'&&x.length<=1000;
export function number(s){s=String(s).trim();if(!s)return NaN;const m=s.match(/^(-?\d+)\s+(\d+)\/(\d+)$/),f=s.match(/^(-?\d+)\/(\d+)$/);if(m&&+m[3])return +m[1]+Math.sign(+m[1]||1)*(+m[2]/+m[3]);if(f&&+f[2])return +f[1]/+f[2];return /^-?\d+(?:\.\d+)?$/.test(s)?+s:NaN;}
const eq=(a,b)=>Number.isFinite(a)&&Math.abs(a-b)<1e-8;
export const clock=n=>String(Math.floor(n/60)).padStart(2,'0')+':'+String(n%60).padStart(2,'0');
export function events(t){if(!t.random)return t.events;let seed=t.seed;return Array.from({length:t.n},()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return Math.floor(seed/4294967296*t.labels.length);});}
export const counts=(a,ls)=>ls.map((_,i)=>a.filter(v=>v===i).length);
export const median=a=>a.length%2?a[(a.length-1)/2]:(a[a.length/2-1]+a[a.length/2])/2;
export function five(a){const s=[...a].sort((a,b)=>a-b),h=Math.floor(s.length/2);return[s[0],median(s.slice(0,h)),median(s),median(s.slice(-h)),s.at(-1)];}
export const bins=(t,w)=>Array.from({length:(t.end-t.start)/w},(_,i)=>[t.start+i*w,t.start+(i+1)*w]);
export const binOf=(t,v,w)=>v>=t.start&&v<t.end?Math.floor((v-t.start)/w):-1;
export function correlation(ps){const mx=ps.reduce((s,p)=>s+p[0],0)/ps.length,my=ps.reduce((s,p)=>s+p[1],0)/ps.length;let xy=0,xx=0,yy=0;for(const[x,y]of ps){xy+=(x-mx)*(y-my);xx+=(x-mx)**2;yy+=(y-my)**2;}return xy/Math.sqrt(xx*yy);}
export function lineAt(t,ends,x){return ends[0]+(x-t.xDomain[0])/(t.xDomain[1]-t.xDomain[0])*(ends[1]-ends[0]);}
export function fitQuality(t,ends){if(!ends?.every(Number.isFinite))return false;const ps=t.points,mx=ps.reduce((s,p)=>s+p[0],0)/ps.length,my=ps.reduce((s,p)=>s+p[1],0)/ps.length,slope=ps.reduce((s,[x,y])=>s+(x-mx)*(y-my),0)/ps.reduce((s,[x])=>s+(x-mx)**2,0),base=ps.reduce((s,[x,y])=>s+(y-my-slope*(x-mx))**2,0),res=ps.map(([x,y])=>y-lineAt(t,ends,x)),sse=res.reduce((s,r)=>s+r*r,0),above=res.filter(r=>r>.75).length,below=res.filter(r=>r<-.75).length;return Math.sign(ends[1]-ends[0])===Math.sign(slope)&&Math.abs(above-below)<=Math.ceil(ps.length*.6)&&sse<=Math.max(base*3,ps.length*4);}
const scalar=['x','y','index','chart','xaxis','yaxis','tick','value','from','to','width','low','high','angle','row','col','jump','trend','left','right','prediction','outside','reason','best','guess','weather','effect','strength','causal','prose'];
export const fields=t=>({...Object.fromEntries(scalar.map(k=>[k,''])),answers:Array(t.questions?.length||0).fill(''),cells:Array(t.missing?.length||0).fill('')});
function board(t){const common={cursor:0,first:{}};switch(t.type){
 case'x-eventchart':return{...common,draws:[],records:[],views:[],view:'table'};
 case'x-timeplot':return{...common,points:t.build?t.points.map(()=>null):cp(t.points),connected:!t.build,scale:t.yTicks[0],scales:[t.yTicks[0]]};
 case'x-timetable':return{...common,cell:null,time:t.start??0,hops:[]};
 case'x-dotdraw':return{...common,placed:t.given?cp(t.values):t.values.map(()=>null),cups:t.fair?cp(t.values):[],transfers:0};
 case'x-piesector':return{...common,angles:t.mode==='read'?t.counts.map(n=>n/t.counts.reduce((s,v)=>s+v,0)*360):t.counts.map(()=>null)};
 case'x-histbuild':return{...common,width:t.widths[0],placed:t.given?t.values.map(v=>binOf(t,v,t.widths[0])):t.values.map(()=>null)};
 case'x-boxsummary':return{...common,marks:t.mode==='build'?t.summary.map(()=>null):cp(t.summary),values:cp(t.data||[]),changed:false};
 case'x-scatterbuild':return{...common,points:t.points.map(()=>null),line:null};
 case'x-graphcompare':return{...common,view:t.mode==='represent'?'bar':t.mode==='distributions'?'dot':'bar',views:[t.mode==='distributions'?'dot':'bar']};
 case'x-correlationlab':return{...common,started:false,weather:[],scale:1,tight:false,scaleSeen:false,tightSeen:false};
 }}
export const initial=t=>({...fields(t),board:board(t),history:[],issue:''});
const allowed=new Set(['reset','observe','tally','view','row','point','connect','scale','cell','jump','dot','transfer','sector','width','bin','mark','alter','line','trend','start','weather','stretch','tighten']);
const fvalid=(t,f)=>f&&Object.keys(fields(t)).every(k=>Array.isArray(fields(t)[k])?Array.isArray(f[k])&&f[k].length===fields(t)[k].length&&f[k].every(txt):txt(f[k]));
const serial=(t,e)=>e&&allowed.has(e.a)&&fvalid(t,e.f)&&e.d&&Object.entries(e.d).every(([k,v])=>['index','kind'].includes(k)&&txt(v));
function apply(t,b,e){const{a,f,d}=e;let issue='';const fail=s=>issue=s,n=k=>number(f[k]),i=number(d.index),first=()=>{b.first[a+'-'+b.cursor]??=cp(f);};
 if(a==='reset'){const next=board(t);next.first=cp(b.first);return{board:next,issue};}
 first();
 const len=t.points?.length||t.values?.length||t.counts?.length||t.summary?.length||0;
 if(a==='row'&&int(i,0,len-1))b.cursor=i;
 if(t.type==='x-eventchart'){
  if(a==='observe'&&b.records.length===b.draws.length&&b.draws.length<events(t).length)b.draws.push(events(t)[b.draws.length]);
  if(a==='tally'&&b.draws.length>b.records.length&&int(i,0,t.labels.length-1)){if(i===b.draws.at(-1))b.records.push(i);else fail('这一笔和刚看到的结果不同。再看一次卡片，原来的尝试会保留。');}
  if(a==='view'&&['table','picture'].includes(d.kind)){b.view=d.kind;if(!b.views.includes(d.kind))b.views.push(d.kind);}
 }
 if(t.type==='x-timeplot'||t.type==='x-scatterbuild'){
  if(a==='point'){const x=n('x'),y=n('y');if(x>=t.xDomain[0]&&x<=t.xDomain[1]&&y>=t.yDomain[0]&&y<=t.yDomain[1]){b.points[b.cursor]=[x,y];b.connected=false;if('line'in b)b.line=null;const next=b.points.findIndex(p=>!p);if(next>=0)b.cursor=next;}else fail('把点放在这两把尺的范围内。');}
  if(a==='connect'&&b.points.every(Boolean))b.connected=true;
  if(a==='scale'&&t.yTicks.includes(n('tick'))){b.scale=n('tick');if(!b.scales.includes(b.scale))b.scales.push(b.scale);}
  if(a==='trend'&&f.trend==='none')b.line=null;
  if(a==='line'){const ends=[n('left'),n('right')];if(ends.every(v=>v>=t.yDomain[0]&&v<=t.yDomain[1]))b.line=ends;else fail('用图的左右边界上两个高度确定直线。');}
 }
 if(t.type==='x-timetable'){
  if(a==='cell'&&int(n('row'),0,t.rows.length-1)&&int(n('col'),0,t.cols.length-1))b.cell=[n('row'),n('col')];
  if(a==='jump'){const j=n('jump');if(int(j,1,t.end-b.time)){b.hops.push(j);b.time+=j;}else fail('每一步向前走整分钟，不要越过到达时刻。');}
 }
 if(t.type==='x-dotdraw'){
  if(a==='dot'){const v=n('value')*t.d;if(int(Math.round(v),t.min,t.max)&&eq(v,Math.round(v))){b.placed[b.cursor]=Math.round(v);const next=b.placed.indexOf(null);if(next>=0)b.cursor=next;}else fail('落点要对准这把尺的一个刻度。分数可写成1/2或4 3/8。');}
  if(a==='transfer'){const from=n('from'),to=n('to');if(int(from,0,b.cups.length-1)&&int(to,0,b.cups.length-1)&&from!==to&&b.cups[from]>0&&b.cups[to]<t.max){b.cups[from]--;b.cups[to]++;b.transfers++;}else fail('从有液体的杯子倒到另一杯，每次只移动1/8杯。');}
 }
 if(t.type==='x-piesector'&&a==='sector'){const angle=n('angle');if(angle>0&&angle<=360&&b.angles.reduce((s,v,j)=>s+(j===b.cursor?0:v||0),0)+angle<=360+1e-8){b.angles[b.cursor]=angle;const next=b.angles.indexOf(null);if(next>=0)b.cursor=next;}else fail('每块应有正角度，拼起来不能超过整圈360°。可以选回某一块更正。');}
 if(t.type==='x-histbuild'){
  if(a==='width'&&t.widths.includes(n('width'))){b.width=n('width');b.placed=t.given?t.values.map(v=>binOf(t,v,b.width)):t.values.map(()=>null);b.cursor=0;}
  if(a==='bin'&&int(i,0,bins(t,b.width).length-1)){b.placed[b.cursor]=i;const next=b.placed.indexOf(null);if(next>=0)b.cursor=next;}
 }
 if(t.type==='x-boxsummary'){
  if(a==='mark'&&n('value')>=t.domain[0]&&n('value')<=t.domain[1]){b.marks[b.cursor]=n('value');const next=b.marks.indexOf(null);if(next>=0)b.cursor=next;}
  if(a==='alter'){const j=n('index'),v=n('value');if(int(j,1,b.values.length-2)&&Number.isFinite(v)&&v>=b.values[j-1]&&v<=b.values[j+1]){b.values[j]=v;b.changed=!same(b.values,t.data);}else fail('改一个内部数，仍按从小到大排列。看五个位置是否跟着变。');}
 }
 if(t.type==='x-graphcompare'&&a==='view'&&['bar','picture','dot','table'].includes(d.kind)){b.view=d.kind;if(!b.views.includes(d.kind))b.views.push(d.kind);}
 if(t.type==='x-correlationlab'){
  if(a==='start'&&['same','stronger','unknown'].includes(f.guess))b.started=true;
  if(b.started&&a==='weather'&&[10,20,30].includes(n('weather'))&&!b.weather.includes(n('weather')))b.weather.push(n('weather'));
  if(b.started&&a==='stretch'){b.scale=b.scale===1?2:1;b.scaleSeen=true;}
  if(b.started&&a==='tighten'){b.tight=!b.tight;b.tightSeen=true;}
 }
 return{board:b,issue};
}
export function act(t,m,action,data={}){const e={a:action.replace(/^b20-/,''),d:Object.fromEntries(Object.entries(data).filter(([k])=>['index','kind'].includes(k)).map(([k,v])=>[k,String(v)])),f:Object.fromEntries(Object.keys(fields(t)).map(k=>[k,cp(m[k])]))};if(!serial(t,e)||m.history.length>=500)return m;const r=apply(t,cp(m.board),e);m.board=r.board;m.issue=r.issue;m.history.push(e);return m;}
export function field(t,m,key){const root=key.split('.')[0];if(root in fields(t)&&!Array.isArray(m[root]))m[root]=String(m[root]??'');if(t.type==='x-scatterbuild'&&key==='trend')act(t,m,'b20-trend');}
export function valid(t,m){try{if(!m||!TYPES.has(t.type)||!fvalid(t,m)||!txt(m.issue)||!Array.isArray(m.history)||m.history.length>500||!m.history.every(e=>serial(t,e)))return false;let b=board(t);for(const e of m.history)b=apply(t,b,e).board;return same(b,m.board);}catch{return false;}}
const answersRight=(t,m)=>(t.questions||[]).every((q,i)=>Array.isArray(q.value)?q.value.includes(m.answers[i]):String(q.value).includes(':')?m.answers[i]===q.value:eq(number(m.answers[i]),number(q.value)));
export function inspect(t,m){const b=m.board;let ok=false,hint='看看图与原记录是否对得上，再留下你的发现。';
 if(t.type==='x-eventchart'){const ns=counts(events(t),t.labels);ok=same(b.records,events(t))&&['table','picture'].every(v=>b.views.includes(v))&&number(m.value)===events(t).length&&m.low!==''&&m.high!==''&&ns[number(m.low)]===Math.min(...ns)&&ns[number(m.high)]===Math.max(...ns);hint='每次观察后记一笔，换看图画和表格；总数要按图例数，最多最少也要核对。';}
 if(t.type==='x-timeplot'){ok=same(b.points,t.points)&&(!t.build||m.chart===(t.kind==='time'?'line':'bar')&&m.xaxis==='x'&&m.yaxis==='y'&&(t.kind==='category'||b.connected))&&(!t.changeScale||b.scales.length>1);hint='按记录放点，时间间隔要照尺摆开。时间变化可连线，独立类别用分开的柱子；检查坐标含义。';}
 if(t.type==='x-timetable'){ok=t.mode==='read'?same(b.cell,t.target):t.mode==='grid'?t.missing.every((v,i)=>number(m.cells[i])===v[2]):b.time===t.end&&b.hops.length>0;hint='先对准行列。经过时间按分钟向前走，每60分钟是一小时。';}
 if(t.type==='x-dotdraw'){ok=same(b.placed,t.values)&&(!t.fair||b.transfers>0&&b.cups.every(v=>v===t.values.reduce((s,n)=>s+n,0)/t.values.length))&&(!t.cluster||number(m.low)>=14&&number(m.low)<=t.cluster[0]&&number(m.high)>=t.cluster[1]&&number(m.high)<=18&&number(m.high)-number(m.low)<=4);hint='一个点是一份记录，同样的值要叠起来，空刻度仍在。杯子均分时总量不能变。';}
 if(t.type==='x-piesector'){const total=t.counts.reduce((s,n)=>s+n,0);ok=b.angles.every((v,i)=>v!==null&&eq(v,360*t.counts[i]/total));hint='每一块都应对上自己的票数÷总票数×360°，只凑满一圈还不够。';}
 if(t.type==='x-histbuild'){ok=b.placed.every((v,i)=>v===binOf(t,t.values[i],b.width))&&m.xaxis==='interval'&&m.yaxis==='frequency';hint='按同一宽度归组；包括左边界，不包括右边界。分组后不能读出每个准确原值。';}
 if(t.type==='x-boxsummary'){ok=t.mode==='build'?same(b.marks,t.summary):t.mode==='hidden'?b.changed&&same(five(b.values),t.summary):true;hint='把五个位置放在同一把尺上。中间一半是箱子的跨度；内部数可能变了，五个概括位置仍不变。';}
 if(t.type==='x-scatterbuild'){ok=same(b.points,t.points)&&m.xaxis==='x'&&m.yaxis==='y'&&m.trend===t.trend&&(t.trend==='none'?!b.line:fitQuality(t,b.line)&&Math.abs(number(m.prediction)-lineAt(t,b.line,t.predict))<=.6)&&(!t.outside||m.outside==='caution');hint='每个点保留同一份记录的两个量。趋势线概括点云，不是逐点连；线应从点云中间穿过，范围内预测也只是估计。';}
 if(t.type==='x-graphcompare'){ok=t.mode==='represent'?['bar','picture'].every(v=>b.views.includes(v))&&['bar:exact','picture:groups'].includes(m.best+':'+m.reason):t.mode==='distributions'?b.view==='dot'&&m.reason==='distribution':m.reason==='both';hint='先看图例与同一把尺，再比较两组。能查准确差，也能看分布，选择要与问题相符。';}
 if(t.type==='x-correlationlab'){ok=b.started&&b.scaleSeen&&b.tightSeen&&b.weather.length===3&&m.effect==='same'&&m.strength==='closer'&&m.causal==='third';hint='拉长纵轴没有让点更贴近趋势；收拢点才改变这种紧密程度。模拟规则里的天气同时影响两边，不能把相关直接当成因果。';}
 ok=ok&&answersRight(t,m);return{correct:!!ok,feedback:ok?'这次图、记录和发现对上了。自己的解释也可以留下。':hint,evidence:{kind:'B20 bounded data representation',board:cp(b),history:cp(m.history),fields:Object.fromEntries(Object.keys(fields(t)).map(k=>[k,cp(m[k])])),freeTextMeaningAssessed:false,realInvestigationAssessed:false,generalMasteryAssessed:false}};
}
export function solveSteps(t){const ss=[],f=(field,value)=>ss.push({field,value:String(value)}),a=(name,data={})=>ss.push({action:'b20-'+name,data});
 if(t.type==='x-eventchart'){for(const index of events(t)){a('observe');a('tally',{index});}a('view',{kind:'picture'});a('view',{kind:'table'});const ns=counts(events(t),t.labels);f('value',events(t).length);f('low',ns.indexOf(Math.min(...ns)));f('high',ns.indexOf(Math.max(...ns)));}
 if(t.type==='x-timeplot'||t.type==='x-scatterbuild'){if(t.build||t.type==='x-scatterbuild'){f('xaxis','x');f('yaxis','y');if(t.type==='x-timeplot')f('chart',t.kind==='time'?'line':'bar');for(const[x,y]of t.points){f('x',x);f('y',y);a('point');}if(t.type==='x-timeplot'&&t.kind==='time')a('connect');}if(t.changeScale){f('tick',t.yTicks[1]);a('scale');}if(t.type==='x-scatterbuild'){f('trend',t.trend);if(t.trend!=='none'){f('left',t.fit[0]);f('right',t.fit[1]);a('line');f('prediction',lineAt(t,t.fit,t.predict));}if(t.outside)f('outside','caution');}}
 if(t.type==='x-timetable'){if(t.mode==='read'){f('row',t.target[0]);f('col',t.target[1]);a('cell');}if(t.mode==='grid')t.missing.forEach((v,i)=>f('cells.'+i,v[2]));if(t.mode==='journey'){f('jump',60-t.start%60);a('jump');f('jump',t.end-(t.start+60-t.start%60));a('jump');}}
 if(t.type==='x-dotdraw'){if(!t.given)for(const v of t.values){f('value',v+'/'+t.d);a('dot');}if(t.fair){f('from',0);f('to',2);a('transfer');a('transfer');}if(t.cluster){f('low',t.cluster[0]);f('high',t.cluster[1]);}}
 if(t.type==='x-piesector'&&t.mode!=='read'){for(const v of t.counts){f('angle',v/t.counts.reduce((s,n)=>s+n,0)*360);a('sector');}}
 if(t.type==='x-histbuild'){f('xaxis','interval');f('yaxis','frequency');if(!t.given)for(const v of t.values)a('bin',{index:binOf(t,v,t.widths[0])});}
 if(t.type==='x-boxsummary'){if(t.mode==='build')for(const v of t.summary){f('value',v);a('mark');}if(t.mode==='hidden'){f('index',1);f('value',5);a('alter');}}
 if(t.type==='x-graphcompare'){if(t.mode==='represent'){a('view',{kind:'picture'});a('view',{kind:'bar'});f('best','bar');f('reason','exact');}else f('reason',t.mode==='distributions'?'distribution':'both');}
 if(t.type==='x-correlationlab'){f('guess','same');a('start');a('stretch');a('tighten');for(const v of[10,20,30]){f('weather',v);a('weather');}f('effect','same');f('strength','closer');f('causal','third');}
 (t.questions||[]).forEach((q,i)=>f('answers.'+i,Array.isArray(q.value)?q.value[0]:q.value));return ss;
}
export function example(t){const m=initial(t);for(const s of solveSteps(t))if(s.field){const p=s.field.split('.');if(p.length>1)m[p[0]][+p[1]]=s.value;else m[s.field]=s.value;field(t,m,s.field);}else act(t,m,s.action,s.data);return m;}
