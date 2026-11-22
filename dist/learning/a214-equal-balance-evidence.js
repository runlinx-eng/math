// #343: this native problem preserves its own balance releases and Check.
import {sessionTaskFor} from './bridges.js';
import {latestSubmissionMatches, matchesNativeEvidenceTask, sameEvidence} from './evidence-contract.js';
import {replayP030BalanceEvidence} from './p030-native-balance-evidence.js';

export const SOURCES = Object.freeze([Object.freeze({
  sessionId: 'communicate38', index: 0, nodeId: 'mt_TMoHjMhRS2', type: 'x-balance',
  taskHash: '23b489d4ffd0e44f95012b6e3868e234549400f9bc21a1cd441b3b6111e5edaa'
})]);
const [source] = SOURCES;
const mathReference = {sessionId: 'equality', index: 2};

export function binding(task, context) {
  if (context?.sessionId !== source.sessionId || context.index !== source.index ||
      !matchesNativeEvidenceTask(task, context, source)) return null;
  const referenceTask = sessionTaskFor(mathReference.sessionId, mathReference.index);
  return sameEvidence(task, referenceTask) ? {nodeId: source.nodeId, method: null,
    question: '5 在左盘，2＋3 在右盘。检查实际记录的两边数量及等号。'} : null;
}

export function replay(task, model, context) {
  if (!binding(task, context)) return null;
  const referenceTask = sessionTaskFor(mathReference.sessionId, mathReference.index);
  const math = replayP030BalanceEvidence(referenceTask, model, mathReference);
  return math ? {...math, source: {...source, position: 'communicate38:0', method: null}} : null;
}

export function submitted(task, model, record, context) {
  return latestSubmissionMatches(model, record) ? replay(task, model, context) : null;
}
