import {initial, inspect, valid} from './phase5/b26-model.js';
import {hasExactKeys, isEvidenceContext, latestSubmissionMatches, matchesNativeEvidenceTask, sameEvidence} from './evidence-contract.js';
import {rational} from './phase5/b16-model.js';

const reviewed = [
  {
    "sessionId": "trigbasics",
    "index": 0,
    "nodeId": "mt_KB_Czd7RQH",
    "type": "x-g26-trig",
    "taskHash": "df871c3519540248c268a5d2172bd4d1a17651a9873fcfaa3d54d98f0b3ffda2",
    "task": {
      "type": "x-g26-trig",
      "prompt": "先从B角看，给三条边取名字；再从C角看，重新取名字。",
      "mode": "roles",
      "questions": [
        {
          "label": "换一个锐角看",
          "value": "swap",
          "options": [
            [
              "swap",
              "对边和邻边交换，斜边不变"
            ],
            [
              "same",
              "三条边的名字都不变"
            ]
          ]
        }
      ],
      "a": 4,
      "b": 3
    }
  },
  {
    "sessionId": "trigbasics",
    "index": 1,
    "nodeId": "mt_KB_Czd7RQH",
    "type": "x-g26-trig",
    "taskHash": "59c8d80070ebbc7a99fd17371d3d319ef784175391595761841d65a69539938d",
    "task": {
      "type": "x-g26-trig",
      "prompt": "从B角看，记下对边÷斜边；再把三角形放大两倍，比较比例。",
      "mode": "compare",
      "questions": [
        {
          "label": "原大小时对边÷斜边",
          "value": 0.6
        },
        {
          "label": "放大两倍之后",
          "value": "same",
          "options": [
            [
              "same",
              "比例仍然是0.6"
            ],
            [
              "double",
              "比例变成1.2"
            ]
          ]
        }
      ],
      "a": 4,
      "b": 3
    }
  },
  {
    "sessionId": "trigbasics",
    "index": 2,
    "nodeId": "mt_KB_Czd7RQH",
    "type": "x-g26-trig",
    "taskHash": "7ff827920ad23f4d46b0aca6fe3ce8e4d6c765a1b30a9ad3e4013e62bef5a2b7",
    "task": {
      "type": "x-g26-trig",
      "prompt": "从B角看：角是35°，斜边长10。选择关系，求对边；结果保留两位小数。",
      "mode": "solve",
      "questions": [
        {
          "label": "求出的对边",
          "value": "shorter",
          "options": [
            [
              "shorter",
              "比斜边10短"
            ],
            [
              "longer",
              "比斜边10长"
            ]
          ]
        }
      ],
      "angle": 35,
      "hyp": 10,
      "unknown": "opp",
      "ratio": "sin",
      "tolerance": 0.02
    }
  },
  {
    "sessionId": "trigbasics",
    "index": 3,
    "nodeId": "mt_KB_Czd7RQH",
    "type": "x-g26-trig",
    "taskHash": "3fd921600bf05be8aa5a909bfc29e6ea8efcec829a1e13b3d5640a7f823b1513",
    "task": {
      "type": "x-g26-trig",
      "prompt": "从B角看：角是60°，斜边长10。选择关系，求邻边。",
      "mode": "solve",
      "questions": [
        {
          "label": "选用的两条边",
          "value": "adj-hyp",
          "options": [
            [
              "adj-hyp",
              "邻边和斜边"
            ],
            [
              "opp-adj",
              "对边和邻边"
            ]
          ]
        }
      ],
      "angle": 60,
      "hyp": 10,
      "unknown": "adj",
      "ratio": "cos",
      "tolerance": 0.02,
      "rotation": 30
    }
  },
  {
    "sessionId": "trigbasics",
    "index": 4,
    "nodeId": "mt_KB_Czd7RQH",
    "type": "x-g26-trig",
    "taskHash": "3ad3bc42da91ea44046419f9810256a6871011f98dbc97556965626361548180",
    "task": {
      "type": "x-g26-trig",
      "prompt": "从B角看：对边长3、邻边长4。先找比例，再反过来求这个角，保留一位小数。",
      "mode": "inverse",
      "questions": [
        {
          "label": "求出的角",
          "value": "acute",
          "options": [
            [
              "acute",
              "在0°和90°之间"
            ],
            [
              "obtuse",
              "大于180°"
            ]
          ]
        }
      ],
      "a": 4,
      "b": 3,
      "ratio": "tan",
      "tolerance": 0.1,
      "rotation": 150
    }
  }
];
export const P028_SOURCES = Object.freeze(reviewed.map(({task, ...source}) => Object.freeze(source)));
export function p028TrigRolesAndRatiosBinding(task, context) {
  if (!isEvidenceContext(context)) return null;
  const entry = reviewed.find(source => source.sessionId === context.sessionId && source.index === context.index);
  if (!entry || !sameEvidence(task, entry.task) || !matchesNativeEvidenceTask(task, context, entry)) return null;
  return {nodeId:entry.nodeId, kind:'p028-trig-roles-and-ratios', method:null, question:"换观察角后哪些边的角色会交换？选择的比例怎样连接已知和未知？"};
}
export function replayP028TrigRolesAndRatiosEvidence(task, model, context) {
  try {
    const binding = p028TrigRolesAndRatiosBinding(task, context);
    if (!binding || !hasExactKeys(model, Object.keys(initial(task))) || !valid(task, model) ||
        model.issue !== '' || !model.history.length || Object.keys(model.history).length !== model.history.length) return null;
    const labels = ['hyp','opp','adj'];
    const expectedRoles = {1:{hyp:1,opp:2,adj:0},2:{hyp:1,opp:0,adj:2}};
    const toRadians = degrees => degrees * Math.PI / 180;
    const toDegrees = radians => radians * 180 / Math.PI;
    const exactNumber = raw => {
      const value = rational(raw.trim());
      return value ? value[0] / value[1] : NaN;
    };
    const choice = task.mode === 'inverse' ? 'tan' : task.unknown === 'opp' ? 'sin' : 'cos';
    let board = initial(task).board;
    for (const event of model.history) {
      if (!hasExactKeys(event,['a','d','f'])) return null;
      const {a,d,f} = event;
      const fields = a === 'scale' ? ['scale'] : a === 'answer' ? ['result'] : a === 'calc' ? ['calcKind','calcInput'] : [];
      const takesIndex = ['ref','edge','assign','ratio'].includes(a);
      if (!hasExactKeys(d,takesIndex?['index']:[]) || !hasExactKeys(f,fields)) return null;
      board.first[a] ??= f;
      const index = Number(d.index);
      const {ref} = board;
      const roles = board.roles[ref];
      const confirmedB = ref === 1 && board.confirmed.includes(1) && sameEvidence(roles,expectedRoles[1]);
      switch (a) {
        case 'reset':
          board = {...initial(task).board,first:board.first};
          break;
        case 'help':
          board.help = true;
          break;
        case 'edit':
          if (ref) board.editing = true;
          break;
        case 'ref':
          if (![1,2].includes(index)) return null;
          Object.assign(board,{ref:index,selected:null,editing:!board.confirmed.includes(index),ratio:null,saved:null,calculator:null});
          break;
        case 'edge':
          if (![0,1,2].includes(index)) return null;
          if (ref) Object.assign(board,{selected:index,editing:true});
          break;
        case 'assign':
          if (!labels.includes(d.index)) return null;
          if (roles && board.selected !== null) {
            for (const key of labels) if (roles[key] === board.selected) roles[key] = null;
            roles[d.index] = board.selected;
            Object.assign(board,{editing:true,confirmed:board.confirmed.filter(value => value !== ref),observations:[],ratio:null,saved:null});
          }
          break;
        case 'confirm':
          if (!ref || !sameEvidence(roles,expectedRoles[ref])) board.first.badRoles = true;
          else {
            if (!board.confirmed.includes(ref)) board.confirmed.push(ref);
            Object.assign(board,{editing:false,selected:null});
          }
          break;
        case 'scale': {
          const scale = exactNumber(f.scale);
          if ([1,2].includes(scale)) board.scale = scale;
          break;
        }
        case 'observe': {
          if (!confirmedB || board.observations.some(row => row.scale === board.scale)) break;
          const [adj,opp,hyp] = task.hyp === undefined
            ? [task.a,task.b,Math.hypot(task.a,task.b)]
            : [task.hyp*Math.cos(toRadians(task.angle)),task.hyp*Math.sin(toRadians(task.angle)),task.hyp];
          const {scale} = board;
          board.observations.push({scale,opposite:opp*scale,adjacent:adj*scale,hypotenuse:hyp*scale,ratio:opp/hyp});
          break;
        }
        case 'ratio':
          if (!['sin','cos','tan'].includes(d.index)) return null;
          if (confirmedB) {
            board.first.ratioChoice ??= d.index;
            if (board.first.ratioChoice !== task.ratio) board.first.badRatio = true;
            Object.assign(board,{ratio:d.index,saved:null,calculator:null});
          }
          break;
        case 'calc': {
          const x = exactNumber(f.calcInput);
          const r = toRadians(x);
          const output = {
            sin:Math.sin(r),cos:Math.cos(r),tan:Math.abs(Math.cos(r))<1e-10?NaN:Math.tan(r),
            asin:toDegrees(Math.asin(x)),acos:toDegrees(Math.acos(x)),atan:toDegrees(Math.atan(x)),sqrt:Math.sqrt(x),
          }[f.calcKind];
          if (board.ratio && Number.isFinite(output)) board.calculator={kind:f.calcKind,input:f.calcInput,result:output};
          break;
        }
        case 'answer':
          if (board.ratio && Number.isFinite(exactNumber(f.result))) board.saved=f;
          break;
        default: return null;
      }
    }
    const confirmed = ref => board.confirmed.includes(ref) && sameEvidence(board.roles[ref],expectedRoles[ref]);
    if (!confirmed(1) || !sameEvidence(board,model.board) || !inspect(task,model).correct) return null;
    if (task.mode === 'roles') {
      if (!confirmed(2) || model.answers[0] !== 'swap') return null;
      return {binding, roles:board.roles};
    }
    if (board.ref !== 1) return null;
    if (task.mode === 'compare') {
      const ratio = 3 / 5;
      if (![1,2].every(scale => board.observations.some(row => row.scale === scale && row.ratio === ratio)) ||
          exactNumber(model.answers[0]) !== ratio || model.answers[1] !== 'same') return null;
      return {binding, ratio, scales:board.observations.map(row => row.scale)};
    }
    const inverse = task.mode === 'inverse';
    const result = inverse
      ? toDegrees(Math.atan2(task.b,task.a))
      : task.hyp * Math[choice](toRadians(task.angle));
    const expected = Number(result.toFixed(inverse ? 1 : 2));
    const explanations = {tan:'acute',cos:'adj-hyp',sin:'shorter'};
    if (board.ratio !== choice || board.saved?.result !== model.result || exactNumber(model.result) !== expected ||
        model.answers[0] !== explanations[choice]) return null;
    return {binding, ratio:choice, result:expected};

  } catch {
    return null;
  }
}
export function submittedP028TrigRolesAndRatiosEvidence(task, model, record, context) {
  return latestSubmissionMatches(model, record) ? replayP028TrigRolesAndRatiosEvidence(task, model, context) : null;
}
