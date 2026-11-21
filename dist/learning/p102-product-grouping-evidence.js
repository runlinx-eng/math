import {initial, inspect, number, valid} from './phase5/b13-model.js';
import {
  hasExactKeys,
  isEvidenceContext,
  latestSubmissionMatches,
  matchesNativeEvidenceTask,
  sameEvidence
} from './evidence-contract.js';

const sessionId = 'structurechoices';
const nodeId = 'mt_hlGKg5M7qJ';
const type = 'x-mulchain';
const kind = 'p102-product-grouping';
const reviewed = [
  {
    taskHash:'ed262920e9d32f3e5f625823ac136556301eea03da332647389d41a4611aab24',
    task:{type,values:[25,4,4],prompt:'16可以分成4×4。自己选先配哪一对，让25×16变好算。'}
  },
  {
    taskHash:'ae24507f82c8981c02bf089eda92dab6c4531f4067b52c01ff6d36f4814b7250',
    task:{type,values:[23,4,4],prompt:'把25换成23，相同的结构还能让一对变成100吗？算完对比两次作品。'}
  }
];

export const P102_SOURCES = Object.freeze(reviewed.map(({taskHash},index) =>
  Object.freeze({sessionId,index,nodeId,type,taskHash})
));

export function p102ProductGroupingBinding(task,context) {
  if (!isEvidenceContext(context) || context.sessionId !== sessionId ||
      !sameEvidence(task,reviewed[context.index]?.task) ||
      !matchesNativeEvidenceTask(task,context,{type,nodeId})) return null;
  return {nodeId,kind,method:null,question:'先合了哪两个原数？另外一个数怎样进入最后的乘积？'};
}

export function replayP102ProductGroupingEvidence(task,model,context) {
  try {
    const binding = p102ProductGroupingBinding(task,context);
    if (!binding || !hasExactKeys(model,Object.keys(initial(task))) || !valid(task,model) ||
        model.issue !== '' || !model.history.length ||
        Object.keys(model.history).length !== model.history.length) return null;

    let groups = task.values.map((value,id) => ({ids:[id],value}));
    let selected = [];
    const merges = [], actions = [];
    for (const [index,event] of model.history.entries()) {
      const data = event.data;
      if (data.bucket !== null || data.token !== null) return null;
      if (event.action === 'b13-chain-pick') {
        const groupIndex = data.index;
        if (groups.length < 2 || !Number.isInteger(groupIndex) || groupIndex < 0 || groupIndex >= groups.length) return null;
        const previous = selected.indexOf(groupIndex);
        if (previous >= 0) selected.splice(previous,1);
        else if (selected.length < 2) selected.push(groupIndex);
        actions.push({index,action:'pick',ids:[...groups[groupIndex].ids],selected:selected.includes(groupIndex)});
        continue;
      }
      if (data.index !== null) return null;
      if (event.action === 'b13-chain-undo') {
        const merge = merges.pop();
        if (!merge) return null;
        groups = merge.before;
        selected = [];
        actions.push({index,action:'undo',restored:groups.map(group => ({ids:[...group.ids],value:group.value}))});
        continue;
      }
      if (event.action !== 'b13-chain-merge' || selected.length !== 2) return null;
      const [first,second] = selected;
      const left = groups[first], right = groups[second];
      const value = left.value*right.value;
      const ids = [...left.ids,...right.ids];
      if (new Set(ids).size !== ids.length ||
          ids.reduce((product,id) => product*task.values[id],1) !== value) return null;
      const accepted = number(data.result) === value;
      actions.push({index,action:'merge',left:left.ids,right:right.ids,product:value,raw:data.result,accepted});
      if (accepted) {
        merges.push({before:groups,left,right,result:data.result});
        groups = groups.filter((_,i) => i !== first && i !== second);
        groups.push({ids,value});
        selected = [];
      }
    }

    const product = task.values.reduce((total,value) => total*value,1);
    if (merges.length !== 2 || groups.length !== 1 || groups[0].value !== product ||
        !sameEvidence([...groups[0].ids].sort(),[0,1,2]) ||
        !sameEvidence({groups,selected,merges},model.board) || model.result !== '' ||
        number(model.answer) !== product || !inspect(task,model).correct) return null;

    return {
      kind,nodeId,sessionId,index:context.index,
      factors:[...task.values],product,merges,actions,
      learnerMasteryAssessed:false
    };
  } catch {
    return null;
  }
}

export function submittedP102ProductGroupingEvidence(task,model,record,context) {
  if (!latestSubmissionMatches(model,record)) return null;
  return replayP102ProductGroupingEvidence(task,model,context);
}
