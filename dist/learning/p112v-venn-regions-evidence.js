import {initial, valid} from './phase5/b22-model.js';
import {equal} from './phase5/b16-model.js';
import {hasExactKeys, latestSubmissionMatches, matchesNativeEvidenceTask, sameEvidence} from './evidence-contract.js';

import {number} from './phase5/b20-model.js';

export const P112V_SOURCES = Object.freeze([
  {
    "sessionId": "chancesets",
    "index": 0,
    "nodeId": "mt_1YwOCMMwD8",
    "type": "x-p22-venn",
    "taskHash": "b49927fb4621037c49b99fb8a0a4149707e5a785f793849cbeba669659fcfb57"
  },
  {
    "sessionId": "chancesets",
    "index": 2,
    "nodeId": "mt_1YwOCMMwD8",
    "type": "x-p22-venn",
    "taskHash": "e7ea2195297e493121a259059504afdfac9a84d41f0c4e3b4d03279e5d557fc9"
  },
  {
    "sessionId": "chancevenn",
    "index": 0,
    "nodeId": "mt_eSv_w46u6H",
    "type": "x-p22-venn",
    "taskHash": "0b16cf75043c9ccbe4ef39c3d302148d2fe621b1d6051d1d491b3dd8a2b661e3"
  },
  {
    "sessionId": "chancevenn",
    "index": 1,
    "nodeId": "mt_eSv_w46u6H",
    "type": "x-p22-venn",
    "taskHash": "4e8366b3764b934ee67237984c34460e27907bb95075a333cc939134720081f6"
  },
  {
    "sessionId": "chancevenn",
    "index": 2,
    "nodeId": "mt_eSv_w46u6H",
    "type": "x-p22-venn",
    "taskHash": "c30031bd7fc613825777db36c18a9ee4c762300d61ebc4b8eec8b8b30fe524f3"
  }
].map(Object.freeze));

export function p112vVennRegionsBinding(task,context) {
  const row=P112V_SOURCES.find(source=>source.sessionId===context?.sessionId&&source.index===context?.index);
  if (!row||!matchesNativeEvidenceTask(task,context,row)) return null;
  return {nodeId:row.nodeId,kind:'p112v-venn-regions',method:null,question:'怎样把每个结果只放一次，又不漏掉两边都没有的？'};
}

const sorted=xs=>[...xs].sort((a,b)=>a-b);
const masks={both:[1],either:[0,1,2],notA:[2,3]};

function index(raw,length) {
  const i=number(raw);
  return Number.isInteger(i)&&i>=0&&i<length&&equal(raw,i)?i:null;
}

function setMatches(raw,expected) {
  const tokens=raw.split(/[,，、\s]+/).filter(Boolean);
  return sameEvidence(sorted(tokens.map(token=>index(token,9))),expected);
}

function itemsEvidence(task,model) {
  const assigned=task.items.map(()=>null);
  for (const {a,d,f} of model.history) {
    if (!hasExactKeys(d,[])) return false;
    if (a==='reset'&&hasExactKeys(f,[])) {
      assigned.fill(null);
    } else if (a==='place'&&hasExactKeys(f,['item','region'])) {
      const i=index(f.item,assigned.length);
      const r=index(f.region,4);
      if (i!==null&&r!==null) assigned[i]=r;
    } else {
      return false;
    }
  }
  const expected=task.items.map(n=>n%2===0?(n<4?1:0):(n<4?2:3));
  return sameEvidence(assigned,expected)&&sameEvidence(assigned,model.board.assigned)&&
    setMatches(model.answers[0],task.items.filter((_,i)=>assigned[i]!==3))&&
    setMatches(model.answers[1],task.items.filter((_,i)=>assigned[i]===1));
}

function countsEvidence(task,model) {
  const [a,b,ab,total]=task.totals;
  const union=a+b-ab;
  const counts=[a-ab,ab,b-ab,total-union];
  let built=null;
  for (const {a,d,f} of model.history) {
    if (!hasExactKeys(d,[])) return false;
    if (a==='reset'&&hasExactKeys(f,[])) built=null;
    else if (a==='build'&&hasExactKeys(f,['values'])) built=f.values;
    else return false;
  }
  if (!built||!sameEvidence(counts,model.board.built)||
      !counts.every((count,i)=>equal(built[i],count)&&equal(model.values[i],count))) return false;
  if (model.answers.length===2) return equal(model.answers[0],union)&&model.answers[1]==='once';
  return [a,b,ab,union].every((count,i)=>equal(model.answers[i],count,total));
}

function shadeEvidence(task,model) {
  let shades={};
  let selected=[];
  let event='';
  for (const {a,d,f} of model.history) {
    if (a==='reset'&&hasExactKeys(d,[])&&hasExactKeys(f,[])) {
      shades={};
      selected=[];
      event='';
    } else if (a==='activate'&&hasExactKeys(d,[])&&hasExactKeys(f,['event'])&&task.events.includes(f.event)) {
      event=f.event;
      selected=[...(shades[event]??[])];
    } else if (a==='shade'&&event&&hasExactKeys(d,['index'])&&hasExactKeys(f,[])) {
      const i=index(d.index,4);
      if (i===null) return false;
      selected=selected.includes(i)?selected.filter(j=>j!==i):[...selected,i];
    } else if (a==='save'&&hasExactKeys(d,[])&&hasExactKeys(f,['event'])&&event&&event===f.event) {
      shades[event]=[...selected];
    } else {
      return false;
    }
  }
  if (!sameEvidence(shades,model.board.shades)||!sameEvidence(selected,model.board.selected)||
      event!==model.board.event||!task.events.every(e=>shades[e]&&sameEvidence(sorted(shades[e]),masks[e]))||
      !sameEvidence(sorted(selected),sorted(shades[event]??[]))) return false;
  const union=task.counts.slice(0,3).reduce((a,b)=>a+b,0);
  return model.answers.length===1?model.answers[0]==='once':equal(model.answers[0],union)&&model.answers[1]==='once';
}

export function replayP112VVennRegionsEvidence(task,model,context) {
  try {
    const binding=p112vVennRegionsBinding(task,context);
    if (!binding||!hasExactKeys(model,Object.keys(initial(task,1)))||!valid(task,model)||
        model.issue!==''||Object.keys(model.history).length!==model.history.length||
        !model.history.every(event=>hasExactKeys(event,['a','d','f']))) return null;
    const check={items:itemsEvidence,counts:countsEvidence,shade:shadeEvidence}[task.mode];
    if (!check(task,model)) return null;
    return {...binding,mode:task.mode};
  } catch {
    return null;
  }
}

export function submittedP112VVennRegionsEvidence(task,model,record,context) {
  return latestSubmissionMatches(model,record)?replayP112VVennRegionsEvidence(task,model,context):null;
}
