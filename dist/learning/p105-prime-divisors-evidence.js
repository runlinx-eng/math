import {initial, inspect, number, valid} from './phase5/b14-model.js';
import {
  hasExactKeys,
  isEvidenceContext,
  latestSubmissionMatches,
  matchesNativeEvidenceTask,
  sameEvidence
} from './evidence-contract.js';

const sessionId = 'primetest';
const nodeId = 'mt_y1XCVsIelg';
const type = 'x-numbersearch';
const kind = 'p105-prime-divisors';
const reviewed = [
  {
    taskHash:'0ef3cabc2ab08b88c366890dee7cd0ca50656f97b7b588e16980d0cf305efb01',
    task:{type,mode:'prime',ns:[1],prompt:'只有1个物品时，有几个不同的因数？它符合“恰好两个”吗？'}
  },
  {
    taskHash:'019704b5ccd5cc445c9ef8c99e3299237c38566ef9047f7b528cf16cad9b1c0f',
    task:{type,mode:'prime',ns:[2],prompt:'2是偶数。它是不是恰好有两个不同因数？'}
  },
  {
    taskHash:'6c8ce662b07bd596b4cd3507748253afbbdb8077576cfab1320df951597db761',
    task:{type,mode:'prime',ns:[51],prompt:'51看起来是奇数，能不能排出不止一行的长方形？'}
  }
];

export const P105_SOURCES = Object.freeze(reviewed.map(({taskHash},index) =>
  Object.freeze({sessionId,index,nodeId,type,taskHash})
));

export function p105PrimeDivisorsBinding(task,context) {
  if (!isEvidenceContext(context) || context.sessionId !== sessionId ||
      !sameEvidence(task,reviewed[context.index]?.task) ||
      !matchesNativeEvidenceTask(task,context,{type,nodeId})) return null;
  return {nodeId,kind,method:null,question:'哪些试除的余数等于零？算上配对的因数，一共有几个不同因数？'};
}

const trialInput = ({candidate,remainder}) => ({candidate,remainder});

export function replayP105PrimeDivisorsEvidence(task,model,context) {
  try {
    const binding = p105PrimeDivisorsBinding(task,context);
    if (!binding || !hasExactKeys(model,Object.keys(initial(task))) || !valid(task,model) ||
        !model.history.length || Object.keys(model.history).length !== model.history.length) return null;

    const [value] = task.ns;
    const required = [];
    for (let d=1; d*d<=value; d++) required.push(d);
    const seen = new Map(), records = [], attempts = [];
    for (const [index,event] of model.history.entries()) {
      const data = event.data;
      if (event.action !== 'b14-test' || data.side !== 0 || data.index !== null || data.value !== null) return null;
      const raw = trialInput(data.fields);
      const divisor = number(raw.candidate);
      const remainder = number(raw.remainder);
      if (!required.includes(divisor)) {
        attempts.push({index,raw,accepted:false,reason:'outside-range'});
        continue;
      }
      const expectedRemainder = value % divisor;
      if (remainder !== expectedRemainder) {
        attempts.push({index,raw,divisor,expectedRemainder,accepted:false,reason:'wrong-remainder'});
        continue;
      }
      if (seen.has(divisor)) {
        attempts.push({index,raw,divisor,accepted:false,reason:'duplicate',previous:seen.get(divisor)});
        continue;
      }
      const quotient = Math.floor(value / divisor);
      if (quotient * divisor + remainder !== value || remainder >= divisor) return null;
      seen.set(divisor,index);
      records.push({d:divisor,r:remainder});
      attempts.push({index,raw,divisor,remainder,quotient,accepted:true});
    }

    const factors = [...new Set(records.filter(record => record.r === 0)
      .flatMap(({d}) => [d,value/d]))].sort((a,b) => a-b);
    const classification = factors.length === 1 ? 'neither' : factors.length === 2 ? 'prime' : 'composite';
    const last = attempts.at(-1);
    if (!required.every(divisor => seen.has(divisor)) ||
        !(last.accepted || last.reason === 'duplicate') ||
        !sameEvidence(last.raw,trialInput(model)) || !sameEvidence(model.board.tests,[records]) ||
        model.answer !== classification || !inspect(task,model).correct) return null;

    return {
      kind,nodeId,sessionId,index:context.index,value,
      checkedDivisors:required, factors, classification, attempts,
      learnerMasteryAssessed:false
    };
  } catch {
    return null;
  }
}

export function submittedP105PrimeDivisorsEvidence(task,model,record,context) {
  if (!latestSubmissionMatches(model,record)) return null;
  return replayP105PrimeDivisorsEvidence(task,model,context);
}
