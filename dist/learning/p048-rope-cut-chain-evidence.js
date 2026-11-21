import {initial, inspect, valid} from './phase5/b38-model.js';
import {hasExactKeys, isEvidenceContext, latestSubmissionMatches, matchesNativeEvidenceTask, sameEvidence} from './evidence-contract.js';

const type = 'x-r38-chain';
const REVIEWED = Object.freeze([
  {
    "sessionId": "tools38",
    "index": 2,
    "nodeId": "mt_20WfHhnL39",
    "type": "x-r38-chain",
    "taskHash": "1d134ac2b87eadd270a73c3a80ba64cac39b62dc353a12c81eaaeb40de868421",
    "question": "为什么要在同一整段上标出剪掉的部分，才能看清剩下哪一段？",
    "task": {
      "type": "x-r38-chain",
      "prompt": "想看清一根绳剪掉一段后还剩多少。哪种表示能把原来、剪掉和剩下放在一起？",
      "cards": [
        {
          "id": "whole",
          "text": "先画出原来的一整段"
        },
        {
          "id": "cut",
          "text": "在同一段上标出剪掉的部分"
        },
        {
          "id": "left",
          "text": "剩下的是没有剪掉的部分"
        },
        {
          "id": "wrong",
          "text": "只记剪掉的数字，不看原来的长度"
        }
      ],
      "paths": [
        [
          "whole",
          "cut",
          "left"
        ]
      ]
    }
  }
]);
const expectedPaths = [["whole", "cut", "left"]];
const firstError = null;

export const P048_SOURCES = Object.freeze(REVIEWED.map(({sessionId, index, nodeId, type: t, taskHash}) =>
  Object.freeze({sessionId, index, nodeId, type: t, taskHash})
));

export function p048RopeCutChainBinding(task, context) {
  if (!isEvidenceContext(context)) return null;
  const entry = REVIEWED.find(e => e.sessionId === context.sessionId && e.index === context.index);
  if (!entry || !sameEvidence(task, entry.task) || !matchesNativeEvidenceTask(task, context, {type, nodeId: entry.nodeId})) return null;
  return {nodeId: entry.nodeId, kind: 'p048-rope-cut-chain', method: null, question: entry.question};
}

export function replayP048RopeCutChainEvidence(task, model, context) {
  try {
    const binding = p048RopeCutChainBinding(task, context);
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
    const matchedPath = expectedPaths.find(path => sameEvidence(path, selected));
    if (!matchedPath || marked !== firstError || !inspect(task, model).correct) return null;
    return {binding, path: matchedPath, marked, undos, cardCount: selected.length};
  } catch { return null; }
}

export function submittedP048RopeCutChainEvidence(task, model, record, context) {
  if (!latestSubmissionMatches(model, record)) return null;
  return replayP048RopeCutChainEvidence(task, model, context);
}
