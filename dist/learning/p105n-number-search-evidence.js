import {factors,initial,isPrime,number,requiredTests,valid} from './phase5/b14-model.js';
import {hasExactKeys,latestSubmissionMatches,matchesNativeEvidenceTask,sameEvidence} from './evidence-contract.js';

export const P105N_SOURCES=Object.freeze([
  {
    "sessionId": "factorlab",
    "index": 1,
    "nodeId": "mt_FHIAv6dfhU",
    "type": "x-numbersearch",
    "taskHash": "1059544ba30ec89c353645515c8fd54552ceccb0faf812265188c804efe9ebd8"
  },
  {
    "sessionId": "factorlab",
    "index": 2,
    "nodeId": "mt_FHIAv6dfhU",
    "type": "x-numbersearch",
    "taskHash": "e5f3772c2487d4cfb59358741b66387335378400a6f665401779a74fceaa5bfb"
  },
  {
    "sessionId": "factorlab",
    "index": 3,
    "nodeId": "mt_FHIAv6dfhU",
    "type": "x-numbersearch",
    "taskHash": "cc13d1d2080f9219f621c0bf8ca7e6a2058661f9aee784d09b0dfaedb59a455c"
  },
  {
    "sessionId": "factorlab",
    "index": 4,
    "nodeId": "mt_FHIAv6dfhU",
    "type": "x-numbersearch",
    "taskHash": "e4a4001b24868e59ca72d6fea3a12e22c7f5ac7d36fb04f0aa2477840a629144"
  },
  {
    "sessionId": "factorlab",
    "index": 5,
    "nodeId": "mt_FHIAv6dfhU",
    "type": "x-numbersearch",
    "taskHash": "4526b0722685c5892f349f5f9b9381a888ce5a78cae28a287cbb8e00f755135f"
  },
  {
    "sessionId": "factoruse",
    "index": 0,
    "nodeId": "mt_0Wg5F97osg",
    "type": "x-numbersearch",
    "taskHash": "2c1dc1f951fbda257d3d4732f963d3b0f6779fcc4aaa0d4f48a4cc9119dd1e14"
  },
  {
    "sessionId": "factoruse",
    "index": 1,
    "nodeId": "mt_0Wg5F97osg",
    "type": "x-numbersearch",
    "taskHash": "433a0b699133acce99150cd7b6f1b8b1e4a1bafffb62d5ee9a816f735c3a3b22"
  },
  {
    "sessionId": "factoruse",
    "index": 2,
    "nodeId": "mt_0Wg5F97osg",
    "type": "x-numbersearch",
    "taskHash": "b2cf5e6017938716085388effdc6bab66bbacfa0c4692b8a0ad826dced05b308"
  },
  {
    "sessionId": "primetest",
    "index": 3,
    "nodeId": "mt_y1XCVsIelg",
    "type": "x-numbersearch",
    "taskHash": "34955aa89254a8d5ea7e3e6afcb040e58fed2a9728fc03aa0883c622baaca85e"
  },
  {
    "sessionId": "squarecube",
    "index": 2,
    "nodeId": "mt_gxCIASSezX",
    "type": "x-numbersearch",
    "taskHash": "2d51e87b365d04a58e006687e47fade6b22054b9790debd46864fe193e675ca0"
  },
  {
    "sessionId": "term38",
    "index": 1,
    "nodeId": "mt_xfwv0M83mJ",
    "type": "x-numbersearch",
    "taskHash": "1059544ba30ec89c353645515c8fd54552ceccb0faf812265188c804efe9ebd8"
  }
].map(Object.freeze));

export function p105nNumberSearchBinding(task,context) {
  const row=P105N_SOURCES.find(s=>s.sessionId===context?.sessionId&&s.index===context?.index);
  if (!row||!matchesNativeEvidenceTask(task,context,row)) return null;
  return {nodeId:row.nodeId,kind:'p105n-number-search',method:null,
    question:'你怎样知道留在表里的数都符合条件，范围内也没有漏掉？'};
}

const listMode=t=>t.mode==='multiples'||t.mode==='squares';
const testMode=t=>['prime','commonFactors','divisible'].includes(t.mode);

function availableSelections(task,board) {
  if (task.mode==='recallPrimes') return Array.from({length:task.ns[0]},(_,i)=>i+1);
  if (task.mode==='multiples'&&task.ns.length===2) return board.lists.flat();
  if (task.mode==='commonFactors') return board.tests.flatMap((lane,i)=>
    lane.filter(test=>test.r===0).flatMap(test=>[test.d,task.ns[i]/test.d]));
  return [];
}

function laneSize(task,n) {
  return task.limit ? Math.floor(task.limit/n) : task.count;
}

export function replayP105NNumberSearchEvidence(task,model,context) {
  try {
    const binding=p105nNumberSearchBinding(task,context);
    if (!binding||!hasExactKeys(model,Object.keys(initial(task)))||!valid(task,model)||
        model.issue!==''||Object.keys(model.history).length!==model.history.length) return null;
    let {board}=initial(task);
    let rejected=false;
    for (const {action,data} of model.history) {
      const {fields,index,side,value}=data;
      rejected=false;
      if (index!==null) return null;
      if (action==='b14-reset'&&side===null&&value===null) {
        board=initial(task).board;
      } else if (action==='b14-test'&&value===null&&testMode(task)&&task.ns[side]!==undefined) {
        const d=number(fields.candidate), r=number(fields.remainder), lane=board.tests[side];
        rejected=!requiredTests(task,side).includes(d)||r!==task.ns[side]%d||lane.some(test=>test.d===d);
        if (!rejected) lane.push({d,r});
      } else if (action==='b14-list'&&value===null&&listMode(task)&&task.ns[side]!==undefined) {
        const lane=board.lists[side], step=lane.length+1;
        const next=task.mode==='squares'?step*step:step*task.ns[side];
        rejected=step>laneSize(task,task.ns[side])||number(fields.answer)!==next;
        if (!rejected) lane.push(next);
      } else if (action==='b14-select'&&side===null&&availableSelections(task,board).includes(value)) {
        const at=board.selected.indexOf(value);
        if (at===-1) board.selected.push(value);
        else board.selected.splice(at,1);
      } else return null;
    }
    if (rejected||!sameEvidence(board,model.board)) return null;
    if (testMode(task)&&!board.tests.every((lane,i)=>lane.length===requiredTests(task,i).length)) return null;
    if (listMode(task)&&!board.lists.every((lane,i)=>lane.length===laneSize(task,task.ns[i]))) return null;
    const [n,m]=task.ns;
    let classification=null, selected=[];
    if (task.mode==='prime') classification=isPrime(n)?'prime':n===1?'neither':'composite';
    if (task.mode==='divisible') classification=n%task.by===0?'yes':'no';
    if (task.mode==='commonFactors') selected=factors(n).filter(d=>m%d===0);
    if (task.mode==='multiples'&&m!==undefined) selected=board.lists[0].filter(v=>v%m===0).slice(0,task.count);
    if (task.mode==='recallPrimes') selected=availableSelections(task,board).filter(isPrime);
    if ((classification!==null&&model.answer!==classification)||
        !sameEvidence([...board.selected].sort((a,b)=>a-b),selected)) return null;
    return {...binding,mode:task.mode,classification,selected,tests:board.tests,lists:board.lists};
  } catch {
    return null;
  }
}

export function submittedP105NNumberSearchEvidence(task,model,record,context) {
  return latestSubmissionMatches(model,record)?replayP105NNumberSearchEvidence(task,model,context):null;
}
