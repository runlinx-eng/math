import {initial,valid} from './phase5/b36-model.js';
import {hasExactKeys,latestSubmissionMatches,matchesNativeEvidenceTask,sameEvidence} from './evidence-contract.js';

export const P098V_SOURCES=Object.freeze([
  {
    "sessionId": "quadratic36",
    "index": 1,
    "nodeId": "mt_GZuoYaDdWd",
    "type": "x-f36-live",
    "taskHash": "b34f8ea1c53fe868d343e9c50644751d4ebcc2e75726e5c8cd26f3d85a3b6d80"
  }
].map(Object.freeze));

export function p098vCoefficientViewsBinding(task,context) {
  const [row]=P098V_SOURCES;
  if (row.sessionId!==context?.sessionId||row.index!==context?.index||
      !matchesNativeEvidenceTask(task,context,row)) return null;
  return {nodeId:row.nodeId,kind:'p098v-coefficient-views',method:null,
    question:'平方项系数从正变负时，为什么两端的方向会变？'};
}

export function replayP098VCoefficientViewsEvidence(task,model,context) {
  try {
    const binding=p098vCoefficientViewsBinding(task,context);
    if (!binding||!hasExactKeys(model,Object.keys(initial(task)))||!valid(task,model)||
        model.issue!==''||Object.keys(model.history).length!==model.history.length) return null;
    const {board}=initial(task);
    for (const e of model.history) {
      if (!hasExactKeys(e,['a','i','v','w','z'])||e.v||e.w||e.z) return null;
      if (e.a==='change'&&['a,-1','a,1'].includes(e.i)) {
        const coefficient=board.a+Number(e.i.slice(2));
        if (coefficient>=-3&&coefficient<=3) board.a=coefficient;
      } else if (e.a==='save'&&e.i==='') {
        if (!board.views.some(view=>view.a===board.a)) board.views.push({a:board.a});
      } else return null;
    }
    if (!sameEvidence(board,model.board)||
        !task.required.every(view=>board.views.some(found=>found.a===view.a))||
        model.answers[0].trim()!=='down') return null;
    return {...binding,savedCoefficients:board.views.map(view=>view.a),openingForNegative:'down'};
  } catch {
    return null;
  }
}

export function submittedP098VCoefficientViewsEvidence(task,model,record,context) {
  return latestSubmissionMatches(model,record)?replayP098VCoefficientViewsEvidence(task,model,context):null;
}
