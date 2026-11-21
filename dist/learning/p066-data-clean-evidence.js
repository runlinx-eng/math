import {initial, inspect, valid} from './phase5/b19-model.js';
import {hasExactKeys, isEvidenceContext, latestSubmissionMatches, matchesNativeEvidenceTask, sameEvidence} from './evidence-contract.js';

const sessionId = 'checkrecords', index = 0, nodeId = 'mt_QHT16CrFO-', type = 'x-dataclean';
const taskHash = "a901b8238ae22b1efcf8d6373d8cfb7b0f73ab4e587f4e6b24d32e262a325718", reviewed = {"type":"x-dataclean","prompt":"这张模拟表有空白和抄错的值。保留原表，按凭据逐条处理；没有凭据就别猜。","labels":["红","蓝","绿"],"rows":[{"id":"R01","raw":"红"},{"id":"R02","raw":"蓝"},{"id":"R03","raw":""},{"id":"R04","raw":"42","proof":"绿"},{"id":"R05","raw":"红"},{"id":"R06","raw":"蓝"},{"id":"R07","raw":"绿"},{"id":"R08","raw":"蓝"}]};
export const P066_SOURCES = Object.freeze([Object.freeze({sessionId, index, nodeId, type, taskHash})]);

export function p066DataCleanBinding(task, context) {
  if (!isEvidenceContext(context) || context.sessionId !== sessionId || context.index !== index ||
      !sameEvidence(task, reviewed) || !matchesNativeEvidenceTask(task, context, {type, nodeId})) return null;
  return {nodeId, kind: 'p066-data-clean', method: null, question: '为什么有凭据的抄错记录（R04）可以更正为“绿”，而没有凭据的空白记录（R03）必须标为未知、不能硬猜？'};
}

export function replayP066DataCleanEvidence(task, model, context) {
  try {
    const binding = p066DataCleanBinding(task, context);
    if (!binding || !hasExactKeys(model, Object.keys(initial(task))) || !valid(task, model) ||
        model.issue !== '' || !model.history.length || Object.keys(model.history).length !== model.history.length) return null;
    const decisions = Array(task.rows.length).fill(null);
    let cursor = 0, failed = 0, lastIssue = '';
    for (const ev of model.history) {
      if (!hasExactKeys(ev, ['a', 'd', 'f']) || !hasExactKeys(ev.d, [])) return null;
      lastIssue = '';
      if (ev.a === 'reset') { decisions.fill(null); cursor = 0; }
      else if (ev.a === 'clean' && cursor < task.rows.length) {
        const row = task.rows[cursor], isValid = task.labels.includes(row.raw);
        const wantDec = isValid ? 'keep' : row.proof ? 'correct' : 'unknown';
        const wantReason = isValid ? 'valid' : row.proof ? 'proof' : 'no-proof';
        const okRow = ev.f.decision === wantDec && ev.f.cleanReason === wantReason &&
          (!row.proof || ev.f.correction === row.proof);
        if (!okRow) { lastIssue = 'bad-clean'; failed++; }
        else { decisions[cursor] = {decision: wantDec, value: isValid ? row.raw : row.proof || null, reason: wantReason}; cursor++; }
      } else return null;
    }
    const usable = decisions.filter(d => d && d.value !== null).length;
    const unknown = task.rows.length - usable;
    if (lastIssue !== '' || cursor !== task.rows.length || Number(model.usable) !== usable ||
        Number(model.unknown) !== unknown || !inspect(task, model).correct) return null;
    return {binding, totalRows: task.rows.length, usable, unknown, failed};
  } catch { return null; }
}

export function submittedP066DataCleanEvidence(task, model, record, context) {
  if (!latestSubmissionMatches(model, record)) return null;
  return replayP066DataCleanEvidence(task, model, context);
}
