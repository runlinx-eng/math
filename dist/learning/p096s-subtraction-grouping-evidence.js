import {initial,num,valid} from './phase5/b10-model.js';
import {hasExactKeys,latestSubmissionMatches,matchesNativeEvidenceTask,sameEvidence} from './evidence-contract.js';

export const P096S_SOURCES=Object.freeze([Object.freeze({
  sessionId:'regroupadd',index:2,nodeId:'mt_T76hKqXf0z',type:'x-subgroups',
  taskHash:'7c4a6de5df2c93a0ffdc3c8eded0690f7970382bd4e87a22883d4a48d5ecc460',
})]);

export function p096sSubtractionGroupingBinding(task,context) {
  const [row]=P096S_SOURCES;
  if (context?.sessionId!==row.sessionId||context?.index!==row.index||
      !matchesNativeEvidenceTask(task,context,row)) return null;
  return {nodeId:row.nodeId,kind:'p096s-subtraction-grouping',method:null,question:'括号移到另一边，先算哪一步？两种结果相等吗？'};
}

export function replayP096SSubtractionGroupingEvidence(task,model,context) {
  try {
    const binding=p096sSubtractionGroupingBinding(task,context);
    if (!binding||!hasExactKeys(model,Object.keys(initial(task)))||!valid(task,model)||
        model.issue!==''||Object.keys(model.history).length!==model.history.length) return null;
    const left=10-3;
    const right=3-2;
    const expected=[[left,left-2],[right,10-right]];
    if (!sameEvidence(model.paths,expected)) return null;
    const entries=[[],[]];
    for (const event of model.history) {
      if (!hasExactKeys(event,['branch','next'])||![0,1].includes(event.branch)) return null;
      const next=num(event.next);
      if (next===null||next<0||next>30) return null;
      entries[event.branch].push(next);
    }
    // The native arrays retain push order, but not pop timing. A retained
    // two-entry stack must end with the last push in that branch. The first
    // entry can remain below it while other second entries come and go.
    if (!expected.every(([first,last],i)=>entries[i].at(-1)===last&&entries[i].slice(0,-1).includes(first))) return null;
    return {...binding,paths:expected,evidenceScope:'retained-answers-with-compatible-push-history'};
  } catch {
    return null;
  }
}

export function submittedP096SSubtractionGroupingEvidence(task,model,record,context) {
  return latestSubmissionMatches(model,record)?replayP096SSubtractionGroupingEvidence(task,model,context):null;
}
