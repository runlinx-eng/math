import {initial, inspect, valid} from './phase5/b30-model.js';
import {hasExactKeys, isEvidenceContext, latestSubmissionMatches, matchesNativeEvidenceTask, sameEvidence} from './evidence-contract.js';
import {rational} from './phase5/b16-model.js';

const reviewed = [
  {
    "sessionId": "polyperim",
    "index": 1,
    "nodeId": "mt_WtcFrxGOgw",
    "type": "x-a30-outline",
    "taskHash": "92097f613b8253048d4001488489ea6ab84782e7616023a09a29e7d97c127e2f",
    "task": {
      "type": "x-a30-outline",
      "prompt": "五边形的一圈是 30 cm。先走过每条边，找问号代表的那条长度。",
      "points": [
        [
          0,
          0
        ],
        [
          10,
          0
        ],
        [
          10,
          3
        ],
        [
          6,
          6
        ],
        [
          0,
          6
        ]
      ],
      "unknown": 2,
      "answer": 5,
      "questionLabel": "未知边多长",
      "unit": "cm"
    }
  },
  {
    "sessionId": "triArea",
    "index": 0,
    "nodeId": "mt_ML5t7n2-U8",
    "type": "x-a30-pieces",
    "taskHash": "7a17ee9b9ddd64cc09fa9a37233c2330f5ef6fca8bd02acc5c624a142b21f08a",
    "task": {
      "type": "x-a30-pieces",
      "prompt": "底 8 cm、高 5 cm。把右端的小三角形移到左边，再算平行四边形。",
      "pieces": [
        {
          "name": "原来的整块",
          "points": [
            [
              0,
              0
            ],
            [
              8,
              0
            ],
            [
              10,
              5
            ],
            [
              2,
              5
            ]
          ]
        }
      ],
      "unit": "cm",
      "transform": true,
      "before": [
        {
          "points": [
            [
              0,
              0
            ],
            [
              8,
              0
            ],
            [
              8,
              5
            ],
            [
              2,
              5
            ]
          ]
        },
        {
          "points": [
            [
              8,
              0
            ],
            [
              10,
              5
            ],
            [
              8,
              5
            ]
          ]
        }
      ],
      "after": [
        {
          "points": [
            [
              0,
              0
            ],
            [
              8,
              0
            ],
            [
              8,
              5
            ],
            [
              2,
              5
            ]
          ]
        },
        {
          "points": [
            [
              0,
              0
            ],
            [
              2,
              5
            ],
            [
              0,
              5
            ]
          ]
        }
      ],
      "view": [
        -1,
        -1,
        12,
        7
      ],
      "labels": [
        {
          "x": 3,
          "y": -0.3,
          "text": "底 8"
        },
        {
          "x": 10.2,
          "y": 3,
          "text": "垂直高 5"
        }
      ]
    }
  },
  {
    "sessionId": "triArea",
    "index": 1,
    "nodeId": "mt_ML5t7n2-U8",
    "type": "x-a30-pieces",
    "taskHash": "4c251647ce099b40fab52372a2cd36cc3bfb39008133ae3186be5cb41e405460",
    "task": {
      "type": "x-a30-pieces",
      "prompt": "底 6 cm、高 4 cm。复制并转动一块，看看两个三角形怎样拼。",
      "pieces": [
        {
          "name": "一个三角形",
          "points": [
            [
              0,
              0
            ],
            [
              6,
              0
            ],
            [
              0,
              4
            ]
          ]
        }
      ],
      "unit": "cm",
      "transform": true,
      "before": [
        {
          "points": [
            [
              0,
              0
            ],
            [
              6,
              0
            ],
            [
              0,
              4
            ]
          ]
        }
      ],
      "after": [
        {
          "points": [
            [
              0,
              0
            ],
            [
              6,
              0
            ],
            [
              0,
              4
            ]
          ]
        },
        {
          "points": [
            [
              6,
              0
            ],
            [
              6,
              4
            ],
            [
              0,
              4
            ]
          ]
        }
      ],
      "view": [
        -1,
        -1,
        9,
        7
      ],
      "labels": [
        {
          "x": 2,
          "y": -0.3,
          "text": "底 6"
        },
        {
          "x": 6.2,
          "y": 2,
          "text": "高 4"
        }
      ]
    }
  },
  {
    "sessionId": "triArea",
    "index": 2,
    "nodeId": "mt_ML5t7n2-U8",
    "type": "x-a30-pieces",
    "taskHash": "9a3a89d8e0547c2a7e48891b90d96640868f1f7fada2fe914568e503f309fc4d",
    "task": {
      "type": "x-a30-pieces",
      "prompt": "底 12 cm、高 7 cm。这个三角形的高落在外面，复制一块看看。",
      "pieces": [
        {
          "name": "一个三角形",
          "points": [
            [
              3,
              0
            ],
            [
              15,
              0
            ],
            [
              18,
              7
            ]
          ]
        }
      ],
      "unit": "cm",
      "transform": true,
      "before": [
        {
          "points": [
            [
              3,
              0
            ],
            [
              15,
              0
            ],
            [
              18,
              7
            ]
          ]
        }
      ],
      "after": [
        {
          "points": [
            [
              3,
              0
            ],
            [
              15,
              0
            ],
            [
              18,
              7
            ]
          ]
        },
        {
          "points": [
            [
              15,
              0
            ],
            [
              3,
              0
            ],
            [
              0,
              -7
            ]
          ]
        }
      ],
      "view": [
        -1,
        -8,
        20,
        17
      ],
      "lines": [
        {
          "a": [
            18,
            7
          ],
          "b": [
            18,
            0
          ]
        },
        {
          "a": [
            15,
            0
          ],
          "b": [
            18,
            0
          ]
        }
      ],
      "labels": [
        {
          "x": 7,
          "y": -0.4,
          "text": "底 12"
        },
        {
          "x": 18.2,
          "y": 4,
          "text": "高 7"
        }
      ],
      "questions": [
        {
          "label": "选面积公式时要用哪条",
          "value": "height",
          "options": [
            [
              "height",
              "垂直的高"
            ],
            [
              "slope",
              "任意斜边"
            ]
          ]
        }
      ]
    }
  },
  {
    "sessionId": "triArea",
    "index": 3,
    "nodeId": "mt_ML5t7n2-U8",
    "type": "x-a30-pieces",
    "taskHash": "57144f49f061ebf92b2707c87cf2622595d054d1f6f3eaf5c2170519df52f2f3",
    "task": {
      "type": "x-a30-pieces",
      "prompt": "底 10、高 5；斜边是 6。该用哪一段算面积？",
      "pieces": [
        {
          "name": "平行四边形",
          "points": [
            [
              0,
              0
            ],
            [
              10,
              0
            ],
            [
              13.3166247903554,
              5
            ],
            [
              3.3166247903554,
              5
            ]
          ]
        }
      ],
      "unit": "cm",
      "view": [
        -1,
        -1,
        15,
        8
      ],
      "labels": [
        {
          "x": 3,
          "y": -0.3,
          "text": "底 10"
        },
        {
          "x": 10.5,
          "y": 2,
          "text": "垂直高 5"
        }
      ],
      "questions": [
        {
          "label": "叶片形状怎样量面积",
          "value": "estimate",
          "options": [
            [
              "estimate",
              "可以用方格近似"
            ],
            [
              "formula",
              "一定直接套这个平行四边形公式"
            ]
          ]
        }
      ]
    }
  },
  {
    "sessionId": "circleArea",
    "index": 0,
    "nodeId": "mt_svFa6_mjO_",
    "type": "x-a30-circle",
    "taskHash": "d4337d22d2b3931c72f707f10c1f81173f76d0c9f39d917084c5860e02c21d4f",
    "task": {
      "type": "x-a30-circle",
      "kind": "circle",
      "prompt": "半径 3 cm。先看直径，再把圆边拉直比较；用 3.14 估一圈和面积。",
      "radius": 3,
      "unit": "cm"
    }
  },
  {
    "sessionId": "circleArea",
    "index": 1,
    "nodeId": "mt_svFa6_mjO_",
    "type": "x-a30-circle",
    "taskHash": "6cbbc5ad977abcdfd0354b495423620dff42ff4f436523f2fa1547d347a88c9b",
    "task": {
      "type": "x-a30-circle",
      "kind": "circle",
      "prompt": "直径 8 cm。换个圆，先找半径，再量边和里面。",
      "radius": 4,
      "unit": "cm",
      "given": "diameter"
    }
  }
];
export const P020_SOURCES = Object.freeze(reviewed.map(({task, ...source}) => Object.freeze(source)));
export function p020BoundaryAndAreaConstructionBinding(task, context) {
  if (!isEvidenceContext(context)) return null;
  const entry = reviewed.find(source => source.sessionId === context.sessionId && source.index === context.index);
  if (!entry || !sameEvidence(task, entry.task) || !matchesNativeEvidenceTask(task, context, entry)) return null;
  return {nodeId:entry.nodeId, kind:'p020-boundary-and-area-construction', method:null, question:"哪条是边界，哪块是面积？怎样用同一图形核对数量和单位？"};
}
export function replayP020BoundaryAndAreaConstructionEvidence(task, model, context) {
  try {
    const binding = p020BoundaryAndAreaConstructionBinding(task, context);
    if (!binding || !hasExactKeys(model, Object.keys(initial(task))) || !valid(task, model) ||
        model.issue !== '' || !model.history.length || Object.keys(model.history).length !== model.history.length) return null;
    const board = initial(task).board;
    const outline = task.type === 'x-a30-outline';
    const circle = task.type === 'x-a30-circle';
    const dimensions = [[8,5],[6,4],[12,7],[10,5]];
    const part = dimensions[context.index];
    const pieceArea = !outline && !circle ? part[0]*part[1] / ([1,2].includes(context.index)?2:1) : null;
    const exact = (text, numerator, denominator=1) => {
      const value = rational(text.trim().replace(/\s*\/\s*/g,'/'));
      return value && BigInt(value[0])*BigInt(denominator) === BigInt(numerator)*BigInt(value[1]);
    };
    for (const event of model.history) {
      if (!hasExactKeys(event,['a','i','f']) || !hasExactKeys(event.f,event.a==='part'?['part']:[])) return null;
      const {a,i,f} = event;
      const index = /^\d+$/.test(i) ? Number(i) : NaN;
      if (outline && a === 'edge' && index < task.points.length) {
        const pos = board.edges.indexOf(index);
        if (pos < 0) board.edges.push(index);
        else board.edges.splice(pos,1);
      } else if (circle && a === 'unroll' && i === '') {
        board.unrolled = !board.unrolled;
      } else if (!outline && !circle && a === 'transform' && i === '' && task.transform) {
        board.transformed = !board.transformed;
      } else if (!outline && !circle && a === 'active' && index === 0) {
        board.active = index;
      } else if (!outline && !circle && a === 'part' && i === '') {
        board.first.part0 ??= f.part;
        if (exact(f.part,pieceArea)) board.values[0] = pieceArea;
        else board.bad = true;
      } else return null;
    }
    if (!sameEvidence(board,model.board) || !inspect(task,model).correct) return null;
    if (outline) {
      const missing = 30 - (10+3+6+6);
      if (board.edges.length !== 5 || !exact(model.answer,missing) || model.unit !== 'cm') return null;
      return {binding, missing, perimeter:30};
    }
    if (circle) {
      const radius = task.radius;
      const diameter = 2*radius, circumference100 = 314*diameter, area100 = 314*radius*radius;
      if (!board.unrolled || !exact(model.radius,radius) || !exact(model.diameter,diameter) ||
          !exact(model.perimeter,circumference100,100) || !exact(model.area,area100,100) ||
          model.unit !== 'cm' || model.areaUnit !== 'cm²') return null;
      return {binding, radius, diameter, circumference:circumference100/100, area:area100/100};
    }
    if (board.values[0] !== pieceArea || !exact(model.area,pieceArea) || model.unit !== 'cm²' || (task.transform && !board.transformed) ||
        (context.index === 2 && model.answers[0] !== 'height') || (context.index === 3 && model.answers[0] !== 'estimate')) return null;
    return {binding, area:pieceArea, transformed:board.transformed};

  } catch {
    return null;
  }
}
export function submittedP020BoundaryAndAreaConstructionEvidence(task, model, record, context) {
  return latestSubmissionMatches(model, record) ? replayP020BoundaryAndAreaConstructionEvidence(task, model, context) : null;
}
