import {initial, inspect, pixels, valid} from './phase5/b23-model.js';
import {hasExactKeys, latestSubmissionMatches, matchesNativeEvidenceTask, sameEvidence} from './evidence-contract.js';

const source=Object.freeze({
  sessionId:'shapeapprox',index:2,nodeId:'mt_SK7WntVZ6y',type:'x-s23-pixels',
  taskHash:'2f1f3192ad41990e95e59440d572527ea2a1d7f65be4c9c625ba90bff881ca48'
});
const original={
  type:source.type,prompt:'用方格近似覆盖叶子的轮廓，不需要把每一格都涂满。',
  questions:[{label:'用格子画叶子',value:'approx',
    options:[['approx','近似表示轮廓，可以保留误差'],['same','方格一定能精确变成曲线']]}]
};
export const P058_SOURCES=Object.freeze([source]);
const referenceCells=new Set(pixels);

export function p058LeafGridApproximationBinding(task,context) {
  if (context?.sessionId!==source.sessionId || context.index!==source.index ||
      !sameEvidence(task,original) || !matchesNativeEvidenceTask(task,context,source)) return null;
  return {nodeId:source.nodeId,kind:'p058-leaf-grid-approximation',method:null,
    question:'哪些边缘格子有取舍？方格保留了叶子的哪些形状？'};
}

export function replayP058LeafGridApproximationEvidence(task,model,context) {
  try {
    const binding=p058LeafGridApproximationBinding(task,context);
    if (!binding || !hasExactKeys(model,Object.keys(initial(task,1))) || !valid(task,model) ||
        model.issue!=='' || !model.history.length ||
        Object.keys(model.history).length!==model.history.length) return null;
    const selected=new Set(), actions=[];
    for (const event of model.history) {
      if (!hasExactKeys(event,['a','f','d']) || event.a!=='toggle' || !hasExactKeys(event.f,[]) ||
          !hasExactKeys(event.d,['index']) || !/^(?:[0-9]|[1-3][0-9]|4[0-8])$/.test(event.d.index)) return null;
      const cell=Number(event.d.index);
      const removed=selected.delete(cell);
      if (!removed) selected.add(cell);
      actions.push({cell,selected:!removed});
    }
    const covered=[...selected].filter(cell=>referenceCells.has(cell));
    const outside=[...selected].filter(cell=>!referenceCells.has(cell));
    const missed=[...referenceCells].filter(cell=>!selected.has(cell));
    if (covered.length*5<referenceCells.size*4 || outside.length>1 ||
        !sameEvidence([...selected],model.board.selected) ||
        model.answers[0]!=='approx' || !inspect(task,model).correct) return null;
    return {binding,covered,outside,missed,referenceCellCount:referenceCells.size,actions};
  } catch {
    return null;
  }
}

export function submittedP058LeafGridApproximationEvidence(task,model,record,context) {
  return latestSubmissionMatches(model,record) ? replayP058LeafGridApproximationEvidence(task,model,context) : null;
}
