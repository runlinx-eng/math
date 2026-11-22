import {initial,norm,number,valid} from './phase5/b15-model.js';
import {equal,rational} from './phase5/b16-model.js';
import {hasExactKeys,latestSubmissionMatches,matchesNativeEvidenceTask,sameEvidence} from './evidence-contract.js';

export const P094D_SOURCES=Object.freeze([
  {
    "sessionId": "decimaldivide",
    "index": 0,
    "nodeId": "mt_lU-2aTRB9f",
    "type": "x-decimaldivide",
    "taskHash": "1fd54779ec0ab39e68ba14f3f0b5f89fd8e33608d9c9e0b0ae0408fad65cbcad"
  },
  {
    "sessionId": "decimaldivide",
    "index": 1,
    "nodeId": "mt_lU-2aTRB9f",
    "type": "x-decimaldivide",
    "taskHash": "62191b1624669ac8c4417939e82fb1114e31d7a716d985c6260667b3089b8310"
  },
  {
    "sessionId": "decimaldivide",
    "index": 2,
    "nodeId": "mt_lU-2aTRB9f",
    "type": "x-decimaldivide",
    "taskHash": "22bb363e5c240751d9b2528888c62137f7c5f7df2f024489e58091c5caf5ce84"
  },
  {
    "sessionId": "fractionfour",
    "index": 16,
    "nodeId": "mt_gNUE4B3vuk",
    "type": "x-decimaldivide",
    "taskHash": "4b5f695a3a534cef56059aeea855f4821c9a6cb730a33e33dfd9c5e9e6fc722e"
  }
].map(Object.freeze));

function multiplicationCheck(input,source,divisor) {
  const sides=norm(input).replaceAll('＝','=').split('=');
  if (sides.length!==2) return false;
  const [n,d]=source;
  return [sides,[...sides].reverse()].some(([left,right])=>{
    const parts=left.split('*');
    if (parts.length!==2||!equal(right,n,d)) return false;
    return [parts,[...parts].reverse()].some(([quotient,factor])=>
      equal(quotient,n,d*divisor)&&equal(factor,divisor));
  });
}

export function p094dDecimalDivisionBinding(task,context) {
  const row=P094D_SOURCES.find(s=>s.sessionId===context?.sessionId&&s.index===context?.index);
  if (!row||!matchesNativeEvidenceTask(task,context,row)) return null;
  return {nodeId:row.nodeId,kind:'p094d-decimal-division',method:null,
    question:'留下的余数怎样换成下一位的单位？乘回去是否等于原来的数？'};
}

export function replayP094DDecimalDivisionEvidence(task,model,context) {
  try {
    const binding=p094dDecimalDivisionBinding(task,context);
    if (!binding||!hasExactKeys(model,Object.keys(initial(task)))||!valid(task,model)||
        model.issue!==''||Object.keys(model.history).length!==model.history.length) return null;
    const divisor=task.divisor, whole=task.decimal.split('.')[0].length;
    let {board}=initial(task);
    let rejected=false;
    for (const {action,data} of model.history) {
      if (data.index!==null||data.value!==null) return null;
      const f=data.fields, remainder=board.steps.at(-1)?.r??0;
      rejected=false;
      if (action==='b15-reset') {
        board=initial(task).board;
      } else if (action==='b15-point'&&!board.steps.length) {
        rejected=!equal(f.point,whole);
        if (!rejected) board.point=whole;
      } else if (action==='b15-zero'&&board.steps.length===board.digits.length&&remainder!==0&&
          board.digits.length-whole<task.places) {
        board.digits.push(0);
      } else if (action==='b15-bring'&&board.point!==null&&!board.ready&&
          board.steps.length<board.digits.length) {
        rejected=!equal(f.exchange,remainder*10);
        if (!rejected) {
          board.current=remainder*10+board.digits[board.steps.length];
          board.ready=true;
        }
      } else if (action==='b15-div-step'&&board.ready) {
        const q=Math.floor(board.current/divisor), used=q*divisor, r=board.current%divisor;
        rejected=!equal(f.q,q)||!equal(f.used,used)||!equal(f.rest,r);
        if (!rejected) {
          board.steps.push({q,used,r,current:board.current});
          board.current=null;
          board.ready=false;
        }
      } else return null;
    }
    if (rejected||!sameEvidence(board,model.board)||board.ready||board.point!==whole||
        board.steps.length!==board.digits.length||board.steps.at(-1)?.r!==0) return null;
    const source=rational(task.decimal);
    const [n,d]=source;
    if (number(model.answer)===null||!equal(model.answer,n,d*divisor)||
        !multiplicationCheck(model.check,source,divisor)) return null;
    return {...binding,divisor,quotient:model.answer.trim(),steps:board.steps,appendedZeros:board.digits.length-task.decimal.replace('.','').length};
  } catch {
    return null;
  }
}

export function submittedP094DDecimalDivisionEvidence(task,model,record,context) {
  return latestSubmissionMatches(model,record)?replayP094DDecimalDivisionEvidence(task,model,context):null;
}
