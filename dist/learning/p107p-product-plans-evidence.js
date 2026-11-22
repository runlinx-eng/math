import {initial,number,valid} from './phase5/b14-model.js';
import {equivalent,norm} from './phase5/b15-model.js';
import {equal,rational} from './phase5/b16-model.js';
import {hasExactKeys,latestSubmissionMatches,matchesNativeEvidenceTask,sameEvidence} from './evidence-contract.js';

export const P107P_SOURCES=Object.freeze([
  {
    "sessionId": "remainders",
    "index": 3,
    "nodeId": "mt_p-nbe0w_lf",
    "type": "x-planproduct",
    "taskHash": "a226434c8efd9bc80ba6b7cb9489e68cdf3235fb2b0f3cd509968befcc5ff17f"
  },
  {
    "sessionId": "remainders",
    "index": 4,
    "nodeId": "mt_p-nbe0w_lf",
    "type": "x-planproduct",
    "taskHash": "0893576e1c69162ff67758968d1750c9dd63d49f2c236d2a56887d6d04642574"
  },
  {
    "sessionId": "factoruse",
    "index": 4,
    "nodeId": "mt_0Wg5F97osg",
    "type": "x-planproduct",
    "taskHash": "ac8fd2af6c812a0e5e7ed5c64f08053405d4f793118d07323c2b89570455f5d0"
  }
].map(Object.freeze));

function readsEquation(task,raw) {
  const [a,b,...rest]=norm(raw).replace(/[ＮN]/g,'n').split('=');
  if (rest.length||!a||!b) return false;
  const expr=a==='n'?b:b==='n'?a:null;
  if (expr===null) return false;
  const plans=task.plans.map(s=>s.replace(/\d/g,i=>String(task.values[Number(i)]/(Number(i)===task.values.length-1?100:1))));
  const permitted=[...task.equations.map(s=>norm(s).split('=')[1]),...plans];
  return permitted.some(p=>equivalent(expr,p));
}

export function p107pProductPlansBinding(task,context) {
  const row=P107P_SOURCES.find(s=>s.sessionId===context?.sessionId&&s.index===context?.index);
  if (!row||!matchesNativeEvidenceTask(task,context,row)) return null;
  return {nodeId:row.nodeId,kind:'p107p-product-plans',method:null,
    question:'这一步先合并哪两张卡？每个数还有没有被重复使用？'};
}

export function replayP107PProductPlansEvidence(task,model,context) {
  try {
    const binding=p107pProductPlansBinding(task,context);
    if (!binding||!hasExactKeys(model,Object.keys(initial(task)))||!valid(task,model)||
        model.issue!==''||Object.keys(model.history).length!==model.history.length) return null;
    let {board}=initial(task);
    let rejected=false;
    for (const {action,data} of model.history) {
      const {index,side,value,fields}=data;
      if (side!==null||value!==null) return null;
      rejected=false;
      if (action==='b14-reset'&&index===null) {
        board=initial(task).board;
      } else if (action==='b14-plan-split'&&index===null&&task.split&&!board.split) {
        const a=number(fields.left), b=number(fields.right);
        rejected=!Number.isInteger(a)||!Number.isInteger(b)||a<2||b<2||a*b!==task.values[0];
        if (!rejected) {
          board.groups=[{value:a,expr:'0a',ids:['0a']},{value:b,expr:'0b',ids:['0b']},
            {value:task.values[1],expr:'1',ids:[1]}];
          board.split=true;
          board.selected=[];
        }
      } else if (action==='b14-plan-pick'&&index!==null&&board.groups[index]&&(!task.split||board.split)) {
        const at=board.selected.indexOf(index);
        if (at!==-1) board.selected.splice(at,1);
        else if (board.selected.length<2) board.selected.push(index);
      } else if (action==='b14-merge'&&index===null&&board.selected.length===2) {
        const [i,j]=board.selected,[a,b]=[board.groups[i],board.groups[j]];
        const op=task.split?'*':fields.operator;
        if (op!=='*'&&op!=='/') {
          rejected=true;
          continue;
        }
        const [an,ad]=rational(a.value), [bn,bd]=rational(b.value);
        const [n,d]=op==='*'?[an*bn,ad*bd]:[an*bd,ad*bn];
        rejected=!d||!equal(fields.result,n,d)||number(fields.result)===null;
        if (!rejected) {
          const result=n/d;
          board.merges.push({before:board.groups,left:a.value,right:b.value,op,value:result});
          board.groups=board.groups.filter((_,k)=>k!==i&&k!==j);
          board.groups.push({value:result,expr:`(${a.expr}${op}${b.expr})`,ids:[...a.ids,...b.ids]});
          board.selected=[];
        }
      } else if (action==='b14-undo'&&index===null&&board.merges.length) {
        board.groups=board.merges.pop().before;
        board.selected=[];
      } else return null;
    }
    const [a,b,c]=task.values, n=task.values.length===2?a*b:a*c, d=c===undefined?1:b;
    const [final]=board.groups;
    if (rejected||!sameEvidence(board,model.board)||board.groups.length!==1||(task.split&&!board.split)||
        !equal(String(final.value),n,d)||(task.plans&&!task.plans.includes(final.expr))||
        !equal(model.answer,n,d*(task.money?100:1))||
        (task.money&&(!/^\d+\.\d{2}$/.test(model.answer.trim())||!readsEquation(task,model.equation)))) return null;
    return {...binding,steps:board.merges.map(({left,right,op,value})=>({left,right,op,value})),
      answer:model.answer.trim(),unit:task.money?'yuan':null};
  } catch {
    return null;
  }
}

export function submittedP107PProductPlansEvidence(task,model,record,context) {
  return latestSubmissionMatches(model,record)?replayP107PProductPlansEvidence(task,model,context):null;
}
