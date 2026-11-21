import {initial,inspect,valid} from './phase5/b37-model.js';
import {rational} from './phase5/b16-model.js';
import {hasExactKeys,latestSubmissionMatches,matchesNativeEvidenceTask,sameEvidence} from './evidence-contract.js';

const source=Object.freeze({"sessionId": "model38", "index": 1, "nodeId": "mt_8xVHooT4aI", "type": "x-r37-steps", "taskHash": "3dce8b0f18028dd0e9a1e0da065693f094ac01c7ae1ce603f8dbd3a932a7ac6a"});
const original={
  "type": "x-r37-steps",
  "prompt": "1:50图上的房间为6 cm×4 cm。实际面积多少？",
  "scene": "边长换成实际米，再算面积。",
  "steps": [
    {
      "title": "实际长",
      "label": "实际长多少米",
      "value": 3
    },
    {
      "title": "实际宽",
      "label": "实际宽多少米",
      "value": 2
    },
    {
      "title": "面积",
      "label": "实际多少平方米",
      "value": 6
    },
    {
      "title": "面积倍数",
      "label": "图上平方厘米到实际平方厘米，乘多少",
      "value": 2500
    }
  ],
  "questions": []
};
const expected=[6*50/100,4*50/100,(6*50/100)*(4*50/100),50*50];
export const P050_SOURCES=Object.freeze([source]);
export function p050DrawingAreaScaleBinding(task,context) {
  if (context?.sessionId!==source.sessionId || context.index!==source.index ||
      !sameEvidence(task,original) || !matchesNativeEvidenceTask(task,context,source)) return null;
  return {nodeId:source.nodeId,kind:'p050-drawing-area-scale',method:null,question:'边长各乘 50 后，面积为什么乘 50×50？'};
}
export function replayP050DrawingAreaScaleEvidence(task,model,context) {
  try {
    const binding=p050DrawingAreaScaleBinding(task,context);
    if (!binding || !hasExactKeys(model,Object.keys(initial(task))) || !valid(task,model) ||
        model.issue!=='' || !model.history.length || Object.keys(model.history).length!==model.history.length) return null;
    const records=[];
    let index=0;
    for (const event of model.history) {
      if (!hasExactKeys(event,['a','i','v','w','c']) || event.a!=='step' ||
          event.i!=='' || event.w!=='' || index>=expected.length) return null;
      const target=expected[index];
      const choice=typeof target==='string';
      const answer=choice?event.c:event.v;
      if ((choice?event.v:event.c)!=='') return null;
      const value=choice?null:rational(answer.trim().replace(/\s*\/\s*/g,'/'));
      const correct=choice?answer===target:Boolean(value && value[1]>0 &&
        BigInt(value[0])===BigInt(target)*BigInt(value[1]));
      records.push({index,answer,correct});
      if (correct) index++;
    }
    if (index!==expected.length || model.board.index!==index || !sameEvidence(records,model.board.records) ||
        !inspect(task,model).correct) return null;
    return {binding,expected:[...expected],records};
  } catch {
    return null;
  }
}
export function submittedP050DrawingAreaScaleEvidence(task,model,record,context) {
  return latestSubmissionMatches(model,record) ? replayP050DrawingAreaScaleEvidence(task,model,context) : null;
}
