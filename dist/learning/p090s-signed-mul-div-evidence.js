import {initial, valid} from './phase5/b15-model.js';
import {equal} from './phase5/b16-model.js';
import {hasExactKeys, latestSubmissionMatches, matchesNativeEvidenceTask, sameEvidence} from './evidence-contract.js';


export const P090S_SOURCES = Object.freeze([
  {
    "sessionId": "fractionfour",
    "index": 10,
    "nodeId": "mt_gNUE4B3vuk",
    "type": "x-signwalk",
    "taskHash": "014eace4356e307ff71c16ffcd44c6c83e01a36c62959859f967fa4f40b9f022"
  },
  {
    "sessionId": "fractionfour",
    "index": 11,
    "nodeId": "mt_gNUE4B3vuk",
    "type": "x-signwalk",
    "taskHash": "d63b42bc76511488879485dde716eb4468bb948750d823213c00b4a92733b700"
  }
].map(Object.freeze));

export function p090sSignedMulDivBinding(task,context) {
  const row=P090S_SOURCES.find(source=>source.sessionId===context?.sessionId&&source.index===context?.index);
  if (!row||!matchesNativeEvidenceTask(task,context,row)) return null;
  return {nodeId:row.nodeId,kind:'p090s-signed-mul-div',method:null,question:'两个数的符号怎样决定积或商的方向？'};
}

export function replayP090SSignedMulDivEvidence(task,model,context) {
  try {
    const binding=p090sSignedMulDivBinding(task,context);
    if (!binding||!hasExactKeys(model,Object.keys(initial(task)))||!valid(task,model)||
        model.issue!==''||Object.keys(model.history).length!==model.history.length) return null;
    let rows=[];
    let first=null;
    for (const {action,data} of model.history) {
      if (data.index!==null||data.value!==null) return null;
      if (action==='b15-reset') {
        rows=[];
        continue;
      }
      if (action!=='b15-sign') return null;
      const current=task.cases[rows.length];
      if (!current) continue;
      const raw=data.fields.result;
      first ??= raw;
      const {a,b,op}=current;
      const value=(op==='*'?a*b:a/b)||0;
      if (/^[+-]?\d{1,10}(?:\.\d{1,8})?$/.test(raw.trim())&&equal(raw,value)) rows.push({...current,value});
    }
    if (rows.length!==task.cases.length||!sameEvidence({rows,first},model.board)) return null;
    return {...binding,rows};
  } catch {
    return null;
  }
}

export function submittedP090SSignedMulDivEvidence(task,model,record,context) {
  return latestSubmissionMatches(model,record)?replayP090SSignedMulDivEvidence(task,model,context):null;
}
