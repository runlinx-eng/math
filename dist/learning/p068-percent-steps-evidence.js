import {rational} from './phase5/b16-model.js';
import {initial, inspect, valid} from './phase5/b37-model.js';
import {hasExactKeys, isEvidenceContext, latestSubmissionMatches, matchesNativeEvidenceTask, sameEvidence} from './evidence-contract.js';

const sessionId = "pctFraction37", index = 1, nodeId = "mt_ALUrJpY0cZ", type = 'x-r37-steps';
const taskHash = "5206b7175e71346970b858e3b1fa7c27da723942796f06afa444d9335c51504f", expectedSteps = [32,25];
const reviewed = {
  "type": "x-r37-steps",
  "prompt": "8个红珠在32个珠子中占多少？",
  "scene": "把32看作整个。",
  "steps": [
    {
      "title": "整个",
      "label": "整个有几颗",
      "value": 32
    },
    {
      "title": "一百份",
      "label": "8占32的百分之几",
      "value": 25,
      "hint": "用8除以32，再换成每百份。"
    }
  ],
  "questions": []
};
export const P068_SOURCES = Object.freeze([Object.freeze({sessionId, index, nodeId, type, taskHash})]);

export function p068PercentStepsBinding(task, context) {
  if (!isEvidenceContext(context) || context.sessionId !== sessionId || context.index !== index ||
      !sameEvidence(task, reviewed) || !matchesNativeEvidenceTask(task, context, {type, nodeId})) return null;
  return {nodeId, kind: 'p068-percent-steps', method: null, question: "把 32 颗看作整个，为什么 8 颗占其中的 25%？"};
}

function exactEqual(raw, target) {
  const r = rational(String(raw).trim().replace(/\s*\/\s*/g, '/'));
  return Boolean(r && r[1] > 0 && BigInt(r[0]) === BigInt(target) * BigInt(r[1]));
}

export function replayP068PercentStepsEvidence(task, model, context) {
  try {
    const binding = p068PercentStepsBinding(task, context);
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

export function submittedP068PercentStepsEvidence(task, model, record, context) {
  if (!latestSubmissionMatches(model, record)) return null;
  return replayP068PercentStepsEvidence(task, model, context);
}
