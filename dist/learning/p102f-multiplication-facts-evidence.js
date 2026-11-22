import {initial, number, valid} from './phase5/b13-model.js';
import {hasExactKeys, latestSubmissionMatches, matchesNativeEvidenceTask, sameEvidence} from './evidence-contract.js';

export const P102F_SOURCES = Object.freeze([
  {
    "sessionId": "evenhalves",
    "index": 3,
    "nodeId": "mt_0u4KLbvBa1",
    "type": "x-mulfacts",
    "taskHash": "698ee446f40c7116e7c2b7a23ae55f88709be23be8752c861ba3ef1f30e57c72"
  },
  {
    "sessionId": "tables2510",
    "index": 2,
    "nodeId": "mt_HhuSDxwDNM",
    "type": "x-mulfacts",
    "taskHash": "b1479f64857cb66070dd33079e1a83dcb63c643a4bf3d65f7ad1659a5da67788"
  },
  {
    "sessionId": "tables348",
    "index": 3,
    "nodeId": "mt_wQ89AEXhz3",
    "type": "x-mulfacts",
    "taskHash": "0ffd03dedb5259cdc8674ff33a8c8ff478c1baa78dcee81ea78c13266c44e4b4"
  },
  {
    "sessionId": "tables348",
    "index": 4,
    "nodeId": "mt_wQ89AEXhz3",
    "type": "x-mulfacts",
    "taskHash": "9ffa0c1d893c0365a9e6dee946df575e538b836ff16f135bb49f25a24f320127"
  },
  {
    "sessionId": "tables348",
    "index": 5,
    "nodeId": "mt_wQ89AEXhz3",
    "type": "x-mulfacts",
    "taskHash": "da0061e4464cca230a44b5f27757b2f8b160c1a9b610ba02fe71a9c1001faf7a"
  },
  {
    "sessionId": "tables12",
    "index": 1,
    "nodeId": "mt_K5jM7vlVhA",
    "type": "x-mulfacts",
    "taskHash": "b0bc5587644774720fede1468567d93603a53c619da5601b631d668f3596a21e"
  },
  {
    "sessionId": "missingfactor",
    "index": 2,
    "nodeId": "mt_GDG9_SZmsO",
    "type": "x-mulfacts",
    "taskHash": "6796bcc2eb732599498ab3dc62f69ca5eaa926bd085ba4b169dd46ccab7fc907"
  },
  {
    "sessionId": "mixedfacts",
    "index": 1,
    "nodeId": "mt_WX30dzi4dt",
    "type": "x-mulfacts",
    "taskHash": "7dbca93fb91bc1620e4c5e8fe8825903935c4576f0cce0e609b78426786a865b"
  },
  {
    "sessionId": "tablepatterns",
    "index": 1,
    "nodeId": "mt_w6MxaaoMXZ",
    "type": "x-mulfacts",
    "taskHash": "ca56b7aacb4b63e31e2814ea82ea238b7455e6bc025cd921baa2416683fdcf51"
  }
].map(Object.freeze));

export function p102fMultiplicationFactsBinding(task, context) {
  const source = P102F_SOURCES.find(row => row.sessionId === context?.sessionId && row.index === context?.index);
  if (!source || !matchesNativeEvidenceTask(task,context,source)) return null;
  const question = task.cases[0].kind === 'parity' ? '只看个位，怎样判断会不会剩下一颗？' : '怎样用一条乘法算式找回相应的除法结果？';
  return {nodeId:source.nodeId, kind:'p102f-multiplication-facts', method:null, question};
}

function isCorrect(taskCase, answer) {
  if (taskCase.kind === 'parity') return answer === (taskCase.n % 2 === 0 ? 'even' : 'odd');
  const submitted = number(answer);
  if (submitted === null) return false;
  return taskCase.op === '×' ? submitted === taskCase.a * taskCase.b : submitted * taskCase.b === taskCase.a;
}

export function replayP102FMultiplicationFactsEvidence(task, model, context) {
  try {
    const binding = p102fMultiplicationFactsBinding(task, context);
    if (!binding || !hasExactKeys(model,Object.keys(initial(task))) || !valid(task,model) ||
        model.issue !== '' || model.answer !== '' || Object.keys(model.history).length !== model.history.length) return null;
    let saved = [];
    let help = false;
    for (const {action,data} of model.history) {
      if (data.bucket !== null || data.index !== null || data.token !== null) return null;
      if (action === 'b13-reset') {
        saved = [];
        help = false;
      } else if (!['b13-fact-save','b13-fact-help'].includes(action)) {
        return null;
      } else if (saved.length < task.cases.length) {
        if (action === 'b13-fact-help') {
          help = true;
        } else if (isCorrect(task.cases[saved.length],data.answer)) {
          saved.push({answer:data.answer,help});
          help = false;
        }
      }
    }
    if (saved.length !== task.cases.length || !sameEvidence(saved,model.board.saved) || model.board.help !== help) return null;
    return {...binding,cases:saved};
  } catch {
    return null;
  }
}

export function submittedP102FMultiplicationFactsEvidence(task, model, record, context) {
  return latestSubmissionMatches(model,record) ? replayP102FMultiplicationFactsEvidence(task,model,context) : null;
}
