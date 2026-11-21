import {initial, inspect, number, valid} from './phase5/b24-model.js';
import {parse} from './phase5/b09-math.js';
import {
  hasExactKeys,
  latestSubmissionMatches,
  matchesNativeEvidenceTask,
  sameEvidence
} from './evidence-contract.js';

const sessionId = 'signedpoints';
const nodeId = 'mt_R4AY0LKxfl';
const type = 'x-p24-grid';
const reviewed = new Map([
  [0, {
    taskHash: '4359a26bf46975719b8a4b715eb3d88a6f50442cb4bccc2926be635778976de1',
    task: {
      "type": "x-p24-grid",
      "prompt": "从原点向左3格、向上4格，放下(−3,4)。",
      "target": [
        [
          -3,
          4
        ]
      ],
      "given": [],
      "domain": [
        -7,
        7,
        -7,
        7
      ],
      "close": false,
      "questions": [
        {
          "label": "这个点位于",
          "value": "II",
          "options": [
            [
              "II",
              "第二象限：左上"
            ],
            [
              "IV",
              "第四象限：右下"
            ]
          ]
        }
      ]
    }
  }],
  [1, {
    taskHash: '17083cda40fc9b189f4fe0966d006101052c1af46cb56e577a331c595d8e24f0',
    task: {
      "type": "x-p24-grid",
      "prompt": "再放(2,−5)。先横着找，再向下找。",
      "target": [
        [
          2,
          -5
        ]
      ],
      "given": [],
      "domain": [
        -7,
        7,
        -7,
        7
      ],
      "close": false,
      "questions": [
        {
          "label": "这个点位于",
          "value": "IV",
          "options": [
            [
              "IV",
              "第四象限：右下"
            ],
            [
              "II",
              "第二象限：左上"
            ]
          ]
        }
      ]
    }
  }],
  [2, {
    taskHash: '3fabd10a70f837dc51eaeb0745a31a00951cda9e3607d50d5162fc2dba121780',
    task: {
      "type": "x-p24-grid",
      "prompt": "把四个点放到四个方向，再把(0,3)放在轴上。",
      "target": [
        [
          2,
          2
        ],
        [
          -2,
          2
        ],
        [
          -2,
          -2
        ],
        [
          2,
          -2
        ],
        [
          0,
          3
        ]
      ],
      "given": [],
      "domain": [
        -6,
        6,
        -6,
        6
      ],
      "close": false,
      "questions": [
        {
          "label": "在轴上的点",
          "value": "axis",
          "options": [
            [
              "axis",
              "不属于任何象限"
            ],
            [
              "one",
              "属于第一象限"
            ]
          ]
        }
      ]
    }
  }]
]);

export const P115_SOURCES = Object.freeze([...reviewed].map(([index, {taskHash}]) =>
  Object.freeze({sessionId, index, nodeId, type, taskHash})
));

export function p115QuadrantBinding(task, context) {
  const source = reviewed.get(context?.index);
  if (context?.sessionId !== sessionId || !source ||
      !sameEvidence(task, source.task) || !matchesNativeEvidenceTask(task, context, {nodeId, type})) {
    return null;
  }
  return {
    nodeId,
    kind: 'p115-signedpoints-quadrants',
    method: null,
    question: '看横坐标和纵坐标的正负。各个点在哪个象限，哪个点在坐标轴上？'
  };
}

const samePoint = (a,b) => a[0] === b[0] && a[1] === b[1];

function classify([x,y]) {
  if (x === 0 || y === 0) return 'axis';
  if (y > 0) return x > 0 ? 'I' : 'II';
  return x < 0 ? 'III' : 'IV';
}

function matchesExactCoordinate(raw, expected) {
  const parts = parse(raw);
  return parts !== null && parts[0] === expected && parts[1] === 1;
}

export function replayP115QuadrantEvidence(task, model, context) {
  try {
    const binding = p115QuadrantBinding(task, context);
    if (!binding || !hasExactKeys(model, Object.keys(initial(task, 1))) || !valid(task, model) ||
        model.issue !== '' || !model.history.length ||
        Object.keys(model.history).length !== model.history.length) {
      return null;
    }

    const [xmin,xmax,ymin,ymax] = task.domain;
    const width = xmax - xmin + 1;
    const cellCount = width * (ymax - ymin + 1);
    const placed = [];
    const observableActions = [];
    for (const [eventIndex, event] of model.history.entries()) {
      if (!hasExactKeys(event, ['a', 'd', 'f'])) return null;
      if (event.a === 'undo') {
        if (!hasExactKeys(event.f, []) || !hasExactKeys(event.d, [])) return null;
        observableActions.push({eventIndex, action:'undo', removed:placed.pop() ?? null});
        continue;
      }

      let point;
      if (event.a === 'dot') {
        if (!hasExactKeys(event.f, []) || !hasExactKeys(event.d, ['index']) ||
            !/^(0|[1-9]\d*)$/.test(event.d.index)) return null;
        const cell = Number(event.d.index);
        if (!Number.isSafeInteger(cell) || cell >= cellCount) return null;
        point = [xmin + cell % width, ymin + Math.floor(cell / width)];
      } else if (event.a === 'plot') {
        if (!hasExactKeys(event.f, ['x', 'y']) || !hasExactKeys(event.d, [])) return null;
        point = [number(event.f.x), number(event.f.y)];
      } else {
        return null;
      }

      const [x,y] = point;
      const validPoint = Number.isInteger(x) && Number.isInteger(y) &&
        x >= xmin && x <= xmax && y >= ymin && y <= ymax;
      if (!validPoint || placed.length >= 16 || placed.some(existing=>samePoint(existing, point))) {
        observableActions.push({eventIndex, action:event.a, accepted:false});
        continue;
      }
      if (event.a === 'plot' &&
          (!matchesExactCoordinate(event.f.x,x) || !matchesExactCoordinate(event.f.y,y))) return null;

      placed.push(point);
      observableActions.push({eventIndex, action:event.a, accepted:true, point});
    }

    if (!sameEvidence(placed, model.board.placed) || placed.length !== task.target.length ||
        !task.target.every(target=>placed.some(point=>samePoint(point,target))) ||
        !inspect(task, model).correct) {
      return null;
    }

    const classifiedPoints = placed.map(point=>({point, kind:classify(point)}));
    const askedPoint = task.target.at(-1);
    const checkedClassification = model.answers[0];
    if (checkedClassification !== classify(askedPoint)) return null;
    return {
      kind: binding.kind,
      nodeId: binding.nodeId,
      sessionId,
      index: context.index,
      observableActions,
      classifiedPoints,
      checkedPoint: [...askedPoint],
      checkedClassification,
      coordinateInputOrderAssessed: false,
      learnerMasteryAssessed: false
    };
  } catch {
    return null;
  }
}

export function submittedP115QuadrantEvidence(task, model, record, context) {
  if (!latestSubmissionMatches(model, record)) return null;
  return replayP115QuadrantEvidence(task, model, context);
}
