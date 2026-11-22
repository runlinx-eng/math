import {initial, valid} from './phase5/b24-model.js';
import {hasExactKeys, latestSubmissionMatches, matchesNativeEvidenceTask, sameEvidence} from './evidence-contract.js';

export const P115W_SOURCES = Object.freeze([
  {
    "sessionId": "turnwalk",
    "index": 0,
    "nodeId": "mt_TdV9YGJEoY",
    "type": "x-p24-walk",
    "taskHash": "0df0b822cf56061938d9a155446aefb19764f9cb73db2d55a155bfa96385d89a"
  },
  {
    "sessionId": "turnwalk",
    "index": 1,
    "nodeId": "mt_TdV9YGJEoY",
    "type": "x-p24-walk",
    "taskHash": "9a3780be623dafbb83bf986b6ff10074b1c7d0f1649398e07a3ba0f4446ec97d"
  },
  {
    "sessionId": "turnwalk",
    "index": 2,
    "nodeId": "mt_TdV9YGJEoY",
    "type": "x-p24-walk",
    "taskHash": "9c5e61c855bacde52c7361eef982006b33bbcf3eb9610ca6bade9bab88509cc5"
  },
  {
    "sessionId": "turnwalk",
    "index": 3,
    "nodeId": "mt_TdV9YGJEoY",
    "type": "x-p24-walk",
    "taskHash": "3bba93c5d2f89c3bd1867afccf76002bf77181d28d5596582e3081882f3e869f"
  },
  {
    "sessionId": "turnroute",
    "index": 0,
    "nodeId": "mt_Y9XKzLrUAZ",
    "type": "x-p24-walk",
    "taskHash": "875d239eb587a0ad917620f5e2a7059f407cb390e2fb252fa7982eaaa581b3da"
  },
  {
    "sessionId": "turnroute",
    "index": 1,
    "nodeId": "mt_Y9XKzLrUAZ",
    "type": "x-p24-walk",
    "taskHash": "47b32cbd622cbb71f42962e3e5668363636c1479d3707302cb3b7411c001e1e4"
  },
  {
    "sessionId": "turnroute",
    "index": 2,
    "nodeId": "mt_Y9XKzLrUAZ",
    "type": "x-p24-walk",
    "taskHash": "55667f0a0831a39201bdc13e9df8ee975874c6d2fb1d556c71988928730dc726"
  },
  {
    "sessionId": "turnroute",
    "index": 3,
    "nodeId": "mt_Y9XKzLrUAZ",
    "type": "x-p24-walk",
    "taskHash": "c86c27c9b56076ebd026c8337196b27c16bef0968ffa0e4fdf136ecee0d5dc58"
  }
].map(Object.freeze));

function equalsInteger(raw, expected) {
  const value = raw.trim();
  const decimal = /^(\d+)(?:\.0+)?$/.exec(value);
  if (decimal) return BigInt(decimal[1]) === BigInt(expected);
  const fraction = /^(?:(\d+)\s+)?(\d+)\/(\d+)$/.exec(value);
  if (!fraction) return false;
  const denominator = BigInt(fraction[3]);
  return denominator > 0n && (BigInt(fraction[1] || '0') - BigInt(expected)) * denominator + BigInt(fraction[2]) === 0n;
}

export function p115wDirectionWalkBinding(task, context) {
  const row = P115W_SOURCES.find(source => source.sessionId === context?.sessionId && source.index === context?.index);
  if (!row || !matchesNativeEvidenceTask(task, context, row)) return null;
  return {nodeId: row.nodeId, kind: 'p115w-direction-walk', method: null, question: '哪个动作改变位置，哪个动作改变朝向？'};
}

const headings = ['up', 'right', 'down', 'left'];
const offsets = [[0,1], [1,0], [0,-1], [-1,0]];

function nextState([x,y,heading], action) {
  if (action === 'L' || action === 'R') return [x,y,(heading + (action === 'R' ? 1 : 3)) % 4];
  const [dx,dy] = offsets[heading];
  const sign = action === 'F' ? 1 : -1;
  return [x + sign * dx, y + sign * dy, heading];
}

function answersMatch(context, model, operations, states) {
  const [answer, finalHeading] = model.answers;
  const degrees = operations.filter(op => op === 'R').length * 90;
  if (context.sessionId === 'turnwalk') {
    if (context.index === 1) return degrees === 90 && answer === 'quarter';
    return equalsInteger(answer, degrees) && (finalHeading === undefined || finalHeading === headings[states.at(-1)[2]]);
  }
  if (context.index === 0) return sameEvidence(states[0], states.at(-1)) && answer === 'same';
  if (context.index === 2) {
    return operations.every((op,i) => !['L','R'].includes(op) || sameEvidence(states[i].slice(0,2),states[i+1].slice(0,2))) &&
      answer === 'same';
  }
  return equalsInteger(answer, degrees);
}

export function replayP115WDirectionWalkEvidence(task, model, context) {
  try {
    const binding = p115wDirectionWalkBinding(task, context);
    if (!binding || !hasExactKeys(model, Object.keys(initial(task, 1))) || !valid(task, model) ||
        model.issue !== '' || Object.keys(model.history).length !== model.history.length) return null;

    const operations = [];
    const states = [[...task.start]];
    for (const event of model.history) {
      if (!hasExactKeys(event, ['a', 'd', 'f']) || !hasExactKeys(event.d, []) || !hasExactKeys(event.f, [])) return null;
      const action = event.a;
      if (action === 'reset') {
        operations.length = 0;
        states.length = 1;
      } else if (action === 'undo') {
        if (operations.length) {
          operations.pop();
          states.pop();
        }
      } else {
        if (!['F','B','L','R'].includes(action) || (action === 'B' && !task.allowBack)) return null;
        const state = nextState(states.at(-1), action);
        if (state[0] < 0 || state[0] > 4 || state[1] < 0 || state[1] > 4) continue;
        operations.push(action);
        states.push(state);
      }
    }
    if (!sameEvidence(operations, task.ops) || !sameEvidence(operations, model.board.ops) ||
        !sameEvidence(states, model.board.states) || !sameEvidence(states.at(-1), model.board.state) ||
        !answersMatch(context, model, operations, states)) return null;
    return {...binding, operations, states};
  } catch {
    return null;
  }
}

export function submittedP115WDirectionWalkEvidence(task, model, record, context) {
  return latestSubmissionMatches(model, record) ? replayP115WDirectionWalkEvidence(task, model, context) : null;
}
