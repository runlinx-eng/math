import {initial, inspect, valid} from './phase5/b23-model.js';
import {hasExactKeys, isEvidenceContext, latestSubmissionMatches, matchesNativeEvidenceTask, sameEvidence} from './evidence-contract.js';

const reviewed = [
  {
    "sessionId": "geometrynotation",
    "index": 0,
    "nodeId": "mt_WtIFJSCQIT",
    "type": "x-s23-notation",
    "taskHash": "e1a99c9d90fad1741cacd4793a03da424189bc38f91f8d5cf6a915b245fb5fd3",
    "task": {
      "type": "x-s23-notation",
      "prompt": "给图中的线段、以B为顶点的角、平行和垂直关系写出记号。",
      "questions": [
        {
          "label": "∠ABC中间的字母B表示",
          "value": "vertex",
          "options": [
            [
              "vertex",
              "角的顶点"
            ],
            [
              "side",
              "一条完整的边"
            ]
          ]
        }
      ]
    }
  },
  {
    "sessionId": "angleparts",
    "index": 1,
    "nodeId": "mt_3S10OOGPqu",
    "type": "x-s23-notation",
    "taskHash": "e1a99c9d90fad1741cacd4793a03da424189bc38f91f8d5cf6a915b245fb5fd3",
    "task": {
      "type": "x-s23-notation",
      "prompt": "给图中的线段、以B为顶点的角、平行和垂直关系写出记号。",
      "questions": [
        {
          "label": "∠ABC中间的字母B表示",
          "value": "vertex",
          "options": [
            [
              "vertex",
              "角的顶点"
            ],
            [
              "side",
              "一条完整的边"
            ]
          ]
        }
      ]
    }
  },
  {
    "sessionId": "linenotation",
    "index": 1,
    "nodeId": "mt_e4V6hvcuEJ",
    "type": "x-s23-notation",
    "taskHash": "e1a99c9d90fad1741cacd4793a03da424189bc38f91f8d5cf6a915b245fb5fd3",
    "task": {
      "type": "x-s23-notation",
      "prompt": "给图中的线段、以B为顶点的角、平行和垂直关系写出记号。",
      "questions": [
        {
          "label": "∠ABC中间的字母B表示",
          "value": "vertex",
          "options": [
            [
              "vertex",
              "角的顶点"
            ],
            [
              "side",
              "一条完整的边"
            ]
          ]
        }
      ]
    }
  }
];
export const P036_SOURCES = Object.freeze(reviewed.map(({task, ...source}) => Object.freeze(source)));
export function p036GeometryNotationBinding(task, context) {
  if (!isEvidenceContext(context)) return null;
  const entry = reviewed.find(source => source.sessionId === context.sessionId && source.index === context.index);
  if (!entry || !sameEvidence(task, entry.task) || !matchesNativeEvidenceTask(task, context, entry)) return null;
  return {nodeId:entry.nodeId, kind:'p036-geometry-notation', method:null, question:"点 B 为什么必须写在角名的中间？"};
}
export function replayP036GeometryNotationEvidence(task, model, context) {
  try {
    const binding = p036GeometryNotationBinding(task, context);
    if (!binding || !hasExactKeys(model, Object.keys(initial(task))) || !valid(task, model) ||
        model.issue !== '' || !model.history.length || Object.keys(model.history).length !== model.history.length) return null;
    const keys = ['segment','angleName','parallelName','perpName'];
    const first = {};
    let saved = null;
    for (const event of model.history) {
      if (!hasExactKeys(event, ['a','f','d']) || !hasExactKeys(event.d, [])) return null;
      if (event.a === 'label' && hasExactKeys(event.f, keys)) {
        first.label ??= event.f;
        saved = event.f;
      } else if (event.a === 'reset' && hasExactKeys(event.f, [])) {
        first.reset ??= {};
        saved = null;
      } else return null;
    }
    if (!saved || keys.some(key => saved[key] !== model[key])) return null;
    const word = raw => raw.toUpperCase().replace(/\s/g, '');
    const segment = raw => /^[A-Z]{2}$/.test(raw) ? [...raw].sort().join('') : '';
    const relation = (raw, separator) => {
      const names = word(raw).split(separator);
      return names.length === 2 ? names.map(segment).sort().join(':') : '';
    };
    if (segment(word(saved.segment)) !== 'AB' || !['ABC','CBA'].includes(word(saved.angleName).replace(/^∠/, '')) ||
        relation(saved.parallelName, /∥|\/\//) !== 'AB:CD' || relation(saved.perpName, '⊥') !== 'AB:BC' ||
        model.answers[0] !== 'vertex' || !sameEvidence({first,saved},model.board) || !inspect(task,model).correct) return null;
    return {binding, vertex:'B', segment:'AB', parallel:['AB','CD'], perpendicular:['AB','BC']};

  } catch {
    return null;
  }
}
export function submittedP036GeometryNotationEvidence(task, model, record, context) {
  return latestSubmissionMatches(model, record) ? replayP036GeometryNotationEvidence(task, model, context) : null;
}
