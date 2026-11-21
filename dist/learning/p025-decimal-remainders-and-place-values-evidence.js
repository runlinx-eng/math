import {initial, inspect, valid} from './phase5/b17-model.js';
import {hasExactKeys, isEvidenceContext, latestSubmissionMatches, matchesNativeEvidenceTask, sameEvidence} from './evidence-contract.js';
import {rational} from './phase5/b16-model.js';
import * as longDivision from './phase5/b09-model.js';

const reviewed = [
  {
    "sessionId": "numberworld",
    "index": 0,
    "nodeId": "mt_b4lbTOJYwI",
    "type": "x-decimalmachine",
    "taskHash": "7228c4f28d13061875474fe9e216b9738460f3e2263adb2b4d1bbb18724f40d5",
    "task": {
      "type": "x-decimalmachine",
      "n": 3,
      "d": 4,
      "prompt": "把3平均分给4份。每次把余数拆成十份，再分一轮，看看小数会不会停。"
    }
  },
  {
    "sessionId": "numberworld",
    "index": 1,
    "nodeId": "mt_b4lbTOJYwI",
    "type": "x-decimalmachine",
    "taskHash": "ab243c3a8ab295da5ffe45e433e3a929d2ad81776a9988c168ca8409c0f36b95",
    "task": {
      "type": "x-decimalmachine",
      "n": 1,
      "d": 3,
      "prompt": "把1平均分给3份。做一轮后，余数是不是又回来了？"
    }
  },
  {
    "sessionId": "numberworld",
    "index": 2,
    "nodeId": "mt_b4lbTOJYwI",
    "type": "x-decimalmachine",
    "taskHash": "6d71d665d015698ce9e3b432e7e9f73d0908c752f60bf18f9c5cf998f35bc34d",
    "task": {
      "type": "x-decimalmachine",
      "n": 1,
      "d": 6,
      "prompt": "把1平均分给6份。先出现一个不同的数字，再看看哪一部分开始重复。"
    }
  },
  {
    "sessionId": "decimalorder2",
    "index": 1,
    "nodeId": "mt_IegHBHERVa",
    "type": "x-decimalcompare",
    "taskHash": "3ee32a546de35082cfdd61f9dc41d1c83e5b1c42ad78e0e3c968900c7954c426",
    "task": {
      "type": "x-decimalcompare",
      "cases": [
        [
          "3.72",
          "3.27"
        ],
        [
          "0.45",
          "0.54"
        ]
      ],
      "prompt": "对齐同一种单位，从大的位置开始看。在哪里第一次不同？"
    }
  },
  {
    "sessionId": "raggeddecimals",
    "index": 0,
    "nodeId": "mt_933BohS9BH",
    "type": "x-decimalcompare",
    "taskHash": "a04af8d666a26fa8753244a78b1d6e961371c465b7836ffbe55c24e70bed0777",
    "task": {
      "type": "x-decimalcompare",
      "cases": [
        [
          "0.45",
          "0.405"
        ],
        [
          "0.4",
          "0.87"
        ],
        [
          "0.9",
          "0.11"
        ]
      ],
      "prompt": "有时写得长的更大，有时更小。让每种单位对齐后决定。"
    }
  },
  {
    "sessionId": "raggeddecimals",
    "index": 2,
    "nodeId": "mt_933BohS9BH",
    "type": "x-decimalcompare",
    "taskHash": "8b9cd2be5b6affb2de2e861d2ae7a9232ac38510f09cd52901dbf63cc27081db",
    "task": {
      "type": "x-decimalcompare",
      "cases": [
        [
          "0.7",
          "0.70"
        ],
        [
          "0.70",
          "0.700"
        ]
      ],
      "prompt": "末尾多一个0，整条的量到底有没有变？逐列看一看。"
    }
  }
];
export const P025_SOURCES = Object.freeze(reviewed.map(({task, ...source}) => Object.freeze(source)));
export function p025DecimalRemaindersAndPlaceValuesBinding(task, context) {
  if (!isEvidenceContext(context)) return null;
  const entry = reviewed.find(source => source.sessionId === context.sessionId && source.index === context.index);
  if (!entry || !sameEvidence(task, entry.task) || !matchesNativeEvidenceTask(task, context, entry)) return null;
  return {nodeId:entry.nodeId, kind:'p025-decimal-remainders-and-place-values', method:null, question:"怎么用余数判断小数结束或循环？比较小数时哪一位先不同？"};
}
export function replayP025DecimalRemaindersAndPlaceValuesEvidence(task, model, context) {
  try {
    const binding = p025DecimalRemaindersAndPlaceValuesBinding(task, context);
    if (binding && task.type === 'x-decimalmachine') return divisionEvidence(task, model, binding);
    if (!binding || !hasExactKeys(model, Object.keys(initial(task))) || !valid(task, model) ||
        model.issue !== '' || !model.history.length || Object.keys(model.history).length !== model.history.length) return null;
    const columns = task.cases.map(pair => {
      const parts = pair.map(raw => raw.split('.'));
      const places = Math.max(...parts.map(([,tail]) => tail.length));
      const width = Math.max(...parts.map(([whole]) => whole.length));
      const padded = parts.map(([whole,tail]) => whole+'.'+tail.padEnd(places,'0'));
      const digits = parts.map(([whole,tail]) => whole.padStart(width,'0')+tail.padEnd(places,'0'));
      const first = [...digits[0]].findIndex((digit,i) => digit !== digits[1][i]);
      return {pair,padded,length:first < 0 ? width+places : first+1,
        relation:first < 0 ? '=' : digits[0][first] < digits[1][first] ? '<' : '>'};
    });
    const first = [], records = [];
    let scanned = [], predicted = false, padded = false;
    let failedActions = 0, issue = false;
    const fieldNames = Object.keys(initial(task)).filter(key => !['board','history','issue'].includes(key));
    for (const event of model.history) {
      if (!hasExactKeys(event,['a','d','f']) || !hasExactKeys(event.f,fieldNames)) return null;
      const {a,d,f} = event;
      const row = columns[records.length];
      issue = false;
      if (!hasExactKeys(d,a==='scan'?['index']:[])) return null;
      if (a === 'reset') {
        records.length = 0;
        scanned = [];
        predicted = false;
        padded = false;
        continue;
      }
      if (!row) return null;
      if (a === 'predict-compare' && ['<','=','>'].includes(f.prediction)) {
        first[records.length] ??= f.prediction;
        predicted = true;
      } else if (a === 'pad' && predicted) {
        if (sameEvidence([f.left,f.right],row.padded)) padded = true;
        else issue = true;
      } else if (a === 'scan' && padded) {
        if (d.index === String(scanned.length) && scanned.length < row.length) scanned.push(Number(d.index));
        else issue = true;
      } else if (a === 'compare') {
        if (!padded || scanned.length !== row.length || f.relation !== row.relation) issue = true;
        else {
          records.push({pair:row.pair,first:first[records.length],scanned,padded:row.padded,relation:row.relation});
          scanned = [];
          predicted = false;
          padded = false;
        }
      } else return null;
      if (issue) failedActions++;
    }
    if (issue || records.length !== columns.length ||
        !sameEvidence({index:records.length,records,first,predicted,scanned,padded},model.board) ||
        !inspect(task,model).correct) return null;
    return {binding, records, failedActions};

  } catch {
    return null;
  }
}
export function submittedP025DecimalRemaindersAndPlaceValuesEvidence(task, model, record, context) {
  return latestSubmissionMatches(model, record) ? replayP025DecimalRemaindersAndPlaceValuesEvidence(task, model, context) : null;
}

function divisionEvidence(task, model, binding) {
  if (!hasExactKeys(model,Object.keys(longDivision.initial(task))) || !longDivision.valid(task,model) ||
      !model.history.length || Object.keys(model.history).length !== model.history.length ||
      !sameEvidence(model.history,model.steps)) return null;
  let remainder = task.n % task.d;
  const seen = new Set();
  const digits = [];
  for (const event of model.history) {
    if (!hasExactKeys(event,['digit','rem']) || remainder === 0 || seen.has(remainder)) return null;
    seen.add(remainder);
    const parts = remainder * 10;
    remainder = parts % task.d;
    const digit = (parts - remainder) / task.d;
    if (event.digit !== digit || event.rem !== remainder) return null;
    digits.push(digit);
  }
  const kind = remainder === 0 ? 'ends' : seen.has(remainder) ? 'repeats' : null;
  const fraction = rational(model.fraction.trim().replace(/\s*\/\s*/g,'/'));
  if (!kind || kind !== model.kind || !fraction ||
      BigInt(fraction[0])*BigInt(task.d) !== BigInt(task.n)*BigInt(fraction[1]) ||
      !longDivision.inspect(task, model).correct) return null;
  return {binding, digits, finalRemainder:remainder, kind};
}
