import {initial,valid} from './phase5/b31-model.js';
import {hasExactKeys,latestSubmissionMatches,matchesNativeEvidenceTask,sameEvidence} from './evidence-contract.js';

export const P099B_SOURCES=Object.freeze([
  {
    "sessionId": "indirectmass",
    "index": 0,
    "nodeId": "mt_bnwHo5wfCD",
    "type": "x-m31-balance",
    "taskHash": "925193940e9b50cc117549768649d5ca55addc296df16e9d1d831e1bc85553e8"
  },
  {
    "sessionId": "indirectmass",
    "index": 2,
    "nodeId": "mt_bnwHo5wfCD",
    "type": "x-m31-balance",
    "taskHash": "d547e62fcc1ad259fd6de601579b45246f669ee70249537db6e7e0bf5016f611"
  }
].map(Object.freeze));

export function p099bBalanceOrderBinding(task,context) {
  const row=P099B_SOURCES.find(s=>s.sessionId===context?.sessionId&&s.index===context?.index);
  if (!row||!matchesNativeEvidenceTask(task,context,row)) return null;
  return {nodeId:row.nodeId,kind:'p099b-balance-order',method:null,question:'两次分别和同一个物体相比，怎样排出轻重？'};
}

export function replayP099BBalanceOrderEvidence(task,model,context) {
  try {
    const binding=p099bBalanceOrderBinding(task,context);
    if (!binding||!hasExactKeys(model,Object.keys(initial(task)))||!valid(task,model)||
        model.issue!==''||Object.keys(model.history).length!==model.history.length) return null;
    const {board}=initial(task);
    const masses=task.objects.map(item=>item.mass);
    const ascending=order=>order.every((id,i)=>i===0||masses[order[i-1]]<=masses[id]);
    for (const e of model.history) {
      if (!hasExactKeys(e,['a','i','f'])||!hasExactKeys(e.f,[])) return null;
      const {a,i}=e;
      if (a==='clear'&&i==='') {
        board.order=[];
      } else if (a==='test') {
        const j=task.pairs.findIndex((_,index)=>i===String(index));
        if (j<0) return null;
        if (!board.tested.includes(j)) board.tested.push(j);
        board.last=j;
      } else if (a==='order') {
        const j=task.objects.findIndex((_,index)=>i===String(index));
        if (j<0||board.order.includes(j)) return null;
        board.order.push(j);
        if (board.order.length===masses.length) {
          board.first.order??=[...board.order];
          if (!ascending(board.order)) board.bad=true;
        }
      } else return null;
    }
    if (board.tested.length!==task.pairs.length||board.order.length!==masses.length||
        !ascending(board.order)) return null;
    const proof={order:board.order,pairs:task.pairs.map(([a,b])=>({a,b,sign:Math.sign(masses[a]-masses[b])}))};
    if (!sameEvidence(board,model.board)) return null;
    return {...binding,...proof};
  } catch {
    return null;
  }
}

export function submittedP099BBalanceOrderEvidence(task,model,record,context) {
  return latestSubmissionMatches(model,record)?replayP099BBalanceOrderEvidence(task,model,context):null;
}
