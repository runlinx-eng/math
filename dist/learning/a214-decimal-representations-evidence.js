// B-line development candidate for the exact #343 source positions below.
import * as original from './phase4/b03-model.js';
import {equal as exactEqual} from './phase5/b16-model.js';
import {
  hasExactKeys, isEvidenceContext, latestSubmissionMatches, matchesNativeEvidenceTask, sameEvidence
} from './evidence-contract.js';

export const SOURCES = Object.freeze([
  Object.freeze({sessionId: 'decpercent', index: 0, nodeId: 'mt_W17Kbwm0-u',
    type: 'x-decvalue', taskHash: 'ecd849f6fda3561602351a54f1fec424837c621137a10b581e2c12528cd18820'}),
  Object.freeze({sessionId: 'decpercent', index: 1, nodeId: 'mt_W17Kbwm0-u',
    type: 'x-decvalue', taskHash: '05a01113578a310e1689008617587252cc94b96b21f71f7a66ed81f87a806db2'}),
  Object.freeze({sessionId: 'decpercent', index: 2, nodeId: 'mt_W17Kbwm0-u',
    type: 'x-decvalue', taskHash: '20468f697c823661266b00ed8af96730d799f99c9a1521e60a0f87b1c7496dc2'}),
]);

function sourceFor(task, context) {
  if (!isEvidenceContext(context)) return null;
  const source = SOURCES.find(row => row.sessionId === context.sessionId && row.index === context.index);
  return source && matchesNativeEvidenceTask(task, context, source) ? source : null;
}

export function binding(task, context) {
  const source = sourceFor(task, context);
  return source ? {nodeId: source.nodeId, method: null, question: '在相同整体下，核对小数、分数和百分数表示同一个量。'} : null;
}

export function submitted(task, model, record, context) {
  return latestSubmissionMatches(model, record) ? replay(task, model, context) : null;
}

export function replay(task, model, context) {
  try {
    const source = sourceFor(task, context);
    if (!source || !hasExactKeys(model, Object.keys(original.initial(task))) ||
        !original.valid(task, model) || !original.inspect(task, model).correct) return null;
    const n = 100 * model.ones + model.selected.length;
    const remainder = n % 100;
    const digits = [Math.floor(n / 100), Math.floor(remainder / 10), remainder % 10];
    const fraction = model.fraction.replace(/\s/g, '');
    if (n !== task.cents || model.percent !== n || !sameEvidence(model.digits, digits) ||
        !/^\+?\d+(?:\.\d+)?$/.test(model.decimal.trim()) || !exactEqual(model.decimal, n, 100) ||
        !/^\d+\/\d+$/.test(fraction) || !exactEqual(fraction, n, 100)) return null;
    return {...source, method: null, wholeUnits: model.ones, selectedHundredths: [...model.selected],
      equivalentNames: [model.decimal, model.fraction, model.percent + '%'], digits, quantity: [n, 100]};
  } catch {
    return null;
  }
}
