import {initial,valid} from './phase5/b35-model.js';
import {rat} from './phase5/b36-model.js';
import {sameNumber} from './phase5/b35-model.js';
import {hasExactKeys,latestSubmissionMatches,matchesNativeEvidenceTask,sameEvidence} from './evidence-contract.js';

export const P111G_SOURCES=Object.freeze([
  {
    "sessionId": "systems35",
    "index": 0,
    "nodeId": "mt_mqgu72aCMz",
    "type": "x-a35-plot",
    "taskHash": "6429e2364204c5df1f8f4a4d1977267a584b3c48cc976eeb8d9818c299590112"
  },
  {
    "sessionId": "systems35",
    "index": 1,
    "nodeId": "mt_mqgu72aCMz",
    "type": "x-a35-plot",
    "taskHash": "699f59fdd61c75c87a42be25dcddeba2578e462d3dc3c3f3ae8c1530c9e1aafb"
  }
].map(Object.freeze));

export function p111gGraphIntersectionBinding(task,context) {
  const row=P111G_SOURCES.find(s=>s.sessionId===context?.sessionId&&s.index===context?.index);
  if (!row||!matchesNativeEvidenceTask(task,context,row)) return null;
  return {nodeId:row.nodeId,kind:'p111g-graph-intersection',method:null,question:'哪个点可以同时代入两条关系，且两边都成立？'};
}

export function replayP111GGraphIntersectionEvidence(task,model,context) {
  try {
    const binding=p111gGraphIntersectionBinding(task,context);
    if (!binding||!hasExactKeys(model,Object.keys(initial(task)))||!valid(task,model)||
        model.issue!==''||Object.keys(model.history).length!==model.history.length) return null;
    const {board}=initial(task);
    const ticksPerUnit=1/task.step;
    function coordinate(raw) {
      const r=rat(raw);
      if (!r||r[0]<0||r[0]>task.max*r[1]||r[0]*ticksPerUnit%r[1]!==0) return null;
      return r[0]*ticksPerUnit/r[1];
    }
    let rejected=false;
    for (const e of model.history) {
      if (!hasExactKeys(e,['a','i','v','w','z','k'])||e.a!=='plot'||e.i||e.z||e.k) return null;
      const x=coordinate(e.v),y=coordinate(e.w);
      board.first.point??=[e.v,e.w];
      rejected=x===null||y===null;
      if (rejected) board.bad=true;
      else if (board.trials.length<40) {
        board.trials.push({pair:[x/ticksPerUnit,y/ticksPerUnit],
          on:task.lines.map(line=>line.m*x+line.b*ticksPerUnit===y)});
      }
    }
    const last=board.trials.at(-1), [lineA,lineB]=task.lines;
    const x=(lineA.b-lineB.b)/(lineB.m-lineA.m),y=lineA.m*x+lineA.b;
    if (rejected||!last||!last.on.every(Boolean)||!sameEvidence(last.pair,[x,y])||
        !sameNumber(model.value,x)||!sameNumber(model.second,y)) return null;
    const proof={intersection:last.pair,tried:board.trials.length};
    if (!sameEvidence(board,model.board)) return null;
    return {...binding,...proof};
  } catch {
    return null;
  }
}

export function submittedP111GGraphIntersectionEvidence(task,model,record,context) {
  return latestSubmissionMatches(model,record)?replayP111GGraphIntersectionEvidence(task,model,context):null;
}
