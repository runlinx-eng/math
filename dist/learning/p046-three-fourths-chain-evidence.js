import {initial, inspect, valid} from './phase5/b38-model.js';
import {hasExactKeys, isEvidenceContext, latestSubmissionMatches, matchesNativeEvidenceTask, sameEvidence} from './evidence-contract.js';

const type = 'x-r38-chain';
const REVIEWED = Object.freeze([
  {
    "sessionId": "precise38",
    "index": 1,
    "nodeId": "mt_mywsN77hGZ",
    "type": "x-r38-chain",
    "taskHash": "cefaa3569cd7ba1e23226ddafa13144f59d85507c64ec4b7329ed084815f4daa",
    "question": "为什么取的是四个相等部分中的三个？",
    "task": {
      "type": "x-r38-chain",
      "prompt": "一整条平均分成四份，取三份。把两种说法连到同一段。",
      "cards": [
        {
          "id": "whole",
          "text": "一整条分成4个相等的部分"
        },
        {
          "id": "take",
          "text": "取其中3份"
        },
        {
          "id": "name",
          "text": "三份四分之一就是四分之三"
        },
        {
          "id": "wrong",
          "text": "只取了一份"
        }
      ],
      "paths": [
        [
          "whole",
          "take",
          "name"
        ]
      ]
    }
  }
]);
const expectedPaths = [["whole", "take", "name"]];
const firstError = null;

export const P046_SOURCES = Object.freeze(REVIEWED.map(({sessionId, index, nodeId, type: t, taskHash}) =>
  Object.freeze({sessionId, index, nodeId, type: t, taskHash})
));

export function p046ThreeFourthsChainBinding(task, context) {
  if (!isEvidenceContext(context)) return null;
  const entry = REVIEWED.find(e => e.sessionId === context.sessionId && e.index === context.index);
  if (!entry || !sameEvidence(task, entry.task) || !matchesNativeEvidenceTask(task, context, {type, nodeId: entry.nodeId})) return null;
  return {nodeId: entry.nodeId, kind: 'p046-three-fourths-chain', method: null, question: entry.question};
}

export function replayP046ThreeFourthsChainEvidence(task, model, context) {
  try {
    const binding = p046ThreeFourthsChainBinding(task, context);
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

export function submittedP046ThreeFourthsChainEvidence(task, model, record, context) {
  if (!latestSubmissionMatches(model, record)) return null;
  return replayP046ThreeFourthsChainEvidence(task, model, context);
}
