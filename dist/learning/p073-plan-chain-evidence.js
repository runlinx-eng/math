import {initial, inspect, valid} from './phase5/b38-model.js';
import {hasExactKeys, isEvidenceContext, latestSubmissionMatches, matchesNativeEvidenceTask, sameEvidence} from './evidence-contract.js';

const type = 'x-r38-chain';
const REVIEWED = Object.freeze([
  {
    "sessionId": "plan38",
    "index": 0,
    "nodeId": "mt_O_UOTiMvT_",
    "question": "哪些信息决定还剩几张卡，为什么蓝桌子是无关干扰项？",
    "type": "x-r38-chain",
    "taskHash": "e93f94db5aa990967d79732ab12d9e182369ecd1510718b12596026213217475",
    "task": {
      "type": "x-r38-chain",
      "prompt": "有18张卡，送出7张，还有一张蓝色桌子。先找到有用的量与问题。",
      "cards": [
        {
          "id": "have",
          "text": "原来有18张"
        },
        {
          "id": "give",
          "text": "送出7张"
        },
        {
          "id": "ask",
          "text": "想找还剩多少张"
        },
        {
          "id": "decoy",
          "text": "桌子是蓝色"
        }
      ],
      "paths": [
        [
          "have",
          "give",
          "ask"
        ],
        [
          "give",
          "have",
          "ask"
        ]
      ]
    }
  }
]);
export const P073_SOURCES = Object.freeze(REVIEWED.map(({sessionId, index, nodeId, type: t, taskHash}) =>
  Object.freeze({sessionId, index, nodeId, type: t, taskHash})
));

export function p073PlanChainBinding(task, context) {
  if (!isEvidenceContext(context)) return null;
  const entry = REVIEWED.find(e => e.sessionId === context.sessionId && e.index === context.index);
  if (!entry || !sameEvidence(task, entry.task) || !matchesNativeEvidenceTask(task, context, {type, nodeId: entry.nodeId})) return null;
  return {nodeId: entry.nodeId, kind: 'p073-plan-chain', method: null, question: entry.question};
}

export function replayP073PlanChainEvidence(task, model, context) {
  try {
    const binding = p073PlanChainBinding(task, context);
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

export function submittedP073PlanChainEvidence(task, model, record, context) {
  if (!latestSubmissionMatches(model, record)) return null;
  return replayP073PlanChainEvidence(task, model, context);
}
