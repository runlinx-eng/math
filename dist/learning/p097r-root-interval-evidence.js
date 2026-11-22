import {initial,valid} from './phase5/b09-model.js';
import {cmp,normalized,parse,spanCmp,squareVsTwo} from './phase5/b09-math.js';
import {hasExactKeys,latestSubmissionMatches,matchesNativeEvidenceTask,sameEvidence} from './evidence-contract.js';

export const P097R_SOURCES=Object.freeze([Object.freeze({
  sessionId:'powerblocks',index:8,nodeId:'mt_hCVPYlF-7Y',type:'x-rootwindow',
  taskHash:'214564ebe0fdcb60a7b822a54c12b498b4a738023f3e2737f7885d5fa2514d10',
})]);

export function p097rRootIntervalBinding(task,context) {
  const [source]=P097R_SOURCES;
  if (context?.sessionId!==source.sessionId||context?.index!==source.index||
      !matchesNativeEvidenceTask(task,context,source)) return null;
  return {nodeId:source.nodeId,kind:'p097r-root-interval',method:null,
    question:'哪两个端点的平方夹住 2，为什么可以把 √2 近似写成 1.414？'};
}

export function replayP097RRootIntervalEvidence(task,model,context) {
  try {
    const binding=p097rRootIntervalBinding(task,context);
    if (!binding||!hasExactKeys(model,Object.keys(initial(task)))||!valid(task,model)||
        Object.keys(model.trials).length!==model.trials.length) return null;
    const windows=[];
    let current={a:[1,1],b:[2,1]};
    for (const trial of model.trials) {
      if (!hasExactKeys(trial,['a','b','kept'])||windows.length===8) return null;
      const a=parse(trial.a), b=parse(trial.b);
      if (!a||!b) return null;
      const kept=cmp(a,current.a)>=0&&cmp(b,current.b)<=0&&cmp(a,b)<0&&
        spanCmp(a,b,current.a,current.b)<0&&squareVsTwo(a)<0&&squareVsTwo(b)>0;
      if (trial.kept!==kept) return null;
      if (kept) {
        current={a,b};
        windows.push(current);
      }
    }
    if (!sameEvidence(windows,model.windows)||windows.length<2||
        spanCmp(current.a,current.b,[0,1],[1,1000])>0||
        cmp(current.a,[2827,2000])<0||cmp(current.b,[2829,2000])>=0||
        !['√2','sqrt(2)'].includes(normalized(model.exact))||
        model.decimal.trim()!=='1.414'||model.relation!=='approx') return null;
    return {...binding,interval:current,rounded:'1.414',kept:windows.length,attempted:model.trials.length};
  } catch {
    return null;
  }
}

export function submittedP097RRootIntervalEvidence(task,model,record,context) {
  return latestSubmissionMatches(model,record)?replayP097RRootIntervalEvidence(task,model,context):null;
}
