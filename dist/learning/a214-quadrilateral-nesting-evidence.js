// #343: qualify the same replay mathematics at a separate, exact native source.
import {sessionTaskFor} from './bridges.js';
import {latestSubmissionMatches, matchesNativeEvidenceTask, sameEvidence} from './evidence-contract.js';
import {replayQuadrilateralNestingEvidence} from './p004b-quadrilateral-nesting-evidence.js';

export const SOURCE = Object.freeze({
  sessionId: 'structure39', index: 3, nodeId: 'mt__Itf4aQZUj', type: 'x-s23-nest',
  taskHash: '31cc0267773b61a7cff693870b0b13c4d69a68449f2b8113f5085c291b69c117'
});
const mathReference = Object.freeze({sessionId: 'quadsort', index: 3});

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
  const verified = replayQuadrilateralNestingEvidence(referenceTask, model, mathReference);
  if (!verified) return null;
  return {...verified, ...SOURCE, method: null};
}

export function submitted(task, model, record, context) {
  return latestSubmissionMatches(model, record) ? replay(task, model, context) : null;
}
