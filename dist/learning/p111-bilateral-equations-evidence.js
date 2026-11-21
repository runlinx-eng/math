import {rational as inputFraction} from './phase5/b16-model.js';
import {add, div, equal, fmt, mul, rational, sub} from './phase5/b09-math.js';
import {initial, inspect, valid} from './phase5/b35-model.js';
import {
  hasExactKeys,
  isEvidenceContext,
  latestSubmissionMatches,
  matchesNativeEvidenceTask,
  sameEvidence
} from './evidence-contract.js';

const sessionId = 'equations35';
const nodeId = 'mt_QhFEDyIwSO';
const type = 'x-a35-balance';
const kind = 'p111-bilateral-equations';
const reviewed = new Map([
  [0, {
    taskHash:'4df0391cef9fb6565ac87dca2d7e4d8bc71ea8fb4a862bacf4231c708d5e413e',
    prompt:'3x＋5＝26。每一步让两边一起变化，找到x，再代回原式。',
    left:['3','5'], right:['0','26'], solution:'7', moves:[['sub','5'],['div','3']]
  }],
  [2, {
    taskHash:'f454d546ed0dc70273c50fd4665cf5fddaba4b0d2935c44d3d1acbc8f7836d49',
    prompt:'刚才左边变成3x＋6，现在让它等于15，两边一起变化并代回检查。',
    left:['3','6'], right:['0','15'], solution:'3', moves:[['sub','6'],['div','3']]
  }],
  [3, {
    taskHash:'5f3aa17cb238481d80074b5fc8d2cd780a12229d60ac9ad508c14a121b08dc61',
    prompt:'4x＋3＝2x＋11。两边都有x，也可以让两边一起减去相同的份数。',
    left:['4','3'], right:['2','11'], solution:'4', moves:[['subx','2'],['sub','3'],['div','2']]
  }],
  [4, {
    taskHash:'bd3043c910cd96791099a4e3ec21b52f152394f3253e9a84b694562563bec7cc',
    prompt:'5−x＝6。两边一起变化；找到数后代回，看看负数能不能成立。',
    left:['-1','5'], right:['0','6'], solution:'-1', moves:[['sub','5'],['div','-1']]
  }],
  [5, {
    taskHash:'a342a7dd7bb7e16fb3e5dabca46f3692abe65f6411e34e8094f81e87bf347fd7',
    prompt:'半个x再加3等于5。两边一起变化；除以1/2也是一种可试的操作。',
    left:['1/2','3'], right:['0','5'], solution:'4', moves:[['sub','3'],['div','1/2']]
  }]
]);

const locked = new Map([...reviewed].map(([index, {prompt, left, right, solution, moves}]) =>
  [index, {type, prompt, left, right, solution, exampleOps:moves.map(([op,value]) => ({op,value})), questions:[]}]
));
export const P111_SOURCES = Object.freeze([...reviewed].map(([index, {taskHash}]) =>
  Object.freeze({sessionId, index, nodeId, type, taskHash})
));

export function p111BilateralEquationsBinding(task, context) {
  if (!isEvidenceContext(context) || context.sessionId !== sessionId ||
      !sameEvidence(task, locked.get(context.index)) ||
      !matchesNativeEvidenceTask(task, context, {type, nodeId})) return null;
  return {nodeId, kind, method:null, question:'每一步怎样同时改变两边？把解代回原式后，两边各是多少？'};
}

// Match the bounds of the original activity while using exact rational operations.
const bounded = value => value && Math.abs(value[0]) <= 10000000 && value[1] <= 1000000 ? value : null;
function inputNumber(raw) {
  const pair = inputFraction(raw);
  return pair && bounded(rational(...pair));
}

const transforms = {
  add: ([a,b], value) => [a, add(b,value)],
  sub: ([a,b], value) => [a, sub(b,value)],
  addx: ([a,b], value) => [add(a,value), b],
  subx: ([a,b], value) => [sub(a,value), b],
  mul: (side, value) => side.map(part => mul(part,value)),
  div: (side, value) => side.map(part => div(part,value))
};

function evaluateExact([coefficient,constant], x) {
  const [a, ad] = coefficient.map(BigInt);
  const [b, bd] = constant.map(BigInt);
  const [n, d] = x.map(BigInt);
  return [a * n * bd + b * ad * d, ad * d * bd];
}

function evaluateOriginal([coefficient,constant], x) {
  const product = bounded(mul(coefficient,x));
  return product && bounded(add(product,constant));
}

const zero = [0,1], one = [1,1];

export function replayP111BilateralEquationsEvidence(task, model, context) {
  try {
    const binding = p111BilateralEquationsBinding(task, context);
    if (!binding || !hasExactKeys(model, Object.keys(initial(task))) || !valid(task, model) ||
        !model.history.length || Object.keys(model.history).length !== model.history.length ||
        model.issue !== '' || model.board.preview !== null) return null;

    const start = {left:task.left.map(inputNumber), right:task.right.map(inputNumber)};
    const root = div(sub(start.right[1],start.left[1]), sub(start.left[0],start.right[0]));
    if (!equal(root, inputNumber(task.solution))) return null;

    const steps = [], trials = [], events = [];
    let frame = start, lastEquationChange = -1, lastTrial = null;

    for (const [index, event] of model.history.entries()) {
      if (!hasExactKeys(event, ['a','i','v','w','z','k'])) return null;
      const amount = inputNumber(event.v);
      if (event.a === 'op') {
        if (!Object.hasOwn(transforms, event.i)) return null;
        const scale = event.i === 'mul' || event.i === 'div';
        const next = amount && (!scale || !equal(amount,zero)) ? {
          left:transforms[event.i](frame.left,amount),
          right:transforms[event.i](frame.right,amount)
        } : null;
        const accepted = Boolean(next && [...next.left,...next.right].every(bounded));
        events.push({index, action:'op', op:event.i, raw:event.v, accepted});
        if (!accepted) continue;
        if (equal(next.left[0],next.right[0]) ||
            !equal(evaluateExact(next.left,root),evaluateExact(next.right,root))) return null;
        steps.push({op:event.i, value:fmt(amount), left:next.left, right:next.right});
        frame = next;
        lastEquationChange = index;
        continue;
      }
      if (event.a === 'one-side' && event.i === 'sub') {
        events.push({index, action:'one-side', raw:event.v, accepted:false});
        continue;
      }
      if (event.i !== '') return null;
      if (event.a === 'undo' || event.a === 'reset') {
        const changed = steps.length > 0;
        if (event.a === 'undo') steps.pop();
        else steps.length = 0;
        if (changed) {
          frame = steps.at(-1) || start;
          lastEquationChange = index;
        }
        events.push({index, action:event.a, changed});
        continue;
      }
      if (event.a !== 'try') return null;
      const left = amount && evaluateOriginal(start.left,amount);
      const right = amount && evaluateOriginal(start.right,amount);
      const recorded = Boolean(left && right && trials.length < 40);
      events.push({index, action:'try', raw:event.v, recorded});
      if (recorded) {
        const result = {x:fmt(amount), left:fmt(left), right:fmt(right), equal:equal(left,right)};
        trials.push(result);
        lastTrial = {index, ...result};
      }
    }

    const isolated = (left,right) => equal(left[0],one) && equal(left[1],zero) &&
      equal(right[0],zero) && equal(right[1],root);
    if (!steps.length || (!isolated(frame.left,frame.right) && !isolated(frame.right,frame.left)) ||
        !lastTrial?.equal || lastTrial.index <= lastEquationChange ||
        !equal(inputNumber(lastTrial.x),root) || !equal(inputNumber(model.value),root) ||
        !sameEvidence(frame.left,model.board.left) || !sameEvidence(frame.right,model.board.right) ||
        !sameEvidence(steps,model.board.steps) || !sameEvidence(trials,model.board.trials) ||
        !inspect(task, model).correct) return null;

    return {
      kind,
      nodeId,
      sessionId,
      index:context.index,
      solution:fmt(root),
      transforms:steps,
      events,
      trials,
      substitution:lastTrial,
      learnerMasteryAssessed:false
    };
  } catch {
    return null;
  }
}

export function submittedP111BilateralEquationsEvidence(task, model, record, context) {
  if (!latestSubmissionMatches(model, record)) return null;
  return replayP111BilateralEquationsEvidence(task, model, context);
}
