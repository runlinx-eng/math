import {initial, inspect, valid} from './phase5/b38-model.js';
import {hasExactKeys, isEvidenceContext, latestSubmissionMatches, matchesNativeEvidenceTask, sameEvidence} from './evidence-contract.js';

const type = 'x-r38-chain';
const REVIEWED = Object.freeze([
  {
    "sessionId": "sense38",
    "index": 0,
    "nodeId": "mt_WkKkb7W9Qd",
    "question": "算之前先弄清已知和所求，为什么这道题是求合起来的总数？",
    "type": "x-r38-chain",
    "taskHash": "8f98c155afccc5974cf104ef20e0a1a97f1f83ae51d1c255bd8926ac257f2381",
    "task": {
      "type": "x-r38-chain",
      "prompt": "原有3颗，又来4颗。先别算：知道什么，想找什么？",
      "cards": [
        {
          "id": "a",
          "text": "知道原来3颗"
        },
        {
          "id": "b",
          "text": "知道后来又来4颗"
        },
        {
          "id": "ask",
          "text": "想找现在一共几颗"
        },
        {
          "id": "wrong",
          "text": "想找拿走了多少颗"
        }
      ],
      "paths": [
        [
          "a",
          "b",
          "ask"
        ],
        [
          "b",
          "a",
          "ask"
        ]
      ]
    }
  }
]);
export const P072_SOURCES = Object.freeze(REVIEWED.map(({sessionId, index, nodeId, type: t, taskHash}) =>
  Object.freeze({sessionId, index, nodeId, type: t, taskHash})
));

export function p072SenseChainBinding(task, context) {
  if (!isEvidenceContext(context)) return null;
  const entry = REVIEWED.find(e => e.sessionId === context.sessionId && e.index === context.index);
  if (!entry || !sameEvidence(task, entry.task) || !matchesNativeEvidenceTask(task, context, {type, nodeId: entry.nodeId})) return null;
  return {nodeId: entry.nodeId, kind: 'p072-sense-chain', method: null, question: entry.question};
}

export function replayP072SenseChainEvidence(task, model, context) {
  try {
    const binding = p072SenseChainBinding(task, context);
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

export function submittedP072SenseChainEvidence(task, model, record, context) {
  if (!latestSubmissionMatches(model, record)) return null;
  return replayP072SenseChainEvidence(task, model, context);
}
