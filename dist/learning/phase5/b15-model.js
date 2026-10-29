import * as old from './b14-model.js';
export const TYPES=new Set(['x-orderlab','x-lawtiles','x-shapeangle','x-fractionbridge','x-signwalk','x-undolab','x-decimalproduct','x-decimaldivide','x-estimatepad','x-comparebars','x-pairtable','x-storychain']);
const copy=x=>structuredClone(x),same=(a,b)=>JSON.stringify(a)===JSON.stringify(b),int=(v,a=0,b=1e7)=>Number.isSafeInteger(v)&&v>=a&&v<=b;
export const number=s=>typeof s==='string'&&/^[+-]?\d{1,10}(?:\.\d{1,8})?$/.test(s.trim())?Number(s):null;
const text=s=>typeof s==='string'&&s.length<=2000,near=(a,b)=>a!==null&&Number.isFinite(a)&&Math.abs(a-b)<1e-8;
export const norm=s=>String(s).replace(/\s/g,'').replace(/[×·]/g,'*').replace(/÷/g,'/').replace(/[−–]/g,'-').replace(/²/g,'^2').replace(/³/g,'^3').replace(/（/g,'(').replace(/）/g,')');
// A bounded expression parser. No eval, Function, identifier lookup or side effects.
export function parse(raw){if(/\d\s+\d/.test(String(raw)))throw Error('两个数之间还缺运算符。');const s=norm(raw);if(!s||s.length>200||/[^\d.+\-*/^()\[\]{}√]/.test(s))throw Error('只用数字、运算符和括号。');let pos=0,id=0;const leaf=v=>({id:id++,op:'num',v});
 function atom(){const c=s[pos];if(c==='+'||c==='-'){pos++;return{op:c==='-'?'neg':'pos',id:id++,a:expression(25)};}if(c==='√'){pos++;return{op:'sqrt',id:id++,a:expression(25)};}if('([{'.includes(c||'~')){pos++;const a=expression(0),close={ '(':')','[':']','{':'}'}[c];if(s[pos++]!==close)throw Error('括号要一一配好。');return a;}const m=s.slice(pos).match(/^\d+(?:\.\d+)?/);if(!m)throw Error('这里还缺一个数。');pos+=m[0].length;return leaf(Number(m[0]));}
 function expression(min){let a=atom();while(pos<s.length){const op=s[pos],p={'+':10,'-':10,'*':20,'/':20,'^':30}[op];if(!p||p<min)break;pos++;a={op,id:id++,a,b:expression(op==='^'?p:p+1)};}return a;}
 const tree=expression(0);if(pos!==s.length)throw Error('检查数与运算符之间的连接。');const v=value(tree);if(!Number.isFinite(v)||Math.abs(v)>1e10)throw Error('这次只在有限的数里试，不能除以0。');return tree;}
export function value(n){if(n.op==='num')return n.v;const a=value(n.a),b=n.b?value(n.b):0;return n.op==='+'?a+b:n.op==='-'?a-b:n.op==='*'?a*b:n.op==='/'?a/b:n.op==='^'?a**b:n.op==='neg'?-a:n.op==='sqrt'?Math.sqrt(a):a;}
export function canonical(n){if(n.op==='num')return String(n.v);if(!n.b)return n.op+'('+canonical(n.a)+')';const xs=[canonical(n.a),canonical(n.b)];if(['+','*'].includes(n.op))xs.sort();return n.op+'('+xs.join(',')+')';}
export const equivalent=(a,b)=>{try{return canonical(parse(a))===canonical(parse(b));}catch{return false;}};
export function nodes(tree){return tree?[...nodes(tree.a),...nodes(tree.b),tree]:[];}
export const opText=op=>({'*':'×','/':'÷','^':'^','neg':'−','sqrt':'√','pos':'+'}[op]||op);
export function expressionText(n){if(n.op==='num')return String(n.v);return n.b?'('+expressionText(n.a)+opText(n.op)+expressionText(n.b)+')':opText(n.op)+'('+expressionText(n.a)+')';}
const isDone=(n,done)=>n.op==='num'||Object.hasOwn(done,n.id);
export const ready=(n,done)=>n.op!=='num'&&isDone(n.a,done)&&(!n.b||isDone(n.b,done));
const rootFields={answer:'',expression:'',result:'',reason:'',operator:'',amount:'',left:'',right:'',estimate:'',judgment:'',proof:'',method:'',entry:'',unit:'',base:'',q:'',used:'',rest:'',exchange:'',point:'',check:'',equation:'',angleB:'',angleC:'',angleD:'',numerator:'0',thousandths:'0',percent:'',skew:'30',n:'2',coeff:'',constant:'',count:'0',part:'0',extra:'0',addAnswer:'',quantity:'',meaning:''};
export const innerTask=t=>({type:'x-multable',a:Number(t.decimal.replace('.','')),b:t.multiplier,estimate:t.estimate,prompt:''});
const originalDigits=t=>t.decimal.replace('.','').split('').map(Number),whole=t=>t.decimal.split('.')[0].length;
function board(t){switch(t.type){
 case'x-orderlab':return{expression:t.construct?'':t.expression,tree:t.construct?null:parse(t.expression),done:{},selected:null,steps:[],first:null};
 case'x-lawtiles':return{n:0,c:0,trials:[]};
 case'x-shapeangle':return{parallel:[],seen:[]};
 case'x-fractionbridge':return{selected:[]};
 case'x-signwalk':return{rows:[],first:null};
 case'x-undolab':return{value:t.end,steps:[]};
 case'x-decimalproduct':return{};
 case'x-decimaldivide':return{digits:originalDigits(t),steps:[],point:null,ready:false,current:null};
 case'x-estimatepad':return{first:null,estimate:null,runs:[]};
 case'x-comparebars':return{built:null};
 case'x-pairtable':return{pairs:[],left:null};
 case'x-storychain':return{groups:t.values.map((v,i)=>({value:v,expr:String(i),ids:[i]})),selected:[],steps:[]};
}}
export const initial=t=>({...rootFields,history:[],board:board(t),issue:'',...(t.type==='x-comparebars'?{count:'1',part:t.unknown==='part'?'1':String(t.part)}:{}),...(t.type==='x-decimalproduct'?{inner:old.initial(innerTask(t))}:{})});
export const decimalPosition=(t,b)=>whole(t)-1-b.steps.length;
export const divisionFinished=(t,b)=>b.steps.length===b.digits.length&&b.steps.length>0&&b.steps.at(-1).r===0;
export const signRows=t=>t.mode==='sequence'?[2,1,0,-1,-2].map(b=>({a:t.a,b,op:'*'})):t.cases;
const applyOp=(a,op,b)=>op==='+'?a+b:op==='-'?a-b:op==='*'?a*b:op==='/'?a/b:op==='square'?a*a:op==='sqrt'?Math.sqrt(a):NaN;
const undoOps={'+':'-','-':'+','*':'/','/':'*',square:'sqrt',sqrt:'square'};
const actions=new Set(['b15-reset','b15-build','b15-op','b15-reduce','b15-tile','b15-trial','b15-parallel','b15-shape','b15-fraction','b15-sign','b15-undo-step','b15-point','b15-zero','b15-bring','b15-div-step','b15-estimate','b15-calculate','b15-bars','b15-left','b15-pair','b15-pick','b15-merge','b15-back']);
const easy=n=>n>0&&(Number.isInteger(n)&&Number.isInteger(n/10**Math.floor(Math.log10(n))*2)||n<10&&Number.isInteger(n*2));
export function estimateOK(t,a,b){return a!==null&&b!==null&&a>0&&b>0&&(a===t.a||easy(a))&&(b===t.b||easy(b))&&(a!==t.a||b!==t.b)&&a/t.a>=.75&&a/t.a<=1.3&&b/t.b>=.75&&b/t.b<=1.3;}
export const expectedJudgment=t=>t.candidate/applyOp(t.a,t.op,t.b)>.5&&t.candidate/applyOp(t.a,t.op,t.b)<1.5?'plausible':'unreasonable';
export const rootSteps=t=>[...t.forward].reverse().map(s=>({...s,op:undoOps[s.op]}));
function apply(t,b,e){const a=e.action,d=e.data,f=d.fields;let issue='';const fail=s=>{issue=s;};
 if(a==='b15-reset'){const fresh=board(t);if('first'in b)fresh.first=b.first;return{board:fresh,issue};}
 if(t.type==='x-orderlab'){
  if(a==='b15-build'){b.first??=f.expression;try{const tree=parse(f.expression);if(t.insert&&norm(f.expression).replace(/[()[\]{}]/g,'')!==norm(t.expression).replace(/[()[\]{}]/g,''))fail('数字与运算符保持原样，只换括号。');else{b.expression=f.expression;b.tree=tree;b.done={};b.steps=[];b.selected=null;}}catch(err){fail(err.message);}}
  if(a==='b15-op'&&b.tree){const n=nodes(b.tree).find(n=>n.id===d.index);if(n&&n.op!=='num'&&!Object.hasOwn(b.done,n.id)){b.selected=d.index;if(!ready(n,b.done))fail('这块里面还有没算完的部分，先把它用到的两边准备好。');}}
  if(a==='b15-reduce'&&b.tree){const n=nodes(b.tree).find(n=>n.id===b.selected);if(!n||!ready(n,b.done))fail('先选可以合起来的一块；同一层的乘除、加减分别从左往右。');else if(!near(number(f.result),value(n)))fail('先核对这一小块的运算，其他部分还留在原处。');else{b.done[n.id]=number(f.result);b.steps.push({id:n.id,expression:expressionText(n),value:number(f.result)});b.selected=null;}}
 }
 if(t.type==='x-lawtiles'){
  if(a==='b15-tile'&&['n','c'].includes(d.value)){if(b[d.value]<t.a+2)b[d.value]++;}
  if(a==='b15-trial'){const n=number(f.n);if(!int(n,1,8))fail('这次先让n在1到8之间变。');else{b.trials.push({n,left:t.a*(n+t.b),right:b.n*n+b.c*t.b});if(b.n!==t.a||b.c!==t.a)fail('长条和小块都来自每一份。改变n，再看看哪部分少了一份。');}}
 }
 if(t.type==='x-shapeangle'){
  if(a==='b15-parallel'&&int(d.index,0,1)){const i=b.parallel.indexOf(d.index);i<0?b.parallel.push(d.index):b.parallel.splice(i,1);}
  if(a==='b15-shape'){const n=number(f.skew);if(int(n,0,60)&&!b.seen.includes(n))b.seen.push(n);}
 }
 if(t.type==='x-fractionbridge'&&a==='b15-fraction'&&int(d.index,0,7)){const i=b.selected.indexOf(d.index);i<0?b.selected.push(d.index):b.selected.splice(i,1);}
 if(t.type==='x-signwalk'&&a==='b15-sign'){
  const row=signRows(t)[b.rows.length];if(row){b.first??=f.result;const v=applyOp(row.a,row.op,row.b);if(!near(number(f.result),v))fail('先看大小，再看方向。往下一行时，要延续前面的变化。');else b.rows.push({...row,value:Object.is(v,-0)?0:v});}
 }
 if(t.type==='x-undolab'&&a==='b15-undo-step'){
  const s=rootSteps(t)[b.steps.length];if(s){const amount=number(f.amount),v=applyOp(b.value,f.operator,amount);if(f.operator!==s.op||!['sqrt','square'].includes(s.op)&&amount!==s.amount)fail('先撤回最后做的那一步，再撤回更早的一步。');else if(!near(number(f.result),v))fail('撤回的方法对了，再核对这一步的数。');else{b.steps.push({before:b.value,op:f.operator,amount:amount??0,value:v});b.value=v;}}
 }
 if(t.type==='x-decimaldivide'){
  if(a==='b15-point'&&!b.steps.length){if(number(f.point)!==whole(t))fail('点对着原来的点，表示从个位走到十分位的边界。');else b.point=number(f.point);}
  if(a==='b15-zero'&&b.steps.length===b.digits.length&&!divisionFinished(t,b)&&b.digits.length-whole(t)<t.places)b.digits.push(0);
  if(a==='b15-bring'&&b.point!==null&&!b.ready&&b.steps.length<b.digits.length){const prev=b.steps.at(-1)?.r||0;if(number(f.exchange)!==prev*10)fail('一份当前单位要换成十份更小的单位，剩下的也照样换。');else{b.current=prev*10+b.digits[b.steps.length];b.ready=true;}}
  if(a==='b15-div-step'&&b.ready){const q=number(f.q),u=number(f.used),r=number(f.rest);if(!int(q,0,9)||u!==q*t.divisor||!int(r,0,t.divisor-1)||u+r!==b.current)fail('拿走的加上剩下的，应回到这一段；剩下的还不能再分一份。');else{b.steps.push({q,used:u,r,current:b.current});b.current=null;b.ready=false;}}
 }
 if(t.type==='x-estimatepad'){
  if(a==='b15-estimate'){b.first??={left:f.left,right:f.right,estimate:f.estimate};const l=number(f.left),r=number(f.right),v=applyOp(l,t.op,r);if(!estimateOK(t,l,r)||!near(number(f.estimate),v))fail('选附近、容易算的整数量或半份，先算这个大概。原来的两个数至少改一个。');else b.estimate={left:l,right:r,value:v};}
  if(a==='b15-calculate'&&b.estimate){try{const v=value(parse(f.entry));b.runs.push({entry:f.entry,value:v});}catch(err){b.runs.push({entry:f.entry,value:null});fail(err.message);}}
 }
 if(t.type==='x-comparebars'&&a==='b15-bars'){
  const c=number(f.count),p=number(f.part),x=number(f.extra);if(!int(c,1,12)||!int(p,1,36)||!int(x,0,12))fail('给每份一个长度，再接成几份；另一条只接短短的一段。');else b.built={count:c,part:p,extra:x};
 }
 if(t.type==='x-pairtable'){
  if(a==='b15-left'&&int(d.index,0,t.rows.length-1))b.left=d.index;
  if(a==='b15-pair'&&b.left!==null&&int(d.index,0,t.cols.length-1)){const key=b.left+','+d.index;if(b.pairs.includes(key))fail('这两个已经配过，不重复算。');else b.pairs.push(key);}
 }
 if(t.type==='x-storychain'){
  if(a==='b15-pick'&&int(d.index,0,b.groups.length-1)){const i=b.selected.indexOf(d.index);if(i>=0)b.selected.splice(i,1);else if(b.selected.length<2)b.selected.push(d.index);}
  if(a==='b15-merge'&&b.selected.length===2){const[i,j]=b.selected,l=b.groups[i],r=b.groups[j],v=applyOp(l.value,f.operator,r.value);if(!Number.isFinite(v)||!near(number(f.result),v))fail('按点选先后算这两张，先核对算出的数。');else{const expr=`(${l.expr}${f.operator}${r.expr})`;b.steps.push({before:copy(b.groups),left:l.value,right:r.value,op:f.operator,value:v,expr,meaning:f.meaning});b.groups=b.groups.filter((_,k)=>k!==i&&k!==j);b.groups.push({value:v,expr,ids:[...l.ids,...r.ids]});b.selected=[];}}
  if(a==='b15-back'&&b.steps.length){b.groups=b.steps.pop().before;b.selected=[];}
 }
 return{board:b,issue};
}
function eventValid(e){return e&&same(Object.keys(e).sort(),['action','data'])&&actions.has(e.action)&&e.data&&same(Object.keys(e.data).sort(),['fields','index','value'])&&same(Object.keys(e.data.fields).sort(),Object.keys(rootFields).sort())&&Object.values(e.data.fields).every(text)&&(e.data.index===null||int(e.data.index,0,200))&&(e.data.value===null||text(e.data.value));}
export function act(t,m,action,d={}){if(t.type==='x-decimalproduct'&&action.startsWith('b14-')){old.act(innerTask(t),m.inner,action,d);m.issue=m.inner.issue;return m;}if(!actions.has(action))return m;const e={action,data:{fields:Object.fromEntries(Object.keys(rootFields).map(k=>[k,m[k]])),index:d.index===undefined?null:Number(d.index),value:d.value===undefined?null:String(d.value)}};if(!eventValid(e))return m;const r=apply(t,copy(m.board),e);m.history.push(e);m.board=r.board;m.issue=r.issue;if(action==='b15-reset'&&t.type==='x-decimalproduct')old.act(innerTask(t),m.inner,'b14-reset');return m;}
export function field(t,m,key){if(key.startsWith('inner.')&&m.inner)old.field(innerTask(t),m.inner,key.slice(6));else if(key in rootFields)m[key]=String(m[key]);}
export function valid(t,m){try{if(!TYPES.has(t.type)||!m||!Object.keys(rootFields).every(k=>text(m[k]))||!text(m.issue)||!Array.isArray(m.history)||m.history.length>2000||!m.history.every(eventValid))return false;if(t.type==='x-decimalproduct'&&!old.valid(innerTask(t),m.inner))return false;let b=board(t);for(const e of m.history)b=apply(t,b,e).board;return same(b,m.board);}catch{return false;}}
const equationMatches=(raw,wants)=>wants.some(w=>{const n=norm(raw).toLowerCase(),v=norm(w).toLowerCase();return n===v||n===v.split('=').reverse().join('=');});
export function inspect(t,m){if(!valid(t,m))return{correct:false,feedback:'这份过程不能读，重新做这一小步，原尝试仍会保留。'};const b=m.board;let ok=false,msg='把刚才做出的关系和结果对照一下。';
 switch(t.type){
 case'x-orderlab':{const built=b.tree&&(!t.construct||equivalent(b.expression,t.expected||t.expression)),done=t.writeOnly||b.tree&&Object.hasOwn(b.done,b.tree.id);ok=!!built&&!!done&&(!t.construct||equivalent(m.expression,b.expression))&&(!t.target||near(value(b.tree),t.target))&&(!t.writeOnly?near(number(m.answer),value(b.tree)):true)&&(!t.reason||m.reason===t.reason);msg=t.writeOnly?'写出“先做什么，再做什么”的关系；相同数字凑成相同结果，还不一定是同一件事。':'括号内先准备好；同层乘除、加减分别从左往右。每一块要亲自合过，最后结果也要一致。';break;}
 case'x-lawtiles':ok=b.n===t.a&&b.c===t.a&&new Set(b.trials.filter(x=>x.left===x.right).map(x=>x.n)).size>=2&&number(m.coeff)===t.a&&number(m.constant)===t.a*t.b;msg='每一份里的长条和小块都要留下。换两个n试一试，再分别记长条有几份、固定小块有多少。';break;
 case'x-shapeangle':ok=b.parallel.length===2&&b.seen.includes(0)&&b.seen.some(x=>x>0)&&number(m.skew)===0&&[m.angleB,m.angleC,m.angleD].every(v=>number(v)===90)&&m.reason==='opposite-adjacent';msg='斜着和摆正时，两对对边都仍平行。摆正后一个角是90°，对角相等，相邻两角合180°。';break;
 case'x-fractionbridge':ok=b.selected.length===1&&number(m.thousandths)===125&&number(m.percent)===12.5&&m.answer==='greater'&&m.reason==='same';msg='两条都用同样长的1作整体。八分之一对应千分之几？百分之十二又到哪里？';break;
 case'x-signwalk':ok=b.rows.length===signRows(t).length&&(!t.reason||m.reason===t.reason);msg='延续数的变化，或用乘法倒查除法。负号表示方向，不改变计算大小的规则。';break;
 case'x-undolab':ok=b.steps.length===t.forward.length&&near(number(m.answer),b.value)&&(!t.absolute||m.reason==='nonnegative');msg=t.absolute?'平方会丢掉正负的区别。√9取非负的3，所以从−3出发不会回到−3。':'先撤回最后一步，再撤回前一步；把每次变化记下来。';break;
 case'x-decimalproduct':ok=old.inspect(innerTask(t),m.inner).correct&&number(m.unit)===10**(t.decimal.split('.')[1]?.length||0)&&near(number(m.answer),Number(t.decimal)*t.multiplier);msg='整数记录数的是多少份小单位？每十份或一百份才合成1，换回原单位再写答案。';break;
 case'x-decimaldivide':ok=divisionFinished(t,b)&&near(number(m.answer),Number(t.decimal)/t.divisor)&&equationMatches(m.check,[`${Number(t.decimal)/t.divisor}*${t.divisor}=${Number(t.decimal)}`,`${t.divisor}*${Number(t.decimal)/t.divisor}=${Number(t.decimal)}`]);msg='余数换成更小的单位继续分，点的位置不漂移。最后用每份乘份数检查回原量。';break;
 case'x-estimatepad':{const run=b.runs.at(-1),calc=!t.calculator||run&&equivalent(m.entry,run.entry)&&equivalent(run.entry,`${t.a}${t.op}${t.b}`)&&near(run.value,applyOp(t.a,t.op,t.b));const want=t.interpret==='up'?Math.ceil(t.a/t.b):t.interpret==='down'?Math.floor(t.a/t.b):applyOp(t.a,t.op,t.b);ok=!!b.estimate&&calc&&(!t.candidate||m.judgment===expectedJudgment(t))&&m.proof==='not-proof'&&(!t.exact&&!t.calculator||near(number(m.answer),want))&&(!t.interpret||m.reason===t.interpret)&&(!t.method||t.method.includes(m.method));msg='估计先留下，用来发现数量差得太远的结果；接近只能说大概合理，不能证明精确正确。最后还要按用途读答案。';break;}
 case'x-comparebars':{const u=b.built;ok=!!u&&u.count===t.factor&&u.part===t.part&&u.extra===t.factor&&number(m.count)===u.count&&number(m.part)===u.part&&number(m.extra)===u.extra&&number(m.answer)===(t.unknown==='part'?t.part:t.unknown==='factor'?t.factor:t.part*t.factor)&&number(m.addAnswer)===t.part+t.factor&&equationMatches(m.equation,t.equations);msg='几倍要接几份一样长的；多几只加那一小段。把图里的未知量写回故事关系。';break;}
 case'x-pairtable':ok=b.pairs.length===t.rows.length*t.cols.length&&number(m.answer)===t.rows.length*t.cols.length&&equationMatches(m.equation,[`${t.rows.length}*${t.cols.length}=n`,`${t.cols.length}*${t.rows.length}=n`]);msg='左边的每一种都要与右边的每一种配过一次，不漏，也不重复。';break;
 case'x-storychain':{const g=b.groups[0],structure=b.groups.length===1&&t.plans.some(p=>equivalent(g.expr,p));ok=structure&&near(number(m.answer),g.value)&&b.steps.every(s=>t.meanings.some(v=>v.exprs.some(expr=>equivalent(expr,s.expr))&&v.id===s.meaning))&&(!t.equations||equationMatches(m.equation,t.equations));msg='算出的数与故事里“这一步在找什么”都要对应。先退一步换搭档，不能只靠凑出同一个答案。';break;}
 }
 return{correct:!!ok,feedback:ok?'这次的操作和关系对上了。':msg,evidence:{model:t.type,construction:copy(b),firstAttempts:copy(m.history.filter(e=>!e.action.endsWith('reset'))),generalMasteryAssessed:false,openExplanationAssessed:false,physicalToolUseAssessed:false,mentalFluencyAssessed:false}};
}
// Fixtures replay the same actions; the browser uses their controls, never injects solved models.
function assign(m,key,v){const parts=key.split('.'),last=parts.pop();let p=m;for(const x of parts)p=p[x];p[last]=String(v);}
export function solveSteps(t){const steps=[],m=initial(t),f=(k,v)=>{v=String(v);steps.push({field:k,value:v});assign(m,k,v);field(t,m,k);},a=(action,data={})=>{steps.push({action,data});act(t,m,action,data);};
 switch(t.type){
 case'x-orderlab':if(t.construct){f('expression',t.expected||t.expression);a('b15-build');}if(!t.writeOnly){for(const n of nodes(m.board.tree).filter(n=>n.op!=='num')){a('b15-op',{index:n.id});f('result',value(n));a('b15-reduce');}f('answer',value(m.board.tree));}if(t.reason)f('reason',t.reason);break;
 case'x-lawtiles':for(let i=0;i<t.a;i++){a('b15-tile',{value:'n'});a('b15-tile',{value:'c'});}for(const n of[2,7]){f('n',n);a('b15-trial');}f('coeff',t.a);f('constant',t.a*t.b);break;
 case'x-shapeangle':for(let i=0;i<2;i++)a('b15-parallel',{index:i});f('skew',30);a('b15-shape');f('skew',0);a('b15-shape');for(const k of['angleB','angleC','angleD'])f(k,90);f('reason','opposite-adjacent');break;
 case'x-fractionbridge':a('b15-fraction',{index:0});f('thousandths',125);f('percent',12.5);f('answer','greater');f('reason','same');break;
 case'x-signwalk':for(const row of signRows(t)){f('result',applyOp(row.a,row.op,row.b));a('b15-sign');}if(t.reason)f('reason',t.reason);break;
 case'x-undolab':for(const s of rootSteps(t)){f('operator',s.op);f('amount',s.amount??'');f('result',applyOp(m.board.value,s.op,s.amount));a('b15-undo-step');}f('answer',m.board.value);if(t.absolute)f('reason','nonnegative');break;
 case'x-decimalproduct':for(const s of old.solveSteps(innerTask(t)))s.field?f('inner.'+s.field,s.value):a(s.action,s.data);f('unit',10**t.decimal.split('.')[1].length);f('answer',Number(t.decimal.replace('.',''))*t.multiplier/10**t.decimal.split('.')[1].length);break;
 case'x-decimaldivide':f('point',whole(t));a('b15-point');for(let guard=0;!divisionFinished(t,m.board)&&guard<15;guard++){if(m.board.steps.length===m.board.digits.length)a('b15-zero');f('exchange',(m.board.steps.at(-1)?.r||0)*10);a('b15-bring');const v=m.board.current,q=Math.floor(v/t.divisor);f('q',q);f('used',q*t.divisor);f('rest',v%t.divisor);a('b15-div-step');}f('answer',Number(t.decimal)/t.divisor);f('check',`${Number(t.decimal)/t.divisor}*${t.divisor}=${Number(t.decimal)}`);break;
 case'x-estimatepad':{const rounded=n=>n<10?Math.round(n*2)/2:Math.round(n/10**Math.floor(Math.log10(n)))*10**Math.floor(Math.log10(n));let l=rounded(t.a),r=rounded(t.b);if(l===t.a&&r===t.b)l=t.a>=100?Math.floor(t.a/100)*100:Math.round(t.a/10)*10;f('left',l);f('right',r);f('estimate',applyOp(l,t.op,r));a('b15-estimate');if(t.calculator){f('entry',`${t.a}${t.op}${t.b}`);a('b15-calculate');}if(t.candidate)f('judgment',expectedJudgment(t));f('proof','not-proof');if(t.method)f('method',t.method[0]);if(t.interpret)f('reason',t.interpret);if(t.exact||t.calculator)f('answer',t.interpret==='up'?Math.ceil(t.a/t.b):t.interpret==='down'?Math.floor(t.a/t.b):applyOp(t.a,t.op,t.b));break;}
 case'x-comparebars':f('count',t.factor);f('part',t.part);f('extra',t.factor);a('b15-bars');f('answer',t.unknown==='part'?t.part:t.unknown==='factor'?t.factor:t.part*t.factor);f('addAnswer',t.part+t.factor);f('equation',t.equations[0]);break;
 case'x-pairtable':for(let i=0;i<t.rows.length;i++){a('b15-left',{index:i});for(let j=0;j<t.cols.length;j++)a('b15-pair',{index:j});}f('answer',t.rows.length*t.cols.length);f('equation',`${t.rows.length}*${t.cols.length}=n`);break;
 case'x-storychain':{const tree=parse(t.plans[0]);for(const n of nodes(tree).filter(n=>n.op!=='num')){const left=expressionText(n.a),right=expressionText(n.b),i=m.board.groups.findIndex(g=>equivalent(g.expr,left)),j=m.board.groups.findIndex(g=>equivalent(g.expr,right));if(i<0||j<0)throw Error('unavailable story operands');a('b15-pick',{index:i});a('b15-pick',{index:j});f('operator',n.op);f('result',applyOp(m.board.groups[i].value,n.op,m.board.groups[j].value));const expr=expressionText(n);f('meaning',t.meanings.find(s=>s.exprs.some(p=>equivalent(p,expr)))?.id||'');a('b15-merge');}f('answer',m.board.groups[0].value);if(t.equations)f('equation',t.equations[0]);break;}
 }
 return steps;
}
export function example(t){const m=initial(t);for(const s of solveSteps(t))if(s.field){assign(m,s.field,s.value);field(t,m,s.field);}else act(t,m,s.action,s.data);return m;}
