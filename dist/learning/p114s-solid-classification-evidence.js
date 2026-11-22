import {initial} from './phase5/b27-model.js';
import {hasExactKeys,latestSubmissionMatches,matchesNativeEvidenceTask,sameEvidence} from './evidence-contract.js';

export const P114S_SOURCES=Object.freeze([
  {
    "sessionId": "solidnames",
    "index": 0,
    "nodeId": "mt_Qcp2d_kuta",
    "type": "x-g27-sort",
    "taskHash": "1e55df9b67792c2aa22ab8b39290b4bd6ef4be18eaeae72694b411065cf8bf49"
  },
  {
    "sessionId": "solidnames",
    "index": 1,
    "nodeId": "mt_Qcp2d_kuta",
    "type": "x-g27-sort",
    "taskHash": "f5019fb4c762ccb8a630d25d9fac01d4406bba4bc55ad9f3595e9c1b17273bf2"
  },
  {
    "sessionId": "solidnames",
    "index": 2,
    "nodeId": "mt_Qcp2d_kuta",
    "type": "x-g27-sort",
    "taskHash": "c65082e42d6da76504b6eb7d5311c0ec35646d4affb682db05471cf82c200f10"
  },
  {
    "sessionId": "flatcorners",
    "index": 0,
    "nodeId": "mt_yGv8doDAmp",
    "type": "x-g27-sort",
    "taskHash": "b1283fe0acc1fabd73526f2803c3a0018ee66d9c8f6d3cf6fb9c08a09345eb54"
  },
  {
    "sessionId": "flatcorners",
    "index": 1,
    "nodeId": "mt_yGv8doDAmp",
    "type": "x-g27-sort",
    "taskHash": "604e3c0fba659070846b36c53184664328f99dcadd6bd123630d950175ff885f"
  },
  {
    "sessionId": "flatcorners",
    "index": 2,
    "nodeId": "mt_yGv8doDAmp",
    "type": "x-g27-sort",
    "taskHash": "5ef75fc0f4ff855f88e05ad4a346c5689d47c58a8b2b2979ee0405f8b947e1f8"
  },
  {
    "sessionId": "flatvsolid",
    "index": 0,
    "nodeId": "mt_mnEVZNkX3p",
    "type": "x-g27-sort",
    "taskHash": "795702deb01c182a82a3ff1c50d764177b41c04e89e93c582fefbeded4f967a0"
  },
  {
    "sessionId": "flatvsolid",
    "index": 1,
    "nodeId": "mt_mnEVZNkX3p",
    "type": "x-g27-sort",
    "taskHash": "35a3d801f56d2b4e83fe7c20b369b24a52637cefe9f23d747d7f654cacd7194b"
  },
  {
    "sessionId": "flatvsolid",
    "index": 2,
    "nodeId": "mt_mnEVZNkX3p",
    "type": "x-g27-sort",
    "taskHash": "1a0c3b8c69e8acdb3861a2d4f50d09b1586e4b01490239edae7745685735a5f5"
  },
  {
    "sessionId": "solidstack",
    "index": 2,
    "nodeId": "mt_QNxFnxikCN",
    "type": "x-g27-sort",
    "taskHash": "41c2c9ac94d848a8183f4c7b7895bd0c29ed2652b293fa8486e1861b72d54c0a"
  },
  {
    "sessionId": "solidsort",
    "index": 0,
    "nodeId": "mt_fEuoBYw6bU",
    "type": "x-g27-sort",
    "taskHash": "12edd5f4dfff95290ebe4d51a8956f35af4163d5d13b3f8bef36c2bd80b4649c"
  },
  {
    "sessionId": "solidsort",
    "index": 1,
    "nodeId": "mt_fEuoBYw6bU",
    "type": "x-g27-sort",
    "taskHash": "fa0df059ab71b105791920a1c905e99cf7f1ab1abdf89bf0488a670a8de5371f"
  },
  {
    "sessionId": "solidsort",
    "index": 2,
    "nodeId": "mt_fEuoBYw6bU",
    "type": "x-g27-sort",
    "taskHash": "f8f5f3526f7ee1fad52a4d3d904fd3b6463c7e719ba1b90ddecd02bbe248087c"
  },
  {
    "sessionId": "solidpictures",
    "index": 0,
    "nodeId": "mt_wUSbRt3-qw",
    "type": "x-g27-sort",
    "taskHash": "b3809674faf7acab07c47cf6da1adfbf2bbb84af9bac6c412566e7b70ab3d499"
  },
  {
    "sessionId": "solidpictures",
    "index": 1,
    "nodeId": "mt_wUSbRt3-qw",
    "type": "x-g27-sort",
    "taskHash": "66eb9234d27106d55befebb8cd348ba5553d570ff6529ca25b099d4f5e2a05dd"
  },
  {
    "sessionId": "solidpictures",
    "index": 2,
    "nodeId": "mt_wUSbRt3-qw",
    "type": "x-g27-sort",
    "taskHash": "b449fce1dad2f3c7a10d43aaed499a24a1f24b195d5eb720aa9d843ecb3f223f"
  }
].map(Object.freeze));

const vertexCount={triangle:'3',rectangle:'4',square:'4',pentagon:'5'};
const planeShapes=new Set(['circle',...Object.keys(vertexCount)]);
const solidShapes=new Set(['cube','cuboid','sphere','cylinder','cone','pyramid','prism']);
const curvedShapes=new Set(['sphere','cylinder','cone']);
const combinations={tower:'cylcone',cubehouse:'boxpyramid'};
const representations={netbox:'cuboid',picturebox:'cuboid',pictureprism:'prism',netcube:'cube',netprism:'prism'};

function classify(card,bins) {
  const {shape}=card;
  if (bins.includes('3')) return vertexCount[shape];
  if (bins.includes('curved')) return solidShapes.has(shape)?(curvedShapes.has(shape)?'curved':'flat'):null;
  if (bins.includes('solid')) return solidShapes.has(shape)?'solid':planeShapes.has(shape)?'flat':null;
  if (bins.includes('cylcone')) return combinations[shape];
  return representations[shape]??(solidShapes.has(shape)?shape:null);
}

export function p114sSolidClassificationBinding(task,context) {
  const row=P114S_SOURCES.find(s=>s.sessionId===context?.sessionId&&s.index===context?.index);
  if (!row||!matchesNativeEvidenceTask(task,context,row)) return null;
  return {nodeId:row.nodeId,kind:'p114s-solid-classification',method:null,
    question:'你看的是顶点、平面和曲面，还是立体的组成？'};
}

export function replayP114SSolidClassificationEvidence(task,model,context) {
  try {
    const binding=p114sSolidClassificationBinding(task,context);
    if (!binding||!hasExactKeys(model,Object.keys(initial(task,1)))||
        !Number.isInteger(model.seed)||model.seed<1||model.seed>4294967295||
        !['position','foldPosition','prose','issue'].every(k=>typeof model[k]==='string'&&model[k].length<=1500)||
        model.position!=='2'||model.foldPosition!=='0'||
        !Array.isArray(model.history)||model.history.length>1000||
        Object.keys(model.history).length!==model.history.length) return null;

    const bins=task.bins.map(b=>b.id);
    const categories=task.cards.map(card=>classify(card,bins));
    if (!categories.every(c=>bins.includes(c))) return null;
    let {board}=initial(task,model.seed);
    let issue='';
    for (const event of model.history) {
      if (!hasExactKeys(event,['a','d'])) return null;
      const {a,d}=event;
      issue='';
      if (a==='card'&&hasExactKeys(d,['index'])&&typeof d.index==='string'&&
          task.cards.some((_,i)=>String(i)===d.index)) {
        board.card=Number(d.index);
      } else if (a==='choose'&&hasExactKeys(d,['index'])&&bins.includes(d.index)) {
        board.first['card'+board.card]??=d.index;
        if (d.index!==categories[board.card]) board.bad=true;
        board.choices[board.card]=d.index;
        board.revealed=board.revealed.filter(x=>x!==board.card);
      } else if (hasExactKeys(d,[])) {
        if (a==='turn') board.turned=true;
        else if (a==='help') board.first.help=true;
        else if (a==='reset') board={...initial(task,model.seed).board,first:board.first,bad:board.bad};
        else if (a==='show'&&task.cards[board.card].reveal) {
          if (board.choices[board.card]===null) issue='先猜它是什么，再展开立体看看。';
          else if (!board.revealed.includes(board.card)) board.revealed.push(board.card);
        } else return null;
      } else return null;
    }
    if (issue!==model.issue||issue||!sameEvidence(board,model.board)||
        !sameEvidence(board.choices,categories)||(task.rotate&&!board.turned)||
        !task.cards.every((card,i)=>!card.reveal||board.revealed.includes(i))) return null;
    return {...binding,categories,turned:board.turned,revealed:[...board.revealed]};
  } catch {
    return null;
  }
}

export function submittedP114SSolidClassificationEvidence(task,model,record,context) {
  return latestSubmissionMatches(model,record)?replayP114SSolidClassificationEvidence(task,model,context):null;
}
