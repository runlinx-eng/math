import {equal, initial, number, valid} from './phase5/b16-model.js';
import {hasExactKeys, latestSubmissionMatches, matchesNativeEvidenceTask, sameEvidence} from './evidence-contract.js';

export const P110R_SOURCES = Object.freeze([Object.freeze({
  sessionId:'fractionreason', index:1, nodeId:'mt_2ESZh70NyS', type:'x-rowrepair',
  taskHash:'7829294f37a2ea994032be36e33ec91c18fa6ef131b95f105952a00924d34330',
})]);

export function p110rTensRowRepairBinding(task, context) {
  const [row] = P110R_SOURCES;
  if (!matchesNativeEvidenceTask(task,context,row) ||
      context.sessionId !== row.sessionId || context.index !== row.index) return null;
  return {nodeId:row.nodeId, kind:'p110r-tens-row-repair', method:null, question:'竖式第二行乘的是多少个十？'};
}

export function replayP110RTensRowRepairEvidence(task, model, context) {
  try {
    const binding = p110rTensRowRepairBinding(task,context);
    if (!binding || !hasExactKeys(model,Object.keys(initial(task))) || !valid(task,model) ||
        model.issue !== '' || Object.keys(model.history).length !== model.history.length) return null;
    let seen = [task.wrongShift];
    let first = null;
    for (const event of model.history) {
      if (!hasExactKeys(event,['action','data']) || !hasExactKeys(event.data,['fields'])) return null;
      if (event.action === 'reset') {
        seen = [task.wrongShift];
        continue;
      }
      if (event.action !== 'shift') return null;
      const shift = number(event.data.fields.shift);
      if (![0,1,2].includes(shift)) continue;
      first ??= shift;
      seen.push(shift);
    }
    const shift = seen.at(-1);
    if (seen.length < 2 || shift !== 1 || number(model.shift) !== shift || model.board.shift !== shift ||
        model.board.first !== first || !sameEvidence(seen,model.board.seen)) return null;
    const tens = Math.floor(task.b / 10);
    const ones = task.b % 10;
    const partialProducts = [task.a * ones,task.a * tens * 10 ** shift];
    if (model.reason !== 'tens-row' || !equal(model.answer,partialProducts[0]+partialProducts[1])) return null;
    return {...binding,partialProducts};
  } catch {
    return null;
  }
}

export function submittedP110RTensRowRepairEvidence(task, model, record, context) {
  return latestSubmissionMatches(model,record) ? replayP110RTensRowRepairEvidence(task,model,context) : null;
}
