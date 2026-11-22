import {initial, number, valid} from './phase5/b20-model.js';
import {equal, rational} from './phase5/b16-model.js';
import {hasExactKeys, latestSubmissionMatches, matchesNativeEvidenceTask, sameEvidence} from './evidence-contract.js';

export const P100B_SOURCES=Object.freeze([Object.freeze({
  sessionId:'boxsummary',index:1,nodeId:'mt_8VjmxR1yfw',type:'x-boxsummary',
  taskHash:'199c0b9d306a18117039cefeb5d1b81e6c9a666ff8c83759c32265585c520577',
})]);

export function p100bBoxplotSummaryBinding(task,context) {
  const [row]=P100B_SOURCES;
  if (context?.sessionId!==row.sessionId||context?.index!==row.index||
      !matchesNativeEvidenceTask(task,context,row)) return null;
  return {nodeId:row.nodeId,kind:'p100b-boxplot-summary',method:null,question:'哪些内部数据能变，而五数概括仍保持原样？'};
}

const intValue=n=>[BigInt(n),1n];
const compare=([n,d],[p,q])=>n*q-d*p;

function middle(values) {
  const i=Math.floor(values.length/2);
  if (values.length%2) return values[i];
  const [a,b]=values[i-1];
  const [c,d]=values[i];
  return [a*d+c*b,2n*b*d];
}

function five(values) {
  const i=Math.floor(values.length/2);
  return [values[0],middle(values.slice(0,i)),middle(values),middle(values.slice(i+values.length%2)),values.at(-1)];
}

export function replayP100BBoxplotSummaryEvidence(task,model,context) {
  try {
    const binding=p100bBoxplotSummaryBinding(task,context);
    if (!binding||!hasExactKeys(model,Object.keys(initial(task)))||!valid(task,model)||
        model.issue!==''||Object.keys(model.history).length!==model.history.length) return null;
    const original=task.data.map(intValue);
    let values=[...original];
    for (const event of model.history) {
      if (!hasExactKeys(event,['a','d','f'])||!hasExactKeys(event.d,[])) return null;
      if (event.a==='reset') {
        values=[...original];
        continue;
      }
      if (event.a!=='alter') return null;
      const i=number(event.f.index);
      if (!Number.isInteger(i)||i<1||i>=values.length-1) continue;
      if (!equal(event.f.index,i)) return null;

      const raw=rational(event.f.value);
      if (!raw) continue;
      const value=raw.map(BigInt);
      if (compare(value,values[i-1])>=0n&&compare(value,values[i+1])<=0n) values[i]=value;
    }
    const changedIndex=values.flatMap((value,i)=>compare(value,original[i])!==0n?[i]:[]);
    const summary=five(values);
    if (!changedIndex.length||!model.board.changed||
        !sameEvidence(values.map(([n,d])=>Number(n)/Number(d)),model.board.values)||
        [summary,five(original),five(task.other.map(intValue))].some(points=>
          points.some((value,i)=>compare(value,intValue(task.summary[i]))!==0n))||
        !sameEvidence(model.answers,['spread','median'])) return null;
    return {...binding,changedIndex,summary:[...task.summary]};
  } catch {
    return null;
  }
}

export function submittedP100BBoxplotSummaryEvidence(task,model,record,context) {
  return latestSubmissionMatches(model,record)?replayP100BBoxplotSummaryEvidence(task,model,context):null;
}
