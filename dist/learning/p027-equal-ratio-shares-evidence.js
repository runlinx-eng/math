import {initial, inspect, valid} from './phase5/b37-model.js';
import {hasExactKeys, isEvidenceContext, latestSubmissionMatches, matchesNativeEvidenceTask, sameEvidence} from './evidence-contract.js';
import {rational} from './phase5/b16-model.js';

const reviewed = [
  {
    "sessionId": "modelChoice38",
    "index": 0,
    "nodeId": "mt_yqZiX6vS7D",
    "type": "x-r37-share",
    "taskHash": "4fe2a93628c3b9d1c6a1d389ee4ca5daaf88ab2d748cb85e31a267fa966c7c53",
    "task": {
      "type": "x-r37-share",
      "prompt": "40颗按3:5分给甲和乙。先分成一样大的小份。",
      "total": 40,
      "parts": [
        3,
        5
      ],
      "labels": [
        "甲",
        "乙"
      ],
      "questions": [
        {
          "label": "一份多少颗",
          "value": 5
        },
        {
          "label": "甲得到多少颗",
          "value": 15
        },
        {
          "label": "乙得到多少颗",
          "value": 25
        }
      ],
      "unit": "颗"
    }
  },
  {
    "sessionId": "advancedPlan38",
    "index": 0,
    "nodeId": "mt_FieL-vVTI_",
    "type": "x-r37-share",
    "taskHash": "4fe2a93628c3b9d1c6a1d389ee4ca5daaf88ab2d748cb85e31a267fa966c7c53",
    "task": {
      "type": "x-r37-share",
      "prompt": "40颗按3:5分给甲和乙。先分成一样大的小份。",
      "total": 40,
      "parts": [
        3,
        5
      ],
      "labels": [
        "甲",
        "乙"
      ],
      "questions": [
        {
          "label": "一份多少颗",
          "value": 5
        },
        {
          "label": "甲得到多少颗",
          "value": 15
        },
        {
          "label": "乙得到多少颗",
          "value": 25
        }
      ],
      "unit": "颗"
    }
  }
];
export const P027_SOURCES = Object.freeze(reviewed.map(({task, ...source}) => Object.freeze(source)));
export function p027EqualRatioSharesBinding(task, context) {
  if (!isEvidenceContext(context)) return null;
  const entry = reviewed.find(source => source.sessionId === context.sessionId && source.index === context.index);
  if (!entry || !sameEvidence(task, entry.task) || !matchesNativeEvidenceTask(task, context, entry)) return null;
  return {nodeId:entry.nodeId, kind:'p027-equal-ratio-shares', method:null, question:"把 40 颗分成 8 份后，甲和乙各得到多少？"};
}
export function replayP027EqualRatioSharesEvidence(task, model, context) {
  try {
    const binding = p027EqualRatioSharesBinding(task, context);
    if (!binding || !hasExactKeys(model, Object.keys(initial(task))) || !valid(task, model) ||
        model.issue !== '' || !model.history.length || Object.keys(model.history).length !== model.history.length) return null;
    const parts = [3,5];
    const shares = parts.reduce((sum,value) => sum + value, 0);
    let owner = 0;
    const slots = Array(shares).fill(-1);
    for (const event of model.history) {
      if (!hasExactKeys(event,['a','i','v','w','c']) || event.v !== '' || event.w !== '' || event.c !== '' ||
          !/^\d+$/.test(event.i)) return null;
      const index = Number(event.i);
      if (event.a === 'person' && index < parts.length) owner = index;
      else if (event.a === 'slot' && index < shares) slots[index] = slots[index] === owner ? -1 : owner;
      else return null;
    }
    const counts = parts.map((_,i) => slots.filter(value => value === i).length);
    const perShare = 40 / shares;
    const quantities = counts.map(count => count * perShare);
    if (!sameEvidence(parts,counts) || !sameEvidence({bad:false,first:{},owner,slots},model.board) ||
        ![perShare,...quantities].every((expected,i) => {
          const value = rational(model.answers[i].trim().replace(/\s*\/\s*/g,'/'));
          return value && BigInt(value[0]) === BigInt(expected) * BigInt(value[1]);
        }) || !inspect(task,model).correct) return null;
    return {binding, perShare, quantities, slots};

  } catch {
    return null;
  }
}
export function submittedP027EqualRatioSharesEvidence(task, model, record, context) {
  return latestSubmissionMatches(model, record) ? replayP027EqualRatioSharesEvidence(task, model, context) : null;
}
