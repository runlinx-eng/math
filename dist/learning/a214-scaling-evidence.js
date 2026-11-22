// B-line development candidate for the exact #343 source positions below.
import * as original from './phase4/b03-model.js';
import {
  hasExactKeys, isEvidenceContext, latestSubmissionMatches, matchesNativeEvidenceTask, sameEvidence
} from './evidence-contract.js';

export const SOURCES = Object.freeze([
  Object.freeze({sessionId: 'scale', index: 0, nodeId: 'mt_VKW8lOcFaw',
    type: 'x-scale', taskHash: '6a74d660e756bd155c86a9803e05b72e000a0908a519f44b6d0d697493cd6587'}),
  Object.freeze({sessionId: 'scale', index: 1, nodeId: 'mt_VKW8lOcFaw',
    type: 'x-scale', taskHash: '4f6a0bea3bdb30f4ca37d1ddd1c5c3bea6245efe3e7de9bff7917fb3f487e660'}),
  Object.freeze({sessionId: 'scale', index: 2, nodeId: 'mt_VKW8lOcFaw',
    type: 'x-scale', taskHash: 'b2c351a3942c8be35dd7b64dcec8ff4f1bd4b2455ef6a021053995cd14bcb82c'}),
]);

function sourceFor(task, context) {
  if (!isEvidenceContext(context)) return null;
  const source = SOURCES.find(row => row.sessionId === context.sessionId && row.index === context.index);
  return source && matchesNativeEvidenceTask(task, context, source) ? source : null;
}

export function binding(task, context) {
  const source = sourceFor(task, context);
  return source ? {nodeId: source.nodeId, method: null, question: '用已保存的倍数试验，对照倍数和一的关系。'} : null;
}

export function submitted(task, model, record, context) {
  return latestSubmissionMatches(model, record) ? replay(task, model, context) : null;
}

const direction = (n, d) => n < d ? 'shorter' : n > d ? 'longer' : 'same';
const reasons = {shorter: 'below', longer: 'above', same: 'one'};

export function replay(task, model, context) {
  try {
    const source = sourceFor(task, context);
    if (!source || !hasExactKeys(model, Object.keys(original.initial(task))) ||
        !original.valid(task, model) || !original.inspect(task, model).correct || model.applied !== true) return null;
    const rounds = [];
    for (const run of model.runs) {
      if (!hasExactKeys(run, ['n', 'd', 'prediction'])) return null;
      const outcome = direction(run.n, run.d);
      rounds.push({factor: [run.n, run.d], length: [task.base * run.n, run.d],
        predicted: run.prediction, outcome, predictionMatches: run.prediction === outcome});
    }
    const last = rounds.at(-1);
    if (!last || !sameEvidence(last.factor, [task.n, task.d]) || !sameEvidence(last.factor, [model.n, model.d]) ||
        !last.predictionMatches || model.prediction !== last.predicted || model.reason !== reasons[last.outcome]) return null;
    return {...source, method: null, originalLength: task.base, rounds, reason: model.reason};
  } catch {
    return null;
  }
}
