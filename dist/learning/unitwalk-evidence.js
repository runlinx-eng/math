// Fixed unit-fraction moves only. The B16 grader and its tasks stay unchanged.
// Replayed mathematics is evidence about this saved work, not click provenance
// or an assessment of the learner's explanation, independence or mastery.
import * as walks from './phase5/b16-model.js';
import {isEvidenceContext,matchesNativeEvidenceTask,sameEvidence as same,hasExactKeys as keys} from './evidence-contract.js';

const SOURCES=Object.freeze({
 lineplaces:{indices:[0,1,2,3],nodeId:'mt_Kr3IyA6m-O'},
 unitcopies:{indices:[0,1,2],nodeId:'mt_09sySPqM9Z'},
 wholefractions:{indices:[1,2,3,4],nodeId:'mt_AYzE1EAvI0'},
 translateamount:{indices:[3],nodeId:'mt_3VmBdlAeOZ',label:'连接数轴、情境与算式'},
 storyfraction:{indices:[2],nodeId:'mt_dXq9VWm31W',label:'在情境、图形与算式间转换'},
 tenpieces:{indices:[0],nodeId:'mt_YzM5goBctT'},
 decimalnames:{indices:[1],nodeId:'mt_Vi4Vo5xs_g'},
 fractionmeasure:{indices:[3],nodeId:'mt_wB-GBDkoNr'},
 mixedrename:{indices:[0,1],nodeId:'mt_o_p-3tCxiM'}
});

export function unitwalkBinding(task,context={}){
 if(!isEvidenceContext(context))return null;
 const source=Object.hasOwn(SOURCES,context.sessionId)?SOURCES[context.sessionId]:null;
 if(!source||!source.indices.includes(context.index)||
    !matchesNativeEvidenceTask(task,context,{type:'x-unitwalk',nodeId:source.nodeId}))return null;
 const question='从0到1这一段被分成几份？每一小步表示多少？向前和退回时，位置怎样变化？跨过1以后，小步的长度会变吗？';
 return {nodeId:source.nodeId,question,method:source.label?
  {nodeId:source.nodeId,label:source.label,code:'ccss-math:MP.2'}:null};
}

const fieldKeys=Object.keys(walks.fields);
const text=s=>typeof s==='string'&&s.length<=2000;
const integer=(n,min=0,max=2000)=>Number.isSafeInteger(n)&&n>=min&&n<=max;
// Keep the original input syntax, including +4 and 4.0, without coercing other
// JavaScript forms such as 0x4 or 4e0 into a unit length.
const scalar=s=>text(s)&&/^[+-]?\d{1,12}(?:\.\d{1,8})?$/.test(s.trim())?Number(s):null;
const equal=(s,n,d=1)=>{
 if(!text(s))return false;
 const r=walks.rational(s);
 return !!r&&r.every(Number.isSafeInteger)&&r[1]>0&&
  BigInt(r[0])*BigInt(d)===BigInt(n)*BigInt(r[1]);
};

// B16 exposes partition, forward, backward and reset throughout a walk. The
// saved input text is not the applied unit: only a successful partition changes
// board.parts. Replay every visible request, including failed/no-effect ones,
// and keep earlier units in separate epochs instead of silently erasing them.
export function replayWalkHistory(task,model,chunk=1){
 const fresh=first=>({parts:1,steps:[],first}),events=[],failedRequests=[],ineffectiveRequests=[],epochs=[];
 let b=fresh(null),issue='',resetCount=0,partitionCount=0;
 const begin=(cause,historyIndex)=>{const epoch={index:epochs.length,cause,historyIndex,parts:b.parts,steps:[],advances:0,retreats:0};epochs.push(epoch);return epoch;};
 let current=begin('initial',-1);
 for(const [historyIndex,e] of model.history.entries()){
  if(!keys(e,['action','data'])||!keys(e.data,['fields'])||!keys(e.data.fields,fieldKeys)||
     !fieldKeys.every(k=>text(e.data.fields[k]))||!['partition','walk','walk-back','reset'].includes(e.action))return null;
  const before=structuredClone(b),f=e.data.fields;issue='';let accepted=true,reason=null;
  if(e.action==='reset'){
   b=fresh(b.first);resetCount++;current=begin('reset',historyIndex);
  }else if(e.action==='partition'){
   const p=scalar(f.parts);
   if(!integer(p,1,12)){accepted=false;reason='invalid-partition';issue='每个0到1的长度先分成1到12个相等间隔。';}
   else{b.parts=p;b.steps=[];partitionCount++;current=begin('partition',historyIndex);}
  }else{
   const from=b.steps.length,limit=(Math.ceil(task.n/task.d)+1)*b.parts;
   let delta;
   if(e.action==='walk'){
    // This is the original PRE-move bound. A grouped move may cross it.
    if(from>=limit){accepted=false;reason='forward-limit';}
    else{delta=chunk;b.first??=f.parts;for(let i=1;i<=chunk;i++)b.steps.push(from+i);current.advances++;}
   }else if(from===0){accepted=false;reason='already-at-zero';}
   else{delta=-1;b.steps.pop();current.retreats++;}
   if(delta!==undefined)current.steps.push({delta,from:[from,b.parts],to:[from+delta,b.parts]});
  }
  const entry={historyIndex,epoch:current.index,action:e.action,fields:structuredClone(f),accepted,
   reason,before,after:structuredClone(b),issue};events.push(entry);
  if(!accepted)(issue?failedRequests:ineffectiveRequests).push(entry);
 }
 if(!same(b,model.board)||model.issue!==issue)return null;
 return {board:b,current,epochs,events,failedRequests,ineffectiveRequests,resetCount,partitionCount,
  historyScope:'all-recorded-visible-walk-requests'};
}

export function replayUnitwalkEvidence(task,model){
 try{
  if(task?.type!=='x-unitwalk'||!integer(task.n,1)||!integer(task.d,2,12)||
     Object.hasOwn(task,'chunk')||Object.hasOwn(task,'buy')||
     !keys(model,[...fieldKeys,'board','history','issue'])||
     !fieldKeys.every(k=>text(model[k]))||!text(model.issue)||
     !Array.isArray(model.history)||model.history.length<2||model.history.length>2000)return null;
  for(const flag of ['copies','whole','decimal','bounds','halfBound'])
   if(task[flag]!==undefined&&typeof task[flag]!=='boolean')return null;
  if(task.axisMax!==undefined&&!integer(task.axisMax,1))return null;

  const d=task.d,n=task.n,whole=Math.floor(n/d),remainder=n%d;
  const ceiling=whole+(remainder?1:0),history=replayWalkHistory(task,model);
  if(!history)return null;
  const b=history.board,{advances,retreats}=history.current;
  const steps=history.current.steps.map(({delta,from,to})=>({direction:delta,from,to}));
  if(!advances||b.parts!==d||b.steps.length!==n||
     advances-retreats!==n||scalar(model.parts)!==d||!equal(model.answer,n,d))return null;
  if(task.copies){
   const terms=model.equation.replace(/\s/g,'').split('+');
   if(scalar(model.copies)!==n||terms.length!==n||!terms.every(s=>equal(s,1,d)))return null;
  }
  if(task.whole&&(!equal(model.whole,whole)||!equal(model.remainder,remainder,d)))return null;
  if(task.decimal&&!equal(model.decimal,n,d))return null;
  if(task.bounds&&(scalar(model.left)!==whole||scalar(model.right)!==ceiling))return null;
  if(task.halfBound&&(2*n>=d||model.relation!=='<'))return null;
  // Additional observations never replace or loosen original completion rules.
  if(!walks.valid(task,model)||!walks.inspect(task,model).correct)return null;
  return {start:[0,d],end:[n,d],unit:[1,d],steps,advances,retreats,whole,history,
   remainder:[remainder,d],decimal:task.decimal?model.decimal:null,
   bounds:task.bounds?[whole,ceiling]:null};
 }catch{return null;}
}
