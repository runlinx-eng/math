import {initial, valid} from './phase5/b24-model.js';
import {hasExactKeys, latestSubmissionMatches, matchesNativeEvidenceTask, sameEvidence} from './evidence-contract.js';

const nodeId = 'mt_h7zVgCDVmx';
export const P115D_SOURCES = Object.freeze([
  '35fabaa46e93299ef0becd3de92d4e874e8b70b1ebcf55a93cb01eeef1955b18',
  '31269dcc46821781bb2d78994f1d530ddd1ef3b2cc5df6046f666bba049abd02',
].map((taskHash, i) => Object.freeze({
  sessionId: 'pointdistance', index: i + 1, nodeId, type: 'x-p24-distance', taskHash,
})));

export function p115dCoordinateDistanceBinding(task, context) {
  const source = P115D_SOURCES.find(row => row.sessionId === context?.sessionId && row.index === context?.index);
  if (!source || !matchesNativeEvidenceTask(task, context, source)) return null;
  return {nodeId, kind: 'p115d-coordinate-distance', method: null, question: '两点相距几格？过零时怎样数，怎样把格数换成米？'};
}

function equalsLength(raw, length) {
  const value = raw.trim();
  const decimal = /^(\d+)(?:\.0+)?$/.exec(value);
  if (decimal) return BigInt(decimal[1]) === BigInt(length);
  const fraction = /^(?:(\d+)\s+)?(\d+)\/(\d+)$/.exec(value);
  if (!fraction) return false;
  const denominator = BigInt(fraction[3]);
  return denominator > 0n && (BigInt(fraction[1] || '0') - BigInt(length)) * denominator + BigInt(fraction[2]) === 0n;
}

export function replayP115DCoordinateDistanceEvidence(task, model, context) {
  try {
    const binding = p115dCoordinateDistanceBinding(task, context);
    if (!binding || !hasExactKeys(model, Object.keys(initial(task, 1))) ||
        !valid(task, model) || model.issue !== '' ||
        Object.keys(model.history).length !== model.history.length) return null;

    const measured = new Set();
    for (const event of model.history) {
      if (!hasExactKeys(event, ['a', 'f', 'd']) || !hasExactKeys(event.f, [])) return null;
      if (event.a === 'reset' && hasExactKeys(event.d, [])) {
        measured.clear();
        continue;
      }
      if (event.a !== 'measure' || !hasExactKeys(event.d, ['index']) || !/^(0|[1-9]\d*)$/.test(event.d.index)) return null;
      const i = Number(event.d.index);
      if (i >= task.segments.length) return null;
      measured.add(i);
    }
    if (measured.size !== task.segments.length || !sameEvidence([...measured], model.board.measured)) return null;

    const gridLengths = [];
    const unitsPerGrid = context.index === 2 ? 100 : 1;
    for (const [index, [first, second]] of task.segments.entries()) {
      const [x1, y1] = task.points[first];
      const [x2, y2] = task.points[second];
      if (x1 !== x2 && y1 !== y2) return null;
      const cells = Math.abs(x2 - x1) + Math.abs(y2 - y1);
      if (!equalsLength(model.answers[index], cells * unitsPerGrid)) return null;
      gridLengths.push(cells);
    }
    return {...binding, gridLengths, unitsPerGrid};
  } catch {
    return null;
  }
}

export function submittedP115DCoordinateDistanceEvidence(task, model, record, context) {
  return latestSubmissionMatches(model, record) ? replayP115DCoordinateDistanceEvidence(task, model, context) : null;
}
