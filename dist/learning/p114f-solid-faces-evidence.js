import {initial} from './phase5/b27-model.js';
import {hasExactKeys,latestSubmissionMatches,matchesNativeEvidenceTask,sameEvidence} from './evidence-contract.js';

export const P114F_SOURCES=Object.freeze([
  {
    "sessionId": "flatcorners",
    "index": 3,
    "nodeId": "mt_yGv8doDAmp",
    "type": "x-g27-face",
    "taskHash": "b16185895f54c9e1b22d01ba339c3d35e6da14f0d64785fd802c736aae4dbf8a"
  },
  {
    "sessionId": "solidfaces",
    "index": 0,
    "nodeId": "mt_UooUHC_V7U",
    "type": "x-g27-face",
    "taskHash": "429cc1f5a10adcd516b9f428a736f30ed6a42f4cb86fe3cc92a04b5b2195f8fe"
  },
  {
    "sessionId": "solidfaces",
    "index": 1,
    "nodeId": "mt_UooUHC_V7U",
    "type": "x-g27-face",
    "taskHash": "28706f79909a7c064cbfe37e4b9f034484162474413d7a255f8f893cba56efc0"
  },
  {
    "sessionId": "solidfaces",
    "index": 2,
    "nodeId": "mt_UooUHC_V7U",
    "type": "x-g27-face",
    "taskHash": "0e29d53281c7a025432d2973c76a3abb41f6bdd98ff332f2b8a628d7b78d2ec3"
  }
].map(Object.freeze));

const faceShapes={
  cube:{front:'square'},cuboid:{front:'rectangle'},
  cylinder:{top:'circle'},cone:{bottom:'circle'},pyramid:{side:'triangle'},
};

export function p114fSolidFacesBinding(task,context) {
  const row=P114F_SOURCES.find(s=>s.sessionId===context?.sessionId&&s.index===context?.index);
  if (!row||!matchesNativeEvidenceTask(task,context,row)) return null;
  return {nodeId:row.nodeId,kind:'p114f-solid-faces',method:null,
    question:'刚才点亮的这个面是什么形状？'};
}

export function replayP114FSolidFacesEvidence(task,model,context) {
  try {
    const binding=p114fSolidFacesBinding(task,context);
    if (!binding||!hasExactKeys(model,Object.keys(initial(task,1)))||
        !Number.isInteger(model.seed)||model.seed<1||model.seed>4294967295||
        !['position','foldPosition','prose','issue'].every(k=>typeof model[k]==='string'&&model[k].length<=1500)||
        model.position!=='2'||model.foldPosition!=='0'||
        !Array.isArray(model.history)||model.history.length>1000||
        Object.keys(model.history).length!==model.history.length) return null;

    const bins=task.bins.map(b=>b.id);
    const categories=task.cards.map(card=>faceShapes[card.shape]?.[card.face]);
    if (!categories.every(c=>bins.includes(c))) return null;
    let {board}=initial(task,model.seed);
    for (const event of model.history) {
      if (!hasExactKeys(event,['a','d'])) return null;
      const {a,d}=event;
      if (a==='card'&&hasExactKeys(d,['index'])&&typeof d.index==='string'&&
          task.cards.some((_,i)=>String(i)===d.index)) {
        board.card=Number(d.index);
      } else if (a==='choose'&&hasExactKeys(d,['index'])&&bins.includes(d.index)) {
        if (!board.probed.includes(board.card)) return null;
        board.first['card'+board.card]??=d.index;
        if (d.index!==categories[board.card]) board.bad=true;
        board.choices[board.card]=d.index;
      } else if (hasExactKeys(d,[])) {
        if (a==='turn') board.turned=true;
        else if (a==='help') board.first.help=true;
        else if (a==='reset') board={...initial(task,model.seed).board,first:board.first,bad:board.bad};
        else if (a==='probe') {
          if (!board.probed.includes(board.card)) board.probed.push(board.card);
        } else return null;
      } else return null;
    }
    if (model.issue!==''||!sameEvidence(board,model.board)||
        !sameEvidence(board.choices,categories)||(task.rotate&&!board.turned)||
        board.probed.length!==task.cards.length) return null;
    return {...binding,categories,turned:board.turned,probed:[...board.probed]};
  } catch {
    return null;
  }
}

export function submittedP114FSolidFacesEvidence(task,model,record,context) {
  return latestSubmissionMatches(model,record)?replayP114FSolidFacesEvidence(task,model,context):null;
}
