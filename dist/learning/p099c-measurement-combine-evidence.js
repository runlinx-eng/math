import {initial, valid} from './phase5/b29-model.js';
import {equal} from './phase5/b16-model.js';
import {hasExactKeys, latestSubmissionMatches, matchesNativeEvidenceTask, sameEvidence} from './evidence-contract.js';

export const P099C_SOURCES = Object.freeze([
  {
    "sessionId": "measurecalc",
    "index": 4,
    "nodeId": "mt_6oxQPNLHNv",
    "type": "x-m29-combine",
    "taskHash": "69de8d06f8b4faca3206960618a4ffd486255a5a35bce8e495d89195ec1645a5"
  },
  {
    "sessionId": "practicalmeasure",
    "index": 3,
    "nodeId": "mt_5HV4mbgSGH",
    "type": "x-m29-combine",
    "taskHash": "0288899bf3d3fb5ac98d6e7507945b95f07aa3de7b30843665ef60f2d8c61760"
  }
].map(Object.freeze));

export function p099cMeasurementCombineBinding(task,context) {
  const row=P099C_SOURCES.find(source=>source.sessionId===context?.sessionId&&source.index===context?.index);
  if (!row||!matchesNativeEvidenceTask(task,context,row)) return null;
  return {nodeId:row.nodeId,kind:'p099c-measurement-combine',method:null,question:'这些量用同一个单位时，怎样合起来才不会遗漏？'};
}

export function replayP099CMeasurementCombineEvidence(task,model,context) {
  try {
    const binding=p099cMeasurementCombineBinding(task,context);
    if (!binding||!hasExactKeys(model,Object.keys(initial(task)))||!valid(task,model)||
        model.issue!==''||Object.keys(model.history).length!==model.history.length) return null;
    let selected=[];
    for (const event of model.history) {
      if (!hasExactKeys(event,['a','i','v'])||event.v!=='') return null;
      if (event.a==='choose'&&/^\d+$/.test(event.i)) {
        const i=Number(event.i);
        if (i>=task.parts.length) return null;
        if (!selected.includes(i)) selected.push(i);
      } else if (event.a==='undo'&&event.i==='') {
        selected.pop();
      } else if (event.a==='clear'&&event.i==='') {
        selected=[];
      } else {
        return null;
      }
    }
    if (selected.length!==task.parts.length||!sameEvidence(selected,model.board.chosen)) return null;
    const total=selected.reduce((sum,i)=>sum+task.parts[i],0);
    if (model.unit!==task.unit||!equal(model.answer,total,task.scale)) return null;
    return {...binding,parts:selected.map(i=>task.parts[i]),total,scale:task.scale,unit:task.unit};
  } catch {
    return null;
  }
}

export function submittedP099CMeasurementCombineEvidence(task,model,record,context) {
  return latestSubmissionMatches(model,record)?replayP099CMeasurementCombineEvidence(task,model,context):null;
}
