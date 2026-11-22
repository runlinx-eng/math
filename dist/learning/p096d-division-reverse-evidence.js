import {initial, rationalEquals, valid} from './phase5/b13-model.js';
import {hasExactKeys, latestSubmissionMatches, matchesNativeEvidenceTask} from './evidence-contract.js';

export const P096D_SOURCES = Object.freeze([Object.freeze({
  sessionId:'turnarray', index:2, nodeId:'mt_C9ZfT-4cgn', type:'x-divreverse',
  taskHash:'592b776fadec59fc3ce05d41ea0eb2083b5a6b8fcf01dc60f10bdf719d71fd40',
})]);

export function p096dDivisionReverseBinding(task, context) {
  const [row] = P096D_SOURCES;
  if (context?.sessionId !== row.sessionId || context?.index !== row.index ||
      !matchesNativeEvidenceTask(task, context, row)) return null;
  return {nodeId:row.nodeId, kind:'p096d-division-reverse', method:null, question:'交换总量和组数后，为什么每组的量会变？'};
}

export function replayP096DDivisionReverseEvidence(task, model, context) {
  try {
    const binding = p096dDivisionReverseBinding(task, context);
    if (!binding || !hasExactKeys(model,Object.keys(initial(task))) || !valid(task,model) ||
        model.issue !== '' || Object.keys(model.history).length !== model.history.length) return null;
    let swaps = 0;
    let firstAnswer = null;
    let lastAnswer = null;
    for (const {action,data} of model.history) {
      if (data.bucket !== null || data.index !== null || data.token !== null) return null;
      if (action === 'b13-reset') {
        swaps = 0;
        firstAnswer = null;
        lastAnswer = null;
        continue;
      }
      if (action !== 'b13-div-swap') return null;
      if (!data.answer.trim()) continue;
      firstAnswer ??= data.answer;
      lastAnswer = data.answer;
      swaps++;
    }
    const {a,b} = task;
    if (swaps % 2 !== 1 || model.board.swaps !== swaps || model.board.firstAnswer !== firstAnswer ||
        !rationalEquals(lastAnswer,a,b) || !rationalEquals(model.answer,a,b) ||
        !rationalEquals(model.result,b,a)) return null;
    return {...binding, quotients:[[a,b],[b,a]]};
  } catch {
    return null;
  }
}

export function submittedP096DDivisionReverseEvidence(task, model, record, context) {
  return latestSubmissionMatches(model,record) ? replayP096DDivisionReverseEvidence(task,model,context) : null;
}
