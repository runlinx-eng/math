import {initial, inspect, valid} from './phase5/b23-model.js';
import {hasExactKeys, isEvidenceContext, latestSubmissionMatches, matchesNativeEvidenceTask, sameEvidence} from './evidence-contract.js';

const type = 'x-s23-objects';
const REVIEWED = Object.freeze([
  {
    "sessionId": "shapeuses",
    "index": 0,
    "nodeId": "mt_mN4Ye_vtR7",
    "type": "x-s23-objects",
    "taskHash": "d4fa8db3dddcab3af8fea3faacfeee321a7f14ca1f6a67e212665b2f283c2a2d",
    "task": {
      "type": "x-s23-objects",
      "prompt": "把圆柱放倒试一试，再立起来叠放。",
      "allowed": "cylinder",
      "required": [
        "roll",
        "stack"
      ],
      "questions": [
        {
          "label": "圆柱的两个平面端",
          "value": "flat",
          "options": [
            [
              "flat",
              "可以在平面上提供接触面"
            ],
            [
              "point",
              "只有一个尖点"
            ]
          ]
        }
      ]
    },
    "question": "为什么立体图形的平面端和平直边决定了它能否稳稳叠放、对齐排列，而曲面决定它能否滚动？"
  },
  {
    "sessionId": "shapeuses",
    "index": 1,
    "nodeId": "mt_mN4Ye_vtR7",
    "type": "x-s23-objects",
    "taskHash": "7cf8bca0b639278c7a299ec388576feb2babfedf438aaad54361c252342c4739",
    "task": {
      "type": "x-s23-objects",
      "prompt": "选择长方体，在格子中并排放四个，再叠一层。",
      "allowed": "cuboid",
      "required": [
        "pack",
        "stack"
      ],
      "questions": [
        {
          "label": "为什么可以边对边排列",
          "value": "faces",
          "options": [
            [
              "faces",
              "平面和相应直边可对齐"
            ],
            [
              "curve",
              "所有面都弯曲"
            ]
          ]
        }
      ]
    },
    "question": "为什么立体图形的平面端和平直边决定了它能否稳稳叠放、对齐排列，而曲面决定它能否滚动？"
  },
  {
    "sessionId": "shapeuses",
    "index": 2,
    "nodeId": "mt_mN4Ye_vtR7",
    "type": "x-s23-objects",
    "taskHash": "888dcb1608e135abff647d0c1493e0210fa4c4332a31e749980f3a7e6b94a5f8",
    "task": {
      "type": "x-s23-objects",
      "prompt": "选择有平面支撑的积木，试着叠在一起。",
      "allowed": "blocks",
      "required": [
        "stack"
      ],
      "questions": [
        {
          "label": "为什么容易对齐",
          "value": "flat",
          "options": [
            [
              "flat",
              "相接处有平面"
            ],
            [
              "point",
              "只靠一个尖点"
            ]
          ]
        }
      ]
    },
    "question": "为什么立体图形的平面端和平直边决定了它能否稳稳叠放、对齐排列，而曲面决定它能否滚动？"
  }
]);
export const P082_SOURCES = Object.freeze(REVIEWED.map(({sessionId, index, nodeId, type: t, taskHash}) => Object.freeze({sessionId, index, nodeId, type: t, taskHash})));

export function p082ShapeUsesBinding(task, context) {
  if (!isEvidenceContext(context)) return null;
  const entry = REVIEWED.find(e => e.sessionId === context.sessionId && e.index === context.index);
  if (!entry || !sameEvidence(task, entry.task) || !matchesNativeEvidenceTask(task, context, {type, nodeId: entry.nodeId})) return null;
  return {nodeId: entry.nodeId, kind: 'p082-shape-uses', method: null, question: entry.question};
}

export function replayP082ShapeUsesEvidence(task, model, context) {
  try {
    const binding = p082ShapeUsesBinding(task, context);
    if (!binding || !hasExactKeys(model, Object.keys(initial(task))) || !valid(task, model) ||
        model.issue !== '' || !model.history.length || Object.keys(model.history).length !== model.history.length) return null;
    let shape = '', orientation = 'upright', rolled = false, stacked = false, lastIssue = '', failed = 0;
    const packed = [];
    for (const ev of model.history) {
      if (!hasExactKeys(ev, ['a', 'f', 'd'])) return null;
      lastIssue = '';
      if (ev.a === 'reset' && hasExactKeys(ev.f, []) && hasExactKeys(ev.d, [])) { shape = ''; orientation = 'upright'; rolled = false; stacked = false; packed.length = 0; }
      else if (ev.a === 'object' && hasExactKeys(ev.f, ['choice']) && hasExactKeys(ev.d, [])) {
        if (['cylinder', 'cuboid', 'cube', 'sphere'].includes(ev.f.choice)) { shape = ev.f.choice; orientation = 'upright'; rolled = false; stacked = false; packed.length = 0; }
      } else if (ev.a === 'flip' && hasExactKeys(ev.f, []) && hasExactKeys(ev.d, [])) {
        if (shape) orientation = orientation === 'upright' ? 'side' : 'upright';
      } else if (ev.a === 'roll' && hasExactKeys(ev.f, []) && hasExactKeys(ev.d, [])) {
        if (shape === 'cylinder' && orientation === 'side') rolled = true; else { lastIssue = 'bad-roll'; failed++; }
      } else if (ev.a === 'stack' && hasExactKeys(ev.f, []) && hasExactKeys(ev.d, [])) {
        if (['cuboid', 'cube'].includes(shape) || (shape === 'cylinder' && orientation === 'upright')) stacked = true; else { lastIssue = 'bad-stack'; failed++; }
      } else if (ev.a === 'pack' && hasExactKeys(ev.f, []) && hasExactKeys(ev.d, ['index']) && /^[0-3]$/.test(ev.d.index)) {
        if (shape === 'cuboid') { const idx = Number(ev.d.index), p = packed.indexOf(idx); if (p >= 0) packed.splice(p, 1); else packed.push(idx); }
        else { lastIssue = 'bad-pack'; failed++; }
      } else return null;
    }
    const allowedOk = task.allowed === 'blocks' ? ['cube', 'cuboid'].includes(shape) : shape === task.allowed;
    const reqOk = task.required.every(k => k === 'roll' ? rolled : k === 'stack' ? stacked : packed.length === 4);
    if (lastIssue !== '' || !allowedOk || !reqOk || model.board.shape !== shape || model.board.rolled !== rolled ||
        model.board.stacked !== stacked || !sameEvidence(packed, model.board.packed) ||
        model.answers[0] !== task.questions[0].value || !inspect(task, model).correct) return null;
    return {binding, shape, rolled, stacked, packedCount: packed.length, failed};
  } catch { return null; }
}

export function submittedP082ShapeUsesEvidence(task, model, record, context) {
  if (!latestSubmissionMatches(model, record)) return null;
  return replayP082ShapeUsesEvidence(task, model, context);
}
