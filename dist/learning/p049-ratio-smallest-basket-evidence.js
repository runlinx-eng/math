import {initial,inspect,valid} from './phase5/b37-model.js';
import {rational} from './phase5/b16-model.js';
import {hasExactKeys,latestSubmissionMatches,matchesNativeEvidenceTask,sameEvidence} from './evidence-contract.js';

const source=Object.freeze({
  "sessionId": "advancedPlan38",
  "index": 1,
  "nodeId": "mt_FieL-vVTI_",
  "type": "x-r37-steps",
  "taskHash": "fa0d999ca4035e429f02a11c1509d839b83aa3c2d90f8a7a4e94fbaab7c1bb58"
});
const original={
  "type": "x-r37-steps",
  "prompt": "54颗按2:3:4分给三个篮子。最少的那篮，每3颗装一袋，能装几袋？",
  "scene": "先按比例分，再给其中一个篮子分袋。",
  "steps": [
    {
      "title": "总份数",
      "label": "2＋3＋4共几份",
      "value": 9
    },
    {
      "title": "一份",
      "label": "54颗平均分9份，一份几颗",
      "value": 6
    },
    {
      "title": "最少一篮",
      "label": "2份共几颗",
      "value": 12
    },
    {
      "title": "装袋",
      "label": "12颗每3颗一袋，共几袋",
      "value": 4
    }
  ],
  "questions": []
};
const totalShares = 2 + 3 + 4;
const perShare = 54 / totalShares;
const smallest = 2 * perShare;
const expected = [totalShares, perShare, smallest, smallest / 3];
export const P049_SOURCES=Object.freeze([source]);
export function p049RatioSmallestBasketBinding(task,context) {
  if (context?.sessionId!==source.sessionId || context.index!==source.index ||
      !sameEvidence(task,original) || !matchesNativeEvidenceTask(task,context,source)) return null;
  return {nodeId:source.nodeId,kind:'p049-ratio-smallest-basket',method:null,question:'为什么先把 54 按总份数分，再只拿最少的两份去装袋？'};
}
export function replayP049RatioSmallestBasketEvidence(task,model,context) {
  try {
    const binding=p049RatioSmallestBasketBinding(task,context);
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
export function submittedP049RatioSmallestBasketEvidence(task,model,record,context) {
  return latestSubmissionMatches(model,record) ? replayP049RatioSmallestBasketEvidence(task,model,context) : null;
}
