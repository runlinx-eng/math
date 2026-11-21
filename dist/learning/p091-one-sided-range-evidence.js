import {cmp, normalized, parse} from './phase5/b09-math.js';
import {initial, inspect, valid} from './phase5/b09-model.js';
import {
  hasExactKeys,
  isEvidenceContext,
  latestSubmissionMatches,
  matchesNativeEvidenceTask,
  sameEvidence
} from './evidence-contract.js';

const sessionId = 'allowedrange';
const nodeId = 'mt_i2F1nWxJjv';
const type = 'x-allowedrange';
const reviewed = [
  {
    taskHash:'6a24b358799b89eb9025160a1354eef7ada2762f2383937f6db4a55a357933fb',
    task:{type,bound:12,relation:'>=',min:-5,max:17,
      prompt:'长度至少12厘米。x可以取哪些长度？画出范围，用符号写下，并试一试两边。'}
  },
  {
    taskHash:'0fe9148d7f7be7a36807e72749a2649a52cb34dadad9b99ad35d3bd1d9387df4',
    task:{type,bound:-2,relation:'>',min:-7,max:15,
      prompt:'所有大于−2的数都可以。把端点和方向做出来，−2本身算不算？'}
  }
];

export const P091_SOURCES = Object.freeze(reviewed.map(({taskHash},index) =>
  Object.freeze({sessionId,index,nodeId,type,taskHash})
));

export function p091OneSidedRangeBinding(task,context) {
  if (!isEvidenceContext(context) || context.sessionId !== sessionId ||
      !sameEvidence(task,reviewed[context.index]?.task) ||
      !matchesNativeEvidenceTask(task,context,{type,nodeId})) return null;
  return {nodeId,kind:'p091-one-sided-range',method:null,
    question:'端点本身符合题意吗？怎样用数轴上的点和不等号表达这一点？'};
}

export function replayP091OneSidedRangeEvidence(task,model,context) {
  try {
    const binding = p091OneSidedRangeBinding(task,context);
    if (!binding || !hasExactKeys(model,Object.keys(initial(task))) || !valid(task,model) ||
        model.commands.length || model.operation !== '' || model.amount !== '' ||
        model.otherTouched || model.other !== 0 || model.otherClosed !== '' ||
        Object.keys(model.trials).length !== model.trials.length) return null;

    const {bound,relation} = task;
    const inclusive = relation === '>=';
    const reversed = inclusive ? '<=' : '<';
    if (!model.touched || model.boundary !== bound || model.side !== 'right' ||
        model.closed !== (inclusive ? 'yes' : 'no') ||
        !['x'+relation+bound, bound+reversed+'x'].includes(normalized(model.statement))) return null;

    const represented = new Set();
    const trials = [];
    for (const trial of model.trials) {
      if (!hasExactKeys(trial,['value','actual','graph'])) return null;
      const value = parse(trial.value);
      const relative = cmp(value,[bound,1]);
      const allowed = relative === 1 || inclusive && relative === 0;
      if (trial.actual !== allowed) return null;
      // The original record preserves the verdict for the graph in use at the time.
      // It does not preserve that graph's position or open/closed setting.
      const agrees = trial.graph === allowed;
      if (agrees) represented.add(relative);
      trials.push({entered:trial.value,value,relative,allowed,observedGraph:trial.graph,agrees});
    }

    if (represented.size !== 3 || !inspect(task,model).correct) return null;
    return {binding,bound,side:'right',inclusive,relation,statement:model.statement,trials};
  } catch {
    return null;
  }
}

export function submittedP091OneSidedRangeEvidence(task,model,record,context) {
  if (!latestSubmissionMatches(model,record)) return null;
  return replayP091OneSidedRangeEvidence(task,model,context);
}
