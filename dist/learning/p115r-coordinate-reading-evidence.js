import {initial, valid} from './phase5/b24-model.js';
import {hasExactKeys, latestSubmissionMatches, matchesNativeEvidenceTask, sameEvidence} from './evidence-contract.js';

export const P115R_SOURCES = Object.freeze([
  {
    "sessionId": "pointread",
    "index": 0,
    "nodeId": "mt_jBQS-CicNn",
    "type": "x-p24-read",
    "taskHash": "b27ce8505b2df48d80b580c82ea422c1b66beb94c5cfabb26f886d50d82631a3"
  },
  {
    "sessionId": "pointread",
    "index": 1,
    "nodeId": "mt_jBQS-CicNn",
    "type": "x-p24-read",
    "taskHash": "d50e2a62721a213fa4fb0535557ddbf236be9c33669fee63d6fcd64b8e34244a"
  },
  {
    "sessionId": "pointread",
    "index": 2,
    "nodeId": "mt_jBQS-CicNn",
    "type": "x-p24-read",
    "taskHash": "2d09b274777fc74759bc22c80b06d1e165f1c2a877d7a8a6a0c2181113e426a4"
  },
  {
    "sessionId": "pointstory",
    "index": 2,
    "nodeId": "mt_snlqRCiA1R",
    "type": "x-p24-read",
    "taskHash": "a1e476eb30cafd234793f908b985ec61ad47d93e5ee868a095cce94049dc7a7b"
  }
].map(Object.freeze));

function equalsInteger(raw, expected) {
  const value = raw.trim();
  const decimal = /^(\d+)(?:\.0+)?$/.exec(value);
  if (decimal) return BigInt(decimal[1]) === BigInt(expected);
  const fraction = /^(?:(\d+)\s+)?(\d+)\/(\d+)$/.exec(value);
  if (!fraction) return false;
  const denominator = BigInt(fraction[3]);
  return denominator > 0n && (BigInt(fraction[1] || '0') - BigInt(expected)) * denominator + BigInt(fraction[2]) === 0n;
}

export function p115rCoordinateReadingBinding(task, context) {
  const row = P115R_SOURCES.find(source => source.sessionId === context?.sessionId && source.index === context?.index);
  if (!row || !matchesNativeEvidenceTask(task, context, row)) return null;
  return {nodeId: row.nodeId, kind: 'p115r-coordinate-reading', method: null, question: '每个点的第一个数和第二个数各表示什么？'};
}

export function replayP115RCoordinateReadingEvidence(task, model, context) {
  try {
    const binding = p115rCoordinateReadingBinding(task, context);
    if (!binding || !hasExactKeys(model, Object.keys(initial(task, 1))) || !valid(task, model) ||
        model.issue !== '' || Object.keys(model.history).length !== model.history.length) return null;

    const readings = task.points.map(() => null);
    for (const event of model.history) {
      if (!hasExactKeys(event, ['a','f','d']) || !hasExactKeys(event.d, [])) return null;
      if (event.a === 'reset' && hasExactKeys(event.f, [])) {
        readings.fill(null);
        continue;
      }
      if (event.a !== 'record' || !hasExactKeys(event.f, ['item','x','y']) || !/^\d+$/.test(event.f.item)) return null;
      const {item,x,y} = event.f;
      const i = Number(item);
      if (i >= readings.length) return null;
      readings[i] = {x,y};
    }
    if (!sameEvidence(readings, model.board.readings)) return null;
    if (!readings.every((reading, i) => reading && equalsInteger(reading.x, task.points[i][0]) &&
        equalsInteger(reading.y, task.points[i][1]))) return null;
    if (!/^\d+$/.test(model.item)) return null;
    const selected = readings[Number(model.item)];
    if (!selected || selected.x !== model.x || selected.y !== model.y) return null;

    if (task.polygon) {
      if (!equalsInteger(model.answers[0], readings.length)) return null;
    } else {
      const expected = task.axisNames ? 'meaning' : readings.length === 1 ? 'x' : 'different';
      if (model.answers[0] !== expected) return null;
    }
    return {...binding, points: task.points.map(point => [...point])};
  } catch {
    return null;
  }
}

export function submittedP115RCoordinateReadingEvidence(task, model, record, context) {
  return latestSubmissionMatches(model, record) ? replayP115RCoordinateReadingEvidence(task, model, context) : null;
}
