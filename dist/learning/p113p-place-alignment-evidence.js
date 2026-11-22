import {initial, number, valid} from './phase5/b11-model.js';
import {replayPlaceEvidence} from './place-evidence.js';
import {hasExactKeys, latestSubmissionMatches, matchesNativeEvidenceTask, sameEvidence} from './evidence-contract.js';

export const P113P_SOURCES = Object.freeze([
  {
    "sessionId": "tensmove",
    "index": 0,
    "nodeId": "mt_I5j1ZWo2cn",
    "type": "x-placecalc",
    "taskHash": "67d7cb5553c7acd62ab6418d6cc310aebc39ca5d0941b8f1746aa4bcf65b8a07"
  },
  {
    "sessionId": "tensmove",
    "index": 2,
    "nodeId": "mt_I5j1ZWo2cn",
    "type": "x-placecalc",
    "taskHash": "8a84d02cde54fad9ddd8cc826ec24ead7ad0ff27d61cbc33c029d2dc7afe3e68"
  },
  {
    "sessionId": "addhundred",
    "index": 1,
    "nodeId": "mt_glPPG-kTQY",
    "type": "x-placecalc",
    "taskHash": "77f665a2c5de55af31227f3b75509266a4db3fd76f28e960d4fbbb55d37a7546"
  },
  {
    "sessionId": "oneslarge",
    "index": 2,
    "nodeId": "mt_oDU_8zMZjp",
    "type": "x-placecalc",
    "taskHash": "b5451188d02838125f3c4a68406e125204c3bc9c75856c58460e1954bdcf3d3a"
  },
  {
    "sessionId": "tenslarge",
    "index": 0,
    "nodeId": "mt_aHQ9kNt3is",
    "type": "x-placecalc",
    "taskHash": "05382c98ca409f48f70da3e836a7efae9edc144ebbeda48227e4b1353b150e43"
  },
  {
    "sessionId": "hundredsmove",
    "index": 0,
    "nodeId": "mt_xPqczp7zPX",
    "type": "x-placecalc",
    "taskHash": "e74d44eb9cc76183463a80255467706a319c07d4a1940a7be88c3d7ab0509069"
  },
  {
    "sessionId": "hundredsmove",
    "index": 2,
    "nodeId": "mt_xPqczp7zPX",
    "type": "x-placecalc",
    "taskHash": "de57cb5286a3acb97dd91b0a0d83be1749600e006b421305eaa2c404190462ff"
  }
].map(Object.freeze));

export function p113pPlaceAlignmentBinding(task, context) {
  const row = P113P_SOURCES.find(source => source.sessionId === context?.sessionId && source.index === context?.index);
  if (!row || !matchesNativeEvidenceTask(task,context,row)) return null;
  return {nodeId:row.nodeId,kind:'p113p-place-alignment',method:null,question:'新增的是几个一、十或百？哪些数位没有变？'};
}

function replayAlignment(task, model) {
  const columns = model.counts.length;
  const total = task.values[0]+task.values[1];
  const counts = Array.from({length:columns},(_,i)=>task.values.reduce((sum,value)=>
    sum+Math.floor(value/10**i)%10,0));
  if (model.issue !== '' || !model.started || counts.some(count=>count>=10) ||
      !sameEvidence(counts,model.counts) || model.remaining.some(value=>value!==0) ||
      number(model.answer)!==total || !sameEvidence(model.align,['0','0'])) return null;
  let first=null;
  let accepted=null;
  for (const event of model.history) {
    if (accepted !== null || !hasExactKeys(event,['action','guess','align']) ||
        event.action !== 'b11-place-start' || number(event.guess) === null ||
        !Array.isArray(event.align) || event.align.length !== 2 ||
        !Array.from(event.align).every(value=>value === '' ||
          typeof value === 'string' && /^[0-9]+$/.test(value) && Number(value)<columns)) return null;
    first ??= event.guess;
    if (sameEvidence(event.align,['0','0'])) accepted=event.guess;
  }
  if (accepted === null || first!==model.first || accepted!==model.guess) return null;
  return {counts,total,exchanges:[]};
}

export function replayP113PPlaceAlignmentEvidence(task, model, context) {
  try {
    const binding = p113pPlaceAlignmentBinding(task,context);
    if (!binding || !hasExactKeys(model,Object.keys(initial(task))) || !valid(task,model) ||
        Object.keys(model.history).length!==model.history.length) return null;
    const proof = model.history.some(event=>event.action==='b11-exchange') ?
      replayPlaceEvidence(task,model) : replayAlignment(task,model);
    return proof ? {...binding,counts:proof.counts,total:proof.total,exchanges:proof.exchanges} : null;
  } catch {
    return null;
  }
}

export function submittedP113PPlaceAlignmentEvidence(task, model, record, context) {
  return latestSubmissionMatches(model,record) ? replayP113PPlaceAlignmentEvidence(task,model,context) : null;
}
