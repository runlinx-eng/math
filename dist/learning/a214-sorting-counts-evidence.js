// B-line development candidate for the exact #343 source positions below.
import * as original from './phase4/b04-model.js';
import {
  hasExactKeys, isEvidenceContext, latestSubmissionMatches, matchesNativeEvidenceTask, sameEvidence
} from './evidence-contract.js';

export const SOURCES = Object.freeze([
  Object.freeze({sessionId: 'sortobjects', index: 0, nodeId: 'mt_xppl18avyY',
    type: 'x-sort', taskHash: 'c8a781d39071b017e318f795a1eaabc0ac7ef29bdf85581597ea48184989d783'}),
  Object.freeze({sessionId: 'sortobjects', index: 1, nodeId: 'mt_xppl18avyY',
    type: 'x-sort', taskHash: '47fe1026e62f2fc593bd4ac40e5d0ef96e4b86322de25ed5036984c25bed6ad3'}),
  Object.freeze({sessionId: 'sortdata', index: 0, nodeId: 'mt_ylXdiVRAYv',
    type: 'x-sort', taskHash: 'f7950a474e0344d3b45f537c6118a0fe903d5ee2d0d94176955d9a1bc4973de6'}),
  Object.freeze({sessionId: 'sortdata', index: 1, nodeId: 'mt_ylXdiVRAYv',
    type: 'x-sort', taskHash: '9e4af28268243cc6e761b35bbfe84226736a7c640d7a00ef756f3480f2d29661'}),
]);

function sourceFor(task, context) {
  if (!isEvidenceContext(context)) return null;
  const source = SOURCES.find(row => row.sessionId === context.sessionId && row.index === context.index);
  return source && matchesNativeEvidenceTask(task, context, source) ? source : null;
}

export function binding(task, context) {
  const source = sourceFor(task, context);
  return source ? {nodeId: source.nodeId, method: null, question: '检查每个物品是否进入正确类别，再核对各组频数。'} : null;
}

export function submitted(task, model, record, context) {
  return latestSubmissionMatches(model, record) ? replay(task, model, context) : null;
}

export function replay(task, model, context) {
  try {
    const source = sourceFor(task, context);
    if (!source || !hasExactKeys(model, Object.keys(original.initial(task))) ||
        !original.valid(task, model) || !original.inspect(task, model).correct) return null;
    const groups = task.labels.map(() => []);
    for (const [id, item] of task.items.entries()) {
      if (model.dest[id] !== item[task.rule]) return null;
      groups[model.dest[id]].push(id);
    }
    const counts = groups.map(group => group.length);
    if (!sameEvidence(model.counts, counts) || !/^\d$/.test(model.most) || !/^\d$/.test(model.fewest) ||
        counts[Number(model.most)] !== Math.max(...counts) ||
        counts[Number(model.fewest)] !== Math.min(...counts)) return null;
    if (task.ordered) {
      if (model.order.length !== counts.length ||
          !model.order.every((category, i) => i === 0 || counts[model.order[i - 1]] >= counts[category])) return null;
    } else if (model.order.length) return null;
    return {...source, method: null, attribute: task.rule,
      categories: groups.map((itemIds, i) => ({name: task.labels[i], itemIds, count: counts[i]})),
      retainedOrder: [...model.order], assignmentChronologyRecorded: false};
  } catch {
    return null;
  }
}
