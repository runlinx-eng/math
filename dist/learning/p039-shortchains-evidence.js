import {initial, inspect, valid} from './phase5/b38-model.js';
import {hasExactKeys, isEvidenceContext, latestSubmissionMatches, matchesNativeEvidenceTask, sameEvidence} from './evidence-contract.js';

const reviewed = [
  {
    "sessionId": "because38",
    "index": 1,
    "nodeId": "mt_a3dov8CZkq",
    "type": "x-r38-chain",
    "taskHash": "7d481edaeedb653e58ca840b2381946e6fd1140e3d63d20769472102ab4fa749",
    "task": {
      "type": "x-r38-chain",
      "prompt": "有人把71−46算成35。先指出第一次错误，再拆开一捆十，排好修正的思路。",
      "cards": [
        {
          "id": "exchange",
          "text": "71里拆开一捆十，变成6个十和11个一"
        },
        {
          "id": "ones",
          "text": "11个一减6个一，剩5个一"
        },
        {
          "id": "tens",
          "text": "6个十减4个十，剩2个十"
        },
        {
          "id": "answer",
          "text": "合起来是25"
        },
        {
          "id": "flip",
          "text": "把个位的6减1就可以"
        }
      ],
      "paths": [
        [
          "exchange",
          "ones",
          "tens",
          "answer"
        ],
        [
          "exchange",
          "tens",
          "ones",
          "answer"
        ]
      ],
      "scene": "exchange",
      "lines": [
        {
          "id": "start",
          "text": "71里有7个十和1个一"
        },
        {
          "id": "error",
          "text": "个位1不够减6，就用6减1"
        },
        {
          "id": "end",
          "text": "十位7减4，所以答案是35"
        }
      ],
      "error": "error"
    }
  },
  {
    "sessionId": "because38",
    "index": 2,
    "nodeId": "mt_a3dov8CZkq",
    "type": "x-r38-chain",
    "taskHash": "79eb0b58ae2f424514b2311e523bfc71244582c6a2f3a4e188b92bd090d52dcf",
    "task": {
      "type": "x-r38-chain",
      "prompt": "每列有6个点，一共有10列，拿走两列。把“6个8为什么是48”连成一条思路。",
      "cards": [
        {
          "id": "ten",
          "text": "6×10＝60"
        },
        {
          "id": "two",
          "text": "6×2＝12"
        },
        {
          "id": "eight",
          "text": "6×8＝60−12＝48"
        },
        {
          "id": "wrong",
          "text": "6×8＝60＋12"
        }
      ],
      "paths": [
        [
          "ten",
          "two",
          "eight"
        ],
        [
          "two",
          "ten",
          "eight"
        ]
      ],
      "scene": "array"
    }
  }
];
export const P039_SOURCES = Object.freeze(reviewed.map(({task, ...source}) => Object.freeze(source)));
export function p039ShortChainsBinding(task, context) {
  if (!isEvidenceContext(context)) return null;
  const entry = reviewed.find(source => source.sessionId === context.sessionId && source.index === context.index);
  if (!entry || !sameEvidence(task, entry.task) || !matchesNativeEvidenceTask(task, context, entry)) return null;
  return {nodeId:entry.nodeId, kind:'p039-shortchains', method:null, question:"怎样把十换成十个一，或从十列里拿走两列，再解释算式？"};
}
export function replayP039ShortChainsEvidence(task, model, context) {
  try {
    const binding = p039ShortChainsBinding(task, context);
    if (!binding || !hasExactKeys(model, Object.keys(initial(task))) || !valid(task, model) ||
        model.issue !== '' || !model.history.length || Object.keys(model.history).length !== model.history.length) return null;
    const subtraction = task.scene === 'exchange';
    const paths = subtraction
      ? [['exchange','ones','tens','answer'], ['exchange','tens','ones','answer']]
      : [['ten','two','eight'], ['two','ten','eight']];
    const ids = new Set(task.cards.map(card => card.id));
    const lines = new Set((task.lines ?? []).map(line => line.id));
    const selected = [];
    const removed = new Set();
    let exchanged = false;
    let marked = null;
    for (const event of model.history) {
      if (!hasExactKeys(event, ['a','i','v','w','c']) || event.v !== '' || event.w !== '' || event.c !== '') return null;
      if (event.a === 'card' && ids.has(event.i)) {
        if (!selected.includes(event.i)) selected.push(event.i);
      } else if (event.a === 'undo' && event.i === '') {
        selected.pop();
      } else if (event.a === 'mark' && subtraction && lines.has(event.i)) {
        marked = event.i;
      } else if (event.a === 'exchange' && subtraction && event.i === '') {
        exchanged = !exchanged;
      } else if (event.a === 'column' && !subtraction && /^\d$/.test(event.i)) {
        const index = Number(event.i);
        if (!removed.delete(index)) removed.add(index);
      } else return null;
    }
    const columns = [...removed].sort((a,b) => a-b);
    const path = paths.find(candidate => sameEvidence(candidate,selected));
    if (!path || (subtraction ? !exchanged || marked !== 'error' : columns.length !== 2) ||
        !sameEvidence({selected,marked,removed:columns,exchanged,bad:false},model.board) || !inspect(task,model).correct) return null;
    const result = subtraction ? (6 - 4) * 10 + (11 - 6) : 6 * (10 - columns.length);
    return {binding, path, marked, exchanged, removed:columns, result};

  } catch {
    return null;
  }
}
export function submittedP039ShortChainsEvidence(task, model, record, context) {
  return latestSubmissionMatches(model, record) ? replayP039ShortChainsEvidence(task, model, context) : null;
}
