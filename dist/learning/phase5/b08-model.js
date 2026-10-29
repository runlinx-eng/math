import{Q,ticks,decimal,dpFor,rounded,significant,chinese,roman,romanParts,romanValue}from'./b08-math.js';
export const TYPES=new Set(['x-wideboard','x-wideshift','x-roundwork','x-boundinterval','x-romanwork']);
const int=(n,a,b)=>Number.isInteger(n)&&n>=a&&n<=b,text=s=>typeof s==='string'&&s.length<=120,eq=(a,b)=>JSON.stringify(a)===JSON.stringify(b),bool=b=>typeof b==='boolean';
const unique=(a,n)=>Array.isArray(a)&&a.length<=n&&new Set(a).size===a.length&&a.every(i=>int(i,0,n-1)),strings=(a,n)=>Array.isArray(a)&&a.length===n&&a.every(text),isValue=(s,n)=>ticks(s)!==null&&ticks(s)===n;
export function columns(t){const vals=t.values||[String(t.start)],max=Math.max(0,...vals.map(v=>Math.floor(Math.log10(Math.max(1,Math.abs(Number(v))))))),min=-Math.max(0,...vals.map(v=>(String(v).split('.')[1]||'').length));return Array.from({length:max-min+1},(_,i)=>max-i);}
export const digitRow=(value,cols)=>cols.map(e=>Math.floor(Math.abs(ticks(value))/Math.round(Q*10**e))%10);
export const rowValue=(row,cols)=>row.reduce((s,n,i)=>s+n*Math.round(Q*10**cols[i]),0);
export function shifted(start,shift){const a=BigInt(ticks(start)),b=10n**BigInt(Math.abs(shift)),v=shift>=0?a*b:a/b;if(shift<0&&a%b!==0n||v>100000000n*BigInt(Q))return null;return Number(v);}
export const addColumns=[4,3,2,1,0];
export function changed(t){const a=digitRow(t.start,addColumns),b=digitRow(String(Number(t.start)+t.step),addColumns);return a.map((n,i)=>n!==b[i]?i:null).filter(i=>i!==null);}
export const targetShift=t=>t.mode==='scientific'?-Math.floor(Math.log10(Number(t.start))):t.step;
export const roundUnit=(t,m)=>m.unit||t.unit;
export const partsFor=m=>{let s='',out=[];for(let i=0;i<m.roman.length;i++){s+=m.roman[i];if(m.cuts.includes(i)||i===m.roman.length-1){out.push(s);s='';}}return out;};
export function initial(t){switch(t.type){
 case'x-wideboard':{const c=columns(t);return{active:0,rows:t.values.map(()=>c.map(()=>0)),parts:t.values.map(()=>c.map(()=>'')),answers:t.values.map(()=>''),words:t.values.map(()=>''),relation:'',first:'',order:[],positions:t.values.map(()=>0),touched:t.values.map(()=>false),gap:''};}
 case'x-wideshift':return{guess:'',committed:null,shift:0,trace:[],u:t.mode==='add'?digitRow(t.start,addColumns):[],moves:[],swaps:[],answer:'',factor:'',direction:'',exponent:'',changed:[]};
 case'x-roundwork':return{active:0,unit:t.units?'':t.unit,steps:t.values.map(()=>({low:'',high:'',mark:0,touched:false,result:''})),sig:[],estimate:'',exact:'',relation:''};
 case'x-boundinterval':return{low:'',high:'',left:'',right:'',probe:'',trials:[]};
 case'x-romanwork':return{roman:t.mode==='read'?roman(t.n):'',cuts:[],parts:[],answer:'',zero:'',each:['','']};
}}
export function valid(t,m){if(!m||!TYPES.has(t.type))return false;switch(t.type){
 case'x-wideboard':{const c=columns(t),n=t.values.length;return int(m.active,0,n-1)&&Array.isArray(m.rows)&&m.rows.length===n&&m.rows.every(r=>Array.isArray(r)&&r.length===c.length&&r.every(v=>int(v,0,9)))&&Array.isArray(m.parts)&&m.parts.length===n&&m.parts.every(r=>strings(r,c.length))&&strings(m.answers,n)&&strings(m.words,n)&&text(m.relation)&&text(m.first)&&unique(m.order,n)&&Array.isArray(m.positions)&&m.positions.length===n&&m.positions.every(p=>int(p,0,1000))&&Array.isArray(m.touched)&&m.touched.length===n&&m.touched.every(bool)&&text(m.gap);}
 case'x-wideshift':return text(m.guess)&&(m.committed===null||text(m.committed)&&ticks(m.committed)!==null)&&int(m.shift,-9,9)&&Array.isArray(m.trace)&&m.trace.length<=60&&m.trace.every(v=>v===1||v===-1)&&m.shift===m.trace.reduce((s,x)=>s+x,0)&&shifted(t.start,m.shift)!==null&&Array.isArray(m.moves)&&m.moves.length<=60&&m.moves.every(v=>v===1||v===-1)&&Array.isArray(m.swaps)&&m.swaps.length<=100&&m.swaps.every(v=>['up1','up2','up3','up4','down0','down1','down2','down3'].includes(v))&&Array.isArray(m.u)&&(t.mode==='add'?m.u.length===5&&m.u.every(v=>int(v,0,19))&&rowValue(m.u,addColumns)===ticks(t.start)+m.moves.reduce((s,x)=>s+x,0)*1000*Q:m.u.length===0)&&['answer','factor','direction','exponent'].every(k=>text(m[k]))&&unique(m.changed,5);
 case'x-roundwork':return int(m.active,0,t.values.length-1)&&text(m.unit)&&(!m.unit||[t.unit,...(t.units||[])].includes(m.unit))&&Array.isArray(m.steps)&&m.steps.length===t.values.length&&m.steps.every(s=>s&&text(s.low)&&text(s.high)&&text(s.result)&&int(s.mark,0,1000)&&bool(s.touched))&&unique(m.sig,t.values[0].length)&&['estimate','exact','relation'].every(k=>text(m[k]));
 case'x-boundinterval':return['low','high','left','right','probe'].every(k=>text(m[k]))&&Array.isArray(m.trials)&&m.trials.length<=40&&m.trials.every(s=>s&&text(s.value)&&ticks(s.value)!==null&&bool(s.inside)&&s.inside===(rounded(s.value,t.unit)?.result===ticks(t.value)));
 case'x-romanwork':return typeof m.roman==='string'&&/^[IVXLCDM]{0,20}$/.test(m.roman)&&(t.mode!=='read'||m.roman===roman(t.n))&&unique(m.cuts,Math.max(0,m.roman.length-1))&&Array.isArray(m.parts)&&m.parts.length<=20&&m.parts.every(text)&&['answer','zero'].every(k=>text(m[k]))&&strings(m.each,2);
}return false;}
const ordered=(t,m)=>m.order.length===t.values.length&&m.order.every((x,i)=>i===0||ticks(t.values[m.order[i-1]])<=ticks(t.values[x]));
const normalizedWords=s=>s.replace(/\s/g,'').replace(/两(?=[百千万])/g,'二').replace(/^一十/,'十');
const positioned=(t,m)=>m.positions.every((p,i)=>m.touched[i]&&Math.abs(p-(Number(t.values[i])-t.min)/(t.max-t.min)*1000)<=6);
export function estimate(t,m){const a=t.values.map(v=>rounded(v,roundUnit(t,m)).result);return t.calc==='*'?Number(BigInt(a[0])*BigInt(a[1])/BigInt(Q)):a.reduce((s,x)=>s+x,0);}
export function inspect(t,m){if(!valid(t,m))return{correct:false,feedback:'这份记录不完整，请重新试一试。'};let correct=false,feedback='看看操作和记录是否对上。';switch(t.type){
 case'x-wideboard':{const c=columns(t),built=m.rows.every((r,i)=>rowValue(r,c)===ticks(t.values[i])),answers=m.answers.every((v,i)=>isValue(v,ticks(t.values[i])));
  if(t.mode==='build')correct=built&&answers&&(!t.expanded||m.parts.every((r,i)=>r.every((v,j)=>isValue(v,m.rows[i][j]*Math.round(Q*10**c[j])))))&&(!t.words||m.words.every((w,i)=>normalizedWords(w)===chinese(Number(t.values[i]))));
  if(t.mode==='puzzle')correct=built&&answers&&m.rows[0].reduce((s,x)=>s+x,0)===t.sum&&m.rows[0][0]>0;
  if(t.mode==='compare'){const d=t.values.map(v=>digitRow(v,c)),first=d[0].findIndex((v,i)=>v!==d[1][i]),a=ticks(t.values[0]),b=ticks(t.values[1]);correct=built&&m.relation===(a===b?'=':a<b?'<':'>')&&m.first===(first<0?'same':String(first));}
  if(t.mode==='line')correct=positioned(t,m);
  if(t.mode==='order')correct=ordered(t,m)&&(t.conversions?answers:positioned(t,m))&&(!t.gap||isValue(m.gap,Math.max(...t.values.map(ticks))-Math.min(...t.values.map(ticks))));
  feedback=t.mode==='puzzle'?'用够六个位置，数字相加等于15。先让最左边尽可能大，再考虑下一格。':t.mode==='compare'?'两边都要摆对。从最高位开始，相同才往右比；空位也保留。':t.mode==='order'?'先按数值从小到大排，再让位置或普通写法对应每张卡；负数越向左越小。':t.mode==='line'?'先看两端，再按总长度判断这个数应该在什么位置。':'每个筹码带着单位。记的是这一格的值，空着的一格也要写0。';break;}
 case'x-wideshift':if(t.mode==='add'){const end=ticks(t.start)+t.step*Q;correct=m.committed!==null&&m.moves.length>0&&rowValue(m.u,addColumns)===end&&m.u.every(v=>v<10)&&isValue(m.answer,end)&&eq([...m.changed].sort(),changed(t));feedback='先留猜想，再添或取一千。十个一千要合成一万，没有可取的一千先拆一万；记录所有变化的位置。';}
  else{const s=targetShift(t),end=shifted(t.start,s);correct=m.committed!==null&&m.shift===s&&m.trace.length>0&&isValue(m.answer,end)&&(t.mode==='scientific'?m.exponent.trim()===String(-s)&&end>=Q&&end<10*Q:isValue(m.factor,10**Math.abs(s)*Q)&&m.direction===(s>0?'times':'divide'));feedback=t.mode==='scientific'?'先让第一部分落在1到10之间，再用10的幂补回原来的大小。向左放大以后，需要负指数缩回去。':'小数点不动。每移动一格，就乘10或除10；记录移动后的数和前后相差几倍。';}break;
 case'x-roundwork':{const unit=roundUnit(t,m),dp=dpFor(unit);correct=(!t.units||m.unit===t.unit)&&(!t.sf||eq([...m.sig].sort((a,b)=>a-b),significant(t.values[0],t.sf)))&&m.steps.every((s,i)=>{const r=rounded(t.values[i],unit);return isValue(s.low,r.low)&&isValue(s.high,r.high)&&s.touched&&Math.abs(s.mark-r.position)<=6&&(r.position===500?s.mark===500:r.position<500?s.mark<500:s.mark>500)&&s.result.trim()===decimal(r.result,dp);});if(t.calc)correct&&=isValue(m.estimate,estimate(t,m));if(t.exact){const exact=t.values.map(ticks).reduce((s,x)=>s+x,0),est=estimate(t,m);correct&&=isValue(m.exact,exact)&&m.relation===(est===exact?'=':est<exact?'<':'>');}feedback='从原数直接找两站，滑到它的位置，再选近的一边。正好一半时取较大的一站。保留小数位时，末尾的0也要写出来。';break;}
 case'x-boundinterval':{const v=ticks(t.value),h=ticks(t.unit)/2,lo=v-h,hi=v+h;correct=isValue(m.low,lo)&&isValue(m.high,hi)&&m.left==='closed'&&m.right==='open'&&m.trials.some(s=>ticks(s.value)===lo&&s.inside)&&m.trials.some(s=>ticks(s.value)===hi&&!s.inside);feedback='两端离报告值都是半个记录单位。亲自试下端与上端：哪一端还能报成这个数，哪一端已经报成下一站？';break;}
 case'x-romanwork':{const chunks=romanParts(roman(t.n)),parts=partsFor(m);correct=m.roman===roman(t.n)&&isValue(m.answer,t.n*Q)&&(t.mode!=='read'||eq(parts,chunks)&&m.parts.length===chunks.length&&m.parts.every((v,i)=>isValue(v,romanValue(chunks[i])*Q)))&&(!t.zero||m.zero==='none'&&m.each.every(v=>isValue(v,10*Q)));feedback='先看看能一起读的小段：IV是4、IX是9、XL是40、XC是90、CD是400、CM是900。这里采用常用规范；钟面IIII是另一种写法。';break;}
 }return{correct,feedback:correct?'操作和记录对上了。也可以说说你发现了什么。':feedback};}
export function act(t,m,a,d={}){const i=Number(d.index),delta=Number(d.delta);
 if(a==='wide-active'&&int(i,0,t.values.length-1))m.active=i;
 if(a==='wide-add'&&t.type==='x-wideboard'&&['build','compare','puzzle'].includes(t.mode)&&int(i,0,columns(t).length-1)&&[-1,1].includes(delta)){const r=m.rows[m.active];if(int(r[i]+delta,0,9))r[i]+=delta;}
 if(a==='wide-order'&&int(i,0,t.values.length-1)){const p=m.order.indexOf(i);if(p<0)m.order.push(i);else m.order.splice(p,1);}
 if(a==='wide-predict'&&m.committed===null&&ticks(m.guess)!==null)m.committed=m.guess;
 if(a==='wide-move'&&t.type==='x-wideshift'&&m.committed!==null&&[-1,1].includes(delta)){
  if(t.mode==='add'&&m.moves.length<60){if(int(m.u[1]+delta,0,19)){m.u[1]+=delta;m.moves.push(delta);}}
  else if(t.mode!=='add'&&m.trace.length<60&&int(m.shift+delta,-9,9)&&shifted(t.start,m.shift+delta)!==null){m.shift+=delta;m.trace.push(delta);}}
 if(a==='wide-swap'&&t.mode==='add'&&m.committed!==null&&m.swaps.length<100&&int(i,0,4)){
  const u=[...m.u];if(d.kind==='up'&&i>0&&u[i]>=10&&u[i-1]<19){u[i]-=10;u[i-1]++;m.swaps.push('up'+i);m.u=u;}
  if(d.kind==='down'&&i<4&&u[i]>0&&u[i+1]<=9){u[i]--;u[i+1]+=10;m.swaps.push('down'+i);m.u=u;}}
 if(a==='wide-changed'&&int(i,0,4)){const p=m.changed.indexOf(i);if(p<0)m.changed.push(i);else m.changed.splice(p,1);}
 if(a==='wide-sig'&&t.sf&&int(i,0,t.values[0].length-1)&&/\d/.test(t.values[0][i])){const p=m.sig.indexOf(i);if(p<0)m.sig.push(i);else m.sig.splice(p,1);}
 if(a==='wide-probe'&&t.type==='x-boundinterval'&&ticks(m.probe)!==null&&Number(m.probe)>=0&&m.trials.length<40)m.trials.push({value:m.probe,inside:rounded(m.probe,t.unit).result===ticks(t.value)});
 if(a==='roman-tile'&&t.mode==='write'&&/^[IVXLCDM]$/.test(d.tile)&&m.roman.length<20)m.roman+=d.tile;
 if(a==='roman-undo'&&t.mode==='write')m.roman=m.roman.slice(0,-1);
 if(a==='roman-cut'&&t.mode==='read'&&int(i,0,m.roman.length-2)){const p=m.cuts.indexOf(i);if(p<0)m.cuts.push(i);else m.cuts.splice(p,1);m.parts=partsFor(m).map(()=> '');}
}
export function field(t,m,key){if(t.type==='x-wideboard'&&key.startsWith('positions.'))m.touched[Number(key.split('.')[1])]=true;if(t.type==='x-roundwork'&&/^steps\.\d+\.mark$/.test(key))m.steps[Number(key.split('.')[1])].touched=true;}
export function example(t){const m=initial(t);switch(t.type){
 case'x-wideboard':{const c=columns(t);m.rows=t.values.map(v=>digitRow(v,c));m.parts=m.rows.map(r=>r.map((v,i)=>decimal(v*Math.round(Q*10**c[i]))));m.answers=[...t.values];m.words=t.values.map(v=>chinese(Number(v)));const a=Number(t.values[0]),b=Number(t.values[1]);m.relation=a===b?'=':a<b?'<':'>';const first=m.rows[0].findIndex((v,i)=>v!==m.rows[1]?.[i]);m.first=first<0?'same':String(first);m.order=t.values.map((_,i)=>i).sort((a,b)=>Number(t.values[a])-Number(t.values[b]));if(t.max!==undefined){m.positions=t.values.map(v=>Math.round((Number(v)-t.min)/(t.max-t.min)*1000));m.touched=t.values.map(()=>true);}m.gap=decimal(Math.max(...t.values.map(ticks))-Math.min(...t.values.map(ticks)));break;}
 case'x-wideshift':if(t.mode==='add'){const end=Number(t.start)+t.step;m.u=digitRow(String(end),addColumns);m.guess=m.answer=String(end);m.committed=m.guess;m.moves=[Math.sign(t.step)];m.changed=changed(t);if(t.step>0&&digitRow(t.start,addColumns)[1]===9)m.swaps=['up1'];if(t.step<0&&digitRow(t.start,addColumns)[1]===0)m.swaps=['down0'];}
  else{m.shift=targetShift(t);m.trace=Array.from({length:Math.abs(m.shift)},()=>Math.sign(m.shift));m.guess=m.answer=decimal(shifted(t.start,m.shift));m.committed=m.guess;m.factor=String(10**Math.abs(m.shift));m.direction=m.shift>0?'times':'divide';m.exponent=String(-m.shift);}break;
 case'x-roundwork':m.unit=t.unit;m.steps=t.values.map(v=>{const r=rounded(v,t.unit);return{low:decimal(r.low),high:decimal(r.high),mark:r.position,touched:true,result:decimal(r.result,dpFor(t.unit))};});if(t.sf)m.sig=significant(t.values[0],t.sf);if(t.calc)m.estimate=decimal(estimate(t,m));if(t.exact){const exact=t.values.map(ticks).reduce((s,x)=>s+x,0);m.exact=decimal(exact);const e=estimate(t,m);m.relation=e===exact?'=':e<exact?'<':'>';}break;
 case'x-boundinterval':{const a=ticks(t.value),h=ticks(t.unit)/2;m.low=decimal(a-h);m.high=decimal(a+h);m.left='closed';m.right='open';m.trials=[{value:m.low,inside:true},{value:m.high,inside:false}];m.probe=m.high;break;}
 case'x-romanwork':m.roman=roman(t.n);m.answer=String(t.n);if(t.mode==='read'){const chunks=romanParts(m.roman);let k=-1;m.cuts=chunks.slice(0,-1).map(s=>{k+=s.length;return k;});m.parts=chunks.map(s=>String(romanValue(s)));}m.zero='none';m.each=['10','10'];break;
}return m;}
