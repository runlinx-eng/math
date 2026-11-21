import {initial,inspect,valid} from './phase5/b19-model.js';
import {hasExactKeys,latestSubmissionMatches,matchesNativeEvidenceTask,sameEvidence} from './evidence-contract.js';

const source=Object.freeze({sessionId:'checkrecords',index:1,nodeId:'mt_QHT16CrFO-',type:'x-datakind',
  taskHash:'278ca8beb1bb93f7d27e4a493d1b15a782c5d3b0d09de66a0cbeb0bfea530584'});
const original={type:source.type,prompt:'把三种记录分组。能排出高低，不代表每一级相差一样多。',
  cards:[{label:'最喜欢的颜色：红、蓝、绿',kind:'nominal'},
    {label:'满意程度：1很不满意 → 5很满意',kind:'ordinal'},
    {label:'交通方式：走路、骑车、公交',kind:'nominal'}]};
const orderedCard=[false,true,false];
export const P053_SOURCES=Object.freeze([source]);
export function p053DataKindOrderBinding(task,context) {
  if (context?.sessionId!==source.sessionId || context.index!==source.index ||
      !sameEvidence(task,original) || !matchesNativeEvidenceTask(task,context,source)) return null;
  return {nodeId:source.nodeId,kind:'p053-data-kind-order',method:null,
    question:'哪些类别本身能分高低？能分高低时，为什么还不能说每级的差相等？'};
}
export function replayP053DataKindOrderEvidence(task,model,context) {
  try {
    const binding=p053DataKindOrderBinding(task,context);
    if (!binding || !hasExactKeys(model,Object.keys(initial(task))) || !valid(task,model) ||
        model.issue!=='' || !model.history.length || Object.keys(model.history).length!==model.history.length) return null;
    const placed=['','',''], submissions=[];
    let saved=false;
    for (const e of model.history) {
      if (!hasExactKeys(e,['a','f','d'])) return null;
      if (e.a==='kind' && hasExactKeys(e.d,['index','kind']) && /^[0-2]$/.test(e.d.index) &&
          ['nominal','ordinal'].includes(e.d.kind)) {
        placed[Number(e.d.index)]=e.d.kind;
        saved=false;
      } else if (e.a==='classify' && hasExactKeys(e.d,[])) {
        const {orderReason,precisionReason}=e.f;
        saved=orderedCard.every((ordered,i)=>placed[i]===(ordered?'ordinal':'nominal')) &&
          orderReason==='order' && precisionReason==='not-equal';
        submissions.push({placed:[...placed],orderReason,precisionReason,accepted:saved});
      } else return null;
    }
    if (!saved || !sameEvidence(placed,model.board.placed) || model.board.saved!==true ||
        model.orderReason!=='order' || model.precisionReason!=='not-equal' ||
        !inspect(task,model).correct) return null;
    return {binding,placed,submissions};
  } catch {
    return null;
  }
}
export function submittedP053DataKindOrderEvidence(task,model,record,context) {
  return latestSubmissionMatches(model,record) ? replayP053DataKindOrderEvidence(task,model,context) : null;
}
