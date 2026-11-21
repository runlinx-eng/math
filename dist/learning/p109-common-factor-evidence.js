import {initial, inspect, valid} from './phase5/b35-model.js';
import {
  hasExactKeys,
  isEvidenceContext,
  latestSubmissionMatches,
  matchesNativeEvidenceTask,
  sameEvidence
} from './evidence-contract.js';

const sessionId = 'factor35';
const nodeId = 'mt_uESbzWCZIq';
const type = 'x-a35-factor';
const kind = 'p109-common-factor';
const definitions = [
  {
    taskHash:'1eef43242755c45b490f5c23af883e66af937bbaca5ded0304dc4293a2c3b50b',
    prompt:'6x＋9能提出什么最大的共同数字？写出括号，再展开检查。',
    display:'6x＋9', terms:[{c:6,k:'x'},{c:9,k:'1'}], example:{factor:3,power:'1',inner:[2,3]}
  },
  {
    taskHash:'f80339a8fcebaa6a454476eb91d5c0e3627c11d93f45d2648bb4cd8363d17408',
    prompt:'12x−18也能收成“共同部分 × 括号”。',
    display:'12x−18', terms:[{c:12,k:'x'},{c:-18,k:'1'}], example:{factor:6,power:'1',inner:[2,-3]}
  },
  {
    taskHash:'d51203982e18f2c0e6f2a8a3dd9a51d5dcfacd5aba4533fa6324edaa695cd5d6',
    prompt:'8x²＋12x中，除了数字，还有共同的字母部分。',
    display:'8x²＋12x', terms:[{c:8,k:'x2'},{c:12,k:'x'}], example:{factor:4,power:'x',inner:[2,3]}
  }
];
const locked = definitions.map(({prompt,display,terms,example}) => ({type,prompt,display,terms,example,questions:[]}));

export const P109_SOURCES = Object.freeze(definitions.map(({taskHash}, index) =>
  Object.freeze({sessionId,index,nodeId,type,taskHash})
));

export function p109CommonFactorBinding(task,context) {
  if (!isEvidenceContext(context) || context.sessionId !== sessionId ||
      !sameEvidence(task, locked[context.index]) ||
      !matchesNativeEvidenceTask(task,context,{type,nodeId})) return null;
  return {nodeId,kind,method:null,question:'最大的共同因式是什么？把括号里的两项各自乘回去，会得到什么？'};
}

const degree = {'1':0,x:1,x2:2};
const gcd = (a,b) => b === 0 ? a : gcd(b,a % b);
const integer = raw => /^[-+]?\d+$/.test(raw.trim()) ? Number(raw) : NaN;
const inRange = (n, min) => Number.isSafeInteger(n) && n >= min && n <= 1000;

export function replayP109CommonFactorEvidence(task,model,context) {
  try {
    const binding = p109CommonFactorBinding(task,context);
    if (!binding || !hasExactKeys(model,Object.keys(initial(task))) || !valid(task,model) ||
        model.issue !== '' || !model.history.length ||
        Object.keys(model.history).length !== model.history.length) return null;

    const terms = task.terms.map(({c,k}) => ({coefficient:c,degree:degree[k]}));
    const greatestFactor = {
      coefficient:gcd(Math.abs(terms[0].coefficient),Math.abs(terms[1].coefficient)),
      degree:Math.min(terms[0].degree,terms[1].degree)
    };
    const attempts = [];
    let expansionCount = 0;

    for (const [index,event] of model.history.entries()) {
      if (!hasExactKeys(event,['a','i','v','w','z','k']) || event.a !== 'factor' || event.i !== '') return null;
      const raw = {factor:event.v,power:event.w,inner:[event.z,event.k]};
      const factor = integer(raw.factor);
      const inner = raw.inner.map(integer);
      if (!inRange(factor,1) || !['1','x'].includes(raw.power) || !inner.every(n => inRange(n,-1000))) {
        attempts.push({index,raw,recorded:false});
        continue;
      }

      const outside = {coefficient:factor,degree:degree[raw.power]};
      // The two inputs are the coefficient of x and the constant in the bracket.
      const expanded = inner.map((coefficient,i) => ({coefficient:factor * coefficient,degree:outside.degree + 1 - i}));
      const maximum = sameEvidence(outside,greatestFactor);
      const restoresOriginal = sameEvidence(expanded,terms);
      const accepted = maximum && restoresOriginal;
      const native = model.board.trials[expansionCount++];
      if (!native || !sameEvidence(raw,native.raw) || native.ok !== accepted ||
          (accepted && !sameEvidence(native.restored,task.terms))) return null;

      attempts.push({index,raw,recorded:true,outside,expanded,maximum,restoresOriginal,accepted});
    }

    const last = attempts.at(-1);
    const current = {factor:model.value,power:model.second,inner:[model.third,model.fourth]};
    if (!last?.accepted || !sameEvidence(last.raw,current) ||
        expansionCount !== model.board.trials.length || !inspect(task,model).correct) return null;

    return {
      kind,nodeId,sessionId,index:context.index,
      greatestFactor,terms,attempts,expansion:last,
      learnerMasteryAssessed:false
    };
  } catch {
    return null;
  }
}

export function submittedP109CommonFactorEvidence(task,model,record,context) {
  if (!latestSubmissionMatches(model,record)) return null;
  return replayP109CommonFactorEvidence(task,model,context);
}
