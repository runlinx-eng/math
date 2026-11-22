import {initial,valid} from './phase5/b06-model.js';
import {hasExactKeys,latestSubmissionMatches,matchesNativeEvidenceTask} from './evidence-contract.js';

export const P106P_SOURCES=Object.freeze([Object.freeze({
  sessionId:'partswithin',index:2,nodeId:'mt_BK5xwkrD5C',type:'x-partbuild',
  taskHash:'dcc8018242bd2d64b108672982a1c4bc0775184243cc103610d9df4949feede4',
})]);

export function p106pPartWholeSnapshotsBinding(task,context) {
  const [row]=P106P_SOURCES;
  if (context?.sessionId!==row.sessionId||context?.index!==row.index||
      !matchesNativeEvidenceTask(task,context,row)) return null;
  return {nodeId:row.nodeId,kind:'p106p-part-whole-snapshots',method:null,question:'换颜色就算新的分法吗？哪些两部分相加还是八？'};
}

export function replayP106PPartWholeSnapshotsEvidence(task,model,context) {
  try {
    const binding=p106pPartWholeSnapshotsBinding(task,context);
    if (!binding||!hasExactKeys(model,Object.keys(initial(task)))||!valid(task,model)||
        !Array.isArray(model.saved)||Object.keys(model.saved).length!==model.saved.length||
        model.red+model.blue!==task.n||model.total!==task.n) return null;
    const exactPairs=new Set();
    const unordered=new Set();
    for (const pair of model.saved) {
      if (Object.keys(pair).length!==2||![...pair].every(Number.isSafeInteger)) return null;
      const [red,blue]=pair;
      const key=`${red},${blue}`;
      if (red+blue!==task.n||exactPairs.has(key)) return null;
      exactPairs.add(key);
      unordered.add(Math.min(red,blue));
    }
    if (unordered.size<2) return null;
    const combinations=[...unordered].sort((a,b)=>a-b).map(value=>[value,task.n-value]);
    return {...binding,combinations,evidenceScope:'saved-decompositions'};
  } catch {
    return null;
  }
}

export function submittedP106PPartWholeSnapshotsEvidence(task,model,record,context) {
  return latestSubmissionMatches(model,record)?replayP106PPartWholeSnapshotsEvidence(task,model,context):null;
}
