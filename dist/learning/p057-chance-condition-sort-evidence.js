import {initial, inspect, valid} from './phase5/b22-model.js';
import {hasExactKeys, latestSubmissionMatches, matchesNativeEvidenceTask, sameEvidence} from './evidence-contract.js';

const source=Object.freeze({sessionId:'chanceindependent',index:2,nodeId:'mt_dlg6i-Lw0I',type:'x-p22-sort',
  taskHash:'40b4314474c8ac6309f3282cff942dd91fd5b4f31b15919d511685aff9d03e0e'});
const taskItems=[
  ['公平硬币第一次和第二次','independent'],
  ['两次从3红2蓝的袋中抽珠，每次放回','independent'],
  ['两次抽珠，第一次拿走红珠不放回','dependent'],
  ['发出一张牌不放回后再发一张','dependent'],
  ['两次独立掷公平骰子','independent']
];
const original={type:source.type,prompt:'把五对事件分别放进“前一次不改变下一次机会”或“前一次改变袋中比例”。',
  items:taskItems,questions:[]};
export const P057_SOURCES=Object.freeze([source]);

export function p057ChanceConditionSortBinding(task,context) {
  if (context?.sessionId!==source.sessionId || context.index!==source.index ||
      !sameEvidence(task,original) || !matchesNativeEvidenceTask(task,context,source)) return null;
  return {nodeId:source.nodeId,kind:'p057-chance-condition-sort',method:null,
    question:'前一次结束后，下一次面对的袋子、牌堆或随机规则有没有变化？'};
}

export function replayP057ChanceConditionSortEvidence(task,model,context) {
  try {
    const binding=p057ChanceConditionSortBinding(task,context);
    if (!binding || !hasExactKeys(model,Object.keys(initial(task,1))) || !valid(task,model) ||
        model.issue!=='' || !model.history.length || Object.keys(model.history).length!==model.history.length) return null;
    const attempts=[], placed=[];
    let cursor=0;
    for (const e of model.history) {
      if (!hasExactKeys(e,['a','f','d']) || !hasExactKeys(e.d,[]) ||
          e.a!=='classify' || !hasExactKeys(e.f,['choice']) || cursor>=taskItems.length ||
          !['','independent','dependent'].includes(e.f.choice)) return null;
      const choice=e.f.choice;
      const changesNextConditions=cursor===2 || cursor===3;
      const accepted=choice===(changesNextConditions?'dependent':'independent');
      attempts.push({index:cursor,choice,changesNextConditions,accepted});
      placed[cursor]=choice;
      if (accepted) cursor++;
    }
    if (cursor!==taskItems.length || model.board.cursor!==cursor ||
        !sameEvidence(placed,model.board.placed) || !inspect(task,model).correct) return null;
    return {binding,placed,attempts};
  } catch {
    return null;
  }
}

export function submittedP057ChanceConditionSortEvidence(task,model,record,context) {
  return latestSubmissionMatches(model,record) ? replayP057ChanceConditionSortEvidence(task,model,context) : null;
}
