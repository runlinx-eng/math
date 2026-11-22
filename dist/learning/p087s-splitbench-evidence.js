import {initial, valid} from './phase5/b10-model.js';
import {hasExactKeys, latestSubmissionMatches, matchesNativeEvidenceTask} from './evidence-contract.js';

export const P087S_SOURCES = Object.freeze([
  Object.freeze({sessionId: 'screenadd', index: 0, nodeId: 'mt_biGHAbkoV2', type: 'x-splitbench',
    taskHash: 'e726d13b782e63dba36b55cc3fef57a98a04e9c9a6f8b1d63e87967f0044d289'}),
  Object.freeze({sessionId: 'partnersten', index: 2, nodeId: 'mt_e8CZ7E5qW7', type: 'x-splitbench',
    taskHash: 'ecba5938b7cb4482c38bcb021925f3b786614e9854041c3d5b0e1941245f859d'}),
]);

export function p087sSplitbenchBinding(task, context) {
  const row = P087S_SOURCES.find(source => source.sessionId === context?.sessionId && source.index === context?.index);
  if (!row || !matchesNativeEvidenceTask(task, context, row)) return null;
  return {nodeId: row.nodeId, kind: 'p087s-splitbench', method: null, question: '怎样让两堆的总数不变，还能找出不同的分法？'};
}

function pairKey(a, b) {
  return Math.min(a, b);
}

function matchesEquation(eq, a, b, total) {
  const [left, right, ...rest] = eq.replace(/\s/g, '').replace(/＋/g, '+').replace(/＝/g, '=').split('=');
  if (rest.length) return false;
  const expressions = [`${a}+${b}`, `${b}+${a}`];
  return (left === String(total) && expressions.includes(right)) ||
    (right === String(total) && expressions.includes(left));
}

export function replayP087SSplitbenchEvidence(task, model, context) {
  try {
    const binding = p087sSplitbenchBinding(task, context);
    if (!binding || !hasExactKeys(model, Object.keys(initial(task))) || !valid(task, model) ||
        model.issue !== '' || Object.keys(model.history).length !== model.history.length) return null;

    const keys = new Set();
    const splits = [];
    for (const attempt of model.history) {
      if (!hasExactKeys(attempt, ['a', 'b', 'eq'])) return null;
      const {a, b, eq} = attempt;
      if (!Number.isInteger(a) || a < 0 || a > task.total || b !== task.total - a ||
          typeof eq !== 'string' || eq.length > 2000) return null;
      const key = pairKey(a, b);
      if (!matchesEquation(eq, a, b, task.total) || keys.has(key)) continue;
      const saved = model.saved[splits.length];
      if (!hasExactKeys(saved, ['a', 'b', 'ids', 'eq']) || saved.a !== a || saved.b !== b || saved.eq !== eq) return null;
      keys.add(key);
      splits.push({a, b});
    }

    if (splits.length !== model.saved.length) return null;
    if (task.pairs ? !task.pairs.every(([a,b]) => keys.has(pairKey(a,b))) : splits.length < task.count) return null;
    return {...binding, total: task.total, splits};
  } catch {
    return null;
  }
}

export function submittedP087SSplitbenchEvidence(task, model, record, context) {
  return latestSubmissionMatches(model, record) ? replayP087SSplitbenchEvidence(task, model, context) : null;
}
