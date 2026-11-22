import {initial,valid} from './phase5/b09-model.js';
import {equal,parse} from './phase5/b09-math.js';
import {hasExactKeys,latestSubmissionMatches,matchesNativeEvidenceTask,sameEvidence} from './evidence-contract.js';

export const P097C_SOURCES=Object.freeze([
  {
    "sessionId": "powerblocks",
    "index": 4,
    "nodeId": "mt_hCVPYlF-7Y",
    "type": "x-powerchain",
    "taskHash": "995681037a87078aef27e5bfc967fd74d1d55dfaf52ff7c8092453d6b854478c"
  },
  {
    "sessionId": "powerblocks",
    "index": 5,
    "nodeId": "mt_hCVPYlF-7Y",
    "type": "x-powerchain",
    "taskHash": "1b75b1b2adc9070279892408f9a437d429a657083604205b22617d77054600bf"
  },
  {
    "sessionId": "powerblocks",
    "index": 6,
    "nodeId": "mt_hCVPYlF-7Y",
    "type": "x-powerchain",
    "taskHash": "5b90691d38a7ef2e1a3a703ff1107d4d885c34d138636fe219f10edefa6bbf70"
  },
  {
    "sessionId": "powerblocks",
    "index": 7,
    "nodeId": "mt_hCVPYlF-7Y",
    "type": "x-powerchain",
    "taskHash": "b1f897357d7c6736c63897fa94c6fba4e7cccc9fb810cbc4c44ab6573a3809e4"
  }
].map(Object.freeze));

export function p097cPowerChainBinding(task,context) {
  const row=P097C_SOURCES.find(s=>s.sessionId===context?.sessionId&&s.index===context?.index);
  if (!row||!matchesNativeEvidenceTask(task,context,row)) return null;
  return {nodeId:row.nodeId,kind:'p097c-power-chain',method:null,
    question:'从 1 开始，每一步都乘几？最后还有加法要算吗？'};
}

export function replayP097CPowerChainEvidence(task,model,context) {
  try {
    const binding=p097cPowerChainBinding(task,context);
    if (!binding||!hasExactKeys(model,Object.keys(initial(task)))||!valid(task,model)||
        Object.keys(model.history).length!==model.history.length) return null;
    let product=1;
    const products=Array.from({length:task.count},()=>product*=task.base);
    const total=product+(task.add||0);
    if (!sameEvidence(products,model.products)||model.added!==Boolean(task.add)||
        !equal(parse(model.answer),[total,1])) return null;
    // Undo leaves no entry. A retained prefix can survive any intervening push
    // until the stack is full. Require the entire chain in the saved journal.
    let prefix=0;
    for (const value of model.history.slice(0,-1)) {
      if (prefix<products.length-1&&value===products[prefix]) prefix++;
    }
    if (prefix!==products.length-1||model.history.at(-1)!==product) return null;
    return {...binding,base:task.base,products,addend:task.add||0,total};
  } catch {
    return null;
  }
}

export function submittedP097CPowerChainEvidence(task,model,record,context) {
  return latestSubmissionMatches(model,record)?replayP097CPowerChainEvidence(task,model,context):null;
}
