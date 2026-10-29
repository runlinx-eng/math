export const TYPES=new Set(['x-datacount','x-dataplan','x-datastudio','x-dataclean','x-datakind','x-measurestory']);
const cp=x=>structuredClone(x),same=(a,b)=>JSON.stringify(a)===JSON.stringify(b),int=(x,a=0,z=1000)=>Number.isInteger(x)&&x>=a&&x<=z,txt=x=>typeof x==='string'&&x.length<=1000;
export const scalar=['total','gap','scope','chart','title','xaxis','yaxis','reason','finding1','finding2','limit','improve','draft','editIndex','decision','correction','cleanReason','usable','unknown','orderReason','precisionReason','guess','roundAnswer','conclusion'];
export function fieldValues(t){return{...Object.fromEntries(scalar.map(k=>[k,''])),answers:Array(t.choices?.length||0).fill(''),questions:Array(t.cols?.length||0).fill(''),entry:Array(t.cols?.length||0).fill(''),counts:Array(t.labels?.length||t.cols?.[t.analysis]?.values.length||0).fill(''),formulas:Array(t.labels?.length||t.cols?.[t.analysis]?.values.length||0).fill(''),kinds:Array(t.cards?.length||0).fill('')};}
const board=t=>({first:{},...(t.type==='x-datacount'?{counts:t.counts.map(()=>0),pairs:0,max:[],min:[]}:t.type==='x-dataplan'||t.mode==='context'?{saved:false}:t.type==='x-datastudio'?{stage:0,cursor:0,rows:t.rows.map(()=>null),table:null,heights:t.cols[t.analysis].values.map(()=>0),plot:null,max:[],min:[],report:null,plan:null}:t.type==='x-dataclean'?{cursor:0,decisions:t.rows.map(()=>null)}:t.type==='x-datakind'?{placed:t.cards.map(()=>''),saved:false}:{cursor:0,rounded:[],started:false})});
export const initial=t=>({...fieldValues(t),board:board(t),history:[],issue:''});
const actions=new Set(['reset','bar','pair','max','min','plan','record','edit','table','plot','report','clean','row','kind','classify','start-round','round']);
const fkeys=t=>Object.keys(fieldValues(t));
function fieldsValid(t,f){return f&&fkeys(t).every(k=>Array.isArray(fieldValues(t)[k])?Array.isArray(f[k])&&f[k].length===fieldValues(t)[k].length&&f[k].every(txt):txt(f[k]));}
const serial=(t,e)=>e&&actions.has(e.a)&&fieldsValid(t,e.f)&&e.d&&Object.entries(e.d).every(([k,v])=>['index','delta','kind'].includes(k)&&txt(v));
const toggle=(a,n)=>a.includes(n)?a.filter(x=>x!==n):[...a,n].sort((a,b)=>a-b);
export const num=s=>/^\d+$/.test(String(s).trim())?Number(s):NaN;
export const frequencies=(rows,index,labels)=>labels.map(label=>rows.filter(r=>r&&r[index]===label).length);
export const extremes=(counts,which)=>counts.flatMap((n,i)=>n===(which==='max'?Math.max(...counts):Math.min(...counts))?[i]:[]);
export const rangeFor=t=>{const c=String.fromCharCode(66+(t.analysis||0));return `${c}2:${c}${t.rows?.length+1||t.raw.length+1}`;};
// A deliberately bounded spreadsheet interpreter. No JavaScript evaluation or external spreadsheet service.
export function countIf(expression,rows,index){const s=String(expression).trim(),m=s.match(/^=COUNTIF\(\s*\$?([A-Z])\$?(\d+)\s*:\s*\$?([A-Z])\$?(\d+)\s*[,;]\s*(?:"([^"\r\n]*)"|(-?\d+(?:\.\d+)?))\s*\)$/i);if(!m)return null;const col=m[1].toUpperCase(),last=m[3].toUpperCase(),from=Number(m[2]),to=Number(m[4]),condition=m[5]??m[6];if(col!==last||col!==String.fromCharCode(66+index)||!int(from,2,rows.length+1)||!int(to,from,rows.length+1))return null;return{value:rows.slice(from-2,to-1).filter(r=>r?.[index]===condition).length,full:from===2&&to===rows.length+1,condition};}
const formulaCounts=(t,f,rs,labels)=>labels.map((l,i)=>{const n=countIf(f.formulas[i],rs,t.analysis||0);return n?.full&&n.condition===l?n.value:NaN;});
export const labels=t=>t.labels||t.cols[t.analysis].values;
export const expected=t=>t.counts||frequencies(t.rows.map(r=>r.values),t.analysis,labels(t));
const rightPlan=(t,f)=>t.choices.every((c,i)=>f.answers[i]===c.answer);
export const roundedTime=n=>Math.floor((n+15)/30)*30;
export const clock=n=>String(Math.floor(n/60)).padStart(2,'0')+':'+String(n%60).padStart(2,'0');
const readClock=s=>{const m=String(s).trim().match(/^(\d{1,2}):(\d{2})$/);return m&&int(+m[1],0,23)&&int(+m[2],0,59)?+m[1]*60+(+m[2]):NaN;};
function apply(t,b,e){const{a,f,d}=e,i=Number(d.index),delta=Number(d.delta);let issue='';const fail=s=>issue=s,first=k=>{b.first[k]??=cp(f);};
 if(a==='reset'){const n=board(t);n.first=cp(b.first);return{board:n,issue};}
 if(t.type==='x-datacount'){
  if(a==='bar'&&int(i,0,t.counts.length-1)&&[-1,1].includes(delta))b.counts[i]=Math.max(0,Math.min(40,b.counts[i]+delta));
  if(a==='pair'&&t.pair&&b.pairs<Math.min(...t.compare.map(k=>t.counts[k])))b.pairs++;
  if(['max','min'].includes(a)&&int(i,0,t.counts.length-1))b[a]=toggle(b[a],i);
 }
 if(t.type==='x-dataplan'||t.type==='x-measurestory'&&t.mode==='context')if(a==='plan'){first('plan');b.saved=rightPlan(t,f);if(!b.saved)fail('把对象、时间和要记录的量对清楚；不要把猜想写成已经知道的事实。');}
 if(t.type==='x-datastudio'){
  if(a==='plan'&&b.stage===0){first('plan');if(f.questions.some(q=>q!=='clear')||f.scope!=='defined'||f.reason!=='consistent')fail('让每个人回答同样的明确问题；先确定对象、时段和记录方法。');else{b.plan={questions:cp(f.questions),who:t.who,when:t.when,how:t.how,draft:f.draft};b.stage=1;}}
  if(a==='record'&&b.stage===1){first('record-'+b.cursor);if(!f.entry.every((v,j)=>t.cols[j].values.includes(v)))fail('这一条还有没记下的回答。照着原卡片逐项记，不需要猜。');else{b.rows[b.cursor]=cp(f.entry);const next=b.rows.findIndex(r=>r===null);b.table=null;b.plot=null;b.report=null;b.heights=b.heights.map(()=>0);b.max=[];b.min=[];if(next<0)b.stage=2;else b.cursor=next;}}
  if(a==='edit'){const index=num(f.editIndex);if(int(index,0,t.rows.length-1)&&b.rows[index]){b.cursor=index;b.stage=1;b.table=null;b.plot=null;b.report=null;b.heights=b.heights.map(()=>0);b.max=[];b.min=[];}}
  if(a==='table'&&b.stage===2){first('table');const wrong=b.rows.findIndex((r,j)=>!same(r,t.rows[j].values));if(wrong>=0)fail(t.rows[wrong].id+'和原卡片不一致。可以回到那条记录更正，不能只改总数。');else{const ns=t.formula?formulaCounts(t,f,b.rows,labels(t)):f.counts.map(num);if(!same(ns,expected(t))||num(f.total)!==t.rows.length)fail(t.formula?'公式要引用完整的一列，再按每个类别计数。核对范围、条件和总记录数。':'逐类计数后相加，检查有没有漏掉一条记录。');else{b.table={counts:ns,total:num(f.total),formulas:cp(f.formulas)};b.stage=3;}}}
  if(a==='bar'&&b.stage===3&&int(i,0,b.heights.length-1)&&[-1,1].includes(delta))b.heights[i]=Math.max(0,Math.min(40,b.heights[i]+delta));
  if(a==='plot'&&b.stage===3){first('plot');if(!t.charts.includes(f.chart)||f.title!=='question'||f.xaxis!=='variable'||f.yaxis!=='frequency'||!same(b.heights,b.table.counts)||!['bar:compare','dot:distribution','table:exact'].includes(f.chart+':'+f.reason))fail('每类数量应与表一致，标题与两轴应说明记录的含义；选一个与你的表示方式相符的理由。');else{b.plot={chart:f.chart,title:t.title,x:t.cols[t.analysis].label,y:t.unit,counts:cp(b.heights),reason:f.reason};b.stage=4;}}
  if(['max','min'].includes(a)&&b.stage===4&&int(i,0,b.heights.length-1)){b[a]=toggle(b[a],i);b.report=null;}
  if(a==='report'&&b.stage===4){first('report');const cs=b.table.counts;if(!same(b.max,extremes(cs,'max'))||!same(b.min,extremes(cs,'min'))||num(f.gap)!==Math.max(...cs)-Math.min(...cs)||f.scope!=='records'||!['sample','time','recall'].includes(f.limit)||!['repeat','wider','precise'].includes(f.improve))fail('把并列的类别也算进去。结论先说这组记录，指出限制，再留下下一步；最大数量与最小数量的差要核对。');else b.report={max:cp(b.max),min:cp(b.min),gap:num(f.gap),scope:f.scope,limit:f.limit,improve:f.improve,finding1:f.finding1,finding2:f.finding2,meaningAssessed:false};}
 }
 if(t.type==='x-dataclean'){
  if(a==='row'&&int(i,0,t.rows.length-1))b.cursor=i;
  if(a==='clean'){first('clean-'+b.cursor);const r=t.rows[b.cursor],known=t.labels.includes(r.raw),good=known?f.decision==='keep'&&f.cleanReason==='valid':r.proof?f.decision==='correct'&&f.correction===r.proof&&f.cleanReason==='proof':['unknown','exclude'].includes(f.decision)&&f.cleanReason==='no-proof';if(!good)fail(known?'这条原记录是有效类别，相同回答不等于同一个人。':r.proof?'原答卷提供了凭据，按凭据更正，不按多数人的答案猜。':'没有可核对的原答卷。标未知或暂不计入，并保留原因，别填成0。');else{b.decisions[b.cursor]={decision:f.decision,value:known?r.raw:r.proof||null,reason:f.cleanReason,original:r.raw};const next=b.decisions.findIndex(x=>!x);if(next>=0)b.cursor=next;}}
 }
 if(t.type==='x-datakind'){
  if(a==='kind'&&int(i,0,t.cards.length-1)&&['nominal','ordinal'].includes(d.kind)){b.placed[i]=d.kind;b.saved=false;}
  if(a==='classify'){first('classify');b.saved=t.cards.every((c,j)=>c.kind===b.placed[j])&&f.orderReason==='order'&&f.precisionReason==='not-equal';if(!b.saved)fail('颜色名称没有固定高低。1到5的评分有顺序，但不能仅凭数字就认定每一级感受差一样多。');}
 }
 if(t.type==='x-measurestory'&&t.mode==='round'){
  if(a==='start-round'&&['exact','rounding','unknown'].includes(f.guess)){first('guess');b.started=true;}
  if(a==='round'&&b.started&&b.cursor<t.times.length){first('round-'+b.cursor);if(readClock(f.roundAnswer)!==roundedTime(t.times[b.cursor]))fail('看它离前后哪个半小时更近。正好一半时，这次约定记到后一个半小时。');else{b.rounded.push(readClock(f.roundAnswer));b.cursor++;}}
 }
 return{board:b,issue};
}
export function act(t,m,action,data={}){const e={a:action.replace(/^b19-/,''),d:Object.fromEntries(Object.entries(data).filter(([k])=>['index','delta','kind'].includes(k)).map(([k,v])=>[k,String(v)])),f:Object.fromEntries(fkeys(t).map(k=>[k,cp(m[k])]))};if(!serial(t,e)||m.history.length>=800)return m;const r=apply(t,cp(m.board),e);m.board=r.board;m.issue=r.issue;m.history.push(e);if(t.type==='x-datastudio'&&['record','edit'].includes(e.a)&&!m.issue)m.entry=cp(m.board.rows[m.board.cursor]||t.cols.map(()=>''));if(e.a==='round'&&!m.issue)m.roundAnswer='';if(t.type==='x-dataclean'&&e.a==='clean'&&!m.issue){m.decision='';m.correction='';m.cleanReason='';}return m;}
export function field(t,m,k){const root=k.split('.')[0];if(fkeys(t).includes(root)&&!Array.isArray(m[root]))m[root]=String(m[root]??'');}
export function valid(t,m){try{if(!m||!TYPES.has(t.type)||!fieldsValid(t,m)||!txt(m.issue)||!Array.isArray(m.history)||m.history.length>800||!m.history.every(e=>serial(t,e)))return false;let b=board(t);for(const e of m.history)b=apply(t,b,e).board;return same(b,m.board);}catch{return false;}}
// A later correction starts another investigation revision. Keep all older attempts,
// but do not let an earlier finished graph certify the currently edited records.
export const investigationRevision=m=>JSON.stringify(m.history.slice(0,m.history.findLastIndex(e=>e.a==='edit'||e.a==='reset')+1));
export function completionApplies(t,current,attempt){return t.type!=='x-datastudio'||!!current&&inspect(t,current).correct&&investigationRevision(current)===investigationRevision(attempt);}
export function inspect(t,m){const b=m.board;let ok=false,feedback='让记录、数量和结论互相对得上。';
 if(t.type==='x-datacount'){const c=t.counts,ns=t.formula?formulaCounts(t,m,t.raw.map(v=>[v]),t.labels):b.counts;ok=same(ns,c)&&num(m.total)===c.reduce((a,v)=>a+v,0)&&num(m.gap)===Math.abs(c[t.compare[0]]-c[t.compare[1]])&&(!t.pair||b.pairs===Math.min(...t.compare.map(i=>c[i])))&&(!t.extremes||same(b.max,extremes(c,'max'))&&same(b.min,extremes(c,'min')))&&(!t.scope||m.scope===t.scope)&&(!t.unknown||num(m.unknown)===t.unknown);feedback=t.pair?'先把两类一一配对。差是没有配到的部分，不是较大类的全部。':'总数加的是每类次数；求差用两类相减。若有并列最多或最少，要全部指出。';}
 if(t.type==='x-dataplan'||t.type==='x-measurestory'&&t.mode==='context'){ok=b.saved&&rightPlan(t,m);feedback='先明确对象、时间、单位和方法，再说记录支持什么。';}
 if(t.type==='x-datastudio'){ok=!!b.report&&b.stage===4&&b.report.scope===m.scope&&b.report.limit===m.limit&&b.report.improve===m.improve&&num(m.gap)===b.report.gap;feedback=b.stage<4?'先完成当前这一步；后面的图和结论要来自这份原记录。':'检查最多、最少与差，留下结论适用的范围，再保存这次发现。';}
 if(t.type==='x-dataclean'){const known=b.decisions.filter(x=>x?.value!==null&&x).length;ok=b.decisions.every(Boolean)&&num(m.usable)===known&&num(m.unknown)===t.rows.length-known;feedback='每条记录都需要一个有依据的处理。原记录不丢失，未知仍是未知，再分别数可用和未知。';}
 if(t.type==='x-datakind'){ok=b.saved&&m.orderReason==='order'&&m.precisionReason==='not-equal';feedback='按有没有固定高低分组；顺序不等于等距。';}
 if(t.type==='x-measurestory'&&t.mode==='round'){ok=b.started&&b.cursor===t.times.length&&m.conclusion==='possible';feedback='模拟取整能产生堆积，只说明“可能如此”，并不能证明真实报告的原因。';}
 return{correct:!!ok,feedback:ok?'这次记录与操作对上了。自己的解释也会留下，可以以后再读。':feedback,evidence:{kind:'B19 bounded statistical investigation',board:cp(b),history:cp(m.history),fields:Object.fromEntries(fkeys(t).map(k=>[k,cp(m[k])])),simulation:true,freeTextMeaningAssessed:false,realInvestigationAssessed:false,externalSpreadsheetAssessed:false,generalMasteryAssessed:false}};
}
export function solveSteps(t){const ss=[],f=(field,value)=>ss.push({field,value:String(value)}),a=(name,data={})=>ss.push({action:'b19-'+name,data});
 if(t.type==='x-datacount'){if(t.formula)t.labels.forEach((l,i)=>f('formulas.'+i,`=COUNTIF(B2:B${t.raw.length+1},"${l}")`));else t.counts.forEach((n,i)=>{for(let k=0;k<n;k++)a('bar',{index:i,delta:1});});f('total',t.counts.reduce((a,v)=>a+v,0));f('gap',Math.abs(t.counts[t.compare[0]]-t.counts[t.compare[1]]));if(t.pair)for(let n=0;n<Math.min(...t.compare.map(i=>t.counts[i]));n++)a('pair');if(t.extremes)for(const which of['max','min'])for(const index of extremes(t.counts,which))a(which,{index});if(t.scope)f('scope',t.scope);if(t.unknown)f('unknown',t.unknown);}
 if(t.type==='x-dataplan'||t.type==='x-measurestory'&&t.mode==='context'){t.choices.forEach((c,i)=>f('answers.'+i,c.answer));if(t.draft)f('draft','我会把对象和时间说清楚，并保留原记录。');a('plan');}
 if(t.type==='x-datastudio'){t.cols.forEach((c,i)=>f('questions.'+i,'clear'));f('scope','defined');f('reason','consistent');a('plan');for(const r of t.rows){r.values.forEach((v,i)=>f('entry.'+i,v));a('record');}const cs=expected(t);labels(t).forEach((l,i)=>f((t.formula?'formulas.':'counts.')+i,t.formula?`=COUNTIF(${rangeFor(t)},"${l}")`:cs[i]));f('total',t.rows.length);a('table');f('chart',t.charts[0]);f('title','question');f('xaxis','variable');f('yaxis','frequency');f('reason',t.charts[0]==='bar'?'compare':t.charts[0]==='dot'?'distribution':'exact');cs.forEach((n,i)=>{for(let k=0;k<n;k++)a('bar',{index:i,delta:1});});a('plot');for(const which of['max','min'])for(const index of extremes(cs,which))a(which,{index});f('gap',Math.max(...cs)-Math.min(...cs));f('scope','records');f('limit','sample');f('improve','repeat');f('finding1','我只在这组模拟记录里比较最多的类别。');f('finding2','最多与最少的差来自同一张表，其他人可能不同。');a('report');}
 if(t.type==='x-dataclean'){for(const r of t.rows){const known=t.labels.includes(r.raw);f('decision',known?'keep':r.proof?'correct':'unknown');if(r.proof)f('correction',r.proof);f('cleanReason',known?'valid':r.proof?'proof':'no-proof');a('clean');}const n=t.rows.filter(r=>t.labels.includes(r.raw)||r.proof).length;f('usable',n);f('unknown',t.rows.length-n);}
 if(t.type==='x-datakind'){t.cards.forEach((c,index)=>a('kind',{index,kind:c.kind}));f('orderReason','order');f('precisionReason','not-equal');a('classify');}
 if(t.type==='x-measurestory'&&t.mode==='round'){f('guess','rounding');a('start-round');for(const n of t.times){f('roundAnswer',clock(roundedTime(n)));a('round');}f('conclusion','possible');}
 return ss;
}
export function example(t){const m=initial(t);for(const s of solveSteps(t))if(s.field){const p=s.field.split('.');if(p.length===2)m[p[0]][Number(p[1])]=s.value;else m[s.field]=s.value;field(t,m,s.field);}else act(t,m,s.action,s.data);return m;}
