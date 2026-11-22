// B-line development candidate for the exact #343 source positions below.
import * as original from './phase4/b04-model.js';
import {
  hasExactKeys, isEvidenceContext, latestSubmissionMatches, matchesNativeEvidenceTask, sameEvidence
} from './evidence-contract.js';

export const SOURCES = Object.freeze([
  Object.freeze({sessionId: 'fairness', index: 0, nodeId: 'mt_xSgAgg9Ej_',
    type: 'x-spinner', taskHash: '1977145df39c24419037863370e6c9c8882f30f96808ef130afaba6179c308b8'}),
  Object.freeze({sessionId: 'fairness', index: 1, nodeId: 'mt_xSgAgg9Ej_',
    type: 'x-spinner', taskHash: 'c5d39de9e53b5fb99013518654d96dc2e4a92e8c84e0318e8cf82692e31fbda2'}),
  Object.freeze({sessionId: 'fairness', index: 2, nodeId: 'mt_xSgAgg9Ej_',
    type: 'x-spinner', taskHash: '066463b0ac5eac270363b3dd66ef8c3d61b82ac9a5e0f08d186b228fee7e4975'}),
]);

function sourceFor(task, context) {
  if (!isEvidenceContext(context)) return null;
  const source = SOURCES.find(row => row.sessionId === context.sessionId && row.index === context.index);
  return source && matchesNativeEvidenceTask(task, context, source) ? source : null;
}

export function binding(task, context) {
  const source = sourceFor(task, context);
  return source ? {nodeId: source.nodeId, method: null, question: '按同色等大扇区的份数判断机会，查看每轮的模拟记录。'} : null;
}

export function submitted(task, model, record, context) {
  return latestSubmissionMatches(model, record) ? replay(task, model, context) : null;
}

function sectorCounts(sectors, colorCount) {
  const counts = Array(colorCount).fill(0);
  for (const color of sectors) counts[color]++;
  return counts;
}

export function replay(task, model, context) {
  try {
    const source = sourceFor(task, context);
    if (!source || !hasExactKeys(model, Object.keys(original.initial(task))) ||
        !original.valid(task, model) || !original.inspect(task, model).correct || model.why !== 'area') return null;
    const rounds = [];
    for (const run of model.runs) {
      if (!hasExactKeys(run, ['sectors', 'prediction', 'counts']) ||
          run.counts.reduce((total, n) => total + n, 0) !== 100) return null;
      const counts = sectorCounts(run.sectors, task.colors);
      const theoretical = counts.every(n => n === counts[0]) ? 'equal' : 'unequal';
      rounds.push({sectorCounts: counts, sectorDenominator: task.sectors, prediction: run.prediction,
        theoretical, simulationFrequency: [...run.counts]});
    }
    const last = rounds.at(-1);
    if (!last || last.theoretical !== last.prediction || last.prediction !== model.prediction ||
        !sameEvidence(model.runs.at(-1).sectors, model.sectors)) return null;
    return {...source, method: null, rounds, reason: 'number of equal-sized sectors'};
  } catch {
    return null;
  }
}
