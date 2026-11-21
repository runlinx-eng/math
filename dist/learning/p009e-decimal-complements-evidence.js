import {initial, inspect, valid} from './phase5/b17-model.js';
import {hasExactKeys, isEvidenceContext, latestSubmissionMatches, matchesNativeEvidenceTask, sameEvidence} from './evidence-contract.js';
const reviewed = [
  {
    "sessionId": "decimalmeasure3",
    "index": 3,
    "nodeId": "mt_sA2OvTiech",
    "type": "x-complementpair",
    "taskHash": "3163da45832ea57c20e567390b5c7da7838be4725c5ad1be335f45d2af50612b",
    "task": {
      "type": "x-complementpair",
      "left": "0.375",
      "prompt": "已有0.375这段，另一段要多长，接起来才刚好是1？统一写三位小数。"
    }
  },
  {
    "sessionId": "decimalmeasure3",
    "index": 4,
    "nodeId": "mt_sA2OvTiech",
    "type": "x-complementpair",
    "taskHash": "b2729bf3190891d1f7010199cb36e22cec91cd86244ee0d161b86785101a8efb",
    "task": {
      "type": "x-complementpair",
      "prompt": "自己选两段，接起来刚好到1。统一用三位小数记录，末尾补0也可以。"
    }
  }
];
export const P009E_SOURCES = Object.freeze(reviewed.map(({task,...source})=>Object.freeze(source)));
export function p009eDecimalComplementsBinding(task,context) {
  if (!isEvidenceContext(context)) return null;
  const row = reviewed.find(entry=>entry.sessionId===context.sessionId && entry.index===context.index);
  if (!row || !sameEvidence(row.task,task) || !matchesNativeEvidenceTask(task,context,row)) return null;
  return {nodeId:row.nodeId,kind:'p009e-decimal-complements',method:null,question:"用千分之一作单位，两段如何正好接到 1？"};
}
export function replayP009EDecimalComplementsEvidence(task,model,context) {
  try {
    const binding=p009eDecimalComplementsBinding(task,context);
    if (!binding || !hasExactKeys(model,Object.keys(initial(task))) || !valid(task,model) ||
        model.issue!=='' || !model.history.length || Object.keys(model.history).length!==model.history.length) return null;
    const fields=Object.keys(initial(task)).filter(key=>!['history','board','issue'].includes(key));
    const validSegment=raw=>/^0\.\d{3}$/.test(raw);
    const thousandths=raw=>Number(raw.slice(2));
    let left=null,right=null,first=null,issue=false;
    for (const event of model.history) {
      if (!hasExactKeys(event,['a','d','f'])||!hasExactKeys(event.d,[])||!hasExactKeys(event.f,fields)) return null;
      issue=false;
      if (event.a==='reset') {
        left=null;
        right=null;
      } else if (event.a==='pair') {
        const pair=[event.f.left,event.f.right];
        first??=pair;
        if (pair.every(validSegment)) [left,right]=pair;
        else issue=true;
      } else return null;
    }
    if (issue||left===null||right===null||left!==model.left||right!==model.right||
        (task.left&&left!==task.left)||thousandths(left)+thousandths(right)!==1000||
        !sameEvidence({left,right,first},model.board)||!inspect(task,model).correct) return null;
    return {binding,left:thousandths(left),right:thousandths(right),unit:1000};
  } catch {
    return null;
  }
}
export function submittedP009EDecimalComplementsEvidence(task,model,record,context) {
  return latestSubmissionMatches(model,record) ? replayP009EDecimalComplementsEvidence(task,model,context) : null;
}
