import {number} from './phase5/b20-model.js';
import {initial, inspect, valid} from './phase5/b25-model.js';
import {hasExactKeys, isEvidenceContext, latestSubmissionMatches, matchesNativeEvidenceTask, sameEvidence} from './evidence-contract.js';

const sessionId = 'trianglepossible', index = 3, nodeId = 'mt_4bc3EAxhlY', type = 'x-g25-similar';
const taskHash = "0275053a800c5615c242a39b16b4c22cd1d1267b108380ce514c2cdb24cd6abb", reviewed = {"type":"x-g25-similar","prompt":"两块三角形的角都是50°、60°、70°。把第二块变成两倍大小。","questions":[{"label":"三个角都相同","value":"many","options":[["many","可以有大小不同的许多三角形"],["one","一定大小相同"]]}]};
export const P065_SOURCES = Object.freeze([Object.freeze({sessionId, index, nodeId, type, taskHash})]);

export function p065SimilarTrianglesBinding(task, context) {
  if (!isEvidenceContext(context) || context.sessionId !== sessionId || context.index !== index ||
      !sameEvidence(task, reviewed) || !matchesNativeEvidenceTask(task, context, {type, nodeId})) return null;
  return {nodeId, kind: 'p065-similar-triangles', method: null, question: '为什么三个角都是 50°、60°、70° 时，把边长放大到两倍仍保持相同的三个角？'};
}

export function replayP065SimilarTrianglesEvidence(task, model, context) {
  try {
    const binding = p065SimilarTrianglesBinding(task, context);
    if (!binding || !hasExactKeys(model, Object.keys(initial(task))) || !valid(task, model) ||
        model.issue !== '' || !model.history.length || Object.keys(model.history).length !== model.history.length) return null;
    let scale = 1, lastIssue = '', scaleActions = 0;
    for (const ev of model.history) {
      if (!hasExactKeys(ev, ['a', 'f', 'd'])) return null;
      lastIssue = '';
      if (ev.a === 'reset' && hasExactKeys(ev.f, []) && hasExactKeys(ev.d, [])) scale = 1;
      else if (ev.a === 'length' && hasExactKeys(ev.f, ['length']) && hasExactKeys(ev.d, [])) {
        const v = number(ev.f.length);
        if (Number.isFinite(v) && v >= 0.5 && v <= 3) { scale = v; scaleActions++; } else lastIssue = 'bad';
      } else return null;
    }
    if (lastIssue !== '' || !scaleActions || scale !== 2 || model.board.scale !== 2 || number(model.length) !== 2 ||
        model.answers[0] !== 'many' || !inspect(task, model).correct) return null;
    return {binding, scale, scaleActions, answer: model.answers[0]};
  } catch { return null; }
}

export function submittedP065SimilarTrianglesEvidence(task, model, record, context) {
  if (!latestSubmissionMatches(model, record)) return null;
  return replayP065SimilarTrianglesEvidence(task, model, context);
}
