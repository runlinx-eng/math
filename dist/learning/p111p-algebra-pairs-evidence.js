import {polyEqual, initial, valid} from './phase5/b35-model.js';
import {equal} from './phase5/b16-model.js';
import {hasExactKeys, latestSubmissionMatches, matchesNativeEvidenceTask, sameEvidence} from './evidence-contract.js';


export const P111P_SOURCES = Object.freeze([
  {
    "sessionId": "twounknown35",
    "index": 0,
    "nodeId": "mt_YFS7JFk64p",
    "type": "x-a35-pairs",
    "taskHash": "7c26a589c20c382e05faf607a263d99576d27308e049f217ed1cbf2b5e653dfd"
  },
  {
    "sessionId": "twounknown35",
    "index": 1,
    "nodeId": "mt_YFS7JFk64p",
    "type": "x-a35-pairs",
    "taskHash": "c10c796846ecf136bd926bd5b24697a96be5d24817bf4ff8e343624bd156f880"
  },
  {
    "sessionId": "twounknown35",
    "index": 2,
    "nodeId": "mt_YFS7JFk64p",
    "type": "x-a35-pairs",
    "taskHash": "adf4f8293dd6ea7a022f7b22fdf4467aa7f0d3b6085a43364c195419651e3b6b"
  },
  {
    "sessionId": "model35",
    "index": 0,
    "nodeId": "mt_z5iwdZyeDr",
    "type": "x-a35-pairs",
    "taskHash": "f1c54ea0b7c257c309dc13a0db0be77706c38531cd3392b725e4fe232cf74b93"
  }
].map(Object.freeze));

export function p111pAlgebraPairsBinding(task,context) {
  const row=P111P_SOURCES.find(source=>source.sessionId===context?.sessionId&&source.index===context?.index);
  if (!row||!matchesNativeEvidenceTask(task,context,row)) return null;
  return {nodeId:row.nodeId,kind:'p111p-algebra-pairs',method:null,question:'给定一个数，怎样找到和它配对的另一个数？'};
}

export function replayP111PAlgebraPairsEvidence(task,model,context) {
  try {
    const binding=p111pAlgebraPairsBinding(task,context);
    if (!binding||!hasExactKeys(model,Object.keys(initial(task)))||!valid(task,model)||
        model.issue!==''||Object.keys(model.history).length!==model.history.length) return null;
    const pairs=[];
    const seen=new Set();
    for (const event of model.history) {
      if (!hasExactKeys(event,['a','i','v','w','z','k'])||event.a!=='pair'||event.i!=='') return null;
      if (![event.v,event.w].every(raw=>/^[-+]?\d+$/.test(raw.trim()))) continue;
      const x=Number(event.v);
      const y=Number(event.w);
      if (!task.xs.includes(x)||!Number.isSafeInteger(y)||task.ax*x+task.ay*y!==task.total||seen.has(x)) continue;
      pairs.push([x,y]);
      seen.add(x);
    }
    if (pairs.length<task.need||(task.all&&!task.xs.every(x=>seen.has(x)))||!sameEvidence(pairs,model.board.pairs)) return null;
    const answer=model.answers[0];
    if (context.sessionId==='model35') {
      if (!polyEqual(answer,`${-task.ax/task.ay}x+${task.total/task.ay}`,{simplified:true})) return null;
    } else if (task.all ? !equal(answer,task.xs.length) : (seen.size<2||answer.trim()!=='many')) {
      return null;
    }
    return {...binding,pairs};
  } catch {
    return null;
  }
}

export function submittedP111PAlgebraPairsEvidence(task,model,record,context) {
  return latestSubmissionMatches(model,record)?replayP111PAlgebraPairsEvidence(task,model,context):null;
}
