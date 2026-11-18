// Equal-length units placed on the original grid and their saved count/unit.
// The tool supplies the grid and displayed count. This bounded record does not
// establish independent counting, physical measurement or unit-choice reasoning.
import * as original from './phase5/b28-model.js';
import {sessionTaskFor} from './bridges.js';
import {matchesNativeEvidenceTask,isEvidenceContext,hasExactKeys as keys,sameEvidence as same} from './evidence-contract.js';

const TYPE='x-m28-units';
const SOURCES=Object.freeze({
 lengthstart:{nodeId:'mt_KaF0SQvaiu',indices:[0,2]},
 sameunitlength:{nodeId:'mt_cqSf213hSa',indices:[0,1,2]},
 twounits:{nodeId:'mt_jHv4BgRK8B',indices:[2]}
});
// Associated copies and the three original practice tasks may be replayed,
// but only the six exact native positions above acquire a strict binding.
const REPLAY_SOURCES=Object.freeze({
 lengthstart:[0,2,-1],sameunitlength:[0,1,2,-1],twounits:[2,-1],
 'link-compareheight-lengthstart':[1],'link-lengthstart-sameunitlength':[0,1],
 'link-sameunitlength-lengthtools':[0],'link-sameunitlength-precisionunits':[0]
});
const sourceTask=t=>t?.type===TYPE&&Object.entries(REPLAY_SOURCES).some(([id,indices])=>indices.some(index=>same(sessionTaskFor(id,index),t)));
const cp=structuredClone,text=s=>typeof s==='string'&&s.length<=1200;
const dense=a=>Array.isArray(a)&&Object.keys(a).length===a.length;
const int=(n,a,b)=>Number.isInteger(n)&&n>=a&&n<=b;
const unitOptions=t=>['',...new Set([t.unit,'cm','m','g','kg','mL','L','秒','块','回形针','英寸'])];
const fresh=()=>({first:{},bad:false,positions:[],saved:null});
const coverage=(t,positions)=>{
 const result=Array(t.length).fill(0);
 for(const start of positions)for(let cell=start;cell<start+t.size;cell++)result[cell]++;
 return result;
};
const complete=a=>a.every(n=>n===1);
const gcd=(a,b)=>b?gcd(b,a%b):a<0n?-a:a;

// Preserve the original B20 spelling and its Number result for historical
// first/bad/failed-save semantics. A separate BigInt fraction tests exactness;
// original near-success is never rewritten as an original failure.
function entered(raw){
 if(!text(raw))return null;const s=raw.trim();let m,n,d,value;
 if((m=/^(-?\d+)\s+(\d+)\/(\d+)$/.exec(s))&&BigInt(m[3])!==0n){
  d=BigInt(m[3]);n=BigInt(m[1])*d+(m[1].startsWith('-')?-1n:1n)*BigInt(m[2]);
  value=Number(m[1])+(m[1].startsWith('-')?-1:1)*(Number(m[2])/Number(m[3]));
 }else if((m=/^(-?\d+)\/(\d+)$/.exec(s))&&BigInt(m[2])!==0n){
  n=BigInt(m[1]);d=BigInt(m[2]);value=Number(m[1])/Number(m[2]);
 }else if((m=/^(-?)(\d+)(?:\.(\d+))?$/.exec(s))){
  d=10n**BigInt((m[3]||'').length);n=(BigInt(m[2])*d+BigInt(m[3]||'0'))*(m[1]?-1n:1n);value=Number(s);
 }else return null;
 const g=gcd(n,d);n/=g;d/=g;return{n,d,value};
}
const fraction=q=>q?{numerator:String(q.n),denominator:String(q.d),text:q.d===1n?String(q.n):q.n+'/'+q.d}:null;
const exact=(q,count)=>!!q&&q.n===BigInt(count)*q.d;
const originalNear=(q,count)=>!!q&&Number.isFinite(q.value)&&Math.abs(q.value-count)<1e-7;
const recordIssue='先数一数，写下用了几个单位。';

export function unitcoverBinding(task,context={}){
 try{
  if(!isEvidenceContext(context))return null;
  const source=Object.hasOwn(SOURCES,context.sessionId)?SOURCES[context.sessionId]:null;
  if(!source||!source.indices.includes(context.index)||!matchesNativeEvidenceTask(task,context,{type:TYPE,nodeId:source.nodeId}))return null;
  return{nodeId:source.nodeId,method:null,question:'这些同样长的单位有没有从头到尾接好？保存的数量和单位是否与当前铺放对应？'};
 }catch{return null;}
}

export function replayUnitcoverEvidence(task,model){
 try{
  if(!sourceTask(task)||!keys(task,['type','prompt','length','size','unit','object','questions'])||
     !keys(model,['offset','estimate','error','measure','unit','prose','values','answers','seed','board','history','issue'])||
     !['offset','estimate','error','measure','unit','prose','issue'].every(k=>text(model[k]))||
     model.offset!=='2'||model.estimate!==''||model.error!==''||!dense(model.values)||model.values.length!==0||
     !dense(model.answers)||model.answers.length!==task.questions.length||
     !model.answers.every((a,i)=>text(a)&&['',...task.questions[i].options.map(x=>String(x[0]))].includes(a))||
     !unitOptions(task).includes(model.unit)||!int(model.seed,1,4294967295)||
     !dense(model.history)||!model.history.length||model.history.length>2000||
     !keys(model.board,['first','bad','positions','saved'])||
     !(keys(model.board.first,[])||keys(model.board.first,['measure'])&&text(model.board.first.measure))||
     typeof model.board.bad!=='boolean'||!dense(model.board.positions)||
     !model.board.positions.every((p,i,a)=>int(p,0,task.length-task.size)&&(!i||p>a[i-1]))||
     !(model.board.saved===null||keys(model.board.saved,['measure','unit'])&&text(model.board.saved.measure)&&unitOptions(task).includes(model.board.saved.unit))||
     !original.valid(task,model)||!original.inspect(task,model).correct)return null;
  const count=task.length/task.size;
  if(!Number.isInteger(count))return null;
  let board=fresh(),issue='',currentSave=null,firstMeasure=null;
  const placedAt=new Map(),events=[],records=[],removals=[],clears=[];
  for(let index=0;index<model.history.length;index++){
   const e=model.history[index];
   if(!keys(e,['a','d','f']))return null;
   const event={index,action:e.a};issue='';
   if(e.a==='place'){
    if(!keys(e.d,['index'])||typeof e.d.index!=='string'||!/^(0|[1-9]\d*)$/.test(e.d.index)||
       !int(Number(e.d.index),0,task.length-task.size)||!keys(e.f,[]))return null;
    const start=Number(e.d.index),at=board.positions.indexOf(start);
    Object.assign(event,{start,end:start+task.size,operation:at<0?'place':'remove'});
    if(at<0){board.positions.push(start);placedAt.set(start,index);}
    else{board.positions.splice(at,1);removals.push({index,start,end:start+task.size,placedAt:placedAt.get(start)});placedAt.delete(start);}
    board.positions.sort((a,b)=>a-b);
    const cells=coverage(task,board.positions);if(cells.some(n=>n>1))board.bad=true;
    Object.assign(event,{coverage:cells,overlap:cells.some(n=>n>1)});
    board.saved=null;currentSave=null;
   }else if(e.a==='clear'){
    if(!keys(e.d,[])||!keys(e.f,[]))return null;
    clears.push({index,positions:board.positions.slice(),retainedFirst:cp(board.first),retainedBad:board.bad});
    board.positions=[];board.saved=null;currentSave=null;placedAt.clear();
   }else if(e.a==='record'){
    if(!keys(e.d,[])||!keys(e.f,['measure','unit'])||!text(e.f.measure)||!unitOptions(task).includes(e.f.unit))return null;
    const q=entered(e.f.measure),numeric=!!q&&Number.isFinite(q.value),cells=coverage(task,board.positions);
    const record={index,measure:e.f.measure,unit:e.f.unit,numeric,quantity:fraction(q),
     originalNearCount:originalNear(q,count),exactCount:exact(q,count),unitMatches:e.f.unit===task.unit,
     coverage:cells,completeCoverage:complete(cells),saved:numeric};
    if(!numeric)issue=recordIssue;
    else{
     if(!Object.hasOwn(board.first,'measure')){
      board.first.measure=e.f.measure;firstMeasure={index,raw:e.f.measure,originalNearCount:record.originalNearCount,exactCount:record.exactCount};
     }
     board.saved=cp(e.f);currentSave={index,measure:e.f.measure,unit:e.f.unit,quantity:fraction(q)};
     if(!record.originalNearCount||!record.unitMatches)board.bad=true;
    }
    // A failed numeric save preserves the preceding saved pair and placement
    // lineage. Its issue may still be present after fields return to that pair.
    records.push(record);Object.assign(event,record);
   }else return null;
   event.issue=issue;events.push(event);
  }
  const cells=coverage(task,board.positions),quantity=entered(model.measure);
  if(!same(board,model.board)||issue!==model.issue||!currentSave||!firstMeasure||
     !complete(cells)||board.positions.length!==count||!exact(quantity,count)||
     model.measure!==board.saved.measure||model.unit!==board.saved.unit||model.unit!==task.unit||
     !task.questions.every((q,i)=>model.answers[i]===String(q.value)))return null;
  const placements=board.positions.map(start=>({start,end:start+task.size,size:task.size,placedAt:placedAt.get(start)}));
  if(placements.some(p=>!Number.isInteger(p.placedAt)||p.placedAt>=currentSave.index)||
     placements.reduce((n,p)=>n+BigInt(p.size),0n)!==BigInt(task.length))return null;
  return{
   kind:'unitcover',eventCount:events.length,events,records,removals,clears,retainedHistoryOnly:true,
   historyAtCapacity:events.length===2000,historyLimit:2000,
   limitBehavior:'whole-model-action-no-op-with-controller-metadata-write',
   construction:{length:task.length,size:task.size,count,unit:task.unit,positions:board.positions.slice(),coverage:cells,placements,
    saved:currentSave,firstMeasure,hadOriginalBad:board.bad,toolProvidedGrid:true,toolDisplayedCount:true},
   issue,prose:model.prose,independentCountingAssessed:false,physicalMeasurementAssessed:false,
   independentUnitChoiceAssessed:false,unitComparisonReasoningAssessed:false,freeExplanationAssessed:false,generalMasteryAssessed:false
  };
 }catch{return null;}
}
