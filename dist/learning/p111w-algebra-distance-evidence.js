import {equationEqual, initial, valid} from './phase5/b35-model.js';
import {equal} from './phase5/b16-model.js';
import {hasExactKeys, latestSubmissionMatches, matchesNativeEvidenceTask, sameEvidence} from './evidence-contract.js';

import {equivalent} from './phase5/b15-model.js';

export const P111W_SOURCES = Object.freeze([
  {
    "sessionId": "missing35",
    "index": 0,
    "nodeId": "mt_ezc2m_0dzN",
    "type": "x-a35-walk",
    "taskHash": "82eb649c368bd7470a8bbccaa261d905f05cd174398ffe72acba08668991803e"
  },
  {
    "sessionId": "missing35",
    "index": 1,
    "nodeId": "mt_ezc2m_0dzN",
    "type": "x-a35-walk",
    "taskHash": "c8f3577775e27812823493147a7055a31d0f2477849a73b3760f1c0708e1fd06"
  },
  {
    "sessionId": "bigmissing35",
    "index": 0,
    "nodeId": "mt_XuHmIn2xje",
    "type": "x-a35-walk",
    "taskHash": "ae28568b00a0bc6851b643f96d04c37674290707289219c309837f30d606f822"
  }
].map(Object.freeze));

export function p111wAlgebraDistanceBinding(task,context) {
  const row=P111W_SOURCES.find(source=>source.sessionId===context?.sessionId&&source.index===context?.index);
  if (!row||!matchesNativeEvidenceTask(task,context,row)) return null;
  return {nodeId:row.nodeId,kind:'p111w-algebra-distance',method:null,question:'起点、终点和差之间怎样写成一道等式？'};
}

function subtractionMatches(raw,start,target) {
  const sides=raw.replace(/＝/g,'=').split('=');
  if (sides.length!==2) return false;
  return [sides,[...sides].reverse()].some(([left,right])=>
    equivalent(left,`${target}-${start}`)&&equal(right,target-start));
}

export function replayP111WAlgebraDistanceEvidence(task,model,context) {
  try {
    const binding=p111wAlgebraDistanceBinding(task,context);
    if (!binding||!hasExactKeys(model,Object.keys(initial(task)))||!valid(task,model)||
        model.issue!==''||Object.keys(model.history).length!==model.history.length) return null;
    let position=task.start;
    let path=[];
    for (const event of model.history) {
      if (!hasExactKeys(event,['a','i','v','w','z','k'])) return null;
      if (event.a==='walk'&&/^-?\d+$/.test(event.i)) {
        const delta=Number(event.i);
        if (!task.jumps.includes(delta)) return null;
        const next=position+delta;
        if (next>=task.min&&next<=task.max) {
          position=next;
          path.push(delta);
        }
      } else if (event.a==='undo'&&event.i==='') {
        position-=path.pop()??0;
      } else if (event.a==='reset'&&event.i==='') {
        position=task.start;
        path=[];
      } else {
        return null;
      }
    }
    const distance=position-task.start;
    if (!path.length||position!==task.target||position!==model.board.position||
        !sameEvidence(path,model.board.path)||!equal(model.answers[0],distance)) return null;
    const equation=model.answers[1];
    const asksSubtraction=context.sessionId==='missing35'&&context.index===1;
    if (asksSubtraction ? !subtractionMatches(equation,task.start,position) :
        !equationEqual(equation,[`${task.start}+x`,String(position)])) return null;
    return {...binding,path,distance};
  } catch {
    return null;
  }
}

export function submittedP111WAlgebraDistanceEvidence(task,model,record,context) {
  return latestSubmissionMatches(model,record)?replayP111WAlgebraDistanceEvidence(task,model,context):null;
}
