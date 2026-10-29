import {rational} from './b16-model.js';
export const TYPES=new Set(['x-t32-clock','x-t32-roman','x-t32-order','x-t32-compare','x-t32-parts','x-t32-calendar','x-t32-stopwatch','x-t32-steps','x-t32-units']);
const cp=x=>structuredClone(x),same=(a,b)=>JSON.stringify(a)===JSON.stringify(b),txt=x=>typeof x==='string'&&x.length<=1200,int=(x,a,b)=>Number.isInteger(x)&&x>=a&&x<=b,number=x=>{const r=rational(x);return r?r[0]/r[1]:NaN;},near=(x,y)=>Number.isFinite(number(x))&&Math.abs(number(x)-y)<1e-9;
export const isLeap=y=>y%4===0&&(y%100!==0||y%400===0);
export const daysInMonth=(y,m)=>[31,isLeap(y)?29:28,31,30,31,30,31,31,30,31,30,31][m-1];
export function dateSerial(s){const m=/^(\d{4})-(\d\d)-(\d\d)$/.exec(s);if(!m)return NaN;const y=+m[1],mo=+m[2],d=+m[3];if(!int(y,1600,9999)||!int(mo,1,12)||!int(d,1,daysInMonth(y,mo)))return NaN;return Math.floor(Date.UTC(y,mo-1,d)/86400000);}
export const weekday=s=>{const n=dateSerial(s);return Number.isFinite(n)?((n+4)%7+7)%7:NaN;};
export const clock24=n=>{n=((n%1440)+1440)%1440;return `${String(Math.floor(n/60)).padStart(2,'0')}:${String(n%60).padStart(2,'0')}`;};
export const clock12=n=>{n=((n%1440)+1440)%1440;const h=Math.floor(n/60)%12||12;return `${h}:${String(n%60).padStart(2,'0')}`;};
export function parseTime(s,kind){const m=/^\s*(\d{1,2}):(\d{2})\s*$/.exec(s);if(!m)return null;const h=+m[1],minute=+m[2];if(!int(minute,0,59)||!(kind==='24'?int(h,0,23):int(h,1,12)))return null;return (kind==='24'?h:h%12)*60+minute;}
const keys=['hour','minute','jump','prose'];
function initialBoard(t){const b={first:{},bad:false};switch(t.type){
 case'x-t32-clock':{const n=t.mode==='set'?t.initial:t.value;return{...b,hour:Math.floor(n/60)%12,minute:n%60,changed:false};}
 case'x-t32-roman':return{...b,pick:null,placed:Array(12).fill(null)};
 case'x-t32-order':return{...b,order:[]};
 case'x-t32-compare':return{...b,guess:null,revealed:false,choice:null};
 case'x-t32-parts':return{...b,selected:[]};
 case'x-t32-calendar':return{...b,page:0,selected:[]};
 case'x-t32-stopwatch':return{...b,running:false,elapsed:0,stopped:false};
 case'x-t32-steps':return{...b,moves:[]};
 case'x-t32-units':return{...b,selected:[]};
}}
export const initial=t=>{const b=initialBoard(t);return{hour:String(b.hour||12),minute:String(b.minute||0),jump:'',prose:'',answers:Array(t.questions?.length||0).fill(''),board:b,history:[],issue:''};};
const actions=new Set(['hour','minute','pick','place','order','clear','guess','reveal','choice','part','day','page','start','tick','stop','move','undo','unit']);
const eventOK=e=>e&&actions.has(e.a)&&txt(e.i)&&txt(e.v);
export const compareAnswer=t=>{const a=t.events[0],b=t.events[1],x=t.kind==='longer'?a.end-a.start:t.kind==='earlier'?a.start:a.end,y=t.kind==='longer'?b.end-b.start:t.kind==='earlier'?b.start:b.end;return x===y?'equal':(t.kind==='longer'?x>y:x<y)?'left':'right';};
function apply(t,b,e){let issue='';const i=Number(e.i),v=number(e.v),bad=s=>{b.bad=true;issue=s;};
 if(t.type==='x-t32-clock'&&t.mode==='set'){
  if(e.a==='hour'&&int(i,1,12)){b.hour=i%12;b.changed=true;b.first.hour??=i;}
  if(e.a==='minute'&&int(i,0,59)){b.minute=i;b.changed=true;b.first.minute??=i;}
 }
 if(t.type==='x-t32-roman'){
  if(e.a==='pick'&&int(i,0,11))b.pick=i;
  if(e.a==='place'&&int(i,0,11)&&b.pick!==null){b.first.place??={numeral:b.pick,position:i};b.placed=b.placed.map(x=>x===b.pick?null:x);b.placed[i]=b.pick;if(b.pick!==i)b.bad=true;b.pick=null;}
  if(e.a==='clear'){b.placed=Array(12).fill(null);b.pick=null;}
 }
 if(t.type==='x-t32-order'){
  if(e.a==='order'&&int(i,0,t.items.length-1)&&!b.order.includes(i)){b.order.push(i);if(b.order.length===t.items.length){b.first.order??=b.order.slice();if(!b.order.every((n,j)=>!j||t.items[b.order[j-1]].value<=t.items[n].value))b.bad=true;}}
  if(e.a==='clear')b.order=[];
 }
 if(t.type==='x-t32-compare'){
  if(e.a==='guess'&&['left','right','equal'].includes(e.i)&&b.guess===null){b.guess=e.i;b.first.guess=e.i;}
  if(e.a==='reveal'&&b.guess!==null)b.revealed=true;
  if(e.a==='choice'&&b.revealed&&['left','right','equal'].includes(e.i)){b.first.choice??=e.i;b.choice=e.i;if(e.i!==compareAnswer(t))b.bad=true;}
 }
 if(t.type==='x-t32-parts'&&e.a==='part'&&int(i,0,t.parts-1)){const k=b.selected.indexOf(i);if(k<0)b.selected.push(i);else b.selected.splice(k,1);b.selected.sort((a,c)=>a-c);}
 if(t.type==='x-t32-calendar'){
  if(e.a==='page'&&int(i,0,t.months.length-1))b.page=i;
  if(e.a==='day'&&Number.isFinite(dateSerial(e.i))&&e.i.startsWith(`${t.months[b.page][0]}-${String(t.months[b.page][1]).padStart(2,'0')}`)){const k=b.selected.indexOf(e.i);if(k>=0)b.selected.splice(k,1);else if(b.selected.length<t.dates.length)b.selected.push(e.i);}
 }
 if(t.type==='x-t32-stopwatch'){
  if(e.a==='start'&&!b.stopped)b.running=true;
  if(e.a==='tick'&&b.running&&int(i,1,60)){if(b.elapsed+i>t.duration)bad('这一步会超过活动结束；换小一点的步子。');else b.elapsed+=i;}
  if(e.a==='stop'&&b.running){b.first.stop??=b.elapsed;b.running=false;if(b.elapsed===t.duration)b.stopped=true;else bad('模拟活动还没结束，可以继续计时。');}
 }
 if(t.type==='x-t32-steps'){
  if(e.a==='move'){b.first.jump??=e.v;const remaining=t.duration-b.moves.reduce((a,c)=>a+c,0);if(!int(v,1,remaining))bad('每一步要大于 0，不能越过这次的终点。');else b.moves.push(v);}
  if(e.a==='undo')b.moves.pop();if(e.a==='clear')b.moves=[];
 }
 if(t.type==='x-t32-units'&&e.a==='unit'&&int(i,0,t.parts.length-1)){const k=b.selected.indexOf(i);if(k<0)b.selected.push(i);else b.selected.splice(k,1);b.selected.sort((a,c)=>a-c);}
 return{board:b,issue};
}
export function act(t,m,action,data={}){const a=action.replace(/^t32-/,''),e={a,i:String(data.index??''),v:String(a==='move'?m.jump:'')};if(!eventOK(e)||m.history.length>=1200)return m;const r=apply(t,cp(m.board),e);m.board=r.board;m.issue=r.issue;m.history.push(e);if(t.type==='x-t32-clock'&&t.mode==='set'){m.hour=String(m.board.hour||12);m.minute=String(m.board.minute);}return m;}
export function field(t,m,key){if(keys.includes(key))m[key]=String(m[key]??'');if(key.startsWith('answers.'))m.answers[Number(key.split('.')[1])]=String(m.answers[Number(key.split('.')[1])]??'');if(t.type==='x-t32-clock'&&t.mode==='set'&&key==='hour')act(t,m,'t32-hour',{index:m.hour});if(t.type==='x-t32-clock'&&t.mode==='set'&&key==='minute')act(t,m,'t32-minute',{index:m.minute});}
export function valid(t,m){try{if(!TYPES.has(t.type)||!m||!keys.every(k=>txt(m[k]))||!Array.isArray(m.answers)||m.answers.length!==(t.questions?.length||0)||!m.answers.every(txt)||!txt(m.issue)||!Array.isArray(m.history)||m.history.length>1200||!m.history.every(eventOK))return false;let b=initialBoard(t);for(const e of m.history)b=apply(t,b,e).board;return same(b,m.board);}catch{return false;}}
function answerOK(q,v){if(q.kind==='number')return near(v,q.value);if(q.kind==='time12'||q.kind==='time24'){const got=parseTime(v,q.kind==='time24'?'24':'12');return got!==null&&got===(q.kind==='time24'?q.value%1440:q.value%720);}return String(v).trim()===String(q.value);}
export function inspect(t,m){if(!valid(t,m))return{correct:false,feedback:'这份作品暂时读不出来。'};const b=m.board;let ok=false,hint='先做出图上的变化，再对照记录。';
 if(t.type==='x-t32-clock'){ok=t.mode==='set'?b.changed&&b.hour*60+b.minute===t.value%720:true;hint=t.mode==='set'?'调短针指向经过的小时，长针指向分钟；短针会跟着长针慢慢移动。':'长针看分钟，短针看刚经过的小时；数字时刻用冒号分开。';}
 if(t.type==='x-t32-roman'){ok=b.placed.every((v,i)=>v===i);hint='从最上方的 XII 开始，顺时针依次对应 1 到 11；IV 也可写作 IIII。';}
 if(t.type==='x-t32-order'){ok=b.order.length===t.items.length&&b.order.every((n,j)=>!j||t.items[b.order[j-1]].value<=t.items[n].value);hint=t.hint||'按题目要求从先到后或从短到长排列。';}
 if(t.type==='x-t32-compare'){ok=b.guess!==null&&b.revealed&&b.choice===compareAnswer(t);hint='先比较起点和终点；结束较晚不一定花的时间更长。';}
 if(t.type==='x-t32-parts'){ok=b.selected.length===t.take&&(!t.requiredParts||same(b.selected,t.requiredParts));hint=t.requiredParts?'从左到右看经过的时间；前半场是最左边的一份。':'先把同一整段平均分，再选出需要的份数。';}
 if(t.type==='x-t32-calendar'){ok=same([...b.selected].sort(),[...t.dates].sort());hint='先找到给定日期。算间隔时，从起点向后走，起始日不额外算一天。';}
 if(t.type==='x-t32-stopwatch'){ok=b.stopped&&b.elapsed===t.duration;hint='先开始计时，活动进行时让表一起走，活动结束再停止。';}
 if(t.type==='x-t32-steps'){ok=b.moves.length>0&&b.moves.reduce((a,c)=>a+c,0)===t.duration;hint='从起点往前走到终点；每满 60 分钟是 1 小时。';}
 if(t.type==='x-t32-units'){ok=b.selected.length===t.parts.length;hint='把每一份都放进来；同一量换成小单位要按单位大小重新计数。';}
 ok=!!ok&&(t.questions||[]).every((q,i)=>answerOK(q,m.answers[i]));return{correct:ok,feedback:ok?'这次操作和记录对应上了。':hint,evidence:{kind:t.type,board:cp(b),history:cp(m.history),freeExplanationAssessed:false,physicalMeasurementAssessed:false,generalMasteryAssessed:false}};
}
export function solveSteps(t){const s=[],f=(field,value)=>s.push({field,value:String(value)}),a=(name,index)=>s.push({action:'t32-'+name,data:index===undefined?{}:{index}});
 if(t.type==='x-t32-clock'&&t.mode==='set'){f('hour',Math.floor(t.value/60)%12||12);f('minute',t.value%60);}
 if(t.type==='x-t32-roman')for(let i=0;i<12;i++){a('pick',i);a('place',i);}
 if(t.type==='x-t32-order')t.items.map((x,i)=>[x.value,i]).sort((a,b)=>a[0]-b[0]).forEach(x=>a('order',x[1]));
 if(t.type==='x-t32-compare'){a('guess',compareAnswer(t));a('reveal');a('choice',compareAnswer(t));}
 if(t.type==='x-t32-parts')for(const i of t.requiredParts||Array.from({length:t.take},(_,i)=>i))a('part',i);
 if(t.type==='x-t32-calendar'){for(const date of t.dates){const page=t.months.findIndex(([y,mo])=>date.startsWith(`${y}-${String(mo).padStart(2,'0')}`));if(t.months.length>1)a('page',page);a('day',date);}}
 if(t.type==='x-t32-stopwatch'){a('start');let left=t.duration;while(left>0){const n=left>=30?30:10;a('tick',n);left-=n;}a('stop');}
 if(t.type==='x-t32-steps'){const first=Math.min(t.duration,t.unit==='秒'?t.duration:60-t.start%60);f('jump',first);a('move');if(t.duration>first){f('jump',t.duration-first);a('move');}}
 if(t.type==='x-t32-units')t.parts.forEach((_,i)=>a('unit',i));
 (t.questions||[]).forEach((q,i)=>f('answers.'+i,q.kind==='time12'?clock12(q.value):q.kind==='time24'?clock24(q.value):q.value));return s;
}
export function example(t){const m=initial(t);for(const s of solveSteps(t)){if(s.field){const[k,i]=s.field.split('.');if(i!==undefined)m[k][+i]=s.value;else m[k]=s.value;field(t,m,s.field);}else act(t,m,s.action,s.data);}return m;}
