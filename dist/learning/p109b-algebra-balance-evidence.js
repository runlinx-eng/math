import {initial,valid} from './phase5/b16-model.js';
import {equal,fields,number,rational} from './phase5/b16-model.js';
import {equationEqual} from './phase5/b35-model.js';
import {norm} from './phase5/b15-model.js';
import {hasExactKeys,latestSubmissionMatches,matchesNativeEvidenceTask,sameEvidence} from './evidence-contract.js';

export const P109B_SOURCES=Object.freeze([
  {
    "sessionId": "representationmap",
    "index": 0,
    "nodeId": "mt_9KmVWCuh5_",
    "type": "x-algebrabar",
    "taskHash": "03a0cf7da68af78dfd306b686916d31eddd1be02bb13728eca6c601b4fbd1cc0"
  },
  {
    "sessionId": "twostep35",
    "index": 0,
    "nodeId": "mt_anAe11HAEH",
    "type": "x-algebrabar",
    "taskHash": "8c1a38b5eaf8295d25c760e6a3bc24bec9be21745504a866e57f4a2e4578b0df"
  },
  {
    "sessionId": "twostep35",
    "index": 2,
    "nodeId": "mt_anAe11HAEH",
    "type": "x-algebrabar",
    "taskHash": "ce18a6cce31f97c4ec68109394c17e64cb54bfe9eaccb82a3cb58e7fd3bf11db"
  },
  {
    "sessionId": "writing35",
    "index": 1,
    "nodeId": "mt_i9rJbuFO3p",
    "type": "x-algebrabar",
    "taskHash": "e1dc4ab36d317fb22109e31881e877077a42a5d98b84d1f498279652588b45d5"
  }
].map(Object.freeze));

export function p109bAlgebraBalanceBinding(task,context) {
  const row=P109B_SOURCES.find(s=>s.sessionId===context?.sessionId&&s.index===context?.index);
  if (!row||!matchesNativeEvidenceTask(task,context,row)) return null;
  return {nodeId:row.nodeId,kind:'p109b-algebra-balance',method:null,question:'拿走额外一块再平分以后，相等关系怎样保持？'};
}

export function replayP109BAlgebraBalanceEvidence(task,model,context) {
  try {
    const binding=p109bAlgebraBalanceBinding(task,context);
    if (!binding||!hasExactKeys(model,Object.keys(initial(task)))||!valid(task,model)||
        model.issue!==''||Object.keys(model.history).length!==model.history.length) return null;
    const {board}=initial(task);
    let rejected=false;
    const keys=Object.keys(fields);
    for (const e of model.history) {
      if (!hasExactKeys(e,['action','data'])||!hasExactKeys(e.data,['fields'])||
          !hasExactKeys(e.data.fields,keys)) return null;
      const {action,data:{fields:f}}=e;
      rejected=false;
      if (action==='reset') {
        Object.assign(board,{...initial(task).board,first:board.first});
      } else if (action==='algebra') {
        const c=number(f.count),n=number(f.fixed);
        board.first??={c,n};
        rejected=!Number.isInteger(c)||c<1||c>8||!Number.isInteger(n)||n<0||n>100;
        if (!rejected) Object.assign(board,{count:c,fixed:n,built:true,removed:false,divided:false});
      } else if (action==='remove'&&board.built&&!board.removed) {
        rejected=!equal(f.result,task.total-board.fixed);
        if (!rejected) board.removed=true;
      } else if (action==='divide'&&board.removed&&!board.divided) {
        rejected=!equal(f.result,task.total-board.fixed,board.count);
        if (!rejected) board.divided=true;
      } else return null;
    }
    const difference=task.total-task.fixed;
    const equation=norm(model.equation).replace(/([nx])\*(\d+)/g,'$2*$1');
    if (rejected||!board.divided||board.count!==task.count||board.fixed!==task.fixed||
        !equal(model.count,task.count)||!equal(model.fixed,task.fixed)||
        !equal(model.result,difference,task.count)||!equal(model.answer,difference,task.count)||
        !equationEqual(equation,[task.count+'x+'+task.fixed,String(task.total)])) return null;
    const proof={difference,shares:task.count,answer:rational(model.answer)};
    if (!sameEvidence(board,model.board)) return null;
    return {...binding,...proof};
  } catch {
    return null;
  }
}

export function submittedP109BAlgebraBalanceEvidence(task,model,record,context) {
  return latestSubmissionMatches(model,record)?replayP109BAlgebraBalanceEvidence(task,model,context):null;
}
