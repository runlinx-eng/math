import {initial, inspect, valid, equivalent, parse} from './phase5/b15-model.js';
import {hasExactKeys, isEvidenceContext, latestSubmissionMatches, matchesNativeEvidenceTask, sameEvidence} from './evidence-contract.js';

const type = 'x-orderlab';
const REVIEWED = Object.freeze([
  {
    "sessionId": "expressions",
    "index": 0,
    "nodeId": "mt_4WaKWECpcv",
    "type": "x-orderlab",
    "taskHash": "5d2aa55b08dcdf23d6c8bad463a9dceac11b6989f94bb05dae9353a08a5b1906",
    "task": {
      "type": "x-orderlab",
      "expression": "",
      "prompt": "把“8与7先合起来，再取2份”写成一行。只表示关系，不必算结果。",
      "construct": true,
      "expected": "(8+7)*2",
      "writeOnly": true
    },
    "question": "为什么括号位置决定先算哪一步，不算出结果也能直接表达数量关系？"
  },
  {
    "sessionId": "expressions",
    "index": 1,
    "nodeId": "mt_4WaKWECpcv",
    "type": "x-orderlab",
    "taskHash": "9df4c015fa3809f29e71fadbe0fcd92d62c11c38a060b1e29d053ecdc23e8bd2",
    "task": {
      "type": "x-orderlab",
      "expression": "4*(365-12)",
      "prompt": "把“先从365拿走12，再取4份”写出来。上方是要表达的关系，不必算总数。",
      "construct": true,
      "expected": "4*(365-12)",
      "writeOnly": true
    },
    "question": "为什么括号位置决定先算哪一步，不算出结果也能直接表达数量关系？"
  },
  {
    "sessionId": "expressions",
    "index": 2,
    "nodeId": "mt_4WaKWECpcv",
    "type": "x-orderlab",
    "taskHash": "9e2b36a50405175e2e213e20d0faa0a8eeec4323a8b32a9cf78e18aeddcc520c",
    "task": {
      "type": "x-orderlab",
      "expression": "",
      "prompt": "甲是18932与921的和，乙是甲的3倍。写出乙，再比较，先不算两个大数。",
      "construct": true,
      "expected": "3*(18932+921)",
      "writeOnly": true,
      "reason": "triple",
      "choices": [
        [
          "triple",
          "乙是甲的3倍"
        ],
        [
          "plus",
          "乙比甲多3"
        ],
        [
          "same",
          "两者相等"
        ]
      ]
    },
    "question": "为什么括号位置决定先算哪一步，不算出结果也能直接表达数量关系？"
  }
]);
export const P084_SOURCES = Object.freeze(REVIEWED.map(({sessionId, index, nodeId, type: t, taskHash}) => Object.freeze({sessionId, index, nodeId, type: t, taskHash})));

export function p084ExpressionBuildBinding(task, context) {
  if (!isEvidenceContext(context)) return null;
  const entry = REVIEWED.find(e => e.sessionId === context.sessionId && e.index === context.index);
  if (!entry || !sameEvidence(task, entry.task) || !matchesNativeEvidenceTask(task, context, {type, nodeId: entry.nodeId})) return null;
  return {nodeId: entry.nodeId, kind: 'p084-expression-build', method: null, question: entry.question};
}

export function replayP084ExpressionBuildEvidence(task, model, context) {
  try {
    const binding = p084ExpressionBuildBinding(task, context);
    if (!binding || !hasExactKeys(model, Object.keys(initial(task))) || !valid(task, model) ||
        model.issue !== '' || !model.history.length || Object.keys(model.history).length !== model.history.length) return null;
    let first = null, expression = '', tree = null, failedBuilds = 0, builds = 0, resets = 0, buildFailed = false;
    for (const {action, data} of model.history) {
      if (data.index !== null || data.value !== null) return null;
      buildFailed = false;
      if (action === 'b15-reset') {
        expression = '';
        tree = null;
        resets++;
        continue;
      }
      if (action !== 'b15-build') return null;

      const raw = data.fields.expression;
      first ??= raw;
      builds++;
      try {
        tree = parse(raw);
        expression = raw;
      } catch {
        buildFailed = true;
        failedBuilds++;
      }
    }
    if (buildFailed || !tree || !sameEvidence(tree, model.board.tree) ||
        expression !== model.board.expression || model.board.first !== first ||
        !equivalent(expression, task.expected) || !equivalent(model.expression, expression) ||
        (task.reason && model.reason !== task.reason) || !inspect(task, model).correct) return null;
    return {binding, expression, expected: task.expected, reason: model.reason || null, builds, failedBuilds, resets};
  } catch { return null; }
}

export function submittedP084ExpressionBuildEvidence(task, model, record, context) {
  if (!latestSubmissionMatches(model, record)) return null;
  return replayP084ExpressionBuildEvidence(task, model, context);
}
