// B33 money: exact recorded coin compositions and source-index basket choices.
// Displayed totals are tool output, not evidence of a child's mental arithmetic.
import * as money from './phase5/b33-model.js';
import {sessionTasks} from './bridges.js';
import {matchesNativeEvidenceTask,isEvidenceContext,hasExactKeys as keys,sameEvidence as same} from './evidence-contract.js';

const SOURCES=Object.freeze({
 poundnotation:{indices:[0,1,2],nodeId:'mt_pbuhUQJjtt'},
 coincombo:{indices:[0,1,2],nodeId:'mt_AF2BeFQwfX'},
 pennyshop:{indices:[0,1,2],nodeId:'mt_6J1wmCWf41'},
 poundchange:{indices:[0,1,2],nodeId:'mt_6_O6THdEDK'},
 modmoney:{indices:[1],nodeId:'mt_iQYPw8bMfN'},
 auscoins:{indices:[1,2],nodeId:'mt_FSLJbKkryb'},
 austrans:{indices:[0,1,2],nodeId:'mt_8cs4YPkp23'},
 dollarcents:{indices:[0,1,2,3],nodeId:'mt_9L5qyBYmg-'},
 usmoney:{indices:[0,1,2],nodeId:'mt_3tz3Otap5j'},
 measuremoney:{indices:[2],nodeId:'mt_mFJ-2ZF6Tk'},
 budgetchoices:{indices:[0],nodeId:'mt_Qe2PsFmSAH'},
 lifemath38:{indices:[2],nodeId:'mt_f67qGDhyfi'}
});

// These roles are reviewed against the full original question, not inferred
// from its answer or prompt at runtime. A changed source still fails the full
// native-task comparison and the independently fixed source-manifest audit.
const DEFINITIONS=Object.freeze({
 'poundnotation:0':{target:150,roles:['target','target']},
 'poundnotation:1':{target:75,roles:['target']},
 'poundnotation:2':{roles:['total']},
 'coincombo:0':{target:50,roles:['target']},
 'coincombo:1':{target:30,roles:['target']},
 'coincombo:2':{target:20,roles:['equal-saved-totals']},
 'pennyshop:0':{roles:['total']},
 'pennyshop:1':{target:15,roles:['target'],relation:{role:'change',paid:50,price:35}},
 'pennyshop:2':{target:20,roles:['target'],relation:{role:'shortfall',price:50,held:30}},
 'poundchange:0':{roles:['total']},
 'poundchange:1':{paid:500,roles:['change']},
 'poundchange:2':{paid:1000,roles:['total','change']},
 'modmoney:1':{paid:500,roles:['total','change','change-role']},
 'auscoins:1':{target:700,roles:['target']},
 'auscoins:2':{paid:1000,roles:['total','enough']},
 'austrans:0':{paid:2000,roles:['total','change']},
 'austrans:1':{roles:['total']},
 'austrans:2':{target:85,roles:['fewest-coins']},
 'dollarcents:0':{target:270,roles:['target','target']},
 'dollarcents:1':{target:450,roles:['target']},
 'dollarcents:2':{target:360,roles:['target']},
 'dollarcents:3':{target:360,roles:['target'],relation:{role:'change',paid:1000,price:640}},
 'usmoney:0':{target:80,roles:['target']},
 'usmoney:1':{paid:200,roles:['change']},
 'usmoney:2':{target:125,roles:['target','target']},
 'measuremoney:2':{roles:['total']},
 'budgetchoices:0':{roles:[]},
 'lifemath38:2':{paid:500,roles:['total','change','change-role']}
});
const TYPES=new Set(['x-m33-coins','x-m33-cart']);
const copy=x=>structuredClone(x),text=x=>typeof x==='string'&&x.length<=1200;
const integer=(x,min,max)=>Number.isSafeInteger(x)&&x>=min&&x<=max;
const failure='先把每一枚的面值合起来，再看是否正好。';

export function moneyBinding(task,context={}){
 try{
  if(!isEvidenceContext(context))return null;
  const source=Object.hasOwn(SOURCES,context.sessionId)?SOURCES[context.sessionId]:null;
  if(!source||!source.indices.includes(context.index)||!TYPES.has(task?.type)||
     !matchesNativeEvidenceTask(task,context,{type:task.type,nodeId:source.nodeId}))return null;
  return {nodeId:source.nodeId,method:null,question:task.type==='x-m33-coins'?
   '每一种钱的面值与枚数怎样合起来？换一种摆法时，哪些数量改变、哪些保持？':
   '篮子里实际选了哪些东西？各自的价格、合计与题目要比较的钱怎样对应？'};
 }catch{return null;}
}

// Direct replay remains mathematical only; public feedback must additionally
// require moneyBinding and the exact latest full original submission. An
// associated clone can have valid mathematics without a native binding.
function definition(task){
 let found=null;
 for(const[id,source]of Object.entries(SOURCES))for(const index of source.indices){
  const original=sessionTasks(id)?.[index];
  if(original?.type===task?.type&&same(original,task)){
   const candidate=DEFINITIONS[id+':'+index];
   if(found&&!same(found,candidate))return null;
   found=candidate;
  }
 }
 return found;
}
const index=(raw,max)=>typeof raw==='string'&&/^(0|[1-9]\d*)$/.test(raw)&&
 integer(Number(raw),0,max)&&String(Number(raw))===raw?Number(raw):null;
const sum=(weights,counts)=>Number(counts.reduce((n,count,i)=>n+BigInt(count)*BigInt(weights[i]),0n));
const coinCount=counts=>counts.reduce((a,n)=>a+n,0);
const countShape=(counts,length)=>Array.isArray(counts)&&counts.length===length&&counts.every(n=>integer(n,0,50));
const firstBoard=t=>t.type==='x-m33-coins'?{first:{},bad:false,counts:t.denoms.map(()=>0),saved:[]}:
 {first:{},bad:false,selected:[],estimate:null,revealed:true};

// Current sources are small positive integer denominations. Exact integer DP
// verifies the optimum; this calculation is the checker's, never a recorded
// child proof of optimality. Keep its allocation bounded before constructing it.
function minimumCoins(target,weights){
 if(!integer(target,1,10000)||!weights.length||weights.some(n=>!integer(n,1,1000000)))return null;
 const best=Array(target+1).fill(null);best[0]=0;
 for(let value=1;value<=target;value++)for(const weight of weights)
  if(weight<=value&&best[value-weight]!==null){const count=best[value-weight]+1;if(best[value]===null||count<best[value])best[value]=count;}
 return best[target];
}

// Match the actual money-input grammar with integer arithmetic, including its
// explicit currency unit and whitespace normalization. No decimal Number parse.
function enteredMoney(raw,currency,kind){
 if(!text(raw))return null;
 const s=raw.trim().replace(/\s/g,'');if(s.length>30)return null;
 let match,value;
 if(kind==='minor'){
  match=(currency==='GBP'?/^(\d{1,7})(?:p)?$/i:/^(\d{1,7})(?:c|¢)?$/i).exec(s);
  if(!match)return null;value=BigInt(match[1]);
 }else{
  match=(currency==='GBP'?/^(?:£)?(\d{1,6})(?:\.(\d{1,2}))?$/:/^(?:\$)?(\d{1,6})(?:\.(\d{1,2}))?$/).exec(s);
  if(!match)return null;value=BigInt(match[1])*100n+BigInt((match[2]||'').padEnd(2,'0'));
 }
 return value<=100000000n?Number(value):null;
}
function enteredInteger(raw){
 if(!text(raw))return null;
 const s=raw.trim().replace(/[−–]/g,'-');let m,n,d;
 if((m=/^(-?\d+)\s+(\d+)\/(\d+)$/.exec(s))){
  const part=BigInt(m[2]);d=BigInt(m[3]);if(!d||part>=d)return null;
  n=BigInt(m[1].replace('-',''))*d+part;if(m[1].startsWith('-'))n=-n;
 }else if((m=/^(-?\d+)\/(\d+)$/.exec(s))){n=BigInt(m[1]);d=BigInt(m[2]);}
 else if((m=/^([+-]?)(\d+)(?:\.(\d+))?$/.exec(s))){
  const part=m[3]||'';d=10n**BigInt(part.length);n=BigInt(m[2])*d+BigInt(part||'0');if(m[1]==='-')n=-n;
 }else return null;
 if(d<1n||d>100000000n||n< -1000000000000n||n>1000000000000n||n%d)return null;
 return Number(n/d);
}
function answers(task,model,def,math){
 if(def.roles.length!==task.questions.length)return null;
 const out=[];
 for(const[i,q]of task.questions.entries()){
  const role=def.roles[i],raw=model.answers[i];let expected;
  if(role==='target')expected=math.target;
  else if(role==='fewest-coins')expected=math.minimum;
  else if(role==='equal-saved-totals')expected='same';
  else if(role==='total')expected=math.total;
  else if(role==='change')expected=def.paid-math.total;
  else if(role==='enough')expected=def.paid>=math.total?'yes':'no';
  else if(role==='change-role')expected='change';
  else return null;
  const value=q.kind==='major'||q.kind==='minor'?enteredMoney(raw,task.currency,q.kind):
   q.kind==='number'?enteredInteger(raw):q.kind==='choice'?raw:null;
  if(value===null||value!==expected||q.value!==expected||q.kind==='choice'&&
     (!Array.isArray(q.options)||!q.options.some(option=>Array.isArray(option)&&option[0]===value)))return null;
  out.push({index:i,label:q.label,kind:q.kind,role,raw,value,submissionOnly:true});
 }
 return out;
}

export function replayMoneyEvidence(task,model){
 try{
  const def=definition(task);if(!def||!TYPES.has(task?.type)||!['GBP','AUD','USD'].includes(task.currency)||
     !Array.isArray(task.questions)||task.questions.length>6||task.estimate!==undefined||
     !keys(model,['board','history','issue','prose','formula','estimate','answers'])||
     !['issue','prose','formula','estimate'].every(k=>text(model[k]))||model.formula!==''||model.estimate!==''||
     !Array.isArray(model.answers)||model.answers.length!==task.questions.length||!model.answers.every(text)||
     !Array.isArray(model.history)||!model.history.length||model.history.length>1200)return null;
  const coins=task.type==='x-m33-coins',board=firstBoard(task),events=[],saves=[];
  let issue='',minimum=null,weights=null,visible=null;
  if(coins){
   if(!Array.isArray(task.denoms)||!integer(task.denoms.length,1,12)||!integer(task.target,1,10000)||def.target!==task.target)return null;
   weights=task.denoms.map(d=>d.cents);
   if(weights.some(n=>!integer(n,1,1000000)))return null;
   visible=task.visibleIndices||weights.map((_,i)=>i);
   if(!Array.isArray(visible)||!visible.length||new Set(visible).size!==visible.length||visible.some(i=>!integer(i,0,weights.length-1)))return null;
   minimum=minimumCoins(task.target,weights);if(minimum===null)return null;
   if(def.relation){const r=def.relation;
    if((r.role==='change'?BigInt(r.paid)-BigInt(r.price):BigInt(r.price)-BigInt(r.held))!==BigInt(task.target))return null;
   }
  }else if(!Array.isArray(task.items)||!integer(task.items.length,1,20)||task.items.some(item=>!integer(item.cents,0,1000000))||
   task.budget!==undefined&&!integer(task.budget,1,1000000)||
   task.minimum!==undefined&&!integer(task.minimum,1,task.items.length)||
   task.required!==undefined&&(!Array.isArray(task.required)||new Set(task.required).size!==task.required.length||task.required.some(i=>!integer(i,0,task.items.length-1))))return null;
  for(const[historyIndex,event]of model.history.entries()){
   if(!keys(event,['a','i','v'])||typeof event.a!=='string'||typeof event.i!=='string'||event.v!=='')return null;
   const before=coins?{counts:[...board.counts],totalMinorUnits:sum(weights,board.counts),savedCount:board.saved.length}:
    {selected:[...board.selected],totalMinorUnits:sum(task.items.map(item=>item.cents),task.items.map((_,i)=>board.selected.includes(i)?1:0))};
   const entry={historyIndex,action:'m33-'+event.a,event:copy(event),before,accepted:true,effect:false};issue='';
   if(coins){
    if(!['add','remove','save','clear'].includes(event.a))return null;
    if(event.a==='add'||event.a==='remove'){
     const i=index(event.i,weights.length-1);if(i===null||event.a==='add'&&!visible.includes(i)||event.a==='remove'&&board.counts[i]===0)return null;
     entry.denomination={index:i,label:task.denoms[i].label,minorUnits:weights[i]};
     if(event.a==='add'&&board.counts[i]===50){entry.accepted=false;entry.reason='per-denomination-capacity';}
     else {board.counts[i]+=event.a==='add'?1:-1;entry.effect=true;}
    }else{
     if(event.i!=='')return null;
     if(event.a==='clear'){entry.effect=board.counts.some(Boolean);board.counts=board.counts.map(()=>0);}
     else{
      const counts=[...board.counts],total=sum(weights,counts),first=!Object.hasOwn(board.first,'build');
      if(first)board.first.build={counts:[...counts],total};
      const stored=board.saved.length<12,savedIndex=stored?board.saved.length:null;
      if(stored)board.saved.push({counts:[...counts],total});
      const amountMatches=total===task.target;
      if(!amountMatches){board.bad=true;issue=failure;}
      const record={historyIndex,savedIndex,stored,counts,totalMinorUnits:total,coinCount:coinCount(counts),
       terms:counts.flatMap((count,i)=>count?[{index:i,label:task.denoms[i].label,count,minorUnits:weights[i],productMinorUnits:Number(BigInt(count)*BigInt(weights[i]))}]:[]),
       amountMatches,requiredCountsMatch:!task.mustCounts||task.mustCounts.every(([i,n])=>counts[i]===n),
       minimumCountMatches:!task.minCoins||coinCount(counts)===minimum};
      record.qualifies=stored&&record.amountMatches&&record.requiredCountsMatch&&record.minimumCountMatches;
      saves.push(record);entry.save=copy(record);entry.accepted=amountMatches;entry.effect=stored||first;
      if(!stored)entry.storageReason='saved-composition-capacity';
     }
    }
    if(!countShape(board.counts,weights.length))return null;
    const afterTotal=sum(weights,board.counts),expectedDelta=entry.denomination&&entry.effect?
     (event.a==='add'?entry.denomination.minorUnits:-entry.denomination.minorUnits):event.a==='clear'?Number(-BigInt(before.totalMinorUnits)):0;
    if(BigInt(afterTotal)-BigInt(before.totalMinorUnits)!==BigInt(expectedDelta))return null;
    entry.deltaMinorUnits=expectedDelta;entry.after={counts:[...board.counts],totalMinorUnits:afterTotal,savedCount:board.saved.length};
   }else{
    // There is no reveal control on any current configured coin/cart source.
    // A historical reveal can come from a supported older unrevealed initial
    // state, but the record lacks version provenance. Keep the original record
    // valid; withhold strict qualification rather than certify a hidden action.
    // A real shared retry starts a new unambiguous model and retains old attempts.
    if(!['choose','clear'].includes(event.a))return null;
    if(event.a==='clear'){
     if(event.i!=='')return null;entry.effect=board.selected.length>0;board.selected=[];
    }else{
     const i=index(event.i,task.items.length-1);if(i===null)return null;
     const selected=!board.selected.includes(i);board.selected=selected?[...board.selected,i].sort((a,b)=>a-b):board.selected.filter(j=>j!==i);
     entry.item={index:i,name:task.items[i].name,minorUnits:task.items[i].cents,selected};entry.effect=true;
    }
    const total=Number(board.selected.reduce((n,i)=>n+BigInt(task.items[i].cents),0n));
    const delta=event.a==='clear'?Number(-BigInt(before.totalMinorUnits)):Number(BigInt(entry.item.minorUnits)*(entry.item.selected?1n:-1n));
    if(BigInt(total)-BigInt(before.totalMinorUnits)!==BigInt(delta))return null;
    entry.deltaMinorUnits=delta;entry.after={selected:[...board.selected],totalMinorUnits:total};
   }
   entry.issue=issue;events.push(entry);
  }
  if(!same(board,model.board)||issue!==model.issue)return null;
  let construction,math;
  if(coins){
   const accepted=saves.filter(s=>s.qualifies),distinct=[...new Set(accepted.map(s=>s.counts.join(',')))];
   if(distinct.length<(task.distinct||1))return null;
   construction={kind:'saved-coin-compositions',targetMinorUnits:task.target,requiredDistinct:task.distinct||1,
    distinctAccepted:distinct.length,acceptedSavedIndices:accepted.map(s=>s.savedIndex),saves,
    minimum:task.minCoins?{coins:minimum,origin:'checker-integer-optimization',childOptimalityProofRecorded:false}:null,
    current:{counts:[...board.counts],totalMinorUnits:sum(weights,board.counts),coinCount:coinCount(board.counts),isSavedByLastEvent:events.at(-1).save?.stored===true},
    relation:def.relation?{...def.relation,resultMinorUnits:task.target,origin:'fixed-question-relationship'}:null};
   math={target:task.target,minimum};
  }else{
   const selected=[...board.selected],total=Number(selected.reduce((n,i)=>n+BigInt(task.items[i].cents),0n));
   if(selected.length<(task.minimum||1)||task.budget!==undefined&&total>task.budget||task.required&&!task.required.every(i=>selected.includes(i)))return null;
   construction={kind:'selected-basket',selected,items:selected.map(i=>({index:i,name:task.items[i].name,minorUnits:task.items[i].cents})),
    totalMinorUnits:total,minimumItems:task.minimum||1,requiredItems:task.required?[...task.required]:[],
    budget:task.budget===undefined?null:{minorUnits:task.budget,remainingMinorUnits:task.budget-total},
    payment:def.paid===undefined?null:{minorUnits:def.paid,changeMinorUnits:def.paid-total,origin:'fixed-question-relationship'},
    initialState:'current-configured-revealed',legacyRevealProvenanceCertified:false};
   math={total};
  }
  const submitted=answers(task,model,def,math);if(!submitted||!money.valid(task,model)||!money.inspect(task,model).correct)return null;
  return {kind:coins?'coins':'cart',currency:task.currency,minorPerMajor:100,
   minorUnit:task.currency==='GBP'?'便士':task.currency==='AUD'?'澳分':'美分',
   eventCount:model.history.length,events,first:copy(board.first),bad:board.bad,issue,
   construction,answers:submitted,displayTotalsOrigin:'tool',answerEditTimingKnown:false,
   independentArithmeticAssessed:false,independentExplanationAssessed:false,
   physicalMoneyAssessed:false,generalMasteryAssessed:false};
 }catch{return null;}
}
