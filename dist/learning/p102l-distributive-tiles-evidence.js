import {initial,number,valid} from './phase5/b15-model.js';
import {equal} from './phase5/b16-model.js';
import {hasExactKeys,latestSubmissionMatches,matchesNativeEvidenceTask,sameEvidence} from './evidence-contract.js';

export const P102L_SOURCES=Object.freeze([Object.freeze({
  sessionId:'structurebridge',index:1,nodeId:'mt_hImiKNiaNh',type:'x-lawtiles',
  taskHash:'fb49c413f9d627c1f7c49d5441505d13a28e99ecdfa29206526603a2ab2d4937',
})]);

export function p102lDistributiveTilesBinding(task,context) {
  const [row]=P102L_SOURCES;
  if (context?.sessionId!==row.sessionId||context?.index!==row.index||
      !matchesNativeEvidenceTask(task,context,row)) return null;
  return {nodeId:row.nodeId,kind:'p102l-distributive-tiles',method:null,question:'拆开三份以后，长条和固定小块各有多少？'};
}

export function replayP102LDistributiveTilesEvidence(task,model,context) {
  try {
    const binding=p102lDistributiveTilesBinding(task,context);
    if (!binding||!hasExactKeys(model,Object.keys(initial(task)))||!valid(task,model)||
        model.issue!==''||Object.keys(model.history).length!==model.history.length) return null;
    let tiles={n:0,c:0};
    let trials=[];
    const inputs=new Set();
    for (const {action,data} of model.history) {
      if (data.index!==null) return null;
      if (action==='b15-reset'&&data.value===null) {
        tiles={n:0,c:0};
        trials=[];
        inputs.clear();
      } else if (action==='b15-tile'&&['n','c'].includes(data.value)) {
        if (tiles[data.value]<task.a+2) tiles[data.value]++;
      } else if (action==='b15-trial'&&data.value===null) {
        const n=number(data.fields.n);
        if (!Number.isInteger(n)||n<1||n>8||!equal(data.fields.n,n)) continue;
        trials.push({n,left:task.a*(n+task.b),right:tiles.n*n+tiles.c*task.b});
        if (tiles.n===task.a&&tiles.c===task.a) inputs.add(n);
      } else {
        return null;
      }
    }
    if (tiles.n!==task.a||tiles.c!==task.a||inputs.size<2||
        !sameEvidence({...tiles,trials},model.board)||
        !equal(model.coeff,task.a)||!equal(model.constant,task.a*task.b)) return null;
    return {...binding,coefficients:[task.a,task.a*task.b],trialInputs:[...inputs]};
  } catch {
    return null;
  }
}

export function submittedP102LDistributiveTilesEvidence(task,model,record,context) {
  return latestSubmissionMatches(model,record)?replayP102LDistributiveTilesEvidence(task,model,context):null;
}
