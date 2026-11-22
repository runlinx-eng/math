import {initial,number,valid} from './phase5/b23-model.js';
import {rational} from './phase5/b16-model.js';
import {hasExactKeys,latestSubmissionMatches,matchesNativeEvidenceTask,sameEvidence} from './evidence-contract.js';

export const P101A_SOURCES=Object.freeze([
  {
    "sessionId": "sidesfold",
    "index": 1,
    "nodeId": "mt_sBcRdUfAzV",
    "type": "x-s23-symmetry",
    "taskHash": "0663a7b8366d5f9507c13778751eed40fedc9d8ba5383ac7d4aded97079ebc6e"
  },
  {
    "sessionId": "shapeaxes",
    "index": 0,
    "nodeId": "mt_hRZyKvz1KN",
    "type": "x-s23-symmetry",
    "taskHash": "7f7826e579de7751b92858c16f2cdf5cb7dabee7be17aaf599788d4e693d13bb"
  },
  {
    "sessionId": "shapeaxes",
    "index": 1,
    "nodeId": "mt_hRZyKvz1KN",
    "type": "x-s23-symmetry",
    "taskHash": "13e6024f703f11632dea0ce3de77c22465fc583efecaad223bed91d34098dff0"
  },
  {
    "sessionId": "shapeaxes",
    "index": 2,
    "nodeId": "mt_hRZyKvz1KN",
    "type": "x-s23-symmetry",
    "taskHash": "b6fe903511b28ad38f4723e4a25ec650c1710e27b1b6d98751c8a93bc418f045"
  },
  {
    "sessionId": "shapeaxes",
    "index": 3,
    "nodeId": "mt_hRZyKvz1KN",
    "type": "x-s23-symmetry",
    "taskHash": "662e3cb60d463c26ad8a712bd592394e41ad19fac97b9cc67aa6c1973f1e5d14"
  },
  {
    "sessionId": "shapeaxes",
    "index": 4,
    "nodeId": "mt_hRZyKvz1KN",
    "type": "x-s23-symmetry",
    "taskHash": "d5cde1835b557739d2d03ade17948dc6493a4e58cc0b278dfa5717aa8509c073"
  },
  {
    "sessionId": "shapeaxes",
    "index": 5,
    "nodeId": "mt_hRZyKvz1KN",
    "type": "x-s23-symmetry",
    "taskHash": "b82fe006b52eb48dfcd7519fd42340c4078ce77e6086f3a6683af6a0df66e102"
  },
  {
    "sessionId": "shapeaxes",
    "index": 6,
    "nodeId": "mt_hRZyKvz1KN",
    "type": "x-s23-symmetry",
    "taskHash": "ddc7dea76eb327490f6f4ecb4a6b57e9d553d94e9dcd094d3baf0aea6c98f098"
  },
  {
    "sessionId": "geometrynotation",
    "index": 1,
    "nodeId": "mt_WtIFJSCQIT",
    "type": "x-s23-symmetry",
    "taskHash": "af207f5cb81ffdd295365845ad6e09086149d689823007ce4b5c70564a430e4b"
  }
].map(Object.freeze));

const unturnedAxes={
  rectangle:[0,90],square:[0,45,90,135],equilateral:[30,90,150],
  hexagon:[0,30,60,90,120,150],isosceles:[90],triangle:[],
};
const canonical=degrees=>((degrees%180)+180)%180;

export function p101aReflectionAxesBinding(task,context) {
  const row=P101A_SOURCES.find(s=>s.sessionId===context?.sessionId&&s.index===context?.index);
  if (!row||!matchesNativeEvidenceTask(task,context,row)) return null;
  return {nodeId:row.nodeId,kind:'p101a-reflection-axes',method:null,
    question:'沿哪些线反射以后，整个图形会和原图完全重合？'};
}

export function replayP101AReflectionAxesEvidence(task,model,context) {
  try {
    const binding=p101aReflectionAxesBinding(task,context);
    if (!binding||!hasExactKeys(model,Object.keys(initial(task,1)))||!valid(task,model)||
        model.issue!==''||Object.keys(model.history).length!==model.history.length) return null;
    const angles=unturnedAxes[task.shape].map(a=>canonical(a+task.rotation));
    const target=task.candidates.flatMap((angle,i)=>angles.includes(canonical(angle))?[i]:[]);
    let {board}=initial(task,model.seed);
    for (const e of model.history) {
      if (!hasExactKeys(e,['a','f','d'])||!hasExactKeys(e.f,[])) return null;
      const {a,d}=e;
      board.first[a]??={};
      if ((a==='test'||a==='mark')&&hasExactKeys(d,['index'])) {
        const i=task.candidates.findIndex((_,index)=>String(index)===d.index);
        if (i<0) return null;
        if (a==='test') {
          if (!board.tested.includes(i)) board.tested.push(i);
          board.last=i;
        } else {
          if (!board.tested.length) return null;
          const at=board.marked.indexOf(i);
          if (at===-1) board.marked.push(i);
          else board.marked.splice(at,1);
          board.none=false;
        }
      } else if (hasExactKeys(d,[])) {
        if (a==='reset') board={...initial(task,model.seed).board,first:board.first};
        else if (a==='turn'&&task.turn) board.turns++;
        else if (a==='none'&&board.tested.length) {
          board.none=!board.none;
          board.marked=[];
        } else return null;
      } else return null;
    }
    if (!sameEvidence(board,model.board)||board.tested.length!==task.candidates.length||
        !sameEvidence([...board.marked].sort((a,b)=>a-b),target)||
        board.none!==(target.length===0)||(task.turn&&!board.turns)) return null;
    const minimumTurn=task.turn?360/6:null;
    if (!task.questions.every((q,i)=>{
      const input=model.answers[i];
      if (q.options) return input==='match';
      const wanted=q.label.includes('最小正转')?minimumTurn:target.length;
      const pair=rational(input);
      return Number.isFinite(number(input))&&pair!==null&&BigInt(pair[0])===BigInt(wanted)*BigInt(pair[1]);
    })) return null;
    return {...binding,axes:target.map(i=>task.candidates[i]),tested:board.tested.length,minimumTurn};
  } catch {
    return null;
  }
}

export function submittedP101AReflectionAxesEvidence(task,model,record,context) {
  return latestSubmissionMatches(model,record)?replayP101AReflectionAxesEvidence(task,model,context):null;
}
