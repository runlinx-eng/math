// B14 written multiplication: real ten-for-one trades and placed partial rows.
// Entered subtotals and the final sum remain submitted values; the record does
// not establish an independent addition process or a self-designed algorithm.
import * as original from './phase5/b14-model.js';
import {sessionTasks} from './bridges.js';
import {matchesNativeEvidenceTask,isEvidenceContext,hasExactKeys as keys,sameEvidence as same} from './evidence-contract.js';

const TYPE='x-multable';
const SOURCES=Object.freeze({
 writtenstart:{nodeId:'mt_DyGBW3ZHh3',indices:[2]},
 shortproduct:{nodeId:'mt_18fK9sQdIz',indices:[0,1,2]},
 longproduct:{nodeId:'mt_q9EaJc2FP8',indices:[0,1,3]},
 bigproduct:{nodeId:'mt_XLP1IM3Qbb',indices:[0,1]},
 translateamount:{nodeId:'mt_3VmBdlAeOZ',indices:[2]}
});
// These original associated copies may be inspected, but never acquire a
// native binding. The 3040 x 20 source remains excluded: no trade is possible.
const REPLAY_SOURCES=Object.freeze({
 writtenstart:[2],shortproduct:[0,1,2],longproduct:[0,1,3],bigproduct:[0,1,2],translateamount:[2],
 'link-writtenstart-shortproduct':[1],'link-tables12-shortproduct':[1],
 'link-threeplaces-writtenstart':[1],'link-mulsymbols-writtenstart':[1],
 'link-bigproduct-box':[0],'link-longproduct-remainders':[0],
 'link-shortproduct-longproduct':[0,1],'link-bigproduct-longdivide':[0],
 'link-longproduct-bigproduct':[0,1],'link-bigproduct-bracketlab':[0],
 'link-shortproduct-combineproducts':[0],'link-bigproduct-decimalproduct':[0],
 'link-longproduct-calculatormeaning':[0],'link-bigproduct-mentalchoices':[0],
 'link-longproduct-viewlinks':[0]
});
const sourceTask=task=>task?.type===TYPE&&Object.entries(REPLAY_SOURCES).some(([id,indices])=>indices.some(index=>same(sessionTasks(id)?.[index],task)));
const defaults={answer:'',estimate:'',cutA:'',cutB:'',part:'',base:'',raw:'',digit:'',shift:'',rowvalue:'',q:'',used:'',rest:'',check:'',method:'',precision:'',candidate:'',remainder:'',prediction:'',reason:'',left:'',right:'',expression:'',hcf:'',lcm:'',result:'',operator:'',equation:'',sideA:'0',sideB:'0',start:'',formula:'',condition:''};
const FIELDS=Object.keys(defaults),cp=structuredClone,text=s=>typeof s==='string'&&s.length<=2000;
const dense=a=>Array.isArray(a)&&Object.keys(a).length===a.length;
const fresh=()=>({firstEstimate:null,estimateOK:false,row:0,col:0,carry:0,pending:null,digits:[],rows:[],work:[]});
const boardShape=b=>keys(b,Object.keys(fresh()))&&dense(b.digits)&&dense(b.rows)&&dense(b.work)&&
 (b.pending===null||keys(b.pending,['raw','loose','bundles']))&&
 b.rows.every(r=>keys(r,['value','shift','digits','carry'])&&dense(r.digits))&&
 b.work.every(w=>keys(w,['row','col','raw','loose','bundles','incoming']));
const visible=(b,width,rows)=>!b.estimateOK?['estimate']:b.row===rows?['answer']:b.col===width?['shift','rowvalue']:b.pending?['digit']:['raw'];
const estimateIssue='先用给出的整数量估一估，把估计留下，再算精确结果。';
const countIssue='先乘当前这一位，再加上上一位送来的整捆。';
const digitIssue='先把每十个换成一捆，再记这一位剩下的数字。';
const rowIssue='这一行乘的是几份一，还是几份十？把整行放回相应位置。';

// Exactly the original unsigned decimal spelling, before any Number rounding.
// A seventh decimal place is a genuine rejected input, even when it is zero.
function enteredInteger(raw){
 if(!text(raw))return null;const m=/^(\d{1,9})(?:\.(\d{1,6}))?$/.exec(raw.trim());if(!m)return null;
 const d=10n**BigInt((m[2]||'').length),n=BigInt(m[1])*d+BigInt(m[2]||'0');return n%d?null:n/d;
}

export function multableBinding(task,context={}){
 try{
  if(!isEvidenceContext(context))return null;
  const source=Object.hasOwn(SOURCES,context.sessionId)?SOURCES[context.sessionId]:null;
  if(!source||!source.indices.includes(context.index)||!matchesNativeEvidenceTask(task,context,{type:TYPE,nodeId:source.nodeId}))return null;
  return{nodeId:source.nodeId,method:null,question:task.b>=10?
   '每列换出的整捆送到哪里？第二行为什么要按十倍的位置放好？':
   '十个换成一捆后，留下的这一位与送往前面的进位怎样保持原来的数量？'};
 }catch{return null;}
}

export function replayMultableEvidence(task,model){
 try{
  if(!sourceTask(task)||!keys(task,['type','a','b','estimate','prompt'])||
     !keys(model,[...FIELDS,'history','board','issue'])||!FIELDS.every(k=>text(model[k]))||!text(model.issue)||
     !dense(model.history)||!model.history.length||model.history.length>3000||!boardShape(model.board)||
     !original.valid(task,model)||!original.inspect(task,model).correct)return null;
  const A=BigInt(task.a),B=BigInt(task.b),estimate=BigInt(task.estimate)*B;
  const digits=String(task.a).split('').reverse().map(Number),multipliers=String(task.b).split('').reverse().map(Number);
  if(multipliers.length>2)return null; // The original shift select offers only 0 and 1.
  let board=fresh(),previous={...defaults},issue='',segment=0,segmentStart=0,countEvent=null,pendingTrades=[];
  let currentColumns=[],currentRows=[],currentTrades=[],currentEstimate=null;
  const events=[],segments=[],resets=[],failures={estimate:0,count:0,digit:0,row:0};
  for(let index=0;index<model.history.length;index++){
   const e=model.history[index];
   if(!keys(e,['action','data'])||!keys(e.data,['fields','index','side','value'])||
      !keys(e.data.fields,FIELDS)||!FIELDS.every(k=>text(e.data.fields[k]))||
      e.data.index!==null||e.data.side!==null||e.data.value!==null)return null;
   const f=e.data.fields,allowed=visible(board,digits.length,multipliers.length),action=e.action;
   if(FIELDS.some(k=>!allowed.includes(k)&&f[k]!==previous[k])||!['','0','1'].includes(f.shift))return null;
   previous={...f};issue='';
   const event={index,segment,action,fields:Object.fromEntries(allowed.map(k=>[k,f[k]])),accepted:true,effect:true};
   const fail=(kind,message)=>{issue=message;event.accepted=false;event.effect=false;event.failure=kind;failures[kind]++;};
   if(action==='b14-reset'){
    const first=board.firstEstimate;
    segments.push({segment,startIndex:segmentStart,endExclusive:index,endedByReset:true,rows:currentRows.length,columns:currentColumns.length,trades:currentTrades.length});
    resets.push({index,fromSegment:segment,toSegment:segment+1,retainedFirstEstimate:first});
    board=fresh();board.firstEstimate=first;segment++;segmentStart=index+1;countEvent=null;pendingTrades=[];
    currentColumns=[];currentRows=[];currentTrades=[];currentEstimate=null;event.nextSegment=segment;event.retainedFirstEstimate=first;
   }else if(action==='b14-estimate'){
    if(board.estimateOK)return null;
    const first=board.firstEstimate===null;board.firstEstimate??=f.estimate;
    Object.assign(event,{estimatedMultiplicand:task.estimate,multiplier:task.b,expected:Number(estimate),firstEstimateRecorded:first});
    if(enteredInteger(f.estimate)!==estimate){fail('estimate',estimateIssue);event.effect=first;}
    else{board.estimateOK=true;currentEstimate={index,raw:f.estimate,estimatedMultiplicand:task.estimate,multiplier:task.b,product:Number(estimate)};}
   }else if(action==='b14-mul-count'){
    if(!board.estimateOK||board.row>=multipliers.length||board.col>=digits.length||board.pending)return null;
    const raw=BigInt(digits[board.col])*BigInt(multipliers[board.row])+BigInt(board.carry);
    Object.assign(event,{row:board.row,column:board.col,aDigit:digits[board.col],bDigit:multipliers[board.row],incoming:board.carry,expected:Number(raw),withinRowUnit:10**board.col,rowScale:10**board.row});
    if(enteredInteger(f.raw)!==raw)fail('count',countIssue);
    else{board.pending={raw:Number(raw),loose:Number(raw),bundles:0};countEvent=index;pendingTrades=[];}
   }else if(action==='b14-trade'){
    // Below ten the original button is disabled. Such a history is not a
    // genuine failed click; unlike a visible premature digit it is rejected.
    if(!board.pending||board.pending.loose<10)return null;
    const before=cp(board.pending),unit=10n**BigInt(board.col),scale=10n**BigInt(board.row);
    board.pending.loose-=10;board.pending.bundles++;
    if(BigInt(before.loose)+10n*BigInt(before.bundles)!==BigInt(board.pending.loose)+10n*BigInt(board.pending.bundles)||
       BigInt(board.pending.loose)+10n*BigInt(board.pending.bundles)!==BigInt(board.pending.raw))return null;
    const trade={index,row:board.row,column:board.col,countEvent,withinRowUnit:Number(unit),rowScale:Number(scale),weightedUnit:Number(unit*scale),
     before,after:cp(board.pending),quantity:Number(BigInt(before.raw)*unit*scale)};
    currentTrades.push(trade);pendingTrades.push(index);Object.assign(event,trade);
   }else if(action==='b14-digit'){
    if(!board.pending)return null;
    Object.assign(event,{row:board.row,column:board.col,countEvent,raw:board.pending.raw,incoming:board.carry,loose:board.pending.loose,bundles:board.pending.bundles});
    if(board.pending.loose>=10||enteredInteger(f.digit)!==BigInt(board.pending.loose))fail('digit',digitIssue);
    else{
     const saved={row:board.row,col:board.col,...cp(board.pending),incoming:board.carry};
     const column={row:board.row,column:board.col,aDigit:digits[board.col],bDigit:multipliers[board.row],withinRowUnit:10**board.col,rowScale:10**board.row,
      incoming:board.carry,raw:board.pending.raw,digit:board.pending.loose,carry:board.pending.bundles,countEvent,digitEvent:index,tradeIndices:pendingTrades.slice()};
     if(column.raw!==column.aDigit*column.bDigit+column.incoming||column.raw!==column.digit+10*column.carry||column.tradeIndices.length!==column.carry)return null;
     board.work.push(saved);board.digits.push(board.pending.loose);board.carry=board.pending.bundles;board.pending=null;board.col++;
     currentColumns.push(column);countEvent=null;pendingTrades=[];
    }
   }else if(action==='b14-row'){
    if(!board.estimateOK||board.row>=multipliers.length||board.col!==digits.length||board.pending)return null;
    const row=board.row,scale=10n**BigInt(row),value=A*BigInt(multipliers[row])*scale;
    Object.assign(event,{row,multiplierDigit:multipliers[row],rowScale:Number(scale),expected:Number(value),lastCarry:board.carry});
    if(f.shift!==String(row)||enteredInteger(f.rowvalue)!==value)fail('row',rowIssue);
    else{
     const columns=currentColumns.filter(c=>c.row===row);if(columns.length!==digits.length)return null;
     const reconstructed=columns.reduce((sum,c)=>sum+BigInt(c.digit)*10n**BigInt(c.column),0n)+BigInt(board.carry)*10n**BigInt(digits.length);
     if(reconstructed!==A*BigInt(multipliers[row])||reconstructed*scale!==value)return null;
     currentRows.push({index,row,multiplierDigit:multipliers[row],rowScale:Number(scale),unshifted:Number(reconstructed),value:Number(value),
      digits:board.digits.slice(),lastCarry:board.carry,rawShift:f.shift,rawValue:f.rowvalue,columnEvents:columns.map(c=>c.digitEvent)});
     board.rows.push({value:Number(value),shift:row,digits:board.digits.slice(),carry:board.carry});board.row++;board.col=0;board.carry=0;board.digits=[];
    }
   }else return null;
   event.issue=issue;events.push(event);
  }
  const allowed=visible(board,digits.length,multipliers.length);
  if(!same(board,model.board)||issue!==model.issue||FIELDS.some(k=>!allowed.includes(k)&&model[k]!==previous[k])||
     !['','0','1'].includes(model.shift)||board.row!==multipliers.length||board.pending||
     !currentEstimate||!currentTrades.length||currentRows.length!==multipliers.length||currentColumns.length!==digits.length*multipliers.length)return null;
  const sum=currentRows.reduce((n,r)=>n+BigInt(r.value),0n);
  if(sum!==A*B||enteredInteger(model.answer)!==sum)return null;
  segments.push({segment,startIndex:segmentStart,endExclusive:model.history.length,endedByReset:false,rows:currentRows.length,columns:currentColumns.length,trades:currentTrades.length});
  return{
   kind:'multable',eventCount:events.length,events,segments,resets,failures,retainedHistoryOnly:true,historyAtCapacity:events.length===3000,
   historyLimit:3000,limitBehavior:'original-write-validation-block',
   construction:{multiplicand:task.a,multiplier:task.b,digits,multiplierDigits:multipliers,toolProvidedPlaceDisplay:true,
    currentSegment:segment,firstEstimate:{raw:board.firstEstimate,correct:enteredInteger(board.firstEstimate)===estimate},estimate:currentEstimate,
    columns:currentColumns,rows:currentRows,trades:currentTrades,product:Number(sum)},
   submittedAnswer:{raw:model.answer,value:Number(sum)},issue,
   independentAdditionProcessAssessed:false,independentMentalCalculationAssessed:false,independentAlgorithmDesignAssessed:false,
   freeExplanationAssessed:false,generalMasteryAssessed:false
  };
 }catch{return null;}
}
