import {initial, valid} from './phase5/b34-model.js';
import {equal} from './phase5/b16-model.js';
import {hasExactKeys, latestSubmissionMatches, matchesNativeEvidenceTask, sameEvidence} from './evidence-contract.js';

export const P103G_SOURCES = Object.freeze([Object.freeze({
  sessionId:'repeat34',index:2,nodeId:'mt_WXW0hjNhph',type:'x-p34-growth',
  taskHash:'993cc4053b9f1506b726619870d35e4eb676c3231cdbbe0ef454fcdb6a7e1e28',
})]);

export function p103gPatternGrowthBinding(task, context) {
  const [row] = P103G_SOURCES;
  if (context?.sessionId !== row.sessionId || context?.index !== row.index ||
      !matchesNativeEvidenceTask(task,context,row)) return null;
  return {nodeId:row.nodeId,kind:'p103g-pattern-growth',method:null,question:'前三组每次增加几块？下一组应该有几块？'};
}

export function replayP103GPatternGrowthEvidence(task,model,context) {
  try {
    const binding=p103gPatternGrowthBinding(task,context);
    if (!binding || !hasExactKeys(model,Object.keys(initial(task))) || !valid(task,model) ||
        model.issue !== '' || Object.keys(model.history).length!==model.history.length) return null;
    const step=task.known[1]-task.known[0];
    if (!task.known.every((value,i)=>value===task.known[0]+i*step)) return null;
    const next=task.known.at(-1)+step;
    if (next !== task.target) return null;
    const slots=Array.from({length:next},(_,i)=>i);
    const filled=new Set();
    let turned=false;
    for (const event of model.history) {
      if (!hasExactKeys(event,['a','i','v','w']) || event.v!=='' || event.w!=='') return null;
      if (event.a==='turn' && event.i==='') {
        turned=true;
      } else if (event.a==='fill' && (event.i==='' || /^\d+$/.test(event.i))) {
        const i=event.i==='' ? slots.find(slot=>!filled.has(slot)) : Number(event.i);
        if (i!==undefined && i>=0 && i<next) filled.add(i);
      } else {
        return null;
      }
    }
    if (filled.size!==next || !sameEvidence({first:{},bad:false,filled:slots,turned},model.board) ||
        !equal(model.answers[0],next) || !equal(model.answers[1],step)) return null;
    return {...binding,step,next};
  } catch {
    return null;
  }
}

export function submittedP103GPatternGrowthEvidence(task,model,record,context) {
  return latestSubmissionMatches(model,record) ? replayP103GPatternGrowthEvidence(task,model,context) : null;
}
