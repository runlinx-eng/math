// Source-bound finite/repeating decimal work. The learner enters factors,
// predictions, quotient digits and remainders; the tool supplies normalization,
// next-row quantities, units and the repeated-remainder notice. None of those
// system outputs establishes independent discovery or a general proof.
import * as original from './phase5/b17-model.js';
import {isEvidenceContext,matchesNativeEvidenceTask,hasExactKeys as keys,sameEvidence as same} from './evidence-contract.js';

const SOURCES=Object.freeze({
 fdpswitch:{indices:[0,3],nodeId:'mt_4K1dr204Hi'},
 decimalstops:{indices:[2,3,4,5],nodeId:'mt_SBkTGjiZjZ'}
});
export function decimalEngineBinding(task,context={}){
 if(!isEvidenceContext(context))return null;
 const source=Object.hasOwn(SOURCES,context.sessionId)?SOURCES[context.sessionId]:null;
 if(!source||!source.indices.includes(context.index)||
    !matchesNativeEvidenceTask(task,context,{type:'x-decimalengine',nodeId:source.nodeId}))return null;
 return{nodeId:source.nodeId,method:null,
  question:'预测时看的是约分前还是约分后的分母？这一行的余数怎样成为下一行的输入？若余数重复，重复前有没有不重复的部分？'};
}

const DEFAULTS=Object.freeze({answer:'',fraction:'',decimal:'',factor:'2',denom:'',num:'',position:'',left:'',right:'',
 prediction:'',relation:'',reason:'',hcf:'',q:'',remainder:'',kind:'',percent:'',amount:'',multiplier:'',divisor:'1',offset:'0',
 n:'',aform:'',bform:'',whole:'',part:'',angle:'0',equation:''});
const FIELD_KEYS=Object.keys(DEFAULTS),RELEVANT=['fraction','factor','kind','q','remainder','answer','reason'];
const text=value=>typeof value==='string'&&value.length<=500,cp=value=>structuredClone(value);
const dense=value=>Array.isArray(value)&&Object.keys(value).length===value.length&&Object.keys(value).every((key,index)=>key===String(index));
const integer=(value,lo,hi)=>Number.isSafeInteger(value)&&value>=lo&&value<=hi;
const gcd=(a,b)=>{a=a<0n?-a:a;while(b)[a,b]=[b,a%b];return a;};
const reduce=(n,d)=>{const g=gcd(n,d);return[n/g,d/g];};
const pair=value=>{const result=value.map(Number);if(!result.every(Number.isSafeInteger))throw Error('Unsafe exact quantity');return result;};
const quantity=(n,d=1n)=>pair(reduce(n,d));
const equal=(a,b)=>!!a&&!!b&&a[0]*b[1]===b[0]*a[1];
const prime=value=>{
 if(!integer(value,2,10000))return false;
 const n=BigInt(value);for(let divisor=2n;divisor*divisor<=n;divisor++)if(n%divisor===0n)return false;return true;
};
const interpreted=raw=>{const value=Number(raw),finite=Number.isFinite(value);
 return{raw,value:finite?value:null,finite,integer:Number.isSafeInteger(value),numberSemantics:true};};
const knownTask=task=>Object.entries(SOURCES).some(([sessionId,source])=>source.indices.some(index=>
 matchesNativeEvidenceTask(task,{sessionId,index},{type:'x-decimalengine',nodeId:source.nodeId})));
const initial=()=>({simple:null,factorLeft:null,factors:[],prediction:null,first:null,rows:[],remainder:null,remainders:[],stop:false,cycle:null});
const phase=board=>!board.simple?'reduction':board.factorLeft>1?'factorization':!board.prediction?'prediction':!board.stop?'division':'finished';
const WINDOWS={
 reduction:{fields:['fraction'],actions:['reduce','reset']},
 factorization:{fields:['factor'],actions:['factor','reset']},
 prediction:{fields:['kind'],actions:['predict-stop','reset']},
 division:{fields:['q','remainder'],actions:['digit','reset']},
 finished:{fields:['kind','answer','reason'],actions:['predict-stop','reset']}
};
function allowedFields(board,fields,previous){
 const visible=WINDOWS[phase(board)].fields;
 return FIELD_KEYS.every(key=>text(fields[key])&&(visible.includes(key)||fields[key]===previous[key]))&&
  ['','stop','repeat'].includes(fields.kind)&&['','base-ten','size'].includes(fields.reason);
}

// Independent digit arithmetic for the original B16 amount grammar. Raw
// numerator/denominator bounds apply before any reduction or percent scaling.
// Mixed forms use the source's space/slash token boundaries, not arbitrary
// whitespace normalization that could silently join distinct numbers.
function amount(raw){
 if(!text(raw))return null;
 const s=raw.trim().replace(/[−–]/g,'-');let match,n,d,form;
 if(/^-?\d+\s+\d+\/\d+$/.test(s)){
  const parts=s.split(/[ /]+/).map(part=>part.trim());if(parts.length!==3||!/^\-?\d+$/.test(parts[0])||!/^\d+$/.test(parts[1])||!/^\d+$/.test(parts[2]))return null;
  const whole=BigInt(parts[0]),part=BigInt(parts[1]);d=BigInt(parts[2]);if(d<1n||part>=d)return null;
  n=(whole<0n?-whole:whole)*d+part;if(s[0]==='-')n=-n;form='mixed';
 }else if((match=/^(-?\d+)\/(\d+)$/.exec(s))){n=BigInt(match[1]);d=BigInt(match[2]);form='fraction';}
 else if((match=/^([+-]?)(\d+)(?:\.(\d+))?$/.exec(s))){
  const tail=match[3]||'';if(tail.length>8)return null;
  d=10n**BigInt(tail.length);n=BigInt(match[2])*d+BigInt(tail||'0');if(match[1]==='-')n=-n;form=match[3]===undefined?'integer':'decimal';
 }else return null;
 if(d<1n||d>100000000n||n< -1000000000000n||n>1000000000000n)return null;
 return{pair:[n,d],form};
}
function representation(raw){
 const trimmed=raw.trim(),percent=trimmed.endsWith('%'),parsed=amount(percent?trimmed.slice(0,-1):trimmed);if(!parsed)return null;
 let[n,d]=parsed.pair;if(percent)d*=100n;
 const toolNormalized=percent||trimmed.includes('.'),normalized=toolNormalized?reduce(n,d):[n,d];
 return{raw,inputForm:percent?'percent':parsed.form,parsedPair:pair([n,d]),normalizedPair:pair(normalized),
  toolNormalized,systemReduced:toolNormalized&&gcd(n,d)!==1n,exactPair:normalized};
}
const messages={
 reduce:'先化到不能再合并的整数份数；判断会不会结束，要看化简后的整个份数。',
 factor:'拿走一个能整除它的质数因子，剩下的继续拆。',
 digit:'每一行都要对上：分出的份×每份人数＋余下的＝这一行原有的量。'
};

// Reconstruct the *whole* eventually-periodic quantity, retaining the prefix.
// A repeating digit string alone does not determine the original fraction.
function expansionFor(board,rows,source){
 const integerDigits=String(board.rows[0].q),decimalDigits=board.rows.slice(1).map(row=>row.q).join('');
 const cycleIndex=board.cycle,kind=cycleIndex===null?'stop':'repeat';
 let nonrepeatingDigits,repeatingDigits,exact;
 if(kind==='stop'){
  if(board.remainder!==0)return null;
  nonrepeatingDigits=decimalDigits;repeatingDigits='';const scale=10n**BigInt(decimalDigits.length);
  exact=reduce(BigInt(integerDigits)*scale+BigInt(decimalDigits||'0'),scale);
 }else{
  if(!integer(cycleIndex,0,board.rows.length-2)||board.remainders[cycleIndex]!==board.remainder)return null;
  nonrepeatingDigits=board.rows.slice(1,cycleIndex+1).map(row=>row.q).join('');
  repeatingDigits=board.rows.slice(cycleIndex+1).map(row=>row.q).join('');if(!repeatingDigits.length)return null;
  const prefixScale=10n**BigInt(nonrepeatingDigits.length),periodDen=10n**BigInt(repeatingDigits.length)-1n,den=prefixScale*periodDen;
  exact=reduce(BigInt(integerDigits)*den+BigInt(nonrepeatingDigits||'0')*periodDen+BigInt(repeatingDigits),den);
 }
 if(!equal(exact,source))return null;
 return{kind,integerDigits,nonrepeatingDigits,repeatingDigits,cycleIndex,
  cycleStartFractionalPlace:cycleIndex===null?null:cycleIndex+1,
  firstRepeatedRemainder:cycleIndex===null?null:board.remainder,
  repeatedRemainderFirstHistoryIndex:cycleIndex===null?null:rows[cycleIndex].historyIndex,
  repeatedRemainderFinalHistoryIndex:cycleIndex===null?null:rows.at(-1).historyIndex,
  exactValue:pair(exact),notation:integerDigits+'.'+nonrepeatingDigits+(kind==='repeat'?'('+repeatingDigits+')':'')};
}

export function replayDecimalEngineEvidence(task,model){
 try{
  if(!knownTask(task)||!keys(model,[...FIELD_KEYS,'board','history','issue'])||!FIELD_KEYS.every(key=>text(model[key]))||!text(model.issue)||
     !dense(model.history)||!model.history.length||model.history.length>1500||!keys(model.board,Object.keys(initial()))||
     !dense(model.board.factors)||!dense(model.board.rows)||!dense(model.board.remainders)||
     !model.board.rows.every(row=>keys(row,['input','q','rem'])))return null;
  const source=reduce(BigInt(task.n),BigInt(task.d)),simple=pair(source),den=source[1];
  let denominator=den;while(denominator%2n===0n)denominator/=2n;while(denominator%5n===0n)denominator/=5n;
  const expectedKind=denominator===1n?'stop':'repeat';
  let board=initial(),previous={...DEFAULTS},issue='',reduction=null,factorSteps=[],rows=[],
   firstPrediction=null,currentRoundFirstPrediction=null,finalPrediction=null;
  const events=[],failedRequests=[],resets=[];
  for(const[historyIndex,event]of model.history.entries()){
   if(!keys(event,['a','d','f'])||!keys(event.d,[])||!keys(event.f,FIELD_KEYS)||!allowedFields(board,event.f,previous)||
      !WINDOWS[phase(board)].actions.includes(event.a))return null;
   const fields=event.f,currentPhase=phase(board),before=cp(board),step={historyIndex,action:event.a,phase:currentPhase,
    fields:Object.fromEntries(RELEVANT.map(key=>[key,fields[key]])),before,accepted:true,mathematicallyCorrect:null,
    constructionChanged:false,firstStored:false,currentRoundFirstStored:false,issue:''};
   issue='';
   if(event.a==='reset'){
    const first=board.first;board=initial();board.first=first;reduction=null;factorSteps=[];rows=[];
    currentRoundFirstPrediction=null;finalPrediction=null;
   }else if(event.a==='reduce'){
    const requested=representation(fields.fraction),legacy=original.frac(fields.fraction);
    // The source parser is a compatibility gate for a failed request only.
    // Acceptance still needs independent literal BigInt values and exact
    // simplest-pair equality; neither parser nor grader supplies that proof.
    const legacyAccepted=same(legacy,simple),exactAccepted=requested&&same(requested.normalizedPair,simple);
    if(legacyAccepted&&!exactAccepted)return null;
    step.reduction=requested?{historyIndex,raw:requested.raw,inputForm:requested.inputForm,parsedPair:requested.parsedPair,
     normalizedPair:requested.normalizedPair,toolNormalized:requested.toolNormalized,systemReduced:requested.systemReduced}:null;
    if(!legacyAccepted){step.accepted=false;step.failureReason='not-original-simplest-representation';issue=messages.reduce;}
    else{
     board.simple=[...simple];board.factorLeft=simple[1];board.factors=[];board.remainder=simple[0];board.remainders=[];board.prediction=null;
     reduction=cp(step.reduction);step.mathematicallyCorrect=true;
    }
   }else if(event.a==='factor'){
    const entered=interpreted(fields.factor),isPrime=prime(entered.value),divides=isPrime&&BigInt(board.factorLeft)%BigInt(entered.value)===0n;
    step.factor={historyIndex,raw:fields.factor,entered,normalized:entered.value,before:board.factorLeft,after:board.factorLeft,prime:isPrime,divides};
    if(!divides){step.accepted=false;step.failureReason='not-a-prime-factor';issue=messages.factor;}
    else{
     board.factors.push(entered.value);board.factorLeft=Number(BigInt(board.factorLeft)/BigInt(entered.value));
     step.factor.after=board.factorLeft;factorSteps.push(cp(step.factor));step.mathematicallyCorrect=true;
    }
   }else if(event.a==='predict-stop'){
    if(!fields.kind){step.accepted=false;step.failureReason='empty-prediction';}
    else{
     const prediction={historyIndex,raw:fields.kind,value:fields.kind,matchesExpected:fields.kind===expectedKind,phase:currentPhase};
     step.prediction=prediction;step.mathematicallyCorrect=prediction.matchesExpected;
     if(board.first===null){board.first=fields.kind;firstPrediction=cp(prediction);step.firstStored=true;}
     if(currentRoundFirstPrediction===null){currentRoundFirstPrediction=cp(prediction);step.currentRoundFirstStored=true;}
     board.prediction=fields.kind;finalPrediction=cp(prediction);
    }
   }else{
    const index=board.rows.length,input=BigInt(board.remainder)*(index?10n:1n),quotient=input/den,remainder=input%den,unit=10n**BigInt(index),
     enteredQuotient=interpreted(fields.q),enteredRemainder=interpreted(fields.remainder),
     matchesRow=enteredQuotient.value===Number(quotient)&&enteredRemainder.value===Number(remainder);
    step.row={historyIndex,index,input:Number(input),quotient:Number(quotient),remainder:Number(remainder),unit:[1,Number(unit)],
     inputQuantity:quantity(input,unit),allocatedQuantity:quantity(quotient*den,unit),remainingQuantity:quantity(remainder,unit),
     shareIncrement:quantity(quotient,unit),enteredQuotient,enteredRemainder,matchesRow};
    if(!matchesRow){step.accepted=false;step.failureReason='incorrect-quotient-or-remainder';issue=messages.digit;}
    else{
     // All counts are exact small integers after the original Number input
     // interpretation. The arithmetic, unit and cycle use independent values.
     if(input!==quotient*den+remainder||remainder<0n||remainder>=den)return null;
     board.rows.push({input:Number(input),q:Number(quotient),rem:Number(remainder)});board.remainder=Number(remainder);
     if(remainder===0n)board.stop=true;
     else if(board.remainders.includes(Number(remainder))){board.cycle=board.remainders.indexOf(Number(remainder));board.stop=true;}
     else board.remainders.push(Number(remainder));
     rows.push(cp(step.row));step.mathematicallyCorrect=true;
    }
   }
   step.after=cp(board);step.constructionChanged=!same(before,board);step.issue=issue;events.push(step);
   if(!step.accepted)failedRequests.push(step);if(event.a==='reset')resets.push(step);
   previous={...fields};
  }
  if(!allowedFields(board,model,previous)||!same(board,model.board)||issue!==model.issue||!reduction||!board.stop||
     board.factorLeft!==1||!same(board.simple,simple)||board.prediction!==expectedKind||model.kind!==expectedKind||
     model.reason!=='base-ten'||!firstPrediction||!currentRoundFirstPrediction||!finalPrediction||!rows.length)return null;
  const product=board.factors.reduce((value,factor)=>value*BigInt(factor),1n),onlyTwoAndFive=board.factors.every(factor=>factor===2||factor===5);
  if(product!==den||onlyTwoAndFive!==(expectedKind==='stop'))return null;
  const expansion=expansionFor(board,rows,source);if(!expansion||expansion.kind!==expectedKind)return null;
  const answerValue=expectedKind==='stop'?amount(model.answer):null;
  if(expectedKind==='stop'?!answerValue||!equal(answerValue.pair,source):model.answer!==expansion.repeatingDigits)return null;
  // Compatibility is checked only after the independent mathematical proof.
  if(!original.valid(task,model)||!original.inspect(task,model).correct)return null;
  return{originalQuantity:[task.n,task.d],value:[...simple],simple:[...simple],reduction,
   factorization:{denominator:Number(den),factors:[...board.factors],steps:factorSteps,product:Number(product),residualDenominator:board.factorLeft,onlyTwoAndFive},
   rows,expansion,firstPrediction,currentRoundFirstPrediction,finalPrediction,
   currentPrediction:{raw:model.kind,value:model.kind,matchesCommitted:model.kind===board.prediction,matchesExpected:model.kind===expectedKind,submissionOnly:true},
   answer:{raw:model.answer,mode:expectedKind==='stop'?'finite':'repetend',value:answerValue?quantity(...answerValue.pair):null,
    inputForm:answerValue?.form??null,repeatingDigits:expectedKind==='repeat'?model.answer:null,matchesExpansion:true,submissionOnly:true},
   reasonChoice:{raw:model.reason,label:'10的质数因子只有2和5，重复余数会重复后续步骤',fixedChoice:true,openExplanationAssessed:false},
   eventCount:events.length,events,failedRequests,resets,finalConstruction:cp(board),issue,
   systemGenerated:{reductionNormalization:reduction.toolNormalized,factorRemainder:true,nextRowInput:true,unitLabels:true,rowTable:true,
    repeatedRemainderDetection:true,cycleIndex:true,stopMessage:true},
   assessmentLimits:{method:null,independentReductionAssessed:false,independentCycleDiscoveryAssessed:false,generalTerminationProofAssessed:false,
    independentLongDivisionLayoutAssessed:false,openExplanationAssessed:false,physicalActionAssessed:false,authorshipAssessed:false,generalMasteryAssessed:false,
    exactRawIntegerSpellingAssessed:false,exactKeystrokeOrderKnown:false,historyCompletenessAuthenticated:false,allLaterClicksRecorded:false,
    recordingLimit:1500,textLimit:500}};
 }catch{return null;}
}
