import {initial,inspect,valid} from './phase5/b37-model.js';
import {rational} from './phase5/b16-model.js';
import {hasExactKeys,latestSubmissionMatches,matchesNativeEvidenceTask,sameEvidence} from './evidence-contract.js';

const source=Object.freeze({"sessionId": "rateWords37", "index": 3, "nodeId": "mt_ATYLKt0je-", "type": "x-r37-steps", "taskHash": "2380528b4a76c0350550f79d39e6ce6d99f7a97a2234df27dac438a025da3828"});
const original={
  "type": "x-r37-steps",
  "prompt": "速度、单价和密度，后面的单位分别表示什么？",
  "scene": "先看每一单位在比较哪两个量。",
  "steps": [
    {
      "title": "速度",
      "label": "车每小时走多少千米",
      "value": "speed",
      "kind": "choice",
      "options": [
        [
          "speed",
          "千米/小时"
        ],
        [
          "mass",
          "克/立方厘米"
        ]
      ]
    },
    {
      "title": "单价",
      "label": "每千克多少元",
      "value": "price",
      "kind": "choice",
      "options": [
        [
          "price",
          "元/千克"
        ],
        [
          "speed",
          "千米/小时"
        ]
      ]
    },
    {
      "title": "密度",
      "label": "每立方厘米多少克",
      "value": "density",
      "kind": "choice",
      "options": [
        [
          "density",
          "克/立方厘米"
        ],
        [
          "price",
          "元/千克"
        ]
      ]
    }
  ],
  "questions": []
};
const expected=['speed','price','density'];
export const P051_SOURCES=Object.freeze([source]);
export function p051CompoundUnitMeaningBinding(task,context) {
  if (context?.sessionId!==source.sessionId || context.index!==source.index ||
      !sameEvidence(task,original) || !matchesNativeEvidenceTask(task,context,source)) return null;
  return {nodeId:source.nodeId,kind:'p051-compound-unit-meaning',method:null,question:'每个单位的分子和分母分别在说什么？'};
}
export function replayP051CompoundUnitMeaningEvidence(task,model,context) {
  try {
    const binding=p051CompoundUnitMeaningBinding(task,context);
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
export function submittedP051CompoundUnitMeaningEvidence(task,model,record,context) {
  return latestSubmissionMatches(model,record) ? replayP051CompoundUnitMeaningEvidence(task,model,context) : null;
}
