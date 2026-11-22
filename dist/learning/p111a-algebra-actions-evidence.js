import {initial,valid} from './phase5/b35-model.js';
import {rat,rtext} from './phase5/b36-model.js';
import {equationEqual,sameNumber} from './phase5/b35-model.js';
import {hasExactKeys,latestSubmissionMatches,matchesNativeEvidenceTask,sameEvidence} from './evidence-contract.js';

export const P111A_SOURCES=Object.freeze([
  {
    "sessionId": "writing35",
    "index": 0,
    "nodeId": "mt_i9rJbuFO3p",
    "type": "x-a35-build",
    "taskHash": "147200509f080903b5b87f76d10715d71bec0cf40055b8a21285cece3e6dbe48"
  },
  {
    "sessionId": "advancedPlan38",
    "index": 2,
    "nodeId": "mt_FieL-vVTI_",
    "type": "x-a35-build",
    "taskHash": "147200509f080903b5b87f76d10715d71bec0cf40055b8a21285cece3e6dbe48"
  }
].map(Object.freeze));

export function p111aAlgebraActionsBinding(task,context) {
  const row=P111A_SOURCES.find(s=>s.sessionId===context?.sessionId&&s.index===context?.index);
  if (!row||!matchesNativeEvidenceTask(task,context,row)) return null;
  return {nodeId:row.nodeId,kind:'p111a-algebra-actions',method:null,question:'按顺序先乘再加，哪个输入能到目标？'};
}

export function replayP111AAlgebraActionsEvidence(task,model,context) {
  try {
    const binding=p111aAlgebraActionsBinding(task,context);
    if (!binding||!hasExactKeys(model,Object.keys(initial(task)))||!valid(task,model)||
        model.issue!==''||Object.keys(model.history).length!==model.history.length) return null;
    const {board}=initial(task);
    let rejected=false;
    for (const e of model.history) {
      if (!hasExactKeys(e,['a','i','v','w','z','k'])||e.w||e.z||e.k) return null;
      rejected=false;
      if (e.a==='block'&&task.blocks.some(block=>block.id===e.i)&&!board.steps.includes(e.i)) {
        board.steps.push(e.i);
      } else if (e.a==='undo'&&e.i===''&&board.steps.length) {
        board.steps.pop();
      } else if (e.a==='clear'&&e.i==='') {
        board.steps=[];
      } else if (e.a==='run'&&e.i==='') {
        const input=rat(e.v);
        board.first.run??={steps:[...board.steps],value:e.v};
        if (!input||board.steps.length!==task.required.length) {
          rejected=true;
        } else {
          let result=input;
          for (const id of board.steps) {
            const {op,value}=task.blocks.find(block=>block.id===id);
            const [n,d]=result;
            result=rat([op==='mul'?n*value:n+(op==='add'?1:-1)*value*d,d]);
            if (!result) break;
          }
          if (result) {
            const ok=sameEvidence(board.steps,task.required)&&sameNumber(rtext(result),task.target);
            board.runs.push({steps:[...board.steps],value:rtext(input),result:rtext(result),ok});
            if (!ok) board.bad=true;
          }
        }
      } else return null;
      if (rejected) board.bad=true;
    }
    const last=board.runs.at(-1);
    if (rejected||!last?.ok||!sameEvidence(last.steps,board.steps)||
        !sameNumber(last.value,model.value)||!equationEqual(model.answers[0],['2x+5','17'])) return null;
    const proof={input:last.value,output:last.result,steps:last.steps};
    if (!sameEvidence(board,model.board)) return null;
    return {...binding,...proof};
  } catch {
    return null;
  }
}

export function submittedP111AAlgebraActionsEvidence(task,model,record,context) {
  return latestSubmissionMatches(model,record)?replayP111AAlgebraActionsEvidence(task,model,context):null;
}
