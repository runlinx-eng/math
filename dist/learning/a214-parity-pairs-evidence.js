// B-line development candidate for the exact #343 source positions below.
import * as original from './phase5/b07-model.js';
import {
  hasExactKeys, isEvidenceContext, latestSubmissionMatches, matchesNativeEvidenceTask
} from './evidence-contract.js';

export const SOURCES = Object.freeze([
  Object.freeze({sessionId: 'parity', index: 0, nodeId: 'mt_hniI4E-OCE',
    type: 'x-pvpair', taskHash: '07c2ea036d8a01f6ed3c2629291d060562296d999f9615a15adc433d9524580e'}),
  Object.freeze({sessionId: 'parity', index: 1, nodeId: 'mt_hniI4E-OCE',
    type: 'x-pvpair', taskHash: '53572aa8bfa755cc2033bcb441fcec3046aac1679c8a95fb5906fa0793722250'}),
  Object.freeze({sessionId: 'parity', index: 3, nodeId: 'mt_hniI4E-OCE',
    type: 'x-pvpair', taskHash: 'c8003abc0a68d1162ef9ef5c42cec0bcf8dc9ed9e17e8314ed6414cf727ff8bc'}),
  Object.freeze({sessionId: 'evenhalves', index: 0, nodeId: 'mt_0u4KLbvBa1',
    type: 'x-pvpair', taskHash: 'e3435486cadde365e59bba6520fb38abcc1f88d0471cae499f531de65409db4c'}),
]);

function sourceFor(task, context) {
  if (!isEvidenceContext(context)) return null;
  const source = SOURCES.find(row => row.sessionId === context.sessionId && row.index === context.index);
  return source && matchesNativeEvidenceTask(task, context, source) ? source : null;
}

export function binding(task, context) {
  const source = sourceFor(task, context);
  return source ? {nodeId: source.nodeId, method: null, question: '核对互不重叠的配对、余数及两个相等的部分。'} : null;
}

export function submitted(task, model, record, context) {
  return latestSubmissionMatches(model, record) ? replay(task, model, context) : null;
}

export function replay(task, model, context) {
  try {
    const source = sourceFor(task, context);
    if (!source || !hasExactKeys(model, Object.keys(original.initial(task))) || !original.valid(task, model)) return null;
    const used = new Set(model.pairs.flat());
    const leftover = Array.from({length: task.n}, (_, i) => i).filter(i => !used.has(i));
    if (model.pairs.length * 2 !== used.size || leftover.length > 1 ||
        model.pairsCount !== model.pairs.length || model.leftover !== leftover.length ||
        model.kind !== (leftover.length ? 'odd' : 'even') ||
        (model.selected !== null && !leftover.includes(model.selected))) return null;
    if (task.equation) {
      if (model.a !== model.pairs.length || model.b !== model.pairs.length ||
          model.a + model.b !== task.n || !model.counts.every((value, i) => value === (i + 1) * 2)) return null;
    } else if (model.a !== null || model.b !== null || !model.counts.every(value => value === null)) return null;
    if (!original.inspect(task, model).correct) return null;
    return {...source, method: null, originalPairs: structuredClone(model.pairs), unpairedIds: leftover,
      parity: model.kind, halves: task.equation ? [model.a, model.b] : null};
  } catch {
    return null;
  }
}
