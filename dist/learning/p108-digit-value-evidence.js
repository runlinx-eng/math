import {equal, initial, inspect, valid} from './phase5/b16-model.js';
import {
  hasExactKeys,
  isEvidenceContext,
  latestSubmissionMatches,
  matchesNativeEvidenceTask,
  sameEvidence
} from './evidence-contract.js';

const sessionId = 'mixedpoints';
const nodeId = 'mt_PsylzZ9lHW';
const type = 'x-digitlens';
const kind = 'p108-digit-value';
const taskHash = '382deaf14fd4d81d11481dea6430a0d07aa2659346c840c86ebef62eb3d18b67';
const reviewed = {
  type,
  prompt:'每张卡只读高亮数字本身代表的量，往大处和小处都看一看。',
  cases:[
    {raw:'7,450,000,000',at:0,n:7000000000},
    {raw:'0.0000064',at:7,n:6,d:1000000},
    {raw:'305.0708',at:4,n:0},
    {raw:'305.0708',at:7,n:8,d:10000}
  ]
};

export const P108_SOURCES = Object.freeze([Object.freeze({sessionId,index:0,nodeId,type,taskHash})]);

export function p108DigitValueBinding(task, context) {
  if (!isEvidenceContext(context) || context.sessionId !== sessionId || context.index !== 0 ||
      !sameEvidence(task,reviewed) || !matchesNativeEvidenceTask(task,context,{type,nodeId})) return null;
  return {nodeId,kind,method:null,question:'高亮的数字在什么数位？这一位上的数字表示多少？'};
}

function readPlace({raw,at}) {
  const decimal = raw.indexOf('.');
  const boundary = decimal < 0 ? raw.length : decimal;
  const digit = Number(raw[at]);
  const exponent = at < boundary ? raw.slice(at + 1,boundary).replaceAll(',','').length : boundary - at;
  return {
    numeral:raw,
    at,
    digit,
    exponent,
    numerator:digit * 10 ** Math.max(0,exponent),
    denominator:digit === 0 ? 1 : 10 ** Math.max(0,-exponent)
  };
}

export function replayP108DigitValueEvidence(task, model, context) {
  try {
    const binding = p108DigitValueBinding(task,context);
    const modelKeys = binding && Object.keys(initial(task));
    if (!binding || !hasExactKeys(model,modelKeys) || !valid(task,model) || !model.history.length ||
        Object.keys(model.history).length !== model.history.length || model.issue !== '') return null;

    const slots = modelKeys.filter(key => !['board','history','issue'].includes(key));
    const cards = task.cases.map(readPlace);
    if (!cards.every(({numerator,denominator},i) =>
      BigInt(numerator) * BigInt(task.cases[i].d || 1) === BigInt(task.cases[i].n) * BigInt(denominator))) return null;

    const seen = new Set([0]), saved = new Set(), latest = cards.map(() => null);
    const actions = [];
    let selected = 0, firstReading = null;
    for (const [index,event] of model.history.entries()) {
      if (!hasExactKeys(event,['action','data']) || !hasExactKeys(event.data?.fields,slots)) return null;
      if (event.action === 'digit') {
        if (!hasExactKeys(event.data,['index','fields']) || !/^[0-3]$/.test(event.data.index)) return null;
        selected = Number(event.data.index);
        seen.add(selected);
        actions.push({index, action:'digit', card:selected});
        continue;
      }
      if (event.action !== 'digit-save' || !hasExactKeys(event.data,['fields'])) return null;
      const {numerator,denominator} = cards[selected];
      const raw = event.data.fields.answer;
      const accepted = equal(raw,numerator,denominator);
      firstReading ??= raw;
      const attempt = {index,action:'digit-save',card:selected,raw,accepted};
      latest[selected] = attempt;
      if (accepted) saved.add(selected);
      actions.push(attempt);
    }
    if (!latest.every(reading => reading?.accepted) || !sameEvidence(model.board.seen,[...seen]) ||
        !sameEvidence(model.board.records,[...saved]) || model.board.index !== selected ||
        model.board.first !== firstReading || model.answer !== model.history.at(-1).data.fields.answer ||
        !inspect(task,model).correct) return null;

    return {
      kind,nodeId,sessionId,index:context.index,
      cards:cards.map((card,i) => ({...card, reading:latest[i]})),
      actions,
      learnerMasteryAssessed:false
    };
  } catch {
    return null;
  }
}

export function submittedP108DigitValueEvidence(task, model, record, context) {
  if (!latestSubmissionMatches(model,record)) return null;
  return replayP108DigitValueEvidence(task,model,context);
}
