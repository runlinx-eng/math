import {initial, valid} from './phase5/b20-model.js';
import {hasExactKeys, latestSubmissionMatches, matchesNativeEvidenceTask, sameEvidence} from './evidence-contract.js';

const nodeId = 'mt_IHipFGTFEY';
export const P116F_SOURCES = Object.freeze([
  '01c9342ab60f8cfd9120318de2d8b22eddddcc8d5ffd7283253a2345ce1d4924',
  'b79c0f90a8ce7c2a0bfd63e41a38c040979ad599b56bbc7469d966e68dba2447',
].map((taskHash, index) => Object.freeze({sessionId: 'fractiondots', index, nodeId, type: 'x-dotdraw', taskHash})));

export function p116fFractionDotplotBinding(task, context) {
  const row = P116F_SOURCES.find(source => source.sessionId === context?.sessionId && source.index === context?.index);
  if (!row || !matchesNativeEvidenceTask(task, context, row)) return null;
  return {nodeId, kind: 'p116f-fraction-dotplot', method: null, question: '怎样用同一把尺的刻度核对每条彩带？'};
}

function exactTick(raw, scale) {
  const value = raw.trim();
  const fraction = /^(?:(-?\d+)\s+)?(-?\d+)\/(\d+)$/.exec(value);
  const decimal = /^(-?)(\d+)(?:\.(\d+))?$/.exec(value);
  let numerator;
  let denominator;
  if (fraction && BigInt(fraction[3]) > 0n && !(fraction[1] && fraction[2].startsWith('-'))) {
    denominator = BigInt(fraction[3]);
    numerator = BigInt(fraction[2]);
    if (fraction[1]) numerator = BigInt(fraction[1]) * denominator + (fraction[1].startsWith('-') ? -numerator : numerator);
  } else if (decimal) {
    const places = decimal[3] || '';
    denominator = 10n ** BigInt(places.length);
    numerator = BigInt(decimal[1] + decimal[2] + places);
  } else {
    return null;
  }
  const scaled = numerator * BigInt(scale);
  return scaled % denominator === 0n ? Number(scaled / denominator) : null;
}

export function replayP116FFractionDotplotEvidence(task, model, context) {
  try {
    const binding = p116fFractionDotplotBinding(task, context);
    if (!binding || !hasExactKeys(model, Object.keys(initial(task))) || !valid(task, model) ||
        model.issue !== '' || !model.history.length || Object.keys(model.history).length !== model.history.length) return null;
    let placed = task.values.map(() => null);
    let cursor = 0;
    for (const event of model.history) {
      if (!hasExactKeys(event, ['a','d','f'])) return null;
      if (event.a === 'reset') {
        placed = task.values.map(() => null);
        cursor = 0;
      } else if (event.a === 'row') {
        const index = exactTick(event.d.index ?? '', 1);
        if (index === null || index < 0 || index >= placed.length) return null;
        cursor = index;
      } else if (event.a === 'dot') {
        const tick = exactTick(event.f.value, task.d);
        if (tick === null || tick < task.min || tick > task.max) continue;
        placed[cursor] = tick;
        const next = placed.indexOf(null);
        if (next >= 0) cursor = next;
      } else {
        return null;
      }
    }
    if (!sameEvidence(placed, task.values) || !sameEvidence(placed, model.board.placed) || cursor !== model.board.cursor) return null;
    const span = Math.max(...placed) - Math.min(...placed);
    const sum = placed.reduce((total, tick) => total + tick, 0);
    if (context.index === 0) {
      if (exactTick(model.answers[0], 1) !== placed.length || exactTick(model.answers[1], task.d) !== span) return null;
    } else if (exactTick(model.answers[0], task.d) !== sum) {
      return null;
    }
    return {...binding, ticks: placed, denominator: task.d};
  } catch {
    return null;
  }
}

export function submittedP116FFractionDotplotEvidence(task, model, record, context) {
  return latestSubmissionMatches(model, record) ? replayP116FFractionDotplotEvidence(task, model, context) : null;
}
