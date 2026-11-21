import {number} from './phase5/b20-model.js';
import {boundaryRuns, perimeter} from './phase5/b30-geometry.js';
import {initial, inspect, valid} from './phase5/b30-model.js';
import {hasExactKeys, isEvidenceContext, latestSubmissionMatches, matchesNativeEvidenceTask, sameEvidence} from './evidence-contract.js';

const sessionId = 'multiShape38', index = 1, nodeId = 'mt_SmghasIvbT', type = 'x-a30-grid';
const taskHash = "3d67e040b458696577c6cfbbe4511d065ad96e6d629a6487d330fabff2735bfe", reviewed = {"type":"x-a30-grid","prompt":"长 8 cm、宽 5 cm。沿外边逐段走一圈。","w":8,"h":5,"cells":[[0,0],[1,0],[2,0],[3,0],[4,0],[5,0],[6,0],[7,0],[0,1],[1,1],[2,1],[3,1],[4,1],[5,1],[6,1],[7,1],[0,2],[1,2],[2,2],[3,2],[4,2],[5,2],[6,2],[7,2],[0,3],[1,3],[2,3],[3,3],[4,3],[5,3],[6,3],[7,3],[0,4],[1,4],[2,4],[3,4],[4,4],[5,4],[6,4],[7,4]],"mode":"edge","unit":"cm"};
export const P070_SOURCES = Object.freeze([Object.freeze({sessionId, index, nodeId, type, taskHash})]);

export function p070PerimeterWalkBinding(task, context) {
  if (!isEvidenceContext(context) || context.sessionId !== sessionId || context.index !== index ||
      !sameEvidence(task, reviewed) || !matchesNativeEvidenceTask(task, context, {type, nodeId})) return null;
  return {nodeId, kind: 'p070-perimeter-walk', method: null, question: '为什么长 8 cm、宽 5 cm 的长方形沿外边走一圈的周长是 8+5+8+5 = 26 cm？'};
}

export function replayP070PerimeterWalkEvidence(task, model, context) {
  try {
    const binding = p070PerimeterWalkBinding(task, context);
    if (!binding || !hasExactKeys(model, Object.keys(initial(task))) || !valid(task, model) ||
        model.issue !== '' || !model.history.length || Object.keys(model.history).length !== model.history.length) return null;
    const runs = boundaryRuns(task.cells), edges = [];
    let undos = 0, clears = 0;
    for (const ev of model.history) {
      if (!hasExactKeys(ev, ['a', 'i', 'f']) || !hasExactKeys(ev.f, [])) return null;
      if (ev.a === 'edge' && /^\d+$/.test(ev.i) && ev.i === String(Number(ev.i)) && Number(ev.i) < runs.length) {
        const idx = Number(ev.i), pos = edges.indexOf(idx);
        if (pos >= 0) edges.splice(pos, 1); else edges.push(idx);
      } else if (ev.a === 'undo' && ev.i === '') { if (edges.length) { edges.pop(); undos++; } }
      else if (ev.a === 'clear' && ev.i === '') { edges.length = 0; clears++; }
      else return null;
    }
    const allRuns = Array.from({length: runs.length}, (_, i) => i), exactPerimeter = 2 * (task.w + task.h);
    if (!sameEvidence(edges, model.board.edges) || !sameEvidence([...edges].sort((a,b)=>a-b), allRuns)) return null;
    if (exactPerimeter !== perimeter(task.cells) || number(model.perimeter) !== exactPerimeter || model.unit !== task.unit || !inspect(task, model).correct) return null;
    return {binding, width: task.w, height: task.h, boundaryCount: runs.length, perimeter: exactPerimeter, unit: task.unit, undos, clears};
  } catch { return null; }
}

export function submittedP070PerimeterWalkEvidence(task, model, record, context) {
  if (!latestSubmissionMatches(model, record)) return null;
  return replayP070PerimeterWalkEvidence(task, model, context);
}
