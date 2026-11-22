import {initial, valid} from './phase5/b29-model.js';
import {equal} from './phase5/b16-model.js';
import {hasExactKeys, latestSubmissionMatches, matchesNativeEvidenceTask, sameEvidence} from './evidence-contract.js';

import {number} from './phase5/b20-model.js';

export const P095S_SOURCES = Object.freeze([
  {
    "sessionId": "practicalmeasure",
    "index": 1,
    "nodeId": "mt_5HV4mbgSGH",
    "type": "x-m29-share",
    "taskHash": "4788db12f79b43484493b264396c1bc2f1c9137413897c30b5b1581dff0cf4dd"
  },
  {
    "sessionId": "practicalmeasure",
    "index": 4,
    "nodeId": "mt_5HV4mbgSGH",
    "type": "x-m29-share",
    "taskHash": "daaa2225c03a36cae24415cf283fa511a85c1c6025ea85bc5bc3a9ca59d674ae"
  }
].map(Object.freeze));

export function p095sEqualMassSharingBinding(task,context) {
  const row=P095S_SOURCES.find(source=>source.sessionId===context?.sessionId&&source.index===context?.index);
  if (!row||!matchesNativeEvidenceTask(task,context,row)) return null;
  return {nodeId:row.nodeId,kind:'p095s-equal-mass-sharing',method:null,question:'每份有多少克？换成千克后，实际质量变了吗？'};
}

export function replayP095SEqualMassSharingEvidence(task,model,context) {
  try {
    const binding=p095sEqualMassSharingBinding(task,context);
    if (!binding||!hasExactKeys(model,Object.keys(initial(task)))||!valid(task,model)||
        model.issue!==''||Object.keys(model.history).length!==model.history.length) return null;
    const moves=[];
    const shares=Array(task.people).fill(0);
    let remaining=task.total;
    for (const event of model.history) {
      if (!hasExactKeys(event,['a','i','v'])) return null;
      if (event.a==='give'&&/^\d+$/.test(event.i)) {
        const index=Number(event.i);
        if (index>=shares.length) return null;
        const amount=number(event.v);
        if (!Number.isSafeInteger(amount)||amount<1||amount>remaining) continue;
        if (!equal(event.v,amount)) return null;
        moves.push({index,amount});
        shares[index]+=amount;
        remaining-=amount;
      } else if (event.a==='undo'&&event.i===''&&event.v==='') {
        const move=moves.pop();
        if (move) {
          shares[move.index]-=move.amount;
          remaining+=move.amount;
        }
      } else if (event.a==='clear'&&event.i===''&&event.v==='') {
        shares.fill(0);
        moves.length=0;
        remaining=task.total;
      } else {
        return null;
      }
    }
    const gramsPerShare=task.total/task.people;
    if (remaining!==0||!shares.every(value=>value===gramsPerShare)||!sameEvidence(moves,model.board.moves)||
        model.unit!=='kg'||!equal(model.answer,gramsPerShare,1000)) return null;
    return {...binding,shares,gramsPerShare};
  } catch {
    return null;
  }
}

export function submittedP095SEqualMassSharingEvidence(task,model,record,context) {
  return latestSubmissionMatches(model,record)?replayP095SEqualMassSharingEvidence(task,model,context):null;
}
