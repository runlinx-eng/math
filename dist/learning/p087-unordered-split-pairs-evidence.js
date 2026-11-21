import {equation, initial, inspect, valid} from './phase5/b10-model.js';
import {
  hasExactKeys,
  isEvidenceContext,
  latestSubmissionMatches,
  matchesNativeEvidenceTask,
  sameEvidence
} from './evidence-contract.js';

const sessionId = 'splitpairs';
const nodeId = 'mt_7XcCG43ZZW';
const type = 'x-splitbench';
const reviewed = [
  {
    taskHash:'8ac6f9561c8b988d5dd5ce5d0b47f15fb6c989fb1abb263fad06d650248a7494',
    task:{type,total:5,
      prompt:'5颗圆片分两堆，找齐不同配对，交换左右算同一对。记得有一堆可以是零。'}
  },
  {
    taskHash:'3b7905e0627ce951b04880ab2a15d00be0830da00cb26f48a9cc758a25c52a16',
    task:{type,total:8,prompt:'8也不只有一种分法。找到3种不同配对，交换左右不重复算。',count:3}
  }
];

export const P087_SOURCES = Object.freeze(reviewed.map(({taskHash},index) =>
  Object.freeze({sessionId,index,nodeId,type,taskHash})
));

export function p087UnorderedSplitPairsBinding(task,context) {
  if (!isEvidenceContext(context) || context.sessionId !== sessionId ||
      !sameEvidence(task,reviewed[context.index]?.task) ||
      !matchesNativeEvidenceTask(task,context,{type,nodeId})) return null;
  return {nodeId,kind:'p087-unordered-split-pairs',method:null,
    question:'两个堆换位置后还是不是同一种分法？怎样找齐需要的分法？'};
}

export function replayP087UnorderedSplitPairsEvidence(task,model,context) {
  try {
    const binding = p087UnorderedSplitPairsBinding(task,context);
    if (!binding || !hasExactKeys(model,Object.keys(initial(task))) || !valid(task,model) ||
        model.issue !== '' || !model.history.length ||
        Object.keys(model.history).length !== model.history.length ||
        Object.keys(model.saved).length !== model.saved.length) return null;

    const total = task.total;
    const allIds = Array.from({length:total},(_,i) => i);
    const possiblePairs = Math.floor(total/2)+1;
    const required = task.count ?? possiblePairs;
    const distinct = new Set();
    const partitions = [];
    const attemptedSaves = [];
    for (const entry of model.history) {
      if (!hasExactKeys(entry,['a','b','eq'])) return null;
      const {a,b,eq} = entry;
      if (!Number.isInteger(a) || a < 0 || a > total || b !== total-a ||
          typeof eq !== 'string' || eq.length > 2000) return null;
      const smaller = Math.min(a,b);
      if (!equation(eq,a,b,'+',total)) {
        attemptedSaves.push({a,b,eq,accepted:false,reason:'equation'});
        continue;
      }
      if (distinct.has(smaller)) {
        attemptedSaves.push({a,b,eq,accepted:false,reason:'reversed-or-repeat'});
        continue;
      }
      const saved = model.saved[partitions.length];
      if (!hasExactKeys(saved,['a','b','ids','eq']) || saved.a !== a || saved.b !== b || saved.eq !== eq) return null;
      const leftIds = [...saved.ids], rightIds = allIds.filter(id => !leftIds.includes(id));
      if (leftIds.length !== a || rightIds.length !== b) return null;
      distinct.add(smaller);
      partitions.push({leftIds,rightIds,pair:[smaller,total-smaller],equation:eq});
      attemptedSaves.push({a,b,eq,accepted:true});
    }

    if (partitions.length !== model.saved.length || distinct.size < required ||
        !inspect(task,model).correct) return null;
    return {binding,total,possiblePairs,required,partitions,attemptedSaves};
  } catch {
    return null;
  }
}

export function submittedP087UnorderedSplitPairsEvidence(task,model,record,context) {
  if (!latestSubmissionMatches(model,record)) return null;
  return replayP087UnorderedSplitPairsEvidence(task,model,context);
}
