import {number} from './phase5/b20-model.js';
import {initial, inspect, valid, stats} from './phase5/b21-model.js';
import {hasExactKeys, isEvidenceContext, latestSubmissionMatches, matchesNativeEvidenceTask, sameEvidence} from './evidence-contract.js';

const type = 'x-statbrief';
const REVIEWED = Object.freeze([
  {
    "sessionId": "datasummary",
    "index": 0,
    "nodeId": "mt_tuEnyrp5Ia",
    "type": "x-statbrief",
    "taskHash": "0aeb3d6b4d91ed5b22e450ee5e7eb2777432d1a8dc2d41463b8c4b9235ae4a15",
    "task": {
      "type": "x-statbrief",
      "prompt": "把这25份反应时间的来历、代表位置、散开程度与特别远的记录装成一段清楚摘要。",
      "values": [
        0.21,
        0.22,
        0.23,
        0.24,
        0.25,
        0.26,
        0.27,
        0.28,
        0.29,
        0.3,
        0.3,
        0.31,
        0.32,
        0.33,
        0.34,
        0.35,
        0.36,
        0.37,
        0.38,
        0.39,
        0.4,
        0.42,
        0.45,
        0.48,
        4.2
      ],
      "unit": "秒",
      "attribute": "看到信号到按键的时间",
      "method": "同一计时程序，每人一次",
      "who": "25位模拟参与者",
      "pair": "median",
      "questions": [],
      "unusual": 4.2,
      "allowedPairs": [
        "median",
        "mean"
      ]
    },
    "question": "为什么统计摘要不能只写一个平均数，而要同时说明对象、份数、单位、合适的位置与散开程度？"
  },
  {
    "sessionId": "datasummary",
    "index": 1,
    "nodeId": "mt_tuEnyrp5Ia",
    "type": "x-statbrief",
    "taskHash": "76982680a7fb01decac426c91f291026f2f965c579364f9a2746da1d41e91c5e",
    "task": {
      "type": "x-statbrief",
      "prompt": "这组通勤用时右边拖着长尾。为摘要选择合适的一对“位置与散开”。",
      "values": [
        5,
        6,
        7,
        8,
        9,
        10,
        12,
        14,
        18,
        30,
        70
      ],
      "unit": "分钟",
      "attribute": "单程用时",
      "method": "同一计时器，从出发到到达",
      "who": "这组参与者",
      "pair": "median",
      "questions": [
        {
          "label": "选这对量的理由",
          "value": [
            "tail"
          ],
          "options": [
            [
              "tail",
              "长尾会拉动均分位置，中间一半更稳健"
            ],
            [
              "always",
              "所有数据都只能用这种摘要"
            ]
          ]
        }
      ]
    },
    "question": "为什么统计摘要不能只写一个平均数，而要同时说明对象、份数、单位、合适的位置与散开程度？"
  },
  {
    "sessionId": "datasummary",
    "index": 2,
    "nodeId": "mt_tuEnyrp5Ia",
    "type": "x-statbrief",
    "taskHash": "122dcf6b959fcfa1dace0c4486ab093b33e9522d6111ef4874f5062496dd2dbd",
    "task": {
      "type": "x-statbrief",
      "prompt": "“平均是14”还不够。按给定记录补出谁、多少份、哪种中间、单位和中间一半。",
      "values": [
        4,
        6,
        7,
        8,
        8,
        9,
        9,
        9,
        10,
        10,
        11,
        12,
        12,
        13,
        14,
        14,
        15,
        16,
        17,
        18,
        20,
        21,
        22,
        22,
        23,
        25,
        28,
        30,
        35,
        40
      ],
      "unit": "分钟",
      "attribute": "单程用时",
      "method": "同样起止点，逐人计分钟",
      "who": "30位模拟参与者",
      "pair": "median",
      "questions": []
    },
    "question": "为什么统计摘要不能只写一个平均数，而要同时说明对象、份数、单位、合适的位置与散开程度？"
  }
]);
export const P081_SOURCES = Object.freeze(REVIEWED.map(({sessionId, index, nodeId, type: t, taskHash}) => Object.freeze({sessionId, index, nodeId, type: t, taskHash})));

export function p081StatBriefBinding(task, context) {
  if (!isEvidenceContext(context)) return null;
  const entry = REVIEWED.find(e => e.sessionId === context.sessionId && e.index === context.index);
  if (!entry || !sameEvidence(task, entry.task) || !matchesNativeEvidenceTask(task, context, {type, nodeId: entry.nodeId})) return null;
  return {nodeId: entry.nodeId, kind: 'p081-stat-brief', method: null, question: entry.question};
}

export function replayP081StatBriefEvidence(task, model, context) {
  try {
    const binding = p081StatBriefBinding(task, context);
    if (!binding || !hasExactKeys(model, Object.keys(initial(task))) || !valid(task, model) ||
        model.issue !== '' || !model.history.length || Object.keys(model.history).length !== model.history.length) return null;
    let saved = null, reports = 0;
    for (const ev of model.history) {
      if (!hasExactKeys(ev, ['a', 'd', 'f']) || !hasExactKeys(ev.d, [])) return null;
      if (ev.a === 'reset' && hasExactKeys(ev.f, [])) { saved = null; }
      else if (ev.a === 'report') { saved = ev.f; reports++; }
      else return null;
    }
    const s = stats(task.values);
    const allowedPairs = task.allowedPairs || [task.pair];
    if (!reports || !saved || !sameEvidence(saved, model.board.saved)) return null;
    const expectedCenter = saved.pair === 'median' ? s.median : s.mean;
    const expectedSpread = saved.pair === 'median' ? s.iqr : s.mad;
    if (saved.who !== 'who' || saved.attribute !== 'attribute' || saved.method !== 'method' || saved.unit !== task.unit ||
        !allowedPairs.includes(saved.pair) || number(saved.n) !== task.values.length ||
        Math.abs(number(saved.center) - expectedCenter) > 1e-6 || Math.abs(number(saved.spread) - expectedSpread) > 1e-6 ||
        saved.scope !== 'records' || (task.unusual && Math.abs(number(saved.outlier) - task.unusual) > 1e-7) ||
        !['who','attribute','method','unit','pair','center','spread','n','outlier','scope','reason'].every(k => saved[k] === model[k]) ||
        !inspect(task, model).correct) return null;
    return {binding, pair: saved.pair, n: task.values.length, center: expectedCenter, spread: expectedSpread, reports};
  } catch { return null; }
}

export function submittedP081StatBriefEvidence(task, model, record, context) {
  if (!latestSubmissionMatches(model, record)) return null;
  return replayP081StatBriefEvidence(task, model, context);
}
