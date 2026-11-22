import {initial, number, valid} from './phase5/b13-model.js';
import {hasExactKeys, latestSubmissionMatches, matchesNativeEvidenceTask, sameEvidence} from './evidence-contract.js';

export const P107R_SOURCES = Object.freeze([
  {
    "sessionId": "factorlab",
    "index": 0,
    "nodeId": "mt_FHIAv6dfhU",
    "type": "x-factorrects",
    "taskHash": "ff89024af2052faa14649d37531ef1de7a1f3d64d2c1b0ca2284a39df21e91d9"
  },
  {
    "sessionId": "term38",
    "index": 0,
    "nodeId": "mt_xfwv0M83mJ",
    "type": "x-factorrects",
    "taskHash": "3565ef221b2242c95b06538b5bb4337ed2408bffbe99bc8e115f49b87ab808b0"
  }
].map(Object.freeze));

export function p107rFactorRectanglesBinding(task, context) {
  const source = P107R_SOURCES.find(row => row.sessionId === context?.sessionId && row.index === context?.index);
  if (!source || !matchesNativeEvidenceTask(task,context,source)) return null;
  return {nodeId:source.nodeId, kind:'p107r-factor-rectangles', method:null, question:'怎么知道长方形都找齐了，转过来的有没有数重？'};
}

export function replayP107RFactorRectanglesEvidence(task, model, context) {
  try {
    const binding = p107rFactorRectanglesBinding(task,context);
    if (!binding || !hasExactKeys(model,Object.keys(initial(task))) || !valid(task,model) ||
        model.issue !== '' || Object.keys(model.history).length !== model.history.length) return null;
    const expected = [];
    for (let rows = 1; rows * rows <= task.n; rows++) {
      if (task.n % rows === 0) expected.push([rows,task.n/rows]);
    }
    let pairs = [];
    for (const {action,data} of model.history) {
      if (data.index !== null || data.bucket !== null || data.token !== null) return null;
      if (action === 'b13-reset') {
        pairs = [];
        continue;
      }
      if (action !== 'b13-pair-save') return null;
      const rows = number(data.rows);
      const cols = number(data.cols);
      if (rows * cols !== task.n || number(data.answer) !== task.n) continue;
      const short = Math.min(rows,cols);
      if (!pairs.some(([first]) => first === short)) pairs.push([short,Math.max(rows,cols)]);
    }
    if (!sameEvidence(pairs,model.board.pairs) ||
        !sameEvidence([...pairs].sort((a,b)=>a[0]-b[0]),expected)) return null;
    return {...binding,pairs:expected};
  } catch {
    return null;
  }
}

export function submittedP107RFactorRectanglesEvidence(task, model, record, context) {
  return latestSubmissionMatches(model,record) ? replayP107RFactorRectanglesEvidence(task,model,context) : null;
}
