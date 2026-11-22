import {equal, initial, number, valid} from './phase5/b16-model.js';
import {equivalent, norm} from './phase5/b15-model.js';
import {hasExactKeys, latestSubmissionMatches, matchesNativeEvidenceTask, sameEvidence} from './evidence-contract.js';

export const P098G_SOURCES = Object.freeze([
  {
    "sessionId": "viewlinks",
    "index": 3,
    "nodeId": "mt_CUmjcE7W6c",
    "type": "x-graphpoints",
    "taskHash": "ec39e4f3adf1e07ce50e903d9677a3c964c714c3c164fd53ecd0ff9231b0abbe"
  },
  {
    "sessionId": "representationmap",
    "index": 1,
    "nodeId": "mt_9KmVWCuh5_",
    "type": "x-graphpoints",
    "taskHash": "55cce1e7c3ab037bac0336d8016fd1aaedbd5c98890d960e56cb6af58611a531"
  },
  {
    "sessionId": "model35",
    "index": 1,
    "nodeId": "mt_z5iwdZyeDr",
    "type": "x-graphpoints",
    "taskHash": "3fa33ec5d7f8ea4f07b77dea514643acbb49fb6333c1f5757f1fb52a6464e26f"
  }
].map(Object.freeze));

export function p098gGraphPointsBinding(task, context) {
  const row = P098G_SOURCES.find(source => source.sessionId === context?.sessionId && source.index === context?.index);
  if (!row || !matchesNativeEvidenceTask(task, context, row)) return null;
  return {nodeId: row.nodeId, kind: 'p098g-graph-points', method: null, question: '横轴每增加一份，纵轴的量怎样变？'};
}

function differenceMatches(model, selected, task) {
  if (selected.length !== 2 || !task.read.every(index => selected.includes(index))) return false;
  const [low,high] = selected.map(index => task.data[index][1]).sort((a,b)=>a-b);
  if (!equal(model.answer,high-low)) return false;
  const sides = model.equation.split('=');
  if (sides.length !== 2) return false;
  const subtraction = `${high}-${low}`;
  return [sides,[...sides].reverse()].some(([left,right]) =>
    (norm(left) === subtraction || equivalent(left,subtraction)) && equal(right,high-low));
}

export function replayP098GGraphPointsEvidence(task, model, context) {
  try {
    const binding = p098gGraphPointsBinding(task, context);
    if (!binding || !hasExactKeys(model,Object.keys(initial(task))) || !valid(task,model) ||
        model.issue !== '' || Object.keys(model.history).length !== model.history.length) return null;
    let points = [];
    let selected = [];
    for (const event of model.history) {
      if (!hasExactKeys(event,['action','data'])) return null;
      const {action,data} = event;
      if (action === 'reset' && hasExactKeys(data,['fields'])) {
        points = [];
        selected = [];
      } else if (action === 'plot' && hasExactKeys(data,['fields'])) {
        const x = number(data.fields.x);
        const y = number(data.fields.y);
        if (!Number.isInteger(x) || !Number.isInteger(y) || x < 0 || x > task.maxX || y < 0 || y > task.maxY) continue;
        points = points.filter(([previous]) => previous !== x);
        points.push([x,y]);
      } else if (action === 'readpoint' && hasExactKeys(data,['index','fields']) && /^\d+$/.test(data.index)) {
        const i = Number(data.index);
        if (i >= task.data.length) return null;
        selected = selected.includes(i) ? selected.filter(index => index !== i) : [...selected,i];
      } else {
        return null;
      }
    }
    if (!sameEvidence(points,model.board.points) || !sameEvidence(selected,model.board.selected) ||
        points.length !== task.data.length || !task.data.every(([x,y]) => points.some(([px,py]) => x === px && y === py))) return null;
    if (task.read) {
      if (!differenceMatches(model,selected,task)) return null;
    } else {
      const [origin,next] = task.data;
      const rise = next[1]-origin[1];
      const run = next[0]-origin[0];
      if (!run || model.reason !== 'per-x' || !equal(model.answer,rise,run) ||
          !task.data.every(([x,y]) => (y-origin[1])*run === (x-origin[0])*rise)) return null;
    }
    return {...binding,points:task.data.map(point => [...point]),selected};
  } catch {
    return null;
  }
}

export function submittedP098GGraphPointsEvidence(task, model, record, context) {
  return latestSubmissionMatches(model, record) ? replayP098GGraphPointsEvidence(task, model, context) : null;
}
