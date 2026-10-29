import {rational,equal,toggle,equationOK} from './b16-model.js';
export const TYPES=new Set(['x-fracorder','x-fracrename','x-decimalcompare','x-decimalzoom','x-hundredcombine','x-complementpair','x-decimalengine','x-percentkit','x-rulejump','x-fracoperations','x-straightgap','x-fdprecall']);
const cp=x=>structuredClone(x),same=(a,b)=>JSON.stringify(a)===JSON.stringify(b),integer=(v,a=0,b=1000000)=>Number.isSafeInteger(v)&&v>=a&&v<=b;
export const gcd=(a,b)=>b?gcd(b,a%b):Math.abs(a),lcm=(a,b)=>a/gcd(a,b)*b;
export const frac=s=>{const z=String(s).trim(),percent=z.endsWith('%'),r=rational(percent?z.slice(0,-1):z);if(!r)return null;if(percent)r[1]*=100;return percent||z.includes('.')?reduced(...r):r;};
export const numeric=s=>{const r=frac(s);return r?r[0]/r[1]:NaN;};
export const cmp=(a,b)=>{a=frac(a);b=frac(b);return a&&b?Math.sign(a[0]*b[1]-b[0]*a[1]):NaN;};
export const reduced=(n,d)=>{const g=gcd(n,d);return[n/g,d/g];};
export const ftext=r=>r.join('/'),prime=n=>integer(n,2,10000)&&!Array.from({length:Math.max(0,Math.floor(Math.sqrt(n))-1)},(_,i)=>i+2).some(i=>n%i===0);
export const fields={answer:'',fraction:'',decimal:'',factor:'2',denom:'',num:'',position:'',left:'',right:'',prediction:'',relation:'',reason:'',hcf:'',q:'',remainder:'',kind:'',percent:'',amount:'',multiplier:'',divisor:'1',offset:'0',n:'',aform:'',bform:'',whole:'',part:'',angle:'0',equation:''};
function board(t){switch(t.type){
 case'x-fracorder':return{prediction:[],first:null,committed:false,aligned:!t.mismatch,selected:0,parts:t.cards.map(()=>[]),placements:{},ordered:[],common:0,renames:{},gaps:{},benchmarks:{}};
 case'x-fracrename':return{n:t.n,d:t.d,saved:[],moves:0,first:null,tested:false,opened:!t.decimalStart};
 case'x-decimalcompare':return{index:0,records:[],first:[],predicted:false,scanned:[],padded:false};
 case'x-decimalzoom':return{lo:0,span:1000,levels:[],mark:null,first:null};
 case'x-hundredcombine':return{cells:Array(100).fill(-1),layer:0};
 case'x-complementpair':return{left:null,right:null,first:null};
 case'x-decimalengine':return{simple:null,factorLeft:null,factors:[],prediction:null,first:null,rows:[],remainder:null,remainders:[],stop:false,cycle:null};
 case'x-percentkit':return{tenth:null,fifth:null,pieces:[],first:null};
 case'x-rulejump':return{rule:null,records:[],first:null};
 case'x-fracoperations':return{first:null,prediction:null,forms:null,denom:0,left:[],right:[],combined:false,columns:[],rows:[],fits:0,rest:false};
 case'x-straightgap':return{angle:null,first:null};
 case'x-fdprecall':return{index:0,records:[],first:[]};
}}
export const initial=t=>({...fields,board:board(t),history:[],issue:''});
const acts=new Set(['reset','card','predict','align','select','shade','place','order','common','rename','landmark','split','merge','remember','rewind','test-add','open-decimal','predict-compare','pad','scan','compare','zoom','mark','layer','cell','ten','pair','reduce','factor','predict-stop','digit','tenth','fifth','piece','rule','run','predict-op','forms','combine','column','row','fit','rest','angle','recall']);
const text=s=>typeof s==='string'&&s.length<=500;
const serial=e=>e&&acts.has(e.a)&&e.f&&Object.keys(fields).every(k=>text(e.f[k]))&&Object.entries(e.d||{}).every(([k,v])=>['index','value','row'].includes(k)&&text(v));
export function decimalPair(t,b){const p=t.cases[b.index];if(!p)return null;const dp=Math.max(...p.map(v=>(v.split('.')[1]||'').length)),a=p.map(v=>Number(v).toFixed(dp)),width=Math.max(...a.map(v=>v.split('.')[0].length));const digits=a.map(v=>v.padStart(width+1+dp,'0').replace('.','').split(''));let first=digits[0].findIndex((v,i)=>v!==digits[1][i]);return{raw:p,padded:a,digits,first,dp,width,relation:cmp(p[0],p[1])<0?'<':cmp(p[0],p[1])>0?'>':'='};}
export function operation(t){const a=frac(t.a),b=frac(t.b);switch(t.op){case'+':return reduced(a[0]*b[1]+b[0]*a[1],a[1]*b[1]);case'-':return reduced(a[0]*b[1]-b[0]*a[1],a[1]*b[1]);case'*':return reduced(a[0]*b[0],a[1]*b[1]);case'/':return reduced(a[0]*b[1],a[1]*b[0]);}}
export const estimateKind=r=>r[0]<0?'negative':r[0]===0?'zero':r[0]<r[1]?'part':r[0]===r[1]?'one':'more';
function apply(t,b,e){const {a,d,f}=e;let issue='';const fail=s=>issue=s,N=k=>Number(f[k]),i=Number(d.index);
 if(a==='reset'){const x=board(t);if('first'in b)x.first=cp(b.first);return{board:x,issue};}
 if(t.type==='x-fracorder'){
  if(a==='card'&&!b.committed&&integer(i,0,t.cards.length-1))b.prediction=toggle(b.prediction,i);
  if(a==='predict'&&b.prediction.length===t.cards.length){b.first??=cp(b.prediction);b.committed=true;}
  if(a==='align')b.aligned=true;
  if(a==='select'&&integer(i,0,t.cards.length-1))b.selected=i;
  if(a==='shade'&&b.committed&&b.aligned&&integer(Number(d.row),0,t.cards.length-1)){const row=Number(d.row),r=frac(t.cards[row]),capacity=Math.ceil(r[0]/r[1])*r[1];if(integer(i,0,capacity-1))b.parts[row]=toggle(b.parts[row],i);}
  if(a==='place'&&b.committed){const r=frac(f.position),v=numeric(f.position);if(!r||v<(t.min||0)||v>(t.max||2))fail('把位置写成分数或小数，放在这条线的范围里。');else b.placements[b.selected]=f.position;}
  if(a==='order'&&b.committed&&integer(i,0,t.cards.length-1))b.ordered=toggle(b.ordered,i);
  if(a==='common'){const den=N('denom');if(!integer(den,1,240)||t.cards.some(x=>den%frac(x)[1]))fail('新的小份要能把每一种原来的份都整齐细分。');else{b.common=den;b.renames={};}}
  if(a==='rename'&&b.common){const r=frac(t.cards[b.selected]);if(f.fraction.replace(/\s/g,'')!==`${r[0]*b.common/r[1]}/${b.common}`)fail('一小份变小了，取的份数也要跟着变。');else b.renames[b.selected]=f.fraction;}
  if(a==='landmark'){const r=frac(t.cards[b.selected]);if(t.gaps){if(!equal(f.answer,r[1]-r[0],r[1]))fail('从这个点到1，还差多少？');else b.gaps[b.selected]=f.answer;}else{const want=cmp(t.cards[b.selected],'1/2')<0?'<':cmp(t.cards[b.selected],'1/2')>0?'>':'=';if(f.relation!==want)fail('看一看它在一半的哪边。');else b.benchmarks[b.selected]=f.relation;}}
 }
 if(t.type==='x-fracrename'){
  if(a==='open-decimal'){if(f.fraction.replace(/\s/g,'')!==`${t.n}/${t.d}`)fail('最后一位数的是哪一种小份？把整个与选中份数都记下来。');else b.opened=true;}
  if(['split','merge'].includes(a)&&b.opened){const k=N('factor');b.first??={action:a,factor:f.factor};if(!integer(k,2,1000)||a==='merge'&&(b.n%k||b.d%k)||a==='split'&&b.d*k>10000)fail('每一份都要同样处理，合并时取出的份和整个的份都要能分成整组。');else{b.n=a==='split'?b.n*k:b.n/k;b.d=a==='split'?b.d*k:b.d/k;b.moves++;}}
  if(a==='remember'&&b.opened){if(f.fraction.replace(/\s/g,'')!==`${b.n}/${b.d}`)fail('请给现在的分法写名字：数清涂出的份与全部份。');else if(b.saved.some(r=>r[0]===b.n&&r[1]===b.d))fail('这个名字已经留下了，试一个不同分法。');else b.saved.push([b.n,b.d]);}
  if(a==='rewind'){b.n=t.n;b.d=t.d;}
  if(a==='test-add')b.tested=true;
 }
 if(t.type==='x-decimalcompare'){
  const p=decimalPair(t,b);if(p){if(a==='predict-compare'&&['<','=','>'].includes(f.prediction)){b.first[b.index]??=f.prediction;b.predicted=true;}
   if(a==='pad'&&b.predicted){if(f.left!==p.padded[0]||f.right!==p.padded[1])fail('对齐同一种单位；补在末尾的0表示没有这种更小的份。');else b.padded=true;}
   if(a==='scan'&&b.padded){const next=b.scanned.length,end=p.first<0?p.digits[0].length-1:p.first;if(i!==next||i>end)fail('从最大的单位向右看，在第一个不同的位置停下。');else b.scanned.push(i);}
   if(a==='compare'){const n=p.first<0?p.digits[0].length:p.first+1;if(!b.padded||b.scanned.length!==n||f.relation!==p.relation)fail('先把相同单位对齐，再找最先不同的那一列；全一样才相等。');else{b.records.push({pair:p.raw,first:b.first[b.index],scanned:cp(b.scanned),padded:p.padded,relation:f.relation});b.index++;b.predicted=false;b.scanned=[];b.padded=false;}}
  }
 }
 if(t.type==='x-decimalzoom'){
  if(a==='zoom'&&integer(i,0,9)&&b.span>10){b.first??=i;b.lo+=b.span*i/10;b.span/=10;b.levels.push(i);b.mark=null;}
  if(a==='mark'&&integer(i,0,10))b.mark=b.lo+b.span*i/10;
 }
 if(t.type==='x-hundredcombine'){
  if(a==='layer'&&integer(i,0,1))b.layer=i;
  if(a==='cell'&&integer(i,0,99)){if(b.cells[i]!==-1&&b.cells[i]!==b.layer)fail('这小格已经属于另一部分，不能重复使用。');else b.cells[i]=b.cells[i]===b.layer?-1:b.layer;}
  if(a==='ten'&&integer(i,0,9)){const ids=Array.from({length:10},(_,j)=>i*10+j);if(ids.some(j=>b.cells[j]>=0&&b.cells[j]!==b.layer))fail('这一整行有另一部分，先换一行或拿回原来的格子。');else{const filled=ids.every(j=>b.cells[j]===b.layer);for(const j of ids)b.cells[j]=filled?-1:b.layer;}}
 }
 if(t.type==='x-complementpair'&&a==='pair'){b.first??=[f.left,f.right];if(!/^0\.\d{3}$/.test(f.left)||!/^0\.\d{3}$/.test(f.right))fail('这次统一写三位小数；0.4可以写0.400，数量不变。');else{b.left=f.left;b.right=f.right;}}
 if(t.type==='x-decimalengine'){
  if(a==='reduce'&&!b.rows.length){const r=frac(f.fraction),want=reduced(t.n,t.d);if(!r||!same(r,want))fail('先化到不能再合并的整数份数；判断会不会结束，要看化简后的整个份数。');else{b.simple=r;b.factorLeft=r[1];b.factors=[];b.remainder=r[0];b.remainders=[];b.prediction=null;}}
  if(a==='factor'&&b.simple&&b.factorLeft>1){const k=N('factor');if(!prime(k)||b.factorLeft%k)fail('拿走一个能整除它的质数因子，剩下的继续拆。');else{b.factors.push(k);b.factorLeft/=k;}}
  if(a==='predict-stop'&&b.factorLeft===1&&['stop','repeat'].includes(f.kind)){b.first??=f.kind;b.prediction=f.kind;}
  if(a==='digit'&&b.prediction&&!b.stop){const den=b.simple[1],input=b.rows.length?b.remainder*10:b.remainder,q=Math.floor(input/den),rem=input%den;if(N('q')!==q||N('remainder')!==rem)fail('每一行都要对上：分出的份×每份人数＋余下的＝这一行原有的量。');else{b.rows.push({input,q,rem});b.remainder=rem;if(rem===0)b.stop=true;else if(b.remainders.includes(rem)){b.cycle=b.remainders.indexOf(rem);b.stop=true;}else b.remainders.push(rem);}}
 }
 if(t.type==='x-percentkit'){
  if(a==='tenth'){b.first??=f.amount;if(equal(f.amount,t.total,10))b.tenth=f.amount;else fail('整个分成10个等份，先拿其中一份。');}
  if(a==='fifth'&&b.tenth!==null){if(equal(f.amount,t.total,20))b.fifth=f.amount;else fail('刚才的一份再平分两半。');}
  if(a==='piece'&&b.fifth!==null&&['10','5'].includes(d.value)&&b.pieces.reduce((s,x)=>s+x,0)+Number(d.value)<=100)b.pieces.push(Number(d.value));
 }
 if(t.type==='x-rulejump'){
  if(a==='rule'){const a=N('multiplier'),b0=N('offset'),d0=N('divisor');b.first??=[f.multiplier,f.offset,f.divisor];if(!integer(a,-1000,1000)||!integer(b0,-1000,1000)||!integer(d0,1,1000))fail('先用这些整数搭一条可计算的规则。');else{b.rule=[a,b0,d0];b.records=[];}}
  if(a==='run'&&b.rule){const n=N('n'),r=b.rule;if(!t.inputs.includes(n)||!equal(f.answer,r[0]*n+r[1],r[2]))fail('把选中的位置或数量放进你自己的规则，记录实际算出的结果。');else{b.records=b.records.filter(x=>x.n!==n);b.records.push({n,result:f.answer});}}
 }
 if(t.type==='x-fracoperations'){
  if(a==='predict-op'&&['negative','zero','part','one','more'].includes(f.prediction)){b.first??=f.prediction;b.prediction=f.prediction;}
  if(a==='forms'&&b.prediction){const aa=frac(f.aform),bb=frac(f.bform);if(!aa||!bb||!equal(f.aform,...frac(t.a))||!equal(f.bform,...frac(t.b))||[...aa,...bb].some(n=>!integer(n,0,100))||!aa[1]||!bb[1])fail('两边都要保持原来的量。整份和零头一起换成相同小份。');else{b.forms=[aa,bb];b.denom=0;b.left=[];b.right=[];b.rows=[];b.columns=[];b.fits=0;b.rest=false;b.combined=false;}}
  if(a==='common'&&b.forms){const n=N('denom');if(!integer(n,1,240)||b.forms.some(r=>n%r[1]))fail('两种份都要能整齐切成这种更小的份。');else{b.denom=n;b.left=[];b.right=[];b.fits=0;b.rest=false;b.combined=false;}}
  if(a==='shade'&&b.denom&&['left','right'].includes(d.row)){const r=b.forms[d.row==='left'?0:1],len=Math.ceil(r[0]/r[1])*b.denom;if(integer(i,0,len-1)){b[d.row]=toggle(b[d.row],i);b.combined=false;b.fits=0;b.rest=false;}}
  if(a==='combine'&&['+','-'].includes(t.op)&&b.denom){const a0=b.forms[0][0]*b.denom/b.forms[0][1],b0=b.forms[1][0]*b.denom/b.forms[1][1];if(b.left.length!==a0||b.right.length!==b0)fail('先在两个同单位的整体上摆出题目中的量。');else b.combined=true;}
  if(a==='column'&&t.op==='*'&&b.forms&&integer(i,0,Math.ceil(b.forms[0][0]/b.forms[0][1])*b.forms[0][1]-1))b.columns=toggle(b.columns,i);
  if(a==='row'&&t.op==='*'&&b.forms&&integer(i,0,Math.ceil(b.forms[1][0]/b.forms[1][1])*b.forms[1][1]-1))b.rows=toggle(b.rows,i);
  if(a==='fit'&&t.op==='/'&&b.denom){const A=b.forms[0][0]*b.denom/b.forms[0][1],B=b.forms[1][0]*b.denom/b.forms[1][1];if(b.left.length!==A||b.right.length!==B)fail('先摆好被分的量与每一组的量。');else if((b.fits+1)*B>A)fail('剩下的不够一整组，可以看看还占一组的几分之几。');else b.fits++;}
  if(a==='rest'&&t.op==='/'&&b.denom){const A=b.forms[0][0]*b.denom/b.forms[0][1],B=b.forms[1][0]*b.denom/b.forms[1][1];if(b.left.length===A&&b.right.length===B&&b.fits===Math.floor(A/B))b.rest=true;}
 }
 if(t.type==='x-fdprecall'&&a==='recall'&&b.index<t.cases.length){const[n,d0]=t.cases[b.index];b.first[b.index]??=[f.decimal,f.percent];if(!equal(f.decimal,n,d0)||!equal(f.percent,n*100,d0))fail('这两个名字要指向同一个量；百分数是在数100等份中的几份。');else{b.records.push({fraction:[n,d0],decimal:f.decimal,percent:f.percent,first:cp(b.first[b.index])});b.index++;}}
 if(t.type==='x-straightgap'&&a==='angle'){b.first??=f.angle;if(integer(N('angle'),0,180))b.angle=N('angle');}
 return{board:b,issue};
}
export function act(t,m,action,data={}){const e={a:action.replace(/^b17-/,''),d:Object.fromEntries(Object.entries(data).filter(([k])=>['index','value','row'].includes(k)).map(([k,v])=>[k,String(v)])),f:Object.fromEntries(Object.keys(fields).map(k=>[k,m[k]]))};if(!serial(e)||m.history.length>=1500)return m;const r=apply(t,cp(m.board),e);m.board=r.board;m.issue=r.issue;m.history.push(e);return m;}
export function field(t,m,k){if(k in fields)m[k]=String(m[k]??'');}
export function valid(t,m){try{if(!m||!TYPES.has(t.type)||!Object.keys(fields).every(k=>text(m[k]))||!text(m.issue)||!Array.isArray(m.history)||m.history.length>1500||!m.history.every(serial))return false;let b=board(t);for(const e of m.history)b=apply(t,b,e).board;return same(b,m.board);}catch{return false;}}
export function inspect(t,m){const b=m.board;let ok=false,feedback='把眼前的构造和记录对起来，再检查。';
 switch(t.type){
 case'x-fracorder':ok=b.committed&&b.aligned&&t.cards.every((s,i)=>b.parts[i].length===frac(s)[0]&&cmp(b.placements[i]||'?',s)===0)&&b.ordered.length===t.cards.length&&b.ordered.every((i,j)=>j===0||(t.desc?cmp(t.cards[b.ordered[j-1]],t.cards[i])>=0:cmp(t.cards[b.ordered[j-1]],t.cards[i])<=0))&&(!t.common||b.common&&Number(m.denom)===b.common&&t.cards.every((_,i)=>b.renames[i]))&&(!t.gaps||t.cards.every((_,i)=>b.gaps[i]))&&(!t.benchmark||t.cards.every((_,i)=>b.benchmarks[i]));feedback='整体和单位保持一致，摆出每个量，再按它们的位置排序；写法长短不能决定大小。';break;
 case'x-fracrename':ok=b.opened&&b.moves>0&&(t.targets||[]).every(r=>b.saved.some(x=>same(x,r)))&&(!t.count||b.saved.filter(r=>!same(r,[t.n,t.d])).length>=t.count)&&(!t.simple||gcd(b.n,b.d)===1)&&(!t.hcf||Number(m.hcf)===gcd(t.n,t.d))&&(!t.testAdd||b.tested&&m.relation===(t.n===t.d?'same':'changed'))&&m.reason==='recut'&&(!t.decimal||equal(m.decimal,t.n,t.d));feedback='分得更细或合成更大的份，整体和选中的量都不能变；最简还要确认两边没有大于1的公因数。';break;
 case'x-decimalcompare':ok=b.records.length===t.cases.length;feedback='同一种单位对齐，从左往右找到最先不同的一列；末尾补0不改变量。';break;
 case'x-decimalzoom':ok=b.levels.length===2&&b.mark===t.n&&ftext(frac(m.fraction)||[])===`${t.n}/1000`&&equal(m.decimal,t.n,1000)&&equal(m.answer,1,1000);feedback='每次把一个间隔再分10份；现在一小步是原来单位的多少？';break;
 case'x-hundredcombine':ok=b.cells.filter(x=>x===0).length===t.tenths*10&&b.cells.filter(x=>x===1).length===t.hundredths&&m.left.replace(/\s/g,'')===`${t.tenths*10}/100`&&m.answer.replace(/\s/g,'')===`${t.tenths*10+t.hundredths}/100`&&equal(m.decimal,t.tenths*10+t.hundredths,100);feedback='整行的十分之一先换成10个小格，再接上百分之一；不能把分母相加。';break;
 case'x-complementpair':ok=b.left!==null&&b.right!==null&&b.left===m.left&&b.right===m.right&&Number(b.left.replace('.',''))+Number(b.right.replace('.',''))===1000&&(!t.left||equal(b.left,...rational(t.left)));feedback='两段相接，刚好到1；这次按三位小数记录，同一个量允许补末尾0。';break;
 case'x-decimalengine':{const end=b.factors.every(n=>n===2||n===5),want=end?'stop':'repeat';ok=b.simple&&b.factorLeft===1&&b.prediction===want&&m.kind===want&&b.stop&&(end?equal(m.answer,t.n,t.d):m.answer===b.rows.slice(b.cycle+1).map(r=>r.q).join(''))&&m.reason==='base-ten';feedback='先化简，再看整个的份数由哪些质数相乘；除法每一步保留余数。重复的余数会带来重复的小数段。';break;}
 case'x-percentkit':ok=b.tenth!==null&&b.fifth!==null&&b.pieces.reduce((s,x)=>s+x,0)===t.percent&&equal(m.percent,t.percent)&&equal(m.answer,t.total*t.percent,100)&&m.reason==='same-total';feedback='10%先由整份平分出来，5%是它的一半；拼出的百分数与金额都要对应原来的整体。';break;
 case'x-rulejump':ok=b.rule&&b.rule[0]===t.a*b.rule[2]&&b.rule[1]===t.b*b.rule[2]&&t.inputs.every(n=>b.records.some(r=>r.n===n&&equal(r.result,t.a*n+t.b)))&&same(b.rule,[Number(m.multiplier),Number(m.offset),Number(m.divisor)]);feedback='规则要能重现已知的前几项，也能直接走到远处；固定多出的一块不能跟着位置一起倍增。';break;
 case'x-fracoperations':{const r=operation(t),aa=b.forms?.[0],bb=b.forms?.[1];let construction=false;if(aa&&bb){if(t.op==='*')construction=b.columns.length===aa[0]&&b.rows.length===bb[0];else if(t.op==='/')construction=b.denom>0&&b.rest&&b.fits===Math.floor(r[0]/r[1])&&equal(m.whole,b.fits)&&equal(m.part,r[0]%r[1],r[1]);else construction=b.combined&&b.denom>0;}ok=b.prediction!==null&&construction&&equal(m.answer,...r)&&m.reason===(['+','-'].includes(t.op)?'same-parts':t.op==='*'?'scale':'groups')&&(!b.denom||Number(m.denom)===b.denom)&&(!b.forms||cmp(m.aform,ftext(aa))===0&&cmp(m.bform,ftext(bb))===0);feedback='先把原来的量全部表示出来；加减接同样小的份，乘法取一部分中的一部分，除法看能放下几组。';break;}
 case'x-fdprecall':ok=b.records.length===t.cases.length;feedback='给同一个量留下小数与百分数两个名字。这里只记录有限次回忆，不代表长期熟练。';break;
 case'x-straightgap':ok=b.angle===180-t.known&&Number(m.angle)===b.angle&&equal(m.answer,b.angle)&&m.reason==='straight'&&equationOK(m.equation,[`180-${t.known}=${180-t.known}`,`${t.known}+${180-t.known}=180`]);feedback='两块沿同一直线相接，应不重叠、不留缝；把使用的角度关系写下来。';break;
 }
 return{correct:!!ok,feedback:ok?'这次的操作和记录对上了。':feedback,evidence:{construction:cp(b),history:cp(m.history),fields:Object.fromEntries(Object.keys(fields).map(k=>[k,m[k]])),openExplanationAssessed:false,physicalActionAssessed:false,generalMasteryAssessed:false}};
}
export function solveSteps(t){const s=[],f=(field,value)=>s.push({field,value:String(value)}),a=(action,data={})=>s.push({action:'b17-'+action,data});
 switch(t.type){
 case'x-fracorder':{const ids=t.cards.map((_,i)=>i).sort((i,j)=>(t.desc?-1:1)*cmp(t.cards[i],t.cards[j]));for(const index of ids)a('card',{index});a('predict');if(t.mismatch)a('align');for(let row=0;row<t.cards.length;row++){for(let index=0;index<frac(t.cards[row])[0];index++)a('shade',{row,index});a('select',{index:row});f('position',t.cards[row]);a('place');if(t.gaps){const[n,d]=frac(t.cards[row]);f('answer',(d-n)+'/'+d);a('landmark');}if(t.benchmark){f('relation',cmp(t.cards[row],'1/2')<0?'<':cmp(t.cards[row],'1/2')>0?'>':'=');a('landmark');}}if(t.common){const d=t.cards.map(x=>frac(x)[1]).reduce(lcm,1);f('denom',d);a('common');for(let i=0;i<t.cards.length;i++){a('select',{index:i});const r=frac(t.cards[i]);f('fraction',r[0]*d/r[1]+'/'+d);a('rename');}}for(const index of ids)a('order',{index});break;}
 case'x-fracrename':if(t.decimalStart){f('fraction',t.n+'/'+t.d);a('open-decimal');}for(const r of t.targets||(Array.from({length:t.count||1},(_,i)=>[t.n*(i+2),t.d*(i+2)]))){a('rewind');if(r[1]>t.d){f('factor',r[1]/t.d);a('split');}else{f('factor',t.d/r[1]);a('merge');}f('fraction',ftext(r));a('remember');}if(t.testAdd){a('test-add');f('relation',t.n===t.d?'same':'changed');}f('reason','recut');if(t.hcf)f('hcf',gcd(t.n,t.d));if(t.decimal)f('decimal',t.n/t.d);break;
 case'x-decimalcompare':for(let i=0;i<t.cases.length;i++){const p=decimalPair(t,{index:i});f('prediction',p.relation);a('predict-compare');f('left',p.padded[0]);f('right',p.padded[1]);a('pad');for(let i=0;i<(p.first<0?p.digits[0].length:p.first+1);i++)a('scan',{index:i});f('relation',p.relation);a('compare');}break;
 case'x-decimalzoom':a('zoom',{index:Math.floor(t.n/100)});a('zoom',{index:Math.floor(t.n%100/10)});a('mark',{index:t.n%10});f('fraction',t.n+'/1000');f('decimal',(t.n/1000).toFixed(3));f('answer','1/1000');break;
 case'x-hundredcombine':a('layer',{index:0});for(let i=0;i<t.tenths;i++)a('ten',{index:i});a('layer',{index:1});for(let i=t.tenths*10;i<t.tenths*10+t.hundredths;i++)a('cell',{index:i});f('left',t.tenths*10+'/100');f('answer',(t.tenths*10+t.hundredths)+'/100');f('decimal',(t.tenths*10+t.hundredths)/100);break;
 case'x-complementpair':f('left',t.left||'0.137');f('right',(1-Number(t.left||'.137')).toFixed(3));a('pair');break;
 case'x-decimalengine':{const[n,d]=reduced(t.n,t.d);f('fraction',n+'/'+d);a('reduce');let x=d;for(let k=2;x>1;k++)while(x%k===0){f('factor',k);a('factor');x/=k;}const factors=[];x=d;for(let k=2;x>1;k++)while(x%k===0){factors.push(k);x/=k;}const end=factors.every(n=>n===2||n===5);f('kind',end?'stop':'repeat');a('predict-stop');let rem=n,seen=[],rows=[],cycle=null;for(let j=0;j<30;j++){const input=j?rem*10:rem,q=Math.floor(input/d);rem=input%d;f('q',q);f('remainder',rem);a('digit');rows.push(q);if(!rem)break;if(seen.includes(rem)){cycle=seen.indexOf(rem);break;}seen.push(rem);}f('answer',end?n/d:rows.slice(cycle+1).join(''));f('reason','base-ten');break;}
 case'x-percentkit':f('amount',t.total/10);a('tenth');f('amount',t.total/20);a('fifth');for(let i=0;i<Math.floor(t.percent/10);i++)a('piece',{value:10});if(t.percent%10)a('piece',{value:5});f('percent',t.percent);f('answer',t.total*t.percent/100);f('reason','same-total');break;
 case'x-rulejump':f('multiplier',t.exampleRule?.[0]||t.a);f('offset',t.exampleRule?.[1]||t.b);f('divisor',t.exampleRule?.[2]||1);a('rule');for(const n of t.inputs){f('n',n);f('answer',t.a*n+t.b);a('run');}break;
 case'x-fracoperations':{const r=operation(t),aa=frac(t.a),bb=frac(t.b);f('prediction',estimateKind(r));a('predict-op');f('aform',ftext(aa));f('bform',ftext(bb));a('forms');if(t.op==='*'){for(let i=0;i<aa[0];i++)a('column',{index:i});for(let i=0;i<bb[0];i++)a('row',{index:i});}else{const d=lcm(aa[1],bb[1]);f('denom',d);a('common');for(const[row,r0]of[['left',aa],['right',bb]])for(let i=0;i<r0[0]*d/r0[1];i++)a('shade',{row,index:i});if(t.op==='/'){for(let i=0;i<Math.floor(r[0]/r[1]);i++)a('fit');a('rest');f('whole',Math.floor(r[0]/r[1]));f('part',r[0]%r[1]+'/'+r[1]);}else a('combine');}f('answer',ftext(r));f('reason',['+','-'].includes(t.op)?'same-parts':t.op==='*'?'scale':'groups');break;}
 case'x-fdprecall':for(const[n,d]of t.cases){f('decimal',n/d);f('percent',n*100/d);a('recall');}break;
 case'x-straightgap':f('angle',180-t.known);a('angle');f('answer',180-t.known);f('equation',`180-${t.known}=${180-t.known}`);f('reason','straight');break;
 }return s;
}
export function example(t){const m=initial(t);for(const s of solveSteps(t)){if(s.field){m[s.field]=s.value;field(t,m,s.field);}else act(t,m,s.action,s.data);}return m;}
