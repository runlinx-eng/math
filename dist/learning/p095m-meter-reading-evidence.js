import {initial,valid} from './phase5/b31-model.js';
import {equal,rational} from './phase5/b16-model.js';
import {hasExactKeys,latestSubmissionMatches,matchesNativeEvidenceTask,sameEvidence} from './evidence-contract.js';

export const P095M_SOURCES=Object.freeze([
  {
    "sessionId": "cupmeasure",
    "index": 2,
    "nodeId": "mt_4lp_b5Pzik",
    "type": "x-m31-meter",
    "taskHash": "4784d46c91843578f9cc5d4499a13cba87b2c6b725577cb5bff9d4a0e99aa310"
  },
  {
    "sessionId": "measureliquid",
    "index": 0,
    "nodeId": "mt_-af65bxfdp",
    "type": "x-m31-meter",
    "taskHash": "946cc31504c0620dcbf3caeea004fa2d970a7a378e2a94f941d2e3ccc56dd7cd"
  },
  {
    "sessionId": "measureliquid",
    "index": 1,
    "nodeId": "mt_-af65bxfdp",
    "type": "x-m31-meter",
    "taskHash": "f82c7e41f56a18fecc1e57ffc647ee93701b0196b6492052f547eb341574cff2"
  }
].map(Object.freeze));

export function p095mMeterReadingBinding(task,context) {
  const row=P095M_SOURCES.find(s=>s.sessionId===context?.sessionId&&s.index===context?.index);
  if (!row||!matchesNativeEvidenceTask(task,context,row)) return null;
  return {nodeId:row.nodeId,kind:'p095m-meter-reading',method:null,question:'先估一估，再数刻度。每个小间隔表示多少？'};
}

export function replayP095MMeterReadingEvidence(task,model,context) {
  try {
    const binding=p095mMeterReadingBinding(task,context);
    if (!binding||!hasExactKeys(model,Object.keys(initial(task)))||!valid(task,model)||
        model.issue!==''||Object.keys(model.history).length!==model.history.length) return null;
    const {board}=initial(task);
    let rejected=false;
    for (const e of model.history) {
      if (!hasExactKeys(e,['a','i','f'])||e.i!=='') return null;
      const {a,f}=e;
      rejected=false;
      if (a==='predict'&&hasExactKeys(f,['estimate'])) {
        const estimate=rational(f.estimate);
        if (!estimate||estimate[0]<0) rejected=true;
        else if (board.prediction===null) {
          board.prediction=f.estimate;
          board.first.estimate=f.estimate;
        }
      } else if (a==='meter'&&hasExactKeys(f,['step','reading','unit'])) {
        board.first.meter??=f;
        rejected=board.prediction===null||!equal(f.step,task.minorN,task.minorD)||
          !equal(f.reading,task.valueN,task.valueD)||f.unit!==task.unit;
        if (!rejected) board.saved=f;
        else if (board.prediction!==null) board.bad=true;
      } else return null;
    }
    const {step,reading,unit}=model;
    if (rejected||board.prediction===null||!board.saved||
        !sameEvidence(board.saved,{step,reading,unit})) return null;
    const proof={step:[task.minorN,task.minorD],reading:[task.valueN,task.valueD],unit};
    if (!sameEvidence(board,model.board)) return null;
    return {...binding,...proof};
  } catch {
    return null;
  }
}

export function submittedP095MMeterReadingEvidence(task,model,record,context) {
  return latestSubmissionMatches(model,record)?replayP095MMeterReadingEvidence(task,model,context):null;
}
