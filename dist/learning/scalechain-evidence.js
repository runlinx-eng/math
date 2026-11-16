// One current whole per stage: record actual equal-part selections and exact
// written quantities. The source supplies the operation, ratio and diagrams;
// this evidence does not attribute those choices or drawings to the learner.
import * as original from './phase5/b18-model.js';
import {rational as originalRational} from './phase5/b16-model.js';
import {isEvidenceContext,matchesNativeEvidenceTask,hasExactKeys as keys,sameEvidence as same} from './evidence-contract.js';

const SOURCES=Object.freeze({
 portionoperator:{indices:[0,1,2,3],nodeId:'mt_J339bO7qLe'},
 pctNames37:{indices:[1,3],nodeId:'mt_4ubP_RMg9o'},
 pctFraction37:{indices:[2,3,4],nodeId:'mt_ALUrJpY0cZ'},
 model38:{indices:[2],nodeId:'mt_8xVHooT4aI'}
});

export function scaleChainBinding(task,context={}){
 if(!isEvidenceContext(context))return null;
 const source=Object.hasOwn(SOURCES,context.sessionId)?SOURCES[context.sessionId]:null;
 if(!source||!source.indices.includes(context.index)||
    !matchesNativeEvidenceTask(task,context,{type:'x-scalechain',nodeId:source.nodeId}))return null;
 return {nodeId:source.nodeId,method:null,
  question:'这一轮把哪个量看作整个？一小份、取出的量和最后得到的量分别是多少，下一轮又以哪个量为整个？'};
}

// Freeze all shared B18 fields. Only the five scale controls can be edited,
// and their visibility changes after cutting, committing and resetting.
const DEFAULTS=Object.freeze({guess:'',equation:'',answer:'',whole:'',part:'',factor:'',choice:'',low:'',high:'',
 inside:'',story:'',tile:'',count:'',simple:'',inverse:'',scaledA:'',scaledB:'',decimal:'',denom:'',unit:'',amount:'',result:''});
const FIELD_KEYS=Object.keys(DEFAULTS),SCALE_FIELDS=['denom','unit','amount','result','decimal'];
const cp=value=>structuredClone(value),text=value=>typeof value==='string'&&value.length<=1000;
const integer=(value,lo,hi)=>Number.isSafeInteger(value)&&value>=lo&&value<=hi;
const gcd=(a,b)=>{a=a<0n?-a:a;while(b)[a,b]=[b,a%b];return a;};
const reduce=(n,d)=>{const g=gcd(n,d);return[n/g,d/g];};
const equal=(a,b)=>!!a&&!!b&&a[0]*b[1]===b[0]*a[1];
const multiply=(a,b)=>reduce(a[0]*b[0],a[1]*b[1]);
const plus=(a,b,sign=1n)=>reduce(a[0]*b[1]+sign*b[0]*a[1],a[1]*b[1]);
const big=pair=>pair.map(BigInt);
function pair(value){
 const out=value.map(Number);
 if(!out.every(Number.isSafeInteger))throw new RangeError('Unsafe scale quantity');
 return out;
}

// Match the original rational capability, but calculate from the original
// digits with BigInt. In particular, do not round a written quantity through
// Number or use the source grader as the mathematical proof.
function amount(raw){
 if(!text(raw))return null;
 const s=raw.trim().replace(/[−–]/g,'-');let n,d,m;
 if((m=/^(-?)(\d+)\s+(\d+)\/(\d+)$/.exec(s))){
  d=BigInt(m[4]);const part=BigInt(m[3]);if(d<1n||part>=d)return null;
  n=BigInt(m[2])*d+part;if(m[1])n=-n;
 }else if((m=/^(-?\d+)\/(\d+)$/.exec(s))){n=BigInt(m[1]);d=BigInt(m[2]);}
 else if((m=/^([+-]?)(\d+)(?:\.(\d+))?$/.exec(s))){
  const decimals=m[3]||'';if(decimals.length>8)return null;
  d=10n**BigInt(decimals.length);n=BigInt(m[2])*d+BigInt(decimals||'0');if(m[1]==='-')n=-n;
 }else return null;
 if(d<1n||d>100000000n||n< -1000000000000n||n>1000000000000n)return null;
 return reduce(n,d);
}
function written(raw){
 const exact=amount(raw),accepted=originalRational(raw);
 return exact&&accepted&&accepted.every(Number.isSafeInteger)&&equal(exact,big(accepted))?exact:null;
}

const knownTask=task=>Object.entries(SOURCES).some(([sessionId,source])=>source.indices.some(index=>
 matchesNativeEvidenceTask(task,{sessionId,index},{type:'x-scalechain',nodeId:source.nodeId})));
const initial=start=>({index:0,current:[...start],denom:0,selected:[],records:[],first:[]});
const visible=(task,board)=>{
 const stage=task.stages[board.index];
 return stage?['denom',...(board.denom?['unit','amount','result',...(stage.decimal?['decimal']:[])]:[])]:[];
};
const inputSnapshot=fields=>Object.fromEntries(SCALE_FIELDS.map(key=>[key,fields[key]]));
const firstSnapshot=(fields,selected)=>({...inputSnapshot(fields),selected:[...selected]});
const construction=board=>({index:board.index,current:[...board.current],denominator:board.denom,
 selectedIds:[...board.selected],recordCount:board.records.length});
const canonicalIndex=(raw,max)=>text(raw)&&/^(?:0|[1-9]\d*)$/.test(raw)&&
 integer(Number(raw),0,max)&&String(Number(raw))===raw?Number(raw):null;
const messages={
 cut:'每一小份要一样大，而且能整齐取出所需的比例。',
 selected:'图中取出的份数，要和这一轮的比例一致。',
 amount:'先用这一轮的整个量分出一小份，再数你取出了几份。',
 decimal:'把这一轮的百分数写成等值小数；20%表示0.2倍，不是20倍。',
 off:'折扣是拿走的量，还要从原量中减去。',
 add:'这一轮算出的是增加量，还要加到当前的量上。',
 take:'把取出的量作为这一轮的结果。'
};

export function replayScaleChainEvidence(task,model){
 try{
  if(!knownTask(task)||!keys(model,[...FIELD_KEYS,'board','history','issue'])||
     !FIELD_KEYS.every(key=>text(model[key]))||!text(model.issue)||
     !Array.isArray(model.history)||!model.history.length||model.history.length>1200)return null;
  const start=amount(task.start);if(!start||start[0]<=0n)return null;
  const ratios=task.stages.map(stage=>amount(stage.ratio));
  if(ratios.some(ratio=>!ratio||ratio[0]<=0n))return null;
  let board=initial(pair(start)),previous={...DEFAULTS},issue='',stages=[],currentFirstAttempts=[];
  const events=[],failedRequests=[],resets=[],firstAttemptHistoryIndices=[],currentFirstAttemptHistoryIndices=[];
  for(const [historyIndex,event]of model.history.entries()){
   if(!keys(event,['a','d','f'])||!['reset','cut','piece','commit'].includes(event.a)||
      !keys(event.d,event.a==='piece'?['index']:[])||!keys(event.f,FIELD_KEYS)||
      !FIELD_KEYS.every(key=>text(event.f[key])))return null;
   const fields=event.f,editable=visible(task,board);
   if(FIELD_KEYS.some(key=>!editable.includes(key)&&fields[key]!==previous[key]))return null;
   const before=construction(board),stageIndex=board.index,source=task.stages[stageIndex],ratio=ratios[stageIndex];
   const step={historyIndex,action:event.a,stageIndex,fields:inputSnapshot(fields),
    before,accepted:true,constructionChanged:false,firstStored:false,currentFirstStored:false,
    automaticFieldsCleared:[],issue:''};
   issue='';
   if(event.a==='reset'){
    const first=cp(board.first);board=initial(pair(start));board.first=first;
    stages=[];currentFirstAttempts=[];currentFirstAttemptHistoryIndices.length=0;
   }else{
    // Finished stages expose only the global reset. A hidden commit cannot
    // create an additional request or silently rewrite a previous result.
    if(!source)return null;
    if(event.a==='cut'){
     // These text controls intentionally use the source's Number count
     // conversion (e.g. 0x4, 5e0). The normalized small integer is the tool's
     // partition count; the raw spelling is preserved, not called exact input.
     const n=Number(fields.denom);
     const count=integer(n,1,100)?ratio[0]*BigInt(n):null;
     step.requestedDenominator=fields.denom;
     if(count===null||count%ratio[1]!==0n||count/ratio[1]<1n||count/ratio[1]>160n){
      step.accepted=false;issue=messages.cut;
     }else{
      board.denom=n;board.selected=[];step.denominator=n;
      step.availablePieceCount=Number((ratio[0]+ratio[1]-1n)/ratio[1])*n;
     }
    }else if(event.a==='piece'){
     if(!board.denom)return null;
     const capacity=Number((ratio[0]+ratio[1]-1n)/ratio[1])*board.denom;
     const index=canonicalIndex(event.d.index,capacity-1);if(index===null)return null;
     const selected=!board.selected.includes(index);
     board.selected=selected?[...board.selected,index]:board.selected.filter(value=>value!==index);
     step.pieceId=index;step.selected=selected;
     step.pieceValue=pair(reduce(BigInt(board.current[0]),BigInt(board.current[1])*BigInt(board.denom)));
    }else{
     // The commit control is present only after an accepted cut. Wrong
     // visible values or a changed denominator still yield real failures.
     if(!board.denom)return null;
     const first=firstSnapshot(fields,board.selected);
     if(!board.first[stageIndex]){
      board.first[stageIndex]=cp(first);step.firstStored=true;firstAttemptHistoryIndices[stageIndex]=historyIndex;
     }
     if(!currentFirstAttempts[stageIndex]){
      currentFirstAttempts[stageIndex]=cp(first);step.currentFirstStored=true;
      currentFirstAttemptHistoryIndices[stageIndex]=historyIndex;
     }
     const beforeAmount=big(board.current),pieceValue=reduce(beforeAmount[0],beforeAmount[1]*BigInt(board.denom));
     const selectedAmount=multiply(pieceValue,[BigInt(board.selected.length),1n]);
     const taken=multiply(beforeAmount,ratio),result=source.mode==='off'?plus(beforeAmount,taken,-1n):
      source.mode==='add'?plus(beforeAmount,taken):taken;
     if(Number(fields.denom)!==board.denom||!equal(selectedAmount,taken))issue=messages.selected;
     else if(!equal(written(fields.unit),pieceValue)||!equal(written(fields.amount),taken))issue=messages.amount;
     else if(source.decimal&&(!/^(?:\d+(?:\.\d+)?|\.\d+)$/.test(fields.decimal)||
             !equal(written(fields.decimal),ratio)))issue=messages.decimal;
     else if(!equal(written(fields.result),result))issue=messages[source.mode];
     if(issue)step.accepted=false;
     else{
      const stage={index:stageIndex,label:source.label,mode:source.mode,ratio:pair(ratio),
       percent:source.percent??null,decimalRequired:!!source.decimal,before:[...board.current],
       denominator:board.denom,pieceValue:pair(pieceValue),selectedIds:[...board.selected],
       selectedCount:board.selected.length,amount:pair(taken),result:pair(result),
       submitted:inputSnapshot(fields),commitHistoryIndex:historyIndex};
      stages.push(stage);step.completedStage=stage;
      board.records.push({before:[...board.current],ratio:pair(ratio),mode:source.mode,denom:board.denom,
       selected:[...board.selected],unit:fields.unit,amount:fields.amount,result:fields.result,decimal:fields.decimal});
      board.current=pair(result);board.index++;board.denom=0;board.selected=[];
     }
    }
   }
   previous={...fields};
   // The original model clears these five values only when index changes.
   // Resetting stage zero hides controls but preserves their existing values.
   if(board.index!==stageIndex){
    for(const key of SCALE_FIELDS)previous[key]='';
    step.automaticFieldsCleared=[...SCALE_FIELDS];
   }
   step.after=construction(board);step.constructionChanged=!same(before,step.after);step.issue=issue;
   events.push(step);if(!step.accepted)failedRequests.push(step);if(event.a==='reset')resets.push(step);
  }
  const editable=visible(task,board);
  if(FIELD_KEYS.some(key=>!editable.includes(key)&&model[key]!==previous[key])||
     !same(board,model.board)||model.issue!==issue||board.index!==task.stages.length||
     stages.length!==task.stages.length)return null;
  // Compatibility is checked after independent replay and arithmetic. The
  // original inspect/solver is not used to establish mathematical success.
  if(!original.valid(task,model))return null;
  return {start:pair(start),unit:task.unit||'',result:[...board.current],stages,events,failedRequests,resets,
   firstAttempts:cp(board.first),currentFirstAttempts:cp(currentFirstAttempts),
   firstAttemptHistoryIndices:[...firstAttemptHistoryIndices],
   currentFirstAttemptHistoryIndices:[...currentFirstAttemptHistoryIndices],eventCount:model.history.length,
   systemGenerated:{equalPartitionDiagrams:true,wholeFrames:true,currentWholeDisplays:true,
    selectedPieceCounts:true,successfulStageTransitions:true,countInputNormalization:true},
   assessmentLimits:{writtenQuantitiesAreSubmissions:true,exactKeystrokeOrderKnown:false,
    physicalActionAssessed:false,independentRepresentationChoiceAssessed:false,
    openExplanationAssessed:false,generalMasteryAssessed:false,recordingLimit:1200,
    allLaterClicksRecorded:false,method:null}};
 }catch{return null;}
}
