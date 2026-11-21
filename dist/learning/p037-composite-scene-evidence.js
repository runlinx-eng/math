import {initial, inspect, valid} from './phase5/b23-model.js';
import {hasExactKeys, isEvidenceContext, latestSubmissionMatches, matchesNativeEvidenceTask, sameEvidence} from './evidence-contract.js';

const reviewed = [
  {
    "sessionId": "shapepieces",
    "index": 2,
    "nodeId": "mt_XjwUlmxdCT",
    "type": "x-s23-scene",
    "taskHash": "0c249668b09b690336231ed9caf157ca16bf8ed45b9e0dac4599c057836c7aea",
    "task": {
      "type": "x-s23-scene",
      "prompt": "用矩形、三角形和斜坡拼一个简化游乐滑梯。",
      "sceneType": "slide",
      "slots": [
        "rectangle",
        "triangle",
        "slope"
      ],
      "questions": [
        {
          "label": "拼图中的形状",
          "value": "parts",
          "options": [
            [
              "parts",
              "分别表示平台、支撑与滑面"
            ],
            [
              "one",
              "它们是一整块没有组成部分"
            ]
          ]
        }
      ]
    }
  },
  {
    "sessionId": "shapeapprox",
    "index": 0,
    "nodeId": "mt_SK7WntVZ6y",
    "type": "x-s23-scene",
    "taskHash": "c13f314c5c6b28b4f17e3e0fc31a75393177dddd7c1a420926743cc2ee4daffa",
    "task": {
      "type": "x-s23-scene",
      "prompt": "用两个形状拼出房身和屋顶，做一间简化小屋。",
      "sceneType": "house",
      "slots": [
        "cuboid",
        "roof"
      ],
      "questions": [
        {
          "label": "小屋可以近似看作",
          "value": "parts",
          "options": [
            [
              "parts",
              "长方体加三棱柱屋顶"
            ],
            [
              "sphere",
              "一个完整的球"
            ]
          ]
        }
      ]
    }
  },
  {
    "sessionId": "shapeapprox",
    "index": 1,
    "nodeId": "mt_SK7WntVZ6y",
    "type": "x-s23-scene",
    "taskHash": "796c07b5701c1e61bffab36f8b5802d1e34f9dd4c155ddaae8ef516dd16da8b0",
    "task": {
      "type": "x-s23-scene",
      "prompt": "用平台、支撑和斜面拼一架简化滑梯。",
      "sceneType": "slide",
      "slots": [
        "rectangle",
        "triangle",
        "slope"
      ],
      "questions": [
        {
          "label": "拼好的图",
          "value": "approx",
          "options": [
            [
              "approx",
              "是抓住主要结构的近似图"
            ],
            [
              "exact",
              "就是现实中的全部细节"
            ]
          ]
        }
      ]
    }
  }
];
export const P037_SOURCES = Object.freeze(reviewed.map(({task, ...source}) => Object.freeze(source)));
export function p037CompositeSceneBinding(task, context) {
  if (!isEvidenceContext(context)) return null;
  const entry = reviewed.find(source => source.sessionId === context.sessionId && source.index === context.index);
  if (!entry || !sameEvidence(task, entry.task) || !matchesNativeEvidenceTask(task, context, entry)) return null;
  return {nodeId:entry.nodeId, kind:'p037-composite-scene', method:null, question:"模型的每一块分别对应现实物体的哪一部分？"};
}
export function replayP037CompositeSceneEvidence(task, model, context) {
  try {
    const binding = p037CompositeSceneBinding(task, context);
    if (!binding || !hasExactKeys(model, Object.keys(initial(task))) || !valid(task, model) ||
        model.issue !== '' || !model.history.length || Object.keys(model.history).length !== model.history.length) return null;
    const expected = task.sceneType === 'house' ? ['cuboid','roof'] : ['rectangle','triangle','slope'];
    const answer = context.sessionId === 'shapeapprox' && context.index === 1 ? 'approx' : 'parts';
    let slots = Array(expected.length).fill(null);
    const first = {};
    let placed = 0;
    for (const event of model.history) {
      if (!hasExactKeys(event, ['a','f','d']) || !hasExactKeys(event.d, [])) return null;
      if (event.a === 'reset' && hasExactKeys(event.f, [])) {
        first.reset ??= {};
        slots = Array(expected.length).fill(null);
        placed = 0;
      } else if (event.a === 'scene' && hasExactKeys(event.f, ['choice','slot'])) {
        first.scene ??= event.f;
        const index = /^\d+$/.test(event.f.slot.trim()) ? Number(event.f.slot) : NaN;
        if (index < slots.length && ['cuboid','roof','rectangle','triangle','slope'].includes(event.f.choice)) {
          slots[index] = event.f.choice;
          placed++;
        }
      } else return null;
    }
    if (placed < slots.length || !sameEvidence(slots,expected) || model.answers[0] !== answer ||
        !sameEvidence({first,slots},model.board) || !inspect(task,model).correct) return null;
    return {binding, pieces:slots, modelMeaning:answer};

  } catch {
    return null;
  }
}
export function submittedP037CompositeSceneEvidence(task, model, record, context) {
  return latestSubmissionMatches(model, record) ? replayP037CompositeSceneEvidence(task, model, context) : null;
}
