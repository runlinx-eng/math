// Source-bound records of a tool-supplied scale or digital display. The saved
// raw reading is observable; mental interpolation/conversion steps are not.
import * as original from './phase5/b28-model.js';
import {sessionTaskFor} from './bridges.js';
import {matchesNativeEvidenceTask,isEvidenceContext,hasExactKeys as keys,sameEvidence as same} from './evidence-contract.js';

const TYPE='x-m28-scale';
const SOURCES=Object.freeze({
 weightstart:{indices:[2],nodeId:'mt_zd0YkB3xNj'},
 readscales:{indices:[0,1,2,3,4],nodeId:'mt_SOM6Imm2sO'},
 measurecalc:{indices:[1,3],nodeId:'mt_6oxQPNLHNv'}
});
const REPLAY_SOURCES=Object.freeze({weightstart:[2,-1],readscales:[0,1,2,3,4,-1],measurecalc:[1,3],
 'link-measure-readscales':[1],'link-measureliquid-readscales':[1]});
const sourceTask=t=>t?.type===TYPE&&Object.entries(REPLAY_SOURCES).some(([id,is])=>is.some(i=>same(sessionTaskFor(id,i),t)));
const cp=structuredClone,text=s=>typeof s==='string'&&s.length<=1200;
const dense=a=>Array.isArray(a)&&Object.keys(a).length===a.length&&Array.from({length:a.length},(_,i)=>Object.hasOwn(a,i)).every(Boolean);
function fraction(n,d){if(d===0n)throw Error('zero denominator');if(d<0n){n=-n;d=-d;}let a=n<0n?-n:n,b=d;while(b){[a,b]=[b,a%b];}return{n:n/a,d:d/a};}
const add=(a,b)=>fraction(a.n*b.d+b.n*a.d,a.d*b.d),sub=(a,b)=>fraction(a.n*b.d-b.n*a.d,a.d*b.d);
const mul=(a,b)=>fraction(a.n*b.n,a.d*b.d),div=(a,b)=>fraction(a.n*b.d,a.d*b.n);
const exact=(a,b)=>!!a&&!!b&&a.n*b.d===b.n*a.d;
const quantity=q=>({numerator:String(q.n),denominator:String(q.d),text:q.d===1n?String(q.n):q.n+'/'+q.d});
// Number is retained only for the original historical near/first/bad rules.
// Current mathematical equality is checked independently with BigInt fractions.
function entered(raw){
 if(!text(raw))return null;const s=raw.trim();let m,n,d,value;
 if((m=/^(-?\d+)\s+(\d+)\/(\d+)$/.exec(s))&&BigInt(m[3])!==0n){
  d=BigInt(m[3]);n=BigInt(m[1])*d+(m[1].startsWith('-')?-1n:1n)*BigInt(m[2]);
  value=Number(m[1])+(m[1].startsWith('-')?-1:1)*(Number(m[2])/Number(m[3]));
 }else if((m=/^(-?\d+)\/(\d+)$/.exec(s))&&BigInt(m[2])!==0n){n=BigInt(m[1]);d=BigInt(m[2]);value=Number(m[1])/Number(m[2]);}
 else if((m=/^(-?)(\d+)(?:\.(\d+))?$/.exec(s))){d=10n**BigInt((m[3]||'').length);n=(BigInt(m[2])*d+BigInt(m[3]||'0'))*(m[1]?-1n:1n);value=Number(s);}
 else return null;return{...fraction(n,d),value};
}
const finite=q=>!!q&&Number.isFinite(q.value),near=(q,n)=>finite(q)&&Math.abs(q.value-n)<1e-7;
const units=t=>['',...new Set([t.unit,'cm','m','g','kg','mL','L','秒','块','回形针','英寸'].filter(Boolean))];

function givenInstrument(t){
 const value=entered(String(t.value));if(!finite(value))return null;
 if(t.kind==='digital'){
  const m=/^(\d{2}):(\d{2}(?:\.\d+)?)$/.exec(t.display);if(!m||t.unit!=='秒')return null;
  const minutes=entered(m[1]),seconds=entered(m[2]);
  if(!finite(minutes)||!finite(seconds)||minutes.n<0n||seconds.n<0n||seconds.n>=60n*seconds.d)return null;
  const minuteSeconds=mul(minutes,{n:60n,d:1n}),total=add(minuteSeconds,seconds);
  if(!exact(total,value))return null;
  return{shape:'digital',kind:t.kind,unit:t.unit,display:t.display,minutes:quantity(minutes),
   seconds:quantity(seconds),secondsPerMinute:60,minuteSeconds:quantity(minuteSeconds),
   expectedReading:quantity(total),suppliedByTool:true,conversionStepsRecorded:false};
 }
 if(!['dial','jug','thermo','ruler'].includes(t.kind))return null;
 const low=entered(String(t.min)),high=entered(String(t.max)),major=entered(String(t.major));
 if(!finite(low)||!finite(high)||!finite(major)||major.n<=0n)return null;
 const span=sub(high,low),offset=sub(value,low);
 if(span.n<=0n||offset.n<0n||sub(high,value).n<0n)return null;
 const majorCount=div(span,major),majorPosition=div(offset,major);
 if(majorCount.d!==1n||majorCount.n<1n)return null;
 let interval=majorPosition.n/majorPosition.d;if(interval===majorCount.n)interval--;
 const lower=add(low,mul(major,{n:interval,d:1n})),upper=add(lower,major);
 const result={shape:'analog',kind:t.kind,unit:t.unit,minimum:quantity(low),maximum:quantity(high),
  majorStep:quantity(major),majorIntervals:quantity(majorCount),lowerLabel:quantity(lower),
  upperLabel:quantity(upper),fractionBetweenLabels:quantity(div(sub(value,lower),major)),
  positionAcrossRange:quantity(div(offset,span)),expectedReading:quantity(value),
  suppliedByTool:true,interpolationStepsRecorded:false};
 if(t.kind==='ruler'){
  const minor=entered(String(t.minor));if(!finite(minor)||minor.n<=0n)return null;
  const perMajor=div(major,minor),fromMin=div(offset,minor),total=div(span,minor);
  if(perMajor.d!==1n||fromMin.d!==1n||total.d!==1n)return null;
  Object.assign(result,{minorStep:quantity(minor),minorIntervalsPerMajor:quantity(perMajor),
   minorIntervalsFromMinimum:quantity(fromMin),totalMinorIntervals:quantity(total)});
 }
 return result;
}

export function scaleBinding(task,context={}){
 try{
  if(!isEvidenceContext(context)||!Object.hasOwn(SOURCES,context.sessionId))return null;
  const s=SOURCES[context.sessionId];
  if(!s.indices.includes(context.index)||!matchesNativeEvidenceTask(task,context,{type:TYPE,nodeId:s.nodeId}))return null;
  return{nodeId:s.nodeId,kind:task.kind==='digital'?'digital':'analog',method:null,
   question:task.kind==='digital'?'这份显示里的分和秒分别表示多少？保存的秒数怎样与显示对应？':
    '图上的相邻标记与单位是什么？保存的读数怎样对应指针、液面或终点的位置？'};
 }catch{return null;}
}

export function replayScaleEvidence(task,model){
 try{
  if(!sourceTask(task)||!keys(model,['offset','estimate','error','measure','unit','prose','values','answers','seed','board','history','issue'])||
     !['offset','estimate','error','measure','unit','prose','issue'].every(k=>text(model[k]))||
     model.offset!==String(task.initialOffset??2)||model.estimate!==''||model.error!==''||
     !dense(model.values)||model.values.length||!dense(model.answers)||model.answers.length!==task.questions.length||
     !model.answers.every(text)||!units(task).includes(model.unit)||
     !Number.isInteger(model.seed)||model.seed<1||model.seed>4294967295||
     !dense(model.history)||!model.history.length||model.history.length>2000||
     !keys(model.board,['first','bad','saved'])||!original.valid(task,model)||!original.inspect(task,model).correct)return null;
  const instrument=givenInstrument(task),target=entered(String(task.value));if(!instrument)return null;
  let board={first:{},bad:false,saved:null},issue='',saved=null,firstMeasure=null;
  const events=[];
  for(let index=0;index<model.history.length;index++){
   const e=model.history[index];
   if(!keys(e,['a','d','f'])||e.a!=='record'||!keys(e.d,[])||!keys(e.f,['measure','unit'])||
      !text(e.f.measure)||!text(e.f.unit)||!units(task).includes(e.f.unit))return null;
   const q=entered(e.f.measure),step={index,action:'record',raw:e.f.measure,unit:e.f.unit,
    numeric:finite(q),originalNearReading:near(q,task.value),exactReading:finite(q)&&exact(q,target),
    unitMatches:e.f.unit===task.unit,saved:false,retainedRecord:saved?.recordedAt??null};
   issue='';
   if(!step.numeric)issue='先写下读到的数字。';
   else{
    board.first.measure??=e.f.measure;
    if(firstMeasure===null)firstMeasure={index,raw:e.f.measure,unit:e.f.unit,
     originalNearReading:step.originalNearReading,exactReading:step.exactReading};
    board.saved=cp(e.f);if(!step.originalNearReading||!step.unitMatches)board.bad=true;
    saved={recordedAt:index,raw:e.f.measure,unit:e.f.unit,quantity:quantity(q),exact:step.exactReading&&step.unitMatches};
    step.saved=true;step.retainedRecord=index;
   }
   step.issue=issue;events.push(step);
  }
  if(!same(board,model.board)||issue!==model.issue||!saved?.exact||!firstMeasure||
     model.measure!==board.saved.measure||model.unit!==board.saved.unit||model.unit!==task.unit||
     !exact(entered(model.measure),target))return null;
  const currentQuestions=[];
  for(const[q,i]of task.questions.map((q,i)=>[q,i])){
   // The sole original follow-up is a current cm-to-mm answer. There is no
   // answer-edit timestamp or conversion action in the original event format.
   if(task.kind!=='ruler'||task.unit!=='cm'||task.questions.length!==1||q.options)return null;
   const answer=entered(model.answers[i]),converted=mul(target,{n:10n,d:1n});
   if(!finite(answer)||!exact(answer,converted)||!exact(entered(String(q.value)),converted))return null;
   currentQuestions.push({label:q.label,raw:model.answers[i],quantity:quantity(answer),unit:'mm',
    sourceUnit:'cm',unitsPerSourceUnit:10,onlyCurrentField:true,editTimeRecorded:false,conversionStepsRecorded:false});
  }
  const {exact:_,...record}=saved;
  return{kind:'scale',shape:instrument.shape,eventCount:events.length,events,
   construction:{instrument,record,firstMeasure,currentQuestions,hadOriginalBad:board.bad},
   retainedHistoryOnly:true,historyAtCapacity:events.length===2000,historyLimit:2000,
   limitBehavior:'whole-model-action-no-op-with-controller-metadata-write',issue,prose:model.prose,
   physicalMeasurementAssessed:false,independentInterpolationProcessAssessed:false,
   independentConversionAssessed:false,freeExplanationAssessed:false,generalMasteryAssessed:false};
 }catch{return null;}
}
