import {initial, inspect, valid} from './phase5/b30-model.js';
import {hasExactKeys, isEvidenceContext, latestSubmissionMatches, matchesNativeEvidenceTask, sameEvidence} from './evidence-contract.js';
import {rational} from './phase5/b16-model.js';

const reviewed = [
  {
    "sessionId": "prismFormulas",
    "index": 1,
    "nodeId": "mt_tAJH5BrpOx",
    "type": "x-a30-solid",
    "taskHash": "b45dd74041a96817e559de29fb8f90db76a62cf9f1df86a0c2174b98b983bf44",
    "task": {
      "type": "x-a30-solid",
      "kind": "prism",
      "prompt": "三角形底两条直角边为 3 cm、4 cm，棱柱长 10 cm。转一转，算一层再算里面。",
      "size": [
        4,
        3,
        10
      ],
      "unit": "cm",
      "faces": [
        {
          "name": "三角端一",
          "dims": "3×4÷2",
          "area": 6
        },
        {
          "name": "三角端二",
          "dims": "3×4÷2",
          "area": 6
        },
        {
          "name": "长侧一",
          "dims": "4×10",
          "area": 40
        },
        {
          "name": "长侧二",
          "dims": "3×10",
          "area": 30
        },
        {
          "name": "斜侧",
          "dims": "5×10",
          "area": 50
        }
      ],
      "net": [
        {
          "index": 0,
          "points": [
            [
              0,
              0
            ],
            [
              4,
              0
            ],
            [
              0,
              -3
            ]
          ]
        },
        {
          "index": 1,
          "points": [
            [
              0,
              10
            ],
            [
              4,
              10
            ],
            [
              0,
              13
            ]
          ]
        },
        {
          "index": 2,
          "points": [
            [
              0,
              0
            ],
            [
              4,
              0
            ],
            [
              4,
              10
            ],
            [
              0,
              10
            ]
          ]
        },
        {
          "index": 3,
          "points": [
            [
              4,
              0
            ],
            [
              7,
              0
            ],
            [
              7,
              10
            ],
            [
              4,
              10
            ]
          ]
        },
        {
          "index": 4,
          "points": [
            [
              7,
              0
            ],
            [
              12,
              0
            ],
            [
              12,
              10
            ],
            [
              7,
              10
            ]
          ]
        }
      ],
      "requiredFaces": [],
      "volumeRequired": true,
      "baseArea": 6,
      "volume": 60
    }
  },
  {
    "sessionId": "prismFormulas",
    "index": 2,
    "nodeId": "mt_tAJH5BrpOx",
    "type": "x-a30-solid",
    "taskHash": "8e254d6e19b42c3b5f83d51e2d0efe858589bcec2bb74cc26945236f63c6c427",
    "task": {
      "type": "x-a30-solid",
      "kind": "cylinder",
      "prompt": "圆柱半径 2 cm、高 4 cm。用 π≈3.14 算一层圆面，再算里面。",
      "size": [
        2,
        4
      ],
      "unit": "cm",
      "faces": [],
      "requiredFaces": [],
      "volumeRequired": true,
      "baseArea": 12.56,
      "volume": 50.24,
      "questions": [
        {
          "label": "圆柱体积从哪一层出发",
          "value": "base",
          "options": [
            [
              "base",
              "圆底面积×高"
            ],
            [
              "edge",
              "圆周长×高"
            ]
          ]
        }
      ]
    }
  }
];
export const P040_SOURCES = Object.freeze(reviewed.map(({task, ...source}) => Object.freeze(source)));
export function p040PrismFaceVolumeBinding(task, context) {
  if (!isEvidenceContext(context)) return null;
  const entry = reviewed.find(source => source.sessionId === context.sessionId && source.index === context.index);
  if (!entry || !sameEvidence(task, entry.task) || !matchesNativeEvidenceTask(task, context, entry)) return null;
  return {nodeId:entry.nodeId, kind:'p040-prism-face-volume', method:null, question:"一层底面面积乘多少层，才得到体积？"};
}
export function replayP040PrismFaceVolumeEvidence(task, model, context) {
  try {
    const binding = p040PrismFaceVolumeBinding(task, context);
    if (!binding || !hasExactKeys(model, Object.keys(initial(task))) || !valid(task, model) ||
        model.issue !== '' || !model.history.length || Object.keys(model.history).length !== model.history.length) return null;
    const starting = initial(task).board;
    const seen = new Set();
    let turns = 0;
    for (const event of model.history) {
      if (!hasExactKeys(event, ['a','i','f']) || !hasExactKeys(event.f, [])) return null;
      if (event.a === 'turn' && event.i === '') {
        turns++;
      } else if (event.a === 'face' && /^\d+$/.test(event.i)) {
        const index = Number(event.i);
        if (index >= task.faces.length) return null;
        starting.first.face ??= index;
        if (!seen.delete(index)) seen.add(index);
      } else return null;
    }
    starting.turned = turns > 0;
    starting.selected = [...seen];
    const cylinder = task.kind === 'cylinder';
    const [a,b,c] = task.size;
    const length = cylinder ? b : c;
    const twiceHundredths = cylinder ? 628 * a * a : 100 * a * b;
    const exact = (text, target) => {
      const value = rational(text.trim());
      return value && BigInt(value[0]) * 200n === BigInt(target) * BigInt(value[1]);
    };
    if (!turns || !sameEvidence(starting,model.board) ||
        !exact(model.base,twiceHundredths) || !exact(model.volume,twiceHundredths*length) ||
        model.volumeUnit !== 'cm³' || (cylinder && model.answers[0] !== 'base') || !inspect(task,model).correct) return null;
    return {binding, turns, baseArea:twiceHundredths/200, volume:twiceHundredths*length/200};

  } catch {
    return null;
  }
}
export function submittedP040PrismFaceVolumeEvidence(task, model, record, context) {
  return latestSubmissionMatches(model, record) ? replayP040PrismFaceVolumeEvidence(task, model, context) : null;
}
