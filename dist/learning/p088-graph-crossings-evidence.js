import {initial, inspect, valid} from './phase5/b39-model.js';
import {
  hasExactKeys,
  isEvidenceContext,
  latestSubmissionMatches,
  matchesNativeEvidenceTask,
  sameEvidence
} from './evidence-contract.js';

const sessionId = 'graph39';
const nodeId = 'mt_Yw27nweoTj';
const type = 'x-s39-graph';
const common = {graph:'curve',xMin:-3,xMax:3,yMin:-4,yMax:5};
const reviewed = {
  1:{
    taskHash:'bf7420bd91a1ca427da93ba9557927ff91fb0e9bc67e1c1835d2713fc48febf7',
    task:{type,prompt:'曲线和横轴在哪里相遇？两边都找一找。',mode:'roots',
      ...common,offset:-2,tolerance:0.16,targets:[-1.4142135623730951,1.4142135623730951]},
    question:'在哪两处，曲线的高度和横轴同为 0？'
  },
  2:{
    taskHash:'eb0ba02a834cb5dc63f5f7d0fbebaa18646bacf04a479eb664313b0efb117822',
    task:{type,prompt:'曲线与另一条线在哪些位置相遇？',mode:'intersection',
      ...common,offset:-4,tolerance:0.16,targets:[-1.5615528128088303,2.5615528128088303]},
    question:'沿着两条线找一找，在哪两个横向位置，它们的高度一样？'
  }
};

export const P088_SOURCES = Object.freeze(Object.entries(reviewed).map(([index,{taskHash}]) =>
  Object.freeze({sessionId,index:Number(index),nodeId,type,taskHash})
));

export function p088GraphCrossingsBinding(task,context) {
  if (!isEvidenceContext(context) || context.sessionId !== sessionId ||
      !sameEvidence(task,reviewed[context.index]?.task) ||
      !matchesNativeEvidenceTask(task,context,{type,nodeId})) return null;
  return {nodeId,kind:'p088-graph-crossings',method:null,question:reviewed[context.index].question};
}

function sampledCursor(text,task) {
  if (!/^-?(?:\d+(?:\.\d{1,8})?|\.\d{1,8})$/.test(text.trim())) return null;
  const value = Number(text);
  return value >= task.xMin && value <= task.xMax ? value : null;
}

export function replayP088GraphCrossingsEvidence(task,model,context) {
  try {
    const binding = p088GraphCrossingsBinding(task,context);
    if (!binding || !hasExactKeys(model,Object.keys(initial(task))) || !valid(task,model) ||
        model.issue !== '' || !model.history.length ||
        Object.keys(model.history).length !== model.history.length) return null;

    const marks = [];
    const actions = [];
    for (const event of model.history) {
      if (!hasExactKeys(event,['a','i','v','w','c']) || event.i || event.w || event.c) return null;
      const cursor = sampledCursor(event.v,task);
      if (cursor === null) return null;
      if (event.a === 'mark') {
        marks.push(cursor);
        actions.push({action:'mark',cursor});
      } else if (event.a === 'undo') {
        actions.push({action:'undo',removed:marks.pop() ?? null});
      } else {
        return null;
      }
    }

    // At a crossing x² + offset = slope * x. Completing the square
    // gives the two positions center ± sqrt(center² - offset).
    const slope = task.mode === 'intersection' ? 1 : 0;
    const center = slope/2;
    const radius = Math.sqrt(center*center-task.offset);
    const roots = [center-radius,center+radius];
    const crossings = [];
    for (const expected of roots) {
      const close = marks.filter(x => Math.abs(x-expected) <= task.tolerance);
      if (!close.length) return null;
      const nearest = close.reduce((best,x) =>
        Math.abs(x-expected) < Math.abs(best-expected) ? x : best);
      const curveY = nearest*nearest+task.offset;
      const lineY = slope === 0 ? 0 : nearest;
      crossings.push({expected,marked:nearest,error:Math.abs(nearest-expected),curveY,lineY});
    }

    if (!sameEvidence(marks,model.board.marks) || !inspect(task,model).correct) return null;
    return {binding,marks,crossings,slope,tolerance:task.tolerance,actions};
  } catch {
    return null;
  }
}

export function submittedP088GraphCrossingsEvidence(task,model,record,context) {
  if (!latestSubmissionMatches(model,record)) return null;
  return replayP088GraphCrossingsEvidence(task,model,context);
}
