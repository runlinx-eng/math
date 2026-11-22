// B-line development candidate for the exact #343 source positions below.
import * as original from './phase5/b08-model.js';
import {
  hasExactKeys, isEvidenceContext, latestSubmissionMatches, matchesNativeEvidenceTask, sameEvidence
} from './evidence-contract.js';

export const SOURCES = Object.freeze([
  Object.freeze({sessionId: 'standardform', index: 3, nodeId: 'mt_bO-njVOige',
    type: 'x-wideboard', taskHash: '514d38d96b57dcfd28fe0e707997ecd5987e84b4e3a23583389f34015aa5952b'}),
]);

function sourceFor(task, context) {
  if (!isEvidenceContext(context)) return null;
  const source = SOURCES.find(row => row.sessionId === context.sessionId && row.index === context.index);
  return source && matchesNativeEvidenceTask(task, context, source) ? source : null;
}

export function binding(task, context) {
  const source = sourceFor(task, context);
  return source ? {nodeId: source.nodeId, method: null, question: '逐张还原数值，再核对排序。'} : null;
}

export function submitted(task, model, record, context) {
  return latestSubmissionMatches(model, record) ? replay(task, model, context) : null;
}

const superscripts = '⁰¹²³⁴⁵⁶⁷⁸⁹';
function ratio(text) {
  const match = /^\+?(\d{1,12})(?:\.(\d{1,12}))?$/.exec(text.trim());
  if (!match) return null;
  const fraction = match[2] || '';
  return [BigInt(match[1] + fraction), 10n ** BigInt(fraction.length)];
}

function scientificValue(text) {
  const match = /^([0-9.]+) × 10(⁻?)([⁰¹²³⁴⁵⁶⁷⁸⁹])$/.exec(text);
  if (!match) return null;
  const [n, d] = ratio(match[1]);
  if (n < d || n >= 10n * d) return null;
  const scale = 10n ** BigInt(superscripts.indexOf(match[3]));
  return match[2] ? [n, d * scale] : [n * scale, d];
}

const compare = (a, b) => a[0] * b[1] - b[0] * a[1];

export function replay(task, model, context) {
  try {
    const source = sourceFor(task, context);
    if (!source || !original.valid(task, model) || !original.inspect(task, model).correct) return null;
    const blank = original.initial(task);
    const live = new Set(['answers', 'order', 'orderTrace', 'orderTraceOverflow']);
    if (!hasExactKeys(model, Object.keys(blank)) || model.orderTraceOverflow ||
        !Object.keys(blank).every(key => live.has(key) || sameEvidence(model[key], blank[key]))) return null;
    const values = task.notation.map(scientificValue);
    const answers = model.answers.map(ratio);
    if (values.some((value, i) => !value || !answers[i] || compare(value, answers[i]) !== 0n)) return null;
    const order = [];
    for (const event of model.orderTrace) {
      const current = order.indexOf(event.index);
      if (event.kind === 'pick' && current === -1) order.push(event.index);
      else if (event.kind === 'remove' && current >= 0) order.splice(current, 1);
      else return null;
    }
    if (order.length !== values.length || !sameEvidence(order, model.order) ||
        !order.every((id, i) => i === 0 || compare(values[order[i - 1]], values[id]) < 0n)) return null;
    return {...source, method: null, order, recordedConversions: [...model.answers], events: structuredClone(model.orderTrace)};
  } catch {
    return null;
  }
}
