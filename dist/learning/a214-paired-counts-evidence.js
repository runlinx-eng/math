// B-line development candidate for the exact #343 source positions below.
import * as original from './phase5/b06-model.js';
import {
  hasExactKeys, isEvidenceContext, latestSubmissionMatches, matchesNativeEvidenceTask
} from './evidence-contract.js';

export const SOURCES = Object.freeze([
  Object.freeze({sessionId: 'paircounts', index: 0, nodeId: 'mt__h7hvT4tEb',
    type: 'x-paircounts', taskHash: '7703f232a546d7bb3804fd7ccbf0cdc9c7cedd12ba054a974016d22e0eb287bf'}),
  Object.freeze({sessionId: 'paircounts', index: 1, nodeId: 'mt__h7hvT4tEb',
    type: 'x-paircounts', taskHash: 'bfee3c4fd68273a61ea3113554899534c1ef320455248fe1bc4e90e2e52859c0'}),
  Object.freeze({sessionId: 'paircounts', index: 2, nodeId: 'mt__h7hvT4tEb',
    type: 'x-paircounts', taskHash: 'de90c44b0150a720adbc6d7ac80a56178ef039aba77e85519603a9a4a0bfc057'}),
]);

function sourceFor(task, context) {
  if (!isEvidenceContext(context)) return null;
  const source = SOURCES.find(row => row.sessionId === context.sessionId && row.index === context.index);
  return source && matchesNativeEvidenceTask(task, context, source) ? source : null;
}

export function binding(task, context) {
  const source = sourceFor(task, context);
  return source ? {nodeId: source.nodeId, method: null, question: '核对两组物品的一一对应、剩余和数量关系。'} : null;
}

export function submitted(task, model, record, context) {
  return latestSubmissionMatches(model, record) ? replay(task, model, context) : null;
}

export function replay(task, model, context) {
  try {
    const source = sourceFor(task, context);
    if (!source || !hasExactKeys(model, Object.keys(original.initial(task))) || !original.valid(task, model)) return null;
    const left = new Set(model.pairs.map(pair => pair[0]));
    const right = new Set(model.pairs.map(pair => pair[1]));
    const leftOver = task.a - left.size;
    const rightOver = task.b - right.size;
    const relation = leftOver > rightOver ? 'more' : leftOver < rightOver ? 'fewer' : 'equal';
    if (left.size !== model.pairs.length || right.size !== model.pairs.length ||
        Math.min(leftOver, rightOver) !== 0 || model.relation !== relation ||
        model.a !== task.a || model.b !== task.b || (model.pending !== null && left.has(model.pending))) return null;
    const counts = task.c ? [task.a, task.b, task.c] : [task.a, task.b];
    if (task.c) {
      if (!/^[0-2]$/.test(model.most) || !/^[0-2]$/.test(model.least) ||
          counts[Number(model.most)] !== Math.max(...counts) || counts[Number(model.least)] !== Math.min(...counts)) return null;
    } else if (model.most !== '' || model.least !== '') return null;
    if (!original.inspect(task, model).correct) return null;
    return {...source, method: null, originalPairs: structuredClone(model.pairs),
      unmatched: [leftOver, rightOver], relation, counts};
  } catch {
    return null;
  }
}
