import {initial, inspect, valid} from './phase5/b22-model.js';
import {hasExactKeys, isEvidenceContext, latestSubmissionMatches, matchesNativeEvidenceTask, sameEvidence} from './evidence-contract.js';
import {rational} from './phase5/b16-model.js';

const reviewed = [
  {
    "sessionId": "chancetree",
    "index": 0,
    "nodeId": "mt_GDtFU5fyUv",
    "type": "x-p22-grid",
    "taskHash": "b62efe9a7936c5b6b86bf2e7a167efba8c87cdab527b4c45d2d1a90fb6d5bd60",
    "task": {
      "type": "x-p22-grid",
      "prompt": "两个公平骰子依次掷出。逐行搭出36个有顺序的结果，圈出总和为7的格子。",
      "rows": [
        1,
        2,
        3,
        4,
        5,
        6
      ],
      "cols": [
        1,
        2,
        3,
        4,
        5,
        6
      ],
      "winners": [
        5,
        10,
        15,
        20,
        25,
        30
      ],
      "questions": [
        {
          "label": "总共多少个有顺序的结果",
          "value": 36
        },
        {
          "label": "总和为7有几种",
          "value": 6
        },
        {
          "label": "总和为7的概率",
          "value": "1/6"
        }
      ]
    }
  },
  {
    "sessionId": "chancetree",
    "index": 2,
    "nodeId": "mt_GDtFU5fyUv",
    "type": "x-p22-grid",
    "taskHash": "6bd01ab993de1b3784974385cb0da7cb3cbf318c1679f1483650d908a0728682",
    "task": {
      "type": "x-p22-grid",
      "prompt": "换成两种帽子与三种围巾。逐行列出所有搭配，圈出红帽配任意围巾。",
      "rows": [
        "红帽",
        "蓝帽"
      ],
      "cols": [
        "白巾",
        "绿巾",
        "黄巾"
      ],
      "winners": [
        0,
        1,
        2
      ],
      "questions": [
        {
          "label": "所有搭配几种",
          "value": 6
        },
        {
          "label": "红帽搭配几种",
          "value": 3
        },
        {
          "label": "红帽的比例",
          "value": "1/2"
        }
      ]
    }
  },
  {
    "sessionId": "chancesets",
    "index": 1,
    "nodeId": "mt_1YwOCMMwD8",
    "type": "x-p22-grid",
    "taskHash": "ea6abe02d9b3ec0a62ed77bf4b1a8ec74a999997de5e3dabe3d2f50b4b63ca88",
    "task": {
      "type": "x-p22-grid",
      "prompt": "两种帽子与三种围巾，逐行搭出所有不同搭配，不漏也不重复。",
      "rows": [
        "红帽",
        "蓝帽"
      ],
      "cols": [
        "白巾",
        "绿巾",
        "黄巾"
      ],
      "winners": [
        0,
        1,
        2
      ],
      "questions": [
        {
          "label": "一共几种搭配",
          "value": 6
        },
        {
          "label": "红帽搭配的比例",
          "value": "1/2"
        }
      ]
    }
  }
];
export const P035_SOURCES = Object.freeze(reviewed.map(({task, ...source}) => Object.freeze(source)));
export function p035OrderedPairGridBinding(task, context) {
  if (!isEvidenceContext(context)) return null;
  const entry = reviewed.find(source => source.sessionId === context.sessionId && source.index === context.index);
  if (!entry || !sameEvidence(task, entry.task) || !matchesNativeEvidenceTask(task, context, entry)) return null;
  return {nodeId:entry.nodeId, kind:'p035-ordered-pair-grid', method:null, question:"先列全每一行，哪些有顺序的结果符合这次条件？"};
}
export function replayP035OrderedPairGridEvidence(task, model, context) {
  try {
    const binding = p035OrderedPairGridBinding(task, context);
    if (!binding || !hasExactKeys(model, Object.keys(initial(task))) || !valid(task, model) ||
        model.issue !== '' || !model.history.length || Object.keys(model.history).length !== model.history.length) return null;
    const dice = typeof task.rows[0] === 'number';
    const total = task.rows.length * task.cols.length;
    const winners = task.rows.flatMap((row, i) => task.cols.flatMap((col, j) =>
      (dice ? row + col === 7 : row === '红帽') ? [i * task.cols.length + j] : []
    ));
    const rows = new Set(), selected = new Set(), first = {};
    for (const event of model.history) {
      if (!hasExactKeys(event,['a','f','d']) || !hasExactKeys(event.f,[])) return null;
      first[event.a + '-0'] ??= {};
      if (event.a === 'reset' && hasExactKeys(event.d,[])) {
        rows.clear();
        selected.clear();
        continue;
      }
      if (!hasExactKeys(event.d,['index']) || !/^\d+$/.test(event.d.index)) return null;
      const index = Number(event.d.index);
      if (event.a === 'row' && index < task.rows.length) rows.add(index);
      else if (event.a === 'toggle' && index < total && rows.has(Math.floor(index/task.cols.length))) {
        if (!selected.delete(index)) selected.add(index);
      } else return null;
    }
    const exact = (raw,n,d=1) => {
      const value = rational(raw.trim().replace(/\s*\/\s*/g,'/'));
      return value && BigInt(value[0])*BigInt(d) === BigInt(n)*BigInt(value[1]);
    };
    const proportion = [winners.length,total];
    const answers = task.questions.length === 3
      ? [[total,1],[winners.length,1],proportion] : [[total,1],proportion];
    if (rows.size !== task.rows.length || !sameEvidence([...selected].sort((a,b) => a-b), winners) ||
        !exact(model.prob, ...proportion) || !answers.every(([n,d],i) => exact(model.answers[i],n,d)) ||
        !sameEvidence({first,cursor:0,rows:[...rows],selected:[...selected]},model.board) || !inspect(task,model).correct) return null;
    return {binding, total, winners, proportion};

  } catch {
    return null;
  }
}
export function submittedP035OrderedPairGridEvidence(task, model, record, context) {
  return latestSubmissionMatches(model, record) ? replayP035OrderedPairGridEvidence(task, model, context) : null;
}
