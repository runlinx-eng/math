// Reconstruct the whole-array saves from the original conversion control.
// The last saved values and the current answers are the observable evidence.
import {inspect,valid} from './phase5/b28-model.js';
import {number} from './phase5/b20-model.js';
import {sessionTaskFor} from './bridges.js';
import {matchesNativeEvidenceTask,isEvidenceContext,hasExactKeys,sameEvidence} from './evidence-contract.js';

const TYPE='x-m28-convert';
const SOURCES={
 baseconversions:{indices:[0,1,2],nodeId:'mt_d8al9JcajP'},
 metricconversions:{indices:[0,1,2],nodeId:'mt_Zks8xyInSG'},
 imperialconversions:{indices:[0,1,2],nodeId:'mt_p6MhZJYYPN'},
 decimalunits:{indices:[0,1,2],nodeId:'mt_2VpdPjvewx'},
 unitstories:{indices:[0,1,2],nodeId:'mt_SqhXQhAEUf'},
 mileskm:{indices:[0,1,2],nodeId:'mt_3tPI0HqqcN'},
 practicalmeasure:{indices:[0],nodeId:'mt_5HV4mbgSGH'},
 measureliquid:{indices:[2],nodeId:'mt_-af65bxfdp'},
 model38:{indices:[0],nodeId:'mt_8xVHooT4aI'}
};
// The associated activities and the six legacy practice tasks repeat these
// same original tasks. Only the matching native context may display feedback.
const isOriginalTask=task=>task?.type===TYPE&&Object.entries(SOURCES)
 .some(([id,{indices}])=>indices.some(index=>sameEvidence(sessionTaskFor(id,index),task)));
const EXACT_FACTORS=new Map([
 ['km:m',[1000n,1n]],['小时:分钟',[60n,1n]],['周:天',[7n,1n]],
 ['cm:mm',[10n,1n]],['kg:g',[1000n,1n]],['g:kg',[1n,1000n]],
 ['m:cm',[100n,1n]],['L:mL',[1000n,1n]]
]);
const GIVEN_APPROXIMATIONS=new Map([
 ['英寸:cm',[5n,2n]],['kg:磅',[11n,5n]],['L:英制品脱',[7n,4n]],['英里:km',[8n,5n]]
]);
const isText=value=>typeof value==='string'&&value.length<=1200;
const dense=value=>Array.isArray(value)&&Object.keys(value).length===value.length&&
 Object.keys(value).every((key,index)=>key===String(index));
const textArray=(value,length)=>dense(value)&&value.length===length&&value.every(isText);

function exactNumber(raw){
 const value=raw.trim();
 const mixed=/^(-?)(\d+)\s+(\d+)\/(\d+)$/.exec(value);
 if(mixed){
  const [,sign,whole,part,denominator]=mixed,d=BigInt(denominator);
  return d?[((BigInt(whole)*d+BigInt(part))*(sign?-1n:1n)),d]:null;
 }
 const fraction=/^(-?\d+)\/(\d+)$/.exec(value);
 if(fraction){
  const d=BigInt(fraction[2]);
  return d?[BigInt(fraction[1]),d]:null;
 }
 const decimal=/^(-?)(\d+)(?:\.(\d+))?$/.exec(value);
 if(!decimal)return null;
 const [,sign,whole,tail='']=decimal;
 return [BigInt(whole+tail)*(sign?-1n:1n),10n**BigInt(tail.length)];
}
const equalQuantity=(left,right)=>left!==null&&right!==null&&left[0]*right[1]===right[0]*left[1];

function conversionRows(task){
 const factors=task.approx?GIVEN_APPROXIMATIONS:EXACT_FACTORS;
 return task.rows.map(row=>{
  const factor=factors.get(row.from+':'+row.to),source=exactNumber(String(row.value));
  if(!factor||!source)return null;
  const result=[source[0]*factor[0],source[1]*factor[1]];
  if(!equalQuantity(result,exactNumber(String(row.expected))))return null;
  return {source:row.label||row.value+' '+row.from,unit:row.to,expected:String(row.expected),result,
   factor:{numerator:String(factor[0]),denominator:String(factor[1])}};
 });
}

export function convertBinding(task,context={}){
 try{
  if(!isEvidenceContext(context)||!Object.hasOwn(SOURCES,context.sessionId))return null;
  const {nodeId,indices}=SOURCES[context.sessionId];
  if(!indices.includes(context.index)||!matchesNativeEvidenceTask(task,context,{type:TYPE,nodeId}))return null;
  return {nodeId,kind:task.approx?'given-approximation':'exact',method:null,
   question:task.approx?'按题目给的近似关系，换单位后的数量大约是多少？':'换成另一种单位后，哪两个数表示同一个量？'};
 }catch{return null;}
}

export function replayConvertEvidence(task,model){
 try{
  if(!isOriginalTask(task)||!hasExactKeys(model,['offset','estimate','error','measure','unit','prose','values','answers','seed','board','history','issue'])||
     model.offset!==String(task.initialOffset??2)||!['estimate','error','measure','unit'].every(key=>model[key]==='')||
     !isText(model.prose)||!isText(model.issue)||!textArray(model.values,task.rows.length)||
     !textArray(model.answers,task.questions.length)||!dense(model.history)||
     model.history.length>2000||!hasExactKeys(model.board,['first','bad','saved'])||
     !valid(task,model)||!inspect(task,model).correct)return null;
  const rows=conversionRows(task);
  if(rows.some(row=>row===null))return null;

  const board={first:{},bad:false,saved:null},events=[];
  let issue='',firstIndex=null,savedIndex=null;
  for(const [index,event] of model.history.entries()){
   if(!hasExactKeys(event,['a','d','f'])||event.a!=='convert'||!hasExactKeys(event.d,[])||
      !hasExactKeys(event.f,['values'])||!textArray(event.f.values,rows.length))return null;
   const values=event.f.values,numbers=values.map(number),finite=numbers.every(Number.isFinite);
   issue='';
   if(finite){
    if(firstIndex===null){firstIndex=index;board.first.values=values.slice();}
    board.saved=values.slice();
    savedIndex=index;
    if(!numbers.every((value,i)=>Math.abs(value-task.rows[i].expected)<1e-7))board.bad=true;
   }else issue='先把下面的数量填完整。';
   events.push({index,action:'convert',values:values.slice(),saved:finite,retainedSave:savedIndex,issue});
  }
  if(!sameEvidence(board,model.board)||issue!==model.issue||savedIndex===null||
     !sameEvidence(model.values,board.saved)||
     !rows.every((row,i)=>equalQuantity(exactNumber(model.values[i]),row.result)))return null;

  const currentQuestions=[];
  for(const [i,question] of task.questions.entries()){
   const raw=model.answers[i];
   const option=question.options?.find(([value])=>String(value)===raw);
   if(question.options?(!option||raw!==String(question.value)):
      !equalQuantity(exactNumber(raw),exactNumber(String(question.value))))return null;
   currentQuestions.push({label:question.label,raw,display:option?option[1]:raw,onlyCurrentField:true,editTimeRecorded:false});
  }
  return {
   kind:'convert',relationship:task.approx?'given-approximation':'exact',
   rows:rows.map(({result,...row},i)=>({...row,raw:model.values[i]})),events,eventCount:events.length,
   firstSave:{index:firstIndex,values:board.first.values},saved:{index:savedIndex,values:board.saved},
   hadOriginalBad:board.bad,issue,prose:model.prose,currentQuestions,
   toolDrawsBars:true,relativeBarWidthsArePerRow:true,retainedHistoryOnly:true,
   historyAtCapacity:events.length===2000,historyLimit:2000,
   conversionStepsRecorded:false,freeExplanationAssessed:false,physicalMeasurementAssessed:false,generalMasteryAssessed:false
  };
 }catch{return null;}
}
