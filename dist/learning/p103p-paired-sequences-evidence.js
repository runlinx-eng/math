import {initial, valid} from './phase5/b34-model.js';
import {equal} from './phase5/b16-model.js';
import {hasExactKeys, latestSubmissionMatches, matchesNativeEvidenceTask, sameEvidence} from './evidence-contract.js';

export const P103P_SOURCES = Object.freeze([
  {
    "sessionId": "paired34",
    "index": 0,
    "nodeId": "mt_fxPtngwUfz",
    "type": "x-p34-pair",
    "taskHash": "c7f012a6c4757e8a2f9bac03008fad07c2418943955667c9e06fd902c531339c"
  },
  {
    "sessionId": "paired34",
    "index": 1,
    "nodeId": "mt_fxPtngwUfz",
    "type": "x-p34-pair",
    "taskHash": "df232c0fb8e4fb9fa892a63314fd2a7c4284d7f607559dbf91a2ae18d8496b3c"
  }
].map(Object.freeze));

export function p103pPairedSequencesBinding(task,context) {
  const row=P103P_SOURCES.find(source=>source.sessionId===context?.sessionId&&source.index===context?.index);
  if (!row||!matchesNativeEvidenceTask(task,context,row)) return null;
  return {nodeId:row.nodeId,kind:'p103p-paired-sequences',method:null,question:'步长是两倍，为什么对应项有时不是两倍？'};
}

export function replayP103PPairedSequencesEvidence(task,model,context) {
  try {
    const binding=p103pPairedSequencesBinding(task,context);
    if (!binding||!hasExactKeys(model,Object.keys(initial(task)))||!valid(task,model)||
        model.issue!==''||Object.keys(model.history).length!==model.history.length) return null;
    const x0=task.sx??0;
    const y0=task.sy??0;
    const pairs=[[x0,y0]];
    const plotted=[];
    for (const event of model.history) {
      if (!hasExactKeys(event,['a','i','v','w'])) return null;
      if (event.a==='next'&&event.i==='') {
        const i=pairs.length;
        if (i>=task.length) continue;
        const point=[x0+i*task.dx,y0+i*task.dy];
        if (equal(event.v,point[0])&&equal(event.w,point[1])) pairs.push(point);
      } else if (event.a==='plot'&&task.plot&&event.v===''&&event.w==='') {
        const pair=/^(\d+),(\d+)$/.exec(event.i);
        if (!pair) return null;
        const [,i,j]=pair.map(Number);
        if (i>=task.length||j>=task.length) return null;
        if (i!==j||i>=pairs.length) continue;
        const k=plotted.findIndex(point=>sameEvidence(point,pairs[i]));
        if (k<0) plotted.push(pairs[i]);
        else plotted.splice(k,1);
      } else {
        return null;
      }
    }
    if (pairs.length!==task.length||!sameEvidence(pairs,model.board.pairs)||
        !sameEvidence(plotted,model.board.plotted)||(task.plot&&plotted.length!==pairs.length)) return null;
    const double=pairs.every(([x,y])=>y===2*x);
    if (model.answers[0].trim()!==(double?'twice':'no')) return null;
    return {...binding,pairs,plotted,double};
  } catch {
    return null;
  }
}

export function submittedP103PPairedSequencesEvidence(task,model,record,context) {
  return latestSubmissionMatches(model,record)?replayP103PPairedSequencesEvidence(task,model,context):null;
}
