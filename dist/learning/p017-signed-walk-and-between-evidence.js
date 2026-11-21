import {initial, inspect, valid} from './phase5/b09-model.js';
import {hasExactKeys, isEvidenceContext, latestSubmissionMatches, matchesNativeEvidenceTask, sameEvidence} from './evidence-contract.js';
import {rational} from './phase5/b16-model.js';

const reviewed = [
  {
    "sessionId": "negativefirst",
    "index": 0,
    "nodeId": "mt_vXRzMbiPff",
    "type": "x-signedline",
    "taskHash": "9029c914a9ca28adb72154e1e4440dd8376b468500b93d1a4cdbcddb0d7027f5",
    "task": {
      "type": "x-signedline",
      "mode": "walk",
      "start": 5,
      "end": -3,
      "min": -4,
      "max": 6,
      "prompt": "从5往回数，每走一步先写下一个数。经过零以后继续。"
    }
  },
  {
    "sessionId": "negativecontext",
    "index": 2,
    "nodeId": "mt_1KkvzwYxbR",
    "type": "x-signedline",
    "taskHash": "44f710270cc96d351da561c27ea1f5f66662e84c38e266aa24183249c98f81c8",
    "task": {
      "type": "x-signedline",
      "mode": "walk",
      "start": 3,
      "end": -2,
      "min": -3,
      "max": 4,
      "prompt": "从3层向下，一层层经过地面，继续到地下两层。"
    }
  },
  {
    "sessionId": "numberworld",
    "index": 4,
    "nodeId": "mt_b4lbTOJYwI",
    "type": "x-betweenpoints",
    "taskHash": "f0b581c829b24f6331a76bd9b38982ba544b9537255712edd01593a9481d24fc",
    "task": {
      "type": "x-betweenpoints",
      "a": [
        1,
        4
      ],
      "b": [
        1,
        3
      ],
      "rounds": 3,
      "prompt": "1/4与1/3之间，找一个新数，再选一边放大。连做三次，看看什么时候能继续。"
    }
  },
  {
    "sessionId": "numberworld",
    "index": 5,
    "nodeId": "mt_b4lbTOJYwI",
    "type": "x-betweenpoints",
    "taskHash": "c87c50d17e658c666950ff6685c1440a3ca8e6fe7879115f61d71fa756b196f9",
    "task": {
      "type": "x-betweenpoints",
      "a": [
        12,
        100
      ],
      "b": [
        13,
        100
      ],
      "rounds": 3,
      "prompt": "换到0.12与0.13之间。写分数或小数都可以；每次找中间，再放大一边。"
    }
  }
];
export const P017_SOURCES = Object.freeze(reviewed.map(({task, ...source}) => Object.freeze(source)));
export function p017SignedWalkAndBetweenBinding(task, context) {
  if (!isEvidenceContext(context)) return null;
  const entry = reviewed.find(source => source.sessionId === context.sessionId && source.index === context.index);
  if (!entry || !sameEvidence(task, entry.task) || !matchesNativeEvidenceTask(task, context, entry)) return null;
  return {nodeId:entry.nodeId, kind:'p017-signed-walk-and-between', method:null, question:"数轴经过 0 时怎样保持步长？缩小区间后怎样再次在两端之间取数？"};
}
export function replayP017SignedWalkAndBetweenEvidence(task, model, context) {
  try {
    const binding = p017SignedWalkAndBetweenBinding(task, context);
    if (!binding || !hasExactKeys(model, Object.keys(initial(task))) || !valid(task, model) ||
        (model.issue ?? '') !== '' || !model.history.length || Object.keys(model.history).length !== model.history.length) return null;
    if (!inspect(task,model).correct) return null;
    if (task.type === 'x-signedline') {
      const direction = Math.sign(task.end-task.start);
      const points = Array.from({length:Math.abs(task.end-task.start)}, (_,i) => task.start+(i+1)*direction);
      if (!sameEvidence(model.history,points) || !sameEvidence(model.hops,points) || !points.includes(0)) return null;
      return {binding, points, direction};
    }
    if (model.pending !== null || model.history.length < task.rounds || model.rule !== 'midpoint') return null;
    const compare = (one,two) => BigInt(one[0])*BigInt(two[1])-BigInt(two[0])*BigInt(one[1]);
    let low = task.a, high = task.b;
    let used = 0;
    const inside = value => compare(value,low)>0n && compare(value,high)<0n;
    const takeAttempt = attempt => {
      if (!hasExactKeys(attempt,['inside','value'])) return null;
      const value = rational(attempt.value.trim().replace(/\s*\/\s*/g,'/'));
      return value && attempt.inside === inside(value) ? value : null;
    };
    const intervals = [];
    for (const event of model.history) {
      if (!hasExactKeys(event,['p','side']) || !inside(event.p)) return null;
      let stored = false;
      while (used < model.attempts.length) {
        const attempt = model.attempts[used++];
        const value = takeAttempt(attempt);
        if (!value) return null;
        if (attempt.inside && compare(value,event.p)===0n) {
          stored = true;
          break;
        }
      }
      if (!stored) return null;
      if (event.side === 'left') high=event.p;
      else if (event.side === 'right') low=event.p;
      else return null;
      intervals.push({low,high});
    }
    for (const attempt of model.attempts.slice(used)) {
      if (!takeAttempt(attempt) || attempt.inside) return null;
    }
    return {binding, intervals, demonstrations:intervals.length};

  } catch {
    return null;
  }
}
export function submittedP017SignedWalkAndBetweenEvidence(task, model, record, context) {
  return latestSubmissionMatches(model, record) ? replayP017SignedWalkAndBetweenEvidence(task, model, context) : null;
}
