import {equationEqual, initial, valid} from './phase5/b35-model.js';
import {equal, rational} from './phase5/b16-model.js';
import {hasExactKeys, latestSubmissionMatches, matchesNativeEvidenceTask} from './evidence-contract.js';


export const P111T_SOURCES = Object.freeze([
  {
    "sessionId": "missing35",
    "index": 2,
    "nodeId": "mt_ezc2m_0dzN",
    "type": "x-a35-try",
    "taskHash": "669f0b19897be5ea7bd067cd475845030a8c6469bda60c9237e8a30fb37c092b"
  },
  {
    "sessionId": "twostep35",
    "index": 1,
    "nodeId": "mt_anAe11HAEH",
    "type": "x-a35-try",
    "taskHash": "cc3a722fb8728c8f575d6aac86dfe653ee90dc1f41f0e03bf11ff89c76a268da"
  },
  {
    "sessionId": "notation35",
    "index": 2,
    "nodeId": "mt_KwdjWEmMNo",
    "type": "x-a35-try",
    "taskHash": "c9c5249b019e5be914e4823bc751a55c889c541c7c67de46c1f49ea0bb71fe3d"
  },
  {
    "sessionId": "model35",
    "index": 2,
    "nodeId": "mt_z5iwdZyeDr",
    "type": "x-a35-try",
    "taskHash": "3868de475ce844d0d461d277f02faf912489681cf25f9e0f2969a6f75d18a172"
  },
  {
    "sessionId": "nth35",
    "index": 1,
    "nodeId": "mt_HRKzwEQJgO",
    "type": "x-a35-try",
    "taskHash": "39a841211cf16a069676e5cec8d53831b5d9f8d33dbe174d494cd8a5d58fec2e"
  }
].map(Object.freeze));

export function p111tAlgebraTrialsBinding(task,context) {
  const row=P111T_SOURCES.find(source=>source.sessionId===context?.sessionId&&source.index===context?.index);
  if (!row||!matchesNativeEvidenceTask(task,context,row)) return null;
  return {nodeId:row.nodeId,kind:'p111t-algebra-trials',method:null,question:'把试的数代回去，等式两边各是多少？'};
}

function exact(raw,n,d) {
  const pair=rational(raw);
  return Boolean(pair && BigInt(pair[0])*d===BigInt(pair[1])*n);
}

function answersMatch(task,context,answers,hasTen) {
  const x=task.solution;
  switch (context.sessionId) {
  case 'missing35': return answers[0].trim()==='same';
  case 'twostep35': {
    const testValue=task.a*10+task.b;
    return hasTen&&equationEqual(answers[0],[`${task.a}x+${task.b}`,String(task.right)])&&
      equal(answers[1],testValue)&&testValue>task.right&&answers[2].trim()==='larger';
  }
  case 'notation35':
    return equal(answers[0],task.a*x)&&equal(answers[1],x*x)&&equal(answers[2],x,2);
  case 'model35': return equal(answers[0],task.a*x+task.b);
  case 'nth35': return x>0 && Number.isInteger(x);
  default: return false;
  }
}

export function replayP111TAlgebraTrialsEvidence(task,model,context) {
  try {
    const binding=p111tAlgebraTrialsBinding(task,context);
    if (!binding||!hasExactKeys(model,Object.keys(initial(task)))||!valid(task,model)||
        model.issue!==''||Object.keys(model.history).length!==model.history.length) return null;
    let trialIndex=0;
    let last=null;
    let hasTen=false;
    for (const event of model.history) {
      if (!hasExactKeys(event,['a','i','v','w','z','k'])||event.a!=='try'||event.i!=='') return null;
      const pair=rational(event.v);
      if (!pair||trialIndex>=40) continue;
      const [n,d]=pair.map(BigInt);
      const left=BigInt(task.a)*n+BigInt(task.b)*d;
      const right=BigInt(task.right)*d;
      const stored=model.board.trials[trialIndex++];
      if (!hasExactKeys(stored,['x','left','right','equal'])||!exact(stored.x,n,d)||
          !exact(stored.left,left,d)||!exact(stored.right,right,d)||stored.equal!==(left===right)) return null;
      if (n===10n*d) hasTen=true;
      last=stored;
    }
    if (!last?.equal||trialIndex!==model.board.trials.length||
        !equal(last.x,task.solution)||!equal(model.value,task.solution)||
        !answersMatch(task,context,model.answers,hasTen)) return null;
    return {...binding,trial:{...last}};
  } catch {
    return null;
  }
}

export function submittedP111TAlgebraTrialsEvidence(task,model,record,context) {
  return latestSubmissionMatches(model,record)?replayP111TAlgebraTrialsEvidence(task,model,context):null;
}
