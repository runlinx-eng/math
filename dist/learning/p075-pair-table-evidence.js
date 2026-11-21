import {initial, inspect, valid, number} from './phase5/b15-model.js';
import {hasExactKeys, isEvidenceContext, latestSubmissionMatches, matchesNativeEvidenceTask, sameEvidence} from './evidence-contract.js';

const type = 'x-pairtable';
const REVIEWED = Object.freeze([
  {
    "sessionId": "scaleandpair",
    "index": 1,
    "nodeId": "mt_EmR5n58jZt",
    "type": "x-pairtable",
    "taskHash": "e69f3bae4933da13648e661c87b09e211db4359a8c7f5ecd9b1b64bf1952fdc8",
    "task": {
      "type": "x-pairtable",
      "rows": [
        "红上衣",
        "蓝上衣",
        "白上衣",
        "绿上衣"
      ],
      "cols": [
        "长裤",
        "短裤",
        "背带裤"
      ],
      "prompt": "4件上衣各配3种裤子。亲手留下每一种搭配，不漏，也不重复。"
    },
    "question": "为什么 4 件上衣配 3 种裤子共有 4×3 = 12 种不重复搭配？"
  },
  {
    "sessionId": "combineproducts",
    "index": 2,
    "nodeId": "mt_AR-K72OIIO",
    "type": "x-pairtable",
    "taskHash": "85aa0bb0acb0cb000c4203fb0c024d59088188368fc5d85d9eb6f3f8e7af8008",
    "task": {
      "type": "x-pairtable",
      "rows": [
        "白面包",
        "全麦",
        "圆面包"
      ],
      "cols": [
        "鸡蛋",
        "奶酪",
        "番茄",
        "蘑菇"
      ],
      "prompt": "3种面包各配4种馅。每种组合只留一次。"
    },
    "question": "为什么 3 种面包配 4 种馅同样是 3×4 = 12 种组合？"
  }
]);
export const P075_SOURCES = Object.freeze(REVIEWED.map(({sessionId, index, nodeId, type: t, taskHash}) => Object.freeze({sessionId, index, nodeId, type: t, taskHash})));

export function p075PairTableBinding(task, context) {
  if (!isEvidenceContext(context)) return null;
  const entry = REVIEWED.find(e => e.sessionId === context.sessionId && e.index === context.index);
  if (!entry || !sameEvidence(task, entry.task) || !matchesNativeEvidenceTask(task, context, {type, nodeId: entry.nodeId})) return null;
  return {nodeId: entry.nodeId, kind: 'p075-pair-table', method: null, question: entry.question};
}

export function replayP075PairTableEvidence(task, model, context) {
  try {
    const binding = p075PairTableBinding(task, context);
    if (!binding || !hasExactKeys(model, Object.keys(initial(task))) || !valid(task, model) ||
        model.issue !== '' || !model.history.length || Object.keys(model.history).length !== model.history.length) return null;
    let left = null, duplicateAttempts = 0, resets = 0;
    const pairs = [];
    for (const {action, data} of model.history) {
      if (data.value !== null) return null;
      const index = data.index;
      if (action === 'b15-reset' && index === null) {
        left = null;
        pairs.length = 0;
        resets++;
      } else if (action === 'b15-left' && Number.isInteger(index) && index >= 0 && index < task.rows.length) {
        left = index;
      } else if (action === 'b15-pair' && left !== null &&
          Number.isInteger(index) && index >= 0 && index < task.cols.length) {
        const key = left + ',' + index;
        if (pairs.includes(key)) duplicateAttempts++;
        else pairs.push(key);
      } else {
        return null;
      }
    }
    const total = task.rows.length * task.cols.length;
    if (left !== model.board.left || pairs.length !== total || !sameEvidence(pairs, model.board.pairs) ||
        number(model.answer) !== total || !inspect(task, model).correct) return null;
    return {binding, rows: task.rows.length, cols: task.cols.length, total, duplicateAttempts, resets};
  } catch { return null; }
}

export function submittedP075PairTableEvidence(task, model, record, context) {
  if (!latestSubmissionMatches(model, record)) return null;
  return replayP075PairTableEvidence(task, model, context);
}
