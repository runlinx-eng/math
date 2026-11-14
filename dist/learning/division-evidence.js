// Replay the actual B14 written-division events. A digit records an entered
// quotient, product and remainder; the tool supplies the place-value display.
import * as division from './phase5/b14-model.js';
import {matchesNativeEvidenceTask,hasExactKeys as keys,sameEvidence as same} from './evidence-contract.js';

const SOURCES=Object.freeze({
 largerfacts:{indices:[2],nodeId:'mt_8A3pZNOp7Z'},
 writtenstart:{indices:[1],nodeId:'mt_DyGBW3ZHh3'},
 shortdivide:{indices:[0,1,2,3],nodeId:'mt_MCu_SNg_OW'},
 divide16:{indices:[0,1,2],nodeId:'mt_FvEq4heNBx'},
 longdivide:{indices:[0,1,2],nodeId:'mt_WsM4EmdOLe'},
 remainders:{indices:[0,1,2],nodeId:'mt_p-nbe0w_lf'},
 roundanswers:{indices:[0,1,2,3],nodeId:'mt_QU5R7Aajy9'},
 estimatecheck:{indices:[3],nodeId:'mt_ilPrU0cbtT'},
 tooladv39:{indices:[0],nodeId:'mt_ZJC7JnnPCu'}
});
export function divisionBinding(task,context={}){
 if(!context||typeof context!=='object'||Array.isArray(context)||
    typeof context.sessionId!=='string'||!Number.isInteger(context.index)||context.index<0)return null;
 const source=Object.hasOwn(SOURCES,context.sessionId)?SOURCES[context.sessionId]:null;
 if(!source||!source.indices.includes(context.index)||
    !matchesNativeEvidenceTask(task,context,{type:'x-divtable',nodeId:source.nodeId}))return null;
 const question=task.interpret==='up'?'每份最多容纳多少？余下的也要安排时，少一份够不够？':
  task.interpret==='down'?'每份都必须完整时，能留下几份？剩下的量还够一整份吗？':
  task.interpret==='fraction'?'每一步剩下的是什么单位？还可以继续平均分时，余量对应每份的多少？':
  task.interpret==='round'?'逐位记录到了哪一位？问题需要的精度和是否还有余量，怎样帮助决定近似值？':
  '带下下一位时，原来的余量换成几个更小的单位？分不到一份的那一位应怎样留下？';
 return {nodeId:source.nodeId,method:null,question};
}

const fieldDefaults={answer:'',estimate:'',cutA:'',cutB:'',part:'',base:'',raw:'',digit:'',shift:'',rowvalue:'',q:'',used:'',rest:'',check:'',method:'',precision:'',candidate:'',remainder:'',prediction:'',reason:'',left:'',right:'',expression:'',hcf:'',lcm:'',result:'',operator:'',equation:'',sideA:'0',sideB:'0',start:'',formula:'',condition:''};
const fieldKeys=Object.keys(fieldDefaults),text=s=>typeof s==='string'&&s.length<=2000;
const integer=(n,lo=0,hi=1000000)=>Number.isSafeInteger(n)&&n>=lo&&n<=hi;
const gcd=(a,b)=>{while(b)[a,b]=[b,a%b];return a;};
const reduce=(n,d)=>{const g=gcd(n,d);return[Number(n/g),Number(d/g)];};
const place=power=>power>=0?[10**power,1]:[1,10**-power];
const fresh=t=>({method:t.long?'long':t.choose?null:'short',steps:[],ready:false,current:null,containers:0});
const digits=t=>[...String(t.n)].map(Number).concat(Array(t.places).fill(0));
const visible=(t,b,total)=>!b.method?['method']:b.steps.length<total?
 (b.ready?['q','used','rest']:[]):['check','answer',...(t.choosePrecision?['precision']:[]),...(t.interpret==='keep'?['base']:[])];

// Match the original number field's finite decimal syntax before exact math.
// In particular, a rejected seventh decimal place cannot become a successful
// historical step merely because a later reset clears the tool's issue text.
function enteredInteger(raw,lo,hi){
 if(!text(raw))return null;
 const m=/^(\d{1,9})(?:\.(\d{1,6}))?$/.exec(raw.trim());if(!m)return null;
 const d=10n**BigInt((m[2]||'').length),n=BigInt(m[1])*d+BigInt(m[2]||'0');
 if(n%d||n<BigInt(lo)*d||n>BigInt(hi)*d)return null;
 return Number(n/d);
}

// Original final fraction/decimal inputs accept these three unsigned forms.
// Their unreduced numerator/denominator bounds are checked before reduction.
function enteredAmount(raw){
 if(!text(raw))return null;const s=raw.trim();let m,n,d;
 if((m=/^(\d+)\s+(\d+)\/(\d+)$/.exec(s))){d=BigInt(m[3]);n=BigInt(m[1])*d+BigInt(m[2]);}
 else if((m=/^(\d+)\/(\d+)$/.exec(s))){n=BigInt(m[1]);d=BigInt(m[2]);}
 else if((m=/^(\d+)(?:\.(\d+))?$/.exec(s))){d=10n**BigInt((m[2]||'').length);n=BigInt(m[1])*d+BigInt(m[2]||'0');}
 else return null;
 return d>0n&&d<=10000000n&&n<=10000000n?[n,d]:null;
}

// Token boundaries are significant. Whitespace may separate an operator from
// a number, but cannot join "1 5" into 15 or round a nearby decimal into 15.
function inverse(raw,q,d,r,n){
 if(!text(raw))return null;const tokens=[];let i=0;
 while(i<raw.length){
  if(/\s/.test(raw[i])){i++;continue;}
  const m=/^\d+(?:\.\d+)?/.exec(raw.slice(i));
  if(m){
   const [whole,part='']=m[0].split('.'),scale=10n**BigInt(part.length),value=BigInt(whole)*scale+BigInt(part||'0');
   if(value%scale)return null;tokens.push(value/scale);i+=m[0].length;
  }else if(['×','*','+','='].includes(raw[i])){const symbol=raw[i++];tokens.push(symbol==='*'?'×':symbol);}
  else return null;
 }
 const equal=tokens.indexOf('=');if(equal<0||tokens.lastIndexOf('=')!==equal)return null;
 let left=tokens.slice(0,equal),right=tokens.slice(equal+1),reversed=false;
 if(left.length===1){[left,right]=[right,left];reversed=true;}
 if(right.length!==1||right[0]!==n||![3,5].includes(left.length)||left[1]!=='×')return null;
 const commuted=left[0]===d&&left[2]===q;
 if(!(left[0]===q&&left[2]===d||commuted))return null;
 if(left.length===5?(left[3]!=='+'||left[4]!==r):r!==0n)return null;
 return {quotient:Number(q),divisor:Number(d),remainder:Number(r),dividend:Number(n),reversed,commuted,explicitRemainder:left.length===5,raw};
}
const fixed=(units,dp)=>{const s=String(units).padStart(dp+1,'0');return dp?s.slice(0,-dp)+'.'+s.slice(-dp):s;};

export function replayDivisionEvidence(task,model){
 try{
  const optional=['long','choose','choosePrecision','dp'].filter(k=>Object.hasOwn(task||{},k));
  if(!keys(task,['type','n','d','prompt','interpret','places',...optional])||task.type!=='x-divtable'||!text(task.prompt)||
     !integer(task.n,1,99999)||!integer(task.d,1,99)||!integer(task.places,0,6)||
     !['keep','up','down','fraction','decimal','round'].includes(task.interpret)||
     ['long','choose','choosePrecision'].some(k=>task[k]!==undefined&&typeof task[k]!=='boolean')||task.long&&task.choose||
     (task.interpret==='round'?(!integer(task.dp,0,5)||task.places<=task.dp):task.dp!==undefined)||
     task.choosePrecision&&(task.interpret!=='round'||task.dp>2)||
     !['round','decimal'].includes(task.interpret)&&task.places!==0||
     !keys(model,[...fieldKeys,'history','board','issue'])||!fieldKeys.every(k=>text(model[k]))||model.issue!==''||
     !Array.isArray(model.history)||!model.history.length||model.history.length>3000||
     !division.valid(task,model)||!division.inspect(task,model).correct)return null;
  const N=BigInt(task.n),D=BigInt(task.d),Q=N/D,R=N%D,ds=digits(task),width=String(task.n).length;
  let b=fresh(task),previous={...fieldDefaults},epoch=0,prefix=0n,quotientPrefix=0n,bringIndex=null,choiceIndex=null;
  let currentSteps=[],currentContainers=[];
  const events=[],choices=[],resets=[],epochs=[{epoch:0,startIndex:0,endExclusive:null}];
  for(let index=0;index<model.history.length;index++){
   const e=model.history[index];
   if(!keys(e,['action','data'])||!keys(e.data,['fields','index','side','value'])||
      !keys(e.data.fields,fieldKeys)||!fieldKeys.every(k=>text(e.data.fields[k]))||e.data.index!==null||e.data.side!==null)return null;
   const {action,data}=e,f=data.fields,allowed=visible(task,b,ds.length);
   if(fieldKeys.some(k=>!allowed.includes(k)&&f[k]!==previous[k])||
      !['','short','long'].includes(f.method)||!['','0','1','2'].includes(f.precision))return null;
   previous={...f};
   if(action==='b14-container'?![1,-1].includes(data.value):data.value!==null)return null;
   const event={index,epoch,action,effect:true};
   if(action==='b14-reset'){
    event.effect=!!(b.steps.length||b.ready||b.containers||choiceIndex!==null);event.nextEpoch=epoch+1;
    resets.push({index,fromEpoch:epoch,toEpoch:epoch+1});epochs[epoch].endExclusive=index;epochs[epoch].resetAfterIndex=index;
    epoch++;epochs.push({epoch,startIndex:index+1,endExclusive:null});b=fresh(task);prefix=0n;quotientPrefix=0n;
    bringIndex=null;choiceIndex=null;currentSteps=[];currentContainers=[];
   }else if(action==='b14-method'){
    if(b.method!==null||!task.choose||!['short','long'].includes(f.method))return null;
    b.method=f.method;choiceIndex=index;event.method=f.method;choices.push({index,epoch,method:f.method});
   }else if(action==='b14-bring'){
    if(!b.method||b.ready||b.steps.length>=ds.length)return null;
    const position=b.steps.length,power=width-1-position,previousRemainder=b.steps.at(-1)?.r||0,nextDigit=ds[position];
    b.current=Number(BigInt(previousRemainder)*10n+BigInt(nextDigit));b.ready=true;bringIndex=index;
    Object.assign(event,{position,power,unit:place(power),previousRemainder,nextDigit,current:b.current,
     conversion:position?{quantity:previousRemainder,fromUnit:place(power+1),toUnit:place(power),converted:previousRemainder*10}:null,toolDisplaysConversion:true});
   }else if(action==='b14-div-step'){
    if(!b.method||!b.ready||b.steps.length>=ds.length)return null;
    const q=enteredInteger(f.q,0,9),used=enteredInteger(f.used,0,999),r=enteredInteger(f.rest,0,task.d-1);
    if(q===null||used===null||r===null||BigInt(used)!==BigInt(q)*D||BigInt(used)+BigInt(r)!==BigInt(b.current))return null;
    const position=b.steps.length,power=width-1-position;prefix=prefix*10n+BigInt(ds[position]);quotientPrefix=quotientPrefix*10n+BigInt(q);
    if(prefix!==quotientPrefix*D+BigInt(r))return null;
    Object.assign(event,{position,power,unit:place(power),bringIndex,nextDigit:ds[position],quotientDigit:q,used,remainder:r,current:b.current,
     dividendPrefix:Number(prefix),quotientPrefix:Number(quotientPrefix)});
    b.steps.push({q,used,r,current:b.current});currentSteps.push({...event});b.ready=false;b.current=null;bringIndex=null;
   }else if(action==='b14-container'){
    if(b.steps.length!==ds.length||!['up','down'].includes(task.interpret)||data.value===-1&&b.containers===0)return null;
    const from=b.containers,to=from+data.value;
    if(!integer(to,0,200)||task.interpret==='down'&&BigInt(to)>Q)return null;
    b.containers=to;const capacity=to*task.d;
    Object.assign(event,{from,to,capacity,shownAllocated:Math.min(capacity,task.n),unallocated:Math.max(0,task.n-capacity),
     unusedCapacity:Math.max(0,capacity-task.n),toolFillsDiagram:true});currentContainers.push({...event});
   }else return null;
   events.push(event);
  }
  epochs[epoch].endExclusive=model.history.length;
  if(!same(b,model.board)||b.steps.length!==ds.length||b.ready||b.current!==null)return null;
  const allowed=visible(task,b,ds.length);
  if(fieldKeys.some(k=>!allowed.includes(k)&&model[k]!==previous[k])||
     !['','short','long'].includes(model.method)||!['','0','1','2'].includes(model.precision))return null;
  const check=inverse(model.check,Q,D,R,N);if(!check)return null;
  const answer={role:task.interpret,raw:model.answer};let rounding=null,containers=null;
  if(task.interpret==='keep'){
   if(enteredInteger(model.answer,0,99999)!==Number(Q)||enteredInteger(model.base,0,98)!==Number(R))return null;
   Object.assign(answer,{integerQuotient:Number(Q),remainingOriginal:Number(R),rawRemainder:model.base});
  }else if(['up','down'].includes(task.interpret)){
   const want=task.interpret==='up'?(N+D-1n)/D:Q;
   if(enteredInteger(model.answer,0,99999)!==Number(want)||BigInt(b.containers)!==want)return null;
   Object.assign(answer,{count:Number(want)});
   containers={count:b.containers,perContainer:task.d,capacity:b.containers*task.d,remainingOriginal:Number(R),events:currentContainers,
    minimumSufficient:task.interpret==='up',fullContainersOnly:task.interpret==='down',
    adjacentCapacity:Number((task.interpret==='up'?want-1n:want+1n)*D),toolFillsDiagram:true,independentObjectDistributionAssessed:false};
  }else if(['fraction','decimal'].includes(task.interpret)){
   const amount=enteredAmount(model.answer);
   if(!amount||amount[0]*D!==N*amount[1]||task.interpret==='decimal'&&(model.answer.includes('/')||b.steps.at(-1).r!==0))return null;
   Object.assign(answer,{exactValue:reduce(N,D),integerQuotient:Number(Q),remainingOriginal:Number(R),fractionalShare:reduce(R,D)});
  }else{
   const scale=10n**BigInt(task.dp),lower=N*scale/D,remainder=N*scale%D,up=2n*remainder>=D,rounded=lower+(up?1n:0n),formatted=fixed(rounded,task.dp);
   if(model.answer.trim()!==formatted||task.choosePrecision&&enteredInteger(model.precision,0,2)!==task.dp)return null;
   rounding={places:task.dp,scale:Number(scale),lowerUnits:Number(lower),upperUnits:Number(lower+1n),scaledRemainder:Number(remainder),
    divisor:task.d,tie:2n*remainder===D,direction:up?'up':'down',roundedUnits:Number(rounded),formatted,precisionChosen:!!task.choosePrecision,
    exactValue:reduce(N,D),rule:'half-up'};
   Object.assign(answer,{rounded:formatted,places:task.dp});
  }
  const scale=10n**BigInt(task.places),lastR=BigInt(b.steps.at(-1).r),written=b.steps.map(s=>s.q).join('');
  if(N*scale!==quotientPrefix*D+lastR)return null;
  return {dividend:task.n,divisor:task.d,integerQuotient:Number(Q),remainingOriginal:Number(R),
   method:{value:b.method,origin:choiceIndex===null?'task-default':'recorded-choice',choiceIndex},choices,events,epochs,resets,currentEpoch:epoch,steps:currentSteps,
   calculated:{places:task.places,quotientDigits:b.steps.map(s=>s.q),written:task.places?written.slice(0,width)+'.'+written.slice(width):written,
    quotientPrefix:Number(quotientPrefix),scale:Number(scale),value:reduce(quotientPrefix,scale),remainder:Number(lastR),remainderUnit:[1,Number(scale)],
    unresolvedOriginal:reduce(lastR,scale),exactAfterSteps:lastR===0n},
   inverse:check,answer,rounding,containers,toolDisplaysPlaceConversions:true,independentExplanationAssessed:false};
 }catch{return null;}
}
