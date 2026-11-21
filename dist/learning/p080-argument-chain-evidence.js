import {initial, inspect, valid} from './phase5/b38-model.js';
import {hasExactKeys, isEvidenceContext, latestSubmissionMatches, matchesNativeEvidenceTask, sameEvidence} from './evidence-contract.js';

const type = 'x-r38-chain';
const REVIEWED = Object.freeze([
  {
    "sessionId": "argument38",
    "index": 0,
    "nodeId": "mt_j5YqQnN6xe",
    "question": "为什么已知两个角和内角和 180°，就能推出第三个角是 60°？",
    "type": "x-r38-chain",
    "taskHash": "d4b297c23d57ced596cea60dfd8a1d41f6ee4a44c8a59677d0510e5a821d40f3",
    "task": {
      "type": "x-r38-chain",
      "prompt": "三角形里两个角是50°和70°。不用量角器，能把剩下的角说清楚吗？",
      "cards": [
        {
          "id": "given",
          "text": "已知两角是50°和70°"
        },
        {
          "id": "sum",
          "text": "三角形三个内角合起来是180°"
        },
        {
          "id": "two",
          "text": "这两个角合起来120°"
        },
        {
          "id": "answer",
          "text": "剩下的角是180°−120°＝60°"
        },
        {
          "id": "wrong",
          "text": "剩下的角一定等于70°"
        }
      ],
      "paths": [
        [
          "given",
          "sum",
          "two",
          "answer"
        ],
        [
          "sum",
          "given",
          "two",
          "answer"
        ]
      ],
      "scene": "triangle"
    }
  },
  {
    "sessionId": "argument38",
    "index": 2,
    "nodeId": "mt_j5YqQnN6xe",
    "question": "为什么算 3/4 ÷ 1/2 不能倒第一个分数，而要看 3/4 里有几个 1/2？",
    "type": "x-r38-chain",
    "taskHash": "170f21b3ad21acacdc854d837d1d078b1389e9fd4da1e90152888b83caf778dd",
    "task": {
      "type": "x-r38-chain",
      "prompt": "有人算3/4÷1/2，把第一个分数倒过来。先指出错误，再用装果汁的过程说明。",
      "cards": [
        {
          "id": "half",
          "text": "每份1/2升是2个1/4升"
        },
        {
          "id": "one",
          "text": "3个1/4升可以装1份，还剩1个1/4升"
        },
        {
          "id": "last",
          "text": "剩下的是半份，一共1又1/2份"
        },
        {
          "id": "wrong",
          "text": "装不到一份，所以答案是2/3份"
        }
      ],
      "paths": [
        [
          "half",
          "one",
          "last"
        ]
      ],
      "sceneText": "把3/4升分成1/2升一份；每个小格表示1/4升。",
      "lines": [
        {
          "id": "start",
          "text": "要算3/4÷1/2"
        },
        {
          "id": "error",
          "text": "把3/4倒过来，写成4/3×1/2"
        },
        {
          "id": "end",
          "text": "因此得到2/3份"
        }
      ],
      "error": "error"
    }
  }
]);
export const P080_SOURCES = Object.freeze(REVIEWED.map(({sessionId, index, nodeId, type: t, taskHash}) =>
  Object.freeze({sessionId, index, nodeId, type: t, taskHash})
));

export function p080ArgumentChainBinding(task, context) {
  if (!isEvidenceContext(context)) return null;
  const entry = REVIEWED.find(e => e.sessionId === context.sessionId && e.index === context.index);
  if (!entry || !sameEvidence(task, entry.task) || !matchesNativeEvidenceTask(task, context, {type, nodeId: entry.nodeId})) return null;
  return {nodeId: entry.nodeId, kind: 'p080-argument-chain', method: null, question: entry.question};
}

export function replayP080ArgumentChainEvidence(task, model, context) {
  try {
    const binding = p080ArgumentChainBinding(task, context);
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

export function submittedP080ArgumentChainEvidence(task, model, record, context) {
  if (!latestSubmissionMatches(model, record)) return null;
  return replayP080ArgumentChainEvidence(task, model, context);
}
