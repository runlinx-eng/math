// #343: qualify the same replay mathematics at a separate, exact native source.
import {sessionTaskFor} from './bridges.js';
import {latestSubmissionMatches, matchesNativeEvidenceTask, sameEvidence} from './evidence-contract.js';
import {replayCrossSourceSquareInclusionEvidence} from './p004m-cross-source-square-inclusion-evidence.js';

export const SOURCE = Object.freeze({
  sessionId: 'structure39', index: 2, nodeId: 'mt__Itf4aQZUj', type: 'x-s23-quad',
  taskHash: '59c85cf7b19f96f967978b44a4e829775825dcc91967bffcf28040ca30f39689'
});
const mathReference = Object.freeze({sessionId: 'shapefacts', index: 1});

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
  const verified = replayCrossSourceSquareInclusionEvidence(referenceTask, model, mathReference);
  if (!verified) return null;
  return {...verified, ...SOURCE, method: null};
}

export function submitted(task, model, record, context) {
  return latestSubmissionMatches(model, record) ? replay(task, model, context) : null;
}
