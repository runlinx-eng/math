import {initial, inspect, valid} from './phase5/b14-model.js';
import {hasExactKeys, isEvidenceContext, latestSubmissionMatches, matchesNativeEvidenceTask, sameEvidence} from './evidence-contract.js';
import {number} from './phase5/b14-model.js';

const reviewed = [
  {
    "sessionId": "factorcode",
    "index": 0,
    "nodeId": "mt_bZC-wqWX7Y",
    "type": "x-multisheet",
    "taskHash": "c64e95f3e9dcb84338bf5f6bd6ac7f9b765ccc79bd76630253f886cd1a4f06d8",
    "task": {
      "type": "x-multisheet",
      "step": 6,
      "rows": 5,
      "highlight": 0,
      "prompt": "先做准备：第一格放6，下一格从前一格再加6。把规则延续到第五格。"
    }
  },
  {
    "sessionId": "factorcode",
    "index": 2,
    "nodeId": "mt_bZC-wqWX7Y",
    "type": "x-multisheet",
    "taskHash": "02cc487f0162817217469b0c4febffd4f77fa750a99d163ce6dbb934633fb987",
    "task": {
      "type": "x-multisheet",
      "step": 6,
      "rows": 10,
      "highlight": 4,
      "prompt": "让表格列出6的前十个正倍数，再点亮其中也能被4整除的格子。"
    }
  }
];
export const P043_SOURCES = Object.freeze(reviewed.map(({task, ...source}) => Object.freeze(source)));
export function p043MultipleSheetBinding(task, context) {
  if (!isEvidenceContext(context)) return null;
  const entry = reviewed.find(source => source.sessionId === context.sessionId && source.index === context.index);
  if (!entry || !sameEvidence(task, entry.task) || !matchesNativeEvidenceTask(task, context, entry)) return null;
  return {nodeId:entry.nodeId, kind:'p043-multiple-sheet', method:null, question:"为什么表格要每次加 6？点亮的数还满足什么条件？"};
}
export function replayP043MultipleSheetEvidence(task, model, context) {
  try {
    const binding = p043MultipleSheetBinding(task, context);
    if (!binding || !hasExactKeys(model, Object.keys(initial(task))) || !valid(task, model) ||
        model.issue !== '' || !model.history.length || Object.keys(model.history).length !== model.history.length) return null;
    const expected = Array.from({length:task.rows}, (_, i) => (i + 1) * task.step);
    const expectedSelected = task.highlight ? expected.flatMap((value, i) => value % task.highlight === 0 ? [i] : []) : [];
    let values = [];
    let formula = null;
    const selected = new Set();
    let failedRules = 0;
    let issue = false;
    const fields = Object.keys(initial(task)).filter(key => !['board','history','issue'].includes(key));
    for (const event of model.history) {
      if (!hasExactKeys(event, ['action','data']) || !hasExactKeys(event.data, ['fields','index','side','value']) ||
          !hasExactKeys(event.data.fields, fields) || event.data.index !== null || event.data.side !== null) return null;
      const {fields: input, value} = event.data;
      issue = false;
      if (event.action === 'b14-reset' && value === null) {
        values = [];
        formula = null;
        selected.clear();
      } else if (event.action === 'b14-sheet' && value === null) {
        const rule = input.formula.toUpperCase().replace(/\s/g, '');
        const terms = /^=(?:A1\+(\d+)|(\d+)\+A1)$/.exec(rule);
        if (number(input.start) !== task.step || !terms || Number(terms[1] ?? terms[2]) !== task.step) {
          failedRules++;
          issue = true;
        } else {
          formula = rule;
          values = [...expected];
          selected.clear();
        }
      } else if (event.action === 'b14-select' && Number.isInteger(value) && value >= 0 && value < task.rows) {
        if (values.length && !selected.delete(value)) selected.add(value);
      } else return null;
    }
    if (issue || !formula || number(model.start) !== task.step ||
        model.formula.toUpperCase().replace(/\s/g, '') !== formula ||
        !sameEvidence({values,formula,selected:[...selected]}, model.board) ||
        (task.highlight && !sameEvidence([...selected].sort((a,b) => a-b), expectedSelected)) ||
        !inspect(task, model).correct) return null;
    return {binding, values, commonMultiples:expectedSelected.map(index => values[index]), failedRules};

  } catch {
    return null;
  }
}
export function submittedP043MultipleSheetEvidence(task, model, record, context) {
  return latestSubmissionMatches(model, record) ? replayP043MultipleSheetEvidence(task, model, context) : null;
}
