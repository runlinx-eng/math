// B-line development candidate for the exact #343 source positions below.
import * as original from './phase5/b07-model.js';
import {
  hasExactKeys, isEvidenceContext, latestSubmissionMatches, matchesNativeEvidenceTask, sameEvidence
} from './evidence-contract.js';

export const SOURCES = Object.freeze([
  Object.freeze({sessionId: 'compare100', index: 2, nodeId: 'mt_U0waNfD8PB',
    type: 'x-pvorder', taskHash: 'c27d9167816cc41f1dbe08e4fee247f668fe660da9b506192a3237532a739d3d'}),
  Object.freeze({sessionId: 'faces120', index: 2, nodeId: 'mt_QguIGVMB1o',
    type: 'x-pvorder', taskHash: 'a6c9156f510b5074ded9e6717e218692f37d8a710fbcf7bdcdc721188eea9266'}),
  Object.freeze({sessionId: 'hundreds', index: 1, nodeId: 'mt_R2ccrI-nKD',
    type: 'x-pvorder', taskHash: '38aa247e84dea0589b01cc690af9dd484ca9e4071313a9af75a895ff697447c8'}),
  Object.freeze({sessionId: 'compare1000', index: 5, nodeId: 'mt_AQcVRBddko',
    type: 'x-pvorder', taskHash: 'e64d9eefdec8991e6603be1e00b3055ec0af5d2180b94b9b52f02d941ee3469f'}),
  Object.freeze({sessionId: 'screen1000', index: 1, nodeId: 'mt_HczwO1sr-y',
    type: 'x-pvorder', taskHash: '79ed9d484a397be01031e7f85ba9388574fa742749b405f1de09e78e9296b8b8'}),
]);

function sourceFor(task, context) {
  if (!isEvidenceContext(context)) return null;
  const source = SOURCES.find(row => row.sessionId === context.sessionId && row.index === context.index);
  return source && matchesNativeEvidenceTask(task, context, source) ? source : null;
}

export function binding(task, context) {
  const source = sourceFor(task, context);
  return source ? {nodeId: source.nodeId, method: null, question: '核对纸卡的顺序和数轴每一点。'} : null;
}

export function submitted(task, model, record, context) {
  return latestSubmissionMatches(model, record) ? replay(task, model, context) : null;
}

export function replay(task, model, context) {
  try {
    const source = sourceFor(task, context);
    if (!source || !hasExactKeys(model, Object.keys(original.initial(task))) ||
        !original.valid(task, model) || !original.inspect(task, model).correct ||
        model.order.length !== task.values.length || !model.touched.every(value => value === true)) return null;
    const byValue = task.values.map((_, i) => i).sort((a, b) => task.values[a] - task.values[b]);
    if (!sameEvidence(model.order, byValue) ||
        !model.positions.every((position, i) => position === task.values[i])) return null;
    return {...source, method: null, retainedCardOrder: [...model.order], axisRange: [0, task.max],
      recordedPoints: model.positions.map((axisValue, card) => ({card, axisValue})),
      sliderMovementHistoryRecorded: false};
  } catch {
    return null;
  }
}
