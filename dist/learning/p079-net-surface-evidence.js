import {number} from './phase5/b20-model.js';
import {initial, inspect, valid} from './phase5/b30-model.js';
import {hasExactKeys, isEvidenceContext, latestSubmissionMatches, matchesNativeEvidenceTask, sameEvidence} from './evidence-contract.js';

const type = 'x-a30-solid';
const REVIEWED = Object.freeze([
  {
    "sessionId": "netSurface",
    "index": 0,
    "nodeId": "mt_tegkuJA5gM",
    "type": "x-a30-solid",
    "taskHash": "615c0f44811c01763437d44c711822f7304e6d3447d5de01f9f5bfe2f98ecef4",
    "task": {
      "type": "x-a30-solid",
      "kind": "box",
      "prompt": "长 5 cm、宽 4 cm、高 3 cm。转动盒子，选出全部六面并记录各面面积。",
      "size": [
        5,
        4,
        3
      ],
      "unit": "cm",
      "faces": [
        {
          "name": "前面",
          "dims": "5×3",
          "area": 15
        },
        {
          "name": "后面",
          "dims": "5×3",
          "area": 15
        },
        {
          "name": "左面",
          "dims": "4×3",
          "area": 12
        },
        {
          "name": "右面",
          "dims": "4×3",
          "area": 12
        },
        {
          "name": "上面",
          "dims": "5×4",
          "area": 20
        },
        {
          "name": "底面",
          "dims": "5×4",
          "area": 20
        }
      ],
      "net": [
        {
          "index": 0,
          "points": [
            [
              4,
              4
            ],
            [
              9,
              4
            ],
            [
              9,
              7
            ],
            [
              4,
              7
            ]
          ]
        },
        {
          "index": 1,
          "points": [
            [
              4,
              11
            ],
            [
              9,
              11
            ],
            [
              9,
              14
            ],
            [
              4,
              14
            ]
          ]
        },
        {
          "index": 2,
          "points": [
            [
              0,
              4
            ],
            [
              4,
              4
            ],
            [
              4,
              7
            ],
            [
              0,
              7
            ]
          ]
        },
        {
          "index": 3,
          "points": [
            [
              9,
              4
            ],
            [
              13,
              4
            ],
            [
              13,
              7
            ],
            [
              9,
              7
            ]
          ]
        },
        {
          "index": 4,
          "points": [
            [
              4,
              0
            ],
            [
              9,
              0
            ],
            [
              9,
              4
            ],
            [
              4,
              4
            ]
          ]
        },
        {
          "index": 5,
          "points": [
            [
              4,
              7
            ],
            [
              9,
              7
            ],
            [
              9,
              11
            ],
            [
              4,
              11
            ]
          ]
        }
      ],
      "requiredFaces": [
        0,
        1,
        2,
        3,
        4,
        5
      ],
      "surface": 94
    },
    "question": "为什么 5×4×3 的长方体有 3 对相对面，展开后总表面积是 94 cm²？"
  },
  {
    "sessionId": "netSurface",
    "index": 1,
    "nodeId": "mt_tegkuJA5gM",
    "type": "x-a30-solid",
    "taskHash": "8e8751bc6a4ffa9743447cab900d0b8282d8dd258c6d5adb9f8d13a757cf06a3",
    "task": {
      "type": "x-a30-solid",
      "kind": "pyramid",
      "prompt": "方形底边 6 cm，每个三角面的垂直面高 5 cm。看立体和展开图，算外表。",
      "size": [
        6,
        5
      ],
      "unit": "cm",
      "faces": [
        {
          "name": "正方形底",
          "dims": "6×6",
          "area": 36
        },
        {
          "name": "三角面一",
          "dims": "底6，高5，除以2",
          "area": 15
        },
        {
          "name": "三角面二",
          "dims": "底6，高5，除以2",
          "area": 15
        },
        {
          "name": "三角面三",
          "dims": "底6，高5，除以2",
          "area": 15
        },
        {
          "name": "三角面四",
          "dims": "底6，高5，除以2",
          "area": 15
        }
      ],
      "net": [
        {
          "index": 0,
          "points": [
            [
              5,
              5
            ],
            [
              11,
              5
            ],
            [
              11,
              11
            ],
            [
              5,
              11
            ]
          ]
        },
        {
          "index": 1,
          "points": [
            [
              5,
              5
            ],
            [
              11,
              5
            ],
            [
              8,
              0
            ]
          ]
        },
        {
          "index": 2,
          "points": [
            [
              11,
              5
            ],
            [
              11,
              11
            ],
            [
              16,
              8
            ]
          ]
        },
        {
          "index": 3,
          "points": [
            [
              11,
              11
            ],
            [
              5,
              11
            ],
            [
              8,
              16
            ]
          ]
        },
        {
          "index": 4,
          "points": [
            [
              5,
              11
            ],
            [
              5,
              5
            ],
            [
              0,
              8
            ]
          ]
        }
      ],
      "requiredFaces": [
        0,
        1,
        2,
        3,
        4
      ],
      "surface": 96
    },
    "question": "为什么方形棱锥的 4 个三角面面积都要除以 2，和底面合起来共 96 cm²？"
  }
]);
export const P079_SOURCES = Object.freeze(REVIEWED.map(({sessionId, index, nodeId, type: t, taskHash}) => Object.freeze({sessionId, index, nodeId, type: t, taskHash})));

export function p079NetSurfaceBinding(task, context) {
  if (!isEvidenceContext(context)) return null;
  const entry = REVIEWED.find(e => e.sessionId === context.sessionId && e.index === context.index);
  if (!entry || !sameEvidence(task, entry.task) || !matchesNativeEvidenceTask(task, context, {type, nodeId: entry.nodeId})) return null;
  return {nodeId: entry.nodeId, kind: 'p079-net-surface', method: null, question: entry.question};
}

function exactFaces(task) {
  if (task.kind === 'box') { const [l, w, h] = task.size; return [l*h, l*h, w*h, w*h, l*w, l*w]; }
  const [b, sh] = task.size; return [b*b, b*sh/2, b*sh/2, b*sh/2, b*sh/2];
}

export function replayP079NetSurfaceEvidence(task, model, context) {
  try {
    const binding = p079NetSurfaceBinding(task, context);
    if (!binding || !hasExactKeys(model, Object.keys(initial(task))) || !valid(task, model) ||
        model.issue !== '' || !model.history.length || Object.keys(model.history).length !== model.history.length) return null;
    const faceCount = task.faces.length, selected = new Set();
    let turns = 0;
    for (const ev of model.history) {
      if (!hasExactKeys(ev, ['a', 'i', 'f']) || !hasExactKeys(ev.f, [])) return null;
      if (ev.a === 'face' && /^\d+$/.test(ev.i) && Number(ev.i) < faceCount && ev.i === String(Number(ev.i))) {
        const idx = Number(ev.i); if (!selected.delete(idx)) selected.add(idx);
      } else if (ev.a === 'turn' && ev.i === '') turns++;
      else return null;
    }
    const allIdx = Array.from({length: faceCount}, (_, i) => i);
    if (!turns || !model.board.turned || !sameEvidence([...selected], model.board.selected) || !sameEvidence([...selected].sort((a,b)=>a-b), allIdx)) return null;
    const areas = exactFaces(task), total = areas.reduce((s, x) => s + x, 0);
    if (!sameEvidence(model.faceValues.map(number), areas) || number(model.area) !== total || model.unit !== task.unit + '²' || !inspect(task, model).correct) return null;
    return {binding, kind: task.kind, faceAreas: areas, surface: total, turns};
  } catch { return null; }
}

export function submittedP079NetSurfaceEvidence(task, model, record, context) {
  if (!latestSubmissionMatches(model, record)) return null;
  return replayP079NetSurfaceEvidence(task, model, context);
}
