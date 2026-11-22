import {initial, rat, valid} from './phase5/b36-model.js';
import {hasExactKeys, latestSubmissionMatches, matchesNativeEvidenceTask} from './evidence-contract.js';

export const P109S_SOURCES = Object.freeze([
  {
    "sessionId": "formula36",
    "index": 2,
    "nodeId": "mt_Jvg8X0N5u0",
    "type": "x-f36-eval",
    "taskHash": "1340ff2de297aad1f43ae3524e5e13bbcc7bba908977444aef92f3a233889b3c"
  },
  {
    "sessionId": "substitute36",
    "index": 0,
    "nodeId": "mt_vHzVa3SURC",
    "type": "x-f36-eval",
    "taskHash": "eb8c7bdc0d91575f48ce8479d7eb53285ed10be74c2e5e387f54701350aff8eb"
  },
  {
    "sessionId": "substitute36",
    "index": 1,
    "nodeId": "mt_vHzVa3SURC",
    "type": "x-f36-eval",
    "taskHash": "1507e1051d6b3e7cf6d80ab2bd685e6f8453b4d7981b3071e1f52055a20a1d6a"
  },
  {
    "sessionId": "substitute36",
    "index": 2,
    "nodeId": "mt_vHzVa3SURC",
    "type": "x-f36-eval",
    "taskHash": "f4d6d28f1231e89700ea1d6192cde65652fcd87fbc106e4e1027dc4e71d3dda3"
  }
].map(Object.freeze));

export function p109sFormulaSubstitutionBinding(task, context) {
  const row = P109S_SOURCES.find(source => source.sessionId === context?.sessionId && source.index === context?.index);
  if (!row || !matchesNativeEvidenceTask(task, context, row)) return null;
  return {nodeId:row.nodeId, kind:'p109s-formula-substitution', method:null, question:'把负数或分数放进公式后，先算哪一部分？'};
}

function exactValue(task, entry) {
  if (task.kind === 'physical') return [BigInt(entry.u) + BigInt(entry.a) * BigInt(entry.t), 1n];
  const [x,d] = rat(entry.x).map(BigInt);
  return [BigInt(task.a) * x * x + BigInt(task.b) * x * d + BigInt(task.c) * d * d, d * d];
}

function matches(raw, [expected, denominator]) {
  const pair = rat(raw);
  return Boolean(pair && BigInt(pair[0]) * denominator === BigInt(pair[1]) * expected);
}

export function replayP109SFormulaSubstitutionEvidence(task, model, context) {
  try {
    const binding = p109sFormulaSubstitutionBinding(task, context);
    if (!binding || !hasExactKeys(model, Object.keys(initial(task))) || !valid(task, model) ||
        model.issue !== '' || Object.keys(model.history).length !== model.history.length) return null;
    let selected = 0;
    let last = null;
    const completed = new Set();
    let trialIndex = 0;
    for (const event of model.history) {
      if (!hasExactKeys(event,['a','i','v','w','z'])) return null;
      if (event.a === 'case') {
        if (!/^\d+$/.test(event.i) || Number(event.i) >= task.cases.length) return null;
        selected = Number(event.i);
        continue;
      }
      if (event.a !== 'trial' || event.i !== '') return null;
      if (!rat(event.v)) continue;
      const expected = exactValue(task,task.cases[selected]);
      const correct = matches(event.v, expected);
      const stored = model.board.trials[trialIndex++];
      if (!hasExactKeys(stored,['case','answer','result','correct']) || stored.case !== selected ||
          stored.answer !== event.v || stored.correct !== correct || !matches(stored.result,expected)) return null;
      last = {selected,expected,correct};
      if (correct) completed.add(selected);
    }
    if (!last?.correct || last.selected !== selected || selected !== model.board.selected ||
        trialIndex !== model.board.trials.length || !matches(model.value,last.expected) ||
        !task.required.every(i => completed.has(i))) return null;
    if (task.questions.length) {
      const x = BigInt(task.cases[1].x);
      if (!matches(model.answers[0],[x*x,1n])) return null;
    }
    return {...binding, cases:[...completed]};
  } catch {
    return null;
  }
}

export function submittedP109SFormulaSubstitutionEvidence(task, model, record, context) {
  return latestSubmissionMatches(model, record) ? replayP109SFormulaSubstitutionEvidence(task, model, context) : null;
}
