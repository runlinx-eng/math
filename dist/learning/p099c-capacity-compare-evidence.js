import {initial,valid} from './phase5/b31-model.js';
import {hasExactKeys,latestSubmissionMatches,matchesNativeEvidenceTask,sameEvidence} from './evidence-contract.js';

export const P099C_SOURCES=Object.freeze([
  {
    "sessionId": "comparecap",
    "index": 0,
    "nodeId": "mt_zkFbMLpu3U",
    "type": "x-m31-compare",
    "taskHash": "492f803439179b59e9ffa89d1df2fe8978bd6da6f0aef922d0ec71580c8e7c18"
  },
  {
    "sessionId": "comparecap",
    "index": 1,
    "nodeId": "mt_zkFbMLpu3U",
    "type": "x-m31-compare",
    "taskHash": "2c0aff0e6e26d96545ef754722004d28f73e70096abe5586d418b65d3e1d8ff0"
  }
].map(Object.freeze));

export function p099cCapacityCompareBinding(task,context) {
  const row=P099C_SOURCES.find(s=>s.sessionId===context?.sessionId&&s.index===context?.index);
  if (!row||!matchesNativeEvidenceTask(task,context,row)) return null;
  return {nodeId:row.nodeId,kind:'p099c-capacity-compare',method:null,question:'倒入同样的杯子后，两份水实际有多少？'};
}

export function replayP099CCapacityCompareEvidence(task,model,context) {
  try {
    const binding=p099cCapacityCompareBinding(task,context);
    if (!binding||!hasExactKeys(model,Object.keys(initial(task)))||!valid(task,model)||
        model.issue!==''||Object.keys(model.history).length!==model.history.length) return null;
    const {board}=initial(task);
    const choices=['left','right','equal'];
    const [left,right]=task.amounts;
    const expected=left===right?'equal':left>right?'left':'right';
    let issue='';
    for (const e of model.history) {
      if (!hasExactKeys(e,['a','i','f'])||!hasExactKeys(e.f,[])) return null;
      issue='';
      if (e.a==='guess'&&choices.includes(e.i)&&board.prediction===null) {
        board.prediction=e.i;
        board.first.guess=e.i;
      } else if (e.a==='pour'&&['0','1'].includes(e.i)&&board.prediction!==null) {
        const i=Number(e.i);
        board.poured[i]+=board.amounts[i];
        board.amounts[i]=0;
      } else if (e.a==='choice'&&choices.includes(e.i)) {
        if (!sameEvidence(board.poured,task.amounts)) issue='先把两份都倒进一样的杯子。';
        else {
          board.first.choice??=e.i;
          board.choice=e.i;
          if (e.i!==expected) board.bad=true;
        }
      } else return null;
    }
    if (issue||board.prediction===null||!sameEvidence(board.poured,task.amounts)||
        !sameEvidence(board.amounts,[0,0])||board.choice!==expected) return null;
    const proof={comparison:expected,amounts:board.poured};
    if (!sameEvidence(board,model.board)) return null;
    return {...binding,...proof};
  } catch {
    return null;
  }
}

export function submittedP099CCapacityCompareEvidence(task,model,record,context) {
  return latestSubmissionMatches(model,record)?replayP099CCapacityCompareEvidence(task,model,context):null;
}
