// Exact, replayable actions. A changed picture alone never awards completion.
export const TYPES=new Set(['x-mulgroups','x-mularray','x-mulfacts','x-factorrects','x-mulchain','x-divreverse']);
const copy=x=>structuredClone(x),same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const int=(n,a=0,b=1000000)=>Number.isSafeInteger(n)&&n>=a&&n<=b;
const txt=s=>typeof s==='string'&&s.length<=2000;
export const number=s=>txt(s)&&/^\d{1,9}$/.test(s.trim())&&int(Number(s))?Number(s):null;
const norm=s=>String(s).replace(/\s/g,'').replace(/[xX*✕]/g,'×').replace(/[／/]/g,'÷').replace(/＝/g,'=').replace(/[?？]/g,'□');
const reversed=s=>s.split('=').reverse().join('=');
const matches=(raw,options)=>options.some(s=>norm(raw)===s||norm(raw)===reversed(s));
const fields={rows:'0',cols:'0',cut:'0',answer:'',equation:'',addition:'',base:'',left:'',right:'',rest:'',check:'',prediction:'',amount:'1',result:''};
const initialGroups=t=>({homes:t.mode==='build'?[]:Array(t.total).fill(-1),buckets:t.mode==='share'?t.a:0,selected:[]});
const initialChain=t=>t.values.map((value,i)=>({ids:[i],value}));
function board(t){switch(t.type){
 case'x-mulgroups':return initialGroups(t);
 case'x-mularray':return{rows:0,cols:0,built:null,cut:null,turns:0,prediction:null};
 case'x-mulfacts':return{saved:[],help:false};
 case'x-factorrects':return{pairs:[]};
 case'x-mulchain':return{groups:initialChain(t),selected:[],merges:[]};
 case'x-divreverse':return{swaps:0,firstAnswer:null};
}}
export function initial(t){return{...fields,board:board(t),history:[],issue:''};}
function taskValid(t){if(!TYPES.has(t?.type))return false;
 if(t.type==='x-mulgroups')return ['build','share','group'].includes(t.mode)&&int(t.a,1,12)&&int(t.b,t.mode==='group'?1:0,12)&&int(t.total,0,144)&&(t.mode==='build'?t.total===t.a*t.b:t.total===t.a*t.b+(t.remainder?t.total%t.a:0));
 if(t.type==='x-mularray')return int(t.a,1,12)&&int(t.b,1,12)&&[1,10,100,1000].includes(t.unit||1)&&(!t.hidden||['a','b','p'].includes(t.hidden));
 if(t.type==='x-mulfacts')return Array.isArray(t.cases)&&t.cases.length>0&&t.cases.length<=36&&t.cases.every(c=>c.kind==='parity'?int(c.n,0,999999):int(c.a,0,144)&&int(c.b,0,144)&&['×','÷'].includes(c.op)&&(c.op!=='÷'||c.b>0&&c.a%c.b===0));
 if(t.type==='x-factorrects')return int(t.n,1,64);
 if(t.type==='x-mulchain')return Array.isArray(t.values)&&t.values.length===3&&t.values.every(n=>int(n,0,25));
 return int(t.a,1,12)&&int(t.b,1,12)&&t.a>t.b;
}
export function family(t,unknown=false){const a=t.a,b=t.b*(typeof t.unit==='number'?t.unit:1),p=a*b,v={a:String(a),b:String(b),p:String(p)};if(unknown)v[t.hidden]='□';let opts=[`${v.a}×${v.b}=${v.p}`,`${v.b}×${v.a}=${v.p}`];if(a)opts.push(`${v.p}÷${v.a}=${v.b}`);if(b)opts.push(`${v.p}÷${v.b}=${v.a}`);return opts;}
export const equationMatches=(t,raw)=>matches(raw,family(t,!!t.hidden).filter(s=>t.hidden||s.includes('×')));
export function repeated(raw,rows,cols,unit=1){return matches(raw,[Array(rows).fill(cols*unit).join('+')+'='+rows*cols*unit]);}
export const counts=m=>Array.from({length:m.board.buckets},(_,i)=>m.board.homes.filter(n=>n===i).length);
export const factAnswer=c=>c.kind==='parity'?(c.n%2?'odd':'even'):String(c.op==='×'?c.a*c.b:c.a/c.b);
export function pairs(n){const out=[];for(let a=1;a*a<=n;a++)if(n%a===0)out.push([a,n/a]);return out;}
const pick=(xs,n)=>{const i=xs.indexOf(n);if(i>=0)xs.splice(i,1);else xs.push(n);};
function apply(t,b,e){const d=e.data,a=e.action;let issue='';const fail=s=>{issue=s;};
 if(a==='b13-reset')return{board:board(t),issue};
 if(t.type==='x-mulgroups'){
  if(a==='b13-plate-add'&&t.mode!=='share'&&b.buckets<12)b.buckets++;
  if(a==='b13-plate-remove'&&t.mode!=='share'&&b.buckets){if(b.homes.includes(b.buckets-1))fail('先把最后一个盘子里的东西搬回来，再收起空盘。');else b.buckets--;}
  if(a==='b13-token'&&int(d.token,0,b.homes.length-1))pick(b.selected,d.token);
  if(a==='b13-drop'&&int(d.bucket,-1,b.buckets-1)){
   const chosen=d.token!==null?[d.token]:[...b.selected];if(!chosen.length||!chosen.every(i=>int(i,0,b.homes.length-1)))fail('先选要搬的几颗，再点要去的地方。');else{for(const i of chosen)b.homes[i]=d.bucket;b.selected=[];}
  }
  if(a==='b13-pour'&&int(d.bucket,0,b.buckets-1)&&b.selected.length){for(const i of b.selected)b.homes[i]=d.bucket;b.selected=[];}
  else if(a==='b13-pour'&&int(d.bucket,0,b.buckets-1)){
   const n=number(d.amount);const available=b.homes.map((v,i)=>v===-1?i:null).filter(v=>v!==null);
   if(!int(n,1,12))fail('这次取1到12个，再看看放在哪一份。');else if(t.mode!=='build'&&available.length<n)fail('桌上没有这么多。已经分出去的可以搬回来重新分。');else if(t.mode==='build'&&b.homes.length+Math.max(0,n-available.length)>144)fail('这一桌最多摆144个。可以先把不用的部分搬回桌面。');else for(let i=0;i<n;i++)if(i<available.length)b.homes[available[i]]=d.bucket;else b.homes.push(d.bucket);
  }
  if(a==='b13-round'&&t.mode==='share'){
   const pool=b.homes.map((v,i)=>v===-1?i:null).filter(v=>v!==null);if(pool.length<b.buckets)fail('剩下的已经不够每盘再放一个。看看每盘与剩余各是多少。');else for(let i=0;i<b.buckets;i++)b.homes[pool[i]]=i;
  }
 }
 if(t.type==='x-mularray'){
  if(a==='b13-shape'){const r=number(d.rows),c=number(d.cols);if(!int(r,1,12)||!int(c,1,12))fail('先给长方形摆出行和列。');else if(t.rotate&&!['more','less','same'].includes(d.prediction))fail('先留下转向以后会怎样的猜想，再摆出来。');else{b.rows=r;b.cols=c;b.built={rows:r,cols:c};b.cut=null;b.turns=0;b.prediction??=d.prediction;}}
  if(a==='b13-turn'&&b.built){[b.rows,b.cols]=[b.cols,b.rows];b.turns++;b.cut=null;if(b.prediction!=='same')fail('转向改变了行和列。同一批点没有增加或减少，可以再检查自己的猜想。');}
  if(a==='b13-cut'&&b.built){const c=number(d.cut);if(!int(c,1,b.cols-1))fail('切线要留在两列之间，两边都要留下一些。');else b.cut=c;}
 }
 if(t.type==='x-mulfacts'&&b.saved.length<t.cases.length){
  if(a==='b13-fact-help'){b.help=true;fail('用图找回来也可以。这次看过图会留下记录。');}
  if(a==='b13-fact-save'){const c=t.cases[b.saved.length],want=factAnswer(c);if((c.kind==='parity'?d.answer:number(d.answer)?.toString())!==want)fail('还没对上。可以用图重建，再回来修改。');else{b.saved.push({answer:d.answer,help:b.help});b.help=false;}}
 }
 if(t.type==='x-factorrects'&&a==='b13-pair-save'){
  const r=number(d.rows),c=number(d.cols);if(!int(r,1,t.n)||!int(c,1,t.n)||r*c!==t.n||number(d.answer)!==t.n)fail('行数乘每行个数，要恰好装下原来这一堆。');else{const pair=[r,c].sort((a,b)=>a-b);if(b.pairs.some(p=>same(p,pair)))fail('这一种已经留下了。转个方向仍是同一对，再找别的摆法。');else b.pairs.push(pair);}
 }
 if(t.type==='x-mulchain'){
  if(a==='b13-chain-pick'&&int(d.index,0,b.groups.length-1)&&b.groups.length>1){if(b.selected.includes(d.index))pick(b.selected,d.index);else if(b.selected.length<2)b.selected.push(d.index);}
  if(a==='b13-chain-merge'&&b.selected.length===2){const [i,j]=b.selected,[left,right]=[b.groups[i],b.groups[j]],want=left.value*right.value;
   if(number(d.result)!==want)fail('这次先算选中的两份，另一个数还留着。');else{b.merges.push({before:copy(b.groups),left:copy(left),right:copy(right),result:d.result});b.groups=b.groups.filter((_,k)=>k!==i&&k!==j);b.groups.push({ids:[...left.ids,...right.ids],value:want});b.selected=[];}
  }
  if(a==='b13-chain-undo'&&b.merges.length){b.groups=b.merges.pop().before;b.selected=[];}
 }
 if(t.type==='x-divreverse'&&a==='b13-div-swap'){
  if(!d.answer.trim())fail('先记下原来每组有多少，再换一换。');else{b.firstAnswer??=d.answer;b.swaps++;if(!rationalEquals(d.answer,t.a,t.b))fail('先前的分法也需要核对。两种分法的全部与组数换了位置。');}
 }
 return{board:b,issue};
}
const actions=new Set(['b13-reset','b13-plate-add','b13-plate-remove','b13-token','b13-drop','b13-pour','b13-round','b13-shape','b13-turn','b13-cut','b13-fact-help','b13-fact-save','b13-pair-save','b13-chain-pick','b13-chain-merge','b13-chain-undo','b13-div-swap']);
const dataKeys=['amount','answer','bucket','cols','cut','index','prediction','result','rows','token'];
function eventValid(e){return e&&Object.getPrototypeOf(e)===Object.prototype&&same(Object.keys(e).sort(),['action','data'])&&actions.has(e.action)&&e.data&&same(Object.keys(e.data).sort(),dataKeys)&&['amount','answer','cols','cut','prediction','result','rows'].every(k=>txt(e.data[k]))&&['bucket','index','token'].every(k=>e.data[k]===null||int(e.data[k],-1,200));}
export function act(t,m,action,d={}){if(!actions.has(action))return m;
 const event={action,data:{amount:m.amount,answer:m.answer,bucket:d.bucket===undefined?null:Number(d.bucket),cols:m.cols,cut:m.cut,index:d.index===undefined?null:Number(d.index),prediction:m.prediction,result:m.result,rows:m.rows,token:d.token===undefined?null:Number(d.token)}};
 if(!eventValid(event))return m;const result=apply(t,copy(m.board),event);m.history.push(event);m.board=result.board;m.issue=result.issue;if(action==='b13-fact-save'&&!m.issue)m.answer='';if(action==='b13-chain-merge'&&!m.issue)m.result='';return m;
}
export function field(t,m,key){if(key in fields)m[key]=String(m[key]);}
export function valid(t,m){try{if(!taskValid(t)||!m||Object.getPrototypeOf(m)!==Object.prototype||!Object.keys(fields).every(k=>txt(m[k]))||!txt(m.issue)||!Array.isArray(m.history)||m.history.length>5000||!m.history.every(eventValid))return false;let b=board(t);for(const e of m.history)b=apply(t,b,e).board;return same(b,m.board);}catch{return false;}}
export function rationalEquals(raw,n,d){if(!txt(raw))return false;const s=raw.trim();let a,b;if(/^\d{1,6}\/\d{1,6}$/.test(s))[a,b]=s.split('/').map(Number);else if(/^\d{1,6}(\.\d{1,6})?$/.test(s)){b=10**(s.split('.')[1]?.length||0);a=Number(s.replace('.',''));}else return false;return b>0&&a*d===n*b;}
export function inspect(t,m){if(!valid(t,m))return{correct:false,feedback:'这份操作记录不能读，试着重新开始这一小步。'};const b=m.board;let ok=false,feedback='让摆法和关系一起对上故事。';
 if(t.type==='x-mulgroups'){
  const cs=counts(m),rest=b.homes.filter(n=>n===-1).length,wantRest=t.total-t.a*t.b,grouping=b.buckets===t.a&&cs.every(n=>n===t.b)&&(t.mode==='build'||rest===wantRest);
  const result=t.mode==='build'?t.total:t.mode==='share'?t.b:t.a,expr=t.remainder?[`${t.a}×${t.b}+${wantRest}=${t.total}`,`${t.b}×${t.a}+${wantRest}=${t.total}`]:t.mode==='build'?family(t).filter(s=>s.includes('×')):[`${t.total}÷${t.mode==='share'?t.a:t.b}=${result}`];
  ok=grouping&&number(m.answer)===result&&matches(m.equation,expr)&&(!t.repeated||repeated(m.addition,t.a,t.b))&&(!t.remainder||number(m.rest)===wantRest);
  feedback=!grouping?'每份要与故事对应，一样多；原来的东西不能漏掉。若允许剩余，先把每份分得一样。':!matches(m.equation,expr)?'写一个与问题对应的算式，说明答案数的是每份多少，还是有几份。':'把每份、总量和剩下的部分核对一次。';
 }
 if(t.type==='x-mularray'){
  const shape=b.built?.rows===t.a&&b.built?.cols===t.b&&number(m.rows)===b.built.rows&&number(m.cols)===b.built.cols,unit=t.unit||1,want=t.hidden==='a'?t.a:t.hidden==='b'?t.b*unit:t.a*t.b*unit;
  let eq=t.approximate?String(m.equation).includes('≈')&&matches(String(m.equation).replace('≈','='),family(t).filter(s=>s.includes('×'))):equationMatches(t,m.equation);
  if(t.reverseEquation)eq=eq&&/^\d+=/.test(norm(m.equation));
  const split=!t.split||(int(b.cut,1,b.cols-1)&&(t.requiredCut===undefined||b.cut===t.requiredCut)&&number(m.left)===b.rows*b.cut*unit&&number(m.right)===b.rows*(b.cols-b.cut)*unit);
  const substituted=!t.original||matches(m.check,[norm(t.original).replace('□',String(want))]);
  ok=shape&&(!t.rotate||b.turns>0)&&split&&eq&&number(m.answer)===want&&(!t.repeated||repeated(m.addition,b.rows,b.cols,unit))&&(unit===1||number(m.base)===t.a*t.b)&&substituted;
  feedback=!shape?'行数和每行多少都要与问题对应。调整后按“摆成这样”留下摆法。':t.rotate&&!b.turns?'亲自转一下，再看同一批点怎样排。':!split?'切成两块后，每一块仍有完整的行数。两边都算一遍。':!eq?'把图与完整的关系式对应起来；空格位置可以改变，原来的量不能丢。':!substituted?'把找到的数放回最初的等式，再写一次检查。':'把图、单位和答案互相核对。';
 }
 if(t.type==='x-mulfacts'){ok=b.saved.length===t.cases.length;feedback='一次留下一组事实；忘了可以用图找回来。';}
 if(t.type==='x-factorrects'){ok=same([...b.pairs].sort((a,b)=>a[0]-b[0]),pairs(t.n));feedback='还可以从1开始试；转向后的同一对只算一次。';}
 if(t.type==='x-mulchain'){ok=b.groups.length===1&&same([...b.groups[0].ids].sort(),[0,1,2])&&number(m.answer)===t.values.reduce((a,b)=>a*b,1);feedback='先合一对，再带上剩下的数，每个原数只用一次。';}
 if(t.type==='x-divreverse'){ok=b.swaps>0&&rationalEquals(m.answer,t.a,t.b)&&rationalEquals(m.result,t.b,t.a);feedback='全部和组数交换后是另一个问题。小于1的一份可以用分数写。';}
 return{correct:!!ok,feedback:ok?'摆法、计算和问题对上了。':feedback,evidence:{kind:t.type,construction:copy(m),explanationAssessed:false,fluencyAssessed:false,realHandlingAssessed:false,oralReadingAssessed:false,independentDrawingAssessed:false}};
}
export function solveSteps(t){const steps=[],m=initial(t),f=(key,value)=>{value=String(value);steps.push({field:key,value});m[key]=value;field(t,m,key);},a=(action,data={})=>{steps.push({action,data});act(t,m,action,data);};
 if(t.type==='x-mulgroups'){
  if(t.mode!=='share')for(let i=0;i<t.a;i++)a('b13-plate-add');
  if(t.b)for(let i=0;i<t.a;i++){f('amount',t.b);a('b13-pour',{bucket:i});}
  const rest=t.total-t.a*t.b,result=t.mode==='build'?t.total:t.mode==='share'?t.b:t.a;
  f('answer',result);f('equation',t.remainder?`${t.a}×${t.b}+${rest}=${t.total}`:t.mode==='build'?`${t.a}×${t.b}=${t.total}`:`${t.total}÷${t.mode==='share'?t.a:t.b}=${result}`);if(t.remainder)f('rest',rest);if(t.repeated)f('addition',Array(t.a).fill(t.b).join('+')+'='+t.total);
 }else if(t.type==='x-mularray'){
  f('rows',t.a);f('cols',t.b);if(t.rotate)f('prediction','same');a('b13-shape');if(t.rotate)a('b13-turn');
  const unit=t.unit||1;if(t.split){const c=t.requiredCut||Math.max(1,Math.floor(m.board.cols/2));f('cut',c);a('b13-cut');f('left',m.board.rows*c*unit);f('right',m.board.rows*(m.board.cols-c)*unit);}
  if(t.repeated)f('addition',Array(m.board.rows).fill(m.board.cols*unit).join('+')+'='+t.a*t.b*unit);
  f('equation',t.original||((t.reverseEquation?reversed(family(t)[0]):family(t)[0]).replace('=',t.approximate?'≈':'=')));f('answer',t.hidden==='a'?t.a:t.hidden==='b'?t.b*unit:t.a*t.b*unit);if(unit!==1)f('base',t.a*t.b);if(t.original)f('check',norm(t.original).replace('□',m.answer));
 }else if(t.type==='x-mulfacts'){for(const c of t.cases){f('answer',factAnswer(c));a('b13-fact-save');}}
 else if(t.type==='x-factorrects'){for(const[r,c]of pairs(t.n)){f('rows',r);f('cols',c);f('answer',t.n);a('b13-pair-save');}}
 else if(t.type==='x-mulchain'){while(m.board.groups.length>1){a('b13-chain-pick',{index:0});a('b13-chain-pick',{index:1});f('result',m.board.groups[0].value*m.board.groups[1].value);a('b13-chain-merge');}f('answer',m.board.groups[0].value);}
 else if(t.type==='x-divreverse'){f('answer',`${t.a}/${t.b}`);a('b13-div-swap');f('result',`${t.b}/${t.a}`);}
 return steps;
}
export function example(t){const m=initial(t);for(const s of solveSteps(t))if(s.field){m[s.field]=s.value;field(t,m,s.field);}else act(t,m,s.action,s.data);return m;}
