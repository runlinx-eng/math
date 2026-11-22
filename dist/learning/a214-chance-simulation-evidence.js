// B-line development candidate for the exact #343 source positions below.
import * as original from './phase4/b04-model.js';
import {
  hasExactKeys, isEvidenceContext, latestSubmissionMatches, matchesNativeEvidenceTask
} from './evidence-contract.js';

export const SOURCES = Object.freeze([
  Object.freeze({sessionId: 'simulation', index: 0, nodeId: 'mt_8DT3LXwwH-',
    type: 'x-simulation', taskHash: 'e15c769162ac92cb757ff3de5b8916624beb514a89da9b39ad71fc45ad5abaa1'}),
]);

function sourceFor(task, context) {
  if (!isEvidenceContext(context)) return null;
  const source = SOURCES.find(row => row.sessionId === context.sessionId && row.index === context.index);
  return source && matchesNativeEvidenceTask(task, context, source) ? source : null;
}

export function binding(task, context) {
  const source = sourceFor(task, context);
  return source ? {nodeId: source.nodeId, method: null, question: '比较模拟中的比例，分清通常趋势与每轮保证。'} : null;
}

export function submitted(task, model, record, context) {
  return latestSubmissionMatches(model, record) ? replay(task, model, context) : null;
}

export function replay(task, model, context) {
  try {
    const source = sourceFor(task, context);
    if (!source || !hasExactKeys(model, Object.keys(original.initial(task))) ||
        !original.valid(task, model) || !original.inspect(task, model).correct ||
        !['10', '100', '1000'].includes(model.sample)) return null;
    const sampleSizes = [10, 100, 1000];
    const roundCounts = new Map(sampleSizes.map(n => [n, 0]));
    const rounds = [];
    for (const run of model.runs) {
      if (!hasExactKeys(run, ['n', 'seed', 'hits']) ||
          !roundCounts.has(run.n) || !Number.isInteger(run.hits) || run.hits < 0 || run.hits > run.n) return null;
      roundCounts.set(run.n, roundCounts.get(run.n) + 1);
      rounds.push({frequency: [run.hits, run.n], distanceFromOneSixth: [Math.abs(6 * run.hits - run.n), 6 * run.n]});
    }
    if (sampleSizes.some(n => roundCounts.get(n) !== 5) || model.trend !== 'usually' || model.guarantee !== 'no') return null;
    // The original activity shows this illustrative counterexample separately from simulated rounds.
    const hypotheticalDistances = [[2, 10], [220, 1000]].map(([hits, n]) =>
      [Math.abs(6 * hits - n), 6 * n]);
    return {...source, method: null, rounds, hypotheticalDistances, selectedTrend: model.trend,
      selectedGuarantee: model.guarantee};
  } catch {
    return null;
  }
}
