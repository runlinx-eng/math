// B-line development candidate for the exact #343 source positions below.
import * as original from './phase4/b04-model.js';
import {
  hasExactKeys, isEvidenceContext, latestSubmissionMatches, matchesNativeEvidenceTask, sameEvidence
} from './evidence-contract.js';

export const SOURCES = Object.freeze([
  Object.freeze({sessionId: 'chance', index: 0, nodeId: 'mt_J4j7d3iAfg',
    type: 'x-experiment', taskHash: 'e0a3dca00d434e0ba5e0a83b32177172e4270a122571ea75e56dfb42fd9f4d4a'}),
  Object.freeze({sessionId: 'chance', index: 1, nodeId: 'mt_J4j7d3iAfg',
    type: 'x-experiment', taskHash: 'ce40613bee900ad156d6686e16523026773bb5b987131a9b01140e291cf5dd32'}),
  Object.freeze({sessionId: 'chance', index: 2, nodeId: 'mt_J4j7d3iAfg',
    type: 'x-experiment', taskHash: '52c9dedb5897134256c50f549a5d9ef2359b840fb94f5df1ef75388d2fda12ad'}),
]);

function sourceFor(task, context) {
  if (!isEvidenceContext(context)) return null;
  const source = SOURCES.find(row => row.sessionId === context.sessionId && row.index === context.index);
  return source && matchesNativeEvidenceTask(task, context, source) ? source : null;
}

export function binding(task, context) {
  const source = sourceFor(task, context);
  return source ? {nodeId: source.nodeId, method: null, question: '核对每次模拟结果、频数和第一次猜测。'} : null;
}

export function submitted(task, model, record, context) {
  return latestSubmissionMatches(model, record) ? replay(task, model, context) : null;
}

export function replay(task, model, context) {
  try {
    const source = sourceFor(task, context);
    if (!source || !hasExactKeys(model, Object.keys(original.initial(task))) ||
        !original.valid(task, model) || !original.inspect(task, model).correct ||
        model.draws.length !== task.count || !Number.isInteger(model.prediction) ||
        model.prediction < 0 || model.prediction > task.count || model.guess !== model.prediction) return null;
    const tally = task.labels.map(() => 0);
    for (const outcome of model.draws) tally[outcome]++;
    const difference = tally[0] - model.prediction;
    const comparison = difference < 0 ? 'lower' : difference > 0 ? 'higher' : 'same';
    if (!sameEvidence(tally, model.counts) || model.comparison !== comparison) return null;
    return {...source, method: null, retainedOutcomes: [...model.draws], tally,
      predictedFirstOutcome: model.prediction, observedFirstOutcome: tally[0], comparison};
  } catch {
    return null;
  }
}
