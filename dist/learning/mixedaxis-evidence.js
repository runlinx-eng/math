// Applied number-line positions, card identities and source-specific comparison
// sentences are separate from the still-editable coordinate input. The tool
// draws the points; replay does not assess independent drawing or understanding.
import * as original from './phase5/b16-model.js';
import {isEvidenceContext,matchesNativeEvidenceTask,hasExactKeys as keys,sameEvidence as same} from './evidence-contract.js';

const SOURCES=Object.freeze({
 mixedpoints:{indices:[1,2],nodeId:'mt_PsylzZ9lHW'},
 orderforms:{indices:[0,1,2],nodeId:'mt_uDJY0X0hgo'},
 decimalorder2:{indices:[0,2],nodeId:'mt_IegHBHERVa'},
 raggeddecimals:{indices:[1],nodeId:'mt_933BohS9BH'}
});

export function mixedAxisBinding(task,context={}){
 if(!isEvidenceContext(context))return null;
 const source=Object.hasOwn(SOURCES,context.sessionId)?SOURCES[context.sessionId]:null;
 if(!source||!source.indices.includes(context.index)||
    !matchesNativeEvidenceTask(task,context,{type:'x-mixedaxis',nodeId:source.nodeId}))return null;
 return {nodeId:source.nodeId,method:null,
  question:'每张卡表示哪个数，已经放在什么位置？同一点的不同写法怎样排序，比较句里的符号是否准确？当前输入已经放下了吗？'};
}

const DEFAULTS=Object.freeze({rows:'1',cols:'1',parts:'1',take:'',answer:'',unit:'',equation:'',den:'',num:'',whole:'',
 remainder:'',copies:'',prediction:'',relation:'',left:'',right:'',reason:'',step:'',position:'0',choice:'',result:'',
 shift:'0',rotation:'0',x:'0',y:'0',per:'',total:'',color:'0',decimal:'',percent:'',top:'',bottom:'',word:'',count:'1',fixed:'0'});
const FIELD_KEYS=Object.keys(DEFAULTS),RELATIONS=['','<','=','>','≠','≤','≥'];
const cp=value=>structuredClone(value),text=value=>typeof value==='string'&&value.length<=2000;
const dense=value=>Array.isArray(value)&&Object.keys(value).length===value.length&&Object.keys(value).every((key,index)=>key===String(index));
const integer=(value,lo,hi)=>Number.isSafeInteger(value)&&value>=lo&&value<=hi;
const gcd=(a,b)=>{a=a<0n?-a:a;while(b)[a,b]=[b,a%b];return a;};
const reduce=(n,d)=>{const g=gcd(n,d);return[n/g,d/g];};
const equal=(a,b)=>!!a&&!!b&&a[0]*b[1]===b[0]*a[1];
const compare=(a,b)=>{const n=a[0]*b[1]-b[0]*a[1];return n<0n?-1:n>0n?1:0;};
const pair=value=>{const result=value.map(Number);return result.every(Number.isSafeInteger)?result:null;};
const exactPair=value=>value?value.map(String):null;
const big=value=>value.map(BigInt);
const relationTrue=(a,s,b)=>{
 const c=compare(a,b);return s==='<'?c<0:s==='>'?c>0:s==='='?c===0:s==='≠'?c!==0:s==='≤'?c<=0:s==='≥'?c>=0:false;
};

// Fixed source card/statement quantities are parsed from their digits. No
// floating comparison or original grader supplies the mathematical relation.
function sourceValue(raw){
 if(!text(raw))return null;
 const s=raw.trim().replace(/[−–]/g,'-');let match,n,d;
 if((match=/^(-?)(\d+)\s+(\d+)\/(\d+)$/.exec(s))){
  d=BigInt(match[4]);const part=BigInt(match[3]);if(d<1n||part>=d)return null;
  n=BigInt(match[2])*d+part;if(match[1])n=-n;
 }else if((match=/^(-?\d+)\/(\d+)$/.exec(s))){n=BigInt(match[1]);d=BigInt(match[2]);}
 else if((match=/^([+-]?)(\d+)(?:\.(\d+))?$/.exec(s))){
  const tail=match[3]||'';if(tail.length>8)return null;
  d=10n**BigInt(tail.length);n=BigInt(match[2])*d+BigInt(tail||'0');if(match[1]==='-')n=-n;
 }else return null;
 if(d<1n||d>100000000n||n< -1000000000000n||n>1000000000000n)return null;
 return reduce(n,d);
}

// This is the original position field's decimal-only syntax, not the wider
// fraction syntax used by card labels. Keep invalid and out-of-axis requests
// as failed, recorded requests even though the original issue text is empty.
function coordinateValue(raw){
 if(!text(raw))return null;
 const match=/^([+-]?)(\d{1,12})(?:\.(\d{1,8}))?$/.exec(raw.trim());if(!match)return null;
 const tail=match[3]||'',d=10n**BigInt(tail.length);
 let n=BigInt(match[2])*d+BigInt(tail||'0');if(match[1]==='-')n=-n;
 return reduce(n,d);
}
const inAxis=(task,value)=>!!value&&compare(value,[BigInt(task.min),1n])>=0&&compare(value,[BigInt(task.max),1n])<=0;
const knownTask=task=>Object.entries(SOURCES).some(([sessionId,source])=>source.indices.some(index=>
 matchesNativeEvidenceTask(task,{sessionId,index},{type:'x-mixedaxis',nodeId:source.nodeId})));
const initial=()=>({selected:0,placements:{},ordered:[],symbols:[],first:null});
const canonicalIndex=(raw,max)=>text(raw)&&/^(?:0|[1-9]\d*)$/.test(raw)&&
 integer(Number(raw),0,max)&&String(Number(raw))===raw?Number(raw):null;
const visible=(task,board)=>['position',...((task.statements||[])[board.symbols.length]?['relation']:[])];
const inputSnapshot=fields=>({position:fields.position,relation:fields.relation});
function allowedFields(task,board,fields,previous){
 const editable=visible(task,board);
 return FIELD_KEYS.every(key=>text(fields[key])&&(editable.includes(key)||fields[key]===previous[key]))&&RELATIONS.includes(fields.relation);
}
const symbolIssue='看清是严格大/小、一样多，还是允许相等。';

export function replayMixedAxisEvidence(task,model){
 try{
  if(!knownTask(task)||!keys(model,[...FIELD_KEYS,'board','history','issue'])||!FIELD_KEYS.every(key=>text(model[key]))||
     !text(model.issue)||!dense(model.history)||!model.history.length||model.history.length>2000||
     !keys(model.board,['selected','placements','ordered','symbols','first'])||!dense(model.board.ordered)||!dense(model.board.symbols)||
     model.board.first!==null&&!keys(model.board.first,['index','position']))return null;
  const values=task.cards.map(sourceValue);if(values.some(value=>!value||!pair(value)))return null;
  const cards=task.cards.map((raw,index)=>({index,raw,value:pair(values[index])}));
  const questions=(task.statements||[]).map(q=>({...q,left:sourceValue(q.a),right:sourceValue(q.b)}));
  if(questions.some(q=>!q.left||!q.right||!pair(q.left)||!pair(q.right)||!RELATIONS.slice(1).includes(q.symbol)))return null;
  let board=initial(),previous={...DEFAULTS},issue='',applied={},comparisons=[],firstPlacement=null,currentRoundFirstPlacement=null;
  const events=[],failedRequests=[],resets=[];
  for(const[historyIndex,event]of model.history.entries()){
   if(!keys(event,['action','data'])||!['select','place','order','symbol','reset'].includes(event.action)||
      !keys(event.data,['fields',...(['select','order'].includes(event.action)?['index']:[])])||
      !keys(event.data.fields,FIELD_KEYS)||!allowedFields(task,board,event.data.fields,previous))return null;
   const fields=event.data.fields,before=cp(board),step={historyIndex,action:event.action,fields:inputSnapshot(fields),before,
    accepted:true,constructionChanged:false,firstStored:false,currentRoundFirstStored:false,issue:''};
   issue='';
   if(event.action==='select'||event.action==='order'){
    const index=canonicalIndex(event.data.index,task.cards.length-1);if(index===null)return null;
    step.index=index;
    if(event.action==='select')board.selected=index;
    else{
     const removed=board.ordered.includes(index);step.change=removed?'remove':'append';
     board.ordered=removed?board.ordered.filter(item=>item!==index):[...board.ordered,index];
    }
   }else if(event.action==='place'){
    const index=board.selected,value=coordinateValue(fields.position),inside=inAxis(task,value);
    step.index=index;step.placement={index,card:task.cards[index],cardValue:pair(values[index]),raw:fields.position,
     value:value?pair(value):null,valueExact:exactPair(value),coordinate:null,historyIndex,syntaxValid:!!value,inRange:inside,
     matchesCard:equal(value,values[index])};
    if(!value||!inside){step.accepted=false;step.failureReason=value?'outside-axis':'invalid-coordinate';}
    else{
     // Number is used solely as the original model/renderer coordinate witness;
     // equality and ordering above/below use the exact rational from raw digits.
     const coordinate=Number(fields.position.trim());step.placement.coordinate=coordinate;
     if(board.first===null){board.first={index,position:coordinate};step.firstStored=true;firstPlacement=cp(step.placement);}
     if(currentRoundFirstPlacement===null){step.currentRoundFirstStored=true;currentRoundFirstPlacement=cp(step.placement);}
     board.placements[index]=coordinate;applied[index]=cp(step.placement);
    }
   }else if(event.action==='symbol'){
    const index=board.symbols.length,q=questions[index];if(!q)return null;
    const mathematical=relationTrue(q.left,fields.relation,q.right),meaning=fields.relation===q.symbol;
    step.comparison={index,historyIndex,left:{raw:q.a,value:pair(q.left)},right:{raw:q.b,value:pair(q.right)},word:q.word,
     requiredSymbol:q.symbol,submittedSymbol:fields.relation,mathematicallyTrue:mathematical,meaningMatches:meaning};
    if(!mathematical||!meaning){step.accepted=false;step.failureReason=!meaning?'source-symbol-mismatch':'false-relation';issue=symbolIssue;}
    else{board.symbols.push(fields.relation);comparisons.push(cp(step.comparison));}
   }else{
    const first=board.first;board=initial();board.first=first;applied={};comparisons=[];currentRoundFirstPlacement=null;
   }
   step.after=cp(board);step.constructionChanged=!same(before,board);step.issue=issue;events.push(step);
   if(!step.accepted)failedRequests.push(step);if(event.action==='reset')resets.push(step);
   previous={...fields};
  }
  if(!allowedFields(task,board,model,previous)||!same(board,model.board)||issue!==model.issue||
     !keys(model.board.placements,task.cards.map((_,index)=>String(index))))return null;
  const placements=cards.map(card=>applied[card.index]);
  if(placements.some(placement=>!placement||!placement.matchesCard)||board.ordered.length!==cards.length||
     new Set(board.ordered).size!==cards.length||comparisons.length!==questions.length||board.symbols.length!==questions.length)return null;
  const adjacent=[];
  for(let i=1;i<board.ordered.length;i++){
   const leftIndex=board.ordered[i-1],rightIndex=board.ordered[i],c=compare(values[leftIndex],values[rightIndex]);if(c>0)return null;
   adjacent.push({leftIndex,rightIndex,leftValue:pair(values[leftIndex]),rightValue:pair(values[rightIndex]),relation:c===0?'=':'<'});
  }
  const equalValueGroups=[];
  for(const card of cards){
   const group=equalValueGroups.find(group=>equal(big(group.value),values[card.index]));
   if(group)group.indices.push(card.index);else equalValueGroups.push({value:card.value,indices:[card.index]});
  }
  const selected=board.selected,draft=coordinateValue(model.position),inside=inAxis(task,draft),last=applied[selected];
  const currentDraft={selectedIndex:selected,card:task.cards[selected],raw:model.position,value:draft?pair(draft):null,valueExact:exactPair(draft),
   syntaxValid:!!draft,inRange:inside,matchesCard:equal(draft,values[selected]),appliedValue:last.value,appliedRaw:last.raw,
   appliedHistoryIndex:last.historyIndex,matchesAppliedPosition:equal(draft,big(last.value)),matchesLastPlacementInput:model.position===last.raw,
   status:!draft?'invalid-number':!inside?'outside-axis':equal(draft,values[selected])?'matches-card':'different-from-card'};
  // The independently checked applied work must remain compatible with the
  // original completion rule. It intentionally does not grade the input draft.
  if(!original.valid(task,model)||!original.inspect(task,model).correct)return null;
  return {axis:{min:task.min,max:task.max},cards,placements,
   order:{indices:[...board.ordered],values:board.ordered.map(index=>pair(values[index])),adjacent,
    equalValueGroups:equalValueGroups.filter(group=>group.indices.length>1)},comparisons,currentDraft,
   firstPlacement,currentRoundFirstPlacement,eventCount:events.length,events,failedRequests,resets,finalConstruction:cp(board),issue,
   systemGenerated:{numberLine:true,unitTicks:true,cardLabels:true,pointDrawing:true},
   assessmentLimits:{method:null,independentDrawingAssessed:false,authorshipAssessed:false,understandingAssessed:false,
    generalMasteryAssessed:false,unappliedDraftAssessedAsApplied:false,unrecordedActionsAuthenticated:false,
    recordingLimit:2000,allLaterClicksRecorded:false,historyCompletenessAuthenticated:false,exactKeystrokeOrderKnown:false}};
 }catch{return null;}
}
