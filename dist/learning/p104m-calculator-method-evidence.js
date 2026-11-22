import {initial, valid} from './phase5/b39-model.js';
import {equal} from './phase5/b16-model.js';
import {hasExactKeys, latestSubmissionMatches, matchesNativeEvidenceTask, sameEvidence} from './evidence-contract.js';

import {norm, parse} from './phase5/b15-model.js';

export const P104M_SOURCES = Object.freeze([
  {
    "sessionId": "strategy39",
    "index": 0,
    "nodeId": "mt_mQcWGh02no",
    "type": "x-s39-choose",
    "taskHash": "a6d2783245da097ec131ef1aaa320dbe598b1c977c304f1c51597acddaedba87"
  },
  {
    "sessionId": "strategy39",
    "index": 1,
    "nodeId": "mt_mQcWGh02no",
    "type": "x-s39-choose",
    "taskHash": "a21a29e89f3a1fb2f593b1ca1ceea56b14b97e5725220d0651f2b6add84103ac"
  },
  {
    "sessionId": "tools39",
    "index": 0,
    "nodeId": "mt_d-WZC2OyMB",
    "type": "x-s39-choose",
    "taskHash": "fa6b43a9ccdea6eece97c3492431860b9c076d1e5861ee7d49545023d77dd04b"
  },
  {
    "sessionId": "tools39",
    "index": 1,
    "nodeId": "mt_d-WZC2OyMB",
    "type": "x-s39-choose",
    "taskHash": "606e1840f80bdc176ac1f18c9d2cc4aa8488817671e52074ba0d7a9925c57321"
  },
  {
    "sessionId": "tools39",
    "index": 3,
    "nodeId": "mt_d-WZC2OyMB",
    "type": "x-s39-choose",
    "taskHash": "cc0185f5827d90f88b2eb7a63c9ae11554d07b3ad388965200ae67a7581292a2"
  },
  {
    "sessionId": "representations39",
    "index": 0,
    "nodeId": "mt_IwEOCN6bL1",
    "type": "x-s39-choose",
    "taskHash": "85159bc5608b3058f7bc19700e70dcce79f68f9fb8fa3d6ffa9fc80eb741e6d5"
  },
  {
    "sessionId": "representations39",
    "index": 1,
    "nodeId": "mt_IwEOCN6bL1",
    "type": "x-s39-choose",
    "taskHash": "1cc67cbfc45888779d8bf220c4a8fe55f299b8c926405e60d54649ffc8571d14"
  },
  {
    "sessionId": "calculator39",
    "index": 1,
    "nodeId": "mt_ish_uH8vZe",
    "type": "x-s39-choose",
    "taskHash": "904850a48d6cd3c9724a9e4d8e8a3c7b5dbd8e01fbdeacc2f71aa94c0203751a"
  },
  {
    "sessionId": "calculator39",
    "index": 2,
    "nodeId": "mt_ish_uH8vZe",
    "type": "x-s39-choose",
    "taskHash": "952964456a23217670aa72436d9b738c2ccb6f6d955f4b8444088bcf1e9530f7"
  }
].map(Object.freeze));

export function p104mCalculatorMethodBinding(task,context) {
  const row=P104M_SOURCES.find(source=>source.sessionId===context?.sessionId&&source.index===context?.index);
  if (!row||!matchesNativeEvidenceTask(task,context,row)) return null;
  return {nodeId:row.nodeId,kind:'p104m-calculator-method',method:'calculator',question:'怎样核对输入的数、运算和算出的结果？'};
}

function operandLeaves(node,operator) {
  if (node.op===operator) return [...operandLeaves(node.a,operator),...operandLeaves(node.b,operator)];
  return [node.op==='num'&&Number.isSafeInteger(node.v)?node.v:null];
}

export function replayP104MCalculatorMethodEvidence(task,model,context) {
  try {
    const binding=p104mCalculatorMethodBinding(task,context);
    if (!binding||!hasExactKeys(model,Object.keys(initial(task)))||!valid(task,model)||
        model.issue!==''||model.method!=='calculator'||Object.keys(model.history).length!==model.history.length) return null;
    let last=null;
    let runs=0;
    for (const event of model.history) {
      if (!hasExactKeys(event,['a','i','v','w','c'])||event.a!=='run'||event.i!=='') return null;
      last=event;
      runs++;
    }
    if (!last||last.c!=='calculator'||last.w!==model.entry||model.board.runs.length!==runs) return null;
    const decimalTokens=norm(last.w).match(/\d+\.\d+/g)??[];
    if (decimalTokens.some(token=>!/\.0+$/.test(token))) return null;
    const actual=operandLeaves(parse(last.w),task.operator).sort((a,b)=>a-b);
    const expected=[...task.operands].sort((a,b)=>a-b);
    if (!sameEvidence(actual,expected)) return null;
    const result=Number(actual.map(BigInt).reduce((a,b)=>task.operator==='+'?a+b:a*b));
    const stored=model.board.runs.at(-1);
    if (!stored?.matched||stored.entry!==last.w||stored.value!==result||!equal(model.answer,result)) return null;
    return {...binding,result};
  } catch {
    return null;
  }
}

export function submittedP104MCalculatorMethodEvidence(task,model,record,context) {
  return latestSubmissionMatches(model,record)?replayP104MCalculatorMethodEvidence(task,model,context):null;
}
