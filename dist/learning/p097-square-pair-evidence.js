import {initial, inspect, valid} from './phase5/b14-model.js';
import {
  hasExactKeys,
  isEvidenceContext,
  latestSubmissionMatches,
  matchesNativeEvidenceTask,
  sameEvidence
} from './evidence-contract.js';

const sessionId = 'factoruse';
const nodeId = 'mt_0Wg5F97osg';
const type = 'x-squarepair';
const kind = 'p097-square-pair';
const taskHash = 'c5b37c0ff70f96ebcaebbbb46295e044fc3b3ab317b5d1455199500ec3da8a59';
const reviewed = {type,total:100,prompt:'找两个非零平方，拼起来正好100格。自己调整两块正方形的边长。'};

export const P097_SOURCES = Object.freeze([Object.freeze({sessionId,index:3,nodeId,type,taskHash})]);

export function p097SquarePairBinding(task,context) {
  if (!isEvidenceContext(context) || context.sessionId !== sessionId || context.index !== 3 ||
      !sameEvidence(task,reviewed) || !matchesNativeEvidenceTask(task,context,{type,nodeId})) return null;
  return {nodeId,kind,method:null,question:'两块正方形分别有多少格？把每块的格数相加，能刚好拼成多少？'};
}

const rangeValue = /^(?:[0-9]|10)$/;

export function replayP097SquarePairEvidence(task,model,context) {
  try {
    const binding = p097SquarePairBinding(task,context);
    if (!binding || !hasExactKeys(model,Object.keys(initial(task))) || !valid(task,model) ||
        model.issue !== '' || !model.history.length ||
        Object.keys(model.history).length !== model.history.length) return null;

    const trials = [], attempts = [];
    for (const [index,event] of model.history.entries()) {
      const data = event.data;
      if (event.action !== 'b14-square' || data.index !== null || data.side !== null || data.value !== null) return null;
      const raw = [data.fields.sideA,data.fields.sideB];
      if (!raw.every(side => rangeValue.test(side))) return null;
      const sides = raw.map(Number);
      const areas = sides.map(side => side*side);
      const sum = areas[0]+areas[1];
      const recorded = sides.every(side => side>0);
      if (recorded) trials.push(sides);
      attempts.push({index,raw,sides,areas,sum,recorded,accepted:recorded && sum === task.total});
    }
    const saved = attempts.at(-1);
    if (!saved.accepted || !sameEvidence(saved.raw,[model.sideA,model.sideB]) ||
        !sameEvidence(saved.sides,model.board.pair) || !sameEvidence(trials,model.board.trials) ||
        !inspect(task,model).correct) return null;

    return {
      kind,nodeId,sessionId,index:context.index,
      target:task.total,squares:saved.sides.map((side,i) => ({side,area:saved.areas[i]})),
      attempts,learnerMasteryAssessed:false
    };
  } catch {
    return null;
  }
}

export function submittedP097SquarePairEvidence(task,model,record,context) {
  if (!latestSubmissionMatches(model,record)) return null;
  return replayP097SquarePairEvidence(task,model,context);
}
