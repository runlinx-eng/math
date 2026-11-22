// B-line development candidate for the exact #343 source positions below.
import * as original from './phase5/b06-model.js';
import {
  hasExactKeys, isEvidenceContext, latestSubmissionMatches, matchesNativeEvidenceTask
} from './evidence-contract.js';

export const SOURCES = Object.freeze([
  Object.freeze({sessionId: 'bundles', index: 0, nodeId: 'mt_0ZDouU664X',
    type: 'x-bundlecount', taskHash: 'd8c5dab3fa542a6ddfea3239910893b8cffa4972a496beeb4729621dd3db4d5e'}),
  Object.freeze({sessionId: 'bundles', index: 1, nodeId: 'mt_0ZDouU664X',
    type: 'x-bundlecount', taskHash: 'b592082618ae2ae7c7c069400faee9c1b47f4fc58ca8b63c41158767d8fabf73'}),
  Object.freeze({sessionId: 'bundles', index: 2, nodeId: 'mt_0ZDouU664X',
    type: 'x-bundlecount', taskHash: '6c82bdd6a13f8200060158bf2e2a95b17072cdf366f2cce8a39b77c42b0d1a82'}),
]);

function sourceFor(task, context) {
  if (!isEvidenceContext(context)) return null;
  const source = SOURCES.find(row => row.sessionId === context.sessionId && row.index === context.index);
  return source && matchesNativeEvidenceTask(task, context, source) ? source : null;
}

export function binding(task, context) {
  const source = sourceFor(task, context);
  return source ? {nodeId: source.nodeId, method: null, question: '核对完整组、未分入的物品和总数量。'} : null;
}

export function submitted(task, model, record, context) {
  return latestSubmissionMatches(model, record) ? replay(task, model, context) : null;
}

export function replay(task, model, context) {
  try {
    const source = sourceFor(task, context);
    if (!source || !hasExactKeys(model, Object.keys(original.initial(task))) ||
        !original.valid(task, model) || !original.inspect(task, model).correct) return null;
    const used = new Set(model.groups.flat());
    const loose = Array.from({length: task.n}, (_, i) => i).filter(i => !used.has(i));
    if (used.size !== model.groups.length * task.size || loose.length >= task.size ||
        model.groupsCount !== model.groups.length || model.remainder !== loose.length ||
        model.total !== used.size + loose.length || model.why !== (task.reason ? 'units' : '')) return null;
    // The native Repeat control requires at least one existing group.
    return {...source, method: null, firstManuallyWrappedGroup: [...model.groups[0]],
      groups: structuredClone(model.groups), loose, total: model.total,
      numberOfGroups: model.groups.length, groupSize: task.size};
  } catch {
    return null;
  }
}
