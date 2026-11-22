// #343: read the 130° angle after aligning the original B39 protractor.
import * as original from './phase5/b25-model.js';
import {
  hasExactKeys, latestSubmissionMatches, matchesNativeEvidenceTask, sameEvidence
} from './evidence-contract.js';

export const SOURCE = Object.freeze({
  sessionId: 'representations39', index: 3, nodeId: 'mt_IwEOCN6bL1', type: 'x-g25-protractor',
  taskHash: '22361ebcab22ac8165f67ff67a8c8d3221ff90efe1140fed0e872c139beebc9a'
});

const offsets = new Map([['left', [-20, 0]], ['right', [20, 0]], ['up', [0, -20]], ['down', [0, 20]]]);
const initial = () => ({x: -40, y: 20, rotation: 180, drawn: null});

export function binding(task, context) {
  return context?.sessionId === SOURCE.sessionId && context.index === SOURCE.index &&
    task?.mode === 'measure' && task.amount === 130 &&
    matchesNativeEvidenceTask(task, context, SOURCE) ? {nodeId: SOURCE.nodeId, method: null} : null;
}

export function replay(task, model, context) {
  try {
    const blank = original.initial(task, 1);
    if (!binding(task, context) || !hasExactKeys(model, Object.keys(blank)) ||
        !original.valid(task, model) || !original.inspect(task, model).correct ||
        !['angle', 'length', 'base', 'a', 'b', 'other', 'prose'].every(key => model[key] === blank[key])) return null;

    let board = initial();
    let issue = '';
    const first = {};
    const events = [];
    for (const event of model.history) {
      if (!hasExactKeys(event, ['a', 'd', 'f']) || !hasExactKeys(event.f, [])) return null;
      issue = '';
      if (event.a === 'move') {
        if (!hasExactKeys(event.d, ['index']) || !offsets.has(event.d.index)) return null;
        const [dx, dy] = offsets.get(event.d.index);
        const next = {x: board.x + dx, y: board.y + dy};
        if (Math.abs(next.x) <= 100 && Math.abs(next.y) <= 100) Object.assign(board, next);
        else issue = '量角器先留在画面里。';
      } else if (event.a === 'flip' || event.a === 'reset') {
        if (!hasExactKeys(event.d, [])) return null;
        if (event.a === 'flip') board.rotation = (board.rotation + 180) % 360;
        else board = initial();
      } else return null;
      first[event.a] ??= {};
      events.push({action: event.a, direction: event.d.index ?? null, ...board, accepted: !issue});
    }

    if (!sameEvidence({first, ...board}, model.board) || model.issue !== issue ||
        board.x !== 0 || board.y !== 0 || board.rotation !== 0) return null;
    const angle = task.amount * Math.PI / 180;
    const displayedDegrees = Math.round(Math.atan2(Math.sin(angle), Math.cos(angle)) * 180 / Math.PI);
    if (!sameEvidence(model.answers, [String(displayedDegrees)])) return null;
    return {...SOURCE, method: null, alignedCenter: [board.x, board.y], zeroLineRotationDegrees: board.rotation,
      displayedDegrees, recordedAnswer: model.answers[0], events};
  } catch {
    return null;
  }
}

export function submitted(task, model, record, context) {
  return latestSubmissionMatches(model, record) ? replay(task, model, context) : null;
}
