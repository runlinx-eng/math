import {initial, inspect, valid} from './phase5/b38-model.js';
import {hasExactKeys, isEvidenceContext, latestSubmissionMatches, matchesNativeEvidenceTask, sameEvidence} from './evidence-contract.js';

const type = 'x-r38-chain';
const REVIEWED = Object.freeze([
  {
    "sessionId": "complex38",
    "index": 2,
    "nodeId": "mt_GpltXPoaoc",
    "question": "为什么每人最多记一票时，40 人里不可能出现 48 票（120%）？",
    "type": "x-r38-chain",
    "taskHash": "dc29344b56a42563d492cdbfffe537182e4eb5b8d8fabf9cc45a2d302a909816",
    "task": {
      "type": "x-r38-chain",
      "prompt": "一次调查每人只记一票，40人中有48人投了A。这张记录说“120%的人投A”，哪里需要检查？",
      "cards": [
        {
          "id": "whole",
          "text": "总共只有40个人"
        },
        {
          "id": "once",
          "text": "每个人最多记一票"
        },
        {
          "id": "limit",
          "text": "投A的人数不能多于40"
        },
        {
          "id": "error",
          "text": "48超过40，应检查记录"
        },
        {
          "id": "wrong",
          "text": "任何百分数都不能超过100%"
        }
      ],
      "paths": [
        [
          "whole",
          "once",
          "limit",
          "error"
        ],
        [
          "once",
          "whole",
          "limit",
          "error"
        ]
      ]
    }
  }
]);
export const P074_SOURCES = Object.freeze(REVIEWED.map(({sessionId, index, nodeId, type: t, taskHash}) =>
  Object.freeze({sessionId, index, nodeId, type: t, taskHash})
));

export function p074ComplexChainBinding(task, context) {
  if (!isEvidenceContext(context)) return null;
  const entry = REVIEWED.find(e => e.sessionId === context.sessionId && e.index === context.index);
  if (!entry || !sameEvidence(task, entry.task) || !matchesNativeEvidenceTask(task, context, {type, nodeId: entry.nodeId})) return null;
  return {nodeId: entry.nodeId, kind: 'p074-complex-chain', method: null, question: entry.question};
}

export function replayP074ComplexChainEvidence(task, model, context) {
  try {
    const binding = p074ComplexChainBinding(task, context);
    if (!binding || !hasExactKeys(model, Object.keys(initial(task))) || !valid(task, model) ||
        model.issue !== '' || !model.history.length || Object.keys(model.history).length !== model.history.length) return null;
    const cardIds = new Set(task.cards.map(c => c.id));
    const lineIds = new Set((task.lines || []).map(l => l.id));
    const selected = [];
    let marked = null, undos = 0;
    for (const event of model.history) {
      if (!hasExactKeys(event, ['a', 'i', 'v', 'w', 'c'])) return null;
      if (event.v !== '' || event.w !== '' || event.c !== '') return null;
      if (event.a === 'card') {
        if (!cardIds.has(event.i)) return null;
        if (!selected.includes(event.i)) selected.push(event.i);
      } else if (event.a === 'undo') {
        if (event.i !== '') return null;
        if (selected.length) { selected.pop(); undos++; }
      } else if (event.a === 'mark') {
        if (!task.lines || !lineIds.has(event.i)) return null;
        marked = event.i;
      } else return null;
    }
    if (!sameEvidence(selected, model.board.selected) || model.board.marked !== marked ||
        model.board.removed.length !== 0 || model.board.exchanged !== false) return null;
    const matchedPath = task.paths.find(p => sameEvidence(p, selected));
    if (!matchedPath || (task.lines && marked !== task.error) || !inspect(task, model).correct) return null;
    return {binding, path: matchedPath, marked, undos, cardCount: selected.length};
  } catch { return null; }
}

export function submittedP074ComplexChainEvidence(task, model, record, context) {
  if (!latestSubmissionMatches(model, record)) return null;
  return replayP074ComplexChainEvidence(task, model, context);
}
