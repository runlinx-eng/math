// Partitive division of a source fraction: follow the recorded identities of
// its subdivided pieces, and independently check each share and multiplication
// back to the original amount. The reference bar and equal cuts are generated
// by the tool; a saved story is not an assessed explanation or authorship claim.
import * as original from './phase5/b18-model.js';
import {rational as originalRational} from './phase5/b16-model.js';
import {frac as originalFraction} from './phase5/b17-model.js';
import {isEvidenceContext,matchesNativeEvidenceTask,hasExactKeys as keys,sameEvidence as same} from './evidence-contract.js';

const SOURCES=Object.freeze({
 sharesmallpart:{indices:[0,1,2],nodeId:'mt_ifPDOYvUqm'},
 fractiondividewords:{indices:[0,2],nodeId:'mt_rCMdwG-YOE'}
});

export function fracShareBinding(task,context={}){
 if(!isEvidenceContext(context))return null;
 const source=Object.hasOwn(SOURCES,context.sessionId)?SOURCES[context.sessionId]:null;
 if(!source||!source.indices.includes(context.index)||
    !matchesNativeEvidenceTask(task,context,{type:'x-fracshare',nodeId:source.nodeId}))return null;
 return {nodeId:source.nodeId,method:null,
  question:'原来这一小份全部分完了吗？每人拿到多少个同样的小块，每小块和每人的量各是原来整个的多少？把每人的量乘回人数，会回到哪个量？'};
}

const DEFAULTS=Object.freeze({guess:'',equation:'',answer:'',whole:'',part:'',factor:'',choice:'',low:'',high:'',
 inside:'',story:'',tile:'',count:'',simple:'',inverse:'',scaledA:'',scaledB:'',decimal:'',denom:'',unit:'',amount:'',result:''});
const FIELD_KEYS=Object.keys(DEFAULTS),SHARE_FIELDS=['guess','factor','answer','equation','story'];
const text=value=>typeof value==='string'&&value.length<=1000,cp=value=>structuredClone(value);
const integer=(value,lo,hi)=>Number.isSafeInteger(value)&&value>=lo&&value<=hi;
const gcd=(a,b)=>{a=a<0n?-a:a;while(b)[a,b]=[b,a%b];return a;};
const reduce=(n,d)=>{const g=gcd(n,d);return[n/g,d/g];};
const equal=(a,b)=>!!a&&!!b&&a[0]*b[1]===b[0]*a[1];
const multiply=(a,b)=>reduce(a[0]*b[0],a[1]*b[1]);
const big=pair=>pair.map(BigInt);
function pair(value){
 const out=value.map(Number);if(!out.every(Number.isSafeInteger))throw new RangeError('Unsafe fraction-share quantity');return out;
}

// Parse the original digits exactly, including the original finite limits.
// Guesses additionally permit B17 percentage notation; final answers and the
// inverse equation use B16 rational notation and must not inherit that option.
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
 return exact&&accepted&&accepted.every(Number.isSafeInteger)&&equal(exact,big(accepted))?exact:null;
}

const knownTask=task=>Object.entries(SOURCES).some(([sessionId,source])=>source.indices.some(index=>
 matchesNativeEvidenceTask(task,{sessionId,index},{type:'x-fracshare',nodeId:source.nodeId})));
const initial=()=>({started:false,factor:0,selected:0,owners:[],first:null});
const visible=(task,board)=>[...(board.started?['factor',...(board.factor?['answer','equation']:[])]:['guess']),...(task.story?['story']:[])];
// A historical 801..1000-character story is still a valid original record.
// This new source proof only covers the current textarea's 800-character
// input range; no stored text is truncated, removed or migrated here.
const fieldsValid=fields=>FIELD_KEYS.every(key=>text(fields[key]))&&fields.story.length<=800;
const fieldSnapshot=fields=>Object.fromEntries(SHARE_FIELDS.map(key=>[key,fields[key]]));
const construction=board=>({started:board.started,factor:board.factor,selected:board.selected,owners:[...board.owners]});
const canonicalIndex=(raw,max)=>text(raw)&&/^(?:0|[1-9]\d*)$/.test(raw)&&
 integer(Number(raw),0,max)&&String(Number(raw))===raw?Number(raw):null;
const cutIssue='再分以后，要能让每个人拿到同样多的小块。可以换一种分法。';

function inverse(raw,share,people,total){
 if(!text(raw))return null;
 const sides=raw.trim().replace(/[×·]/g,'*').split('=');if(sides.length!==2)return null;
 const factors=sides[0].split('*');if(factors.length!==2)return null;
 const a=written(factors[0]),b=written(factors[1]),right=written(sides[1]);
 if(!equal(right,total)||!(equal(a,share)&&equal(b,people)||equal(a,people)&&equal(b,share)))return null;
 const product=multiply(a,b);if(!equal(product,total))return null;
 return {raw,factors:factors.map((value,index)=>({raw:value,value:pair(index?b:a),
  role:equal(index?b:a,share)?'per-person':'people'})),total:{raw:sides[1],value:pair(right)},product:pair(product),submissionOnly:true};
}

export function replayFracShareEvidence(task,model){
 try{
  if(!knownTask(task)||!keys(model,[...FIELD_KEYS,'board','history','issue'])||!fieldsValid(model)||
     !text(model.issue)||!Array.isArray(model.history)||!model.history.length||model.history.length>1200)return null;
  const n=BigInt(task.n),d=BigInt(task.d),people=BigInt(task.people),originalQuantity=reduce(n,d),result=reduce(n,d*people);
  let board=initial(),previous={...DEFAULTS},issue='',firstGuess=null,currentGuess=null,currentCutHistoryIndex=null,
   recipientSelectionHistoryIndex=null;
  const events=[],failedRequests=[],resets=[],cutRequests=[],assignments=[],recipientSelections=[];
  for(const [historyIndex,event]of model.history.entries()){
   if(!keys(event,['a','d','f'])||!['start','cut','person','give','reset'].includes(event.a)||
      !keys(event.d,['person','give'].includes(event.a)?['index']:[])||!keys(event.f,FIELD_KEYS)||!fieldsValid(event.f))return null;
   const fields=event.f,editable=visible(task,board);
   if(FIELD_KEYS.some(key=>!editable.includes(key)&&fields[key]!==previous[key]))return null;
   const before=construction(board),step={historyIndex,action:event.a,fields:fieldSnapshot(fields),before,
    accepted:true,constructionChanged:false,firstStored:false,issue:''};
   issue='';
   if(event.a==='reset'){
    const first=board.first;board=initial();board.first=first;currentGuess=null;currentCutHistoryIndex=null;recipientSelectionHistoryIndex=null;
   }else if(event.a==='start'){
    if(board.started)return null;
    const guess=written(fields.guess,true);
    if(!guess){
     // The source records this visible request but emits no error message.
     // Do not invent a hint or turn an invalid request into a successful start.
     step.accepted=false;step.reason='invalid-guess';
    }else{
     currentGuess={raw:fields.guess,value:pair(guess),historyIndex,matchesResult:equal(guess,result)};
     if(board.first===null){board.first=fields.guess;firstGuess=cp(currentGuess);step.firstStored=true;}
     board.started=true;step.guess=cp(currentGuess);
    }
   }else if(event.a==='cut'){
    if(!board.started)return null;
    // Preserve the source's small-integer Number normalization, including a
    // text count such as 0x4. Do not call its raw spelling exact rational input.
    const factor=Number(fields.factor);step.requestedFactor=fields.factor;
    if(!integer(factor,1,40)||d*BigInt(factor)>120n||n*BigInt(factor)%people!==0n){
     step.accepted=false;step.reason='invalid-cut';issue=cutIssue;
    }else{
     step.previousCutHistoryIndex=currentCutHistoryIndex;step.discardedOwners=[...board.owners];
     board.factor=factor;board.owners=Array(Number(n*BigInt(factor))).fill(-1);currentCutHistoryIndex=historyIndex;
     step.factor=factor;step.wholeParts=Number(d*BigInt(factor));step.totalPieces=board.owners.length;
     step.pieceValue=pair(reduce(1n,d*BigInt(factor)));
     // Successful recutting deliberately retains the selected recipient.
    }
   }else{
    if(!board.started||!board.factor)return null;
    if(event.a==='person'){
     const person=canonicalIndex(event.d.index,task.people-1);if(person===null)return null;
     step.person=person;step.previousPerson=board.selected;board.selected=person;recipientSelectionHistoryIndex=historyIndex;
    }else{
     const pieceId=canonicalIndex(event.d.index,board.owners.length-1);if(pieceId===null)return null;
     const fromOwner=board.owners[pieceId],toOwner=fromOwner===board.selected?-1:board.selected;
     board.owners[pieceId]=toOwner;
     Object.assign(step,{pieceId,fromOwner,toOwner,selectedPerson:board.selected,
      change:toOwner===-1?'withdraw':fromOwner===-1?'assign':'transfer',
      cutHistoryIndex:currentCutHistoryIndex,recipientSelectionHistoryIndex,
      recipientSelectionOrigin:recipientSelectionHistoryIndex===null?'tool-default':'recorded-person-selection',
      pieceValue:pair(reduce(1n,d*BigInt(board.factor)))});
    }
   }
   previous={...fields};step.after=construction(board);step.constructionChanged=!same(before,step.after);step.issue=issue;
   events.push(step);if(!step.accepted)failedRequests.push(step);
   if(event.a==='reset')resets.push(step);if(event.a==='cut')cutRequests.push(step);
   if(event.a==='give')assignments.push(step);if(event.a==='person')recipientSelections.push(step);
  }
  const editable=visible(task,board);
  if(FIELD_KEYS.some(key=>!editable.includes(key)&&model[key]!==previous[key])||!same(board,model.board)||
     model.issue!==issue||!board.started||!board.factor||Number(model.factor)!==board.factor||
     currentCutHistoryIndex===null||!firstGuess||!currentGuess)return null;
  const factor=BigInt(board.factor),wholeParts=d*factor,totalPieces=n*factor,pieceValue=reduce(1n,wholeParts);
  if(BigInt(board.owners.length)!==totalPieces||board.owners.some(person=>!integer(person,0,task.people-1)))return null;
  const recipients=Array.from({length:task.people},(_,person)=>{
   const pieceIds=board.owners.flatMap((owner,index)=>owner===person?[index]:[]);
   return {person,pieceIds,count:pieceIds.length,amount:pair(multiply(pieceValue,[BigInt(pieceIds.length),1n]))};
  });
  if(recipients.some(person=>BigInt(person.count)*people!==totalPieces||!equal(big(person.amount),result))||
     recipients.reduce((count,person)=>count+person.count,0)!==board.owners.length)return null;
  const answer=written(model.answer),equation=inverse(model.equation,result,[people,1n],originalQuantity);
  if(!equal(answer,result)||!equation||task.story&&!model.story.trim())return null;
  // Compatibility follows independent action replay, conservation, equal
  // shares, the final answer and inverse equation. Original inspect is not
  // used as a mathematical proof; its original grading remains untouched.
  if(!original.valid(task,model))return null;
  return {originalQuantity:pair(originalQuantity),referenceWhole:[1,1],people:task.people,unit:task.unit||'',
   factor:board.factor,factorInput:{raw:model.factor,normalized:board.factor,toolNormalized:true},
   pieceValue:pair(pieceValue),totalPieces:Number(totalPieces),wholeParts:Number(wholeParts),result:pair(result),
   owners:[...board.owners],recipients,selectedRecipient:board.selected,currentCutHistoryIndex,
   answer:{raw:model.answer,value:pair(answer),submissionOnly:true},inverse:equation,
   firstGuess:cp(firstGuess),currentGuess:cp(currentGuess),events,failedRequests,resets,cutRequests,assignments,recipientSelections,
   story:{required:!!task.story,raw:model.story,provided:!!model.story.trim(),meaningAssessed:false,authorshipAssessed:false},
   issue,eventCount:model.history.length,
   systemGenerated:{referenceWholeBar:true,equalSubdivision:true,ownerColorDisplay:true,
    recipientPieceCounts:true,defaultRecipient:0,countInputNormalization:true},
   assessmentLimits:{writtenQuantitiesAreSubmissions:true,exactKeystrokeOrderKnown:false,physicalActionAssessed:false,
    independentDrawingAssessed:false,openExplanationAssessed:false,storyMeaningAssessed:false,storyAuthorshipAssessed:false,
    generalMasteryAssessed:false,recordingLimit:1200,allLaterClicksRecorded:false,method:null}};
 }catch{return null;}
}
