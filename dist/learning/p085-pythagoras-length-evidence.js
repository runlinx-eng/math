import {number} from './phase5/b20-model.js';
import {initial, inspect, valid} from './phase5/b26-model.js';
import {
  hasExactKeys,
  isEvidenceContext,
  latestSubmissionMatches,
  matchesNativeEvidenceTask,
  sameEvidence
} from './evidence-contract.js';

const sessionId = 'pythagoras';
const nodeId = 'mt_1VmTUxBrNd';
const type = 'x-g26-length';

const REVIEWED = Object.freeze([
  Object.freeze({
    sessionId,
    index: 2,
    nodeId,
    type,
    taskHash: 'c74249a5189e9752925661abd268dbbe1a5c42f3d4db2c4bc53dc64e10608835',
    question: '为什么求斜边要把两个直角边上的正方形面积相加，再开平方？',
    task: {
      type,
      prompt: '两条直角边是6和8。先找到斜边，再求斜边长度。',
      a: 6,
      b: 8,
      unknown: 'hyp',
      questions: [{
        label: '斜边与另外两边',
        value: 'longest',
        options: [['longest', '斜边最长'], ['shortest', '斜边最短']]
      }],
      rotation: 35
    }
  }),
  Object.freeze({
    sessionId,
    index: 3,
    nodeId,
    type,
    taskHash: '5c97317d48b61dc6bbf631648b17a9789368a6192e43e19367a4d946ffdf82b6',
    question: '为什么已知斜边和一条直角边时，要从斜边面积中减去已知直角边面积？',
    task: {
      type,
      prompt: '斜边是13，一条直角边是5。先找到斜边，再求另一条直角边。',
      a: 5,
      b: 12,
      unknown: 'leg',
      questions: [{
        label: '新找到的直角边',
        value: 'shorter',
        options: [['shorter', '比斜边短'], ['longer', '比斜边长']]
      }],
      rotation: 145
    }
  }),
  Object.freeze({
    sessionId,
    index: 4,
    nodeId,
    type,
    taskHash: '982d8305c39a40aae4e90761b38ad9acd1753487a67a1e4f04e665b0acd34add',
    question: '为什么两点之间的直线距离是水平和竖直两段构成的直角三角形的斜边？',
    task: {
      type,
      prompt: '两个点是(1,2)和(5,5)。先用横线和竖线连出直角，再找两点的直线距离。',
      a: 4,
      b: 3,
      unknown: 'hyp',
      questions: [{
        label: '横向4格、纵向3格',
        value: 'diagonal',
        options: [['diagonal', '两点的直线距离是斜边'], ['sum', '直线距离一定是4+3']]
      }],
      coord: true,
      points: [[1, 2], [5, 5]],
      domain: [0, 6, 0, 6]
    }
  })
]);

export const P085_SOURCES = Object.freeze(REVIEWED.map(({sessionId: s, index, nodeId: n, type: t, taskHash}) =>
  Object.freeze({sessionId: s, index, nodeId: n, type: t, taskHash})
));

const BY_INDEX = new Map(REVIEWED.map(entry => [entry.index, entry]));

export function p085PythagorasLengthBinding(task, context) {
  if (!isEvidenceContext(context) || context.sessionId !== sessionId) return null;
  const entry = BY_INDEX.get(context.index);
  if (!entry || !sameEvidence(task, entry.task) ||
      !matchesNativeEvidenceTask(task, context, {type, nodeId})) return null;
  return {
    nodeId,
    kind: 'p085-pythagoras-length',
    method: null,
    question: entry.question
  };
}

function exactGoal(task) {
  const a = task.coord ? Math.abs(task.points[1][0] - task.points[0][0]) : task.a;
  const b = task.coord ? Math.abs(task.points[1][1] - task.points[0][1]) : task.b;
  const aSq = a * a;
  const bSq = b * b;
  const hypSq = aSq + bSq;
  const c = Math.round(Math.sqrt(hypSq));
  if (!Number.isInteger(a) || !Number.isInteger(b) || c * c !== hypSq) return null;
  if (task.unknown === 'leg') {
    const legSq = hypSq - aSq;
    return {
      a, b, c,
      op: 'subtract',
      knownSquares: [hypSq, aSq],
      square: legSq,
      result: b
    };
  }
  return {
    a, b, c,
    op: 'add',
    knownSquares: [aSq, bSq],
    square: hypSq,
    result: c
  };
}

const ACTION_FIELDS = {
  corner: [],
  hyp: [],
  op: [],
  save: ['square', 'result'],
  help: [],
  reset: []
};

export function replayP085PythagorasLengthEvidence(task, model, context) {
  try {
    const binding = p085PythagorasLengthBinding(task, context);
    if (!binding || !hasExactKeys(model, Object.keys(initial(task))) || !valid(task, model) ||
        model.issue !== '' || !model.history.length ||
        Object.keys(model.history).length !== model.history.length) return null;

    const goal = exactGoal(task);
    if (!goal) return null;

    let corner = null;
    let hyp = null;
    let op = null;
    let saved = null;
    let help = false;
    let resets = 0;
    let failedEvents = 0;
    let lastIssue = '';
    const activeSteps = [];

    for (const event of model.history) {
      if (!hasExactKeys(event, ['a', 'f', 'd'])) return null;
      const expectedFields = ACTION_FIELDS[event.a];
      if (!expectedFields || !hasExactKeys(event.f, expectedFields)) return null;
      lastIssue = '';

      if (event.a === 'reset') {
        if (!hasExactKeys(event.d, [])) return null;
        corner = null;
        hyp = null;
        op = null;
        saved = null;
        help = false;
        resets++;
        activeSteps.length = 0;
      } else if (event.a === 'help') {
        if (!hasExactKeys(event.d, [])) return null;
        help = true;
        activeSteps.push({a: 'help'});
      } else if (event.a === 'corner') {
        if (!task.coord || !hasExactKeys(event.d, ['index']) ||
            !['hfirst', 'vfirst'].includes(event.d.index)) return null;
        corner = event.d.index;
        hyp = null;
        op = null;
        saved = null;
        activeSteps.push({a: 'corner', index: corner});
      } else if (event.a === 'hyp') {
        if (!hasExactKeys(event.d, ['index']) || !/^[0-2]$/.test(event.d.index)) return null;
        if (task.coord && !corner) {
          lastIssue = '先在两个点之间画出水平和竖直两段。';
          failedEvents++;
        } else {
          hyp = Number(event.d.index);
          op = null;
          saved = null;
          activeSteps.push({a: 'hyp', index: hyp});
        }
      } else if (event.a === 'op') {
        if (!hasExactKeys(event.d, ['index']) || !['add', 'subtract'].includes(event.d.index)) return null;
        if (hyp !== 1) {
          lastIssue = '先在图上找直角对面的边。';
          failedEvents++;
        } else {
          op = event.d.index;
          saved = null;
          activeSteps.push({a: 'op', index: op});
        }
      } else if (event.a === 'save') {
        if (!hasExactKeys(event.d, [])) return null;
        if (!op) {
          lastIssue = '先选择相加或相减。';
          failedEvents++;
        } else if (!Number.isFinite(number(event.f.square)) || !Number.isFinite(number(event.f.result))) {
          lastIssue = '先填写平方后的面积和边长。';
          failedEvents++;
        } else {
          saved = {square: event.f.square, result: event.f.result};
          activeSteps.push({a: 'save', square: saved.square, result: saved.result});
        }
      } else {
        return null;
      }
    }

    if (lastIssue !== '' || (task.coord && !corner) || hyp !== 1 || op !== goal.op || !saved) return null;
    if (model.board.corner !== corner || model.board.hyp !== hyp || model.board.op !== op ||
        model.board.help !== help || !sameEvidence(model.board.saved, saved)) return null;
    if (model.square !== saved.square || model.result !== saved.result) return null;

    const exactSquare = number(model.square);
    const exactResult = number(model.result);
    if (exactSquare !== goal.square || exactResult !== goal.result ||
        exactResult * exactResult !== exactSquare) return null;
    if (model.answers.length !== 1 || model.answers[0] !== task.questions[0].value) return null;
    if (!inspect(task, model).correct) return null;

    return {
      binding,
      coord: Boolean(task.coord),
      corner,
      legs: [goal.a, goal.b],
      hypotenuse: goal.c,
      operation: goal.op,
      knownSquares: goal.knownSquares,
      square: goal.square,
      result: goal.result,
      answer: model.answers[0],
      helpUsed: help,
      resets,
      failedEvents,
      activeSteps
    };
  } catch {
    return null;
  }
}

export function submittedP085PythagorasLengthEvidence(task, model, record, context) {
  if (!latestSubmissionMatches(model, record)) return null;
  return replayP085PythagorasLengthEvidence(task, model, context);
}
