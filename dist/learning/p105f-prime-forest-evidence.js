import {gcd,initial,isPrime,leaves,number,primeExpression,valid} from './phase5/b14-model.js';
import {hasExactKeys,latestSubmissionMatches,matchesNativeEvidenceTask,sameEvidence} from './evidence-contract.js';

export const P105F_SOURCES=Object.freeze([
  {
    "sessionId": "primeforest",
    "index": 0,
    "nodeId": "mt_xhoOWnhtHq",
    "type": "x-factorforest",
    "taskHash": "326da521788da4dfe125e17792594d55d078d9951820abe672b2039d2f14fdf0"
  },
  {
    "sessionId": "primeforest",
    "index": 1,
    "nodeId": "mt_xhoOWnhtHq",
    "type": "x-factorforest",
    "taskHash": "032d0b96e9d44c88c597b7a4455dfc1c73c581ef1ec6a2cf73de5f8eb4b33afb"
  },
  {
    "sessionId": "primeforest",
    "index": 2,
    "nodeId": "mt_xhoOWnhtHq",
    "type": "x-factorforest",
    "taskHash": "559c007cb78d9200f45d26936a901e2e5498df6a3e4805ffe3ed9e61fa4e42c2"
  },
  {
    "sessionId": "primeforest",
    "index": 3,
    "nodeId": "mt_xhoOWnhtHq",
    "type": "x-factorforest",
    "taskHash": "d410f55f5cf01bc9da789deb59477793e63ff81863655d35831fe2c12cab8917"
  }
].map(Object.freeze));

const ordered=numbers=>[...numbers].sort((a,b)=>a-b);
const product=numbers=>numbers.reduce((a,b)=>a*b,1);
const primeLeaves=board=>leaves(board).every(node=>isPrime(node.value));

export function p105fPrimeForestBinding(task,context) {
  const row=P105F_SOURCES.find(s=>s.sessionId===context?.sessionId&&s.index===context?.index);
  if (!row||!matchesNativeEvidenceTask(task,context,row)) return null;
  return {nodeId:row.nodeId,kind:'p105f-prime-forest',method:null,
    question:'拆到质数后，每个质数有几份？双方各用几份？'};
}

export function replayP105FPrimeForestEvidence(task,model,context) {
  try {
    const binding=p105fPrimeForestBinding(task,context);
    if (!binding||!hasExactKeys(model,Object.keys(initial(task)))||!valid(task,model)||
        model.issue!==''||Object.keys(model.history).length!==model.history.length) return null;
    let {board}=initial(task);
    let rejected=false;
    for (const {action,data} of model.history) {
      const {side,index,value,fields}=data;
      if (side!==null||value!==null) return null;
      rejected=false;
      if (action==='b14-reset'&&index===null) {
        board=initial(task).board;
      } else if (action==='b14-leaf'&&leaves(board).some(node=>node.id===index)) {
        board.selected=index;
      } else if (action==='b14-split'&&index===null&&board.selected!==null) {
        const node=board.nodes[board.selected], a=number(fields.left), b=number(fields.right);
        rejected=!Number.isInteger(a)||!Number.isInteger(b)||a<2||b<2||a*b!==node.value;
        if (!rejected) {
          const i=board.nodes.length;
          node.children=[i,i+1];
          board.nodes.push(...[a,b].map((size,offset)=>({
            id:i+offset,parent:node.id,root:node.root,value:size,children:[],
          })));
          board.selected=null;
          board.matches=[];
          board.pair=[];
        }
      } else if (action==='b14-match'&&task.common&&index!==null) {
        const node=leaves(board).find(item=>item.id===index);
        if (!node||!isPrime(node.value)||board.matches.flat().includes(index)) {
          rejected=true;
        } else if (!board.pair.length) {
          board.pair=[index];
        } else {
          const other=board.nodes[board.pair[0]];
          rejected=other.root===node.root||other.value!==node.value;
          if (!rejected) board.matches.push([other.id,index]);
          board.pair=[];
        }
      } else if (action==='b14-tree-save'&&task.twice&&index===null) {
        rejected=Boolean(board.first)||!primeLeaves(board)||!primeExpression(fields.expression,task.ns[0]);
        if (!rejected) {
          const first={nodes:board.nodes,expression:fields.expression};
          board={...initial(task).board,first};
        }
      } else return null;
    }
    const [a,b]=task.ns;
    if (rejected||!sameEvidence(board,model.board)||!primeLeaves(board)||
        !primeExpression(model.expression,a)||(a===360&&!/[\^²³]/.test(model.expression))) return null;
    const primeFactors=task.ns.map((n,i)=>ordered(leaves(board).filter(node=>node.root===i).map(node=>node.value)));
    if (!primeFactors.every((f,i)=>product(f)===task.ns[i])) return null;
    let common=null;
    if (task.common) {
      const shared=board.matches.map(([id])=>board.nodes[id].value);
      const hcf=gcd(a,b), lcm=a/hcf*b;
      if (board.pair.length||product(shared)!==hcf||number(model.hcf)!==hcf||
          number(model.lcm)!==lcm||!primeExpression(model.equation,b)) return null;
      common={shared:ordered(shared),hcf,lcm};
    }
    let firstCut=null;
    if (task.twice) {
      if (!board.first) return null;
      const cut=nodes=>ordered(nodes[0].children.map(i=>nodes[i].value));
      firstCut=cut(board.first.nodes);
      if (sameEvidence(firstCut,cut(board.nodes))||
          !sameEvidence(ordered(leaves(board.first).map(node=>node.value)),primeFactors[0])) return null;
    }
    return {...binding,primeFactors,common,firstCut};
  } catch {
    return null;
  }
}

export function submittedP105FPrimeForestEvidence(task,model,record,context) {
  return latestSubmissionMatches(model,record)?replayP105FPrimeForestEvidence(task,model,context):null;
}
