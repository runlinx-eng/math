import {initial, valid} from './phase5/b29-model.js';
import {equal} from './phase5/b16-model.js';
import {hasExactKeys, latestSubmissionMatches, matchesNativeEvidenceTask, sameEvidence} from './evidence-contract.js';

import {number} from './phase5/b20-model.js';

export const P095I_SOURCES = Object.freeze([
  {
    "sessionId": "temperaturechange",
    "index": 3,
    "nodeId": "mt_RVK655t391",
    "type": "x-m29-interval",
    "taskHash": "05f894ea37993959879f0e61d3a73d188f4178ddd61107e781a08211c5ff8b70"
  },
  {
    "sessionId": "discounts",
    "index": 2,
    "nodeId": "mt_oMkQQ2O-ML",
    "type": "x-m29-interval",
    "taskHash": "40e7789b20de23a6041ea822eff28e5623ad3e9d424b96d6d95a57a82a87477f"
  }
].map(Object.freeze));

export function p095iIntervalDistanceBinding(task,context) {
  const row=P095I_SOURCES.find(source=>source.sessionId===context?.sessionId&&source.index===context?.index);
  if (!row||!matchesNativeEvidenceTask(task,context,row)) return null;
  return {nodeId:row.nodeId,kind:'p095i-interval-distance',method:null,question:'经过零时，怎样数走过的间隔？'};
}

export function replayP095IIntervalDistanceEvidence(task,model,context) {
  try {
    const binding=p095iIntervalDistanceBinding(task,context);
    if (!binding||!hasExactKeys(model,Object.keys(initial(task)))||!valid(task,model)||
        model.issue!==''||Object.keys(model.history).length!==model.history.length) return null;
    const moves=[];
    const positions=[task.start];
    const direction=Math.sign(task.end-task.start);
    let first;
    let bad=false;
    for (const event of model.history) {
      if (!hasExactKeys(event,['a','i','v'])||event.i!=='') return null;
      if (event.a==='move') {
        first ??= event.v;
        const jump=number(event.v);
        if (!Number.isSafeInteger(jump)||jump<=0||jump>Math.abs(task.end-positions.at(-1))) {
          bad=true;
          continue;
        }
        if (!equal(event.v,jump)) return null;
        moves.push(jump);
        positions.push(positions.at(-1)+direction*jump);
      } else if (event.a==='undo'&&event.v==='') {
        if (moves.length) {
          moves.pop();
          positions.pop();
        }
      } else if (event.a==='clear'&&event.v==='') {
        moves.length=0;
        positions.length=1;
      } else {
        return null;
      }
    }
    const span=Math.abs(task.end-task.start);
    if (!moves.length||positions.at(-1)!==task.end||!sameEvidence(moves,model.board.moves)||
        first!==model.board.first.move||bad!==model.board.bad||model.unit!==task.unit||!equal(model.answer,span)) return null;
    return {...binding,positions,span,unit:task.unit};
  } catch {
    return null;
  }
}

export function submittedP095IIntervalDistanceEvidence(task,model,record,context) {
  return latestSubmissionMatches(model,record)?replayP095IIntervalDistanceEvidence(task,model,context):null;
}
