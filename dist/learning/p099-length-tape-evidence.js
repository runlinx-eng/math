import {equationMatches, initial, inspect, valid} from './phase5/b29-model.js';
import {
  hasExactKeys,
  isEvidenceContext,
  latestSubmissionMatches,
  matchesNativeEvidenceTask,
  sameEvidence
} from './evidence-contract.js';

const sessionId = 'lengthstory';
const nodeId = 'mt_DLcEzmmj2r';
const type = 'x-m29-tape';
const kind = 'p099-length-tape';
const wholeLabel = '原来的整段';
const unit = 'cm';
const reviewed = [
  {
    taskHash:'f28e64d2c7c2f038af9a8c894a991ed6cbd71b112253180d6ad4cfaabc111d77',
    task:{
      type,prompt:'一根绳原来 45 cm，剪掉 18 cm。把已知的一段摆出来，剩下多长？',
      whole:45,known:18,knownSide:'left',leftLabel:'剪掉',rightLabel:'剩下 ?',wholeLabel,unit
    }
  },
  {
    taskHash:'08098cb6d81b27692ed9e0e6461377e89191ca7a1814756dc0ada9e693ce07c5',
    task:{
      type,prompt:'一根绳原来 45 cm，现在剩 27 cm。把剩下的一段摆出来，剪掉了多少？',
      whole:45,known:27,knownSide:'left',leftLabel:'剩下',rightLabel:'剪掉 ?',wholeLabel,unit
    }
  },
  {
    taskHash:'6a4cd4ef5918b8442d2e0481b1f8efaa2c61047d5cbfc76518571fa64f8aa012',
    task:{
      type,prompt:'小米的带子长 42 cm，比小安的长 12 cm。摆出多出的那段，小安的带子多长？',
      whole:42,known:12,knownSide:'right',leftLabel:'小安 ?',rightLabel:'多出 12',wholeLabel,unit
    }
  }
];

export const P099_SOURCES = Object.freeze(reviewed.map(({taskHash},index) =>
  Object.freeze({sessionId,index,nodeId,type,taskHash})
));

export function p099LengthTapeBinding(task,context) {
  if (!isEvidenceContext(context) || context.sessionId !== sessionId ||
      !sameEvidence(task,reviewed[context.index]?.task) ||
      !matchesNativeEvidenceTask(task,context,{type,nodeId})) return null;
  return {nodeId,kind,method:null,question:'哪一段已经知道？两段怎样合成原来的整段？'};
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

export function replayP099LengthTapeEvidence(task,model,context) {
  try {
    const binding = p099LengthTapeBinding(task,context);
    if (!binding || !hasExactKeys(model,Object.keys(initial(task))) || !valid(task,model) ||
        model.issue !== '' || !model.history.length ||
        Object.keys(model.history).length !== model.history.length) return null;

    const {whole,known,knownSide} = task;
    const attempts = [];
    for (const [index,event] of model.history.entries()) {
      if (!hasExactKeys(event,['a','i','v']) || event.a !== 'cut' || event.i !== '') return null;
      // The untouched slider is shown at 0 while its original model field is empty.
      if (event.v === '') {
        attempts.push({index,raw:'',recorded:false});
        continue;
      }
      if (!/^(0|[1-9]\d*)$/.test(event.v)) return null;
      const left = Number(event.v);
      if (!Number.isSafeInteger(left) || left > whole) return null;
      const right = whole-left;
      attempts.push({index,raw:event.v,recorded:true,left,right,matchesKnown:(knownSide === 'left' ? left : right) === known});
    }

    const saved = attempts.at(-1), unknown = whole-known;
    if (!saved?.matchesKnown || saved.raw !== model.cut || saved.left !== model.board.cut ||
        model.board.first.cut !== attempts[0].raw ||
        (knownSide === 'left' ? saved.right : saved.left) !== unknown ||
        model.unit !== task.unit || !equationMatches(task,model.equation) ||
        !isExactInteger(model.answer,unknown) || !inspect(task,model).correct) return null;

    return {
      kind,nodeId,sessionId,index:context.index,
      whole,known,knownSide,unknown,left:saved.left,right:saved.right,
      unit:task.unit,equation:model.equation,attempts,
      learnerMasteryAssessed:false
    };
  } catch {
    return null;
  }
}

export function submittedP099LengthTapeEvidence(task,model,record,context) {
  if (!latestSubmissionMatches(model,record)) return null;
  return replayP099LengthTapeEvidence(task,model,context);
}
