import {initial, valid} from './phase5/b34-model.js';
import {equal} from './phase5/b16-model.js';
import {hasExactKeys, latestSubmissionMatches, matchesNativeEvidenceTask, sameEvidence} from './evidence-contract.js';

export const P103R_SOURCES = Object.freeze([
  {
    "sessionId": "repeat34",
    "index": 0,
    "nodeId": "mt_WXW0hjNhph",
    "type": "x-p34-repeat",
    "taskHash": "b9cbf0aa3ab76cb492c84e1496403a6bb5af8f4b87b850b0b55d5f6a630664af"
  },
  {
    "sessionId": "repeat34",
    "index": 1,
    "nodeId": "mt_WXW0hjNhph",
    "type": "x-p34-repeat",
    "taskHash": "022bb1420e927a5abd7f1da9c51aeaca31e783936b1afbae5bd1ef7d7200a92e"
  },
  {
    "sessionId": "notice34",
    "index": 2,
    "nodeId": "mt_uG2mjHFOlO",
    "type": "x-p34-repeat",
    "taskHash": "0a3a2d72f4ca1050af59cf180b3b122801d8ad69b3e73fc2aadf29b12f8eb5f6"
  },
  {
    "sessionId": "shapeseq34",
    "index": 1,
    "nodeId": "mt_A-FyLLLLzy",
    "type": "x-p34-repeat",
    "taskHash": "416fbea7953c7b18bad39ee45a999b584947bb923687e2d4eb77dc8c7efb0968"
  }
].map(Object.freeze));

export function p103rRepeatPatternsBinding(task,context) {
  const row=P103R_SOURCES.find(source=>source.sessionId===context?.sessionId&&source.index===context?.index);
  if (!row||!matchesNativeEvidenceTask(task,context,row)) return null;
  return {nodeId:row.nodeId,kind:'p103r-repeat-patterns',method:null,question:'圈出最短重复的一组，你会怎样接下去？'};
}

function shortestUnit(sequence) {
  for (let n=1;n<=sequence.length;n++) {
    if (sequence.every((symbol,i)=>symbol===sequence[i%n])) return sequence.slice(0,n);
  }
  return [];
}

export function replayP103RRepeatPatternsEvidence(task,model,context) {
  try {
    const binding=p103rRepeatPatternsBinding(task,context);
    if (!binding||!hasExactKeys(model,Object.keys(initial(task)))||!valid(task,model)||
        model.issue!==''||Object.keys(model.history).length!==model.history.length) return null;
    const known=new Set(task.symbols.map(symbol=>symbol.id));
    let added=[];
    for (const event of model.history) {
      if (!hasExactKeys(event,['a','i','v','w'])||event.v!==''||event.w!=='') return null;
      if (event.a==='pick'&&known.has(event.i)) {
        if (added.length<task.need) added.push(event.i);
      } else if (event.a==='undo'&&event.i==='') {
        added.pop();
      } else if (event.a==='clear'&&event.i==='') {
        added=[];
      } else {
        return null;
      }
    }
    if (added.length!==task.need||!sameEvidence({first:{},bad:false,added},model.board)) return null;
    const unit=shortestUnit(task.mode==='own'?added:task.seed);
    if (task.mode==='own') {
      if (unit.length!==task.unitLength||new Set(unit).size!==task.unitLength||added.length%unit.length) return null;
    } else if (!sameEvidence(unit,task.unit)||added.some((symbol,i)=>symbol!==unit[(task.seed.length+i)%unit.length])||
        !equal(model.answers[0],unit.length)) {
      return null;
    }
    return {...binding,unit,added};
  } catch {
    return null;
  }
}

export function submittedP103RRepeatPatternsEvidence(task,model,record,context) {
  return latestSubmissionMatches(model,record)?replayP103RRepeatPatternsEvidence(task,model,context):null;
}
