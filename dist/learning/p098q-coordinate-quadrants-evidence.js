import {initial, rat, valid} from './phase5/b36-model.js';
import {hasExactKeys, latestSubmissionMatches, matchesNativeEvidenceTask, sameEvidence} from './evidence-contract.js';

export const P098Q_SOURCES = Object.freeze([
  {
    "sessionId": "coords36",
    "index": 0,
    "nodeId": "mt_hVpGOEz2kG",
    "type": "x-f36-coord",
    "taskHash": "589166c0a45889b60c4d6da5e87a00f541564f284f28072b883af654f88be810"
  },
  {
    "sessionId": "coords36",
    "index": 1,
    "nodeId": "mt_hVpGOEz2kG",
    "type": "x-f36-coord",
    "taskHash": "e4081a575bca1c85b75e7711caa0d66be6526ccca12af5ebfa924a9c41f38514"
  },
  {
    "sessionId": "coords36",
    "index": 2,
    "nodeId": "mt_hVpGOEz2kG",
    "type": "x-f36-coord",
    "taskHash": "2d0259ffa7b2d6f2863ac4ebc0a4a3bf2262c3a83e5a3ec2ff1fa9d391f2283d"
  }
].map(Object.freeze));

export function p098qCoordinateQuadrantsBinding(task, context) {
  const row = P098Q_SOURCES.find(source => source.sessionId === context?.sessionId && source.index === context?.index);
  if (!row || !matchesNativeEvidenceTask(task, context, row)) return null;
  return {nodeId: row.nodeId, kind: 'p098q-coordinate-quadrants', method: null, question: '怎样从横纵坐标的正负和零判断位置？'};
}

function halfGrid(raw) {
  const pair = rat(raw);
  if (!pair || 2 % pair[1] !== 0) return null;
  return pair[0] * (2 / pair[1]);
}

function region([x,y]) {
  if (x === 0 || y === 0) return 'axis';
  if (y > 0) return x > 0 ? 'first' : 'second';
  return x < 0 ? 'third' : 'fourth';
}

export function replayP098QCoordinateQuadrantsEvidence(task, model, context) {
  try {
    const binding = p098qCoordinateQuadrantsBinding(task, context);
    if (!binding || !hasExactKeys(model, Object.keys(initial(task))) || !valid(task, model) ||
        model.issue !== '' || Object.keys(model.history).length !== model.history.length) return null;
    const targets = task.targets.map(([x,y]) => [x * 2,y * 2]);
    const ticks = [];
    for (const event of model.history) {
      if (!hasExactKeys(event, ['a','i','v','w','z']) || event.i !== '') return null;
      if (event.a === 'undo') {
        ticks.pop();
        continue;
      }
      if (event.a !== 'point') return null;
      const x = halfGrid(event.v);
      const y = halfGrid(event.w);
      if (!targets.some(([tx,ty]) => x === tx && y === ty)) continue;
      if (!ticks.some(([tx,ty]) => x === tx && y === ty)) ticks.push([x,y]);
    }
    const points = ticks.map(([x,y]) => [x / 2,y / 2]);
    if (ticks.length !== targets.length || !sameEvidence(points, model.board.points)) return null;
    const classification = region(targets[context.index === 0 ? 1 : 0]);
    if (model.answers[0].trim() !== classification) return null;
    return {...binding, points, classification};
  } catch {
    return null;
  }
}

export function submittedP098QCoordinateQuadrantsEvidence(task, model, record, context) {
  return latestSubmissionMatches(model, record) ? replayP098QCoordinateQuadrantsEvidence(task, model, context) : null;
}
