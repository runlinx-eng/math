import {number} from './phase5/b20-model.js';
import {initial, inspect, valid} from './phase5/b21-model.js';
import {hasExactKeys, isEvidenceContext, latestSubmissionMatches, matchesNativeEvidenceTask, sameEvidence} from './evidence-contract.js';

const type = 'x-digitalsets';
const REVIEWED = Object.freeze([
  {
    "sessionId": "digitalsets",
    "index": 0,
    "nodeId": "mt_mn765HbXi1",
    "type": "x-digitalsets",
    "taskHash": "ecfb732d87e276cbb13e581d67df131548617486b0d780223045cbe8fda68b68",
    "task": {
      "type": "x-digitalsets",
      "mode": "nominal",
      "prompt": "两组喜欢的运动不同。按原表搭同尺并排柱图，找各组最多的运动。",
      "labels": [
        "足球",
        "游泳",
        "羽毛球"
      ],
      "a": [
        8,
        6,
        4
      ],
      "b": [
        5,
        9,
        4
      ],
      "unit": "人",
      "questions": [
        {
          "label": "甲最多",
          "value": [
            "0"
          ],
          "options": [
            [
              "0",
              "足球"
            ],
            [
              "1",
              "游泳"
            ],
            [
              "2",
              "羽毛球"
            ]
          ]
        },
        {
          "label": "乙最多",
          "value": [
            "1"
          ],
          "options": [
            [
              "0",
              "足球"
            ],
            [
              "1",
              "游泳"
            ],
            [
              "2",
              "羽毛球"
            ]
          ]
        }
      ]
    },
    "question": "为什么两组数据比较必须用同一零点和刻度，人数不同时要先换算成百分比并保持等级顺序？"
  },
  {
    "sessionId": "digitalsets",
    "index": 1,
    "nodeId": "mt_mn765HbXi1",
    "type": "x-digitalsets",
    "taskHash": "5c7e2243d37da7e32bec51e605ba7c7ffa9b2b5b95c23af71def07e144df6c8c",
    "task": {
      "type": "x-digitalsets",
      "mode": "ordinal",
      "prompt": "甲20人，乙40人。把人数换成百分比，保持从“从不”到“总是”的同一顺序，再比较。",
      "labels": [
        "从不",
        "有时",
        "经常",
        "总是"
      ],
      "a": [
        2,
        6,
        8,
        4
      ],
      "b": [
        12,
        16,
        8,
        4
      ],
      "unit": "%",
      "questions": [
        {
          "label": "哪组等级整体偏高",
          "value": [
            "a"
          ],
          "options": [
            [
              "a",
              "甲，经常或总是的比例更高"
            ],
            [
              "b",
              "乙，因为人数多"
            ]
          ]
        },
        {
          "label": "这些等级之间",
          "value": [
            "order"
          ],
          "options": [
            [
              "order",
              "有顺序，但感受差不一定相等"
            ],
            [
              "equal",
              "一定是相等的差距"
            ]
          ]
        }
      ]
    },
    "question": "为什么两组数据比较必须用同一零点和刻度，人数不同时要先换算成百分比并保持等级顺序？"
  }
]);
export const P077_SOURCES = Object.freeze(REVIEWED.map(({sessionId, index, nodeId, type: t, taskHash}) => Object.freeze({sessionId, index, nodeId, type: t, taskHash})));

export function p077DigitalSetsBinding(task, context) {
  if (!isEvidenceContext(context)) return null;
  const entry = REVIEWED.find(e => e.sessionId === context.sessionId && e.index === context.index);
  if (!entry || !sameEvidence(task, entry.task) || !matchesNativeEvidenceTask(task, context, {type, nodeId: entry.nodeId})) return null;
  return {nodeId: entry.nodeId, kind: 'p077-digital-sets', method: null, question: entry.question};
}

function exactHeights(task) {
  if (task.mode === 'nominal') return [...task.a, ...task.b];
  const sa = task.a.reduce((s, x) => s + x, 0), sb = task.b.reduce((s, x) => s + x, 0);
  return [...task.a.map(x => x * 100 / sa), ...task.b.map(x => x * 100 / sb)];
}

export function replayP077DigitalSetsEvidence(task, model, context) {
  try {
    const binding = p077DigitalSetsBinding(task, context);
    if (!binding || !hasExactKeys(model, Object.keys(initial(task))) || !valid(task, model) ||
        model.issue !== '' || !model.history.length || Object.keys(model.history).length !== model.history.length) return null;
    let built = null, builds = 0;
    for (const ev of model.history) {
      if (!hasExactKeys(ev, ['a', 'd', 'f']) || !hasExactKeys(ev.d, [])) return null;
      if (ev.a === 'reset' && hasExactKeys(ev.f, [])) built = null;
      else if (ev.a === 'build' && hasExactKeys(ev.f, ['heights'])) { built = ev.f.heights.map(number); builds++; }
      else return null;
    }
    const want = exactHeights(task);
    if (!builds || !built || !sameEvidence(built, want) || !sameEvidence(built, model.board.heights) ||
        !sameEvidence(model.heights.map(number), want) || model.axis !== 'same' ||
        (task.mode === 'ordinal' && model.choice !== 'ordered') || !inspect(task, model).correct) return null;
    return {binding, mode: task.mode, heights: want, builds};
  } catch { return null; }
}

export function submittedP077DigitalSetsEvidence(task, model, record, context) {
  if (!latestSubmissionMatches(model, record)) return null;
  return replayP077DigitalSetsEvidence(task, model, context);
}
