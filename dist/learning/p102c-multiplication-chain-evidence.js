import {initial, number, valid} from './phase5/b13-model.js';
import {hasExactKeys, latestSubmissionMatches, matchesNativeEvidenceTask, sameEvidence} from './evidence-contract.js';

export const P102C_SOURCES = Object.freeze([
  {
    "sessionId": "factorpairs",
    "index": 2,
    "nodeId": "mt_nZkL5-XjRX",
    "type": "x-mulchain",
    "taskHash": "29f7ed332f4176a7dd57e434add18d4bd967d3407b0c3d9f3befefc42b8d326a"
  },
  {
    "sessionId": "mentalproducts",
    "index": 4,
    "nodeId": "mt_pjfmCMMPjO",
    "type": "x-mulchain",
    "taskHash": "13940b8e20c76dd506a11f1e9b1bdd38edb35f3adcdd06d25b574d6c1aeedd33"
  },
  {
    "sessionId": "productways",
    "index": 2,
    "nodeId": "mt_Lb2ZnMdkYR",
    "type": "x-mulchain",
    "taskHash": "6bb052a024060d23e39637c05a490bac35b27caad2d7464cac89f5d614d67bdc"
  }
].map(Object.freeze));

export function p102cMultiplicationChainBinding(task, context) {
  const source = P102C_SOURCES.find(row => row.sessionId === context?.sessionId && row.index === context?.index);
  if (!source || !matchesNativeEvidenceTask(task,context,source)) return null;
  return {nodeId:source.nodeId,kind:'p102c-multiplication-chain',method:null,question:'先合并哪两个因数？怎样保证第三个没有漏掉？'};
}

export function replayP102CMultiplicationChainEvidence(task, model, context) {
  try {
    const binding = p102cMultiplicationChainBinding(task,context);
    if (!binding || !hasExactKeys(model,Object.keys(initial(task))) || !valid(task,model) ||
        model.issue !== '' || Object.keys(model.history).length !== model.history.length) return null;
    const original = task.values.map((value,index) => ({ids:[index],value}));
    let groups = original;
    let selected = [];
    let merges = [];
    for (const {action,data} of model.history) {
      if (data.bucket !== null || data.token !== null) return null;
      if (action === 'b13-chain-pick') {
        const i = data.index;
        if (!Number.isInteger(i) || i < 0 || i >= groups.length || groups.length < 2) return null;
        if (selected.includes(i)) selected = selected.filter(index => index !== i);
        else if (selected.length < 2) selected.push(i);
        continue;
      }
      if (data.index !== null) return null;
      if (action === 'b13-reset') {
        groups = original;
        selected = [];
        merges = [];
      } else if (action === 'b13-chain-undo') {
        if (merges.length) {
          groups = merges.pop().before;
          selected = [];
        }
      } else if (action === 'b13-chain-merge') {
        if (selected.length !== 2) continue;
        const [i,j] = selected;
        const left = groups[i];
        const right = groups[j];
        const value = left.value * right.value;
        if (number(data.result) !== value) continue;
        merges.push({before:groups,left,right,result:data.result});
        groups = [...groups.filter((_,index) => index !== i && index !== j),{ids:[...left.ids,...right.ids],value}];
        selected = [];
      } else {
        return null;
      }
    }
    if (!sameEvidence({groups,selected,merges},model.board) || groups.length !== 1 ||
        !sameEvidence([...groups[0].ids].sort((a,b)=>a-b),original.map((_,i)=>i)) ||
        number(model.answer) !== groups[0].value) return null;
    return {...binding,products:merges.map(({left,right})=>left.value*right.value)};
  } catch {
    return null;
  }
}

export function submittedP102CMultiplicationChainEvidence(task, model, record, context) {
  return latestSubmissionMatches(model,record) ? replayP102CMultiplicationChainEvidence(task,model,context) : null;
}
