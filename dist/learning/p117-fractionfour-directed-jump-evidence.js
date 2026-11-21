import {initial, inspect, valid} from './phase5/b09-model.js';
import {parse} from './phase5/b09-math.js';
import {
  hasExactKeys,
  latestSubmissionMatches,
  matchesNativeEvidenceTask,
  sameEvidence
} from './evidence-contract.js';

export const P117_SOURCE = Object.freeze({
  sessionId: 'fractionfour',
  index: 8,
  nodeId: 'mt_gNUE4B3vuk',
  type: 'x-directedjump',
  taskHash: 'eb249dbc77c4acb4fc19245cfe552b6f39069c63461df463abf4bc9779a64e77'
});

const reviewedTask = Object.freeze({
  type: 'x-directedjump',
  start: -5,
  op: '+',
  operand: 3,
  min: -10,
  max: 10,
  prompt: '−5加3：先预测，再从原位置画出真实方向。',
  zero: true
});

export function p117DirectedJumpBinding(task, context) {
  if (context?.sessionId !== P117_SOURCE.sessionId || context.index !== P117_SOURCE.index ||
      !sameEvidence(task, reviewedTask) || !matchesNativeEvidenceTask(task, context, P117_SOURCE)) {
    return null;
  }
  return {
    nodeId: P117_SOURCE.nodeId,
    kind: 'p117-fractionfour-directed-jump',
    method: null,
    question: '从 −5 出发，向哪边跳多少？终点还在 0 的哪一边？'
  };
}

export function replayP117DirectedJumpEvidence(task, model, context) {
  try {
    const binding = p117DirectedJumpBinding(task, context);
    if (!binding || !hasExactKeys(model, Object.keys(initial(task))) || !valid(task, model) ||
        !model.touched || model.anchor !== task.start || model.committed === null ||
        model.guess !== model.committed || model.zero !== 'reference' ||
        model.reference !== 0 || model.refTouched !== false || model.refSaved !== null) {
      return null;
    }

    // The original history keeps successful jumps; undo and anchor edits don't
    // record their position in that history. Accept only a complete current path.
    const {history, jumps} = model;
    if (!history.length || !sameEvidence(history, jumps) ||
        Object.keys(history).length !== history.length || Object.keys(jumps).length !== jumps.length) {
      return null;
    }

    let at = task.start;
    const observableSuccessfulJumps = [];
    for (const [index, change] of history.entries()) {
      if (!Number.isSafeInteger(change) || change === 0) return null;
      const to = at + change;
      if (to < task.min || to > task.max) return null;
      observableSuccessfulJumps.push({
        index,
        from: at,
        change,
        direction: change > 0 ? 'right' : 'left',
        unitLength: Math.abs(change),
        to
      });
      at = to;
    }

    const answer = parse(model.answer);
    if (at - task.start !== task.operand || !answer || answer[0] !== at || answer[1] !== 1 ||
        !inspect(task, model).correct) {
      return null;
    }

    return {
      kind: binding.kind,
      nodeId: binding.nodeId,
      sessionId: P117_SOURCE.sessionId,
      index: P117_SOURCE.index,
      start: task.start,
      operation: task.op,
      operand: task.operand,
      signedChange: at - task.start,
      end: at,
      observableSuccessfulJumps,
      zeroReferenceSelected: true,
      initialGuessCorrectnessAssessed: false,
      undoOrAnchorResetChronologyProven: false,
      learnerMasteryAssessed: false
    };
  } catch {
    return null;
  }
}

// The pure replay checks a model. Evidence for the current saved Check needs
// the separately stored attempt as well.
export function submittedP117DirectedJumpEvidence(task, model, record, context) {
  if (!latestSubmissionMatches(model, record)) return null;
  return replayP117DirectedJumpEvidence(task, model, context);
}
