import {number} from './phase5/b20-model.js';
import {initial, inspect, valid} from './phase5/b26-model.js';
import {hasExactKeys, isEvidenceContext, latestSubmissionMatches, matchesNativeEvidenceTask, sameEvidence} from './evidence-contract.js';

const sessionId = 'pythagoras', index = 0, nodeId = 'mt_1VmTUxBrNd', type = 'x-g26-area';
const taskHash = "8f559c38faf512463c188b7ff76fd16ea9936a81445d35b8b0250fdeff512e94", reviewed = {"type":"x-g26-area","prompt":"先找直角对面的边，比较三个正方形；再把整个三角形放大两倍。","a":3,"b":4,"questions":[{"label":"原大小时两个小正方形面积之和","value":25},{"label":"放大两倍后面积之和","value":100}]};
export const P064_SOURCES = Object.freeze([Object.freeze({sessionId, index, nodeId, type, taskHash})]);

export function p064PythagorasAreaBinding(task, context) {
  if (!isEvidenceContext(context) || context.sessionId !== sessionId || context.index !== index ||
      !sameEvidence(task, reviewed) || !matchesNativeEvidenceTask(task, context, {type, nodeId})) return null;
  return {nodeId, kind: 'p064-pythagoras-area', method: null, question: '为什么 3-4-5 直角三角形放大两倍后，两个小正方形面积之和从 25 变成 100，仍等于斜边正方形面积？'};
}

export function replayP064PythagorasAreaEvidence(task, model, context) {
  try {
    const binding = p064PythagorasAreaBinding(task, context);
    if (!binding || !hasExactKeys(model, Object.keys(initial(task))) || !valid(task, model) ||
        model.issue !== '' || !model.history.length || Object.keys(model.history).length !== model.history.length) return null;
    let hyp = null, scale = 1, lastIssue = '', resets = 0, failed = 0;
    const seen = [];
    for (const ev of model.history) {
      if (!hasExactKeys(ev, ['a', 'f', 'd'])) return null;
      lastIssue = '';
      if (ev.a === 'reset' && hasExactKeys(ev.f, []) && hasExactKeys(ev.d, [])) { hyp = null; scale = 1; seen.length = 0; resets++; }
      else if (ev.a === 'hyp' && hasExactKeys(ev.f, []) && hasExactKeys(ev.d, ['index']) && /^[0-2]$/.test(ev.d.index)) { hyp = Number(ev.d.index); }
      else if (ev.a === 'scale' && hasExactKeys(ev.f, ['scale']) && hasExactKeys(ev.d, [])) {
        const v = number(ev.f.scale); if ([1, 2].includes(v)) scale = v; else { lastIssue = 'bad'; failed++; }
      } else if (ev.a === 'look' && hasExactKeys(ev.f, []) && hasExactKeys(ev.d, [])) {
        if (hyp !== 1) { lastIssue = 'bad'; failed++; } else if (!seen.includes(scale)) seen.push(scale);
      } else return null;
    }
    const sum1 = task.a * task.a + task.b * task.b, sum2 = (task.a * 2) ** 2 + (task.b * 2) ** 2;
    if (lastIssue !== '' || hyp !== 1 || !seen.includes(1) || !seen.includes(2) ||
        model.board.hyp !== 1 || !sameEvidence(seen, model.board.seen) ||
        number(model.answers[0]) !== sum1 || number(model.answers[1]) !== sum2 || !inspect(task, model).correct) return null;
    return {binding, sums: [sum1, sum2], seen, resets, failed};
  } catch { return null; }
}

export function submittedP064PythagorasAreaEvidence(task, model, record, context) {
  if (!latestSubmissionMatches(model, record)) return null;
  return replayP064PythagorasAreaEvidence(task, model, context);
}
