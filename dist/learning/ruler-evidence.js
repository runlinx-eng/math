// A source-bound simulated ruler: alignment, literal saved readings, the first
// finite estimate and the source's prescribed tool. No physical measurement,
// independent conversion, estimation quality or free-text reasoning is inferred.
import * as original from './phase5/b28-model.js';
import {sessionTaskFor} from './bridges.js';
import {matchesNativeEvidenceTask,isEvidenceContext,hasExactKeys as keys,sameEvidence as same} from './evidence-contract.js';

const TYPE='x-m28-ruler';
const SOURCES=Object.freeze({
 lengthstart:{indices:[1],nodeId:'mt_KaF0SQvaiu'},
 estimateLength:{indices:[0,1,2,3],nodeId:'mt_OzRZ89GrQW'},
 lengthtools:{indices:[0,1,2,3,4],nodeId:'mt_e4x3l2JeLI'},
 twounits:{indices:[0,1],nodeId:'mt_jHv4BgRK8B'},
 measurecalc:{indices:[0],nodeId:'mt_6oxQPNLHNv'},
 measuremoney:{indices:[0],nodeId:'mt_mFJ-2ZF6Tk'},
 communicate38:{indices:[1],nodeId:'mt_TMoHjMhRS2'},
 strategy39:{indices:[2],nodeId:'mt_mQcWGh02no'}
});
const ASSOCIATED=Object.freeze({
 'link-sameunitlength-lengthtools':[1],'link-lengthtools-lengthdifference':[0],
 'link-lengthtools-estimateLength':[0,1],'link-lengthtools-twounits':[0,1],
 'link-lengthtools-measureplot':[0],'link-measure-measurecalc':[1],
 'link-lengthtools-gridarea':[0],'link-measurecalc-walkperim':[0],
 'link-measurecalc-measureliquid':[0]
});
const REPLAY_SOURCES=Object.freeze({...Object.fromEntries(Object.entries(SOURCES).map(([id,s])=>[id,s.indices])),
 ...ASSOCIATED,estimateLength:[0,1,2,3,-1],lengthtools:[0,1,2,3,4,-1]});
const sourceTask=t=>t?.type===TYPE&&Object.entries(REPLAY_SOURCES).some(([id,is])=>is.some(i=>same(sessionTaskFor(id,i),t)));
const cp=structuredClone,text=s=>typeof s==='string'&&s.length<=1200;
const dense=a=>Array.isArray(a)&&Object.keys(a).length===a.length;
const range=s=>typeof s==='string'&&['-3','-2','-1','0','1','2','3'].includes(s);
const gcd=(a,b)=>b?gcd(b,a%b):a<0n?-a:a;
const fraction=(n,d)=>{const g=gcd(n,d);return{n:n/g,d:d/g};};
// Historical success/first/bad use the exact original Number parser behavior.
// A separate BigInt fraction decides whether the retained mathematics is exact.
function entered(raw){
 if(!text(raw))return null;const s=raw.trim();let m,n,d,value;
 if((m=/^(-?\d+)\s+(\d+)\/(\d+)$/.exec(s))&&BigInt(m[3])!==0n){
  d=BigInt(m[3]);n=BigInt(m[1])*d+(m[1].startsWith('-')?-1n:1n)*BigInt(m[2]);
  value=Number(m[1])+(m[1].startsWith('-')?-1:1)*(Number(m[2])/Number(m[3]));
 }else if((m=/^(-?\d+)\/(\d+)$/.exec(s))&&BigInt(m[2])!==0n){n=BigInt(m[1]);d=BigInt(m[2]);value=Number(m[1])/Number(m[2]);}
 else if((m=/^(-?)(\d+)(?:\.(\d+))?$/.exec(s))){d=10n**BigInt((m[3]||'').length);n=(BigInt(m[2])*d+BigInt(m[3]||'0'))*(m[1]?-1n:1n);value=Number(s);}
 else return null;return{...fraction(n,d),value};
}
const finite=q=>!!q&&Number.isFinite(q.value);
const exact=(a,b)=>!!a&&!!b&&a.n*b.d===b.n*a.d;
const near=(q,n)=>finite(q)&&Math.abs(q.value-n)<1e-7;
const absdiff=(a,b)=>{const n=a.n*b.d-b.n*a.d;return fraction(n<0n?-n:n,a.d*b.d);};
const quantity=q=>q?{numerator:String(q.n),denominator:String(q.d),text:q.d===1n?String(q.n):q.n+'/'+q.d}:null;
const unitOptions=t=>['',...new Set([t.unit,'cm','m','g','kg','mL','L','秒','块','回形针','英寸'].filter(Boolean))];
const fresh=t=>({first:{},bad:false,offset:t.initialOffset??2,tool:null,prediction:null,saved:null});

export function rulerBinding(task,context={}){
 try{
  if(!isEvidenceContext(context)||!Object.hasOwn(SOURCES,context.sessionId))return null;
  const s=SOURCES[context.sessionId];
  if(!s.indices.includes(context.index)||!matchesNativeEvidenceTask(task,context,{type:TYPE,nodeId:s.nodeId}))return null;
  return{nodeId:s.nodeId,method:null,question:task.estimate?'先留下估计，再把零刻度对齐；保存的读数与单位和估计相差多少？':'把尺的零刻度对齐后，保存的读数和单位怎样对应这条模拟物体？'};
 }catch{return null;}
}

export function replayRulerEvidence(task,model){
 try{
  if(!sourceTask(task)||!keys(model,['offset','estimate','error','measure','unit','prose','values','answers','seed','board','history','issue'])||
     !['offset','estimate','error','measure','unit','prose','issue'].every(k=>text(model[k]))||!range(model.offset)||
     !dense(model.values)||model.values.length||!dense(model.answers)||model.answers.length!==task.questions.length||
     !model.answers.every((v,i)=>text(v)&&['',...task.questions[i].options.map(q=>String(q[0]))].includes(v))||
     !unitOptions(task).includes(model.unit)||(!task.estimate&&(model.estimate!==''||model.error!==''))||
     !Number.isInteger(model.seed)||model.seed<1||model.seed>4294967295||
     !dense(model.history)||!model.history.length||model.history.length>2000||
     !keys(model.board,['first','bad','offset','tool','prediction','saved'])||
     !original.valid(task,model)||!original.inspect(task,model).correct)return null;
  const expected=entered(String(task.value)),actual=entered(String(task.actual??task.value));
  if(!finite(expected)||!finite(actual)||expected.n<0n||actual.n<0n)return null;
  const rounded=!exact(actual,expected),roundingDifference=absdiff(actual,expected);
  if(rounded&&(expected.d!==1n||(2n*actual.n+actual.d)/(2n*actual.d)!==expected.n||2n*roundingDifference.n>=roundingDifference.d))return null;
  let board=fresh(task),issue='',lastAlignment=null,lastTool=null,predictedAt=null,firstMeasure=null,saved=null;
  const events=[],alignments=[],tools=[],predictions=[],records=[];
  for(let index=0;index<model.history.length;index++){
   const e=model.history[index];if(!keys(e,['a','d','f']))return null;
   const event={index,action:e.a};issue='';
   if(e.a==='align'){
    if(!keys(e.d,[])||!keys(e.f,['offset'])||!range(e.f.offset))return null;
    const move={index,raw:e.f.offset,before:board.offset,after:Number(e.f.offset),retainedRecord:saved?.recordedAt??null};
    board.offset=move.after;lastAlignment=index;alignments.push(move);Object.assign(event,move);
   }else if(e.a==='tool'){
    if(!task.tools||!keys(e.d,['index'])||!keys(e.f,[])||!task.tools.some(t=>t.id===e.d.index))return null;
    const selection={index,selected:e.d.index,label:task.tools.find(t=>t.id===e.d.index).label,previous:board.tool,
     matchesSource:e.d.index===task.tool,invalidatedRecord:saved?.recordedAt??null};
    board.first.tool??=e.d.index;if(e.d.index!==task.tool)board.bad=true;
    board.tool=e.d.index;board.saved=null;saved=null;lastTool=index;tools.push(selection);Object.assign(event,selection);
   }else if(e.a==='predict'){
    if(!task.estimate||board.prediction!==null||!keys(e.d,[])||!keys(e.f,['estimate'])||!text(e.f.estimate))return null;
    const q=entered(e.f.estimate),prediction={index,raw:e.f.estimate,accepted:finite(q),quantity:finite(q)?quantity(q):null};
    if(!prediction.accepted)issue='先写一个估计，再用尺看。';
    else{board.prediction=e.f.estimate;predictedAt=index;}
    predictions.push(prediction);Object.assign(event,prediction);
   }else if(e.a==='record'){
    // The record, reading and unit controls are hidden until the first finite
    // prediction. The original API's hidden "先留下估计" path is not UI evidence.
    if((task.estimate&&board.prediction===null)||!keys(e.d,[])||!keys(e.f,['measure','unit'])||
       !text(e.f.measure)||!text(e.f.unit)||!unitOptions(task).includes(e.f.unit))return null;
    const q=entered(e.f.measure),record={index,raw:e.f.measure,unit:e.f.unit,offset:board.offset,tool:board.tool,
     prediction:board.prediction,alignedAt:lastAlignment,toolSelectedAt:lastTool,predictedAt,
     numeric:finite(q),originalNearReading:near(q,task.value),exactReading:finite(q)&&exact(q,expected),
     unitMatches:e.f.unit===task.unit,saved:false,retainedRecord:saved?.recordedAt??null};
    if(task.tool&&board.tool!==task.tool)issue='先选适合这件物体的工具。';
    else if(board.offset!==0)issue='把尺子的零刻度对准物体的起点。';
    else if(!record.numeric)issue='先读出长度。';
    else{
     board.first.measure??=e.f.measure;if(firstMeasure===null)firstMeasure={index,raw:e.f.measure,
      originalNearReading:record.originalNearReading,exactReading:record.exactReading,unit:e.f.unit};
     board.saved=cp(e.f);if(!record.originalNearReading||!record.unitMatches)board.bad=true;
     saved={recordedAt:index,raw:e.f.measure,unit:e.f.unit,quantity:quantity(q),alignedAt:lastAlignment,
      toolSelectedAt:lastTool,predictedAt,exact:record.exactReading&&record.unitMatches};record.saved=true;record.retainedRecord=index;
    }
    records.push(record);Object.assign(event,record);
   }else return null;
   event.issue=issue;events.push(event);
  }
  if(!same(board,model.board)||issue!==model.issue||model.offset!==String(board.offset)||board.offset!==0||
     !saved?.exact||!firstMeasure||!exact(entered(model.measure),expected)||
     model.measure!==board.saved.measure||model.unit!==board.saved.unit||model.unit!==task.unit||
     !task.questions.every((q,i)=>model.answers[i]===String(q.value)))return null;
  let estimation=null;
  if(task.estimate){
   const prediction=entered(board.prediction),error=entered(model.error);
   if(!finite(prediction)||!finite(error)||model.estimate!==board.prediction||!exact(error,absdiff(prediction,expected)))return null;
   estimation={predictedAt,rawPrediction:board.prediction,prediction:quantity(prediction),rawError:model.error,
    error:quantity(error),differenceFromReading:quantity(absdiff(prediction,expected)),errorIsCurrentAnswerOnly:true};
  }
  const {exact:_,...retained}=saved;
  return{
   kind:'ruler',shape:task.estimate?'estimate':task.tool?'tool':'plain',eventCount:events.length,events,alignments,tools,predictions,records,
   retainedHistoryOnly:true,historyAtCapacity:events.length===2000,historyLimit:2000,
   limitBehavior:'whole-model-action-no-op-with-controller-metadata-write-and-range-root-edit',
   construction:{expectedReading:quantity(expected),actualLength:quantity(actual),unit:task.unit,
    readingRule:rounded?'nearest-whole-source-unit':'exact-source-reading',roundingDifference:quantity(roundingDifference),
    currentOffset:board.offset,lastAlignment,record:retained,firstMeasure,firstTool:board.first.tool??null,
    selectedTool:board.tool,selectedToolLabel:task.tools?.find(t=>t.id===board.tool)?.label??null,
    estimation,hadOriginalBad:board.bad,toolProvidedDimensions:true,toolDrewRuler:true,translationPixelsPerStep:25},
   issue,prose:model.prose,physicalMeasurementAssessed:false,independentConversionAssessed:false,
   estimationQualityAssessed:false,independentSubtractionProcessAssessed:false,generalToolChoiceReasoningAssessed:false,
   freeExplanationAssessed:false,generalMasteryAssessed:false
  };
 }catch{return null;}
}
