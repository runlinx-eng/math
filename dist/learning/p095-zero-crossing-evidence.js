import {number} from './phase5/b20-model.js';
import {initial, inspect, valid} from './phase5/b29-model.js';
import {
  hasExactKeys,
  isEvidenceContext,
  latestSubmissionMatches,
  matchesNativeEvidenceTask,
  sameEvidence
} from './evidence-contract.js';

const sessionId = 'temperaturechange';
const nodeId = 'mt_RVK655t391';
const type = 'x-m29-interval';
const kind = 'p095-zero-crossing';
const reviewed = [
  {
    taskHash:'e47d6eeb23f4670e99b1fb68de68f79cddceb9e9f50e09dc1c589b9d72ce9f2e',
    task:{type,prompt:'模拟温度从 3℃ 降到 −5℃。沿标尺走到终点，一共降了多少度？',start:3,end:-5,unit:'℃'}
  },
  {
    taskHash:'0cd4d0e63812c30df7e8b003c0d81bc33b90620676725c7304c83305426444a2',
    task:{type,prompt:'模拟余额从欠 120 元变为有 350 元。跨过零，一共相差多少元？',start:-120,end:350,unit:'元'}
  }
];

export const P095_SOURCES = Object.freeze(reviewed.map(({taskHash},index) =>
  Object.freeze({sessionId,index,nodeId,type,taskHash})
));

export function p095ZeroCrossingBinding(task,context) {
  if (!isEvidenceContext(context) || context.sessionId !== sessionId ||
      !sameEvidence(task,reviewed[context.index]?.task) ||
      !matchesNativeEvidenceTask(task,context,{type,nodeId})) return null;
  return {nodeId,kind,method:null,question:'从起点到零走了多少？从零到终点又有多少？'};
}

function isExactInteger(raw,value) {
  const text = raw.trim();
  const integer = /^(-?\d+)(?:\.0+)?$/.exec(text);
  if (integer) return BigInt(integer[1]) === BigInt(value);
  const fraction = /^(-?\d+)(?:\s+(\d+))?\/(\d+)$/.exec(text);
  if (!fraction) return false;
  const [, leading, part, divisor] = fraction;
  const bottom = BigInt(divisor);
  const top = part === undefined ? BigInt(leading) :
    BigInt(leading) * bottom + (leading.startsWith('-') ? -1n : 1n) * BigInt(part);
  return bottom > 0n && top === BigInt(value) * bottom;
}

export function replayP095ZeroCrossingEvidence(task,model,context) {
  try {
    const binding = p095ZeroCrossingBinding(task,context);
    if (!binding || !hasExactKeys(model,Object.keys(initial(task))) || !valid(task,model) ||
        model.issue !== '' || !model.history.length ||
        Object.keys(model.history).length !== model.history.length) return null;

    const {start,end,unit} = task;
    const direction = Math.sign(end-start), distance = Math.abs(end-start);
    const path = [], events = [];
    let position = start;
    for (const [index,event] of model.history.entries()) {
      if (!hasExactKeys(event,['a','i','v']) || event.i !== '') return null;
      if (event.a === 'undo' && event.v === '') {
        const removed = path.pop() || null;
        if (removed) position = removed.from;
        events.push({index,action:'undo',removed,to:position});
        continue;
      }
      if (event.a !== 'move') return null;
      const length = number(event.v);
      const accepted = Number.isSafeInteger(length) && length > 0 && length <= Math.abs(end-position);
      const step = {index,action:'move',raw:event.v,from:position,to:position,accepted};
      if (accepted) {
        if (!isExactInteger(event.v,length)) return null;
        step.length = length;
        step.to = position + direction*length;
        position = step.to;
        path.push(step);
      }
      events.push(step);
    }

    const beforeZero = Math.abs(start), afterZero = Math.abs(end);
    const last = events.at(-1);
    if (position !== end || beforeZero+afterZero !== distance || !path.length ||
        !sameEvidence(path.map(step => step.length),model.board.moves) ||
        !last.accepted || last.raw !== model.jump || model.unit !== unit ||
        !isExactInteger(model.answer,distance) || !inspect(task,model).correct) return null;

    return {
      kind,nodeId,sessionId,index:context.index,
      start,end,direction,distance,beforeZero,afterZero,unit,path,events,
      learnerMasteryAssessed:false
    };
  } catch {
    return null;
  }
}

export function submittedP095ZeroCrossingEvidence(task,model,record,context) {
  if (!latestSubmissionMatches(model,record)) return null;
  return replayP095ZeroCrossingEvidence(task,model,context);
}
