// B32: source-bound constructions, not final clock readings or tool-made unit
// decompositions. Original tasks, controls, grading and v2 records stay intact.
import * as time from './phase5/b32-model.js';
import {matchesNativeEvidenceTask,sameEvidence as same,hasExactKeys as keys} from './evidence-contract.js';

const SOURCES=Object.freeze({
 eventorder:{nodeId:'mt_-vvVxpOHG2',tasks:{1:'order',2:'order'}},
 durationunit:{nodeId:'mt__N55B7u7HD',tasks:{0:'stopwatch',1:'stopwatch'}},
 durationorder:{nodeId:'mt_6XCURuNwPw',tasks:{0:'order',2:'steps'}},
 durationwork:{nodeId:'mt_4emC463IyW',tasks:{0:'steps',2:'steps'}},
 fractiontime:{nodeId:'mt_Jz9UuT8BXW',tasks:{0:'parts',1:'parts',2:'parts',3:'parts'}},
 elapsedtime:{nodeId:'mt_IL86kadLSS',tasks:{0:'steps',1:'steps',2:'steps'}},
 romanclock:{nodeId:'mt_5J2quSTspi',tasks:{1:'roman'}},
 minuteclock:{nodeId:'mt_UNzojLkNdm',tasks:{1:'stopwatch'}},
 quarterclock:{nodeId:'mt_MgsDabdnr1',tasks:{2:'parts'}},
 weekmonth:{nodeId:'mt_bj1YCgNWUx',tasks:{0:'order',1:'order'}}
});
const QUESTIONS={
 order:'把这些项目放在同一个先后参照里，怎样确认相邻两个的顺序？',
 parts:'选中的份属于哪个整体？如果整个活动变长，同样的一份会怎样变化？',
 roman:'数字的写法和位置怎样一一对应？摆错后怎样移动，才不会重用同一个数字？',
 stopwatch:'每次前进的秒数怎样接起来？暂时停下与活动结束有什么区别？',
 steps:'自己选几段向前走。哪些段保留下来？怎样核对它们合起来走过的时间？'
};
export function timeBinding(task,context={}){
 if(!context||typeof context!=='object'||Array.isArray(context)||
    typeof context.sessionId!=='string'||!Number.isInteger(context.index)||context.index<0)return null;
 const source=Object.hasOwn(SOURCES,context.sessionId)?SOURCES[context.sessionId]:null;
 const kind=source&&Object.hasOwn(source.tasks,context.index)?source.tasks[context.index]:null;
 if(!kind||!matchesNativeEvidenceTask(task,context,{type:'x-t32-'+kind,nodeId:source.nodeId}))return null;
 return {nodeId:source.nodeId,kind,question:QUESTIONS[kind],method:null};
}

const text=x=>typeof x==='string'&&x.length<=1200;
const integer=(x,min=0,max=1000000)=>Number.isSafeInteger(x)&&x>=min&&x<=max;
const cp=x=>structuredClone(x);
const labels=['XII','I','II','III','IV','V','VI','VII','VIII','IX','X','XI'];
const gcd=(a,b)=>{a=a<0n?-a:a;while(b){const r=a%b;a=b;b=r;}return a;};
const fraction=(n,d=1n)=>{const g=gcd(n,d);return {n:n/g,d:d/g};};
const shown=({n,d})=>d===1n?String(n):`${n}/${d}`;
const equal=(a,b)=>!!a&&a.n*b.d===b.n*a.d;
// Independently parse the original bounded rational spellings. An invalid
// request is replayed as a failure, never erased or promoted to a movement.
function rational(raw){
 if(!text(raw))return null;
 const s=raw.trim().replace(/[−–]/g,'-');let n,d;
 if(/^-?\d+\s+\d+\/\d+$/.test(s)){
  // The historical split recognizes spaces and slashes. A tab embedded inside
  // a numeric token is rejected; whitespace at a token edge remains valid.
  const tokens=s.split(/[ /]+/).map(x=>x.trim());
  if(tokens.length!==3||!tokens.every((x,i)=>(i?/^\d+$/:/^-?\d+$/).test(x)))return null;
  const [whole,part,den]=tokens.map(BigInt);
  if(den<1n||part>=den)return null;
  n=(whole<0n?-whole:whole)*den+part;if(s[0]==='-')n=-n;d=den;
 }else if(/^-?\d+\/\d+$/.test(s)){
  [n,d]=s.split('/').map(BigInt);
 }else if(/^[+-]?\d+(?:\.\d+)?$/.test(s)){
  const digits=s.split('.')[1]?.length||0;
  if(digits>8)return null;
  n=BigInt(s.replace('.',''));d=10n**BigInt(digits);
 }else return null;
 if(n< -1000000000000n||n>1000000000000n||d<1n||d>100000000n)return null;
 return fraction(n,d);
}
const exactIndex=(raw,max)=>typeof raw==='string'&&/^(?:0|[1-9]\d*)$/.test(raw)&&integer(Number(raw),0,max)?Number(raw):null;
const clock=n=>{const v=((n%1440n)+1440n)%1440n;return `${String(v/60n).padStart(2,'0')}:${String(v%60n).padStart(2,'0')}`;};
function roman(s){
 const value={I:1n,V:5n,X:10n},parts=[...s].map(c=>value[c]);
 if(parts.some(v=>v===undefined))return null;
 return parts.reduce((sum,v,i)=>sum+(i+1<parts.length&&v<parts[i+1]?-v:v),0n);
}
function numberQuestion(q,wanted){
 return keys(q,['label','value','kind'])&&text(q.label)&&q.kind==='number'&&
  integer(q.value,-1000000)&&equal(fraction(BigInt(q.value)),wanted);
}
function orderValues(task){
 let mode=null;const values=[],weekdays=[];
 for(const item of task.items){
  if(!keys(item,['label','value'])||!text(item.label)||!integer(item.value,-1000000))return null;
  let kind,value,original;const s=item.label;
  const relative=/^周([一二三四五六日])：(昨天|今天|明天)$/.exec(s);
  const tod=/^(上午|下午|晚上) (\d{1,2}):00$/.exec(s);
  const duration=/^.+?(\d+)分钟$/.exec(s),week=/^周([一二三四五六日])$/.exec(s),month=/^(\d{1,2})月$/.exec(s);
  if(relative){kind='relative-day';original={昨天:-1,今天:0,明天:1}[relative[2]];value=BigInt(original);weekdays.push(['一二三四五六日'.indexOf(relative[1]),original]);}
  else if(tod){const hour=Number(tod[2]);if(!integer(hour,1,11))return null;kind='time-of-day';original=hour+(tod[1]==='上午'?0:12);value=BigInt(original)*60n;}
  else if(duration){kind='duration';original=Number(duration[1]);if(!integer(original,1))return null;value=BigInt(original);}
  else if(week){kind='weekday';original='一二三四五六日'.indexOf(week[1])+1;value=BigInt(original);}
  else if(month){kind='month';original=Number(month[1]);if(!integer(original,1,12))return null;value=BigInt(original);}
  else return null; // Ordinary activity names and hidden ordinal values do not suffice.
  if(mode!==null&&mode!==kind||item.value!==original)return null;
  mode=kind;values.push(value);
 }
 if(mode==='relative-day'){
  const today=weekdays.find(([,offset])=>offset===0);
  if(!today||weekdays.some(([day,offset])=>(today[0]+offset+7)%7!==day))return null;
 }
 return {mode,values};
}
function describe(task){
 if(!task||typeof task!=='object'||Array.isArray(task)||!text(task.prompt)||!Array.isArray(task.questions))return null;
 const kind=task.type?.replace('x-t32-',''),base=['type','prompt','questions'];
 let expected=[],math={kind};
 if(kind==='roman'){
  if(!keys(task,base)||task.questions.length!==1||!numberQuestion(task.questions[0],fraction(roman('IIII'))))return null;
  expected=[{kind:'number',value:fraction(roman('IIII'))}];
 }else if(kind==='order'){
  if(!keys(task,[...base,'items'])||!Array.isArray(task.items)||task.items.length<3||task.items.length>12||
     new Set(task.items.map(x=>x?.label)).size!==task.items.length)return null;
  const order=orderValues(task);if(!order)return null;math={...math,...order};
  if(order.mode==='relative-day'){
   const q=task.questions[0];
   if(task.questions.length!==1||!keys(q,['label','value','kind','options'])||!text(q.label)||q.kind!=='choice'||q.value!=='today'||
      !same(q.options,[['today','新的今天'],['yesterday','新的昨天']]))return null;
   expected=[{kind:'choice',value:'today'}];
  }else if(task.questions.length)return null;
 }else if(kind==='parts'){
  const optional=['requiredParts','shape'].filter(k=>Object.hasOwn(task,k));
  if(!keys(task,[...base,'total','parts','take','unit',...optional])||!integer(task.total,1)||!integer(task.parts,2,100)||
     !integer(task.take,1,task.parts)||task.unit!=='分钟'||task.shape!==undefined&&task.shape!=='clock'||task.questions.length!==1)return null;
  if(task.requiredParts!==undefined&&(!Array.isArray(task.requiredParts)||task.requiredParts.length!==task.take||
     task.requiredParts.some((v,i)=>!integer(v,0,task.parts-1)||i>0&&v<=task.requiredParts[i-1])))return null;
  const unit=fraction(BigInt(task.total),BigInt(task.parts)),amount=fraction(BigInt(task.total)*BigInt(task.take),BigInt(task.parts));
  if(!numberQuestion(task.questions[0],amount))return null;
  math={...math,unit,amount};expected=[{kind:'number',value:amount}];
 }else if(kind==='stopwatch'){
  if(!keys(task,[...base,'duration'])||!integer(task.duration,1)||task.questions.length!==1)return null;
  const q=task.questions[0],minutes=['60秒是几分钟','大约多少分钟'].includes(q?.label);
  if(!minutes&&q?.label!=='模拟活动持续多少秒')return null;
  const amount=fraction(BigInt(task.duration),minutes?60n:1n);
  if(!numberQuestion(q,amount))return null;
  math={...math,answerUnit:minutes?'分钟':'秒',amount};expected=[{kind:'number',value:amount}];
 }else if(kind==='steps'){
  if(!keys(task,[...base,'start','duration','unit'])||!integer(task.start,0,1439)||!integer(task.duration,1)||task.unit!=='分钟'||task.questions.length!==1)return null;
  const q=task.questions[0],end=BigInt(task.start)+BigInt(task.duration);
  if(q?.kind==='time24'){
   if(!keys(q,['label','value','kind'])||q.label!=='结束时刻'||q.value!==Number(end%1440n))return null;
   expected=[{kind:'time24',value:end%1440n}];
  }else{
   if(!['共经过多少分钟','一共多少分钟','经过多少分钟'].includes(q?.label)||!numberQuestion(q,fraction(BigInt(task.duration))))return null;
   expected=[{kind:'number',value:fraction(BigInt(task.duration))}];
  }
  math={...math,end};
 }else return null;
 return {...math,expected};
}
function submitted(expected,answers){
 return expected.every((q,i)=>{
  const value=answers[i];
  if(q.kind==='number')return equal(rational(value),q.value);
  if(q.kind==='choice')return value===q.value;
  const match=/^\s*(\d{1,2}):(\d{2})\s*$/.exec(value);
  return !!match&&integer(Number(match[1]),0,23)&&integer(Number(match[2]),0,59)&&BigInt(match[1])*60n+BigInt(match[2])===q.value;
 });
}

export function replayTimeEvidence(task,model){
 try{
  const math=describe(task);if(!math)return null;const {kind}=math;
  if(!keys(model,['hour','minute','jump','prose','answers','board','history','issue'])||
     !['hour','minute','jump','prose','issue'].every(k=>text(model[k]))||model.hour!=='12'||model.minute!=='0'||
     kind!=='steps'&&model.jump!==''||!Array.isArray(model.answers)||model.answers.length!==math.expected.length||!model.answers.every(text)||
     !Array.isArray(model.history)||model.history.length<1||model.history.length>1200)return null;
  const board={first:{},bad:false,...(kind==='roman'?{pick:null,placed:Array(12).fill(null)}:
   kind==='order'?{order:[]}:kind==='parts'?{selected:[]}:kind==='steps'?{moves:[]}:{running:false,elapsed:0,stopped:false})};
  const history={events:[],failedRequests:[],noops:[],clears:[],undone:[],placements:[],acceptedTicks:[],wrongOrders:[]};
  let issue='',lastJump=null;
  for(const [index,event]of model.history.entries()){
   if(!keys(event,['a','i','v'])||![event.a,event.i,event.v].every(text))return null;
   const {a,i,v}=event,before=cp(board);let category='',failure=null;
   issue='';
   const fail=message=>{board.bad=true;issue=message;failure=message;};
   if(kind==='roman'){
    if(!['pick','place','clear'].includes(a)||v!==''||a==='clear'&&i!=='')return null;
    const at=a==='clear'?null:exactIndex(i,11);if(a!=='clear'&&at===null)return null;
    if(a==='pick'){board.pick=at;category='selection';}
    else if(a==='clear'){history.clears.push({index,removed:cp(board.placed)});board.placed=Array(12).fill(null);board.pick=null;category='clear';}
    else if(board.pick!==null){
     const numeral=board.pick,from=board.placed.indexOf(numeral),displaced=board.placed[at];
     board.first.place??={numeral,position:at};
     board.placed=board.placed.map(n=>n===numeral?null:n);board.placed[at]=numeral;
     if(numeral!==at)board.bad=true;board.pick=null;category='placement';
     history.placements.push({index,numeral,label:labels[numeral],from,position:at,displaced,correct:numeral===at});
    }else category='unselected-place';
   }else if(kind==='order'){
    if(!['order','clear'].includes(a)||v!==''||a==='clear'&&i!=='')return null;
    const at=a==='clear'?null:exactIndex(i,task.items.length-1);if(a!=='clear'&&at===null)return null;
    if(a==='clear'){history.clears.push({index,removed:cp(board.order)});board.order=[];category='clear';}
    else{
     category='order';
     if(!board.order.includes(at)){
      board.order.push(at);
      if(board.order.length===task.items.length){
       board.first.order??=cp(board.order);
       if(!board.order.every((n,j)=>!j||math.values[board.order[j-1]]<=math.values[n])){board.bad=true;history.wrongOrders.push({index,order:cp(board.order)});}
      }
     }
    }
   }else if(kind==='parts'){
    const at=exactIndex(i,task.parts-1);if(a!=='part'||v!==''||at===null)return null;
    const existing=board.selected.indexOf(at);
    if(existing<0)board.selected.push(at);else board.selected.splice(existing,1);
    board.selected.sort((x,y)=>x-y);category=existing<0?'select-part':'remove-part';
   }else if(kind==='stopwatch'){
    if(!['start','tick','stop'].includes(a)||v!==''||(a==='tick'?!['10','30'].includes(i):i!==''))return null;
    if(a==='start'){if(!board.stopped)board.running=true;category='start';}
    else if(a==='tick'){
     category='tick';const step=BigInt(i);
     if(board.running){
      if(BigInt(board.elapsed)+step>BigInt(task.duration))fail('这一步会超过活动结束；换小一点的步子。');
      else{const from=board.elapsed;board.elapsed=Number(BigInt(board.elapsed)+step);history.acceptedTicks.push({index,requested:Number(step),advanced:Number(step),from,to:board.elapsed});}
     }
    }else{
     category='stop';
     if(board.running){board.first.stop??=board.elapsed;board.running=false;if(board.elapsed===task.duration)board.stopped=true;else fail('模拟活动还没结束，可以继续计时。');}
    }
   }else{
    if(!['move','undo','clear'].includes(a)||i!==''||a!=='move'&&v!=='')return null;
    if(a==='move'){
     category='move';lastJump=v;board.first.jump??=v;
     const parsed=rational(v),remaining=BigInt(task.duration)-board.moves.reduce((sum,n)=>sum+BigInt(n),0n);
     if(!parsed||parsed.d!==1n||parsed.n<1n||parsed.n>remaining)fail('每一步要大于 0，不能越过这次的终点。');
     else board.moves.push(Number(parsed.n));
    }else if(a==='undo'){category='undo';if(board.moves.length)history.undone.push({index,removed:board.moves.at(-1)});board.moves.pop();}
    else{category='clear';history.clears.push({index,removed:cp(board.moves)});board.moves=[];}
   }
   const noEffect=same(before,board),saved={index,action:a,input:{i,v},category,before,after:cp(board),issue,failed:failure!==null,noEffect};
   history.events.push(saved);if(failure!==null)history.failedRequests.push(saved);if(failure===null&&noEffect)history.noops.push(saved);
  }
  if(!same(board,model.board)||issue!==model.issue||!submitted(math.expected,model.answers))return null;
  let construction;
  if(kind==='roman'){
   if(!board.placed.every((n,i)=>n===i))return null;
   construction={positions:board.placed.map((n,i)=>({position:i,label:labels[n],value:Number(roman(labels[n]))})),four:Number(roman('IIII'))};
  }else if(kind==='order'){
   if(board.order.length!==task.items.length||!board.order.every((n,j)=>!j||math.values[board.order[j-1]]<=math.values[n]))return null;
   construction={reference:math.mode,identities:cp(board.order),labels:board.order.map(i=>task.items[i].label),values:board.order.map(i=>String(math.values[i])),unit:['time-of-day','duration'].includes(math.mode)?'分钟':math.mode==='relative-day'?'天':'次序'};
  }else if(kind==='parts'){
   if(board.selected.length!==task.take||task.requiredParts&&!same(board.selected,task.requiredParts))return null;
   construction={whole:task.total,equalParts:task.parts,identities:cp(board.selected),count:board.selected.length,unitPart:shown(math.unit),amount:shown(math.amount),fraction:shown(fraction(BigInt(board.selected.length),BigInt(task.parts))),unit:task.unit,partitionByTool:true};
  }else if(kind==='stopwatch'){
   if(!board.stopped||board.running||board.elapsed!==task.duration||history.acceptedTicks.reduce((sum,t)=>sum+BigInt(t.advanced),0n)!==BigInt(task.duration))return null;
   construction={elapsed:board.elapsed,ticks:history.acceptedTicks.map(t=>t.advanced),minutes:shown(fraction(BigInt(board.elapsed),60n)),firstStop:board.first.stop,simulated:true};
  }else{
   // A lone final duration and a tool-generated endpoint do not establish a
   // chosen decomposition. This gate changes evidence only, never grading.
   if(board.moves.length<2||board.moves.reduce((sum,n)=>sum+BigInt(n),0n)!==BigInt(task.duration))return null;
   let position=BigInt(task.start);const segments=board.moves.map(step=>{const from=position;position+=BigInt(step);return {from:Number(from),step,to:Number(position),fromClock:clock(from),toClock:clock(position)};});
   construction={segments,start:task.start,end:Number(math.end),duration:task.duration,startClock:clock(BigInt(task.start)),endClock:clock(math.end),coordinatesByTool:true,answerRole:math.expected[0].kind==='time24'?'end-time':'elapsed-minutes'};
  }
  if(!time.valid(task,model)||!time.inspect(task,model).correct)return null;
  return {kind,construction,history,first:cp(board.first),bad:board.bad,issue,
   // The visible jump field can be edited without pressing move. It belongs
   // to the complete checked snapshot but never adds an unrecorded segment.
   jumpInput:kind==='steps'?{current:model.jump,lastRequested:lastJump,pending:model.jump!==lastJump}:null,
   answers:math.expected.map((q,i)=>({raw:model.answers[i],kind:q.kind,expected:q.kind==='number'?shown(q.value):q.kind==='time24'?clock(q.value):q.value}))};
 }catch{return null;}
}
