import {initial, valid} from './phase5/b34-model.js';
import {rational} from './phase5/b16-model.js';
import {hasExactKeys, latestSubmissionMatches, matchesNativeEvidenceTask, sameEvidence} from './evidence-contract.js';

export const P103E_SOURCES=Object.freeze([Object.freeze({
  sessionId:'reason34',index:3,nodeId:'mt_iyovKgZC1q',type:'x-p34-relation',
  taskHash:'839718feb4a22325dabca700e65026e25914255c9b02db4c964971d2ad61103d',
})]);

export function p103eDivisionEquivalenceBinding(task,context) {
  const [row]=P103E_SOURCES;
  if (context?.sessionId!==row.sessionId||context?.index!==row.index||
      !matchesNativeEvidenceTask(task,context,row)) return null;
  return {nodeId:row.nodeId,kind:'p103e-division-equivalence',method:null,question:'分子和分母怎样变，才会保持原来的商？'};
}

export function replayP103EDivisionEquivalenceEvidence(task,model,context) {
  try {
    const binding=p103eDivisionEquivalenceBinding(task,context);
    if (!binding||!hasExactKeys(model,Object.keys(initial(task)))||!valid(task,model)||
        model.issue!==''||Object.keys(model.history).length!==model.history.length) return null;
    const selected=new Set();
    for (const event of model.history) {
      if (!hasExactKeys(event,['a','i','v','w'])||event.a!=='cell'||event.v!==''||event.w!==''||
          !/^\d+$/.test(event.i)||Number(event.i)>=task.cards.length) return null;
      const i=Number(event.i);
      if (selected.has(i)) selected.delete(i);
      else selected.add(i);
    }
    const quantities=task.cards.map(card=>rational(card.label.replace('÷','/')));
    const [a,b]=quantities[0];
    const equal=quantities.flatMap(([n,d],i)=>BigInt(a)*BigInt(d)===BigInt(b)*BigInt(n)?[i]:[]);
    const ordered=[...selected].sort((x,y)=>x-y);
    if (!sameEvidence(ordered,equal)||!sameEvidence(ordered,model.board.selected)||
        !equal.some(i=>quantities[i][1]!==b)||model.answers[0].trim()!=='change'||
        rational(`${a}/0`)!==null||model.answers[1].trim()!=='invalid') return null;
    return {...binding,selected:ordered};
  } catch {
    return null;
  }
}

export function submittedP103EDivisionEquivalenceEvidence(task,model,record,context) {
  return latestSubmissionMatches(model,record)?replayP103EDivisionEquivalenceEvidence(task,model,context):null;
}
