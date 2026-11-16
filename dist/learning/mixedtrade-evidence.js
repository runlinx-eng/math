// Recorded exchanges of whole units and equal fractional pieces. The tool
// supplies the initial stock (including addition's combined stock); this proof
// follows visible exchanges/removals, not a claim that the learner drew it.
import * as original from './phase5/b18-model.js';
import {rational as originalRational} from './phase5/b16-model.js';
import {frac as originalFraction} from './phase5/b17-model.js';
import {isEvidenceContext,matchesNativeEvidenceTask,hasExactKeys as keys,sameEvidence as same} from './evidence-contract.js';

const SOURCE='mt_70qDTI14td',INDICES=[0,1,2];
export function mixedTradeBinding(task,context={}){
 if(!isEvidenceContext(context)||context.sessionId!=='mixedexchange'||!INDICES.includes(context.index)||
    !matchesNativeEvidenceTask(task,context,{type:'x-mixedtrade',nodeId:SOURCE}))return null;
 return {nodeId:SOURCE,method:null,
  question:'一个整体能换成几个同样的小份？换开或合起来时总量变了吗？减法实际拿走了多少，最后的整体、零头和总量能对上吗？'};
}

const DEFAULTS=Object.freeze({guess:'',equation:'',answer:'',whole:'',part:'',factor:'',choice:'',low:'',high:'',
 inside:'',story:'',tile:'',count:'',simple:'',inverse:'',scaledA:'',scaledB:'',decimal:'',denom:'',unit:'',amount:'',result:''});
const FIELD_KEYS=Object.keys(DEFAULTS),MIXED_FIELDS=['guess','whole','part','answer'];
const text=value=>typeof value==='string'&&value.length<=1000,cp=value=>structuredClone(value);
const gcd=(a,b)=>{a=a<0n?-a:a;while(b)[a,b]=[b,a%b];return a;};
const reduce=(n,d)=>{const g=gcd(n,d);return[n/g,d/g];};
const equal=(a,b)=>!!a&&!!b&&a[0]*b[1]===b[0]*a[1];
const pair=value=>{const out=value.map(Number);if(!out.every(Number.isSafeInteger))throw new RangeError('Unsafe mixed quantity');return out;};

// Retain the original input grammar and finite bounds, but compare the written
// digits with BigInt. A prediction may use B17's percent notation; the three
// final quantity fields continue to use B16's original rational grammar.
function amount(raw,allowPercent=false){
 if(!text(raw))return null;
 let s=raw.trim().replace(/[−–]/g,'-'),percent=false,n,d,m;
 if(allowPercent&&s.endsWith('%')){percent=true;s=s.slice(0,-1).trim();}
 if((m=/^(-?)(\d+)\s+(\d+)\/(\d+)$/.exec(s))){
  d=BigInt(m[4]);const part=BigInt(m[3]);if(d<1n||part>=d)return null;
  n=BigInt(m[2])*d+part;if(m[1])n=-n;
 }else if((m=/^(-?\d+)\/(\d+)$/.exec(s))){n=BigInt(m[1]);d=BigInt(m[2]);}
 else if((m=/^([+-]?)(\d+)(?:\.(\d+))?$/.exec(s))){
  const decimals=m[3]||'';if(decimals.length>8)return null;
  d=10n**BigInt(decimals.length);n=BigInt(m[2])*d+BigInt(decimals||'0');if(m[1]==='-')n=-n;
 }else return null;
 if(d<1n||d>100000000n||n< -1000000000000n||n>1000000000000n)return null;
 if(percent)d*=100n;return reduce(n,d);
}
function written(raw,guess=false){
 const exact=amount(raw,guess),accepted=guess?originalFraction(raw):originalRational(raw);
 return exact&&accepted&&accepted.every(Number.isSafeInteger)&&equal(exact,accepted.map(BigInt))?exact:null;
}

const knownTask=task=>INDICES.some(index=>matchesNativeEvidenceTask(task,{sessionId:'mixedexchange',index},
 {type:'x-mixedtrade',nodeId:SOURCE}));
const initial=()=>({started:false,w:0,p:0,takenW:0,takenP:0,trades:0,first:null});
const construction=board=>({started:board.started,w:board.w,p:board.p,takenW:board.takenW,takenP:board.takenP,trades:board.trades});
const visible=board=>board.started?['whole','part','answer']:['guess'];
const fieldSnapshot=fields=>Object.fromEntries(MIXED_FIELDS.map(key=>[key,fields[key]]));
const wholeIssue='现在没有足够的一整份可以拿走。';
const pieceIssue='小份不够了，可以把一个整体换开；量不会变。';

export function replayMixedTradeEvidence(task,model){
 try{
  if(!knownTask(task)||!keys(model,[...FIELD_KEYS,'board','history','issue'])||!FIELD_KEYS.every(key=>text(model[key]))||
     !text(model.issue)||!Array.isArray(model.history)||!model.history.length||model.history.length>1200)return null;
  const d=BigInt(task.d),aUnits=BigInt(task.a[0])*d+BigInt(task.a[1]),bUnits=BigInt(task.b[0])*d+BigInt(task.b[1]),
   initialUnits=task.op==='+'?aUnits+bUnits:aUnits,resultUnits=task.op==='+'?aUnits+bUnits:aUnits-bUnits,
   result=reduce(resultUnits,d),quantity=units=>pair(reduce(units,d)),
   remaining=board=>BigInt(board.w)*d+BigInt(board.p),removed=board=>BigInt(board.takenW)*d+BigInt(board.takenP);
  let board=initial(),previous={...DEFAULTS},issue='',firstGuess=null,currentGuess=null;
  const events=[],failedRequests=[],resets=[],exchanges=[],removals=[];
  for(const [historyIndex,event]of model.history.entries()){
   if(!keys(event,['a','d','f'])||!['start','split','merge','all-pieces','take-whole','take-part','reset'].includes(event.a)||
      !keys(event.d,[])||!keys(event.f,FIELD_KEYS)||!FIELD_KEYS.every(key=>text(event.f[key])))return null;
   const fields=event.f,editable=visible(board);
   if(FIELD_KEYS.some(key=>!editable.includes(key)&&fields[key]!==previous[key]))return null;
   const before=construction(board),beforeUnits=remaining(board),beforeRemoved=removed(board),
    step={historyIndex,action:event.a,fields:fieldSnapshot(fields),before,accepted:true,constructionChanged:false,firstStored:false,issue:''};
   issue='';
   if(event.a==='reset'){
    const first=board.first;board=initial();board.first=first;currentGuess=null;
   }else if(event.a==='start'){
    if(board.started)return null;
    const guess=written(fields.guess,true);
    if(!guess){step.accepted=false;step.reason='invalid-guess';}
    else{
     currentGuess={raw:fields.guess,value:pair(guess),historyIndex,matchesResult:equal(guess,result)};
     if(board.first===null){board.first=fields.guess;firstGuess=cp(currentGuess);step.firstStored=true;}
     board.started=true;board.w=task.a[0]+(task.op==='+'?task.b[0]:0);board.p=task.a[1]+(task.op==='+'?task.b[1]:0);
     board.takenW=0;board.takenP=0;board.trades=0;step.guess=cp(currentGuess);step.stockGeneratedByTool=true;
    }
   }else{
    if(!board.started)return null;
    if(event.a==='split'||event.a==='all-pieces'){
     if(board.w<=0)return null; // Both controls are disabled when no whole remains.
     const wholes=event.a==='split'?1:board.w;
     board.w-=wholes;board.p+=wholes*task.d;board.trades+=wholes;
     step.wholesExchanged=wholes;step.piecesExchanged=wholes*task.d;step.direction='whole-to-pieces';
    }else if(event.a==='merge'){
     if(board.p<task.d)return null;
     board.p-=task.d;board.w++;board.trades++;
     step.wholesExchanged=1;step.piecesExchanged=task.d;step.direction='pieces-to-whole';
    }else if(event.a==='take-whole'){
     if(task.op!=='-'||board.takenW>=task.b[0])return null;
     if(board.w>0){board.w--;board.takenW++;step.removedAs='whole-token';step.takenUnits=task.d;}
     else if(board.p>=task.d){board.p-=task.d;board.takenW++;step.removedAs='fraction-pieces';step.takenUnits=task.d;}
     else{step.accepted=false;step.reason='insufficient-whole';issue=wholeIssue;}
    }else if(event.a==='take-part'){
     if(task.op!=='-'||board.takenP>=task.b[1])return null;
     if(board.p>0){board.p--;board.takenP++;step.removedAs='fraction-pieces';step.takenUnits=1;}
     else{step.accepted=false;step.reason='insufficient-pieces';issue=pieceIssue;}
    }
   }
   const afterUnits=remaining(board),afterRemoved=removed(board);
   if(board.started&&(afterUnits<0n||afterRemoved<0n||afterUnits+afterRemoved!==initialUnits))return null;
   if(before.started&&board.started){
    const delta=step.takenUnits?BigInt(step.takenUnits):0n;
    if(afterUnits!==beforeUnits-delta||afterRemoved!==beforeRemoved+delta)return null;
   }
   previous={...fields};Object.assign(step,{after:construction(board),remainingUnitsBefore:Number(beforeUnits),
    remainingUnitsAfter:Number(afterUnits),removedUnitsBefore:Number(beforeRemoved),removedUnitsAfter:Number(afterRemoved),
    quantityBefore:quantity(beforeUnits),quantityAfter:quantity(afterUnits),issue});
   step.constructionChanged=!same(before,step.after);events.push(step);
   if(!step.accepted)failedRequests.push(step);if(event.a==='reset')resets.push(step);
   if(['split','merge','all-pieces'].includes(event.a))exchanges.push(step);
   if(['take-whole','take-part'].includes(event.a))removals.push(step);
  }
  const editable=visible(board),whole=written(model.whole),part=written(model.part),answer=written(model.answer);
  if(FIELD_KEYS.some(key=>!editable.includes(key)&&model[key]!==previous[key])||!same(board,model.board)||model.issue!==issue||
     !board.started||!firstGuess||!currentGuess||task.trade&&board.trades===0||board.p>=task.d||
     remaining(board)!==resultUnits||removed(board)!==(task.op==='-'?bUnits:0n)||
     task.op==='-'&&(board.takenW!==task.b[0]||board.takenP!==task.b[1])||
     !equal(whole,[BigInt(board.w),1n])||!equal(part,[BigInt(board.p),d])||!equal(answer,result))return null;
  if(!original.valid(task,model))return null;
  return {operation:task.op,denominator:task.d,unitValue:quantity(1n),operandA:quantity(aUnits),operandB:quantity(bUnits),
   initialQuantity:quantity(initialUnits),result:pair(result),remainingQuantity:quantity(remaining(board)),removedQuantity:quantity(removed(board)),
   finalConstruction:construction(board),whole:{raw:model.whole,value:pair(whole),submissionOnly:true},
   part:{raw:model.part,value:pair(part),submissionOnly:true},answer:{raw:model.answer,value:pair(answer),submissionOnly:true},
   firstGuess:cp(firstGuess),currentGuess:cp(currentGuess),events,failedRequests,resets,exchanges,removals,issue,eventCount:model.history.length,
   systemGenerated:{referenceWhole:true,initialStock:true,combinedAddends:task.op==='+',quantityCaptions:true},
   assessmentLimits:{writtenQuantitiesAreSubmissions:true,exactKeystrokeOrderKnown:false,physicalActionAssessed:false,
    independentDrawingAssessed:false,openExplanationAssessed:false,generalMasteryAssessed:false,
    recordingLimit:1200,allLaterClicksRecorded:false,method:null}};
 }catch{return null;}
}
