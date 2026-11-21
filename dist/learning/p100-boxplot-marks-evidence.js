import {fields, initial, inspect, number, valid} from './phase5/b20-model.js';
import {
  hasExactKeys,
  isEvidenceContext,
  latestSubmissionMatches,
  matchesNativeEvidenceTask,
  sameEvidence
} from './evidence-contract.js';

const sessionId = 'boxsummary';
const nodeId = 'mt_8VjmxR1yfw';
const type = 'x-boxsummary';
const kind = 'p100-boxplot-marks';
const taskHash = '5b2698fd0135df607a4879a15747f7624af14086e3d658b567522a0440fc0057';
const reviewed = {
  type,mode:'build',
  prompt:'先把五个位置放到同一把尺上，再画箱与两条须。这里须从最小值走到最大值。',
  summary:[3,6,9,14,21],domain:[0,24],
  questions:[
    {label:'中间那个位置',value:9},
    {label:'箱子的跨度',value:8},
    {label:'最小到最大的跨度',value:18},
    {label:'须线到哪里',value:['minmax'],options:[['minmax','最小与最大'],['fence','自动删去两端']]}
  ]
};

export const P100_SOURCES = Object.freeze([Object.freeze({sessionId,index:0,nodeId,type,taskHash})]);

export function p100BoxplotMarksBinding(task,context) {
  if (!isEvidenceContext(context) || context.sessionId !== sessionId || context.index !== 0 ||
      !sameEvidence(task,reviewed) || !matchesNativeEvidenceTask(task,context,{type,nodeId})) return null;
  return {nodeId,kind,method:null,question:'箱子的宽度和最小到最大的距离，分别用哪两个位置相减？'};
}

function isExactInteger(raw, value) {
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

const roles = ['minimum','lowerQuartile','median','upperQuartile','maximum'];

export function replayP100BoxplotMarksEvidence(task,model,context) {
  try {
    const binding = p100BoxplotMarksBinding(task,context);
    if (!binding || !hasExactKeys(model,Object.keys(initial(task))) || !valid(task,model) ||
        model.issue !== '' || !model.history.length ||
        Object.keys(model.history).length !== model.history.length) return null;

    const fieldKeys = Object.keys(fields(task));
    const [lower,upper] = task.domain;
    const stored = task.summary.map(() => null);
    const events = [];
    let cursor = 0;
    for (const [index,event] of model.history.entries()) {
      if (!hasExactKeys(event,['a','d','f']) || !hasExactKeys(event.f,fieldKeys)) return null;
      if (event.a === 'row') {
        if (!hasExactKeys(event.d,['index']) || !/^[0-4]$/.test(event.d.index)) return null;
        cursor = Number(event.d.index);
        events.push({index,action:'row',position:cursor});
        continue;
      }
      if (event.a !== 'mark' || !hasExactKeys(event.d,[])) return null;
      const raw = event.f.value;
      const value = number(raw);
      const recorded = value >= lower && value <= upper;
      events.push({index,action:'mark',position:cursor,raw,recorded});
      if (recorded) {
        stored[cursor] = {index,raw,value};
        const next = stored.indexOf(null);
        if (next >= 0) cursor = next;
      }
    }

    if (stored.some((mark,i) => !mark || mark.value !== task.summary[i] || !isExactInteger(mark.raw,task.summary[i])) ||
        !sameEvidence(stored.map(mark => mark.value),model.board.marks) || cursor !== model.board.cursor ||
        model.value !== model.history.at(-1).f.value) return null;
    const [minimum,lowerQuartile,median,upperQuartile,maximum] = stored.map(mark => mark.value);
    const boxWidth = upperQuartile-lowerQuartile;
    const range = maximum-minimum;
    if (![median,boxWidth,range].every((value,i) => isExactInteger(model.answers[i],value)) ||
        model.answers[3] !== 'minmax' || !inspect(task,model).correct) return null;

    return {
      kind,nodeId,sessionId,index:context.index,
      marks:stored.map((mark,i) => ({role:roles[i],value:mark.value,eventIndex:mark.index})),
      box:[lowerQuartile,upperQuartile],whiskers:[minimum,maximum],median,boxWidth,range,
      events,sourceSuppliedSummary:true,learnerMasteryAssessed:false
    };
  } catch {
    return null;
  }
}

export function submittedP100BoxplotMarksEvidence(task,model,record,context) {
  if (!latestSubmissionMatches(model,record)) return null;
  return replayP100BoxplotMarksEvidence(task,model,context);
}
