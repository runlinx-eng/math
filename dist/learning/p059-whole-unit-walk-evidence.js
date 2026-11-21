import {initial, inspect, valid} from './phase5/b16-model.js';
import {replayWalkHistory} from './unitwalk-evidence.js';
import {hasExactKeys, latestSubmissionMatches, matchesNativeEvidenceTask, sameEvidence} from './evidence-contract.js';

const source = Object.freeze({
  sessionId:'wholefractions',index:0,nodeId:'mt_AYzE1EAvI0',type:'x-unitwalk',
  taskHash:'dabf9dc0e71a31b56110233f473f9e91fefc4fe4a6625b5486e613d9388be562'
});
const original = {
  type:source.type,n:5,d:1,
  prompt:'每个整体不再切开，一步走一个，走出5。用下面是1的分数给它命名。'
};
export const P059_SOURCES = Object.freeze([source]);

export function p059WholeUnitWalkBinding(task,context) {
  if (context?.sessionId !== source.sessionId || context.index !== source.index ||
      !sameEvidence(task,original) || !matchesNativeEvidenceTask(task,context,source)) return null;
  return {nodeId:source.nodeId,kind:'p059-whole-unit-walk',method:null,
    question:'每一步走一个完整的 1。走五步时，为什么可以写成 5/1？'};
}

export function replayP059WholeUnitWalkEvidence(task,model,context) {
  try {
    const binding = p059WholeUnitWalkBinding(task,context);
    if (!binding || !hasExactKeys(model,Object.keys(initial(task))) ||
        !valid(task,model) || !/^\s*\+?0*5\s*[/／]\s*\+?0*1\s*$/.test(model.answer)) return null;

    const history = replayWalkHistory(task,model);
    if (!history || history.current.cause !== 'partition' || history.board.parts !== 1 ||
        history.current.advances-history.current.retreats !== task.n ||
        !inspect(task,model).correct) return null;
    return {binding,start:[0,1],end:[task.n,1],unit:[1,1],history};
  } catch {
    return null;
  }
}

export function submittedP059WholeUnitWalkEvidence(task,model,record,context) {
  return latestSubmissionMatches(model,record) ? replayP059WholeUnitWalkEvidence(task,model,context) : null;
}
