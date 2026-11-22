import {initial, valid} from './phase5/b22-model.js';
import {equal} from './phase5/b16-model.js';
import {hasExactKeys, latestSubmissionMatches, matchesNativeEvidenceTask, sameEvidence} from './evidence-contract.js';

export const P112S_SOURCES = Object.freeze([
  {
    "sessionId": "chancefraction",
    "index": 1,
    "nodeId": "mt_-c4Ca_nBzX",
    "type": "x-p22-pick",
    "taskHash": "65ef3a403cf6dc3c164c31cf15962d0a2ae4241148b322d4ee0517b060c907b8"
  },
  {
    "sessionId": "chancefraction",
    "index": 2,
    "nodeId": "mt_-c4Ca_nBzX",
    "type": "x-p22-pick",
    "taskHash": "46e87094c9d518ee1234345c874942a5086e47458b2b1974361730cd75f1f277"
  },
  {
    "sessionId": "chancecalc",
    "index": 0,
    "nodeId": "mt_Zt30Gxi-qp",
    "type": "x-p22-pick",
    "taskHash": "5b6beef6ba968424e12c41a16ca9c3d02cb0705972b6f1677c0919f14d130330"
  },
  {
    "sessionId": "chancecalc",
    "index": 2,
    "nodeId": "mt_Zt30Gxi-qp",
    "type": "x-p22-pick",
    "taskHash": "8887052f985691beb4fc838505b4e242d47f1ea5c30da0fd27d169bc3cd92bf6"
  },
  {
    "sessionId": "chancescale",
    "index": 2,
    "nodeId": "mt_vmQJAtAFuy",
    "type": "x-p22-pick",
    "taskHash": "2d33e2830b90e50dc6c6fdb13c350f83a669b2014e6d7fd234e7a007070dcb15"
  },
  {
    "sessionId": "trialcompare",
    "index": 2,
    "nodeId": "mt_-bMnJcPJy8",
    "type": "x-p22-pick",
    "taskHash": "ffb40f9e4d9800a6f9bc4527c5552c064c15814cb2f20ae54de14c6ce21bc183"
  },
  {
    "sessionId": "chancemodel",
    "index": 0,
    "nodeId": "mt_aCwj2PCoRV",
    "type": "x-p22-pick",
    "taskHash": "c420c3d49e485b6acb0eac5f81b2b4df58a7d58944f50e8b69213de78e0ca287"
  },
  {
    "sessionId": "chancemodel",
    "index": 1,
    "nodeId": "mt_aCwj2PCoRV",
    "type": "x-p22-pick",
    "taskHash": "9061ff0d28bb69232fdec262fad0f128fdfdf27a58bc747b27b7cd71dc0d3d52"
  }
].map(Object.freeze));

export function p112sProbabilitySelectionBinding(task,context) {
  const row=P112S_SOURCES.find(source=>source.sessionId===context?.sessionId&&source.index===context?.index);
  if (!row||!matchesNativeEvidenceTask(task,context,row)) return null;
  return {nodeId:row.nodeId,kind:'p112s-probability-selection',method:null,question:'哪几个结果算进分子？整个等可能结果一共有几个？'};
}

function answersMatch(context,answers,favorable,total) {
  switch (context.sessionId) {
  case 'chancefraction':
    return context.index===1 ? equal(answers[0],total)&&equal(answers[1],favorable) : answers[0].trim()==='all';
  case 'chancecalc':
    return context.index===0 ? equal(answers[0],total) : favorable*10>3*total&&answers[0].trim()==='higher';
  case 'chancescale':
    return answers[0].trim()==='unknown';
  case 'trialcompare':
    return answers[0].trim()==='no'&&answers[1].trim()==='spread';
  case 'chancemodel':
    return equal(answers[0],context.index===0?total:favorable);
  default:
    return false;
  }
}

const ascending=values=>[...values].sort((a,b)=>a-b);

export function replayP112SProbabilitySelectionEvidence(task,model,context) {
  try {
    const binding=p112sProbabilitySelectionBinding(task,context);
    if (!binding||!hasExactKeys(model,Object.keys(initial(task,1)))||!valid(task,model)||
        model.issue!==''||Object.keys(model.history).length!==model.history.length) return null;
    const group=task.items.flatMap((item,i)=>item.group===task.groupAction?[i]:[]);
    let selected=[];
    for (const event of model.history) {
      if (!hasExactKeys(event,['a','f','d'])||!hasExactKeys(event.f,[])) return null;
      if (event.a==='toggle'&&hasExactKeys(event.d,['index'])&&/^\d+$/.test(event.d.index)) {
        const i=Number(event.d.index);
        if (i>=task.items.length) return null;
        if (selected.includes(i)) selected=selected.filter(index=>index!==i);
        else selected.push(i);
      } else if (event.a==='group'&&task.groupAction&&hasExactKeys(event.d,[])) {
        selected=sameEvidence(ascending(selected),group)?[]:[...group];
      } else if (event.a==='reset'&&hasExactKeys(event.d,[])) {
        selected=[];
      } else {
        return null;
      }
    }
    const label=context.sessionId==='trialcompare'?'6':'小青';
    const expected=task.groupAction?group:task.items.flatMap((item,i)=>item.label===label?[i]:[]);
    if (!expected.length||!sameEvidence(selected,model.board.selected)||
        !sameEvidence(ascending(selected),expected)||model.kind!=='equal') return null;
    const counts=[expected.length,task.items.length];
    if (!equal(model.prob,...counts)||!answersMatch(context,model.answers,...counts)) return null;
    return {...binding,selected:[...expected],counts};
  } catch {
    return null;
  }
}

export function submittedP112SProbabilitySelectionEvidence(task,model,record,context) {
  return latestSubmissionMatches(model,record)?replayP112SProbabilitySelectionEvidence(task,model,context):null;
}
