// Source-bound simulated balance evidence. The original drawing supplies the
// qualitative tilt; chosen addends and saved raw quantities remain distinct.
// No physical weighing, independently performed addition, or mastery is inferred.
import * as original from './phase5/b28-model.js';
import {sessionTaskFor} from './bridges.js';
import {matchesNativeEvidenceTask,isEvidenceContext,hasExactKeys as keys,sameEvidence as same} from './evidence-contract.js';

const TYPE='x-m28-balance';
const SOURCES=Object.freeze({
 compareweight:{indices:[0,1,2],nodeId:'mt_-P1kdZhHbL'},
 weightstart:{indices:[0,1],nodeId:'mt_zd0YkB3xNj'},
 measurecalc:{indices:[2],nodeId:'mt_6oxQPNLHNv'}
});
const REPLAY_SOURCES=Object.freeze({compareweight:[0,1,2,-1],weightstart:[0,1],measurecalc:[2],
 'link-compareweight-indirectmass':[0],'link-compareweight-weightstart':[0,1],
 'link-measurecalc-precisefractions':[0]});
const sourceTask=t=>t?.type===TYPE&&Object.entries(REPLAY_SOURCES).some(([id,is])=>is.some(i=>same(sessionTaskFor(id,i),t)));
const cp=structuredClone,text=s=>typeof s==='string'&&s.length<=1200;
const dense=a=>Array.isArray(a)&&Object.keys(a).length===a.length;
const gcd=(a,b)=>b?gcd(b,a%b):a<0n?-a:a;
const fraction=(n,d)=>{const g=gcd(n,d);return{n:n/g,d:d/g};};
// Preserve original Number/near outcomes in historical first/bad/saved fields;
// use a separate exact fraction for the mathematics of the current saved work.
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
const quantity=q=>q?{numerator:String(q.n),denominator:String(q.d),text:q.d===1n?String(q.n):q.n+'/'+q.d}:null;
const total=weights=>({n:weights.reduce((sum,n)=>sum+BigInt(n),0n),d:1n});
const unitOptions=t=>['',...new Set([t.unit,'cm','m','g','kg','mL','L','秒','块','回形针','英寸'].filter(Boolean))];
const fresh=()=>({first:{},bad:false,tested:false,weights:[],choice:null,saved:null});

export function balanceBinding(task,context={}){
 try{
  if(!isEvidenceContext(context)||!Object.hasOwn(SOURCES,context.sessionId))return null;
  const s=SOURCES[context.sessionId];
  if(!s.indices.includes(context.index)||!matchesNativeEvidenceTask(task,context,{type:TYPE,nodeId:s.nodeId}))return null;
  return{nodeId:s.nodeId,kind:task.mode,method:null,question:task.mode==='compare'?
   '先使用天平，再比较两件物体；当前选择怎样对应较低的一侧或平衡？':
   '保留的砝码表示哪些加数？平衡时，保存的数量和单位怎样与它们对应？'};
 }catch{return null;}
}

export function replayBalanceEvidence(task,model){
 try{
  if(!sourceTask(task)||!['compare','weigh'].includes(task.mode)||
     !keys(model,['offset','estimate','error','measure','unit','prose','values','answers','seed','board','history','issue'])||
     !['offset','estimate','error','measure','unit','prose','issue'].every(k=>text(model[k]))||
     model.offset!==String(task.initialOffset??2)||model.estimate!==''||model.error!==''||
     !dense(model.values)||model.values.length||!dense(model.answers)||model.answers.length!==task.questions.length||
     !model.answers.every((v,i)=>text(v)&&['',...task.questions[i].options.map(q=>String(q[0]))].includes(v))||
     (task.mode==='compare'&&(model.measure!==''||model.unit!==''))||
     (task.mode==='weigh'&&!unitOptions(task).includes(model.unit))||
     !Number.isInteger(model.seed)||model.seed<1||model.seed>4294967295||
     !dense(model.history)||!model.history.length||model.history.length>2000||
     !keys(model.board,['first','bad','tested','weights','choice','saved'])||
     !original.valid(task,model)||!original.inspect(task,model).correct)return null;
  let relation=null,lighter=null,left=null,right=null,mass=null;
  if(task.mode==='compare'){
   left=entered(String(task.left.mass));right=entered(String(task.right.mass));
   if(!finite(left)||!finite(right)||left.n<=0n||right.n<=0n)return null;
   const difference=left.n*right.d-right.n*left.d;
   relation=difference===0n?'equal':difference>0n?'left':'right';
   lighter=difference===0n?null:difference>0n?'right':'left';
   if(task.want!==relation||task.questions.some(q=>q.value!==lighter))return null;
  }else{
   mass=entered(String(task.mass));
   if(!finite(mass)||mass.n<=0n||mass.d!==1n||!task.weights.length||
      !task.weights.every(w=>Number.isSafeInteger(w)&&w>0))return null;
  }
  let board=fresh(),issue='',saved=null,firstMeasure=null;
  const events=[],tests=[],choices=[],weights=[],removals=[],records=[],retainedWeights=[];
  for(let index=0;index<model.history.length;index++){
   const e=model.history[index];if(!keys(e,['a','d','f']))return null;
   const event={index,action:e.a};issue='';
   if(e.a==='test'){
    if(task.mode!=='compare'||!keys(e.d,[])||!keys(e.f,[]))return null;
    const step={index,previouslyTested:board.tested,relation};board.tested=true;
    tests.push(step);Object.assign(event,step);
   }else if(e.a==='choice'){
    if(task.mode!=='compare'||!board.tested||!keys(e.d,['index'])||!keys(e.f,[])||
       !task.choices.some(c=>c.id===e.d.index))return null;
    const step={index,selected:e.d.index,label:task.choices.find(c=>c.id===e.d.index).label,
     previous:board.choice,matchesRelation:e.d.index===relation,testedAt:tests.at(-1).index};
    board.first.choice??=e.d.index;if(e.d.index!==task.want)board.bad=true;board.choice=e.d.index;
    choices.push(step);Object.assign(event,step);
   }else if(e.a==='weight'){
    if(task.mode!=='weigh'||!keys(e.d,['index'])||!keys(e.f,[])||
       !task.weights.some(w=>String(w)===e.d.index))return null;
    const amount=Number(e.d.index),step={index,amount,beforeCount:board.weights.length,
     beforeTotal:quantity(total(board.weights)),added:board.weights.length<30,retainedRecord:saved?.recordedAt??null};
    if(step.added){board.weights.push(amount);retainedWeights.push({addedAt:index,amount});board.tested=true;
     board.saved=null;saved=null;step.retainedRecord=null;}
    Object.assign(step,{afterCount:board.weights.length,afterTotal:quantity(total(board.weights)),ignoredAtWeightLimit:!step.added});
    weights.push(step);Object.assign(event,step);
   }else if(e.a==='remove'){
    if(task.mode!=='weigh'||!keys(e.d,[])||!keys(e.f,[]))return null;
    const step={index,beforeCount:board.weights.length,beforeTotal:quantity(total(board.weights)),
     removed:board.weights.length?cp(retainedWeights.at(-1)):null,retainedRecord:saved?.recordedAt??null};
    if(step.removed){board.weights.pop();retainedWeights.pop();board.saved=null;saved=null;step.retainedRecord=null;}
    Object.assign(step,{afterCount:board.weights.length,afterTotal:quantity(total(board.weights))});
    removals.push(step);Object.assign(event,step);
   }else if(e.a==='record'){
    if(task.mode!=='weigh'||!keys(e.d,[])||!keys(e.f,['measure','unit'])||
       !text(e.f.measure)||!text(e.f.unit)||!unitOptions(task).includes(e.f.unit))return null;
    const q=entered(e.f.measure),sum=total(board.weights),step={index,raw:e.f.measure,unit:e.f.unit,
     numeric:finite(q),originalNearMass:near(q,task.mass),exactMass:finite(q)&&exact(q,mass),
     unitMatches:e.f.unit===task.unit,weightTotal:quantity(sum),balanced:exact(sum,mass),
     saved:false,retainedRecord:saved?.recordedAt??null};
    if(!step.numeric)issue='先记录用了多少单位。';
    else{
     board.first.measure??=e.f.measure;
     if(firstMeasure===null)firstMeasure={index,raw:e.f.measure,unit:e.f.unit,
      originalNearMass:step.originalNearMass,exactMass:step.exactMass,balanced:step.balanced};
     board.saved=cp(e.f);if(!step.originalNearMass||!step.unitMatches)board.bad=true;
     saved={recordedAt:index,raw:e.f.measure,unit:e.f.unit,quantity:quantity(q),
      weightTotal:quantity(sum),balanced:step.balanced,exact:step.exactMass&&step.unitMatches};
     step.saved=true;step.retainedRecord=index;
    }
    records.push(step);Object.assign(event,step);
   }else return null;
   event.issue=issue;events.push(event);
  }
  if(!same(board,model.board)||issue!==model.issue||!board.tested||
     !task.questions.every((q,i)=>model.answers[i]===String(q.value)))return null;
  let construction;
  if(task.mode==='compare'){
   if(!tests.length||!choices.length||board.choice!==relation)return null;
   construction={mode:'compare',left:{name:task.left.name,sourceMass:quantity(left)},
    right:{name:task.right.name,sourceMass:quantity(right)},relation,lighter,
    choice:cp(choices.at(-1)),firstChoice:cp(choices[0]),firstTestAt:tests[0].index,
    currentQuestions:task.questions.map((q,i)=>({label:q.label,raw:model.answers[i],onlyCurrentField:true})),
    hadOriginalBad:board.bad,sourceMassValuesNotVisible:true,toolRenderedComparison:true,
    comparisonIsQualitative:true,tiltPixelsPerSide:31};
  }else{
   const sum=total(board.weights);
   if(!exact(sum,mass)||!saved?.exact||!firstMeasure||!exact(entered(model.measure),mass)||
      model.measure!==board.saved.measure||model.unit!==board.saved.unit||model.unit!==task.unit)return null;
   const {exact:_,...record}=saved;
   construction={mode:'weigh',object:task.object||'物体',sourceMass:quantity(mass),unit:task.unit,
    weights:cp(retainedWeights),sum:quantity(sum),record,firstMeasure,hadOriginalBad:board.bad,
    toolShowsChosenAddends:true,toolShowsTotal:false,toolDrawsIndividualWeights:false};
  }
  return{kind:'balance',shape:task.mode,eventCount:events.length,events,tests,choices,weights,removals,records,
   construction,retainedHistoryOnly:true,historyAtCapacity:events.length===2000,historyLimit:2000,weightLimit:30,
   limitBehavior:'whole-model-action-no-op-with-controller-metadata-write',issue,prose:model.prose,
   physicalMeasurementAssessed:false,independentAdditionProcessAssessed:false,independentConversionAssessed:false,
   sizePredictsMassAssessed:false,freeExplanationAssessed:false,generalMasteryAssessed:false};
 }catch{return null;}
}
