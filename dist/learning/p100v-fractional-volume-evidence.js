import {initial,valid} from './phase5/b31-model.js';
import {equal,rational} from './phase5/b16-model.js';
import {hasExactKeys,latestSubmissionMatches,matchesNativeEvidenceTask,sameEvidence} from './evidence-contract.js';

export const P100V_SOURCES=Object.freeze([
  {
    "sessionId": "fractionvolume",
    "index": 3,
    "nodeId": "mt_IlDaxVr60U",
    "type": "x-m31-product",
    "taskHash": "20cd22353a7b014e7ff80546231b87ca894c7b8ea9386abd2cbd9e395ca804f6"
  }
].map(Object.freeze));

export function p100vFractionalVolumeBinding(task,context) {
  const row=P100V_SOURCES.find(s=>s.sessionId===context?.sessionId&&s.index===context?.index);
  if (!row||!matchesNativeEvidenceTask(task,context,row)) return null;
  return {nodeId:row.nodeId,kind:'p100v-fractional-volume',method:null,question:'先算底面积，再乘深度。底面积和体积的单位分别是什么？'};
}

export function replayP100VFractionalVolumeEvidence(task,model,context) {
  try {
    const binding=p100vFractionalVolumeBinding(task,context);
    if (!binding||!hasExactKeys(model,Object.keys(initial(task)))||!valid(task,model)||
        model.issue!==''||Object.keys(model.history).length!==model.history.length) return null;
    const {board}=initial(task);
    for (const e of model.history) {
      if (!hasExactKeys(e,['a','i','f'])||e.a!=='turn'||e.i!==''||!hasExactKeys(e.f,[])) return null;
      board.turned=true;
    }
    const dimensions=task.labels.map(label=>rational(label.replace('¼',' 1/4').replace('½',' 1/2')));
    const [[ln,ld],[wn,wd],[dn,dd]]=dimensions;
    const base=[ln*wn,ld*wd], volume=[base[0]*dn,base[1]*dd];
    if (!board.turned||!equal(model.base,...base)||!equal(model.volume,...volume)||
        !equal(model.product,...volume)||model.unit!==task.unit+'³') return null;
    const proof={base,volume,unit:model.unit};
    if (!sameEvidence(board,model.board)) return null;
    return {...binding,...proof};
  } catch {
    return null;
  }
}

export function submittedP100VFractionalVolumeEvidence(task,model,record,context) {
  return latestSubmissionMatches(model,record)?replayP100VFractionalVolumeEvidence(task,model,context):null;
}
