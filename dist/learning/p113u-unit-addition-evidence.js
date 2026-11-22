import {equation, initial, valid} from './phase5/b10-model.js';
import {hasExactKeys, latestSubmissionMatches, matchesNativeEvidenceTask} from './evidence-contract.js';

export const P113U_SOURCES = Object.freeze([
  {
    "sessionId": "scaleadd",
    "index": 2,
    "nodeId": "mt_3e_PQxwC12",
    "type": "x-unitadd",
    "taskHash": "5b4ee2fc32304e1151dea7f0ebc52eac200457604b5218823057abc6e1374c57"
  },
  {
    "sessionId": "scaleadd",
    "index": 3,
    "nodeId": "mt_3e_PQxwC12",
    "type": "x-unitadd",
    "taskHash": "8ed11ea4a3d2508ed1f682b22ee34152a0d6e18084299ca5cbbbf3775aeb100d"
  },
  {
    "sessionId": "scaleadd",
    "index": 4,
    "nodeId": "mt_3e_PQxwC12",
    "type": "x-unitadd",
    "taskHash": "8911952e6454629a8599363b5c973c3e7edd122f6cc0516e385049de36b92be8"
  }
].map(Object.freeze));

export function p113uUnitAdditionBinding(task, context) {
  const row = P113U_SOURCES.find(source=>source.sessionId === context?.sessionId && source.index === context?.index);
  if (!row || !matchesNativeEvidenceTask(task,context,row)) return null;
  return {nodeId:row.nodeId,kind:'p113u-unit-addition',method:null,question:'这次加的是几个十、几个一？满十后怎样换捆？'};
}

export function replayP113UUnitAdditionEvidence(task, model, context) {
  try {
    const binding = p113uUnitAdditionBinding(task,context);
    if (!binding || !hasExactKeys(model,Object.keys(initial(task))) || !valid(task,model) ||
        model.issue !== '' || !model.joined || Object.keys(model.history).length !== model.history.length) return null;
    let joined = null;
    let exchanges = 0;
    for (const event of model.history) {
      if (!hasExactKeys(event,['action','tens','ones'])) return null;
      const {action,tens,ones} = event;
      if (!Number.isInteger(tens) || tens < 0 || tens > 10 ||
          !Number.isInteger(ones) || ones < 0 || ones > 20) return null;
      if (action === 'join') {
        if (joined?.tens !== tens || joined?.ones !== ones) exchanges = 0;
        joined = {tens,ones};
      } else if (action === 'exchange') {
        if (joined?.tens !== tens || joined?.ones !== ones || task.start % 10 + ones - exchanges * 10 < 10) return null;
        exchanges++;
      } else {
        return null;
      }
    }
    const tens = Math.floor(task.amount/10);
    const ones = task.amount%10;
    if (joined?.tens !== tens || joined?.ones !== ones || model.tens !== tens || model.ones !== ones ||
        model.exchanges !== exchanges || (task.exchange && exchanges < 1) ||
        !equation(model.equation,task.start,10*tens+ones,'+',task.start+task.amount)) return null;
    return {...binding,added:{tens,ones},exchanges,total:task.start+task.amount};
  } catch {
    return null;
  }
}

export function submittedP113UUnitAdditionEvidence(task, model, record, context) {
  return latestSubmissionMatches(model,record) ? replayP113UUnitAdditionEvidence(task,model,context) : null;
}
