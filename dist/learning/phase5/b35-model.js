// Replayable algebra investigations. Completion records bounded constructions,
// not an independent explanation, proof, transfer, or long-term understanding.
import {rational} from './b16-model.js';
export const TYPES=new Set(['x-a35-walk','x-a35-build','x-a35-try','x-a35-balance','x-a35-pairs','x-a35-sort','x-a35-grid','x-a35-factor','x-a35-plot']);
const cp=x=>structuredClone(x),same=(a,b)=>JSON.stringify(a)===JSON.stringify(b),text=s=>typeof s==='string'&&s.length<=1200,int=(x,a,b)=>Number.isSafeInteger(x)&&x>=a&&x<=b;
const gcd=(a,b)=>{a=Math.abs(a);b=Math.abs(b);while(b)[a,b]=[b,a%b];return a||1;};
function rat(x){let p=Array.isArray(x)?x:rational(String(x));if(!p||!Number.isSafeInteger(p[0])||!Number.isSafeInteger(p[1])||p[1]===0)return null;let[n,d]=p;if(d<0){n=-n;d=-d;}const g=gcd(n,d);n/=g;d/=g;if(n===0)return[0,1];return int(n,-10000000,10000000)&&int(d,1,1000000)?[n,d]:null;}
const add=(a,b)=>rat([a[0]*b[1]+b[0]*a[1],a[1]*b[1]]), neg=a=>[-a[0],a[1]],mul=(a,b)=>rat([a[0]*b[0],a[1]*b[1]]),div=(a,b)=>b[0]===0?null:rat([a[0]*b[1],a[1]*b[0]]),equal=(a,b)=>!!a&&!!b&&a[0]===b[0]&&a[1]===b[1];
export const rstring=r=>r[1]===1?String(r[0]):`${r[0]}/${r[1]}`;
export const sameNumber=(a,b)=>equal(rat(a),rat(b));
const keys=['1','x','x2','y','y2','xy'];
// Parse a bounded sum of monomials; no eval and no uncontrolled expression execution.
export function polynomial(raw,{simplified=false}={}){
 let s=String(raw??'').trim().replace(/\s+/g,'').replace(/[−–]/g,'-').replace(/[×·]/g,'*').replace(/²/g,'^2').replace(/n/g,'x');
 if(!s||s.length>160||!/^[\dxy+*/.\-^]+$/.test(s))return null;
 const chunks=s.match(/[+-]?[^+-]+/g);if(!chunks||chunks.join('')!==s)return null;let out=Object.fromEntries(keys.map(k=>[k,[0,1]])),seen=new Set();
 for(let chunk of chunks){let sign=1;if(chunk[0]==='+'||chunk[0]==='-'){if(chunk[0]==='-')sign=-1;chunk=chunk.slice(1);}const m=/^(?:(\d+(?:\.\d+)?(?:\/\d+)?)\*?)?(x\^2|y\^2|x\*y|y\*x|xy|x|y)?$/.exec(chunk);if(!m||!m[1]&&!m[2])return null;let k=({'x^2':'x2','y^2':'y2','x*y':'xy','y*x':'xy'}[m[2]]||m[2]||'1');if(!keys.includes(k))return null;let c=rat((sign<0?'-':'')+(m[1]||'1'));if(!c)return null;if(simplified&&c[0]!==0&&seen.has(k))return null;if(c[0]!==0)seen.add(k);out[k]=add(out[k],c);if(!out[k])return null;}
 return out;
}
export function polyEqual(raw,expected,opts={}){const a=polynomial(raw,opts),b=polynomial(expected);return !!a&&!!b&&keys.every(k=>equal(a[k],b[k]));}
export function equationEqual(raw,expected){let xs=String(raw??'').replace(/[＝]/g,'=').split('=');if(xs.length!==2||expected.length!==2)return false;return polyEqual(xs[0],expected[0])&&polyEqual(xs[1],expected[1])||polyEqual(xs[0],expected[1])&&polyEqual(xs[1],expected[0]);}
function answerOK(q,v){if(q.kind==='choice')return String(v).trim()===String(q.value);if(q.kind==='poly')return polyEqual(v,q.value,{simplified:!!q.simplified});if(q.kind==='equation')return equationEqual(v,q.value);const a=rat(v),b=rat(q.value);return equal(a,b);}
const mk=t=>{const b={first:{},bad:false};switch(t.type){
 case'x-a35-walk':return{...b,position:t.start,path:[]};
 case'x-a35-build':return{...b,steps:[],runs:[]};
 case'x-a35-try':return{...b,trials:[]};
 case'x-a35-balance':return{...b,left:t.left.map(rat),right:t.right.map(rat),steps:[],trials:[],preview:null};
 case'x-a35-pairs':return{...b,pairs:[]};
 case'x-a35-sort':return{...b,selected:null,assigned:Array(t.items.length).fill('')};
 case'x-a35-grid':return{...b,cells:Array(t.rows.length*t.cols.length).fill('')};
 case'x-a35-factor':return{...b,trials:[]};
 case'x-a35-plot':return{...b,trials:[]};
 }};
export function initial(t){return{board:mk(t),history:[],value:'',second:'',third:'',fourth:'',prose:'',answers:Array(t.questions?.length||0).fill(''),issue:''};}
const names=new Set(['walk','try','op','one-side','pair','choose','group','cell','factor','plot','undo','reset','block','run','clear']);
const eventOK=e=>e&&names.has(e.a)&&['i','v','w','z','k'].every(j=>text(e[j]));
const validR=r=>Array.isArray(r)&&r.length===2&&equal(r,rat(r));
const calc=(a,b,x)=>add(mul(a,x),b);
const term=(c,k)=>c===0?'0':k==='1'?String(c):`${c===1?'':c===-1?'-':c}${k==='x2'?'x^2':k==='y2'?'y^2':k}`;
function product(a,b){const exp={1:[0,0],x:[1,0],x2:[2,0],y:[0,1],y2:[0,2],xy:[1,1]},key={'0,0':'1','1,0':'x','2,0':'x2','0,1':'y','0,2':'y2','1,1':'xy'},u=exp[a.k],v=exp[b.k];if(!u||!v)return null;const k=key[(u[0]+v[0])+','+(u[1]+v[1])];return k?{c:a.c*b.c,k}:null;}
function graphTrial(t,x,y){return{pair:[x,y],on:t.lines.map(l=>Math.abs(y-(l.m*x+l.b))<1e-9)};}
function apply(t,b,e){let issue='';const fail=s=>{b.bad=true;issue=s;},i=Number(e.i);
 if(t.type==='x-a35-walk'){
  if(e.a==='walk'){const n=Number(e.i);if(t.jumps.includes(n)&&int(b.position+n,t.min,t.max)){b.position+=n;b.path.push(n);}}
  if(e.a==='undo'&&b.path.length)b.position-=b.path.pop();if(e.a==='reset'){b.position=t.start;b.path=[];}
 }
 if(t.type==='x-a35-build'){
  if(e.a==='block'&&t.blocks.some(x=>x.id===e.i)&&!b.steps.includes(e.i))b.steps.push(e.i);
  if(e.a==='undo'&&b.steps.length)b.steps.pop();if(e.a==='clear')b.steps=[];
  if(e.a==='run'){const x=rat(e.v);b.first.run??={steps:cp(b.steps),value:e.v};if(!x||b.steps.length!==t.required.length)fail('先排好需要的两步，再选一个数试。');else{let y=x;for(const id of b.steps){const block=t.blocks.find(v=>v.id===id),amount=rat(block.value);y=block.op==='mul'?mul(y,amount):block.op==='add'?add(y,amount):add(y,neg(amount));if(!y)break;}if(y){const ok=same(b.steps,t.required)&&equal(y,rat(t.target));b.runs.push({steps:cp(b.steps),value:rstring(x),result:rstring(y),ok});if(!ok)b.bad=true;}}}
 }
 if(t.type==='x-a35-try'&&e.a==='try'){
  const x=rat(e.v);b.first.try??=e.v;if(!x)fail('先写一个数，再放进关系里试。');else if(b.trials.length<40){const left=calc(rat(t.a),rat(t.b),x),right=rat(t.right);if(left){const eq=equal(left,right);if(!eq)b.bad=true;b.trials.push({x:rstring(x),left:rstring(left),right:rstring(right),equal:eq});}}
 }
 if(t.type==='x-a35-balance'){
  if(e.a==='one-side'){b.first.oneSide??={op:e.i,value:e.v};const amount=rat(e.v),left=cp(b.left);if(amount){left[1]=add(left[1],neg(amount));if(left[1])b.preview={left,right:cp(b.right),amount:rstring(amount)};}fail('只改变一边可能改变原来的等式；试试对两边做同样的事。');}
  if(e.a==='op'){
   const value=rat(e.v);b.first.operation??={op:e.i,value:e.v};if(!value||!['add','sub','addx','subx','mul','div'].includes(e.i)||(['mul','div'].includes(e.i)&&value[0]===0)){fail('输入一个数；乘和除时不能用0，保证两边仍是等价关系。');}
   else{let left=cp(b.left),right=cp(b.right),applySide=s=>{if(e.i==='add')s[1]=add(s[1],value);if(e.i==='sub')s[1]=add(s[1],neg(value));if(e.i==='addx')s[0]=add(s[0],value);if(e.i==='subx')s[0]=add(s[0],neg(value));if(e.i==='mul')s=s.map(x=>mul(x,value));if(e.i==='div')s=s.map(x=>div(x,value));return s;};left=applySide(left);right=applySide(right);if(!left.every(validR)||!right.every(validR))fail('数值太大，先退回一步再试。');else{b.preview=null;b.left=left;b.right=right;b.steps.push({op:e.i,value:rstring(value),left:cp(left),right:cp(right)});}}
  }
  if(e.a==='undo'&&b.steps.length){b.preview=null;b.steps.pop();const last=b.steps.at(-1);b.left=cp(last?.left||t.left.map(rat));b.right=cp(last?.right||t.right.map(rat));}
  if(e.a==='reset'){b.preview=null;b.steps=[];b.left=t.left.map(rat);b.right=t.right.map(rat);}
  if(e.a==='try'){const x=rat(e.v);b.first.try??=e.v;if(!x)fail('先写一个数，再代回原来的等式。');else if(b.trials.length<40){const left=calc(rat(t.left[0]),rat(t.left[1]),x),right=calc(rat(t.right[0]),rat(t.right[1]),x);if(left&&right){const eq=equal(left,right);if(!eq)b.bad=true;b.trials.push({x:rstring(x),left:rstring(left),right:rstring(right),equal:eq});}}}
 }
 if(t.type==='x-a35-pairs'&&e.a==='pair'){
  const x=Number(e.v),y=Number(e.w);b.first.pair??=[e.v,e.w];if(!/^[-+]?\d+$/.test(e.v.trim())||!/^[-+]?\d+$/.test(e.w.trim())||!t.xs.includes(x)||t.ax*x+t.ay*y!==t.total)fail('把两个数放回关系里；同时留意题目允许的范围。');else if(b.pairs.some(p=>p[0]===x&&p[1]===y))fail('这对数已经留下了，可以换另一对。');else b.pairs.push([x,y]);
 }
 if(t.type==='x-a35-sort'){
  if(e.a==='choose'&&int(i,0,t.items.length-1))b.selected=i;
  if(e.a==='group'&&b.selected!==null&&t.groups.some(g=>g.id===e.i)){const item=t.items[b.selected];b.first.group??={item:b.selected,group:e.i};if(item.group!==e.i)fail('看看这张卡的结构，再比较各组的意思。');else{b.assigned[b.selected]=e.i;b.selected=null;}}
 }
 if(t.type==='x-a35-grid'&&e.a==='cell'&&int(i,0,b.cells.length-1)){
  const a=t.rows[Math.floor(i/t.cols.length)],c=t.cols[i%t.cols.length],p=product(a,c);b.first.cell??={index:i,value:e.v};if(!p||!polyEqual(e.v,term(p.c,p.k)))fail('每个格子都要把所在行和列的两项相乘，符号也一起算。');else b.cells[i]=e.v;
 }
 if(t.type==='x-a35-factor'&&e.a==='factor'){
  const f=Number(e.v),power=e.w,inner=[Number(e.z),Number(e.k)],raw={factor:e.v,power,inner:[e.z,e.k]};b.first.factor??=cp(raw);
  if(!/^[-+]?\d+$/.test(e.v.trim())||!['1','x'].includes(power)||![e.z,e.k].every(s=>/^[-+]?\d+$/.test(s.trim()))||!int(f,1,1000)||!inner.every(n=>int(n,-1000,1000)))fail('写出正的公因数和括号里的两项，再展开检查。');
  else{const g=gcd(t.terms[0].c,t.terms[1].c),mustX=t.terms.every(v=>['x','x2'].includes(v.k)),expectedPower=mustX?'x':'1',powerOK=power===expectedPower,divided=t.terms.map(v=>power==='x'?({'x':'1','x2':'x'}[v.k]||'?'):v.k),restored=inner.map((c,j)=>({c:c*f,k:power==='x'?({'1':'x','x':'x2'}[divided[j]]||'?'):divided[j]})),ok=f===g&&powerOK&&restored.every((v,j)=>v.c===t.terms[j].c&&v.k===t.terms[j].k);b.trials.push({raw,restored,ok});if(!ok)fail('展开后要回到每一项；公因数还要提到最大。');}
 }
 if(t.type==='x-a35-plot'&&e.a==='plot'){
  const xr=rat(e.v),yr=rat(e.w),x=xr?xr[0]/xr[1]:NaN,y=yr?yr[0]/yr[1]:NaN;b.first.point??=[e.v,e.w];if(e.v.trim()===''||e.w.trim()===''||!Number.isFinite(x)||!Number.isFinite(y)||x<0||y<0||x>t.max||y>t.max||Math.abs(x/t.step-Math.round(x/t.step))>1e-8||Math.abs(y/t.step-Math.round(y/t.step))>1e-8)fail('在图的范围内选一个位置。');else if(b.trials.length<40)b.trials.push(graphTrial(t,x,y));
 }
 return{board:b,issue};
}
export function act(t,m,action,data={}){const a=action.replace(/^a35-/,''),e={a,i:String(data.index??''),v:String(data.px??m.value??''),w:String(data.py??m.second??''),z:String(m.third??''),k:String(m.fourth??'')};if(!eventOK(e)||m.history.length>=2000)return m;if(a==='plot'&&data.px!==undefined&&data.py!==undefined){m.value=String(data.px);m.second=String(data.py);}const r=apply(t,cp(m.board),e);m.board=r.board;m.issue=r.issue;m.history.push(e);return m;}
export function field(t,m,k){if(['value','second','third','fourth','prose'].includes(k))m[k]=String(m[k]??'');if(k.startsWith('answers.'))m.answers[Number(k.split('.')[1])]=String(m.answers[Number(k.split('.')[1])]??'');}
export function valid(t,m){try{if(!TYPES.has(t.type)||!m||!['value','second','third','fourth','prose','issue'].every(k=>text(m[k]))||!Array.isArray(m.answers)||m.answers.length!==(t.questions?.length||0)||!m.answers.every(text)||!Array.isArray(m.history)||m.history.length>2000||!m.history.every(eventOK))return false;let b=mk(t);for(const e of m.history)b=apply(t,b,e).board;return same(b,m.board);}catch{return false;}}
export function inspect(t,m){if(!valid(t,m))return{correct:false,feedback:'这份作品暂时读不出来。'};const b=m.board;let ok=false,hint='动手改变一处，再看看关系有没有保持。';
 if(t.type==='x-a35-walk'){ok=b.position===t.target&&b.path.length>0;hint='从已知的数出发，走到目标后再看总共走了多少。';}
 if(t.type==='x-a35-build'){const last=b.runs.at(-1);ok=!!last?.ok&&same(last.steps,b.steps)&&sameNumber(last.value,m.value);hint='先排好动作，再放入一个数；比较结果和目标。';}
 if(t.type==='x-a35-try'){ok=!!b.trials.at(-1)?.equal&&sameNumber(b.trials.at(-1).x,t.solution)&&sameNumber(b.trials.at(-1).x,m.value);hint='把猜想代回两边，比较它们是否一样。';}
 if(t.type==='x-a35-balance'){const x=rat(t.solution),isolated=(l,r)=>equal(l[0],[1,1])&&equal(l[1],[0,1])&&equal(r[0],[0,1])&&equal(r[1],x);ok=b.steps.length>0&&(isolated(b.left,b.right)||isolated(b.right,b.left))&&!!b.trials.at(-1)?.equal&&sameNumber(b.trials.at(-1).x,x)&&sameNumber(b.trials.at(-1).x,m.value);hint='每一步都让两边做同样的变化；找到数后代回最初的关系。';}
 if(t.type==='x-a35-pairs'){ok=b.pairs.length>=t.need&&(!t.all||t.xs.every(x=>b.pairs.some(p=>p[0]===x)));hint='换一个允许的数，找到它的伙伴；表里每对都要符合关系。';}
 if(t.type==='x-a35-sort'){ok=b.assigned.every((g,i)=>g===t.items[i].group);hint='选一张卡，再放到结构相同的一组。';}
 if(t.type==='x-a35-grid'){ok=b.cells.every(Boolean);hint='行和列相遇的每一格都要相乘，最后再合并可以合并的项。';}
 if(t.type==='x-a35-factor'){const last=b.trials.at(-1);ok=!!last?.ok&&same(last.raw,{factor:m.value,power:m.second,inner:[m.third,m.fourth]});hint='提取公因数后，把括号里的每一项乘回去。';}
 if(t.type==='x-a35-plot'){const last=b.trials.at(-1);ok=t.kind==='unique'?!!last&&last.on.every(Boolean)&&Math.abs(last.pair[0]-t.goal[0])<1e-9&&Math.abs(last.pair[1]-t.goal[1])<1e-9&&sameNumber(last.pair[0],m.value)&&sameNumber(last.pair[1],m.second):b.trials.length>=2;hint='选择一个位置，分别放进两条关系里检查。';}
 ok=!!ok&&(t.questions||[]).every((q,i)=>answerOK(q,m.answers[i]));return{correct:ok,feedback:ok?'这次操作和记录对应上了。':hint,evidence:{kind:t.type,board:cp(b),history:cp(m.history),freeExplanationAssessed:false,generalProofAssessed:false,generalMasteryAssessed:false}};
}
export function solveSteps(t){const s=[],f=(field,value)=>s.push({field,value:String(value)}),a=(name,index)=>s.push({action:'a35-'+name,data:index===undefined?{}:{index}});
 if(t.type==='x-a35-walk')for(const n of t.examplePath)a('walk',n);
 if(t.type==='x-a35-build'){for(const id of t.required)a('block',id);f('value',t.example);a('run');}
 if(t.type==='x-a35-try'){f('value',t.solution);a('try');}
 if(t.type==='x-a35-balance'){for(const o of t.exampleOps){f('value',o.value);a('op',o.op);}f('value',t.solution);a('try');}
 if(t.type==='x-a35-pairs')for(const x of t.xs.slice(0,t.all?t.xs.length:t.need)){f('value',x);f('second',(t.total-t.ax*x)/t.ay);a('pair');}
 if(t.type==='x-a35-sort')t.items.forEach((item,i)=>{a('choose',i);a('group',item.group);});
 if(t.type==='x-a35-grid')for(let i=0;i<t.rows.length*t.cols.length;i++){const p=product(t.rows[Math.floor(i/t.cols.length)],t.cols[i%t.cols.length]);f('value',term(p.c,p.k));a('cell',i);}
 if(t.type==='x-a35-factor'){f('value',t.example.factor);f('second',t.example.power);f('third',t.example.inner[0]);f('fourth',t.example.inner[1]);a('factor');}
 if(t.type==='x-a35-plot'){for(const p of t.example){f('value',p[0]);f('second',p[1]);a('plot');}}
 (t.questions||[]).forEach((q,i)=>f('answers.'+i,Array.isArray(q.value)?q.value.join('='):q.value));return s;}
export function example(t){const m=initial(t);for(const s of solveSteps(t)){if(s.field){const[k,i]=s.field.split('.');if(i===undefined)m[k]=s.value;else m[k][+i]=s.value;field(t,m,s.field);}else act(t,m,s.action,s.data);}return m;}
