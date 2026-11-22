import {initial,valid} from './phase5/b23-model.js';
import {equal} from './phase5/b16-model.js';
import {hasExactKeys,latestSubmissionMatches,matchesNativeEvidenceTask,sameEvidence} from './evidence-contract.js';

export const P092T_SOURCES=Object.freeze([
  {
    "sessionId": "shapemerge",
    "index": 0,
    "nodeId": "mt_MqqR7VUoz1",
    "type": "x-s23-tile",
    "taskHash": "5e1473b68cfbe06cbd1ca1cf64b396f6c517c94d7b6386395bbbafd02753dbb3"
  },
  {
    "sessionId": "shapemerge",
    "index": 1,
    "nodeId": "mt_MqqR7VUoz1",
    "type": "x-s23-tile",
    "taskHash": "c9650c46872601ffff9be6acbefb60e5cb9cf2fb53ed4ed6a2fafb25dc12a207"
  },
  {
    "sessionId": "shapemerge",
    "index": 2,
    "nodeId": "mt_MqqR7VUoz1",
    "type": "x-s23-tile",
    "taskHash": "47b13df8ec9ca9ec60b727bc97e9154367b3ee1ea7692440228f3d45c76b3b0d"
  },
  {
    "sessionId": "shapemerge",
    "index": 3,
    "nodeId": "mt_MqqR7VUoz1",
    "type": "x-s23-tile",
    "taskHash": "589413fb5749de2e81ad8f20c62333e3751bcb032c58d4004ef9997f90c0b612"
  }
].map(Object.freeze));

export function p092tPieceAssemblyBinding(task,context) {
  const row=P092T_SOURCES.find(s=>s.sessionId===context?.sessionId&&s.index===context?.index);
  if (!row||!matchesNativeEvidenceTask(task,context,row)) return null;
  return {nodeId:row.nodeId,kind:'p092t-piece-assembly',method:null,
    question:'每块放在哪个方向才没有空隙或重叠？拼好的图形可以怎样拆开？'};
}

export function replayP092TPieceAssemblyEvidence(task,model,context) {
  try {
    const binding=p092tPieceAssemblyBinding(task,context);
    if (!binding||!hasExactKeys(model,Object.keys(initial(task,1)))||!valid(task,model)||
        model.issue!==''||Object.keys(model.history).length!==model.history.length) return null;
    const step=task.pattern==='halves'?180:90;
    const expected=Array.from({length:task.slots},(_,i)=>i*360/task.slots);
    let {board}=initial(task,model.seed);
    let assembled=null, rejected=false;
    for (const e of model.history) {
      if (!hasExactKeys(e,['a','d','f'])||!hasExactKeys(e.d,[])) return null;
      const {a,f}=e;
      rejected=false;
      board.first[a]??=f;
      if (a==='reset'&&hasExactKeys(f,[])) {
        board={...initial(task,model.seed).board,first:board.first};
        assembled=null;
        continue;
      }
      if (!['rotate','place','unplace'].includes(a)||!hasExactKeys(f,['piece'])) return null;
      const p=board.rotations.findIndex((_,i)=>f.piece===String(i));
      if (p<0) {
        rejected=true;
        continue;
      }
      if (a==='rotate') board.rotations[p]=(board.rotations[p]+step)%360;
      if (a==='place') board.slots[p]=p;
      if (a==='unplace') {
        if (!task.decompose) return null;
        rejected=!board.assembledOnce||board.slots[p]!==p;
        if (!rejected) {
          board.slots[p]=null;
          board.separated=true;
        }
      }
      const orientations=board.slots.filter(p=>p!==null).map(p=>board.rotations[p]).sort((a,b)=>a-b);
      if (sameEvidence(expected,orientations)) {
        board.assembledOnce=true;
        assembled=[...orientations];
      }
    }
    if (rejected||!sameEvidence(board,model.board)||!assembled) return null;
    const kept=board.slots.filter(p=>p!==null);
    if (task.decompose) {
      if (!board.separated||kept.length!==task.slots-1) return null;
    } else if (!sameEvidence(kept.map(i=>board.rotations[i]).sort((a,b)=>a-b),expected)) return null;
    if (!task.questions.every((q,i)=>q.options?model.answers[i]==='seam':equal(model.answers[i],task.slots))) return null;
    return {...binding,orientations:assembled,remainingPieces:kept.length,pattern:task.pattern};
  } catch {
    return null;
  }
}

export function submittedP092TPieceAssemblyEvidence(task,model,record,context) {
  return latestSubmissionMatches(model,record)?replayP092TPieceAssemblyEvidence(task,model,context):null;
}
