// #343: check the identities and order in the count records retained by B06.
import * as original from './phase5/b06-model.js';
import {
  hasExactKeys, isEvidenceContext, latestSubmissionMatches, matchesNativeEvidenceTask, sameEvidence
} from './evidence-contract.js';

export const COUNT_TRAIL_SOURCES = Object.freeze([
  Object.freeze({sessionId: 'countonce', index: 0, nodeId: 'mt_WcfaSfVT33',
    type: 'x-counttrail', taskHash: 'de69d1c5798b0f0a4fcb231e67eaa158d1b93f726cce6afd33cd30dc446c09cf'}),
  Object.freeze({sessionId: 'countonce', index: 1, nodeId: 'mt_WcfaSfVT33',
    type: 'x-counttrail', taskHash: '51afe761bf4721039e02e9925c5cd619b330cf6ce5a7604b65dacb8449f13e01'}),
  Object.freeze({sessionId: 'lastcount', index: 0, nodeId: 'mt_dmNvjroCPT',
    type: 'x-counttrail', taskHash: 'b7d93f11a2c4f8d41c3c6b266e82209055c342c11f60dbbade1ff990109418d4'}),
  Object.freeze({sessionId: 'lastcount', index: 1, nodeId: 'mt_dmNvjroCPT',
    type: 'x-counttrail', taskHash: '144c38908a2ae4a9f5c75e0a47c01530e6f864bb65429d2159eb8ea5dc7198ec'}),
  Object.freeze({sessionId: 'lastcount', index: 2, nodeId: 'mt_dmNvjroCPT',
    type: 'x-counttrail', taskHash: '926ab1c13ae3249600071bba8439f2069524b57bf76d8c14d6fc21b5ec239652'}),
  Object.freeze({sessionId: 'counttwenty', index: 0, nodeId: 'mt_yqAL6O5i_v',
    type: 'x-counttrail', taskHash: 'e3060e242ac202a3c6969deeeb4e60515d9f6339901d46b98c7dbdfdbb526682'}),
  Object.freeze({sessionId: 'counttwenty', index: 1, nodeId: 'mt_yqAL6O5i_v',
    type: 'x-counttrail', taskHash: '818aa3a46ac8e1e2bea8a1b0bf1517531aa76554038ded49ee30d11f3537f14c'}),
]);

function sourceFor(task, context) {
  if (!isEvidenceContext(context)) return null;
  const source = COUNT_TRAIL_SOURCES.find(row =>
    row.sessionId === context.sessionId && row.index === context.index);
  return source && matchesNativeEvidenceTask(task, context, source) ? source : null;
}

function countOnce(taps, n) {
  return taps.length === n && new Set(taps).size === n &&
    taps.every(id => Number.isInteger(id) && id >= 0 && id < n);
}

export function countTrailBinding(task, context = {}) {
  const source = sourceFor(task, context);
  return source ? {
    nodeId: source.nodeId, method: null,
    question: '哪些物品各留下了一个序号？换起点或换位置时，总数量有没有变化？'
  } : null;
}

export function replayCountTrailEvidence(task, model, context = {}) {
  try {
    const source = sourceFor(task, context);
    if (!source || !hasExactKeys(model, Object.keys(original.initial(task))) ||
        !original.valid(task, model) || !original.inspect(task, model).correct ||
        !countOnce(model.taps, task.n) || model.total !== task.n || Boolean(model.moved) !== Boolean(task.rearrange)) return null;
    const expectedReason = task.error ? 'twice' : task.crooked ? 'start' : task.rearrange ? 'same' : '';
    const repeatIndex = task.error?.findIndex((id, i) => task.error.slice(0, i).includes(id));
    const duplicateOrdinal = repeatIndex === undefined ? null : repeatIndex + 1;
    if (model.badStep !== duplicateOrdinal || model.why !== expectedReason) return null;

    if (task.rearrange) {
      if (model.moved !== true || model.before !== task.n || model.prediction !== task.n || model.after !== task.n) return null;
    } else if (model.moved !== false || [model.before, model.prediction, model.after].some(value => value !== null)) return null;
    if (task.recount) {
      if (!countOnce(model.again, task.n) || sameEvidence(model.taps, model.again)) return null;
    } else if (model.again.length) return null;

    return {
      nodeId: source.nodeId, taskHash: source.taskHash, method: null,
      distinctObjects: task.n, retainedFirstCount: [...model.taps],
      retainedRecount: task.recount ? [...model.again] : null,
      recordedRearrangement: task.rearrange ? {before: model.before, predicted: model.prediction, reportedAfter: model.after} : null,
      duplicateOrdinalInGivenExample: duplicateOrdinal,
      selectedReason: model.why || null, cancellationsRecorded: false
    };
  } catch {
    return null;
  }
}

export function submittedCountTrailEvidence(task, model, record, context = {}) {
  return latestSubmissionMatches(model, record) ? replayCountTrailEvidence(task, model, context) : null;
}
