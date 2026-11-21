import {initial, inspect, valid} from './phase5/b29-model.js';
import {hasExactKeys, isEvidenceContext, latestSubmissionMatches, matchesNativeEvidenceTask, sameEvidence} from './evidence-contract.js';

const sessionId = 'temperaturechange', index = 2, nodeId = 'mt_RVK655t391', type = 'x-m29-order';
const taskHash = "3d8efdf2a4168309bf441e68fc90d1dd3334ce1b7f3ed8dd057c85e9b8960d92", reviewed = {"type":"x-m29-order","prompt":"把 −7、−3、0、2、5 按从小到大的顺序放到数轴上。","values":[-7,-3,0,2,5]};
export const P063_SOURCES = Object.freeze([Object.freeze({sessionId, index, nodeId, type, taskHash})]);

export function p063TemperatureOrderBinding(task, context) {
  if (!isEvidenceContext(context) || context.sessionId !== sessionId || context.index !== index ||
      !sameEvidence(task, reviewed) || !matchesNativeEvidenceTask(task, context, {type, nodeId})) return null;
  return {nodeId, kind: 'p063-temperature-order', method: null, question: '为什么 −7 在数轴上比 −3 更靠左，所以 −7 < −3 < 0 < 2 < 5？'};
}

export function replayP063TemperatureOrderEvidence(task, model, context) {
  try {
    const binding = p063TemperatureOrderBinding(task, context);
    if (!binding || !hasExactKeys(model, Object.keys(initial(task))) || !valid(task, model) ||
        model.issue !== '' || !model.history.length || Object.keys(model.history).length !== model.history.length) return null;
    const chosen = [];
    let undos = 0, clears = 0;
    for (const ev of model.history) {
      if (!hasExactKeys(ev, ['a', 'i', 'v']) || ev.v !== '') return null;
      if (ev.a === 'choose' && /^\d+$/.test(ev.i) && ev.i === String(Number(ev.i)) && Number(ev.i) < task.values.length) {
        const idx = Number(ev.i); if (!chosen.includes(idx)) chosen.push(idx);
      } else if (ev.a === 'undo' && ev.i === '') { if (chosen.length) { chosen.pop(); undos++; } }
      else if (ev.a === 'clear' && ev.i === '') { chosen.length = 0; clears++; }
      else return null;
    }
    const want = task.values.map((v, i) => [v, i]).sort((a, b) => a[0] - b[0]).map(x => x[1]);
    if (!sameEvidence(chosen, model.board.chosen) || !sameEvidence(chosen, want) || !inspect(task, model).correct) return null;
    return {binding, orderedValues: chosen.map(i => task.values[i]), undos, clears};
  } catch { return null; }
}

export function submittedP063TemperatureOrderEvidence(task, model, record, context) {
  if (!latestSubmissionMatches(model, record)) return null;
  return replayP063TemperatureOrderEvidence(task, model, context);
}
