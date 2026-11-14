// Replay the actual identity of every grouped object. A correct division answer
// alone does not show how the learner distributed or constructed the groups.
import * as groups from './phase5/b13-model.js';
import {isEvidenceContext,matchesNativeEvidenceTask,hasExactKeys as keys,sameEvidence as same} from './evidence-contract.js';

const SOURCES=Object.freeze({
 equalgroups:{indices:[0,1],nodeId:'mt_PZ909yPrEC'},
 sharegroups:{indices:[0,1,2,3],nodeId:'mt_LpSuPgL31x'},
 screenshare:{indices:[0,1,2],nodeId:'mt_1GDEHyEZYH'},
 bagstories:{indices:[0,1],nodeId:'mt_wh3UqnWsa7'},
 groupsproblems:{indices:[0,1],nodeId:'mt_qUjW0N1cYO'},
 divisionmeaning:{indices:[0,1,2],nodeId:'mt_iNdrM2-oJf'},
 rowsums:{indices:[1],nodeId:'mt_B1zj1RwQ3a'},
 mulsymbols:{indices:[1],nodeId:'mt_zOWwLxa77y'},
 productmeaning:{indices:[0,2],nodeId:'mt_gtTl3R5buH'},
 evenhalves:{indices:[1],nodeId:'mt_0u4KLbvBa1'},
 mentalproducts:{indices:[1,2,3],nodeId:'mt_pjfmCMMPjO'},
 mixedfacts:{indices:[2],nodeId:'mt_WX30dzi4dt'},
 groupstories:{indices:[0,1,2],nodeId:'mt_Zdv-b-iW5K'},
 structure34:{indices:[2],nodeId:'mt_FAXjFkgG6X'}
});

export function groupsBinding(task,context={}){
 if(!isEvidenceContext(context))return null;
 const source=Object.hasOwn(SOURCES,context.sessionId)?SOURCES[context.sessionId]:null;
 if(!source||!source.indices.includes(context.index)||
    !matchesNativeEvidenceTask(task,context,{type:'x-mulgroups',nodeId:source.nodeId}))return null;
 return {nodeId:source.nodeId,method:null,question:task.mode==='build'?
  '有几份，每份有多少？每份都一样多吗？把每一份合起来时，空的一份会添进物品吗？':task.mode==='share'?
  '全部物品和份数已经知道。怎样让每份一样多？如果桌上还有剩余，够不够每份再添一个？答案说的是每份的量还是份数？':
  '全部物品和每份的量已经知道。需要添几份才能装完？每个物品有没有漏掉或放进两份？答案说的是份数还是每份的量？'};
}

const integer=(n,min=0,max=1000000)=>Number.isSafeInteger(n)&&n>=min&&n<=max;
const text=n=>typeof n==='string'&&n.length<=2000;
const number=n=>text(n)&&/^\d{1,9}$/.test(n.trim())&&integer(Number(n))?Number(n):null;
const norm=n=>n.replace(/\s/g,'').replace(/[xX*✕]/g,'×').replace(/[／/]/g,'÷').replace(/＝/g,'=');
// Spaces may separate numbers and operators; they cannot join two digit
// tokens into a different number (for example, "1 2" must not become 12).
const matches=(raw,options)=>text(raw)&&!/\d\s+\d/.test(raw)&&
 options.some(want=>norm(raw)===want||norm(raw)===want.split('=').reverse().join('='));
const fieldKeys=['rows','cols','cut','answer','equation','addition','base','left','right','rest','check','prediction','amount','result'];
const dataKeys=['amount','answer','bucket','cols','cut','index','prediction','result','rows','token'];
const actions=new Set(['b13-reset','b13-plate-add','b13-plate-remove','b13-token','b13-drop','b13-pour','b13-round']);

export function replayGroupsEvidence(task,model){
 try{
  if(task?.type!=='x-mulgroups'||!['build','share','group'].includes(task.mode)||
     !integer(task.a,1,12)||!integer(task.b,task.mode==='group'?1:0,12)||!integer(task.total,0,144))return null;
  for(const flag of ['remainder','repeated','requireDivision'])
   if(task[flag]!==undefined&&typeof task[flag]!=='boolean')return null;
  const remainder=task.total-task.a*task.b;
  if(task.remainder?(task.mode!=='share'||!integer(remainder,1,task.a-1)):remainder!==0)return null;
  if(!keys(model,[...fieldKeys,'board','history','issue'])||!fieldKeys.every(k=>text(model[k]))||
     !text(model.issue)||!Array.isArray(model.history)||model.history.length<1||model.history.length>5000||
     ['rows','cols','cut'].some(k=>model[k]!=='0')||
     ['base','left','right','check','prediction','result'].some(k=>model[k]!==''))return null;
  const fresh=()=>({homes:task.mode==='build'?[]:Array(task.total).fill(-1),buckets:task.mode==='share'?task.a:0,selected:[]});
  let b=fresh(),steps=[],created=0,moved=0,rounds=0,issue='',resetCount=0;
  const events=[],failedRequests=[],ineffectiveRequests=[],epochs=[{index:0,steps}];
  const counts=()=>Array.from({length:b.buckets},(_,i)=>b.homes.filter(n=>n===i).length);
  const pool=()=>b.homes.flatMap((home,i)=>home===-1?[i]:[]);
  for(const [historyIndex,event] of model.history.entries()){
   if(!keys(event,['action','data'])||!actions.has(event.action)||!keys(event.data,dataKeys))return null;
   const d=event.data,action=event.action;
   if(!['amount','answer','cols','cut','prediction','result','rows'].every(k=>text(d[k]))||
      d.index!==null||['cols','cut','rows'].some(k=>d[k]!=='0')||d.prediction!==''||d.result!=='')return null;
   if(!['b13-drop','b13-pour'].includes(action)&&d.bucket!==null)return null;
   if(!['b13-drop','b13-token'].includes(action)&&d.token!==null)return null;
   const before=structuredClone(b),moves=[],added=[];issue='';let accepted=true;
   const move=(token,to)=>{
    const from=b.homes[token];
    if(from!==to){moves.push({token,from,to});b.homes[token]=to;}
   };
   if(action==='b13-reset'){
    b=fresh();steps=[];created=0;moved=0;rounds=0;resetCount++;epochs.push({index:resetCount,steps});
   }else if(action==='b13-plate-add'){
    if(task.mode==='share'||b.buckets>=12)return null;
    b.buckets++;
   }else if(action==='b13-plate-remove'){
    if(task.mode==='share'||b.buckets===0)return null;
    if(b.homes.includes(b.buckets-1)){accepted=false;issue='先把最后一个盘子里的东西搬回来，再收起空盘。';}
    else b.buckets--;
   }else if(action==='b13-token'){
    if(!integer(d.token,0,b.homes.length-1))return null;
    const selected=b.selected.indexOf(d.token);
    if(selected<0)b.selected.push(d.token);else b.selected.splice(selected,1);
   }else if(action==='b13-drop'){
    if(!integer(d.bucket,-1,b.buckets-1)||!(d.token===null||integer(d.token,0,b.homes.length-1)))return null;
    const chosen=d.token===null?[...b.selected]:[d.token];
    if(!chosen.length)return null;
    for(const token of chosen)move(token,d.bucket);
    b.selected=[];
   }else if(action==='b13-pour'){
    if(!integer(d.bucket,0,b.buckets-1))return null;
    if(b.selected.length){
     for(const token of b.selected)move(token,d.bucket);
     b.selected=[];
    }else{
     const amount=number(d.amount),available=pool();
     if(!integer(amount,1,12)){accepted=false;issue='这次取1到12个，再看看放在哪一份。';}
     else if(task.mode!=='build'&&available.length<amount){accepted=false;issue='桌上没有这么多。已经分出去的可以搬回来重新分。';}
     else if(task.mode==='build'&&b.homes.length+Math.max(0,amount-available.length)>144){accepted=false;issue='这一桌最多摆144个。可以先把不用的部分搬回桌面。';}
     else for(let i=0;i<amount;i++){
       if(i<available.length)move(available[i],d.bucket);
       else{added.push(b.homes.length);b.homes.push(d.bucket);}
      }
    }
   }else if(action==='b13-round'){
    const available=pool();
    if(task.mode!=='share')return null;
    if(available.length<b.buckets){accepted=false;issue='剩下的已经不够每盘再放一个。看看每盘与剩余各是多少。';}
    else{for(let i=0;i<b.buckets;i++)move(available[i],i);rounds++;}
   }
   if(b.homes.length>144||
      !b.homes.every(home=>integer(home,-1,b.buckets-1))||
      action!=='b13-reset'&&b.homes.length!==before.homes.length+added.length||
      task.mode!=='build'&&b.homes.length!==task.total)return null;
   const currentCounts=counts(),rest=pool().length;
   if(currentCounts.reduce((n,c)=>n+c,rest)!==b.homes.length)return null;
   const entry={historyIndex,epoch:resetCount,action,data:structuredClone(d),accepted,before,after:structuredClone(b),issue};
   events.push(entry);
   if(!accepted)failedRequests.push(entry);
   else if(action!=='b13-reset'&&(!moves.length&&!added.length&&before.buckets===b.buckets&&action!=='b13-token'))ineffectiveRequests.push(entry);
   if(accepted&&action!=='b13-reset'){
    created+=added.length;moved+=moves.length;
    steps.push({action,groupsBefore:before.buckets,groupsAfter:b.buckets,
     totalBefore:before.homes.length,totalAfter:b.homes.length,moves,created:added,counts:currentCounts,remainder:rest});
   }
  }
  const finalCounts=counts(),rest=pool().length;
  if(!same(b,model.board)||model.issue!==issue||b.buckets!==task.a||b.homes.length!==task.total||
     !finalCounts.every(n=>n===task.b)||rest!==remainder||
     (task.mode==='build'?created!==task.total:created!==0))return null;
  const resultRole=task.mode==='build'?'total':task.mode==='share'?'each':'groups';
  const result=resultRole==='total'?task.total:resultRole==='each'?task.b:task.a;
  const equations=task.remainder?
   [`${task.a}×${task.b}+${remainder}=${task.total}`,`${task.b}×${task.a}+${remainder}=${task.total}`]:
   task.mode==='build'?[`${task.a}×${task.b}=${task.total}`,`${task.b}×${task.a}=${task.total}`]:
   [`${task.total}÷${task.mode==='share'?task.a:task.b}=${result}`];
  if(number(model.answer)!==result||!matches(model.equation,equations)||
     task.remainder&&number(model.rest)!==remainder||
     task.repeated&&!matches(model.addition,[Array(task.a).fill(task.b).join('+')+'='+task.total]))return null;
  // Retain the original result/record contract in addition to independent math.
  if(!groups.valid(task,model)||!groups.inspect(task,model).correct)return null;
  return {mode:task.mode,total:task.total,groups:task.a,each:task.b,remainder,
   result,resultRole,counts:finalCounts,homes:[...b.homes],steps,created,moved,rounds,
   history:{events,failedRequests,ineffectiveRequests,epochs,resetCount,currentEpoch:resetCount}};
 }catch{return null;}
}
