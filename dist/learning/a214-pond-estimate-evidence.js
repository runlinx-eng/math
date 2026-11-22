// B-line development candidate for the exact #343 source positions below.
import * as original from './phase4/b02-model.js';
import {pondCells} from './phase4/geometry.js';
import {
  hasExactKeys, isEvidenceContext, latestSubmissionMatches, matchesNativeEvidenceTask, sameEvidence
} from './evidence-contract.js';

export const SOURCES = Object.freeze([
  Object.freeze({sessionId: 'boundary', index: 2, nodeId: 'mt_eiB3-6pu6a',
    type: 'x-pond', taskHash: 'd80cc0ef8f36ff31c095994d4fa7b74444399fa46008f31e99f1de63f779f231'}),
]);

function sourceFor(task, context) {
  if (!isEvidenceContext(context)) return null;
  const source = SOURCES.find(row => row.sessionId === context.sessionId && row.index === context.index);
  return source && matchesNativeEvidenceTask(task, context, source) ? source : null;
}

export function binding(task, context) {
  const source = sourceFor(task, context);
  return source ? {nodeId: source.nodeId, method: null, question: '按覆盖不少于半格统一选格，估计面积。'} : null;
}

export function submitted(task, model, record, context) {
  return latestSubmissionMatches(model, record) ? replay(task, model, context) : null;
}

export function replay(task, model, context) {
  try {
    const source = sourceFor(task, context);
    if (!source || !hasExactKeys(model, Object.keys(original.initial(task))) ||
        !original.valid(task, model) || !original.inspect(task, model).correct) return null;
    const areas = pondCells(task);
    const qualifying = areas.flatMap((area, i) => area >= 1 / 2 ? [i] : []);
    const selected = [...model.tiles].sort((a, b) => a - b);
    if (!sameEvidence(qualifying, selected) || model.unit !== 'cm²' || model.total !== selected.length) return null;
    return {...source, method: null, selected, areas, threshold: 'at least half a unit square',
      estimatedAreaSquareCentimetres: selected.length};
  } catch {
    return null;
  }
}
