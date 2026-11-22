// #343: qualify the same replay mathematics at a separate, exact native source.
import {sessionTaskFor} from './bridges.js';
import {latestSubmissionMatches, matchesNativeEvidenceTask, sameEvidence} from './evidence-contract.js';
import {replayAngleEstimateEvidence} from './p005f-native-angle-estimates-evidence.js';

export const SOURCE = Object.freeze({
  sessionId: 'representations39', index: 2, nodeId: 'mt_IwEOCN6bL1', type: 'x-g25-estimate',
  taskHash: '2e95b28676442bc8fc86c1bdfdeec5cfb3cff4d88efa1c546acbf6dfa3e06e35'
});
const mathReference = Object.freeze({sessionId: 'angleestimate', index: 0});

export function binding(task, context) {
  if (context?.sessionId !== SOURCE.sessionId || context.index !== SOURCE.index ||
      !matchesNativeEvidenceTask(task, context, SOURCE)) return null;
  const referenceTask = sessionTaskFor(mathReference.sessionId, mathReference.index);
  if (!sameEvidence(task, referenceTask)) return null;
  return {nodeId: SOURCE.nodeId, method: null};
}

export function replay(task, model, context) {
  if (!binding(task, context)) return null;
  const referenceTask = sessionTaskFor(mathReference.sessionId, mathReference.index);
  // Reuse the deterministic replay only. Work and Check come from the B39 position.
  const verified = replayAngleEstimateEvidence(referenceTask, model, mathReference);
  if (!verified) return null;
  return {...verified, ...SOURCE, method: null};
}

export function submitted(task, model, record, context) {
  return latestSubmissionMatches(model, record) ? replay(task, model, context) : null;
}
