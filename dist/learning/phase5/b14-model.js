// Bounded, replayable constructions. Completion records work, not general mastery.
export const TYPES=new Set(['x-areaproduct','x-multable','x-divtable','x-numbersearch','x-parityjoin','x-factorforest','x-planproduct','x-squarepair','x-factorcode','x-multisheet']);
const copy=x=>structuredClone(x),same=(a,b)=>JSON.stringify(a)===JSON.stringify(b),int=(n,a=0,b=1e7)=>Number.isSafeInteger(n)&&n>=a&&n<=b;
export const number=s=>typeof s==='string'&&/^\d{1,9}(\.\d{1,6})?$/.test(s.trim())?Number(s):null;
const text=s=>typeof s==='string'&&s.length<=2000,sorted=a=>[...a].sort((x,y)=>x-y),unique=a=>[...new Set(a)],toggle=(a,x)=>{const i=a.indexOf(x);i<0?a.push(x):a.splice(i,1);};
export const isPrime=n=>int(n,2)&&!Array.from({length:Math.max(0,Math.floor(Math.sqrt(n))-1)},(_,i)=>i+2).some(d=>n%d===0);
export const factors=n=>Array.from({length:n},(_,i)=>i+1).filter(d=>n%d===0);
export const gcd=(a,b)=>b?gcd(b,a%b):a;
const fields={answer:'',estimate:'',cutA:'',cutB:'',part:'',base:'',raw:'',digit:'',shift:'',rowvalue:'',q:'',used:'',rest:'',check:'',method:'',precision:'',candidate:'',remainder:'',prediction:'',reason:'',left:'',right:'',expression:'',hcf:'',lcm:'',result:'',operator:'',equation:'',sideA:'0',sideB:'0',start:'',formula:'',condition:''};
export function taskValid(t){if(!t||!TYPES.has(t.type))return false;
 if(['x-areaproduct','x-multable','x-parityjoin'].includes(t.type))return int(t.a,1,9999)&&int(t.b,1,9999)&&(t.type!=='x-multable'||int(t.estimate,1,9999))&&(t.type!=='x-parityjoin'||['+','×'].includes(t.op));
 if(t.type==='x-divtable')return int(t.n,1,99999)&&int(t.d,1,99)&&int(t.places,0,6)&&['keep','up','down','fraction','decimal','round'].includes(t.interpret)&&(t.interpret!=='round'||int(t.dp,0,5)&&t.places>t.dp);
 if(t.type==='x-numbersearch')return Array.isArray(t.ns)&&t.ns.length>0&&t.ns.length<3&&t.ns.every(n=>int(n,1,200))&&['prime','commonFactors','divisible','multiples','squares','recallPrimes'].includes(t.mode);
 if(t.type==='x-factorforest')return Array.isArray(t.ns)&&t.ns.length>0&&t.ns.length<3&&t.ns.every(n=>int(n,2,1000));
 if(t.type==='x-planproduct')return Array.isArray(t.values)&&t.values.length>=2&&t.values.length<=3&&t.values.every(n=>int(n,1,9999));
 if(t.type==='x-squarepair')return int(t.total,2,200);
 if(t.type==='x-factorcode')return int(t.n,2,50)&&['factors','primes'].includes(t.mode);
 return int(t.step,1,20)&&int(t.rows,2,20)&&int(t.highlight,0,20);
}
function board(t){switch(t.type){
 case'x-areaproduct':return{cuts:null,parts:[],values:[]};
 case'x-multable':return{firstEstimate:null,estimateOK:false,row:0,col:0,carry:0,pending:null,digits:[],rows:[],work:[]};
 case'x-divtable':return{method:t.long?'long':t.choose?null:'short',steps:[],ready:false,current:null,containers:0};
 case'x-numbersearch':return{tests:t.ns.map(()=>[]),lists:t.ns.map(()=>[]),selected:[]};
 case'x-parityjoin':return{first:null,joined:false};
 case'x-factorforest':return{nodes:t.ns.map((v,i)=>({id:i,parent:null,root:i,value:v,children:[]})),selected:null,matches:[],pair:[],first:null};
 case'x-planproduct':return{groups:t.values.map((v,i)=>({value:v,expr:String(i),ids:[i]})),selected:[],merges:[],split:false};
 case'x-squarepair':return{trials:[],pair:null};
 case'x-factorcode':return{blocks:[],runs:[]};
 case'x-multisheet':return{values:[],formula:null,selected:[]};
}}
export const initial=t=>({...fields,history:[],board:board(t),issue:''});
export const mulDigits=t=>String(t.a).split('').reverse().map(Number);
export const multiplier=t=>String(t.b).split('').reverse().map(Number);
export function mulCurrent(t,b){const ds=mulDigits(t);return{a:ds[b.col],b:multiplier(t)[b.row],carry:b.carry,unit:10**b.col};}
export const divDigits=t=>[...String(t.n).split('').map(Number),...Array(t.places).fill(0)];
export function divCurrent(t,b){const i=b.steps.length,rem=b.steps.at(-1)?.r||0;return{index:i,previous:rem,next:divDigits(t)[i],value:rem*10+divDigits(t)[i]};}
export function requiredTests(t,side){return t.mode==='divisible'?t.divisors:Array.from({length:Math.max(1,Math.floor(Math.sqrt(t.ns[side])))},(_,i)=>i+1);}
export const foundFactors=(t,b,side)=>sorted(unique(b.tests[side].filter(x=>x.r===0).flatMap(x=>[x.d,t.ns[side]/x.d])));
export const leaves=b=>b.nodes.filter(n=>!n.children.length);
export function primeExpression(raw,n){if(!text(raw))return false;const s=raw.replace(/\s/g,'').replace(/[×·]/g,'*').replace(/²/g,'^2').replace(/³/g,'^3');if(!/^\d+(?:\^\d+)?(?:\*\d+(?:\^\d+)?)*$/.test(s))return false;let product=1;for(const term of s.split('*')){const[p,e=1]=term.split('^').map(Number);if(!isPrime(p)||!int(e,1,20))return false;product*=p**e;if(!Number.isSafeInteger(product)||product>n)return false;}return product===n;}
const planValue=t=>t.values.length===3?t.values[0]/t.values[1]*t.values[2]:t.values[0]*t.values[1];
const norm=s=>String(s).replace(/\s/g,'').replace(/\*/g,'×').replace(/\//g,'÷').replace(/[ＮN]/g,'n').replace(/[（]/g,'(').replace(/[）]/g,')').replace(/\d+(?:\.\d+)?/g,n=>String(Number(n)));
const unwrap=s=>{while(s[0]==='('&&s.at(-1)===')'){let depth=0,end=-1;for(let i=0;i<s.length;i++){if(s[i]==='(')depth++;if(s[i]===')'&&--depth===0){end=i;break;}}if(end!==s.length-1)break;s=s.slice(1,-1);}return s;};
function equationOK(t,raw){const clean=s=>norm(s).split('=').map(unwrap).join('='),s=clean(raw),opts=[...(t.equations||[]),...(t.plans||[]).map(p=>'n='+p.replace(/\d/g,i=>String(t.values[Number(i)]/(t.money&&Number(i)===t.values.length-1?100:1))))].map(clean);return opts.some(e=>s===e||s===e.split('=').reverse().join('='));}
export function rationalEquals(raw,n,d=1){if(!text(raw))return false;let s=raw.trim(),a,b;if(/^\d+\s+\d+\/\d+$/.test(s)){const[q,r,k]=s.split(/[ /]+/).map(Number);a=q*k+r;b=k;}else if(/^\d+\/\d+$/.test(s))[a,b]=s.split('/').map(Number);else if(/^\d+(?:\.\d+)?$/.test(s)){b=10**(s.split('.')[1]?.length||0);a=Number(s.replace('.',''));}else return false;return int(a)&&int(b,1)&&a*d===n*b;}
export const codeOptions=mode=>mode==='factors'?[['start','从1开始试'],['test','算余数'],['record','按条件留下这个数'],['next','加1，继续试'],['stop','试过原数后停止']]:[['start','从1开始选一个数'],['test','把1到它自身全试一遍'],['record','按因数个数决定留下谁'],['next','换下一个数'],['stop','到终点后停止']];
export function runCode(t,blocks,condition){if(!same(blocks,codeOptions(t.mode).map(x=>x[0])))return{ok:false,output:[],trace:[],message:'检查要在记录之前，每次往前走，再判断是否到终点。'};
 const trace=[],output=[];for(let n=1;n<=t.n;n++){if(t.mode==='factors'){const r=t.n%n,keep=condition==='zero'?r===0:condition==='nonzero'?r!==0:false;trace.push({n,r,keep});if(keep)output.push(n);}else{const fs=factors(n),keep=condition==='two'?fs.length===2:condition==='one'?fs.length===1:condition==='more'?fs.length>2:false;trace.push({n,factors:fs,count:fs.length,keep});if(keep)output.push(n);}}
 const want=t.mode==='factors'?factors(t.n):Array.from({length:t.n},(_,i)=>i+1).filter(isPrime);return{ok:same(output,want),output,trace,message:same(output,want)?'这条办法把范围里的每个数都查过了。':'运行结果留下了不该留下的，或漏掉了一些。改一下记录条件再试。'};
}
const actions=new Set(['b14-reset','b14-cut','b14-part','b14-estimate','b14-mul-count','b14-trade','b14-digit','b14-row','b14-method','b14-bring','b14-div-step','b14-container','b14-test','b14-list','b14-select','b14-predict','b14-join','b14-leaf','b14-split','b14-match','b14-tree-save','b14-plan-pick','b14-plan-split','b14-merge','b14-undo','b14-square','b14-block','b14-block-undo','b14-run','b14-sheet']);
function apply(t,b,e){const{action:a,data:d}=e,f=d.fields;let issue='';const fail=s=>{issue=s;};
 if(a==='b14-reset'){const fresh=board(t);if('firstEstimate'in b)fresh.firstEstimate=b.firstEstimate;if('first'in b&&t.type==='x-parityjoin')fresh.first=b.first;return{board:fresh,issue};}
 if(t.type==='x-areaproduct'){
  if(a==='b14-cut'){const x=number(f.cutA),y=number(f.cutB);if(!int(x,1,t.a)||!int(y,1,t.b))fail('每边切下一段，不能超过原来的长度。');else if(t.a===7&&t.b===15&&![5,10].includes(y)||t.a===23&&t.b===4&&![3,20].includes(x)||t.a===45&&t.b===23&&(![5,40].includes(x)||![3,20].includes(y)))fail('这次先照问题，把整十与零头分开。');else{b.cuts=[x,y];b.parts=[x,t.a-x].flatMap((r,i)=>[y,t.b-y].flatMap((c,j)=>r&&c?[{a:r,b:c,side:[i,j]}]:[]));b.values=[];}}
  if(a==='b14-part'&&b.parts[b.values.length]){const p=b.parts[b.values.length];if(!same(b.cuts,[number(f.cutA),number(f.cutB)]))fail('分界已经改了，先按新的位置重新分开。');else if(number(f.part)!==p.a*p.b)fail('这一块的两条边都要算进去。');else b.values.push(number(f.part));}
 }
 if(t.type==='x-multable'){
  if(a==='b14-estimate'){b.firstEstimate??=f.estimate;if(number(f.estimate)!==t.estimate*t.b)fail('先用给出的整数量估一估，把估计留下，再算精确结果。');else b.estimateOK=true;}
  const ds=mulDigits(t),ms=multiplier(t);
  if(a==='b14-mul-count'&&b.estimateOK&&b.row<ms.length&&b.col<ds.length&&!b.pending){const c=mulCurrent(t,b),total=c.a*c.b+c.carry;if(number(f.raw)!==total)fail('先乘当前这一位，再加上上一位送来的整捆。');else b.pending={raw:total,loose:total,bundles:0};}
  if(a==='b14-trade'&&b.pending){if(b.pending.loose<10)fail('已经不到十个了，剩下的留在这一位。');else{b.pending.loose-=10;b.pending.bundles++;}}
  if(a==='b14-digit'&&b.pending){if(b.pending.loose>=10||number(f.digit)!==b.pending.loose)fail('先把每十个换成一捆，再记这一位剩下的数字。');else{b.work.push({row:b.row,col:b.col,...copy(b.pending),incoming:b.carry});b.digits.push(b.pending.loose);b.carry=b.pending.bundles;b.pending=null;b.col++;}}
  if(a==='b14-row'&&b.col===ds.length&&b.row<ms.length){const v=t.a*ms[b.row]*10**b.row;if(number(f.shift)!==b.row||number(f.rowvalue)!==v)fail('这一行乘的是几份一，还是几份十？把整行放回相应位置。');else{b.rows.push({value:v,shift:b.row,digits:copy(b.digits),carry:b.carry});b.row++;b.col=0;b.carry=0;b.digits=[];}}
 }
 if(t.type==='x-divtable'){
  if(a==='b14-method'&&['short','long'].includes(f.method)&&!b.steps.length)b.method=f.method;
  if(a==='b14-bring'&&b.method&&!b.ready&&b.steps.length<divDigits(t).length){b.current=divCurrent(t,b).value;b.ready=true;}
  if(a==='b14-div-step'&&b.ready){const q=number(f.q),u=number(f.used),r=number(f.rest);if(!int(q,0,9)||u!==q*t.d||!int(r,0,t.d-1)||u+r!==b.current)fail('乘回去的部分加剩下的，要回到这一段；剩下的还不能再分一份。分不到也记0。');else{b.steps.push({q,used:u,r,current:b.current});b.ready=false;b.current=null;}}
  if(a==='b14-container'&&int(d.value,-1,1)){const n=b.containers+d.value;if(int(n,0,200))b.containers=n;}
 }
 if(t.type==='x-numbersearch'){
  if(a==='b14-test'&&int(d.side,0,t.ns.length-1)){const n=t.ns[d.side],c=number(f.candidate),r=number(f.remainder);if(!requiredTests(t,d.side).includes(c))fail('这次从1试到标出的边界，或检查题目给出的几个数。');else if(r!==n%c)fail('用这个数去分，整份拿走后还剩多少？');else if(b.tests[d.side].some(x=>x.d===c))fail('这个已经留下了，换一个还没试过的。');else b.tests[d.side].push({d:c,r});}
  if(a==='b14-list'&&int(d.side,0,t.ns.length-1)){const l=b.lists[d.side],max=t.mode==='squares'?t.count:t.limit?Math.floor(t.limit/t.ns[d.side]):t.count,want=t.mode==='squares'?(l.length+1)**2:(l.length+1)*t.ns[d.side];if(l.length>=max)fail('这条已经接到这次的终点。');else if(number(f.answer)!==want)fail(t.mode==='squares'?'边长与自己相乘，看看下一块有多少格。':'沿同一条路，每次增加相同的一份。');else l.push(want);}
  if(a==='b14-select'&&int(d.value,1,200))toggle(b.selected,d.value);
 }
 if(t.type==='x-parityjoin'){
  if(a==='b14-predict'){if(!['even','odd'].includes(f.prediction))fail('先留下自己的猜想，再展开看。');else b.first??=f.prediction;}
  if(a==='b14-join'&&b.first)b.joined=true;
 }
 if(t.type==='x-factorforest'){
  if(a==='b14-leaf'&&leaves(b).some(n=>n.id===d.index))b.selected=d.index;
  if(a==='b14-split'&&b.selected!==null){const node=b.nodes[b.selected],x=number(f.left),y=number(f.right);if(!int(x,2,node.value)||!int(y,2,node.value)||x*y!==node.value)fail('两块都要大于1，相乘仍是原来的这一块。');else{const next=b.nodes.length;node.children=[next,next+1];b.nodes.push({id:next,parent:node.id,root:node.root,value:x,children:[]},{id:next+1,parent:node.id,root:node.root,value:y,children:[]});b.selected=null;b.matches=[];b.pair=[];}}
  if(a==='b14-match'&&t.common){const node=leaves(b).find(n=>n.id===d.index);if(!node||!isPrime(node.value)||b.matches.flat().includes(node.id))fail('同一块只能配一次；先拆到不能再拆。');else if(b.pair.length===0)b.pair=[node.id];else{const first=b.nodes[b.pair[0]];if(first.root===node.root||first.value!==node.value){fail('一边取一块，而且两块上的质数要相同。');b.pair=[];}else{b.matches.push([first.id,node.id]);b.pair=[];}}}
  if(a==='b14-tree-save'&&t.twice){if(!leaves(b).every(n=>isPrime(n.value))||!primeExpression(f.expression,t.ns[0]))fail('先拆到底，用质数相乘写下这一棵。');else if(!b.first){const first={nodes:copy(b.nodes),expression:f.expression};b=board(t);b.first=first;}else fail('第一种拆法已经留着，可以继续检查第二种。');}
 }
 if(t.type==='x-planproduct'){
  if(a==='b14-plan-split'&&t.split&&!b.split){const x=number(f.left),y=number(f.right);if(!int(x,2)||!int(y,2)||x*y!==t.values[0])fail('拆开的两块相乘仍要等于24，原来的24要换掉。');else{b.groups=[{value:x,expr:'0a',ids:['0a']},{value:y,expr:'0b',ids:['0b']},{value:t.values[1],expr:'1',ids:[1]}];b.split=true;b.selected=[];}}
  if(a==='b14-plan-pick'&&int(d.index,0,b.groups.length-1)&&(!t.split||b.split)){if(b.selected.includes(d.index))toggle(b.selected,d.index);else if(b.selected.length<2)b.selected.push(d.index);}
  if(a==='b14-merge'&&b.selected.length===2){const[i,j]=b.selected,[l,r]=[b.groups[i],b.groups[j]],op=t.split?'*':f.operator,value=op==='*'?l.value*r.value:op==='/'?l.value/r.value:null;if(value===null||!Number.isFinite(value)||number(f.result)!==value)fail('按选中的先后顺序算这两张，其他的先留在旁边。');else{b.merges.push({before:copy(b.groups),left:l.value,right:r.value,op,value});b.groups=b.groups.filter((_,k)=>k!==i&&k!==j);b.groups.push({value,expr:`(${l.expr}${op}${r.expr})`,ids:[...l.ids,...r.ids]});b.selected=[];}}
  if(a==='b14-undo'&&b.merges.length){b.groups=b.merges.pop().before;b.selected=[];}
 }
 if(t.type==='x-squarepair'&&a==='b14-square'){const x=number(f.sideA),y=number(f.sideB);if(!int(x,1,10)||!int(y,1,10))fail('两块都要有非零的边长。');else{b.trials.push([x,y]);if(x*x+y*y!==t.total)fail('可以看看两块一共占多少格，再调整一条边。');else b.pair=[x,y];}}
 if(t.type==='x-factorcode'){
  if(a==='b14-block'&&codeOptions(t.mode).some(x=>x[0]===d.value)&&b.blocks.length<5)b.blocks.push(d.value);
  if(a==='b14-block-undo')b.blocks.pop();
  if(a==='b14-run'){const r=runCode(t,b.blocks,f.condition);b.runs.push({blocks:copy(b.blocks),condition:f.condition,...r});if(!r.ok)fail(r.message);}
 }
 if(t.type==='x-multisheet'){
  if(a==='b14-sheet'){const s=number(f.start),formula=f.formula.toUpperCase().replace(/\s/g,''),match=formula.match(/^=(?:A1\+(\d+)|(\d+)\+A1)$/),step=match?Number(match[1]||match[2]):null;if(s!==t.step||step!==t.step)fail('第一格放第一份；第二格引用A1，再加同样的一份。可以写成 =A1+6 这样的规则。');else{b.formula=formula;b.values=Array.from({length:t.rows},(_,i)=>s+i*step);b.selected=[];}}
  if(a==='b14-select'&&int(d.value,0,t.rows-1)&&b.values.length)toggle(b.selected,d.value);
 }
 return{board:b,issue};
}
const dataKeys=['fields','index','side','value'];
function eventValid(e){return e&&same(Object.keys(e).sort(),['action','data'])&&actions.has(e.action)&&e.data&&same(Object.keys(e.data).sort(),dataKeys)&&same(Object.keys(e.data.fields).sort(),Object.keys(fields).sort())&&Object.values(e.data.fields).every(text)&&[e.data.index,e.data.side].every(x=>x===null||int(x,0,200))&&(e.data.value===null||int(e.data.value,-1,200)||typeof e.data.value==='string'&&e.data.value.length<30);}
export function act(t,m,action,d={}){if(!actions.has(action))return m;const e={action,data:{fields:Object.fromEntries(Object.keys(fields).map(k=>[k,m[k]])),index:d.index===undefined?null:Number(d.index),side:d.side===undefined?null:Number(d.side),value:typeof d.value==='string'&&/^-?\d+$/.test(d.value)?Number(d.value):d.value??null}};if(!eventValid(e))return m;const r=apply(t,copy(m.board),e);m.history.push(e);m.board=r.board;m.issue=r.issue;return m;}
export function field(t,m,key){if(key in fields)m[key]=String(m[key]);}
export function valid(t,m){try{if(!taskValid(t)||!m||!Object.keys(fields).every(k=>text(m[k]))||!text(m.issue)||!Array.isArray(m.history)||m.history.length>3000||!m.history.every(eventValid))return false;let b=board(t);for(const e of m.history)b=apply(t,b,e).board;return same(b,m.board);}catch{return false;}}
export function inspect(t,m){if(!valid(t,m))return{correct:false,feedback:'这份过程不能读，重新做这一小步，之前的尝试仍会保留。'};const b=m.board;let ok=false,msg='把操作与结果再核对一次。';
 if(t.type==='x-areaproduct'){ok=!!b.cuts&&same(b.cuts,[number(m.cutA),number(m.cutB)])&&b.values.length===b.parts.length&&number(m.answer)===t.a*t.b&&(t.a!==40||t.b!==60||number(m.base)===24);msg='先按当前分界留下每一块，再把它们合起来；十乘十得到的是一百。';}
 if(t.type==='x-multable'){ok=b.estimateOK&&b.rows.length===multiplier(t).length&&number(m.answer)===t.a*t.b;msg='每一位换捆后留下数字，整行放对位置，最后把各行合起来。';}
 if(t.type==='x-divtable'){const q=Math.floor(t.n/t.d),r=t.n%t.d,checks=[`${q}×${t.d}+${r}=${t.n}`,`${t.d}×${q}+${r}=${t.n}`,...(r===0?[`${q}×${t.d}=${t.n}`,`${t.d}×${q}=${t.n}`]:[])];let answer=false;
  if(t.interpret==='keep')answer=number(m.answer)===q&&number(m.base)===r;
  if(['up','down'].includes(t.interpret)){const want=t.interpret==='up'?Math.ceil(t.n/t.d):q;answer=number(m.answer)===want&&b.containers===want;}
  if(['fraction','decimal'].includes(t.interpret))answer=rationalEquals(m.answer,t.n,t.d)&&(t.interpret!=='decimal'||!m.answer.includes('/'));
  if(t.interpret==='round'){const want=(Math.floor((2*t.n*10**t.dp+t.d)/(2*t.d))/10**t.dp).toFixed(t.dp);answer=m.answer.trim()===want&&(!t.choosePrecision||number(m.precision)===t.dp);}
  ok=b.steps.length===divDigits(t).length&&checks.some(e=>norm(m.check)===e||norm(m.check)===e.split('=').reverse().join('='))&&answer;msg='每一位都分完，再用“商×每份+剩下的”乘回原数，最后按故事决定怎么写答案。';
 }
 if(t.type==='x-numbersearch'){
  const tested=t.ns.every((n,i)=>requiredTests(t,i).every(d=>b.tests[i].some(x=>x.d===d)));
  if(t.mode==='prime')ok=tested&&m.answer===(isPrime(t.ns[0])?'prime':t.ns[0]===1?'neither':'composite');
  if(t.mode==='divisible')ok=tested&&m.answer===(t.ns[0]%t.by===0?'yes':'no');
  if(t.mode==='commonFactors')ok=tested&&same(sorted(b.selected),factors(t.ns[0]).filter(n=>t.ns[1]%n===0));
  if(t.mode==='multiples'){const complete=b.lists.every((xs,i)=>xs.length===(t.limit?Math.floor(t.limit/t.ns[i]):t.count));ok=complete&&(t.ns.length===1||same(sorted(b.selected),b.lists[0].filter(n=>n%t.ns[1]===0).slice(0,t.count)));}
  if(t.mode==='squares')ok=b.lists[0].length===t.count;
  if(t.mode==='recallPrimes')ok=same(sorted(b.selected),Array.from({length:t.ns[0]},(_,i)=>i+1).filter(isPrime));
  msg='把约定的范围查全，再留下自己的判断。共有的必须在两边都能找到。';
 }
 if(t.type==='x-parityjoin'){const even=(t.op==='+'?t.a+t.b:t.a*t.b)%2===0,want=t.op==='×'?'whole':t.a%2&&t.b%2?'two':t.a%2!==t.b%2?'one':'none';ok=!!b.first&&b.joined&&m.answer===(even?'even':'odd')&&m.reason===want;msg='先预测，再配对。解释要对应这次剩下的颗粒或整份。';}
 if(t.type==='x-factorforest'){
  const done=leaves(b).every(n=>isPrime(n.value)),expr=primeExpression(m.expression,t.ns[0])&&(t.ns[0]!==360||/[\^²³]/.test(m.expression));ok=done&&expr;
  if(t.common){const a=leaves(b).filter(n=>n.root===0),c=leaves(b).filter(n=>n.root===1),maxMatches=unique(a.map(x=>x.value)).reduce((sum,v)=>sum+Math.min(a.filter(x=>x.value===v).length,c.filter(x=>x.value===v).length),0),g=gcd(...t.ns);ok=ok&&b.matches.length===maxMatches&&number(m.hcf)===g&&number(m.lcm)===t.ns[0]*t.ns[1]/g&&primeExpression(m.equation,t.ns[1]);}
  if(t.twice){const first=b.first,cut=nodes=>sorted(nodes[0].children.map(i=>nodes[i].value));ok=ok&&!!first&&!same(cut(first.nodes),cut(b.nodes))&&same(sorted(leaves({nodes:first.nodes}).map(n=>n.value)),sorted(leaves(b).map(n=>n.value)));}
  msg=t.twice?'留下第一种拆法，再换一组不同的第一刀；最后比较质数块及份数。':t.common?'拆到质数；相同的块一边取一块，不能重复用。共有的和够两边用的分别算。':'继续拆到质数，再写成质数相乘；重复的块可以用幂缩写。';
 }
 if(t.type==='x-planproduct'){const g=b.groups[0];ok=b.groups.length===1&&(!t.split||b.split)&&g.value===planValue(t)&&(!t.plans||t.plans.includes(g.expr))&&number(m.answer)===planValue(t)/(t.money?100:1)&&(!t.money||/^\d+\.\d{2}$/.test(m.answer.trim()))&&(!t.equations||equationOK(t,m.equation));msg='原来的每张卡只用一次，顺序要符合故事；最后写清答案的单位和关系。';}
 if(t.type==='x-squarepair')ok=!!b.pair&&number(m.sideA)===b.pair[0]&&number(m.sideB)===b.pair[1];
 if(t.type==='x-factorcode'){const r=b.runs.at(-1);ok=!!r?.ok&&same(r.blocks,b.blocks)&&r.condition===m.condition;msg='把五句办法排好，选择留下谁，再实际运行查看结果。';}
 if(t.type==='x-multisheet'){ok=b.values.length===t.rows&&number(m.start)===t.step&&m.formula.toUpperCase().replace(/\s/g,'')===b.formula&&(!t.highlight||same(sorted(b.selected),b.values.flatMap((v,i)=>v%t.highlight===0?[i]:[])));msg='先让规则填满这张表，再选择符合条件的格子。';}
 return{correct:!!ok,feedback:ok?'操作、计算和关系对上了。':msg,evidence:{kind:t.type,construction:copy(m),explanationAssessed:false,generalProofAssessed:false,fluencyAssessed:false,handwritingAssessed:false,independentCodingAssessed:false,externalSpreadsheetUseAssessed:false}};
}
export function solveSteps(t){const m=initial(t),steps=[],f=(key,value)=>{value=String(value);steps.push({field:key,value});m[key]=value;field(t,m,key);},a=(action,data={})=>{steps.push({action,data});act(t,m,action,data);};
 if(t.type==='x-areaproduct'){const cut=n=>n>=10&&n%10?Math.floor(n/10)*10:n;f('cutA',cut(t.a));f('cutB',cut(t.b));a('b14-cut');for(const p of m.board.parts){f('part',p.a*p.b);a('b14-part');}if(t.a===40&&t.b===60)f('base',24);f('answer',t.a*t.b);}
 if(t.type==='x-multable'){f('estimate',t.estimate*t.b);a('b14-estimate');while(m.board.row<multiplier(t).length){while(m.board.col<mulDigits(t).length){const c=mulCurrent(t,m.board);f('raw',c.a*c.b+c.carry);a('b14-mul-count');while(m.board.pending.loose>=10)a('b14-trade');f('digit',m.board.pending.loose);a('b14-digit');}f('shift',m.board.row);f('rowvalue',t.a*multiplier(t)[m.board.row]*10**m.board.row);a('b14-row');}f('answer',t.a*t.b);}
 if(t.type==='x-divtable'){if(t.choose){f('method','long');a('b14-method');}while(m.board.steps.length<divDigits(t).length){a('b14-bring');const c=m.board.current,q=Math.floor(c/t.d);f('q',q);f('used',q*t.d);f('rest',c%t.d);a('b14-div-step');}const q=Math.floor(t.n/t.d),r=t.n%t.d;f('check',`${q}×${t.d}+${r}=${t.n}`);
  if(t.interpret==='keep'){f('answer',q);f('base',r);}if(['up','down'].includes(t.interpret)){const n=t.interpret==='up'?Math.ceil(t.n/t.d):q;for(let i=0;i<n;i++)a('b14-container',{value:1});f('answer',n);}if(t.interpret==='fraction')f('answer',`${q} ${r}/${t.d}`);if(t.interpret==='decimal')f('answer',t.n/t.d);if(t.interpret==='round'){if(t.choosePrecision)f('precision',t.dp);f('answer',(Math.floor((2*t.n*10**t.dp+t.d)/(2*t.d))/10**t.dp).toFixed(t.dp));}
 }
 if(t.type==='x-numbersearch'){
  if(['prime','commonFactors','divisible'].includes(t.mode))for(let i=0;i<t.ns.length;i++)for(const d of requiredTests(t,i)){f('candidate',d);f('remainder',t.ns[i]%d);a('b14-test',{side:i});}
  if(['multiples','squares'].includes(t.mode))for(let i=0;i<t.ns.length;i++){const n=t.mode==='squares'?t.count:t.limit?Math.floor(t.limit/t.ns[i]):t.count;for(let j=1;j<=n;j++){f('answer',t.mode==='squares'?j*j:t.ns[i]*j);a('b14-list',{side:i});}}
  if(t.mode==='prime')f('answer',isPrime(t.ns[0])?'prime':t.ns[0]===1?'neither':'composite');if(t.mode==='divisible')f('answer',t.ns[0]%t.by===0?'yes':'no');
  const selected=t.mode==='commonFactors'?factors(t.ns[0]).filter(n=>t.ns[1]%n===0):t.mode==='multiples'&&t.ns.length===2?m.board.lists[0].filter(n=>n%t.ns[1]===0).slice(0,t.count):t.mode==='recallPrimes'?Array.from({length:t.ns[0]},(_,i)=>i+1).filter(isPrime):[];for(const value of selected)a('b14-select',{value});
 }
 if(t.type==='x-parityjoin'){const result=(t.op==='+'?t.a+t.b:t.a*t.b)%2?'odd':'even';f('prediction',result);a('b14-predict');a('b14-join');f('answer',result);f('reason',t.op==='×'?'whole':t.a%2&&t.b%2?'two':t.a%2!==t.b%2?'one':'none');}
 if(t.type==='x-factorforest'){
  const build=(alternate=false)=>{while(leaves(m.board).some(n=>!isPrime(n.value))){const node=leaves(m.board).find(n=>!isPrime(n.value));let d=factors(node.value).find(d=>d>1&&d<node.value);if(alternate&&node.id===0)d=3;a('b14-leaf',{index:node.id});f('left',d);f('right',node.value/d);a('b14-split');}},expr=root=>unique(leaves(m.board).filter(n=>n.root===root).map(n=>n.value)).map(v=>`${v}^${leaves(m.board).filter(n=>n.root===root&&n.value===v).length}`).join('×');
  build();f('expression',expr(0));if(t.twice){a('b14-tree-save');build(true);f('expression',expr(0));}
  if(t.common){for(const l of leaves(m.board).filter(n=>n.root===0)){const r=leaves(m.board).find(n=>n.root===1&&n.value===l.value&&!m.board.matches.flat().includes(n.id));if(r){a('b14-match',{index:l.id});a('b14-match',{index:r.id});}}f('equation',expr(1));const g=gcd(...t.ns);f('hcf',g);f('lcm',t.ns[0]*t.ns[1]/g);}
 }
 if(t.type==='x-planproduct'){if(t.split){f('left',6);f('right',4);a('b14-plan-split');a('b14-plan-pick',{index:1});a('b14-plan-pick',{index:2});f('result',100);a('b14-merge');}while(m.board.groups.length>1){a('b14-plan-pick',{index:0});a('b14-plan-pick',{index:1});const op=t.values.length===3&&m.board.merges.length===0?'/':'*';if(!t.split)f('operator',op);f('result',op==='*'?m.board.groups[0].value*m.board.groups[1].value:m.board.groups[0].value/m.board.groups[1].value);a('b14-merge');}f('answer',t.money?(planValue(t)/100).toFixed(2):planValue(t));if(t.equations)f('equation',t.equations[0]);}
 if(t.type==='x-squarepair'){f('sideA',6);f('sideB',8);a('b14-square');}
 if(t.type==='x-factorcode'){for(const[value]of codeOptions(t.mode))a('b14-block',{value});f('condition',t.mode==='factors'?'zero':'two');a('b14-run');}
 if(t.type==='x-multisheet'){f('start',t.step);f('formula',`=A1+${t.step}`);a('b14-sheet');if(t.highlight)for(let i=0;i<t.rows;i++)if(m.board.values[i]%t.highlight===0)a('b14-select',{value:i});}
 return steps;
}
export function example(t){const m=initial(t);for(const s of solveSteps(t))if(s.field){m[s.field]=s.value;field(t,m,s.field);}else act(t,m,s.action,s.data);return m;}
