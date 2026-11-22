import {initial, number, valid} from './phase5/b20-model.js';
import {equal} from './phase5/b16-model.js';
import {hasExactKeys, latestSubmissionMatches, matchesNativeEvidenceTask, sameEvidence} from './evidence-contract.js';

export const P116H_SOURCES = Object.freeze([
  {
    "sessionId": "chartfamilies",
    "index": 0,
    "nodeId": "mt_eKJG-0eC6D",
    "type": "x-histbuild",
    "taskHash": "508c6fa707bc9ae0d01974cac53b50181d85755e11747016a5da870c3ee3c054"
  },
  {
    "sessionId": "histogram",
    "index": 0,
    "nodeId": "mt_oderfUBZPw",
    "type": "x-histbuild",
    "taskHash": "2a10eccb3b0274ca55006910ca5fd4d910164e1b787386e4273528513d371937"
  },
  {
    "sessionId": "histogram",
    "index": 2,
    "nodeId": "mt_oderfUBZPw",
    "type": "x-histbuild",
    "taskHash": "36e4f9439846ce2c09173245dba048f6dfb07624b4875959414e4f08db8693cf"
  }
].map(Object.freeze));

export function p116hHistogramBinsBinding(task,context) {
  const row=P116H_SOURCES.find(source=>source.sessionId===context?.sessionId&&source.index===context?.index);
  if (!row||!matchesNativeEvidenceTask(task,context,row)) return null;
  return {nodeId:row.nodeId,kind:'p116h-histogram-bins',method:null,question:'数值落在两个区间的边界上时，哪一个区间包含它？'};
}

function answersMatch(task,context,answers,counts) {
  if (context.sessionId==='chartfamilies') {
    const start=task.start+Math.floor((30-task.start)/10)*10;
    return start===30&&answers[0]==='right';
  }
  if (context.index===0) {
    const i=(150-task.start)/10;
    return equal(answers[0],counts[i])&&equal(answers[1],counts.slice(0,i).reduce((a,b)=>a+b,0));
  }
  return sameEvidence(answers,['continuous','yes','no']);
}

export function replayP116HHistogramBinsEvidence(task,model,context) {
  try {
    const binding=p116hHistogramBinsBinding(task,context);
    if (!binding||!hasExactKeys(model,Object.keys(initial(task)))||!valid(task,model)||
        model.issue!==''||Object.keys(model.history).length!==model.history.length) return null;
    let width=task.widths[0];
    let cursor=0;
    const placed=task.values.map(()=>null);
    for (const event of model.history) {
      if (!hasExactKeys(event,['a','d','f'])) return null;
      if (event.a==='width'&&hasExactKeys(event.d,[])) {
        const value=number(event.f.width);
        if (!task.widths.includes(value)) continue;
        if (!equal(event.f.width,value)) return null;
        width=value;
        placed.fill(null);
        cursor=0;
      } else if (event.a==='reset'&&hasExactKeys(event.d,[])) {
        width=task.widths[0];
        placed.fill(null);
        cursor=0;
      } else if (['row','bin'].includes(event.a)&&hasExactKeys(event.d,['index'])) {
        const i=number(event.d.index);
        const limit=event.a==='row'?placed.length:(task.end-task.start)/width;
        if (!Number.isInteger(i)||i<0||i>=limit||!equal(event.d.index,i)) return null;
        if (event.a==='row') {
          cursor=i;
        } else {
          placed[cursor]=i;
          const next=placed.indexOf(null);
          if (next>=0) cursor=next;
        }
      } else {
        return null;
      }
    }
    if (width!==model.board.width||cursor!==model.board.cursor||!sameEvidence(placed,model.board.placed)||
        model.xaxis!=='interval'||model.yaxis!=='frequency') return null;
    const counts=Array((task.end-task.start)/width).fill(0);
    for (const [i,value] of task.values.entries()) {
      const bin=placed[i];
      if (!Number.isInteger(bin)) return null;
      const lower=task.start+bin*width;
      if (value<lower||value>=lower+width) return null;
      counts[bin]++;
    }
    if (!answersMatch(task,context,model.answers,counts)) return null;
    return {...binding,width,counts};
  } catch {
    return null;
  }
}

export function submittedP116HHistogramBinsEvidence(task,model,record,context) {
  return latestSubmissionMatches(model,record)?replayP116HHistogramBinsEvidence(task,model,context):null;
}
