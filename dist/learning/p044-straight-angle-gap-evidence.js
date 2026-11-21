import {initial, inspect, valid} from './phase5/b17-model.js';
import {hasExactKeys, isEvidenceContext, latestSubmissionMatches, matchesNativeEvidenceTask, sameEvidence} from './evidence-contract.js';
import {rational} from './phase5/b16-model.js';

const reviewed = [
  {
    "sessionId": "structurechoices",
    "index": 4,
    "nodeId": "mt_hlGKg5M7qJ",
    "type": "x-straightgap",
    "taskHash": "112f7ddc8906f1877959c06fd93f9ba45c4b7692fbe931bcbed05d25228d47ec",
    "task": {
      "type": "x-straightgap",
      "known": 110,
      "prompt": "两块沿一条直线相接。已知110°，不用测量，算出缺角再把它拼好。"
    }
  },
  {
    "sessionId": "structurechoices",
    "index": 5,
    "nodeId": "mt_hlGKg5M7qJ",
    "type": "x-straightgap",
    "taskHash": "49fbc21b0cede2f87329026e7a850ed0c83bf63d238f15240457a798509ec131",
    "task": {
      "type": "x-straightgap",
      "known": 64,
      "prompt": "换成64°，这次沿用哪一条关系？先计算，再转动补上的角核对。"
    }
  }
];
export const P044_SOURCES = Object.freeze(reviewed.map(({task, ...source}) => Object.freeze(source)));
export function p044StraightAngleGapBinding(task, context) {
  if (!isEvidenceContext(context)) return null;
  const entry = reviewed.find(source => source.sessionId === context.sessionId && source.index === context.index);
  if (!entry || !sameEvidence(task, entry.task) || !matchesNativeEvidenceTask(task, context, entry)) return null;
  return {nodeId:entry.nodeId, kind:'p044-straight-angle-gap', method:null, question:"为什么两块沿同一直线接好时，两个角的和是 180°？"};
}
export function replayP044StraightAngleGapEvidence(task, model, context) {
  try {
    const binding = p044StraightAngleGapBinding(task, context);
    if (!binding || !hasExactKeys(model, Object.keys(initial(task))) || !valid(task, model) ||
        model.issue !== '' || !model.history.length || Object.keys(model.history).length !== model.history.length) return null;
    const target = 180 - task.known;
    let first = null;
    let angle = null;
    let turns = 0;
    for (const event of model.history) {
      if (!hasExactKeys(event, ['a','d','f']) || !hasExactKeys(event.d, []) ||
          !hasExactKeys(event.f, Object.keys(initial(task)).filter(key => !['board','history','issue'].includes(key)))) return null;
      if (event.a === 'reset') {
        angle = null;
        turns = 0;
      } else if (event.a === 'angle') {
        first ??= event.f.angle;
        const raw = Number(event.f.angle);
        if (Number.isInteger(raw) && raw >= 0 && raw <= 180) angle = raw;
        turns++;
      } else return null;
    }
    const written = rational(model.answer.trim());
    if (!turns || angle !== target || Number(model.angle) !== target || model.reason !== 'straight' ||
        !written || BigInt(written[0]) !== BigInt(target) * BigInt(written[1]) ||
        !sameEvidence({angle,first}, model.board) || !inspect(task, model).correct) return null;
    return {binding, known:task.known, angle, first, turns};

  } catch {
    return null;
  }
}
export function submittedP044StraightAngleGapEvidence(task, model, record, context) {
  return latestSubmissionMatches(model, record) ? replayP044StraightAngleGapEvidence(task, model, context) : null;
}
