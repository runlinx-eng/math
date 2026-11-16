// Verify recorded group boundaries and saved fraction decompositions. The
// source grades its saved collection; a later unsaved draft can still be
// wrong. Keep those two claims separate, without changing the original task.
import * as original from './phase5/b18-model.js';
import {rational as originalRational} from './phase5/b16-model.js';
import {frac as originalFraction} from './phase5/b17-model.js';
import {isEvidenceContext,matchesNativeEvidenceTask,hasExactKeys as keys,sameEvidence as same} from './evidence-contract.js';

const SOURCE=Object.freeze({sessionId:'splitfraction',indices:[0,1,2],nodeId:'mt_VgOePicFYK'});

export function fracDecomposeBinding(task,context={}){
 if(!isEvidenceContext(context)||context.sessionId!==SOURCE.sessionId||!SOURCE.indices.includes(context.index)||
    !matchesNativeEvidenceTask(task,context,{type:'x-fracdecompose',nodeId:SOURCE.nodeId}))return null;
 return {nodeId:SOURCE.nodeId,method:null,
  question:'每组有几个原来的小份？写下的每一项对应哪一组，接起来是否还是原来的量？只是交换先后，算新的分法吗？'};
}

const DEFAULTS=Object.freeze({guess:'',equation:'',answer:'',whole:'',part:'',factor:'',choice:'',low:'',high:'',
 inside:'',story:'',tile:'',count:'',simple:'',inverse:'',scaledA:'',scaledB:'',decimal:'',denom:'',unit:'',amount:'',result:''});
const FIELD_KEYS=Object.keys(DEFAULTS),cp=value=>structuredClone(value);
const text=value=>typeof value==='string'&&value.length<=1000;
const fieldsValid=fields=>FIELD_KEYS.every(key=>text(fields[key])&&(key==='equation'||fields[key]===DEFAULTS[key]));
const gcd=(a,b)=>{a=a<0n?-a:a;while(b)[a,b]=[b,a%b];return a;};
const reduce=(n,d)=>{const g=gcd(n,d);return[n/g,d/g];};
const equal=(a,b)=>!!a&&!!b&&a[0]*b[1]===b[0]*a[1];
const add=(a,b)=>reduce(a[0]*b[1]+b[0]*a[1],a[1]*b[1]);
const pair=value=>{const result=value.map(Number);return result.every(Number.isSafeInteger)?result:null;};
const canonical=parts=>[...parts].sort((a,b)=>a-b),partKey=parts=>canonical(parts).join(',');
const groups=(task,cuts)=>{const ends=[0,...cuts,task.n];return ends.slice(1).map((end,index)=>end-ends[index]);};
const initial=()=>({cuts:[],saved:[],first:null});
const construction=(task,board)=>({cuts:[...board.cuts],parts:groups(task,board.cuts),savedCount:board.saved.length});
const knownTask=task=>SOURCE.indices.some(index=>matchesNativeEvidenceTask(task,
 {sessionId:SOURCE.sessionId,index},{type:'x-fracdecompose',nodeId:SOURCE.nodeId}));
const canonicalIndex=(raw,max)=>text(raw)&&/^[1-9]\d*$/.test(raw)&&Number.isSafeInteger(Number(raw))&&
 Number(raw)<=max&&String(Number(raw))===raw?Number(raw):null;
const equationIssue='每组有几小份，就写出那组的量；等号两边要保留原来的总量。';
const duplicateIssue='交换先后还是同一组拆法。试着改变每组拿几份。';

// Parse source-accepted notation from its digits with BigInt. B16 applies to
// the left side; B17 additionally permits percentages in right-hand terms.
// The original parsers only confirm grammar compatibility, not the proof.
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
function written(raw,allowPercent=false){
 const exact=amount(raw,allowPercent),accepted=allowPercent?originalFraction(raw):originalRational(raw);
 return exact&&accepted&&accepted.every(Number.isSafeInteger)&&equal(exact,accepted.map(BigInt))?exact:null;
}

function equation(task,raw,parts){
 const sides=raw.trim().split('='),leftRaw=sides.length===2?sides[0]:null,
  termRaws=sides.length===2?sides[1].split('+'):[],left=leftRaw===null?null:written(leftRaw),
  values=termRaws.map(term=>written(term,true)),total=reduce(BigInt(task.n),BigInt(task.d));
 const syntaxValid=sides.length===2&&!!left&&values.length>0&&values.every(value=>!!value);
 const terms=termRaws.map((term,index)=>{
  const value=values[index],units=value?value[0]*BigInt(task.d):0n;
  const pieces=value&&value[0]>0n&&units%value[1]===0n&&units/value[1]<=200n?Number(units/value[1]):null;
  return {raw:term,value:value?pair(value):null,pieces};
 });
 const sum=values.length&&values.every(value=>!!value)?values.reduce(add,[0n,1n]):null,
  leftMatchesTotal=equal(left,total),rightMatchesTotal=equal(sum,total),
  matchesGroups=terms.length===parts.length&&terms.every(term=>term.pieces!==null)&&
   partKey(terms.map(term=>term.pieces))===partKey(parts),
  matchesTotal=leftMatchesTotal&&rightMatchesTotal;
 return {raw,left:{raw:leftRaw,value:left?pair(left):null},terms,
  // An erroneous sum may exceed JSON's safe integer range. Preserve its
  // exact digits without rounding or rejecting a later legitimate correction.
  sum:sum?pair(sum):null,sumExact:sum?sum.map(String):null,syntaxValid,
  leftMatchesTotal,rightMatchesTotal,matchesTotal,matchesGroups,
  valid:syntaxValid&&matchesTotal&&matchesGroups};
}
function decomposition(task,cuts,raw){
 const parts=groups(task,cuts),equationResult=equation(task,raw,parts);
 return {cuts:[...cuts],parts,groupQuantities:parts.map(n=>pair(reduce(BigInt(n),BigInt(task.d)))),
  canonicalParts:canonical(parts),canonicalKey:partKey(parts),isSplit:parts.length>1,
  equation:equationResult,mathematicalMatch:parts.length>1&&equationResult.valid};
}

export function replayFracDecomposeEvidence(task,model){
 try{
  if(!knownTask(task)||!keys(model,[...FIELD_KEYS,'board','history','issue'])||!fieldsValid(model)||
     !text(model.issue)||!Array.isArray(model.history)||!model.history.length||model.history.length>1200)return null;
  let board=initial(),issue='',firstAttempt=null,currentRoundFirstAttempt=null,savedDecompositions=[];
  const events=[],failedRequests=[],resets=[],newGroups=[];
  for(const [historyIndex,event]of model.history.entries()){
   if(!keys(event,['a','d','f'])||!['cut','save','new-groups','reset'].includes(event.a)||
      !keys(event.d,event.a==='cut'?['index']:[])||!keys(event.f,FIELD_KEYS)||!fieldsValid(event.f))return null;
   const before=construction(task,board),step={historyIndex,action:event.a,fields:{equation:event.f.equation},before,
    accepted:true,constructionChanged:false,firstStored:false,currentRoundFirstStored:false,issue:''};
   issue='';
   if(event.a==='cut'){
    const index=canonicalIndex(event.d.index,task.n-1);if(index===null)return null;
    step.index=index;step.change=board.cuts.includes(index)?'join':'split';
    board.cuts=board.cuts.includes(index)?board.cuts.filter(cut=>cut!==index):[...board.cuts,index].sort((a,b)=>a-b);
   }else if(event.a==='new-groups'){
    board.cuts=[];
   }else if(event.a==='reset'){
    const first=board.first;board=initial();board.first=first;
    savedDecompositions=[];currentRoundFirstAttempt=null;
   }else{
    const draft=decomposition(task,board.cuts,event.f.equation);
    step.decomposition=draft;
    if(board.first===null){board.first={parts:[...draft.parts],equation:event.f.equation};step.firstStored=true;}
    step.currentRoundFirstStored=currentRoundFirstAttempt===null;
    const duplicateIndex=savedDecompositions.findIndex(saved=>saved.canonicalKey===draft.canonicalKey);
    if(!draft.mathematicalMatch){
     step.accepted=false;step.failureReason=draft.isSplit?'equation-mismatch':'not-split';issue=equationIssue;
    }else if(duplicateIndex>=0){
     step.accepted=false;step.failureReason='duplicate';step.duplicateOfSavedIndex=duplicateIndex;issue=duplicateIssue;
    }else{
     step.savedIndex=board.saved.length;
     board.saved.push({parts:[...draft.parts],equation:event.f.equation});
     savedDecompositions.push({historyIndex,...cp(draft)});
    }
   }
   step.after=construction(task,board);step.constructionChanged=!same(before,step.after);step.issue=issue;
   events.push(step);if(!step.accepted)failedRequests.push(step);
   if(event.a==='reset')resets.push(step);if(event.a==='new-groups')newGroups.push(step);
   if(event.a==='save'){
    if(step.firstStored)firstAttempt=cp(step);
    if(step.currentRoundFirstStored)currentRoundFirstAttempt=cp(step);
   }
  }
  if(!same(board,model.board)||model.issue!==issue||!firstAttempt||!currentRoundFirstAttempt)return null;
  const minimumSaved=task.count||task.required?.length||1,
   requiredCanonicalParts=(task.required||[]).map(canonical),requiredCanonicalKeys=requiredCanonicalParts.map(partKey),
   matchedSavedIndices=requiredCanonicalKeys.map(key=>savedDecompositions.findIndex(saved=>saved.canonicalKey===key));
  if(savedDecompositions.length<minimumSaved||matchedSavedIndices.some(index=>index<0))return null;
  const currentDraft=decomposition(task,board.cuts,model.equation);
  currentDraft.matchingSavedIndices=savedDecompositions.flatMap((saved,index)=>
   same(saved.cuts,currentDraft.cuts)&&saved.equation.raw===currentDraft.equation.raw?[index]:[]);
  currentDraft.sameDecompositionSavedIndices=savedDecompositions.flatMap((saved,index)=>saved.canonicalKey===currentDraft.canonicalKey?[index]:[]);
  currentDraft.savedSnapshotMatches=currentDraft.matchingSavedIndices.length>0;
  currentDraft.unsaved=!currentDraft.savedSnapshotMatches;
  currentDraft.equationStatus=!model.equation.trim()?'blank':!currentDraft.equation.syntaxValid?'invalid-syntax':
   !currentDraft.equation.valid?'does-not-match-groups':'matches-groups';
  currentDraft.canSaveAsNew=currentDraft.mathematicalMatch&&!currentDraft.sameDecompositionSavedIndices.length;
  // Original validity is a final compatibility check, after independent
  // BigInt arithmetic, source-goal validation and complete visible replay.
  // It does not provide the mathematical proof or require a correct draft.
  if(!original.valid(task,model))return null;
  return {totalQuantity:pair(reduce(BigInt(task.n),BigInt(task.d))),unitValue:pair(reduce(1n,BigInt(task.d))),
   pieceCount:task.n,referenceWhole:[1,1],savedDecompositions,currentDraft,firstAttempt,currentRoundFirstAttempt,
   events,failedRequests,resets,newGroups,
   goal:{minimumSaved,distinctSaved:savedDecompositions.length,requiredCanonicalParts,requiredCanonicalKeys,
    matchedSavedIndices,completed:true},issue,eventCount:model.history.length,
   systemGenerated:{initialUnitPieces:true,groupedDiagram:true,groupPieceCounts:true,savedEquationDisplay:true},
   assessmentLimits:{savedFormsVerified:true,currentDraftSeparatelyAssessed:true,writtenEquationsAreSubmissions:true,
    equationTermOrderDoesNotIdentifyVisualGroup:true,exactKeystrokeOrderKnown:false,physicalActionAssessed:false,
    independentDrawingAssessed:false,openExplanationAssessed:false,authorshipAssessed:false,generalMasteryAssessed:false,
    recordingLimit:1200,allLaterClicksRecorded:false,historyCompletenessAuthenticated:false,method:null}};
 }catch{return null;}
}
