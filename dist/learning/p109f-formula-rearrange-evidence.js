import {eq,formCorrect,initial,valid} from './phase5/b36-model.js';
import {hasExactKeys,latestSubmissionMatches,matchesNativeEvidenceTask,sameEvidence} from './evidence-contract.js';

export const P109F_SOURCES=Object.freeze([
  {
    "sessionId": "plot36",
    "index": 1,
    "nodeId": "mt_-3udyo6VyB",
    "type": "x-f36-form",
    "taskHash": "92f26d9061a486b290e77cdc8b0106859079a3d9a326c0e7af9a846220c0e6cd"
  },
  {
    "sessionId": "rearrange36",
    "index": 1,
    "nodeId": "mt_3qrCtdoVAU",
    "type": "x-f36-form",
    "taskHash": "df025886dc2e247d139b98de32de582c1314f24cdcff6d1dd18e45534d6181dc"
  },
  {
    "sessionId": "rearrange36",
    "index": 2,
    "nodeId": "mt_3qrCtdoVAU",
    "type": "x-f36-form",
    "taskHash": "1b4297b6e0a2a1580f91f4f2990ac8024275128b9e434cb31f0f7f56ae919f9d"
  },
  {
    "sessionId": "rearrange36",
    "index": 3,
    "nodeId": "mt_3qrCtdoVAU",
    "type": "x-f36-form",
    "taskHash": "2029c13f6ca017a85f03f8d017e6f13f21c0e70d6d09f25f4de56e239f26a400"
  }
].map(Object.freeze));

export function p109fFormulaRearrangeBinding(task,context) {
  const row=P109F_SOURCES.find(s=>s.sessionId===context?.sessionId&&s.index===context?.index);
  if (!row||!matchesNativeEvidenceTask(task,context,row)) return null;
  return {nodeId:row.nodeId,kind:'p109f-formula-rearrange',method:null,
    question:'移项或除法以后，原有关系怎样保持？有哪些值要排除或同时保留？'};
}

export function replayP109FFormulaRearrangeEvidence(task,model,context) {
  try {
    const binding=p109fFormulaRearrangeBinding(task,context);
    if (!binding||!hasExactKeys(model,Object.keys(initial(task)))||!valid(task,model)||
        model.issue!==''||Object.keys(model.history).length!==model.history.length) return null;
    const {board}=initial(task);
    for (const event of model.history) {
      if (!hasExactKeys(event,['a','i','v','w','z'])||event.a!=='form'||event.i!=='') return null;
      const fields={value:event.v,second:event.w,third:event.z};
      const correct=formCorrect(task,fields);
      board.first.form??=fields;
      if (!correct) board.bad=true;
      board.trials.push({fields,correct});
    }
    const last=board.trials.at(-1);
    if (!sameEvidence(board,model.board)||!last?.correct||
        !sameEvidence(last.fields,{value:model.value,second:model.second,third:model.third})||
        !task.questions.every((q,i)=>q.kind==='choice'
          ? model.answers[i].trim()===q.value
          : eq(model.answers[i],q.value))) return null;
    return {...binding,mode:task.mode,subject:task.subject,form:last.fields,matchedInputs:task.questions.length};
  } catch {
    return null;
  }
}

export function submittedP109FFormulaRearrangeEvidence(task,model,record,context) {
  return latestSubmissionMatches(model,record)?replayP109FFormulaRearrangeEvidence(task,model,context):null;
}
