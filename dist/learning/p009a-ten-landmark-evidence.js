import {initial, inspect, valid} from './phase5/b10-model.js';
import {hasExactKeys, isEvidenceContext, latestSubmissionMatches, matchesNativeEvidenceTask, sameEvidence} from './evidence-contract.js';
const reviewed = [
  {
    "sessionId": "screenadd",
    "index": 1,
    "nodeId": "mt_biGHAbkoV2",
    "type": "x-tenbridge",
    "taskHash": "b1363d13a7d764a139b7b46934bf626b2767792c246f43f05a4a328efcd3d83c",
    "task": {
      "type": "x-tenbridge",
      "a": 8,
      "b": 5,
      "op": "+",
      "prompt": "8+5：从后一堆搬一些填满十，再把剩下的接上。"
    }
  },
  {
    "sessionId": "screenadd",
    "index": 2,
    "nodeId": "mt_biGHAbkoV2",
    "type": "x-tenbridge",
    "taskHash": "ce0cb800cd40c70da5daa48b0d272585adc0184a888b2e7599c8ee30a0a33a61",
    "task": {
      "type": "x-tenbridge",
      "a": 15,
      "b": 7,
      "op": "-",
      "prompt": "15−7：先拿走一些到十，再把还要拿的拿走。"
    }
  },
  {
    "sessionId": "bonds20",
    "index": 1,
    "nodeId": "mt_s2mfRBoTal",
    "type": "x-tenbridge",
    "taskHash": "c651214084230a9e6475d82ed25f2e33ec3a994a14d1240225edee875b0236d3",
    "task": {
      "type": "x-tenbridge",
      "a": 8,
      "b": 5,
      "op": "+",
      "prompt": "8+5忘记时，可以怎样借十重新找到它？"
    }
  },
  {
    "sessionId": "bridge20",
    "index": 0,
    "nodeId": "mt_m1W6nTQJ2b",
    "type": "x-tenbridge",
    "taskHash": "4795934c42b3cbaa7e7439e38dc7c9f692d36fb828fe1474e566a94d95add3e3",
    "task": {
      "type": "x-tenbridge",
      "a": 8,
      "b": 6,
      "op": "+",
      "prompt": "8+6，先让十出现。哪些圆片搬过去，哪些还在后面？"
    }
  },
  {
    "sessionId": "bridge20",
    "index": 1,
    "nodeId": "mt_m1W6nTQJ2b",
    "type": "x-tenbridge",
    "taskHash": "8b18573764d3f1eccac09b5aec4e0f098b0c7bf550bc7f3ac898e05750a45c4a",
    "task": {
      "type": "x-tenbridge",
      "a": 13,
      "b": 4,
      "op": "-",
      "prompt": "13−4，先到十。剩下还要拿走的部分，继续往哪个方向？"
    }
  },
  {
    "sessionId": "factstwenty",
    "index": 0,
    "nodeId": "mt__t4afSyZRm",
    "type": "x-tenbridge",
    "taskHash": "d7a1d5763e56453eb29b56be539702cdca483e46784950d0a0924279464dfaa6",
    "task": {
      "type": "x-tenbridge",
      "a": 15,
      "b": 8,
      "op": "-",
      "prompt": "15−8，用十作为中途的一站，重新搭出这个关系。"
    }
  },
  {
    "sessionId": "tools38",
    "index": 0,
    "nodeId": "mt_20WfHhnL39",
    "type": "x-tenbridge",
    "taskHash": "4795934c42b3cbaa7e7439e38dc7c9f692d36fb828fe1474e566a94d95add3e3",
    "task": {
      "type": "x-tenbridge",
      "a": 8,
      "b": 6,
      "op": "+",
      "prompt": "8+6，先让十出现。哪些圆片搬过去，哪些还在后面？"
    }
  }
];
export const P009A_SOURCES = Object.freeze(reviewed.map(({task,...source})=>Object.freeze(source)));
export function p009aTenLandmarkBinding(task,context) {
  if (!isEvidenceContext(context)) return null;
  const row = reviewed.find(entry=>entry.sessionId===context.sessionId && entry.index===context.index);
  if (!row || !sameEvidence(row.task,task) || !matchesNativeEvidenceTask(task,context,row)) return null;
  return {nodeId:row.nodeId,kind:'p009a-ten-landmark',method:null,question:"到十时搬了几个，后来又搬了几个？"};
}
export function replayP009ATenLandmarkEvidence(task,model,context) {
  try {
    const binding=p009aTenLandmarkBinding(task,context);
    if (!binding || !hasExactKeys(model,Object.keys(initial(task))) || !valid(task,model) ||
        model.issue!=='' || !model.history.length || Object.keys(model.history).length!==model.history.length) return null;
    const add=task.op==='+', direction=add?1:-1;
    const limit=add?task.b:task.a;
    const first=direction*(10-task.a), second=task.b-first;
    const ids=values=>Array.isArray(values)&&new Set(values).size===values.length&&
      values.every(index=>Number.isInteger(index)&&index>=0&&index<limit);
    const retains=(values,landmark)=>!landmark||landmark.ids.every(index=>values.includes(index));
    let landmark=null, finished=null, wentToTen=0;
    for (const event of model.history) {
      if (!ids(event.ids)) return null;
      if (event.action==='landmark'&&hasExactKeys(event,['action','ids','count'])&&!landmark) {
        if (add ? event.ids.length>first : event.ids.some(index=>index<10)) return null;
        if (event.count!==task.a+direction*event.ids.length) return null;
        if (event.count===10) {
          landmark={ids:event.ids,count:event.ids.length};
          wentToTen++;
        }
      } else if (event.action==='finish'&&hasExactKeys(event,['action','ids'])&&landmark) {
        if (!retains(event.ids,landmark)) return null;
        finished=event.ids;
      } else if (event.action==='reset'&&hasExactKeys(event,['action','ids','landmark'])) {
        if (!sameEvidence(event.landmark,landmark)||!retains(event.ids,landmark)||
            (!landmark&&(add?event.ids.length>first:event.ids.some(index=>index<10)))) return null;
        landmark=null;
        finished=null;
      } else return null;
    }
    const integer=raw=>typeof raw==='string'&&/^\s*-?\d{1,4}\s*$/.test(raw)?Number(raw):null;
    if (integer(model.first)===null||!landmark||landmark.count!==first||!finished||finished.length!==task.b||
        !model.finished||!sameEvidence(landmark,model.landmark)||!sameEvidence(finished,model.moved)||
        integer(model.firstPart)!==first||integer(model.secondPart)!==second||!inspect(task,model).correct) return null;
    return {binding,landmark:10,first,second,result:10+direction*second,visitsToTen:wentToTen};
  } catch {
    return null;
  }
}
export function submittedP009ATenLandmarkEvidence(task,model,record,context) {
  return latestSubmissionMatches(model,record) ? replayP009ATenLandmarkEvidence(task,model,context) : null;
}
