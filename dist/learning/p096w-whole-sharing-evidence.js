import {equal,fields,initial,sharingEquation,valid} from './phase5/b16-model.js';
import {hasExactKeys,latestSubmissionMatches,matchesNativeEvidenceTask,sameEvidence} from './evidence-contract.js';

export const P096W_SOURCES=Object.freeze([
  {
    "sessionId": "sharewholes",
    "index": 0,
    "nodeId": "mt_4Km38F4L-6",
    "type": "x-wholeshare",
    "taskHash": "46762e377a10ad2c597376e3957194fda38afd7a40bb6bd2c52b278173601c47"
  },
  {
    "sessionId": "sharewholes",
    "index": 1,
    "nodeId": "mt_4Km38F4L-6",
    "type": "x-wholeshare",
    "taskHash": "14df910d580247bfa418be8e751c8beabbb1cf4a1add22a16aacbf7ecc3a8071"
  },
  {
    "sessionId": "sharewholes",
    "index": 2,
    "nodeId": "mt_4Km38F4L-6",
    "type": "x-wholeshare",
    "taskHash": "adda570f60bcf2155d3921173f10bf8db596d0eee784bad3fe5bdfb0d0865622"
  },
  {
    "sessionId": "translateamount",
    "index": 0,
    "nodeId": "mt_3VmBdlAeOZ",
    "type": "x-wholeshare",
    "taskHash": "21c33177d54b7652b5b7bb52019e507b493335a634bdc0398ca645004802fefc"
  },
  {
    "sessionId": "tenpieces",
    "index": 2,
    "nodeId": "mt_YzM5goBctT",
    "type": "x-wholeshare",
    "taskHash": "ed2697d0737daf0ed9a380f967baa2bf168ad4a49b274da1d373c7b874e70f4c"
  },
  {
    "sessionId": "reason34",
    "index": 2,
    "nodeId": "mt_iyovKgZC1q",
    "type": "x-wholeshare",
    "taskHash": "21c33177d54b7652b5b7bb52019e507b493335a634bdc0398ca645004802fefc"
  }
].map(Object.freeze));

export function p096wWholeSharingBinding(task,context) {
  const row=P096W_SOURCES.find(s=>s.sessionId===context?.sessionId&&s.index===context?.index);
  if (!row||!matchesNativeEvidenceTask(task,context,row)) return null;
  return {nodeId:row.nodeId,kind:'p096w-whole-sharing',method:null,
    question:'每人先分到几个整体？再分剩下的以后，每人一共得到多少？'};
}

export function replayP096WWholeSharingEvidence(task,model,context) {
  try {
    const binding=p096wWholeSharingBinding(task,context);
    if (!binding||!hasExactKeys(model,Object.keys(initial(task)))||!valid(task,model)||
        model.issue!==''||Object.keys(model.history).length!==model.history.length) return null;
    const {wholes,people}=task, whole=Math.floor(wholes/people), leftover=wholes%people;
    const fieldNames=Object.keys(fields);
    let {board}=initial(task);
    let rejected=false;
    for (const entry of model.history) {
      if (!hasExactKeys(entry,['action','data'])) return null;
      const {action,data}=entry, indexed=['person','share-piece'].includes(action);
      if (!hasExactKeys(data,indexed?['fields','index']:['fields'])||!hasExactKeys(data.fields,fieldNames)) return null;
      rejected=false;
      if (action==='reset') {
        board=initial(task).board;
      } else if (action==='round'&&!board.cut) {
        rejected=board.rounds>=whole;
        if (!rejected) board.rounds++;
      } else if (action==='cut-wholes'&&!board.cut) {
        rejected=board.rounds!==whole;
        if (!rejected) {
          board.cut=true;
          board.groups=Array(leftover*people).fill(-1);
        }
      } else if (indexed&&/^(0|[1-9]\d*)$/.test(data.index)) {
        const i=Number(data.index);
        if (action==='person'&&i<people) board.person=i;
        else if (action==='share-piece'&&board.cut&&i<board.groups.length) board.groups[i]=board.person;
        else return null;
      } else return null;
    }
    if (rejected||!sameEvidence(board,model.board)||!board.cut||board.rounds!==whole) return null;
    const perPerson=Array(people).fill(0);
    for (const person of board.groups) {
      if (person<0) return null;
      perPerson[person]++;
    }
    if (perPerson.some(n=>n!==leftover)||!equal(model.answer,wholes,people)||
        !equal(model.whole,whole)||!equal(model.remainder,leftover,people)||
        !sharingEquation(model.equation,wholes,people)||
        !sharingEquation(model.total,wholes,people,true)) return null;
    return {...binding,wholePerPerson:whole,pieceNumerator:leftover,pieceDenominator:people,total:wholes};
  } catch {
    return null;
  }
}

export function submittedP096WWholeSharingEvidence(task,model,record,context) {
  return latestSubmissionMatches(model,record)?replayP096WWholeSharingEvidence(task,model,context):null;
}
