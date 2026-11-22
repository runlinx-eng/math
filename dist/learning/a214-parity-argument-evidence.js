// B-line development candidate for the exact #343 source positions below.
import * as original from './phase4/b05-model.js';
import {
  hasExactKeys, isEvidenceContext, latestSubmissionMatches, matchesNativeEvidenceTask, sameEvidence
} from './evidence-contract.js';

export const SOURCES = Object.freeze([
  Object.freeze({sessionId: 'justify', index: 2, nodeId: 'mt_pyMD_SIiYO',
    type: 'x-proof', taskHash: 'dfad28c0ad11aa560cb442e69cd7bbf18ff5f5a0ca6bcae0e45c8abef160c50a'}),
]);

function sourceFor(task, context) {
  if (!isEvidenceContext(context)) return null;
  const source = SOURCES.find(row => row.sessionId === context.sessionId && row.index === context.index);
  return source && matchesNativeEvidenceTask(task, context, source) ? source : null;
}

export function binding(task, context) {
  const source = sourceFor(task, context);
  return source ? {nodeId: source.nodeId, method: null, question: '检查偶数由完整的对组成，及反例中落单的一个。'} : null;
}

export function submitted(task, model, record, context) {
  return latestSubmissionMatches(model, record) ? replay(task, model, context) : null;
}

const chain = ['paired', 'join', 'none', 'even'];

export function replay(task, model, context) {
  try {
    const source = sourceFor(task, context);
    if (!source || !hasExactKeys(model, Object.keys(original.initial(task))) || !original.valid(task, model) ||
        !original.inspect(task, model).correct || model.counterBuilt !== true ||
        !sameEvidence(model.chain, chain) || typeof model.why !== 'string') return null;
    const seen = new Set(model.examples.map(pair => pair.join(':')));
    if (seen.size < 2 || seen.size !== model.examples.length) return null;
    const joinedEvenExamples = model.examples.map(([a, b]) => ({operands: [2 * a, 2 * b], pairsAfterJoin: a + b, total: 2 * (a + b)}));
    const total = model.counterA + model.counterB;
    const pairs = Math.floor(total / 2);
    const leftover = total - 2 * pairs;
    if (leftover !== 1) return null;
    return {...source, method: null, joinedEvenExamples, selectedGivenReasons: [...model.chain],
      constructedCounterexample: {operands: [model.counterA, model.counterB], total, pairs, leftover},
      freeExplanationAssessed: false};
  } catch {
    return null;
  }
}
