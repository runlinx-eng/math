import {initial, inspect, valid} from './phase5/b20-model.js';
import {hasExactKeys, isEvidenceContext, latestSubmissionMatches, matchesNativeEvidenceTask, sameEvidence} from './evidence-contract.js';

const reviewed = [
  {
    "sessionId": "displaychoices",
    "index": 0,
    "nodeId": "mt_TiFjjvBMaY",
    "type": "x-graphcompare",
    "taskHash": "932e942b133df484987930638e3ab05a4dbcb66123f1c267e81f9f1fda617465",
    "task": {
      "type": "x-graphcompare",
      "prompt": "同样的12、9、6票，换成柱图和图画。先看图例，再判断哪种更方便回答你的问题。",
      "labels": [
        "苹果",
        "香蕉",
        "梨"
      ],
      "a": [
        12,
        9,
        6
      ],
      "b": null,
      "questions": [
        {
          "label": "苹果比香蕉多几票",
          "value": 3
        }
      ],
      "mode": "represent",
      "unit": "票",
      "scale": 3
    }
  },
  {
    "sessionId": "displaychoices",
    "index": 2,
    "nodeId": "mt_TiFjjvBMaY",
    "type": "x-graphcompare",
    "taskHash": "af564525403f922ca00137af9952561bd4c29a2deb5e459be928e8b90bb750ef",
    "task": {
      "type": "x-graphcompare",
      "prompt": "两组各6人的身高。用同一把尺看整组，别只比较最高的人。",
      "labels": [
        "甲组",
        "乙组"
      ],
      "a": [
        140,
        142,
        144,
        146,
        148,
        150
      ],
      "b": [
        140,
        145,
        150,
        155,
        160,
        165
      ],
      "questions": [
        {
          "label": "甲组最高与最低相差多少厘米",
          "value": 10
        },
        {
          "label": "乙组最高与最低相差多少厘米",
          "value": 25
        },
        {
          "label": "哪组范围更大",
          "value": [
            "b"
          ],
          "options": [
            [
              "a",
              "甲组"
            ],
            [
              "b",
              "乙组"
            ]
          ]
        }
      ],
      "mode": "distributions",
      "unit": "厘米"
    }
  },
  {
    "sessionId": "scattercraft",
    "index": 0,
    "nodeId": "mt_BdAeZJUOir",
    "type": "x-scatterbuild",
    "taskHash": "68f123d92ab56e0fa3408b368a9f7a7863de0b2f2da93d9b5615d7b994857a42",
    "task": {
      "type": "x-scatterbuild",
      "prompt": "十份记录，每份把气温和销量配成一个点。放好后手调一条趋势线，再用它估计20℃时的销量。",
      "points": [
        [
          10,
          12
        ],
        [
          12,
          16
        ],
        [
          14,
          15
        ],
        [
          16,
          20
        ],
        [
          18,
          20
        ],
        [
          20,
          24
        ],
        [
          22,
          23
        ],
        [
          24,
          28
        ],
        [
          26,
          27
        ],
        [
          28,
          32
        ]
      ],
      "xDomain": [
        10,
        30
      ],
      "yDomain": [
        0,
        40
      ],
      "xlabel": "气温（℃）",
      "ylabel": "冰淇淋销量（份）",
      "xTicks": [
        2,
        5
      ],
      "yTicks": [
        5,
        10
      ],
      "trend": "positive",
      "predict": 20,
      "fit": [
        12,
        32
      ]
    }
  },
  {
    "sessionId": "scattercraft",
    "index": 1,
    "nodeId": "mt_BdAeZJUOir",
    "type": "x-scatterbuild",
    "taskHash": "eb1109f641c5b0d708ad823cfc3fec4c7aa40f3c7a7db6493f07e52363f85c7f",
    "task": {
      "type": "x-scatterbuild",
      "prompt": "另一份模拟数据有向下的趋势。画线并估计范围内的值；向下也能是一种联系。",
      "points": [
        [
          10,
          32
        ],
        [
          12,
          27
        ],
        [
          14,
          28
        ],
        [
          16,
          23
        ],
        [
          18,
          23
        ],
        [
          20,
          19
        ],
        [
          22,
          18
        ],
        [
          24,
          17
        ],
        [
          26,
          13
        ],
        [
          28,
          12
        ]
      ],
      "xDomain": [
        10,
        30
      ],
      "yDomain": [
        0,
        40
      ],
      "xlabel": "室外气温（℃）",
      "ylabel": "热饮销量（份）",
      "xTicks": [
        2,
        5
      ],
      "yTicks": [
        5,
        10
      ],
      "trend": "negative",
      "predict": 20,
      "fit": [
        32,
        10
      ]
    }
  },
  {
    "sessionId": "scattercraft",
    "index": 2,
    "nodeId": "mt_BdAeZJUOir",
    "type": "x-scatterbuild",
    "taskHash": "d529d7176978c6dc94d5e9748be31df338f1a378383b8fb33c2f0fdf2c11774a",
    "task": {
      "type": "x-scatterbuild",
      "prompt": "这次只用观察范围内的趋势估计。30℃以外的预测为什么需要更谨慎？",
      "points": [
        [
          10,
          12
        ],
        [
          12,
          16
        ],
        [
          14,
          15
        ],
        [
          16,
          20
        ],
        [
          18,
          20
        ],
        [
          20,
          24
        ],
        [
          22,
          23
        ],
        [
          24,
          28
        ],
        [
          26,
          27
        ],
        [
          28,
          32
        ]
      ],
      "xDomain": [
        10,
        30
      ],
      "yDomain": [
        0,
        40
      ],
      "xlabel": "气温（℃）",
      "ylabel": "冰淇淋销量（份）",
      "xTicks": [
        2,
        5
      ],
      "yTicks": [
        5,
        10
      ],
      "trend": "positive",
      "predict": 20,
      "fit": [
        12,
        32
      ],
      "outside": 36
    }
  },
  {
    "sessionId": "scattermeaning",
    "index": 0,
    "nodeId": "mt_8atyuvPUZc",
    "type": "x-scatterbuild",
    "taskHash": "699f4f74d4c8f6616bdc82e022bbca68b02833571663fe62a34ebd620966725a",
    "task": {
      "type": "x-scatterbuild",
      "prompt": "天气更暖时，点大体往哪边走？先落点，再用自己的直线估计中间的销量。",
      "points": [
        [
          10,
          12
        ],
        [
          12,
          16
        ],
        [
          14,
          15
        ],
        [
          16,
          20
        ],
        [
          18,
          20
        ],
        [
          20,
          24
        ]
      ],
      "xDomain": [
        10,
        22
      ],
      "yDomain": [
        0,
        40
      ],
      "xlabel": "气温（℃）",
      "ylabel": "冰淇淋销量（份）",
      "xTicks": [
        2,
        5
      ],
      "yTicks": [
        5,
        10
      ],
      "trend": "positive",
      "predict": 16,
      "fit": [
        12,
        24
      ]
    }
  },
  {
    "sessionId": "scattermeaning",
    "index": 1,
    "nodeId": "mt_8atyuvPUZc",
    "type": "x-scatterbuild",
    "taskHash": "7d60fb9d6f9db18753b60c611cc9d2bb22c93f39fb4244528f8b73e466cf5001",
    "task": {
      "type": "x-scatterbuild",
      "prompt": "热饮记录随气温往下走。把向下趋势与没有明显趋势分开。",
      "points": [
        [
          10,
          30
        ],
        [
          12,
          27
        ],
        [
          14,
          25
        ],
        [
          16,
          22
        ],
        [
          18,
          19
        ],
        [
          20,
          18
        ]
      ],
      "xDomain": [
        10,
        22
      ],
      "yDomain": [
        0,
        40
      ],
      "xlabel": "气温（℃）",
      "ylabel": "热饮销量（份）",
      "xTicks": [
        2,
        5
      ],
      "yTicks": [
        5,
        10
      ],
      "trend": "negative",
      "predict": 16,
      "fit": [
        30,
        15
      ]
    }
  },
  {
    "sessionId": "scattermeaning",
    "index": 2,
    "nodeId": "mt_8atyuvPUZc",
    "type": "x-scatterbuild",
    "taskHash": "67935eaa9a16158027b4fa185026193ead0c8670fd48f3ed3b72ccda4f5b5124",
    "task": {
      "type": "x-scatterbuild",
      "prompt": "每个点是同一位模拟参与者的鞋码分组编号与随机卡片数。这组点没有明显直线趋势，就不要硬加一条预测线。",
      "points": [
        [
          1,
          2
        ],
        [
          2,
          8
        ],
        [
          3,
          5
        ],
        [
          4,
          5
        ],
        [
          5,
          8
        ],
        [
          6,
          2
        ]
      ],
      "xDomain": [
        0,
        7
      ],
      "yDomain": [
        0,
        10
      ],
      "xlabel": "鞋码分组编号",
      "ylabel": "随机卡片数",
      "xTicks": [
        1
      ],
      "yTicks": [
        1,
        2
      ],
      "trend": "none",
      "predict": null,
      "fit": [
        12,
        32
      ]
    }
  },
  {
    "sessionId": "scattermeaning",
    "index": 3,
    "nodeId": "mt_8atyuvPUZc",
    "type": "x-correlationlab",
    "taskHash": "87ea399e8a7f8edd41b4484c8fed62386d9c40b3f837fed527b96246e9655b5d",
    "task": {
      "type": "x-correlationlab",
      "prompt": "在这个说明模型里，天气同时改变冰淇淋销量和泳池人数。先猜一猜，再改变天气；另外试试把纵轴数值翻倍，会不会让点更贴线。",
      "points": [
        [
          10,
          12
        ],
        [
          12,
          16
        ],
        [
          14,
          15
        ],
        [
          16,
          20
        ],
        [
          18,
          20
        ],
        [
          20,
          24
        ],
        [
          22,
          23
        ],
        [
          24,
          28
        ],
        [
          26,
          27
        ],
        [
          28,
          32
        ]
      ],
      "xDomain": [
        10,
        30
      ],
      "yDomain": [
        0,
        80
      ]
    }
  },
  {
    "sessionId": "statwords",
    "index": 2,
    "nodeId": "mt_fmm-P17Vka",
    "type": "x-scatterbuild",
    "taskHash": "66205ef625107d8a4be2b73c8120bc2862e998104c8d274b691de927fa99f56d",
    "task": {
      "type": "x-scatterbuild",
      "prompt": "把一对对记录落在图上，描述一起变化的方向，再画一条概括趋势的线；这还不能证明因果。",
      "points": [
        [
          10,
          12
        ],
        [
          12,
          16
        ],
        [
          14,
          15
        ],
        [
          16,
          20
        ],
        [
          18,
          20
        ],
        [
          20,
          24
        ]
      ],
      "xDomain": [
        10,
        22
      ],
      "yDomain": [
        0,
        40
      ],
      "xlabel": "气温（℃）",
      "ylabel": "冰淇淋销量（份）",
      "xTicks": [
        2,
        5
      ],
      "yTicks": [
        5,
        10
      ],
      "trend": "positive",
      "predict": 16,
      "fit": [
        12,
        24
      ]
    }
  }
];
export const P023_SOURCES = Object.freeze(reviewed.map(({task, ...source}) => Object.freeze(source)));
export function p023GraphInterpretationBinding(task, context) {
  if (!isEvidenceContext(context)) return null;
  const entry = reviewed.find(source => source.sessionId === context.sessionId && source.index === context.index);
  if (!entry || !sameEvidence(task, entry.task) || !matchesNativeEvidenceTask(task, context, entry)) return null;
  return {nodeId:entry.nodeId, kind:'p023-graph-interpretation', method:null, question:"图例、横纵轴和点云怎样限制我们能说出的结论？"};
}
export function replayP023GraphInterpretationEvidence(task, model, context) {
  try {
    const binding = p023GraphInterpretationBinding(task, context);
    if (!binding || !hasExactKeys(model, Object.keys(initial(task))) || !valid(task, model) ||
        model.issue !== '' || !model.history.length || Object.keys(model.history).length !== model.history.length) return null;
    const start = initial(task);
    let board = start.board;
    const fields = Object.keys(start).filter(key => !['board','history','issue'].includes(key));
    const scatter = task.type === 'x-scatterbuild';
    const compare = task.type === 'x-graphcompare';
    const inRange = (value,limits) => Number.isFinite(value) && value >= limits[0] && value <= limits[1];
    const decimal = raw => {
      const value = raw.trim();
      if (!/^-?\d+(?:\.\d+)?$/.test(value)) return NaN;
      return Number(value);
    };
    for (const event of model.history) {
      if (!hasExactKeys(event,['a','d','f']) || !hasExactKeys(event.f,fields)) return null;
      const {a,d,f} = event;
      if (!hasExactKeys(d,a==='row'?['index']:a==='view'?['kind']:[])) return null;
      if (a === 'reset') {
        board = {...initial(task).board,first:board.first};
        continue;
      }
      board.first[a+'-'+board.cursor] ??= f;
      if (scatter && a === 'row' && /^\d+$/.test(d.index) && Number(d.index) < task.points.length) {
        board.cursor = Number(d.index);
      } else if (scatter && a === 'point') {
        const x = decimal(f.x), y = decimal(f.y);
        if (!inRange(x,task.xDomain) || !inRange(y,task.yDomain)) continue;
        board.points[board.cursor] = [x,y];
        board.connected = false;
        board.line = null;
        const unset = board.points.indexOf(null);
        if (unset >= 0) board.cursor = unset;
      } else if (scatter && a === 'trend') {
        if (f.trend === 'none') board.line = null;
      } else if (scatter && a === 'line') {
        const ends = [decimal(f.left),decimal(f.right)];
        if (ends.every(value => inRange(value,task.yDomain))) board.line = ends;
      } else if (compare && a === 'view' && ['bar','picture','dot','table'].includes(d.kind)) {
        board.view = d.kind;
        if (!board.views.includes(d.kind)) board.views.push(d.kind);
      } else if (!scatter && !compare && a === 'start') {
        if (['same','stronger','unknown'].includes(f.guess)) board.started = true;
      } else if (!scatter && !compare && board.started && a === 'stretch') {
        board.scale = 3 - board.scale;
        board.scaleSeen = true;
      } else if (!scatter && !compare && board.started && a === 'tighten') {
        board.tight = !board.tight;
        board.tightSeen = true;
      } else if (!scatter && !compare && board.started && a === 'weather') {
        const temperature = decimal(f.weather);
        if ([10,20,30].includes(temperature) && !board.weather.includes(temperature)) board.weather.push(temperature);
      } else return null;
    }
    if (!sameEvidence(board,model.board) || !inspect(task,model).correct) return null;
    if (compare) {
      const represent = task.mode === 'represent';
      if (represent) {
        if (!board.views.includes('bar') || !board.views.includes('picture') ||
            !['bar:exact','picture:groups'].includes(model.best+':'+model.reason)) return null;
      } else if (board.view !== 'dot' || !board.views.includes('table') || model.reason !== 'distribution') return null;
      return {binding, views:board.views, comparison:model.reason};
    }
    if (!scatter) {
      if (!board.started || !board.scaleSeen || !board.tightSeen || board.weather.length !== 3 ||
          model.effect !== 'same' || model.strength !== 'closer' || model.causal !== 'third') return null;
      return {binding, simulated:true, observations:board.weather.map(x => [x,2*x+5,3*x])};
    }
    const points = board.points;
    if (!sameEvidence(points,task.points) || model.xaxis !== 'x' || model.yaxis !== 'y') return null;
    let pairwise = 0;
    let xVariation = 0;
    for (let i=0; i<points.length; i++) {
      for (let j=0; j<i; j++) {
        const dx = points[i][0] - points[j][0];
        pairwise += dx * (points[i][1] - points[j][1]);
        xVariation += dx * dx;
      }
    }
    const direction = pairwise === 0 ? 'none' : pairwise > 0 ? 'positive' : 'negative';
    if (model.trend !== direction) return null;
    if (direction === 'none') return board.line ? null : {binding, points, direction};

    if (!board.line || !xVariation || (task.outside && model.outside !== 'caution')) return null;
    const [left,right] = board.line;
    const [min,max] = task.xDomain;
    const estimate = x => left + (x-min)*(right-left)/(max-min);
    const prediction = decimal(model.prediction);
    if (!Number.isFinite(prediction) || Math.sign(right-left) !== Math.sign(pairwise) ||
        Math.abs(prediction-estimate(task.predict)) > 0.5) return null;
    const slopes = pairwise / xVariation;
    const intercept = points.reduce((sum,[x,y]) => sum + y-slopes*x,0)/points.length;
    const optimum = points.reduce((sum,[x,y]) => sum + (y-intercept-slopes*x)**2,0);
    const residuals = points.map(([x,y]) => y-estimate(x));
    const deviation = residuals.reduce((sum, value) => sum + value**2,0);
    const above = residuals.filter(value => value > 0.75).length;
    const below = residuals.filter(value => value < -0.75).length;
    if (deviation > Math.max(3*optimum,4*points.length) || Math.abs(above-below) > Math.ceil(0.6*points.length)) return null;
    return {binding, points, direction, prediction, line:board.line};

  } catch {
    return null;
  }
}
export function submittedP023GraphInterpretationEvidence(task, model, record, context) {
  return latestSubmissionMatches(model, record) ? replayP023GraphInterpretationEvidence(task, model, context) : null;
}
