import {initial, valid} from './phase5/b07-model.js';
import {hasExactKeys, latestSubmissionMatches, matchesNativeEvidenceTask, sameEvidence} from './evidence-contract.js';


export const P113S_SOURCES = Object.freeze([
  {
    "sessionId": "shift10",
    "index": 0,
    "nodeId": "mt_kw7xmp68rU",
    "type": "x-pvshift",
    "taskHash": "a0bfe750d6e635f194e00d80d3b7de61482c1558dad3a1a7a3c816e03ea2af4c"
  },
  {
    "sessionId": "shift10",
    "index": 1,
    "nodeId": "mt_kw7xmp68rU",
    "type": "x-pvshift",
    "taskHash": "b7778525c8f055a3a9c84ba906bc80ee56cab3bb5ec905160baaff49b764313b"
  },
  {
    "sessionId": "shift10",
    "index": 2,
    "nodeId": "mt_kw7xmp68rU",
    "type": "x-pvshift",
    "taskHash": "e301a9ecaec55c05728f9a7c45855e538cce7ee07e1074b7058ed090905bf1f4"
  },
  {
    "sessionId": "shift10",
    "index": 3,
    "nodeId": "mt_kw7xmp68rU",
    "type": "x-pvshift",
    "taskHash": "1ce037951f0c9911dfb2b68f8304ca7c8a2416188c3f329a440be02037f16bac"
  },
  {
    "sessionId": "twoproblems",
    "index": 0,
    "nodeId": "mt_kJGCjnuelW",
    "type": "x-pvshift",
    "taskHash": "66417539a37a5bdf5d2b5bfb584643dfd1921136576d971261c3b496b5c9e0a5"
  },
  {
    "sessionId": "twoproblems",
    "index": 1,
    "nodeId": "mt_kJGCjnuelW",
    "type": "x-pvshift",
    "taskHash": "fb221d652d4d79115b3ec2a4536965f35a4820134d1f52e6a377db0b4bf9b15e"
  },
  {
    "sessionId": "shift100",
    "index": 0,
    "nodeId": "mt_izien3ZX51",
    "type": "x-pvshift",
    "taskHash": "5e335d920e302127b52d6d760169ba8ecd47d3563fe14690ebc936ab4711abc1"
  },
  {
    "sessionId": "shift100",
    "index": 1,
    "nodeId": "mt_izien3ZX51",
    "type": "x-pvshift",
    "taskHash": "db0349aeb7c806409d06991bc1371d2958e9e50ca540038c04b23d4323ae95b0"
  },
  {
    "sessionId": "shift100",
    "index": 2,
    "nodeId": "mt_izien3ZX51",
    "type": "x-pvshift",
    "taskHash": "0f3218350a5c5a0e3a4211d88095966b905cbf7137bf6d08e257174748b17a7b"
  },
  {
    "sessionId": "shift100",
    "index": 3,
    "nodeId": "mt_izien3ZX51",
    "type": "x-pvshift",
    "taskHash": "b310eb3ab48ff4ba6b9d48f820187e49cab9368898ff9377db0a1b560ba6bc68"
  },
  {
    "sessionId": "shift100",
    "index": 4,
    "nodeId": "mt_izien3ZX51",
    "type": "x-pvshift",
    "taskHash": "daa00e2fc926348d5ddac163f6155ae229013f28aef540393c7e63509e1460dd"
  },
  {
    "sessionId": "shift100",
    "index": 5,
    "nodeId": "mt_izien3ZX51",
    "type": "x-pvshift",
    "taskHash": "78d39bf0fa53fabe84740da6463f2f2073f9d0e912f57ab48c1343d1800cfdbd"
  },
  {
    "sessionId": "structure34",
    "index": 0,
    "nodeId": "mt_FAXjFkgG6X",
    "type": "x-pvshift",
    "taskHash": "0f3218350a5c5a0e3a4211d88095966b905cbf7137bf6d08e257174748b17a7b"
  }
].map(Object.freeze));

export function p113sPlaceValueShiftsBinding(task,context) {
  const row=P113S_SOURCES.find(source=>source.sessionId===context?.sessionId&&source.index===context?.index);
  if (!row||!matchesNativeEvidenceTask(task,context,row)) return null;
  return {nodeId:row.nodeId,kind:'p113s-place-value-shifts',method:null,question:'添取改变了多少？换捆时为什么总量保持不变？'};
}

const exchanges={up1:[0,1,-10,0],down1:[0,-1,10,0],up10:[1,-10,0,0],down10:[-1,10,0,0]};
const plus=(a,b)=>a.map((value,i)=>value+b[i]);
const prefix=vectors=>vectors.reduce((heads,v)=>(heads.push(plus(heads.at(-1),v)),heads),[[0,0,0,0]]);
const canonical=n=>n===1000?[0,0,0,1]:[Math.floor(n/100),Math.floor(n/10)%10,n%10,0];

function feasibleInterleaving(start,moves,swaps) {
  // Each prefix pair determines the same unit counts for every possible interleaving.
  const grid=Array.from({length:moves.length},()=>Array(swaps.length).fill(false));
  for (const [i,moved] of moves.entries()) {
    for (const [j,swapped] of swaps.entries()) {
      if ((i||j)&&!grid[i-1]?.[j]&&!grid[i][j-1]) continue;
      const [h,t,o,k]=plus(start,plus(moved,swapped));
      grid[i][j]=[h,t,o,k].every(x=>x>=0)&&h<=10&&t<=100&&o<=100&&k<=1&&100*h+10*t+o+1000*k<=1000;
    }
  }
  return grid.at(-1).at(-1);
}

export function replayP113SPlaceValueShiftsEvidence(task,model,context) {
  try {
    const binding=p113sPlaceValueShiftsBinding(task,context);
    if (!binding||!hasExactKeys(model,Object.keys(initial(task)))||!valid(task,model)||
        model.committed===null||!model.moves.length||Object.keys(model.moves).length!==model.moves.length||
        Object.keys(model.history).length!==model.history.length||
        !model.history.every(key=>Object.hasOwn(exchanges,key))) return null;
    const end=task.start+task.delta;
    if (model.moves.reduce((a,b)=>a+b,0)!==task.delta||model.answer!==end||
        !sameEvidence(model.u,canonical(end))) return null;
    const changed=['h','t','o'].filter((_,i)=>canonical(task.start)[i]!==model.u[i]).join('');
    if (model.changed!==changed) return null;
    const moveVectors=model.moves.map(delta=>Math.abs(delta)===100?[delta/100,0,0,0]:[0,delta/10,0,0]);
    if (task.start<100&&model.moves.some(delta=>Math.abs(delta)===100)) return null;
    const moved=prefix(moveVectors);
    const swapped=prefix(model.history.map(key=>exchanges[key]));
    const start=canonical(task.start);
    if (!sameEvidence(plus(start,plus(moved.at(-1),swapped.at(-1))),model.u)||
        !feasibleInterleaving(start,moved,swapped)) return null;
    let forcedOrder=null;
    if (context.sessionId==='shift100'&&[4,5].includes(context.index)) {
      const up=context.index===4;
      if (!sameEvidence(model.moves,[up?10:-10])||!sameEvidence(model.history,[up?'up10':'down10'])) return null;
      // At 190 the exchange cannot precede the move; at 300 removal cannot precede the exchange.
      forcedOrder=up?['move','exchange']:['exchange','move'];
    }
    return {...binding,netChange:task.delta,moves:[...model.moves],exchanges:[...model.history],forcedOrder};
  } catch {
    return null;
  }
}

export function submittedP113SPlaceValueShiftsEvidence(task,model,record,context) {
  return latestSubmissionMatches(model,record)?replayP113SPlaceValueShiftsEvidence(task,model,context):null;
}
