import {initial, rat, valid} from './phase5/b36-model.js';
import {hasExactKeys, latestSubmissionMatches, matchesNativeEvidenceTask, sameEvidence} from './evidence-contract.js';

export const P098R_SOURCES = Object.freeze([Object.freeze({
  sessionId:'plot36', index:2, nodeId:'mt_-3udyo6VyB', type:'x-f36-ratio',
  taskHash:'f039c702661a1ec34711df28a6e6f14e79f9325507e6574a67ef1c8ca874de61',
})]);

export function p098rCoordinateChangeRatioBinding(task, context) {
  const [source] = P098R_SOURCES;
  if (context?.sessionId !== source.sessionId || context?.index !== source.index ||
      !matchesNativeEvidenceTask(task, context, source)) return null;
  return {nodeId:source.nodeId, kind:'p098r-coordinate-change-ratio', method:null, question:'从左点到右点，横向每变一格，纵向变几格？'};
}

export function replayP098RCoordinateChangeRatioEvidence(task, model, context) {
  try {
    const binding = p098rCoordinateChangeRatioBinding(task, context);
    if (!binding || !hasExactKeys(model, Object.keys(initial(task))) || !valid(task, model) ||
        model.issue !== '' || Object.keys(model.history).length !== model.history.length) return null;
    const selected = [];
    for (const event of model.history) {
      if (!hasExactKeys(event,['a','i','v','w','z']) || event.a !== 'select' || !['0','1'].includes(event.i)) return null;
      const i = Number(event.i);
      const index = selected.indexOf(i);
      if (index < 0) selected.push(i);
      else selected.splice(index,1);
    }
    const [left,right] = task.points[0][0] < task.points[1][0] ? [0,1] : [1,0];
    if (!sameEvidence(selected,[left,right]) || !sameEvidence([...selected].sort(),model.board.selected)) return null;
    const dx = task.points[right][0] - task.points[left][0];
    const dy = task.points[right][1] - task.points[left][1];
    const expected = [[dy,1],[dx,1],[dy,dx]];
    if (!model.answers.every((answer,i) => {
      const value = rat(answer);
      return value && value[0] * expected[i][1] === value[1] * expected[i][0];
    })) return null;
    return {...binding, changes:[dy,dx,dy/dx]};
  } catch {
    return null;
  }
}

export function submittedP098RCoordinateChangeRatioEvidence(task, model, record, context) {
  return latestSubmissionMatches(model, record) ? replayP098RCoordinateChangeRatioEvidence(task, model, context) : null;
}
