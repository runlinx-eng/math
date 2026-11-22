import {fields,initial,number,valid} from './phase5/b21-model.js';
import {rational} from './phase5/b16-model.js';
import {hasExactKeys,latestSubmissionMatches,matchesNativeEvidenceTask,sameEvidence} from './evidence-contract.js';

export const P110M_SOURCES=Object.freeze([
  {
    "sessionId": "distributionlook",
    "index": 2,
    "nodeId": "mt_OwYms2tB1L",
    "type": "x-mediarepair",
    "taskHash": "f601a4a476a14799ddc035c51547d19789cc080ae206cc412d1ab9531567019d"
  },
  {
    "sessionId": "medialens",
    "index": 0,
    "nodeId": "mt_8IsaoMPvod",
    "type": "x-mediarepair",
    "taskHash": "6aaecdf6231d4c0df7d221aae3d497ec720cc315188bc107d9a2a102062bda64"
  },
  {
    "sessionId": "medialens",
    "index": 1,
    "nodeId": "mt_8IsaoMPvod",
    "type": "x-mediarepair",
    "taskHash": "0297aa938fffd127738d640a41342a73200abfd9c037fece1f106e20777a1c3d"
  },
  {
    "sessionId": "medialens",
    "index": 2,
    "nodeId": "mt_8IsaoMPvod",
    "type": "x-mediarepair",
    "taskHash": "b668c88d0b023d7a8d0ec55755cd299b375e970eeca5a7c44e6dab337d3e131c"
  },
  {
    "sessionId": "comparepeople",
    "index": 1,
    "nodeId": "mt_km4V6d5IAh",
    "type": "x-mediarepair",
    "taskHash": "3704e261ddd938f1103fc0e51f4f6daf0afa392a40f1a89745313f30210c2dfb"
  }
].map(Object.freeze));

const headlineKeys=['scope','headline','precision','n','k'];
const eventFields={axis:['axis'],handle:['choice'],headline:headlineKeys,reset:[]};
const decisions=['correct','keep','unknown'];

function exact(raw,wanted) {
  const pair=rational(raw);
  return Number.isFinite(number(raw))&&pair!==null&&BigInt(pair[0])===BigInt(wanted)*BigInt(pair[1]);
}

export function p110mMediaClaimsBinding(task,context) {
  const row=P110M_SOURCES.find(s=>s.sessionId===context?.sessionId&&s.index===context?.index);
  if (!row||!matchesNativeEvidenceTask(task,context,row)) return null;
  return {nodeId:row.nodeId,kind:'p110m-media-claims',method:null,
    question:'原记录支持说到哪里？图轴、样本或远点会影响什么？'};
}

export function replayP110MMediaClaimsEvidence(task,model,context) {
  try {
    const binding=p110mMediaClaimsBinding(task,context);
    if (!binding||!hasExactKeys(model,Object.keys(initial(task)))||!valid(task,model)||
        model.issue!==''||Object.keys(model.history).length!==model.history.length) return null;
    let {board}=initial(task);
    const legacy=Object.keys(fields(task));
    let rejected=false;
    for (const e of model.history) {
      if (!hasExactKeys(e,['a','d','f'])||!hasExactKeys(e.d,[])||!Object.hasOwn(eventFields,e.a)||
          !(hasExactKeys(e.f,eventFields[e.a])||hasExactKeys(e.f,legacy))) return null;
      const {a,f}=e;
      board.first[a+'-'+board.cursor]??=f;
      rejected=false;
      if (a==='reset') {
        board={...initial(task).board,first:board.first};
      } else if (a==='axis'&&task.mode==='axis'&&['0','90'].includes(f.axis)) {
        board.axis=Number(f.axis);
        if (!board.seen.includes(board.axis)) board.seen.push(board.axis);
      } else if (a==='handle'&&task.mode==='context'&&board.cursor<task.records.length&&decisions.includes(f.choice)) {
        board.decisions[board.cursor]=f.choice;
        rejected=f.choice!==task.records[board.cursor].answer;
        if (!rejected) board.cursor++;
      } else if (a==='headline'&&['headline','claim'].includes(task.mode)) {
        board.saved=Object.fromEntries(headlineKeys.map(k=>[k,f[k]]));
      } else return null;
    }
    if (rejected||!sameEvidence(board,model.board)) return null;
    let observation;
    if (task.mode==='axis') {
      if (!board.seen.includes(0)||!board.seen.includes(90)) return null;
      observation={baselines:board.seen,actualDifference:Math.max(...task.values)-Math.min(...task.values)};
    } else if (task.mode==='context') {
      if (board.cursor!==task.records.length) return null;
      observation={decisions:board.decisions};
    } else {
      const p=board.saved;
      if (!p||p.scope!=='sample'||p.headline!=='bounded'||p.precision!=='limited'||
          !exact(p.n,task.n)||!exact(p.k,task.k)||!headlineKeys.every(k=>model[k]===p[k])) return null;
      observation={scope:'sample',populationLabel:task.who,observed:task.n,matching:task.k};
    }
    if (!task.questions.every((q,i)=>Array.isArray(q.value)
      ? q.value.includes(model.answers[i])
      : exact(model.answers[i],q.value))) return null;
    return {...binding,mode:task.mode,observation};
  } catch {
    return null;
  }
}

export function submittedP110MMediaClaimsEvidence(task,model,record,context) {
  return latestSubmissionMatches(model,record)?replayP110MMediaClaimsEvidence(task,model,context):null;
}
