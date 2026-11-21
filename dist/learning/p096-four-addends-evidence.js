import {initial, inspect, number, valid} from './phase5/b11-model.js';
import {
  hasExactKeys,
  isEvidenceContext,
  latestSubmissionMatches,
  matchesNativeEvidenceTask,
  sameEvidence
} from './evidence-contract.js';

const sessionId = 'fourparts';
const nodeId = 'mt_TiQbi027PE';
const type = 'x-groupfour';
const kind = 'p096-four-addends';
const reviewed = [
  {
    taskHash:'3c25b3adb7a3bbeee22db288a1a028178d6f16b1ff75140ddb7d852694e0d77e',
    task:{type,values:[15,18,25,12],prompt:'四堆里先挑两堆结伴，试着找出整十；每堆只用一次。'}
  },
  {
    taskHash:'8025fe7d96f89d644b30efc6bebd60da71c8be3ab9c0447dd965dacf41a5cd74',
    task:{type,values:[24,17,26,13],prompt:'换四堆，再自由选择先合哪一对。'}
  }
];

export const P096_SOURCES = Object.freeze(reviewed.map(({taskHash},index) =>
  Object.freeze({sessionId,index,nodeId,type,taskHash})
));

export function p096FourAddendsBinding(task,context) {
  if (!isEvidenceContext(context) || context.sessionId !== sessionId ||
      !sameEvidence(task,reviewed[context.index]?.task) ||
      !matchesNativeEvidenceTask(task,context,{type,nodeId})) return null;
  return {nodeId,kind,method:null,question:'哪两堆先合成多少？原来的每一堆怎样进入最后的总数？'};
}

const sum = values => values.reduce((total,value) => total+value,0);

export function replayP096FourAddendsEvidence(task,model,context) {
  try {
    const binding = p096FourAddendsBinding(task,context);
    if (!binding || !hasExactKeys(model,Object.keys(initial(task))) || !valid(task,model) ||
        model.issue !== '' || model.subtotal !== '' || !sameEvidence(model.selected,[]) ||
        !model.history.length || Object.keys(model.history).length !== model.history.length) return null;

    let groups = task.values.map((value,id) => ({ids:[id],value}));
    const merged = [], attempts = [];
    for (const [index,event] of model.history.entries()) {
      if (!hasExactKeys(event,['action','left','right','answer']) || event.action !== 'b11-group-merge') return null;
      const leftIndex = groups.findIndex(group => sameEvidence(group,event.left));
      const rightIndex = groups.findIndex(group => sameEvidence(group,event.right));
      if (leftIndex < 0 || rightIndex < 0 || leftIndex === rightIndex) return null;
      const left = groups[leftIndex], right = groups[rightIndex];
      const ids = [...left.ids,...right.ids];
      const value = left.value+right.value;
      if (new Set(ids).size !== ids.length || sum(ids.map(id => task.values[id])) !== value) return null;
      const accepted = number(event.answer) === value;
      attempts.push({index,left:left.ids,right:right.ids,raw:event.answer,value,accepted,
        makesWholeTen:accepted && value%10 === 0});
      if (accepted) {
        merged.push({left,right,answer:event.answer});
        groups = groups.filter((_,i) => i !== leftIndex && i !== rightIndex);
        groups.push({ids,value});
      }
    }
    const total = sum(task.values);
    if (merged.length !== 3 || groups.length !== 1 || groups[0].value !== total ||
        !sameEvidence([...groups[0].ids].sort(),[0,1,2,3]) ||
        !sameEvidence(groups,model.groups) || !sameEvidence(merged,model.merges) ||
        !inspect(task,model).correct) return null;

    return {
      kind,nodeId,sessionId,index:context.index,
      originalAddends:[...task.values],total,merges:merged,attempts,
      individualSelectionTimingAssessed:false,learnerMasteryAssessed:false
    };
  } catch {
    return null;
  }
}

export function submittedP096FourAddendsEvidence(task,model,record,context) {
  if (!latestSubmissionMatches(model,record)) return null;
  return replayP096FourAddendsEvidence(task,model,context);
}
