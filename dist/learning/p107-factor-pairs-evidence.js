import {initial, inspect, number, valid} from './phase5/b13-model.js';
import {
  hasExactKeys,
  isEvidenceContext,
  latestSubmissionMatches,
  matchesNativeEvidenceTask,
  sameEvidence
} from './evidence-contract.js';

const sessionId = 'factorpairs';
const nodeId = 'mt_nZkL5-XjRX';
const type = 'x-factorrects';
const kind = 'p107-factor-pairs';
const reviewed = [
  {
    taskHash:'3565ef221b2242c95b06538b5bb4337ed2408bffbe99bc8e115f49b87ab808b0',
    task:{type,n:24,prompt:'24颗不添不减，能排出哪些不同的长方形？把每一种留下。'}
  },
  {
    taskHash:'ff89024af2052faa14649d37531ef1de7a1f3d64d2c1b0ca2284a39df21e91d9',
    task:{type,n:36,prompt:'36颗也找一找。正方形那一对只记一次。'}
  }
];

export const P107_SOURCES = Object.freeze(reviewed.map(({taskHash},index) =>
  Object.freeze({sessionId,index,nodeId,type,taskHash})
));

export function p107FactorPairsBinding(task,context) {
  if (!isEvidenceContext(context) || context.sessionId !== sessionId ||
      !sameEvidence(task,reviewed[context.index]?.task) ||
      !matchesNativeEvidenceTask(task,context,{type,nodeId})) return null;
  return {nodeId,kind,method:null,question:'哪些行数能刚好排完？把长方形转一个方向后，该算几对？'};
}

function allPairs(total) {
  const lengths = Array.from({length:total},(_,i) => i+1);
  return lengths.filter(rows => total % rows === 0 && rows <= total / rows)
    .map(rows => [rows,total / rows]);
}

const canonicalRangeValue = /^(0|[1-9]\d*)$/;
const rawRectangle = ({rows,cols,answer}) => ({rows,cols,answer});

export function replayP107FactorPairsEvidence(task,model,context) {
  try {
    const binding = p107FactorPairsBinding(task,context);
    if (!binding || !hasExactKeys(model,Object.keys(initial(task))) || !valid(task,model) ||
        !model.history.length || Object.keys(model.history).length !== model.history.length) return null;

    const total = task.n;
    const expected = allPairs(total);
    const saved = new Map(), attempts = [];
    for (const [index,event] of model.history.entries()) {
      const data = event.data;
      if (event.action !== 'b13-pair-save' || data.index !== null || data.bucket !== null || data.token !== null ||
          !canonicalRangeValue.test(data.rows) || !canonicalRangeValue.test(data.cols)) return null;
      const rows = number(data.rows), cols = number(data.cols);
      if (rows === null || cols === null || rows > total || cols > total) return null;

      const raw = rawRectangle(data);
      if (rows === 0 || cols === 0 || rows * cols !== total || number(raw.answer) !== total) {
        attempts.push({index,raw,accepted:false,reason:'does-not-match-total'});
        continue;
      }
      const pair = [Math.min(rows,cols),Math.max(rows,cols)];
      const key = pair.join('×');
      const previous = saved.get(key);
      if (previous !== undefined) {
        attempts.push({index,raw,pair,accepted:false,reason:'duplicate',previous:previous.index});
        continue;
      }
      const record = {index,raw,pair,accepted:true};
      saved.set(key,record);
      attempts.push(record);
    }

    const originals = [...saved.values()].map(record => record.pair);
    const last = attempts.at(-1);
    if (!(last.accepted || last.reason === 'duplicate') ||
        !sameEvidence(last.raw,rawRectangle(model)) ||
        !sameEvidence(originals,model.board.pairs) ||
        !sameEvidence([...originals].sort((a,b) => a[0]-b[0]),expected) ||
        !inspect(task,model).correct) return null;

    return {
      kind,nodeId,sessionId,index:context.index,total,
      pairs:expected,
      observed:originals,
      attempts,
      learnerMasteryAssessed:false
    };
  } catch {
    return null;
  }
}

export function submittedP107FactorPairsEvidence(task,model,record,context) {
  if (!latestSubmissionMatches(model,record)) return null;
  return replayP107FactorPairsEvidence(task,model,context);
}
