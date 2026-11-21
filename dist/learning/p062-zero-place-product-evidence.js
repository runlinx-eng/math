import {initial, inspect, valid, number} from './phase5/b14-model.js';
import {hasExactKeys, isEvidenceContext, latestSubmissionMatches, matchesNativeEvidenceTask, sameEvidence} from './evidence-contract.js';

const sessionId = 'bigproduct', index = 2, nodeId = 'mt_XLP1IM3Qbb', type = 'x-multable';
const taskHash = "93c94b11850b6790d18c4ed0709321802d6fc61bd91793ee18c6a95e02fd48c7", reviewed = {"type":"x-multable","a":3040,"b":20,"estimate":3000,"prompt":"3040×20：遇到0也留下位置，别把20读成2。"};
export const P062_SOURCES = Object.freeze([Object.freeze({sessionId, index, nodeId, type, taskHash})]);

export function p062ZeroPlaceProductBinding(task, context) {
  if (!isEvidenceContext(context) || context.sessionId !== sessionId || context.index !== index ||
      !sameEvidence(task, reviewed) || !matchesNativeEvidenceTask(task, context, {type, nodeId})) return null;
  return {nodeId, kind: 'p062-zero-place-product', method: null, question: '为什么 3040 × 20 即使不需要进位，也要保留 0 的数位并把第二行左移一位得到 60800？'};
}

export function replayP062ZeroPlaceProductEvidence(task, model, context) {
  try {
    const binding = p062ZeroPlaceProductBinding(task, context);
    if (!binding || !hasExactKeys(model, Object.keys(initial(task))) || !valid(task, model) ||
        model.issue !== '' || !model.history.length || Object.keys(model.history).length !== model.history.length) return null;

    const ds = [0, 4, 0, 3]; // 3040 reversed
    const ms = [0, 2];       // 20 reversed
    let firstEstimate = null, estimateOK = false, row = 0, col = 0, carry = 0, pending = null;
    let digits = [], rows = [], work = [], failedEvents = 0, resets = 0, lastIssue = '';

    for (const ev of model.history) {
      if (!ev || !ev.data || !ev.data.fields) return null;
      const a = ev.action, f = ev.data.fields;
      lastIssue = '';
      if (a === 'b14-reset') {
        estimateOK = false; row = 0; col = 0; carry = 0; pending = null; digits = []; rows = []; work = []; resets++;
      } else if (a === 'b14-estimate') {
        firstEstimate ??= f.estimate;
        if (number(f.estimate) !== task.estimate * task.b) { lastIssue = 'bad-est'; failedEvents++; }
        else estimateOK = true;
      } else if (a === 'b14-mul-count') {
        if (!estimateOK || row >= ms.length || col >= ds.length || pending) return null;
        const total = ds[col] * ms[row] + carry;
        if (number(f.raw) !== total) { lastIssue = 'bad-raw'; failedEvents++; }
        else pending = {raw: total, loose: total, bundles: 0};
      } else if (a === 'b14-trade') {
        if (!pending || pending.loose < 10) { lastIssue = 'bad-trade'; failedEvents++; }
        else { pending.loose -= 10; pending.bundles++; }
      } else if (a === 'b14-digit') {
        if (!pending) return null;
        if (pending.loose >= 10 || number(f.digit) !== pending.loose) { lastIssue = 'bad-digit'; failedEvents++; }
        else {
          work.push({row, col, raw: pending.raw, loose: pending.loose, bundles: pending.bundles, incoming: carry});
          digits.push(pending.loose); carry = pending.bundles; pending = null; col++;
        }
      } else if (a === 'b14-row') {
        if (col !== ds.length || row >= ms.length) return null;
        const rowVal = task.a * ms[row] * (10 ** row);
        if (number(f.shift) !== row || number(f.rowvalue) !== rowVal) { lastIssue = 'bad-row'; failedEvents++; }
        else { rows.push({value: rowVal, shift: row, digits: [...digits], carry}); row++; col = 0; carry = 0; digits = []; }
      } else return null;
    }

    const exactProduct = 3040 * 20;
    const replayedSum = rows.reduce((s, r) => s + r.value, 0);
    if (lastIssue !== '' || !estimateOK || row !== 2 || col !== 0 || pending !== null ||
        rows.length !== 2 || work.length !== 8 || replayedSum !== exactProduct ||
        !sameEvidence(rows, model.board.rows) || !sameEvidence(work, model.board.work) ||
        number(model.answer) !== exactProduct || !inspect(task, model).correct) return null;

    return {binding, product: exactProduct, rows: rows.map(r => r.value), workCount: work.length, failedEvents, resets};
  } catch { return null; }
}

export function submittedP062ZeroPlaceProductEvidence(task, model, record, context) {
  if (!latestSubmissionMatches(model, record)) return null;
  return replayP062ZeroPlaceProductEvidence(task, model, context);
}
