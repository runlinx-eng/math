import {initial, inspect, valid} from './phase5/b39-model.js';
import {hasExactKeys, isEvidenceContext, latestSubmissionMatches, matchesNativeEvidenceTask, sameEvidence} from './evidence-contract.js';

const reviewed = [
  {
    "sessionId": "pattern39",
    "index": 0,
    "nodeId": "mt_RFeVlw0QvX",
    "type": "x-s39-chart",
    "taskHash": "5431b2af50e42e0f0f91d0f74607fbfc6cfa40ec4d4594e66fc9ef556f751822",
    "task": {
      "type": "x-s39-chart",
      "prompt": "从2出发，每次加2，猜接下来的三站。",
      "start": 2,
      "step": 2,
      "count": 3,
      "judgment": "even"
    }
  },
  {
    "sessionId": "pattern39",
    "index": 1,
    "nodeId": "mt_RFeVlw0QvX",
    "type": "x-s39-chart",
    "taskHash": "ef7d0dee13132e4b2481c17a7a2340d61a85a57c5d8878d6fdd9476bfbb09f6e",
    "task": {
      "type": "x-s39-chart",
      "prompt": "起点改成3，每次加2。这次停在哪里？",
      "start": 3,
      "step": 2,
      "count": 3,
      "judgment": "odd"
    }
  },
  {
    "sessionId": "pattern39",
    "index": 2,
    "nodeId": "mt_RFeVlw0QvX",
    "type": "x-s39-chart",
    "taskHash": "f5e064c4a66c39e6baac10d31504b9d93f5ab67dc15ad87bca07c67d71bb1e47",
    "task": {
      "type": "x-s39-chart",
      "prompt": "从19开始每次加1。经过行末后会去哪里？",
      "start": 19,
      "step": 1,
      "count": 2,
      "judgment": null
    }
  },
  {
    "sessionId": "pattern39",
    "index": 3,
    "nodeId": "mt_RFeVlw0QvX",
    "type": "x-s39-chart",
    "taskHash": "3f630341e6ded0ad9248e260b63a790d6520b7dee95711a6b05c5f6464c9ef7f",
    "task": {
      "type": "x-s39-chart",
      "prompt": "百数表每行10个数。从24出发，每次加10。",
      "start": 24,
      "step": 10,
      "count": 3,
      "judgment": null
    }
  }
];
export const P031_SOURCES = Object.freeze(reviewed.map(({task, ...source}) => Object.freeze(source)));
export function p031HundredChartBinding(task, context) {
  if (!isEvidenceContext(context)) return null;
  const entry = reviewed.find(source => source.sessionId === context.sessionId && source.index === context.index);
  if (!entry || !sameEvidence(task, entry.task) || !matchesNativeEvidenceTask(task, context, entry)) return null;
  return {nodeId:entry.nodeId, kind:'p031-hundred-chart', method:null, question:"从当前数字按同一个步长走，下一站在哪里？"};
}
export function replayP031HundredChartEvidence(task, model, context) {
  try {
    const binding = p031HundredChartBinding(task, context);
    if (!binding || !hasExactKeys(model, Object.keys(initial(task))) || !valid(task, model) ||
        model.issue !== '' || !model.history.length || Object.keys(model.history).length !== model.history.length) return null;
    let current = task.start;
    let first = null;
    let bad = false;
    let passed = 0;
    const moves = [];
    for (const event of model.history) {
      if (!hasExactKeys(event,['a','i','v','w','c']) || event.a !== 'hop' || event.i !== '' ||
          event.w !== '' || event.c !== '' || passed >= task.count) return null;
      first ??= event.v;
      const raw = event.v.trim();
      const next = current + task.step;
      const correct = /^-?(?:\d+(?:\.\d{1,8})?|\.\d{1,8})$/.test(raw) && Number(raw) === next;
      moves.push({from:current,guess:event.v,to:next,correct});
      if (correct) {
        current = next;
        passed++;
      } else bad = true;
    }
    if (passed !== task.count || model.guess !== '' || (task.judgment && model.judgment !== (current % 2 ? 'odd' : 'even')) ||
        !sameEvidence({current,moves,first,bad},model.board) || !inspect(task,model).correct) return null;
    return {binding, step:task.step, current, moves};

  } catch {
    return null;
  }
}
export function submittedP031HundredChartEvidence(task, model, record, context) {
  return latestSubmissionMatches(model, record) ? replayP031HundredChartEvidence(task, model, context) : null;
}
