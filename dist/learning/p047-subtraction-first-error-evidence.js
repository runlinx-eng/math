import {initial, inspect, valid} from './phase5/b38-model.js';
import {hasExactKeys, isEvidenceContext, latestSubmissionMatches, matchesNativeEvidenceTask, sameEvidence} from './evidence-contract.js';

const type = 'x-r38-chain';
const REVIEWED = Object.freeze([
  {
    "sessionId": "show38",
    "index": 2,
    "nodeId": "mt_nyK25mNOeR",
    "type": "x-r38-chain",
    "taskHash": "73d9d9422d8c3d37827a2a60cee7fe1569918cef3caf367436433db30d095677",
    "question": "为什么“剩下 2 个”是第一处错误？",
    "task": {
      "type": "x-r38-chain",
      "prompt": "有人说5减2剩2。点出最先不对的一步，再摆出能让人看懂的两句话。",
      "cards": [
        {
          "id": "parts",
          "text": "5可以分成2和3"
        },
        {
          "id": "remove",
          "text": "拿走2后，剩下3"
        },
        {
          "id": "wrong",
          "text": "拿走2后，原来和剩下都变成2"
        }
      ],
      "paths": [
        [
          "parts",
          "remove"
        ]
      ],
      "sceneText": "从5个里拿走2个，剩下的是没有拿走的部分。",
      "lines": [
        {
          "id": "start",
          "text": "原来有5个，拿走2个"
        },
        {
          "id": "error",
          "text": "拿走2个，所以剩下2个"
        },
        {
          "id": "end",
          "text": "结果写成5−2＝2"
        }
      ],
      "error": "error"
    }
  }
]);
const expectedPaths = [["parts", "remove"]];
const firstError = "error";

export const P047_SOURCES = Object.freeze(REVIEWED.map(({sessionId, index, nodeId, type: t, taskHash}) =>
  Object.freeze({sessionId, index, nodeId, type: t, taskHash})
));

export function p047SubtractionFirstErrorBinding(task, context) {
  if (!isEvidenceContext(context)) return null;
  const entry = REVIEWED.find(e => e.sessionId === context.sessionId && e.index === context.index);
  if (!entry || !sameEvidence(task, entry.task) || !matchesNativeEvidenceTask(task, context, {type, nodeId: entry.nodeId})) return null;
  return {nodeId: entry.nodeId, kind: 'p047-subtraction-first-error', method: null, question: entry.question};
}

export function replayP047SubtractionFirstErrorEvidence(task, model, context) {
  try {
    const binding = p047SubtractionFirstErrorBinding(task, context);
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

export function submittedP047SubtractionFirstErrorEvidence(task, model, record, context) {
  if (!latestSubmissionMatches(model, record)) return null;
  return replayP047SubtractionFirstErrorEvidence(task, model, context);
}
