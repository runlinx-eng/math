import {rational} from './phase5/b16-model.js';
import {initial, inspect, valid} from './phase5/b37-model.js';
import {hasExactKeys, isEvidenceContext, latestSubmissionMatches, matchesNativeEvidenceTask, sameEvidence} from './evidence-contract.js';

const sessionId = "similar37", index = 3, nodeId = "mt_2OtRUM_0zW", type = 'x-r37-steps';
const taskHash = "25d9a986bda4c2e3c8c7180318fe00a0c7dcbfbd8beec961363c4028a4d8c6ad", expectedSteps = [2,2,2];
const reviewed = {
  "type": "x-r37-steps",
  "prompt": "一个三角形的边是3、4、5，另一个对应边是6、8、10。",
  "scene": "比较每一对对应边。",
  "steps": [
    {
      "title": "第一对",
      "label": "6是3的几倍",
      "value": 2
    },
    {
      "title": "第二对",
      "label": "8是4的几倍",
      "value": 2
    },
    {
      "title": "第三对",
      "label": "10是5的几倍",
      "value": 2
    }
  ],
  "questions": []
};
export const P067_SOURCES = Object.freeze([Object.freeze({sessionId, index, nodeId, type, taskHash})]);

export function p067SimilarStepsBinding(task, context) {
  if (!isEvidenceContext(context) || context.sessionId !== sessionId || context.index !== index ||
      !sameEvidence(task, reviewed) || !matchesNativeEvidenceTask(task, context, {type, nodeId})) return null;
  return {nodeId, kind: 'p067-similar-steps', method: null, question: "为什么三对对应边的倍数都等于 2，说明两个三角形按同一比例放大？"};
}

function exactEqual(raw, target) {
  const r = rational(String(raw).trim().replace(/\s*\/\s*/g, '/'));
  return Boolean(r && r[1] > 0 && BigInt(r[0]) === BigInt(target) * BigInt(r[1]));
}

export function replayP067SimilarStepsEvidence(task, model, context) {
  try {
    const binding = p067SimilarStepsBinding(task, context);
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

export function submittedP067SimilarStepsEvidence(task, model, record, context) {
  if (!latestSubmissionMatches(model, record)) return null;
  return replayP067SimilarStepsEvidence(task, model, context);
}
