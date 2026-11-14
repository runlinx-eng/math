// B07 records successful exchanges, not every button click. In particular an
// enabled exchange can hit a representation limit and leave no history entry.
// Replaying this log proves only its recorded exchanges. Numeric fields already
// contain Numbers; their original spelling and precision cannot be recovered.
import * as place from './phase5/b07-model.js';
import {matchesNativeEvidenceTask,sameEvidence as same,hasExactKeys as keys} from './evidence-contract.js';

const SOURCES=Object.freeze({
 tenexchange:{indices:[0,1],nodeId:'mt_r0VXbfAmsH'},
 rename:{indices:[0,1,2],nodeId:'mt_Bt-iORUzdO'},
 hundredexchange:{indices:[0,1],nodeId:'mt_8gy7uxRlF6'},
 problems1000:{indices:[0,2],nodeId:'mt_98c2qwEF7Q'},
 faces1000:{indices:[3],nodeId:'mt_F_zEAJ8VIo'},
 screen1000:{indices:[2],nodeId:'mt_HczwO1sr-y'}
});

export function pvbenchBinding(task,context={}){
 if(!context||typeof context!=='object'||Array.isArray(context))return null;
 const source=Object.hasOwn(SOURCES,context.sessionId)?SOURCES[context.sessionId]:null;
 if(!source||!source.indices.includes(context.index)||
    !matchesNativeEvidenceTask(task,context,{type:'x-pvbench',nodeId:source.nodeId}))return null;
 const question=task.packReport?'一共能装多少包十颗？这和十位上的数字有什么不同？每次换装，总量怎样保持？':
  task.saveCount?'把题目要求的装法留下来。每种装法里，百、十、一各表示多少？换装前后的总量怎样核对？':
  '合起或拆开时，拿走的单位和换来的单位各表示多少？装法变了，总量为什么保持？';
 return {nodeId:source.nodeId,question,method:null};
}

// The original order is [hundreds, tens, ones, thousands], not positional order.
const UNIT_NAMES=['hundreds','tens','ones','thousands'],WEIGHTS=[100,10,1,1000],LIMITS=[10,100,100,1];
const SWAPS=Object.freeze({up1:[2,1,10,1],down1:[1,2,1,10],up10:[1,0,10,1],
 down10:[0,1,1,10],up100:[0,3,10,1],down100:[3,0,1,10]});
const MODEL_KEYS=['u','history','saved','form','answer','parts','words','mark','touched','cell','packs','remainder','why'];
const TASK_KEYS=['type','n','prompt','start','fixed','exchanges','end','saveCount','why','expanded','packReport'];
const integer=(n,min=0,max=1000)=>Number.isSafeInteger(n)&&n>=min&&n<=max;
const total=u=>u.reduce((sum,n,i)=>sum+n*WEIGHTS[i],0);
const units=u=>Array.isArray(u)&&u.length===4&&u.every((n,i)=>integer(n,0,LIMITS[i]))&&integer(total(u));
function sequenceHas(list,required){let next=0;for(const value of list)if(value===required[next])next++;return next===required.length;}

// There is no shared timeline for saved[] and history[]. Check that an ordered
// interleaving exists; never report a selected prefix as an observed save time.
function compatibleSaves(states,saved,bounds={}){
 let previous=-1;
 for(let i=0;i<saved.length;i++){
  const [min,max]=bounds[i]||[0,states.length-1];
  let next=Math.max(previous+1,min);
  while(next<=max&&next<states.length&&!same(states[next],saved[i].u))next++;
  if(next>max||next>=states.length)return false;
  previous=next;
 }
 return true;
}

function savedGoal(task,model,states){
 if(task.saveCount===undefined)return model.saved.length===0?null:false;
 if(!integer(task.saveCount,1,20)||model.saved.length<task.saveCount||model.saved.length>20||
    model.saved.some(s=>!keys(s,['u','form'])||s.form!=='blocks'||!units(s.u)||total(s.u)!==task.n)||
    new Set(model.saved.map(s=>s.u.join(','))).size!==model.saved.length||
    !compatibleSaves(states,model.saved))return false;
 let goal;
 if(task.saveCount===1&&task.n===34&&same(task.start,[0,3,4,0])&&same(task.end,[0,2,14,0])){
  // rename:0 explicitly asks to save the changed representation, not the start.
  if(!model.saved.some(s=>same(s.u,task.end)))return false;
  goal='specified-end';
 }else if(task.saveCount===3&&task.n===52&&same(task.start,[0,5,2,0])&&task.end===undefined){
  goal='three-different';
 }else if(task.saveCount===2&&task.n===362&&same(task.start,[3,6,2,0])&&task.end===undefined){
  // problems1000:2 asks for the two representations before/after splitting one
  // ten. Additional real exchanges and saved forms may lie between them. Require
  // a compatible interleaving with that recorded split between the saved pair,
  // without asserting that the actual save clicks had those particular times.
  const after=[3,5,12,0];let found=false;
  for(let edge=0;edge<model.history.length&&!found;edge++){
   if(model.history[edge]!=='down1'||!same(states[edge],task.start)||!same(states[edge+1],after))continue;
   for(let a=0;a<model.saved.length&&!found;a++)for(let b=a+1;b<model.saved.length&&!found;b++){
    if(same(model.saved[a].u,task.start)&&same(model.saved[b].u,after)&&
       compatibleSaves(states,model.saved,{[a]:[0,edge],[b]:[edge+1,states.length-1]}))found=true;
   }
  }
  if(!found)return false;goal='before-after-one-ten';
 }else return false; // Other saving instructions need their own source review.
 return {goal,required:task.saveCount,count:model.saved.length,
  representations:model.saved.map(s=>({units:[...s.u],form:s.form})),
  compatibleWithRecordedPath:true,exactTimingKnown:false};
}

export function replayPVBenchEvidence(task,model){
 try{
  if(task?.type!=='x-pvbench'||task.fixed!==true||!integer(task.n,1)||
     !Object.keys(task).every(k=>TASK_KEYS.includes(k))||!units(task.start)||total(task.start)!==task.n||
     !keys(model,MODEL_KEYS)||!units(model.u)||total(model.u)!==task.n||model.form!=='blocks'||
     !Array.isArray(model.history)||!integer(model.history.length,1,200)||!Array.isArray(model.saved)||
     !Array.isArray(model.parts)||model.parts.length!==3||!same(model.words,[])||
     model.mark!==0||model.touched!==false||model.cell!==null)return null;
  for(const flag of ['expanded','packReport'])if(task[flag]!==undefined&&typeof task[flag]!=='boolean')return null;
  if(task.why!==undefined&&task.why!=='same'||model.why!==(task.why||'')||
     !integer(model.answer)||model.answer!==task.n)return null;
  if(task.exchanges!==undefined&&(!Array.isArray(task.exchanges)||!task.exchanges.length||
     task.exchanges.some(kind=>!Object.hasOwn(SWAPS,kind))))return null;
  if(task.saveCount===undefined&&(!task.exchanges||!task.end))return null;
  if(task.end!==undefined&&(!units(task.end)||total(task.end)!==task.n||!same(model.u,task.end)))return null;
  const expanded=task.expanded?[Math.floor(task.n/100)*100,Math.floor(task.n/10)%10*10,task.n%10]:null;
  if(!same(model.parts,expanded||[null,null,null])||
     (task.packReport?model.packs!==Math.floor(task.n/10)||model.remainder!==task.n%10:
      model.packs!==null||model.remainder!==null))return null;
  const current=[...task.start],states=[[...current]],swaps=[];
  for(const kind of model.history){
   if(typeof kind!=='string'||!Object.hasOwn(SWAPS,kind))return null;
   const [from,to,remove,add]=SWAPS[kind],before=[...current];
   if(current[from]<remove||remove*WEIGHTS[from]!==add*WEIGHTS[to])return null;
   current[from]-=remove;current[to]+=add;
   if(!units(current)||total(current)!==task.n)return null;
   states.push([...current]);
   swaps.push({kind,before,after:[...current],fromUnit:UNIT_NAMES[from],fromCount:remove,
    toUnit:UNIT_NAMES[to],toCount:add,quantity:remove*WEIGHTS[from]});
  }
  if(!same(current,model.u)||!sequenceHas(model.history,task.exchanges||[]))return null;
  const saved=savedGoal(task,model,states);if(saved===false)return null;
  // Keep original grading and state admissibility as additional gates, never as
  // the replay or as a source of inferred exchanges.
  if(!place.valid(task,model)||!place.inspect(task,model).correct)return null;
  return {total:task.n,unitOrder:[...UNIT_NAMES],unitValues:[...WEIGHTS],initial:[...task.start],final:[...current],
   swaps,swapCount:swaps.length,combined:swaps.filter(s=>s.kind.startsWith('up')).length,
   split:swaps.filter(s=>s.kind.startsWith('down')).length,saved,
   submitted:{answer:model.answer,expanded:expanded?[...model.parts]:null,
    packReport:task.packReport?{packs:model.packs,remainder:model.remainder}:null,why:task.why?model.why:null},
   historyScope:'successful-swaps-only',inputScope:'stored-numbers'};
 }catch{return null;}
}
