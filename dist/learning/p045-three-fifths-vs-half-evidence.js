import {initial, inspect, valid} from './phase5/b38-model.js';
import {hasExactKeys, isEvidenceContext, latestSubmissionMatches, matchesNativeEvidenceTask, sameEvidence} from './evidence-contract.js';

const type = 'x-r38-chain';
const REVIEWED = Object.freeze([
  {
    "sessionId": "multiShape38",
    "index": 3,
    "nodeId": "mt_SmghasIvbT",
    "type": "x-r38-chain",
    "taskHash": "41a3553b292ceb8f90e59f8d88a31c551e82e840f8dc0731e98fa9ed5cef0df9",
    "question": "为什么 20 的五分之三大于 10？",
    "task": {
      "type": "x-r38-chain",
      "prompt": "20的3/5应该比一半多还是少？把比较的理由接起来。",
      "cards": [
        {
          "id": "half",
          "text": "20的一半是10"
        },
        {
          "id": "compare",
          "text": "3/5大于1/2"
        },
        {
          "id": "result",
          "text": "20的3/5应大于10"
        },
        {
          "id": "wrong",
          "text": "3/5小于1/2"
        }
      ],
      "paths": [
        [
          "half",
          "compare",
          "result"
        ],
        [
          "compare",
          "half",
          "result"
        ]
      ]
    }
  }
]);
const expectedPaths = [["half", "compare", "result"], ["compare", "half", "result"]];
const firstError = null;

export const P045_SOURCES = Object.freeze(REVIEWED.map(({sessionId, index, nodeId, type: t, taskHash}) =>
  Object.freeze({sessionId, index, nodeId, type: t, taskHash})
));

export function p045ThreeFifthsVsHalfBinding(task, context) {
  if (!isEvidenceContext(context)) return null;
  const entry = REVIEWED.find(e => e.sessionId === context.sessionId && e.index === context.index);
  if (!entry || !sameEvidence(task, entry.task) || !matchesNativeEvidenceTask(task, context, {type, nodeId: entry.nodeId})) return null;
  return {nodeId: entry.nodeId, kind: 'p045-three-fifths-vs-half', method: null, question: entry.question};
}

export function replayP045ThreeFifthsVsHalfEvidence(task, model, context) {
  try {
    const binding = p045ThreeFifthsVsHalfBinding(task, context);
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

export function submittedP045ThreeFifthsVsHalfEvidence(task, model, record, context) {
  if (!latestSubmissionMatches(model, record)) return null;
  return replayP045ThreeFifthsVsHalfEvidence(task, model, context);
}
