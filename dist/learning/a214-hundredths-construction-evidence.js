// #343: adding tenths and hundredths on the same hundred-grid whole.
import * as original from './phase5/b17-model.js';
import {equal} from './phase5/b16-model.js';
import {
  hasExactKeys,
  isEvidenceContext,
  latestSubmissionMatches,
  matchesNativeEvidenceTask,
  sameEvidence
} from './evidence-contract.js';

export const HUNDREDTHS_SOURCES = Object.freeze([
  Object.freeze({
    sessionId: 'tenthtohundred', index: 1, nodeId: 'mt_NaqEP8xDhZ', type: 'x-hundredcombine',
    taskHash: '811a8c85c40c091b23c2bc80c6287a8d5dd8c1731659587f029f599779faed31'
  }),
  Object.freeze({
    sessionId: 'tenthtohundred', index: 3, nodeId: 'mt_NaqEP8xDhZ', type: 'x-hundredcombine',
    taskHash: '49124ec79b9295e04ab9e4e409bbc6611fad28e582aa081f559635ada104f803'
  })
]);

const fieldNames = Object.keys(original.fields);
const liveFields = new Set(['left', 'answer', 'decimal']);
const limits = new Map([['layer', 1], ['ten', 9], ['cell', 99]]);
const block = row => Array.from({length: 10}, (_, column) => row * 10 + column);

function validFields(fields) {
  return fieldNames.every(key => typeof fields[key] === 'string' && fields[key].length <= 500 &&
    (liveFields.has(key) || fields[key] === original.fields[key]));
}

function sourceFor(task, context) {
  if (!isEvidenceContext(context)) return null;
  const source = HUNDREDTHS_SOURCES.find(row =>
    row.sessionId === context.sessionId && row.index === context.index);
  return source && matchesNativeEvidenceTask(task, context, source) ? source : null;
}

export function hundredthsConstructionBinding(task, context = {}) {
  const source = sourceFor(task, context);
  return source ? {
    nodeId: source.nodeId, method: null,
    question: '整行和单格各占同一个整体的多少？把两部分都用百分之一计数，再检查总量。'
  } : null;
}

export function replayHundredthsConstructionEvidence(task, model, context = {}) {
  try {
    const source = sourceFor(task, context);
    if (!source || !hasExactKeys(model, [...fieldNames, 'board', 'history', 'issue']) ||
        !validFields(model) || !original.valid(task, model) ||
        !original.inspect(task, model).correct) return null;

    const cells = Array(100).fill(-1);
    const originatingAction = Array(100).fill(null);
    let layer = 0;
    let issue = '';
    const events = [];
    for (const [step, event] of model.history.entries()) {
      if (!hasExactKeys(event, ['a', 'd', 'f']) || !hasExactKeys(event.f, fieldNames) ||
          !validFields(event.f)) return null;
      const action = event.a;
      issue = '';
      if (action === 'reset') {
        if (!hasExactKeys(event.d, [])) return null;
        cells.fill(-1);
        originatingAction.fill(null);
        layer = 0;
        events.push({step, action});
        continue;
      }
      if (!limits.has(action) || !hasExactKeys(event.d, ['index']) || !/^(0|[1-9]\d?)$/.test(event.d.index)) return null;
      const index = Number(event.d.index);
      if (index > limits.get(action)) return null;
      if (action === 'layer') {
        layer = index;
        events.push({step, action, layer});
        continue;
      }
      const affected = action === 'ten' ? block(index) : [index];
      const blocked = affected.some(cell => cells[cell] !== -1 && cells[cell] !== layer);
      const removes = !blocked && affected.every(cell => cells[cell] === layer);
      if (blocked) {
        issue = action === 'ten' ? '这一整行有另一部分，先换一行或拿回原来的格子。' :
          '这小格已经属于另一部分，不能重复使用。';
      } else {
        for (const cell of affected) {
          cells[cell] = removes ? -1 : layer;
          originatingAction[cell] = removes ? null : action;
        }
      }
      events.push({step, action, index, layer, blocked, removes});
    }

    if (!sameEvidence({cells, layer}, model.board) || model.issue !== issue) return null;
    const strips = Array.from({length: 10}, (_, row) => row).filter(row =>
      block(row).every(cell => cells[cell] === 0 && originatingAction[cell] === 'ten'));
    const tenthsCount = strips.length * 10;
    if (strips.length !== task.tenths || cells.filter(cell => cell === 0).length !== tenthsCount) return null;
    const singles = cells.flatMap((cell, index) =>
      cell === 1 && originatingAction[index] === 'cell' ? [index] : []);
    if (singles.length !== task.hundredths || cells.filter(cell => cell === 1).length !== singles.length) return null;

    const total = tenthsCount + singles.length;
    if (model.left.replace(/\s/g, '') !== tenthsCount + '/100' ||
        model.answer.replace(/\s/g, '') !== total + '/100' || !equal(model.decimal, total, 100)) return null;
    return {
      nodeId: source.nodeId, taskHash: source.taskHash, method: null,
      strips, singles, tenthsAsHundredths: tenthsCount, totalHundredths: total, events
    };
  } catch {
    return null;
  }
}

export function submittedHundredthsConstructionEvidence(task, model, record, context = {}) {
  return latestSubmissionMatches(model, record) ? replayHundredthsConstructionEvidence(task, model, context) : null;
}
