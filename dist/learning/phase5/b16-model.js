// Exact quantities and replayable learner constructions; no runtime inference of mastery.
import{norm,equivalent}from'./b15-model.js';
export const TYPES=new Set(['x-paperlab','x-portiongroups','x-portionbar','x-unitwalk','x-wholeshare','x-samefraction','x-mixedaxis','x-digitlens','x-fractiontalk','x-graphpoints','x-rowrepair','x-anglejoin','x-algebrabar','x-fdpboard']);
const copy=x=>structuredClone(x),same=(a,b)=>JSON.stringify(a)===JSON.stringify(b),int=(n,a=0,b=1e10)=>Number.isSafeInteger(n)&&n>=a&&n<=b,text=s=>typeof s==='string'&&s.length<=2000;
export const number=s=>typeof s==='string'&&/^[+-]?\d{1,12}(?:\.\d{1,8})?$/.test(s.trim())?Number(s):null;
export function rational(raw){const s=String(raw).trim().replace(/[−–]/g,'-');let n,d;if(/^-?\d+\s+\d+\/\d+$/.test(s)){const[q,a,b]=s.split(/[ /]+/).map(Number);if(a>=b||b<1)return null;n=Math.abs(q)*b+a;if(s[0]==='-')n=-n;d=b;}else if(/^-?\d+\/\d+$/.test(s)){[n,d]=s.split('/').map(Number);}else if(/^[+-]?\d+(?:\.\d+)?$/.test(s)){d=10**(s.split('.')[1]?.length||0);n=Number(s.replace('.',''));}else return null;return int(n,-1e12,1e12)&&int(d,1,1e8)?[n,d]:null;}
export const equal=(s,n,d=1)=>{const q=rational(s);return!!q&&BigInt(q[0])*BigInt(d)===BigInt(n)*BigInt(q[1]);};
export const value=s=>{const r=rational(s);return r?r[0]/r[1]:null;};
export const toggle=(xs,v)=>xs.includes(v)?xs.filter(x=>x!==v):[...xs,v];
const canon=xs=>{const seen=[];return xs.map(x=>{if(!seen.includes(x))seen.push(x);return seen.indexOf(x);});};
const areaEqual=xs=>xs.length===16&&[0,1,2,3].every(c=>xs.filter(x=>x===c).length===4);
export const fields={rows:'1',cols:'1',parts:'1',take:'',answer:'',unit:'',equation:'',den:'',num:'',whole:'',remainder:'',copies:'',prediction:'',relation:'',left:'',right:'',reason:'',step:'',position:'0',choice:'',result:'',shift:'0',rotation:'0',x:'0',y:'0',per:'',total:'',color:'0',decimal:'',percent:'',top:'',bottom:'',word:'',count:'1',fixed:'0'};
function board(t){switch(t.type){
 case'x-paperlab':return{rows:1,cols:1,folds:[],selected:[],cells:Array(16).fill(-1),saved:[],judgments:[],first:null};
 case'x-portiongroups':return{groups:Array(t.total).fill(-1),group:0,taken:[]};
 case'x-portionbar':return{parts:1,taken:[],built:false};
 case'x-unitwalk':return{parts:1,steps:[],first:null};
 case'x-wholeshare':return{rounds:0,cut:false,groups:[],person:0,first:null};
 case'x-samefraction':return{left:[],right:[],first:null,prediction:null,overlay:false,refine:null};
 case'x-mixedaxis':return{selected:0,placements:{},ordered:[],symbols:[],first:null};
 case'x-digitlens':return{index:0,seen:[0],records:[],first:null};
 case'x-fractiontalk':return{records:[],first:null};
 case'x-graphpoints':return{points:[],selected:[],first:null};
 case'x-rowrepair':return{shift:t.wrongShift,seen:[t.wrongShift],first:null};
 case'x-anglejoin':return{taken:[],selected:null,placed:[],chain:[]};
 case'x-algebrabar':return{count:0,fixed:0,built:false,removed:false,divided:false,first:null};
 case'x-fdpboard':return{selected:[],seen:['grid']};
}}
export const initial=t=>({...fields,board:board(t),history:[],issue:''});
const actions=new Set(['reset','fold','partition','paper','paint','save','judge','group','token','take','bar','walk','walk-back','round','cut-wholes','person','share-piece','predict','fraction','overlay','refine','select','place','order','symbol','digit','digit-save','talk','plot','readpoint','shift','angle','rotate-place','chain','algebra','remove','divide','cell','row','view']);
const serial=e=>e&&actions.has(e.action)&&e.data&&Object.keys(e.data.fields||{}).length===Object.keys(fields).length&&Object.keys(fields).every(k=>text(e.data.fields[k]))&&Object.entries(e.data).every(([k,v])=>k==='fields'||['index','value','row'].includes(k)&&text(v));
const eq=(raw,wants)=>{const p=String(raw).replace(/\bx\b/g,'n').split('=');if(p.length!==2)return false;return wants.some(w=>{const q=w.split('=');const match=(a,b)=>norm(a)===norm(b)||equivalent(a,b);return match(p[0],q[0])&&match(p[1],q[1])||match(p[1],q[0])&&match(p[0],q[1]);});};
export const equationOK=eq;
export function sharingEquation(raw,n,d,inverse=false){const sides=norm(raw).split('=');if(sides.length!==2)return false;const un=s=>s.replace(/^\((.*)\)$/,'$1');return [sides,[...sides].reverse()].some(([a,b])=>{if(!inverse)return a===`${n}/${d}`&&equal(un(b),n,d);if(!equal(b,n))return false;const terms=a.split('*').map(un);return terms.length===2&&(equal(terms[0],n,d)&&equal(terms[1],d)||equal(terms[1],n,d)&&equal(terms[0],d));});}
export const groupCounts=(t,b)=>Array.from({length:t.d},(_,i)=>b.groups.filter(g=>g===i).length);
export const sharedRemainder=t=>t.wholes%t.people;
export const symbolTrue=(a,s,b)=>({'=':a===b,'≠':a!==b,'<':a<b,'>':a>b,'≤':a<=b,'≥':a>=b}[s]||false);
export const digitCases=t=>t.cases;
function apply(t,b,e){const a=e.action,d=e.data,f=d.fields;let issue='';const fail=s=>{issue=s;};
 if(a==='reset'){const fresh=board(t);if('first'in b)fresh.first=b.first;return{board:fresh,issue};}
 if(t.type==='x-paperlab'){
  if(a==='fold'&&t.mode==='fold'&&b.rows*b.cols<8){if(d.value==='x')b.cols*=2;else if(d.value==='y')b.rows*=2;b.folds.push(d.value);b.selected=[];}
  if(a==='partition'&&t.mode==='build'){const r=number(f.rows),c=number(f.cols);if(!int(r,1,6)||!int(c,1,12)||r*c>12||t.shape==='circle'&&r!==1)fail('这张纸先分成不超过12份；圆从中心分开。');else{b.rows=r;b.cols=c;b.selected=[];}}
  if(a==='paper'&&int(+d.index,0,b.rows*b.cols-1))b.selected=toggle(b.selected,+d.index);
  if(a==='paint'&&int(+d.index,0,15)&&int(number(f.color),0,3))b.cells[+d.index]=number(f.color);
  if(a==='save'&&t.mode==='paint'){if(!areaEqual(b.cells))fail('四种颜色各占同样多的格子，形状可以不同。');else if(b.saved.some(x=>same(canon(x),canon(b.cells))))fail('这份已经留下了。改变分界，只换颜色不算新分法。');else b.saved.push(copy(b.cells));}
  if(a==='judge'&&b.judgments.length<t.cases?.length){const c=t.cases[b.judgments.length],yes=c.length===t.d&&c.every(n=>n===c[0]);b.first??=f.choice;if(f.choice!==(yes?'yes':'no')||yes&&t.writeName&&!equal(f.answer,1,t.d))fail('份数和每份大小都要看；相等时，用1和总份数给一小份命名。');else b.judgments.push(f.choice);}
 }
 if(t.type==='x-portiongroups'){
  if(a==='group'&&int(+d.index,0,t.d-1))b.group=+d.index;
  if(a==='token'&&int(+d.index,0,t.total-1))b.groups[+d.index]=b.group;
  if(a==='take'&&int(+d.index,0,t.d-1))b.taken=toggle(b.taken,+d.index);
 }
 if(t.type==='x-portionbar'){
  if(a==='bar'){const p=number(f.parts);if(!int(p,1,12))fail('先把一整条分成1到12份。');else{b.parts=p;b.built=true;b.taken=[];}}
  if(a==='take'&&int(+d.index,0,b.parts-1))b.taken=toggle(b.taken,+d.index);
 }
 if(t.type==='x-unitwalk'){
  if(a==='partition'){const p=number(f.parts);if(!int(p,1,12))fail('每个0到1的长度先分成1到12个相等间隔。');else{b.parts=p;b.steps=[];}}
  if(a==='walk'&&b.steps.length<Math.ceil(t.n/t.d+1)*b.parts){b.first??=f.parts;for(let i=0;i<(t.chunk||1);i++)b.steps.push(b.steps.length+1);}
  if(a==='walk-back')b.steps.pop();
 }
 if(t.type==='x-wholeshare'){
  if(a==='round'&&!b.cut){if((b.rounds+1)*t.people<=t.wholes)b.rounds++;else fail('余下的不够每人一整份，可以继续切小。');}
  if(a==='cut-wholes'){const remain=t.wholes-b.rounds*t.people;if(remain>=t.people)fail('还够每人一整个，先把完整的分掉。');else if(!b.cut){b.cut=true;b.groups=Array(remain*t.people).fill(-1);}}
  if(a==='person'&&int(+d.index,0,t.people-1))b.person=+d.index;
  if(a==='share-piece'&&b.cut&&int(+d.index,0,b.groups.length-1))b.groups[+d.index]=b.person;
 }
 if(t.type==='x-samefraction'){
  if(a==='predict'&&['<','=','>'].includes(f.prediction)){b.first??=f.prediction;b.prediction=f.prediction;}
  if(a==='fraction'&&b.prediction){const k=d.row==='right'?'right':'left',den=t[k][1];if(int(+d.index,0,den-1))b[k]=toggle(b[k],+d.index);}
  if(a==='overlay'&&b.prediction)b.overlay=true;
  if(a==='refine'){const p=number(f.parts);if(!int(p,1,60)||p%t.left[1]||p%t.right[1])fail('新小格要同时把两边原来的一份继续平均分开。');else b.refine=p;}
 }
 if(t.type==='x-mixedaxis'){
  if(a==='select'&&int(+d.index,0,t.cards.length-1))b.selected=+d.index;
  if(a==='place'){const p=number(f.position);if(p!==null&&p>=t.min&&p<=t.max){b.first??={index:b.selected,position:p};b.placements[b.selected]=p;}}
  if(a==='order'&&int(+d.index,0,t.cards.length-1)){b.ordered=toggle(b.ordered,+d.index);}
  if(a==='symbol'&&b.symbols.length<(t.statements||[]).length){const q=t.statements[b.symbols.length];if(f.relation!==q.symbol||!symbolTrue(value(q.a),f.relation,value(q.b)))fail('看清是严格大/小、一样多，还是允许相等。');else b.symbols.push(f.relation);}
 }
 if(t.type==='x-digitlens'){
  if(a==='digit'&&int(+d.index,0,t.cases.length-1)){b.index=+d.index;if(!b.seen.includes(b.index))b.seen.push(b.index);}
  if(a==='digit-save'){const c=t.cases[b.index];b.first??=f.answer;if(!equal(f.answer,c.n,c.d||1))fail('这一位的数字要连同它的位置一起读；多写的小数位不一定让数更大。');else if(!b.records.includes(b.index))b.records.push(b.index);}
 }
 if(t.type==='x-fractiontalk'){
  if(a==='talk'&&b.records.length<t.cases.length){const c=t.cases[b.records.length];b.first??=copy(f);const ok=c.kind==='unit'?equal(f.answer,c.n,c.d||1)&&f.unit===c.unit:c.kind==='vocab'?f.top==='numerator'&&f.bottom==='denominator'&&f.word==='equivalent':c.kind==='money'?equal(f.answer,c.n,100)&&f.unit==='yuan'&&/^\d+\.\d{2}$/.test(f.answer):f.relation===c.symbol&&symbolTrue(value(c.a),f.relation,value(c.b));if(!ok)fail(c.kind==='money'?'数值可以等值，这里练习统一写成元和两位小数。不要把元和分混写。':'把数、单位和符号一起说清楚，看看读者会读成什么。');else b.records.push({kind:c.kind,fields:copy(f)});}
 }
 if(t.type==='x-graphpoints'){
  if(a==='plot'){const x=number(f.x),y=number(f.y);b.first??={x,y};if(!int(x,0,t.maxX)||!int(y,0,t.maxY))fail('点放在这张图的范围里。');else{b.points=b.points.filter(p=>p[0]!==x);b.points.push([x,y]);}}
  if(a==='readpoint'&&int(+d.index,0,t.data.length-1))b.selected=toggle(b.selected,+d.index);
 }
 if(t.type==='x-rowrepair'){
  if(a==='shift'&&int(number(f.shift),0,2)){b.first??=number(f.shift);b.shift=number(f.shift);b.seen.push(b.shift);}
 }
 if(t.type==='x-anglejoin'){
  if(a==='angle'&&int(+d.index,0,2)){b.selected=+d.index;if(!b.taken.includes(b.selected))b.taken.push(b.selected);}
  if(a==='rotate-place'&&b.selected!==null){const rotation=number(f.rotation);if(!int(rotation,0,180)||rotation+t.angles[b.selected]>180)fail('把角放在这条直线的上方，两边都要留在半圈里。');else{b.placed=b.placed.filter(p=>p.index!==b.selected);b.placed.push({index:b.selected,start:rotation,end:rotation+t.angles[b.selected]});}}
  if(a==='chain'&&['original','together','straight'].includes(d.value))b.chain=toggle(b.chain,d.value);
 }
 if(t.type==='x-algebrabar'){
  if(a==='algebra'){const c=number(f.count),n=number(f.fixed);b.first??={c,n};if(!int(c,1,8)||!int(n,0,100))fail('先摆几份相同的未知量，再摆额外的一块。');else{b.count=c;b.fixed=n;b.built=true;b.removed=false;b.divided=false;}}
  if(a==='remove'&&b.built){if(number(f.result)!==t.total-b.fixed)fail('两边一起拿走额外的一块，等量关系才留住。');else b.removed=true;}
  if(a==='divide'&&b.removed){if(!equal(f.result,t.total-b.fixed,b.count))fail('剩下的是几份一样的量？两边一起平均分。');else b.divided=true;}
 }
 if(t.type==='x-fdpboard'){
  if(a==='cell'&&int(+d.index,0,t.d-1))b.selected=toggle(b.selected,+d.index);
  if(a==='row'&&t.d===100&&int(+d.index,0,9)){const is=Array.from({length:10},(_,i)=>+d.index*10+i),all=is.every(i=>b.selected.includes(i));b.selected=all?b.selected.filter(i=>!is.includes(i)):[...new Set([...b.selected,...is])];}
  if(a==='view'&&['grid','pie','line'].includes(d.value)&&!b.seen.includes(d.value))b.seen.push(d.value);
 }
 return{board:b,issue};
}
export function act(t,m,action,data={}){const a=action.replace(/^b16-/,''),e={action:a,data:{...Object.fromEntries(Object.entries(data).filter(([k])=>['index','value','row'].includes(k)).map(([k,v])=>[k,String(v)])),fields:Object.fromEntries(Object.keys(fields).map(k=>[k,m[k]]))}};if(!serial(e)||m.history.length>=2000)return m;const r=apply(t,copy(m.board),e);m.board=r.board;m.issue=r.issue;m.history.push(e);return m;}
export function field(t,m,k){if(k in fields)m[k]=String(m[k]);}
export function valid(t,m){try{if(!m||!TYPES.has(t.type)||!Object.keys(fields).every(k=>text(m[k]))||!text(m.issue)||!Array.isArray(m.history)||m.history.length>2000||!m.history.every(serial))return false;let b=board(t);for(const e of m.history)b=apply(t,b,e).board;return same(b,m.board);}catch{return false;}}
export function inspect(t,m){if(!valid(t,m))return{correct:false,feedback:'这份过程读不完整，重新做这一小步，原来的尝试仍保留。'};const b=m.board;let ok=false,feedback='把做出的量和你写下的量对照一下。';
 switch(t.type){
 case'x-paperlab':ok=t.mode==='classify'?b.judgments.length===t.cases.length:t.mode==='paint'?b.saved.length>=2&&equal(m.answer,1,4):b.rows*b.cols===t.d&&b.selected.length===(t.take||1)&&equal(m.answer,t.take||1,t.d)&&(t.mode!=='fold'||b.folds.length===Math.log2(t.d))&&(t.mode!=='build'||b.rows===number(m.rows)&&b.cols===number(m.cols));feedback='小份必须一样大；数的是份数，不是切线。涂出要求的小份，再给它写名字。';break;
 case'x-portiongroups':ok=groupCounts(t,b).every(n=>n===t.total/t.d)&&b.taken.length===t.n&&equal(m.per,t.total,t.d)&&equal(m.answer,t.total*t.n,t.d)&&(!t.name||equal(m.num+'/'+m.den,t.n,t.d))&&(!t.equation||eq(m.equation,t.equation));feedback='先让每组一样多，再取要求的几组。全部物品才是整体，不能拿未选中的数量作分母。';break;
 case'x-portionbar':ok=b.built&&b.parts===t.d&&number(m.parts)===b.parts&&b.taken.length===t.n&&equal(m.per,t.total,t.d)&&equal(m.answer,t.total*t.n,t.d)&&m.unit===t.unit&&eq(m.equation,t.equations);feedback='整体先平均分，再取几份；答案还要带回故事里的单位。';break;
 case'x-unitwalk':{const q=t.n/t.d;ok=b.parts===t.d&&number(m.parts)===b.parts&&b.steps.length===t.n&&equal(m.answer,t.n,t.d)&&(!t.copies||number(m.copies)===t.n&&String(m.equation).replace(/\s/g,'').split('+').length===t.n&&String(m.equation).replace(/\s/g,'').split('+').every(s=>equal(s,1,t.d)))&&(!t.whole||equal(m.whole,Math.floor(q))&&equal(m.remainder,t.n%t.d,t.d))&&(!t.decimal||equal(m.decimal,t.n,t.d))&&(!t.bounds||number(m.left)===Math.floor(q)&&number(m.right)===Math.ceil(q))&&(!t.buy||number(m.total)===Math.ceil(q))&&(!t.chunk||eq(m.equation,[`(${t.chunk}/${t.d})*${t.n/t.chunk}=${t.n}/${t.d}`,`${t.n/t.chunk}*(${t.chunk}/${t.d})=${t.n}/${t.d}`]))&&(!t.halfBound||m.relation==='<');feedback='每一步的长度不变。跨过1还可以继续；相加的是这些小份的个数。';break;}
 case'x-wholeshare':ok=b.cut&&b.rounds===Math.floor(t.wholes/t.people)&&Array.from({length:t.people},(_,i)=>b.groups.filter(g=>g===i).length).every(n=>n===sharedRemainder(t))&&equal(m.answer,t.wholes,t.people)&&sharingEquation(m.equation,t.wholes,t.people)&&sharingEquation(m.total,t.wholes,t.people,true)&&number(m.whole)===Math.floor(t.wholes/t.people)&&equal(m.remainder,sharedRemainder(t),t.people);feedback='完整的先公平分，余下每个再分给所有人；把每人的量乘回人数，应回到原来的总量。';break;
 case'x-samefraction':{const l=t.left,r=t.right,relation=l[0]*r[1]<r[0]*l[1]?'<':l[0]*r[1]>r[0]*l[1]?'>':'=';ok=b.prediction!==null&&b.left.length===l[0]&&b.right.length===r[0]&&b.overlay&&m.relation===relation&&m.reason==='same-whole'&&(!t.common||b.refine!==null&&number(m.parts)===b.refine&&norm(m.left)===`${l[0]*b.refine/l[1]}/${b.refine}`&&norm(m.right)===`${r[0]*b.refine/r[1]}/${b.refine}`);feedback='两边先用同样大的整体，再把所取的部分叠齐；新小格必须能同时分好原来的两种份。';break;}
 case'x-mixedaxis':ok=t.cards.every((s,i)=>equal(String(b.placements[i]),...rational(s)))&&b.ordered.length===t.cards.length&&b.ordered.every((i,j)=>j===0||value(t.cards[b.ordered[j-1]])<=value(t.cards[i]))&&b.symbols.length===(t.statements||[]).length;feedback='所有数共用这条线，左边小、右边大。不同名字可以落在同一点，相等的卡片前后都可以。';break;
 case'x-digitlens':ok=b.records.length===t.cases.length&&b.seen.length===t.cases.length;feedback='把每张卡高亮数字的实际大小读出来，换大位置和小位置都试试。';break;
 case'x-fractiontalk':ok=b.records.length===t.cases.length;feedback='数值、单位和说法都要准确。等值写法可以不同；这一步按指定的记录形式写。';break;
 case'x-graphpoints':ok=t.data.every(p=>b.points.some(q=>same(p,q)))&&b.points.length===t.data.length&&(t.read?b.selected.length===2&&t.read.every(i=>b.selected.includes(i))&&equal(m.answer,Math.abs(t.data[t.read[0]][1]-t.data[t.read[1]][1]))&&eq(m.equation,[`${Math.max(...t.read.map(i=>t.data[i][1]))}-${Math.min(...t.read.map(i=>t.data[i][1]))}=${Math.abs(t.data[t.read[0]][1]-t.data[t.read[1]][1])}`]):equal(m.answer,t.rate)&&m.reason==='per-x');feedback='先按横轴找到哪一次，再按纵轴找到多少；差多少要比较两次的量。';break;
 case'x-rowrepair':ok=b.shift===1&&number(m.shift)===1&&b.seen.includes(t.wrongShift)&&equal(m.answer,t.a*t.b)&&m.reason==='tens-row';feedback='第二行乘的是几份十，不是几份一；把整行对齐后再合起来。';break;
 case'x-anglejoin':{const p=[...b.placed].sort((a,b)=>a.start-b.start);ok=b.taken.length===3&&p.length===3&&p[0].start===0&&p.at(-1).end===180&&p.every((q,i)=>i===0||q.start===p[i-1].end)&&same(b.chain,['original','together','straight'])&&equal(m.answer,180);feedback='把三个原来的角搬到同一点，不重叠、不留缝，连成一条直线。图上的拼合记录不替代一般证明。';break;}
 case'x-algebrabar':ok=b.built&&b.count===t.count&&b.fixed===t.fixed&&number(m.count)===b.count&&number(m.fixed)===b.fixed&&b.removed&&b.divided&&equal(m.answer,t.total-t.fixed,t.count)&&eq(m.equation,[`${t.count}*n+${t.fixed}=${t.total}`,`n*${t.count}+${t.fixed}=${t.total}`]);feedback='相同的未知量先摆足份数；等号两边一起去掉额外部分，再一起分成相同的份数。';break;
 case'x-fdpboard':ok=b.selected.length===t.n&&equal(m.num+'/'+m.den,t.n,t.d)&&equal(m.decimal,t.n,t.d)&&equal(m.percent,t.n*100,t.d)&&(t.views||[]).every(v=>b.seen.includes(v));feedback='颜色一直是同一部分。分数、小数与百分数都要说出它相对一个整体有多大。';break;
 }
 return{correct:ok,feedback:ok?'这次的操作和记录对上了。':feedback,evidence:{construction:copy(b),history:copy(m.history),fields:Object.fromEntries(Object.keys(fields).map(k=>[k,m[k]])),openExplanationAssessed:false,physicalActionAssessed:false,generalMasteryAssessed:false}};
}
export function solveSteps(t){const s=[],f=(field,value)=>s.push({field,value:String(value)}),a=(action,data={})=>s.push({action:'b16-'+action,data});
 switch(t.type){
 case'x-paperlab':if(t.mode==='classify'){for(const c of t.cases){f('choice',c.length===t.d&&c.every(n=>n===c[0])?'yes':'no');if(t.writeName)f('answer',c.length===t.d&&c.every(n=>n===c[0])?'1/'+t.d:'');a('judge');}}else if(t.mode==='paint'){for(const cells of[Array.from({length:16},(_,i)=>Math.floor(i/4)),[0,0,0,0,1,1,2,2,1,1,2,2,3,3,3,3]]){for(let i=0;i<16;i++){f('color',cells[i]);a('paint',{index:i});}a('save');}f('answer','1/4');}else{if(t.mode==='fold')for(let i=0;i<Math.log2(t.d);i++)a('fold',{value:i%2?'y':'x'});else{f('rows',t.d===6?2:1);f('cols',t.d===6?3:t.d);a('partition');}for(let i=0;i<(t.take||1);i++)a('paper',{index:i});f('answer',(t.take||1)+'/'+t.d);}break;
 case'x-portiongroups':for(let g=0;g<t.d;g++){a('group',{index:g});for(let i=g;i<t.total;i+=t.d)a('token',{index:i});}for(let i=0;i<t.n;i++)a('take',{index:i});f('per',t.total/t.d);f('answer',t.total*t.n/t.d);if(t.name){f('num',t.n);f('den',t.d);}if(t.equation)f('equation',t.equation[0]);break;
 case'x-portionbar':f('parts',t.d);a('bar');for(let i=0;i<t.n;i++)a('take',{index:i});f('per',t.total/t.d);f('answer',t.total*t.n/t.d);f('unit',t.unit);f('equation',t.equations[0]);break;
 case'x-unitwalk':f('parts',t.d);a('partition');for(let i=0;i<t.n;i+=(t.chunk||1))a('walk');f('answer',t.n+'/'+t.d);if(t.copies){f('copies',t.n);f('equation',Array(t.n).fill('1/'+t.d).join('+'));}if(t.whole){f('whole',Math.floor(t.n/t.d));f('remainder',(t.n%t.d)+'/'+t.d);}if(t.decimal)f('decimal',t.n/t.d);if(t.bounds){f('left',Math.floor(t.n/t.d));f('right',Math.ceil(t.n/t.d));}if(t.buy)f('total',Math.ceil(t.n/t.d));if(t.chunk)f('equation',`(${t.chunk}/${t.d})*${t.n/t.chunk}=${t.n}/${t.d}`);if(t.halfBound)f('relation','<');break;
 case'x-wholeshare':for(let i=0;i<Math.floor(t.wholes/t.people);i++)a('round');a('cut-wholes');for(let g=0;g<t.people;g++){a('person',{index:g});for(let i=g;i<sharedRemainder(t)*t.people;i+=t.people)a('share-piece',{index:i});}f('answer',t.wholes+'/'+t.people);f('equation',`${t.wholes}÷${t.people}=${t.wholes}/${t.people}`);f('total',`(${t.wholes}/${t.people})*${t.people}=${t.wholes}`);f('whole',Math.floor(t.wholes/t.people));f('remainder',sharedRemainder(t)+'/'+t.people);break;
 case'x-samefraction':{const rel=t.left[0]*t.right[1]<t.right[0]*t.left[1]?'<':t.left[0]*t.right[1]>t.right[0]*t.left[1]?'>':'=';f('prediction',rel);a('predict');for(const row of['left','right'])for(let i=0;i<t[row][0];i++)a('fraction',{row,index:i});a('overlay');if(t.common){let d=1;while(d%t.left[1]||d%t.right[1])d++;f('parts',d);a('refine');f('left',t.left[0]*d/t.left[1]+'/'+d);f('right',t.right[0]*d/t.right[1]+'/'+d);}f('relation',rel);f('reason','same-whole');break;}
 case'x-mixedaxis':for(let i=0;i<t.cards.length;i++){a('select',{index:i});f('position',value(t.cards[i]));a('place');}for(const i of t.cards.map((_,i)=>i).sort((a,b)=>value(t.cards[a])-value(t.cards[b])))a('order',{index:i});for(const q of t.statements||[]){f('relation',q.symbol);a('symbol');}break;
 case'x-digitlens':for(let i=0;i<t.cases.length;i++){a('digit',{index:i});f('answer',t.cases[i].n/(t.cases[i].d||1));a('digit-save');}break;
 case'x-fractiontalk':for(const c of t.cases){if(c.kind==='vocab'){f('top','numerator');f('bottom','denominator');f('word','equivalent');}else if(c.kind==='symbol')f('relation',c.symbol);else{f('answer',c.kind==='money'?(c.n/100).toFixed(2):c.n/(c.d||1));f('unit',c.unit||'yuan');}a('talk');}break;
 case'x-graphpoints':for(const[x,y]of t.data){f('x',x);f('y',y);a('plot');}if(t.read){for(const index of t.read)a('readpoint',{index});const max=Math.max(...t.read.map(i=>t.data[i][1])),min=Math.min(...t.read.map(i=>t.data[i][1]));f('answer',max-min);f('equation',`${max}-${min}=${max-min}`);}else{f('answer',t.rate);f('reason','per-x');}break;
 case'x-rowrepair':f('shift',1);a('shift');f('answer',t.a*t.b);f('reason','tens-row');break;
 case'x-anglejoin':{let start=0;for(let i=0;i<3;i++){a('angle',{index:i});f('rotation',start);a('rotate-place');start+=t.angles[i];}for(const value of['original','together','straight'])a('chain',{value});f('answer',180);break;}
 case'x-algebrabar':f('count',t.count);f('fixed',t.fixed);a('algebra');f('result',t.total-t.fixed);a('remove');f('result',(t.total-t.fixed)/t.count);a('divide');f('answer',(t.total-t.fixed)/t.count);f('equation',`${t.count}*n+${t.fixed}=${t.total}`);break;
 case'x-fdpboard':if(t.d===100){for(let i=0;i<Math.floor(t.n/10);i++)a('row',{index:i});for(let i=Math.floor(t.n/10)*10;i<t.n;i++)a('cell',{index:i});}else for(let i=0;i<t.n;i++)a('cell',{index:i});for(const value of t.views||[])a('view',{value});f('num',t.n);f('den',t.d);f('decimal',t.n/t.d);f('percent',t.n*100/t.d);break;
 }return s;
}
export function example(t){const m=initial(t);for(const s of solveSteps(t))if(s.field){m[s.field]=s.value;field(t,m,s.field);}else act(t,m,s.action,s.data);return m;}
