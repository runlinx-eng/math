import {initial,valid} from './phase5/b09-model.js';
import {cmp,div,equal,normalized,parse,sub} from './phase5/b09-math.js';
import {hasExactKeys,latestSubmissionMatches,matchesNativeEvidenceTask} from './evidence-contract.js';

export const P091R_SOURCES=Object.freeze([
  {
    "sessionId": "allowedrange",
    "index": 2,
    "nodeId": "mt_i2F1nWxJjv",
    "type": "x-allowedrange",
    "taskHash": "23e057bedce800d7efbfe66f9c4945d45b0f9679eeece2d3e5ae8ec967e200cb"
  },
  {
    "sessionId": "allowedrange",
    "index": 3,
    "nodeId": "mt_i2F1nWxJjv",
    "type": "x-allowedrange",
    "taskHash": "9f32760d348ca1a918870a17c30dbf9c17fe38f3cfc75d10e93b719380f7d735"
  },
  {
    "sessionId": "allowedrange",
    "index": 4,
    "nodeId": "mt_i2F1nWxJjv",
    "type": "x-allowedrange",
    "taskHash": "0abdd2469d1f616c43e723d9e09edd7d85af8cd672c9be2488a098fbd11f6110"
  }
].map(Object.freeze));

export function p091rInequalityRangeBinding(task,context) {
  const row=P091R_SOURCES.find(s=>s.sessionId===context?.sessionId&&s.index===context?.index);
  if (!row||!matchesNativeEvidenceTask(task,context,row)) return null;
  return {nodeId:row.nodeId,kind:'p091r-inequality-range',method:null,
    question:'哪一段的数都适用？端点本身算不算？'};
}

export function replayP091RInequalityRangeEvidence(task,model,context) {
  try {
    const binding=p091rInequalityRangeBinding(task,context);
    if (!binding||!hasExactKeys(model,Object.keys(initial(task)))||!valid(task,model)||
        Object.keys(model.trials).length!==model.trials.length||
        Object.keys(model.commands).length!==model.commands.length) return null;
    const between=task.relation==='between';
    if (!model.touched||model.boundary!==task.bound||model.side!==(between?'between':'left')||
        model.closed!==(task.relation==='<'?'no':'yes')) return null;
    if (between) {
      if (!model.otherTouched||model.other!==task.upper||model.otherClosed!=='no') return null;
    } else if (model.other!==0||model.otherTouched||model.otherClosed!=='') return null;
    const reverse=task.relation==='<'?'>':'>=';
    const statements=between
      ? [`${task.bound}<=x<${task.upper}`,`${task.upper}>x>=${task.bound}`]
      : [`x${task.relation}${task.bound}`,`${task.bound}${reverse}x`];
    if (!statements.includes(normalized(model.statement))) return null;

    if (task.algebra) {
      if (!model.commands.length) return null;
      let a=[task.algebra.a,1], b=[task.algebra.b,1], rhs=[task.algebra.rhs,1];
      for (const cmd of model.commands) {
        if (!hasExactKeys(cmd,['op','value'])) return null;
        if (cmd.op==='sub') {
          b=sub(b,[cmd.value,1]);
          rhs=sub(rhs,[cmd.value,1]);
        } else {
          [a,b,rhs]=[a,b,rhs].map(r=>div(r,[cmd.value,1]));
        }
        if (!a||!b||!rhs) return null;
      }
      if (!equal(a,[1,1])||!equal(b,[0,1])||!equal(rhs,[task.bound,1])) return null;
    } else if (model.commands.length) return null;

    const covered=new Set();
    for (const trial of model.trials) {
      if (!hasExactKeys(trial,['value','actual','graph'])) return null;
      const value=parse(trial.value);
      const low=cmp(value,[task.bound,1]);
      const high=between?cmp(value,[task.upper,1]):0;
      const inRange=between?low>=0&&high<0:task.relation==='<'?low<0:low<=0;
      if (trial.actual!==inRange) return null;
      if (trial.graph!==inRange) continue;
      if (between) covered.add(low===0?'lower':high===0?'upper':low>0&&high<0?'inside':'outside');
      else covered.add(low===0?'boundary':low<0?'inside':'outside');
    }
    const expected=between?['lower','upper','inside','outside']:['boundary','inside','outside'];
    if (!expected.every(key=>covered.has(key))) return null;
    return {...binding,statement:statements[0],tested:expected,retainedOperations:model.commands.length};
  } catch {
    return null;
  }
}

export function submittedP091RInequalityRangeEvidence(task,model,record,context) {
  return latestSubmissionMatches(model,record)?replayP091RInequalityRangeEvidence(task,model,context):null;
}
