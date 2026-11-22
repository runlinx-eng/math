// B-line development candidate for the exact #343 source positions below.
import * as original from './phase5/b09-model.js';
import {equal} from './phase5/b16-model.js';
import {
  hasExactKeys, isEvidenceContext, latestSubmissionMatches, matchesNativeEvidenceTask
} from './evidence-contract.js';

export const SOURCES = Object.freeze([
  Object.freeze({sessionId: 'distancezero', index: 0, nodeId: 'mt_RWUY7_IXvw',
    type: 'x-zerodistance', taskHash: '3838cae7e5635fbed829bb460433fd5edb3cef5c5fe500642b09e042b91ade0c'}),
  Object.freeze({sessionId: 'distancezero', index: 1, nodeId: 'mt_RWUY7_IXvw',
    type: 'x-zerodistance', taskHash: '952aa5c352416dcf5c0664157aa55b00f6809d9d3b33e7cf327086d799dc2155'}),
  Object.freeze({sessionId: 'distancezero', index: 2, nodeId: 'mt_RWUY7_IXvw',
    type: 'x-zerodistance', taskHash: '9d0c3e7ba961ac5266ec9ad29ed3f520f9579aa88ce7bfe24483a58c1daa77e1'}),
]);

function sourceFor(task, context) {
  if (!isEvidenceContext(context)) return null;
  const source = SOURCES.find(row => row.sessionId === context.sessionId && row.index === context.index);
  return source && matchesNativeEvidenceTask(task, context, source) ? source : null;
}

export function binding(task, context) {
  const source = sourceFor(task, context);
  return source ? {nodeId: source.nodeId, method: null, question: '核对原数的位置和描出的到零距离。'} : null;
}

export function submitted(task, model, record, context) {
  return latestSubmissionMatches(model, record) ? replay(task, model, context) : null;
}

export function replay(task, model, context) {
  try {
    const source = sourceFor(task, context);
    if (!source || !hasExactKeys(model, Object.keys(original.initial(task))) ||
        !original.valid(task, model) || !original.inspect(task, model).correct) return null;
    const traces = [];
    for (const trace of model.traced) {
      if (!hasExactKeys(trace, ['index', 'point']) || (trace.point - task.min * 100) % 25 !== 0) return null;
      traces.push({...trace, distanceHundredths: Math.abs(trace.point)});
    }
    const points = [];
    for (const [index, value] of task.values.entries()) {
      const point = value * 100;
      if (model.positions[index] !== point || model.touched[index] !== true ||
          !traces.some(trace => trace.index === index && trace.point === point) ||
          !equal(model.answers[index], Math.abs(point), 100)) return null;
      points.push({signedValueHundredths: point, distanceHundredths: Math.abs(point)});
    }
    const comparison = (a, b) => a < b ? '<' : a > b ? '>' : '=';
    const relations = task.compare ? {
      numberRelation: comparison(points[0].signedValueHundredths, points[1].signedValueHundredths),
      distanceRelation: comparison(points[0].distanceHundredths, points[1].distanceHundredths)
    } : {numberRelation: '', distanceRelation: ''};
    if (!Object.entries(relations).every(([key, value]) => model[key] === value)) return null;
    return {...source, method: null, points, traces, comparisons: task.compare ? relations : null};
  } catch {
    return null;
  }
}
