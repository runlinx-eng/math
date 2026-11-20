// #312 WIP: observational replay for eight exact B09 directed-jump originals.
// Not an A admission until source hashes, current submitted attempt, browser/CI
// artifacts and independent new-main Required/Fallback have been reviewed.
import * as b09 from './phase5/b09-model.js';
import {isEvidenceContext,matchesNativeEvidenceTask,hasExactKeys as keys,sameEvidence as same} from './evidence-contract.js';

const SOURCES=Object.freeze({
 linejumps:{nodeId:'mt_19j_5AuuQI',indices:[1,2,3]},
 negativecontext:{nodeId:'mt_1KkvzwYxbR',indices:[1]},
 signedwalk:{nodeId:'mt_9QzSnn8m80',indices:[0,1,2,5]}
});
const integer=Number.isSafeInteger;
const signed=t=>t.op==='+'?t.operand:-t.operand;
const exactInteger=(raw,n)=>typeof raw==='string'&&
 /^[-+]?\d+$/.test(raw.trim())&&integer(n)&&Number(raw.trim())===n;

export function directedJumpBinding(task,context={}){
 if(!isEvidenceContext(context))return null;
 const source=Object.hasOwn(SOURCES,context.sessionId)?SOURCES[context.sessionId]:null;
 if(!source||!source.indices.includes(context.index)||
    !matchesNativeEvidenceTask(task,context,{type:'x-directedjump',nodeId:source.nodeId})||
    task.reverse||!integer(task.start)||!integer(task.operand)||
    !integer(task.min)||!integer(task.max)||task.min>task.max||
    !['+','-'].includes(task.op))return null;
 return {nodeId:source.nodeId,kind:'directed-jump',method:null,
   question:'每一跳的方向和长度分别是什么？为什么终点是起点加上所有有向变化，而不是跳跃长度本身？'};
}

export function replayDirectedJumpEvidence(task,model,context={}){
 try{
  const binding=directedJumpBinding(task,context);
  if(!binding||!keys(model,Object.keys(b09.initial(task)))||
     !Array.isArray(model.jumps)||!Array.isArray(model.history)||
     !model.jumps.length||model.jumps.length>40||
     // The original undo pops jumps but not history. Thus there is no
     // complete chronology after undo or anchor reset: fail closed.
     !same(model.jumps,model.history)||
     !Object.keys(model.history).every((k,i)=>k===String(i))||
     !Object.keys(model.jumps).every((k,i)=>k===String(i))||
     !model.touched||model.anchor!==task.start||
     typeof model.committed!=='string'||!model.committed.length||
     // Once the original prediction is committed, the UI no longer exposes
     // the guess field. A later mismatch cannot be explained by native input.
     model.guess!==model.committed||
     // Non-reverse originals never display or enable reference controls.
     model.reference!==0||model.refTouched!==false||model.refSaved!==null||
     !exactInteger(model.answer,task.start+signed(task))||
     !b09.valid(task,model)||!b09.inspect(task,model).correct)return null;
  let at=task.start;
  const events=[];
  for(const [index,delta] of model.history.entries()){
   if(!integer(delta)||delta===0||Math.abs(delta)>100)return null;
   const next=at+delta;
   if(!integer(next)||next<task.min||next>task.max)return null;
   events.push({index,from:at,change:delta,direction:delta>0?'right':'left',
     unitLength:Math.abs(delta),to:next});
   at=next;
  }
  if(at!==task.start+signed(task)||
    (task.path&&!same(model.jumps,task.path))||
    (task.parts&& (model.jumps.length!==task.parts||
      model.jumps.some(x=>Math.sign(x)!==Math.sign(signed(task)))))||
    (task.zero&&model.zero!=='reference'))return null;
  return {kind:'directed-jump',nodeId:binding.nodeId,
   sessionId:context.sessionId,index:context.index,start:task.start,
   operation:task.op,operand:task.operand,signedChange:signed(task),end:at,
   observableSuccessfulJumps:events,
   originalJumpHistoryEqualsCurrentPath:true,
   undoOrAnchorResetChronologyProven:false,
   initialGuessCorrectnessAssessed:false,
   handwrittenDrawingAssessed:false,
   learnerMasteryAssessed:false};
 }catch{return null;}
}
