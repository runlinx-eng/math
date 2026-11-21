import {initial, inspect, valid} from './phase5/b27-model.js';
import {
  hasExactKeys,
  latestSubmissionMatches,
  matchesNativeEvidenceTask,
  sameEvidence
} from './evidence-contract.js';

const sessionId = 'solidstack';
const nodeId = 'mt_QNxFnxikCN';
const type = 'x-g27-build';
const reviewed = new Map([
  [0, {
    taskHash: 'c47708d41a0f551fe7ac7a60effee5468286cb069f2a0cafba604497e7c5f235',
    task: {
      "type": "x-g27-build",
      "prompt": "从下往上，用一个长方体和两个正方体搭高塔。",
      "target": [
        "cuboid",
        "cube",
        "cube"
      ],
      "options": [
        "cube",
        "cuboid",
        "cylinder"
      ],
      "rotate": true
    }
  }],
  [1, {
    taskHash: 'f2a5ef9ff701bb81b8b24d5fb8d7b042b8e38aa1384a7a2dd5456001e6e1982a',
    task: {
      "type": "x-g27-build",
      "prompt": "先放圆柱，再给它盖上圆锥屋顶。",
      "target": [
        "cylinder",
        "cone"
      ],
      "options": [
        "cylinder",
        "cone",
        "cube"
      ],
      "rotate": true
    }
  }]
]);

export const P114_SOURCES = Object.freeze([...reviewed].map(([index, {taskHash}]) =>
  Object.freeze({sessionId, index, nodeId, type, taskHash})
));

export function p114SolidStackBinding(task, context) {
  const source = reviewed.get(context?.index);
  if (context?.sessionId !== sessionId || !source ||
      !sameEvidence(task, source.task) || !matchesNativeEvidenceTask(task, context, {nodeId, type})) {
    return null;
  }
  return {
    nodeId,
    kind: 'p114-solidstack',
    method: null,
    question: '从底到顶分别是哪几块？拿走的是哪一块？'
  };
}

export function replayP114SolidStackEvidence(task, model, context) {
  try {
    const binding = p114SolidStackBinding(task, context);
    const blank = binding && initial(task, 1);
    if (!blank || !hasExactKeys(model, Object.keys(blank)) || !valid(task, model) ||
        !model.history.length || Object.keys(model.history).length !== model.history.length ||
        model.issue !== '' || model.position !== blank.position || model.foldPosition !== blank.foldPosition) {
      return null;
    }

    const parts = [];
    const observableActions = [];
    let turnRecorded = false;
    for (const [eventIndex, event] of model.history.entries()) {
      if (!hasExactKeys(event, ['a', 'd'])) return null;
      if (event.a === 'add') {
        if (!hasExactKeys(event.d, ['index']) || !task.options.includes(event.d.index)) return null;
        const part = event.d.index;
        const accepted = parts.length < task.target.length;
        if (accepted) parts.push(part);
        observableActions.push({eventIndex, action:'add', part, accepted, height:parts.length});
      } else if (event.a === 'remove') {
        if (!hasExactKeys(event.d, [])) return null;
        const removed = parts.pop() ?? null;
        observableActions.push({eventIndex, action:'remove', removed, height:parts.length});
      } else if (event.a === 'turn') {
        if (!hasExactKeys(event.d, [])) return null;
        turnRecorded = true;
        observableActions.push({eventIndex, action:'turn'});
      } else {
        return null;
      }
    }

    if (!sameEvidence(parts, task.target) || !sameEvidence(parts, model.board.parts) ||
        !turnRecorded || model.board.turned !== turnRecorded || !inspect(task, model).correct) {
      return null;
    }
    return {
      kind: binding.kind,
      nodeId: binding.nodeId,
      sessionId,
      index: context.index,
      stackBottomToTop: parts,
      observableActions,
      turnRecorded,
      rotationAngleAssessed: false,
      physicalStabilityAssessed: false,
      freeExplanationAssessed: false,
      learnerMasteryAssessed: false
    };
  } catch {
    return null;
  }
}

export function submittedP114SolidStackEvidence(task, model, record, context) {
  if (!latestSubmissionMatches(model, record)) return null;
  return replayP114SolidStackEvidence(task, model, context);
}
