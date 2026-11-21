import {initial, inspect, valid} from './phase5/b20-model.js';
import {hasExactKeys, isEvidenceContext, latestSubmissionMatches, matchesNativeEvidenceTask, sameEvidence} from './evidence-contract.js';

const reviewed = [
  {
    "sessionId": "digitalcharts",
    "index": 0,
    "nodeId": "mt_X53txVXOcG",
    "type": "x-eventchart",
    "taskHash": "77d20444cc0fd8e9a48f95fa449f648c5545216b26c7c68594fc2ccdef5d5996",
    "task": {
      "type": "x-eventchart",
      "prompt": "把这份模拟水果投票逐条记下来，再换成图画和表。哪类最多，哪类最少？",
      "labels": [
        "苹果",
        "香蕉",
        "梨"
      ],
      "events": [
        0,
        1,
        0,
        2,
        0,
        1,
        0,
        2,
        1,
        0,
        1,
        0
      ],
      "scale": 2
    }
  },
  {
    "sessionId": "digitalcharts",
    "index": 1,
    "nodeId": "mt_X53txVXOcG",
    "type": "x-eventchart",
    "taskHash": "6d200515d4fb6e30f2562ea97181e5f871f4b19d3e0a8bc64069d596849464d5",
    "task": {
      "type": "x-eventchart",
      "prompt": "看一次模拟鸟观察，记一笔。不要等结束后凭印象猜总数。",
      "labels": [
        "麻雀",
        "鸽子",
        "喜鹊"
      ],
      "events": [
        0,
        0,
        1,
        2,
        0,
        1,
        0,
        2,
        1
      ],
      "scale": 1
    }
  },
  {
    "sessionId": "digitalcharts",
    "index": 2,
    "nodeId": "mt_X53txVXOcG",
    "type": "x-eventchart",
    "taskHash": "832c653b73ca54dd2fdd79be7e744d7c3bf3fa643477f8247a293c319da685ec",
    "task": {
      "type": "x-eventchart",
      "prompt": "模拟落下纸杯10次，每次按结果记一笔，再整理成表。这是计数练习，不代表真实纸杯的落地概率。",
      "labels": [
        "杯口朝上",
        "杯口朝下",
        "侧躺"
      ],
      "random": true,
      "n": 10,
      "seed": 202620,
      "scale": 1
    }
  }
];
export const P033_SOURCES = Object.freeze(reviewed.map(({task, ...source}) => Object.freeze(source)));
export function p033ObservationTallyBinding(task, context) {
  if (!isEvidenceContext(context)) return null;
  const entry = reviewed.find(source => source.sessionId === context.sessionId && source.index === context.index);
  if (!entry || !sameEvidence(task, entry.task) || !matchesNativeEvidenceTask(task, context, entry)) return null;
  return {nodeId:entry.nodeId, kind:'p033-observation-tally', method:null, question:"为什么每次观察后记一笔，再用表格和图画核对次数？"};
}
export function replayP033ObservationTallyEvidence(task, model, context) {
  try {
    const binding = p033ObservationTallyBinding(task, context);
    if (!binding || !hasExactKeys(model, Object.keys(initial(task))) || !valid(task, model) ||
        model.issue !== '' || !model.history.length || Object.keys(model.history).length !== model.history.length) return null;
    let seed = BigInt(task.seed || 0);
    const expected = task.random ? Array.from({length:task.n}, () => {
      seed = (1664525n * seed + 1013904223n) % (2n ** 32n);
      return Number(seed * BigInt(task.labels.length) / (2n ** 32n));
    }) : [...task.events];
    const fields = Object.keys(initial(task)).filter(key => !['board','history','issue'].includes(key));
    const first = {}, draws = [], records = [], views = new Set();
    let view = 'table';
    let failedTallies = 0;
    let issue = false;
    for (const event of model.history) {
      if (!hasExactKeys(event,['a','d','f']) || !hasExactKeys(event.f,fields)) return null;
      issue = false;
      if (event.a === 'reset' && hasExactKeys(event.d,[])) {
        draws.length = 0;
        records.length = 0;
        views.clear();
        view = 'table';
        continue;
      }
      first[event.a + '-0'] ??= event.f;
      if (event.a === 'observe' && hasExactKeys(event.d,[])) {
        if (records.length === draws.length && draws.length < expected.length) draws.push(expected[draws.length]);
      } else if (event.a === 'tally' && hasExactKeys(event.d,['index']) && /^\d+$/.test(event.d.index)) {
        const index = Number(event.d.index);
        if (index >= task.labels.length || records.length >= draws.length) return null;
        if (draws.at(-1) === index) records.push(index);
        else {
          failedTallies++;
          issue = true;
        }
      } else if (event.a === 'view' && hasExactKeys(event.d,['kind']) && ['table','picture'].includes(event.d.kind)) {
        view = event.d.kind;
        views.add(view);
      } else return null;
    }
    const counts = task.labels.map((_,i) => records.filter(value => value === i).length);
    const integer = text => /^\d+$/.test(text.trim()) ? Number(text) : null;
    if (issue || !sameEvidence(expected,records) || views.size !== 2 || integer(model.value) !== records.length ||
        counts[integer(model.low)] !== Math.min(...counts) || counts[integer(model.high)] !== Math.max(...counts) ||
        !sameEvidence({cursor:0,first,draws,records,views:[...views],view},model.board) || !inspect(task,model).correct) return null;
    return {binding, counts, observations:records.length, simulated:true, failedTallies};

  } catch {
    return null;
  }
}
export function submittedP033ObservationTallyEvidence(task, model, record, context) {
  return latestSubmissionMatches(model, record) ? replayP033ObservationTallyEvidence(task, model, context) : null;
}
