import {rational} from './phase5/b16-model.js';
import {initial, inspect, valid} from './phase5/b37-model.js';
import {hasExactKeys, isEvidenceContext, latestSubmissionMatches, matchesNativeEvidenceTask, sameEvidence} from './evidence-contract.js';

const sessionId = "complex38", index = 0, nodeId = "mt_GpltXPoaoc", type = 'x-r37-steps';
const taskHash = "3106348fc627d39c7aaf96d5adafca84750e0531ef186ae385330327bbb6b511", expectedSteps = [2500,7500,1500];
const reviewed = {
  "type": "x-r37-steps",
  "prompt": "每袋2.5千克，3袋平均分给5份。每份多少克？",
  "scene": "先统一单位，再找总量和每份。",
  "steps": [
    {
      "title": "单位",
      "label": "每袋多少克",
      "value": 2500
    },
    {
      "title": "总量",
      "label": "3袋共多少克",
      "value": 7500
    },
    {
      "title": "分成5份",
      "label": "每份多少克",
      "value": 1500
    }
  ],
  "questions": []
};
export const P069_SOURCES = Object.freeze([Object.freeze({sessionId, index, nodeId, type, taskHash})]);

export function p069ComplexStepsBinding(task, context) {
  if (!isEvidenceContext(context) || context.sessionId !== sessionId || context.index !== index ||
      !sameEvidence(task, reviewed) || !matchesNativeEvidenceTask(task, context, {type, nodeId})) return null;
  return {nodeId, kind: 'p069-complex-steps', method: null, question: "为什么先把 2.5 千克换成 2500 克，再乘 3 除以 5 得到每份 1500 克？"};
}

function exactEqual(raw, target) {
  const r = rational(String(raw).trim().replace(/\s*\/\s*/g, '/'));
  return Boolean(r && r[1] > 0 && BigInt(r[0]) === BigInt(target) * BigInt(r[1]));
}

export function replayP069ComplexStepsEvidence(task, model, context) {
  try {
    const binding = p069ComplexStepsBinding(task, context);
    if (!binding || !hasExactKeys(model, Object.keys(initial(task))) || !valid(task, model) ||
        model.issue !== '' || !model.history.length || Object.keys(model.history).length !== model.history.length) return null;
    let stepIdx = 0, failedSteps = 0;
    const accepted = [];
    for (const ev of model.history) {
      if (!hasExactKeys(ev, ['a', 'i', 'v', 'w', 'c']) || ev.a !== 'step' || ev.i !== '' || ev.w !== '' || ev.c !== '') return null;
      if (stepIdx >= expectedSteps.length) return null;
      if (exactEqual(ev.v, expectedSteps[stepIdx])) { accepted.push({index: stepIdx, value: expectedSteps[stepIdx], raw: ev.v}); stepIdx++; }
      else failedSteps++;
    }
    if (stepIdx !== expectedSteps.length || model.board.index !== expectedSteps.length ||
        model.board.records.length !== accepted.length + failedSteps || !inspect(task, model).correct) return null;
    return {binding, steps: accepted, failedSteps};
  } catch { return null; }
}

export function submittedP069ComplexStepsEvidence(task, model, record, context) {
  if (!latestSubmissionMatches(model, record)) return null;
  return replayP069ComplexStepsEvidence(task, model, context);
}
