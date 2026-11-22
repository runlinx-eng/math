import {initial, valid} from './phase5/b39-model.js';
import {equal, rational} from './phase5/b16-model.js';
import {hasExactKeys, latestSubmissionMatches, matchesNativeEvidenceTask, sameEvidence} from './evidence-contract.js';

import {parse} from './phase5/b15-model.js';

export const P104C_SOURCES = Object.freeze([
  {
    "sessionId": "calculator39",
    "index": 0,
    "nodeId": "mt_ish_uH8vZe",
    "type": "x-s39-calc",
    "taskHash": "88024d7bb496b690c6a1951e3aa933e25ed5bea59318a5df861ee1f0ed469d7b"
  },
  {
    "sessionId": "calculator39",
    "index": 3,
    "nodeId": "mt_ish_uH8vZe",
    "type": "x-s39-calc",
    "taskHash": "68ac9b9b8699c9716fd47afcaebceffc1b48c6f6fdd364314a32e62ef1b17edf"
  }
].map(Object.freeze));

export function p104cCalculatorCheckBinding(task,context) {
  const row=P104C_SOURCES.find(source=>source.sessionId===context?.sessionId&&source.index===context?.index);
  if (!row||!matchesNativeEvidenceTask(task,context,row)) return null;
  return {nodeId:row.nodeId,kind:'p104c-calculator-check',method:null,question:'怎样用估算发现可能输错，再核对输入？'};
}

function operands(node,operator) {
  if (node.op===operator) return [...operands(node.a,operator),...operands(node.b,operator)];
  return [node.op==='num'&&Number.isSafeInteger(node.v)?node.v:null];
}

function sameEstimate(a,b) {
  const left=rational(a);
  const right=rational(b);
  return left&&right&&BigInt(left[0])*BigInt(right[1])===BigInt(right[0])*BigInt(left[1]);
}

export function replayP104CCalculatorCheckEvidence(task,model,context) {
  try {
    const binding=p104cCalculatorCheckBinding(task,context);
    if (!binding||!hasExactKeys(model,Object.keys(initial(task)))||!valid(task,model)||
        model.issue!==''||Object.keys(model.history).length!==model.history.length) return null;
    const [low,high]=task.estimateRange;
    let latestEstimate=null;
    let lastRun=null;
    for (const event of model.history) {
      if (!hasExactKeys(event,['a','i','v','w','c'])||event.i!=='') return null;
      if (event.a==='estimate') {
        const estimate=Number(event.v);
        if (/^-?(?:\d+(?:\.\d{1,8})?|\.\d{1,8})$/.test(event.v.trim())&&estimate>=0&&estimate<=1000000) {
          latestEstimate={raw:event.v,value:estimate};
        }
      } else if (event.a==='run') {
        if (latestEstimate!==null) lastRun={entry:event.w,estimate:latestEstimate,visibleEstimate:event.v};
      } else {
        return null;
      }
    }
    if (!lastRun||lastRun.estimate!==latestEstimate||latestEstimate.value<low||latestEstimate.value>high||
        !sameEstimate(model.estimate,latestEstimate.raw)||!sameEstimate(lastRun.visibleEstimate,latestEstimate.raw)||
        model.board.estimate!==latestEstimate.value||model.entry!==lastRun.entry) return null;
    const actual=operands(parse(lastRun.entry),task.operator).sort((a,b)=>a-b);
    const expected=[...task.operands].sort((a,b)=>a-b);
    if (!sameEvidence(actual,expected)) return null;
    const result=Number(actual.map(BigInt).reduce((a,b)=>task.operator==='+'?a+b:a*b));
    const run=model.board.runs.at(-1);
    if (!run?.matched||run.value!==result||!equal(model.answer,result)||
        (task.candidate&&(task.candidate===result||model.judgment!=='suspect'))) return null;
    return {...binding,estimate:latestEstimate.value,result};
  } catch {
    return null;
  }
}

export function submittedP104CCalculatorCheckEvidence(task,model,record,context) {
  return latestSubmissionMatches(model,record)?replayP104CCalculatorCheckEvidence(task,model,context):null;
}
