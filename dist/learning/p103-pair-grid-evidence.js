import {equal} from './phase5/b16-model.js';
import {initial, inspect, valid} from './phase5/b34-model.js';
import {
  hasExactKeys,
  isEvidenceContext,
  latestSubmissionMatches,
  matchesNativeEvidenceTask,
  sameEvidence
} from './evidence-contract.js';

const sessionId = 'pairs34';
const nodeId = 'mt_gu0NPDvlhY';
const type = 'x-p34-grid';
const kind = 'p103-pair-grid';
const reviewed = [
  {
    taskHash:'861c09b6e87780c3c7c9279c7cbe081213a96e38cae03900b5e147d51128aabc',
    task:{
      type,
      prompt:'三种前菜与四种主菜，点亮所有不同搭配。',
      rows:['汤','沙拉','水果'],
      cols:['饭','面','饼','豆'],
      questions:[{label:'一共几种搭配',value:12,kind:'number'},{label:'用3×4得到多少',value:12,kind:'number'}]
    }
  },
  {
    taskHash:'a6ef31c0a1226f12f6e779595a615a1dbefcc574c86410948787bd5d0a7a9cb2',
    task:{
      type,
      prompt:'换成两种饮料和三种点心。按行配完，再看看有没有漏掉。',
      rows:['水','果汁'],
      cols:['饼干','面包','水果'],
      questions:[{label:'一共几种搭配',value:6,kind:'number'}]
    }
  }
];

export const P103_SOURCES = Object.freeze(reviewed.map(({taskHash},index) =>
  Object.freeze({sessionId,index,nodeId,type,taskHash})
));

export function p103PairGridBinding(task,context) {
  if (!isEvidenceContext(context) || context.sessionId !== sessionId ||
      !sameEvidence(task,reviewed[context.index]?.task) ||
      !matchesNativeEvidenceTask(task,context,{type,nodeId})) return null;
  return {nodeId,kind,method:null,question:'每格怎样对应一种搭配？有多少种不同的行列组合？'};
}

export function replayP103PairGridEvidence(task,model,context) {
  try {
    const binding = p103PairGridBinding(task,context);
    if (!binding || !hasExactKeys(model,Object.keys(initial(task))) || !valid(task,model) ||
        model.issue !== '' || !model.history.length ||
        Object.keys(model.history).length !== model.history.length) return null;

    const pairs = task.rows.flatMap((row,rowIndex) => task.cols.map((column,columnIndex) =>
      ({row,rowIndex,column,columnIndex})));
    const selected = new Set(), toggles = [];
    for (const [index,event] of model.history.entries()) {
      if (!hasExactKeys(event,['a','i','v','w']) || event.a !== 'cell' ||
          event.v !== '' || event.w !== '' || !/^(0|[1-9]\d*)$/.test(event.i)) return null;
      const cell = Number(event.i);
      if (cell >= pairs.length) return null;
      const added = !selected.delete(cell);
      if (added) selected.add(cell);
      toggles.push({index,cell,...pairs[cell],selected:added});
    }

    const liveCells = [...selected].sort((a,b) => a-b);
    if (liveCells.length !== pairs.length || !sameEvidence(liveCells,model.board.selected) ||
        !task.questions.every((q,i) => q.kind === 'number' && q.value === pairs.length && equal(model.answers[i],pairs.length)) ||
        !inspect(task,model).correct) return null;

    return {
      kind,nodeId,sessionId,index:context.index,
      rowCount:task.rows.length,columnCount:task.cols.length,
      pairs,toggles,learnerMasteryAssessed:false
    };
  } catch {
    return null;
  }
}

export function submittedP103PairGridEvidence(task,model,record,context) {
  if (!latestSubmissionMatches(model,record)) return null;
  return replayP103PairGridEvidence(task,model,context);
}
