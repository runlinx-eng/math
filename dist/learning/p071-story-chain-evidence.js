import {initial, inspect, valid} from './phase5/b38-model.js';
import {hasExactKeys, isEvidenceContext, latestSubmissionMatches, matchesNativeEvidenceTask, sameEvidence} from './evidence-contract.js';

const type = 'x-r38-chain';
const REVIEWED = Object.freeze([
  {
    "sessionId": "story38",
    "index": 2,
    "nodeId": "mt_IM1G_7QzTa",
    "question": "为什么“一开始 3 颗、又来 4 颗、一共 7 颗”才对应合起来的故事？",
    "type": "x-r38-chain",
    "taskHash": "e45928b8a7914d80391f0851a8ca01810dc1f0727dc45eb8df3451579f238d78",
    "task": {
      "type": "x-r38-chain",
      "prompt": "看见3颗和4颗一共7颗。你能讲一个合起来的故事吗？",
      "cards": [
        {
          "id": "one",
          "text": "一开始有3颗"
        },
        {
          "id": "two",
          "text": "后来又来了4颗"
        },
        {
          "id": "sum",
          "text": "合起来一共7颗"
        },
        {
          "id": "wrong",
          "text": "后来拿走4颗"
        }
      ],
      "paths": [
        [
          "one",
          "two",
          "sum"
        ]
      ]
    }
  }
]);
export const P071_SOURCES = Object.freeze(REVIEWED.map(({sessionId, index, nodeId, type: t, taskHash}) =>
  Object.freeze({sessionId, index, nodeId, type: t, taskHash})
));

export function p071StoryChainBinding(task, context) {
  if (!isEvidenceContext(context)) return null;
  const entry = REVIEWED.find(e => e.sessionId === context.sessionId && e.index === context.index);
  if (!entry || !sameEvidence(task, entry.task) || !matchesNativeEvidenceTask(task, context, {type, nodeId: entry.nodeId})) return null;
  return {nodeId: entry.nodeId, kind: 'p071-story-chain', method: null, question: entry.question};
}

export function replayP071StoryChainEvidence(task, model, context) {
  try {
    const binding = p071StoryChainBinding(task, context);
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

export function submittedP071StoryChainEvidence(task, model, record, context) {
  if (!latestSubmissionMatches(model, record)) return null;
  return replayP071StoryChainEvidence(task, model, context);
}
