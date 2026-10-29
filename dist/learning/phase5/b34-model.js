import {rational} from './b16-model.js';
export const TYPES=new Set(['x-p34-repeat','x-p34-sequence','x-p34-pair','x-p34-ambiguity','x-p34-grid','x-p34-program','x-p34-growth','x-p34-relation']);
const cp=x=>structuredClone(x),same=(a,b)=>JSON.stringify(a)===JSON.stringify(b),text=x=>typeof x==='string'&&x.length<=1200,int=(n,a,b)=>Number.isSafeInteger(n)&&n>=a&&n<=b;
const number=s=>{const r=rational(String(s));return r?r[0]/r[1]:NaN;};
const ticks=(s,scale)=>{const r=rational(String(s));if(!r)return null;const n=r[0]*scale;return Number.isSafeInteger(n)&&n%r[1]===0?n/r[1]:null;};
const display=(n,scale=1)=>String(n/scale);
export function sequenceNext(t,values){const last=values.at(-1);if(t.op==='add')return last+t.step;if(t.op==='multiply')return last*t.step;if(t.op==='affine')return last*t.a+t.b;if(t.op==='position')return t.a*(values.length+1)+t.b;return NaN;}
export function classify(n,blocks){for(const b of blocks){if(b==='both'&&n%3===0&&n%5===0)return'both';if(b==='three'&&n%3===0)return'three';if(b==='five'&&n%5===0)return'five';if(b==='neither')return'neither';}return'unknown';}
export function runBlocks(t,blocks){
 if(t.mode==='classify'){if(blocks.length!==4)return null;return Array.from({length:30},(_,i)=>({n:i+1,group:classify(i+1,blocks)}));}
 if(t.mode==='loop'){if(blocks.length!==3||blocks[0]!=='repeat')return null;let n=1;const result=[n];for(let i=0;i<10;i++){for(const b of blocks.slice(1))n=b==='double'?n*2:b==='plusone'?n+1:n;result.push(n);}return result;}
 return null;
}
function start(t){const b={first:{},bad:false};switch(t.type){
 case'x-p34-repeat':return{...b,added:[]};
 case'x-p34-sequence':return{...b,values:[t.start]};
 case'x-p34-pair':return{...b,pairs:[[t.sx||0,t.sy||0]],plotted:[]};
 case'x-p34-ambiguity':return{...b,prediction:null,shown:[]};
 case'x-p34-grid':return{...b,selected:[]};
 case'x-p34-growth':return{...b,filled:[],turned:false};
 case'x-p34-relation':return{...b,selected:[]};
 case'x-p34-program':return{...b,values:['walk','double','add7'].includes(t.mode)?[t.start]:[],records:[],blocks:[],runs:[],done:false};
 }}
export const initial=t=>({board:start(t),history:[],value:'',second:'',prose:'',answers:Array(t.questions?.length||0).fill(''),issue:''});
const actionSet=new Set(['pick','undo','clear','next','plot','predict','show','cell','fill','turn','step','stop','branch','block','run']);
const eventOK=e=>e&&actionSet.has(e.a)&&text(e.i)&&text(e.v)&&text(e.w);
function apply(t,b,e){let issue='',i=Number(e.i);const fail=s=>{b.bad=true;issue=s;};
 if(t.type==='x-p34-repeat'){
  if(e.a==='pick'&&t.symbols.some(x=>x.id===e.i)&&b.added.length<t.need)b.added.push(e.i);
  if(e.a==='undo')b.added.pop();if(e.a==='clear')b.added=[];
 }
 if(t.type==='x-p34-sequence'){
  if(e.a==='next'&&b.values.length<t.length){const v=ticks(e.v,t.scale||1),expected=sequenceNext(t,b.values);b.first.next??=e.v;if(v!==expected)fail('再看起点和这一次的变化；可以改后重试。');else b.values.push(v);}
  if(e.a==='undo'&&b.values.length>1)b.values.pop();
 }
 if(t.type==='x-p34-pair'){
  if(e.a==='next'&&b.pairs.length<t.length){const x=ticks(e.v,1),y=ticks(e.w,1),k=b.pairs.length;b.first.pair??=[e.v,e.w];if(x!==(t.sx||0)+k*t.dx||y!==(t.sy||0)+k*t.dy)fail('两条规则从各自的起点开始，每次各走自己的步子。');else b.pairs.push([x,y]);}
  if(e.a==='plot'){const m=/^(\d+),(\d+)$/.exec(e.i);if(m){const pair=[(t.sx||0)+Number(m[1])*t.dx,(t.sy||0)+Number(m[2])*t.dy];b.first.plot??=pair;const k=b.plotted.findIndex(x=>same(x,pair));if(k>=0)b.plotted.splice(k,1);else if(b.pairs.some(x=>same(x,pair)))b.plotted.push(pair);else fail('先找到已经生成的一对数，再放到对应的横纵位置。');}}
 }
 if(t.type==='x-p34-ambiguity'){
  if(e.a==='predict'&&b.prediction===null&&e.v.trim())b.prediction=e.v;
  if(e.a==='show'&&['a','b'].includes(e.i)&&b.prediction!==null&&!b.shown.includes(e.i))b.shown.push(e.i);
 }
 if(t.type==='x-p34-grid'&&e.a==='cell'&&int(i,0,t.rows.length*t.cols.length-1)){const k=b.selected.indexOf(i);k<0?b.selected.push(i):b.selected.splice(k,1);b.selected.sort((a,c)=>a-c);}
 if(t.type==='x-p34-relation'&&e.a==='cell'&&int(i,0,t.cards.length-1)){const k=b.selected.indexOf(i);k<0?b.selected.push(i):b.selected.splice(k,1);b.selected.sort((a,c)=>a-c);}
 if(t.type==='x-p34-growth'){
  if(e.a==='fill'){const k=e.i===''?Array.from({length:t.target},(_,j)=>j).find(j=>!b.filled.includes(j)):i;if(int(k,0,t.target-1)&&!b.filled.includes(k))b.filled.push(k);b.filled.sort((a,c)=>a-c);}
  if(e.a==='turn')b.turned=true;
 }
 if(t.type==='x-p34-program'){
  if(e.a==='step'&&t.mode==='walk'&&!b.done){const n=b.values.at(-1),expected=n%2===0?'half':'plus';b.first.step??=e.i;if(e.i!==expected)fail(n%2===0?'现在是偶数，按规则把它减半。':'现在是奇数，按规则加1。');else{b.values.push(expected==='half'?n/2:n+1);if(b.values.at(-1)===1)b.done=true;}}
  if(e.a==='branch'&&['threshold','sort10'].includes(t.mode)&&!b.done){const n=t.inputs[b.records.length],expected=t.mode==='threshold'?(n>50?'yes':'no'):(n<10?'low':'high');b.first.branch??={n,choice:e.i};if(e.i!==expected)fail(t.mode==='threshold'?'大于50才走“是”；50本身不算大于。':'10应放在“10或更多”一边。');else{const out=t.mode==='threshold'?(expected==='yes'?n-10:n+10):expected;b.records.push({n,choice:expected,out});if(b.records.length===t.inputs.length)b.done=true;}}
  if(e.a==='step'&&['double','add7'].includes(t.mode)&&!b.done){const n=b.values.at(-1),allowed=t.mode==='double'?n<=100:n+7<80;if(!allowed)fail(t.mode==='double'?'已经超过100，应该停下。':'下一次会到80或以上，应在这之前停下。');else b.values.push(t.mode==='double'?n*2:n+7);}
  if(e.a==='stop'&&['double','add7'].includes(t.mode)&&!b.done){const n=b.values.at(-1),correct=t.mode==='double'?n>100:n+7>=80;b.first.stop??=n;if(correct)b.done=true;else fail('还没有到停止条件，看看下一步。');}
  if(e.a==='block'&&['classify','loop'].includes(t.mode)&&t.blocks.some(x=>x.id===e.i)&&!b.blocks.includes(e.i)){b.blocks.push(e.i);b.done=false;}
  if(e.a==='undo'&&['classify','loop'].includes(t.mode)){b.blocks.pop();b.done=false;}
  if(e.a==='clear'&&['classify','loop'].includes(t.mode)){b.blocks=[];b.done=false;}
  if(e.a==='run'&&['classify','loop'].includes(t.mode)){
   const out=runBlocks(t,b.blocks);b.first.blocks??=b.blocks.slice();if(out===null){b.done=false;fail('先把需要的步骤排好，重复应包住里面的动作。');}else{const ok=t.mode==='classify'?out.every(x=>x.group===(x.n%15===0?'both':x.n%3===0?'three':x.n%5===0?'five':'neither')):same(out,[1,3,7,15,31,63,127,255,511,1023,2047]);const result={blocks:b.blocks.slice(),output:out,correct:ok};if(b.runs.length<30)b.runs.push(result);b.done=ok;if(!ok)fail(t.mode==='classify'?'看看15被分到了哪里：同时符合两个条件时要先处理。':'看看每轮的次序：先乘2，再加1。');}
  }
 }
 return{board:b,issue};
}
export function act(t,m,action,data={}){const a=action.replace(/^p34-/,''),e={a,i:String(data.index??''),v:String(['next','predict'].includes(a)?m.value:''),w:String(a==='next'?m.second:'')};if(!eventOK(e)||m.history.length>=1500)return m;const r=apply(t,cp(m.board),e);m.board=r.board;m.issue=r.issue;m.history.push(e);return m;}
export function field(t,m,key){if(['value','second','prose'].includes(key))m[key]=String(m[key]??'');if(key.startsWith('answers.'))m.answers[Number(key.split('.')[1])]=String(m.answers[Number(key.split('.')[1])]??'');}
export function valid(t,m){try{if(!TYPES.has(t.type)||!m||!['value','second','prose','issue'].every(k=>text(m[k]))||!Array.isArray(m.answers)||m.answers.length!==(t.questions?.length||0)||!m.answers.every(text)||!Array.isArray(m.history)||m.history.length>1500||!m.history.every(eventOK))return false;let b=start(t);for(const e of m.history)b=apply(t,b,e).board;return same(b,m.board);}catch{return false;}}
const answerOK=(q,v)=>q.kind==='number'?Number.isFinite(number(v))&&Math.abs(number(v)-q.value)<1e-9:q.accepted?q.accepted.includes(String(v).trim()):String(v).trim()===String(q.value);
export function inspect(t,m){if(!valid(t,m))return{correct:false,feedback:'这份作品暂时读不出来。'};const b=m.board;let ok=false,hint='先用手上的规则做出变化，再看看自己的记录。';
 if(t.type==='x-p34-repeat'){if(t.mode==='own')ok=b.added.length===t.need&&new Set(b.added.slice(0,t.unitLength)).size>1&&b.added.every((x,i)=>x===b.added[i%t.unitLength]);else ok=b.added.length===t.need&&b.added.every((x,i)=>x===t.unit[(t.seed.length+i)%t.unit.length]);hint='找出反复出现的那一小段，再从它的下一处接下去。';}
 if(t.type==='x-p34-sequence'){ok=b.values.length===t.length;hint='从起点出发，检查每一步的变化方向与大小。';}
 if(t.type==='x-p34-pair'){ok=b.pairs.length===t.length&&(!t.plot||b.plotted.length===t.length);hint='同一位置的两项配成一对，再找横向与纵向的位置。';}
 if(t.type==='x-p34-ambiguity'){ok=b.prediction!==null&&b.shown.includes('a')&&b.shown.includes('b');hint='先留下猜想，再分别运行两条规则。';}
 if(t.type==='x-p34-grid'){ok=b.selected.length===t.rows.length*t.cols.length;hint='固定一种选择，把另一种逐个配完，再换到下一行。';}
 if(t.type==='x-p34-relation'){ok=same(b.selected,t.cards.map((c,i)=>c.equal?i:-1).filter(i=>i>=0));hint='比较每张卡表示的数；分数约简后名称可以改变。';}
 if(t.type==='x-p34-growth'){ok=b.filled.length===t.target;hint='看前三组怎样长，再把第四组的空位补上。';}
 if(t.type==='x-p34-program'){ok=b.done;hint='按当前的数检查条件，留意什么时候应该停止。';}
 ok=!!ok&&(t.questions||[]).every((q,i)=>answerOK(q,m.answers[i]));return{correct:ok,feedback:ok?'这次操作和记录对应上了。':hint,evidence:{kind:t.type,board:cp(b),history:cp(m.history),freeExplanationAssessed:false,generalProofAssessed:false,generalMasteryAssessed:false}};
}
export function solveSteps(t){const s=[],f=(field,value)=>s.push({field,value:String(value)}),a=(name,index)=>s.push({action:'p34-'+name,data:index===undefined?{}:{index}});
 if(t.type==='x-p34-repeat'){const picks=t.mode==='own'?Array.from({length:t.need},(_,i)=>t.symbols[i%t.unitLength].id):Array.from({length:t.need},(_,i)=>t.unit[(t.seed.length+i)%t.unit.length]);picks.forEach(x=>a('pick',x));}
 if(t.type==='x-p34-sequence'){let values=[t.start];while(values.length<t.length){let n=sequenceNext(t,values);f('value',display(n,t.scale||1));a('next');values.push(n);}}
 if(t.type==='x-p34-pair'){for(let i=1;i<t.length;i++){f('value',(t.sx||0)+i*t.dx);f('second',(t.sy||0)+i*t.dy);a('next');}if(t.plot)for(let i=0;i<t.length;i++)a('plot',`${i},${i}`);}
 if(t.type==='x-p34-ambiguity'){f('value',8);a('predict');a('show','a');a('show','b');}
 if(t.type==='x-p34-grid')for(let i=0;i<t.rows.length*t.cols.length;i++)a('cell',i);
 if(t.type==='x-p34-relation')t.cards.forEach((c,i)=>{if(c.equal)a('cell',i);});
 if(t.type==='x-p34-growth')for(let i=0;i<t.target;i++)a('fill');
 if(t.type==='x-p34-program'){
  if(t.mode==='walk'){let n=t.start;while(n!==1){const k=n%2===0?'half':'plus';a('step',k);n=k==='half'?n/2:n+1;}}
  if(t.mode==='threshold')t.inputs.forEach(n=>a('branch',n>50?'yes':'no'));
  if(t.mode==='sort10')t.inputs.forEach(n=>a('branch',n<10?'low':'high'));
  if(t.mode==='double'){let n=t.start;while(n<=100){a('step');n*=2;}a('stop');}
  if(t.mode==='add7'){let n=t.start;while(n+7<80){a('step');n+=7;}a('stop');}
  if(t.mode==='classify')for(const x of ['both','three','five','neither'])a('block',x);
  if(t.mode==='loop')for(const x of ['repeat','double','plusone'])a('block',x);
  if(['classify','loop'].includes(t.mode))a('run');
 }
 (t.questions||[]).forEach((q,i)=>f('answers.'+i,q.value));return s;
}
export function example(t){const m=initial(t);for(const s of solveSteps(t)){if(s.field){const[k,i]=s.field.split('.');if(i!==undefined)m[k][+i]=s.value;else m[k]=s.value;field(t,m,s.field);}else act(t,m,s.action,s.data);}return m;}
