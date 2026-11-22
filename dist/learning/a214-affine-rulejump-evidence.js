// #343: explicitly recorded arithmetic-sequence rules and evaluations.
import * as original from './phase5/b17-model.js';
import {equal} from './phase5/b16-model.js';
import {
  hasExactKeys,
  isEvidenceContext,
  latestSubmissionMatches,
  matchesNativeEvidenceTask,
  sameEvidence
} from './evidence-contract.js';

export const AFFINE_RULE_SOURCES = Object.freeze([
  Object.freeze({
    sessionId: 'percentpatterns', index: 1, nodeId: 'mt_jCy07DyBNU',
    type: 'x-rulejump', taskHash: 'afae6461733258b1cdfe37054e106266776e758701ff9f2b2bc10096f41b1beb',
    firstTerm: 5, difference: 4
  }),
  Object.freeze({
    sessionId: 'nth35', index: 0, nodeId: 'mt_HRKzwEQJgO',
    type: 'x-rulejump', taskHash: 'b8fb655b62abbb717600bae74f71ecfca675d039be693445a564eb5720432457',
    firstTerm: 3, difference: 4
  }),
  Object.freeze({
    sessionId: 'nth35', index: 2, nodeId: 'mt_HRKzwEQJgO',
    type: 'x-rulejump', taskHash: '7c9a001937058f9c208ba2d7635b560ca126fc000b8241d3a5dc51162ea451b4',
    firstTerm: 4, difference: 3
  })
]);

const fieldNames = Object.keys(original.fields);
const liveFields = new Set(['multiplier', 'offset', 'divisor', 'n', 'answer']);
const ruleFields = ['multiplier', 'offset', 'divisor'];
const actions = new Set(['rule', 'run', 'reset']);

function validFields(fields) {
  return fieldNames.every(key => typeof fields[key] === 'string' && fields[key].length <= 500 &&
    (liveFields.has(key) || fields[key] === original.fields[key]));
}

function sourceFor(task, context) {
  if (!isEvidenceContext(context)) return null;
  const source = AFFINE_RULE_SOURCES.find(row =>
    row.sessionId === context.sessionId && row.index === context.index);
  return source && matchesNativeEvidenceTask(task, context, source) ? source : null;
}

export function affineRulejumpBinding(task, context = {}) {
  const source = sourceFor(task, context);
  return source ? {
    nodeId: source.nodeId, method: null,
    question: '每多一个位置，结果增加多少？检查这条规则能否从位置直接得到已记录的数。'
  } : null;
}

export function replayAffineRulejumpEvidence(task, model, context = {}) {
  try {
    const source = sourceFor(task, context);
    if (!source || !hasExactKeys(model, [...fieldNames, 'board', 'history', 'issue']) ||
        !validFields(model) || !original.valid(task, model) ||
        !original.inspect(task, model).correct) return null;

    let rule = null;
    let first = null;
    let records = [];
    let issue = '';
    const events = [];
    for (const [index, event] of model.history.entries()) {
      if (!hasExactKeys(event, ['a', 'd', 'f']) || !hasExactKeys(event.d, []) ||
          !hasExactKeys(event.f, fieldNames) || !validFields(event.f) || !actions.has(event.a)) return null;
      issue = '';
      if (event.a === 'reset') {
        rule = null;
        records = [];
        events.push({index, action: 'reset'});
      } else if (event.a === 'rule') {
        const entered = ruleFields.map(key => event.f[key]);
        const [multiplier, offset, divisor] = entered.map(Number);
        first ??= entered;
        const accepted = [multiplier, offset, divisor].every(Number.isSafeInteger) &&
          Math.abs(multiplier) <= 1000 && Math.abs(offset) <= 1000 && divisor >= 1 && divisor <= 1000;
        if (accepted) {
          rule = [multiplier, offset, divisor];
          records = [];
        } else {
          issue = '先用这些整数搭一条可计算的规则。';
        }
        events.push({index, action: 'rule', entered, accepted});
      } else {
        if (!rule) return null; // The original Run control is still hidden.
        const n = Number(event.f.n);
        const [multiplier, offset, divisor] = rule;
        const result = event.f.answer;
        const accepted = task.inputs.includes(n) && equal(result, multiplier * n + offset, divisor);
        if (accepted) {
          records = records.filter(record => record.n !== n);
          records.push({n, result});
        } else {
          issue = '把选中的位置或数量放进你自己的规则，记录实际算出的结果。';
        }
        events.push({index, action: 'run', n, result, accepted});
      }
    }

    const valueAt = n => source.firstTerm + source.difference * (n - 1);
    const explicitRule = ruleFields.map(key => model[key].trim());
    if (!rule || !sameEvidence({rule, records, first}, model.board) || model.issue !== issue ||
        !explicitRule.every(text => /^[+-]?\d+$/.test(text)) ||
        !sameEvidence(explicitRule.map(Number), rule)) return null;
    const [multiplier, offset, divisor] = rule;
    if (multiplier !== source.difference * divisor || offset !== valueAt(0) * divisor ||
        !task.inputs.every(n => records.some(record => record.n === n && equal(record.result, valueAt(n))))) return null;
    const currentInput = Number(model.n);
    if (!records.some(record => record.n === currentInput && equal(model.answer, valueAt(currentInput)))) return null;

    return {
      nodeId: source.nodeId, taskHash: source.taskHash, method: null,
      firstTerm: source.firstTerm, difference: source.difference, intercept: valueAt(0),
      configuredRule: rule, recordedEvaluations: records, firstRuleEntry: first, events
    };
  } catch {
    return null;
  }
}

export function submittedAffineRulejumpEvidence(task, model, record, context = {}) {
  return latestSubmissionMatches(model, record) ? replayAffineRulejumpEvidence(task, model, context) : null;
}
