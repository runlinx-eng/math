import {initial, inspect, valid} from './phase5/b10-model.js';
import {hasExactKeys, isEvidenceContext, latestSubmissionMatches, matchesNativeEvidenceTask, sameEvidence} from './evidence-contract.js';
const reviewed = [
  {
    "sessionId": "tripleadd",
    "index": 0,
    "nodeId": "mt_Zx1xZM-RbX",
    "type": "x-threegroups",
    "taskHash": "9ac50debcb0dd124d7ae79541b644d8e01e8d308bc2b88116472e711cc3f4938",
    "task": {
      "type": "x-threegroups",
      "values": [
        5,
        7,
        3
      ],
      "prompt": "先挑两堆合起来，再带上第三堆。留两种做法，其中试一次凑十。",
      "useful": true
    }
  },
  {
    "sessionId": "tripleadd",
    "index": 1,
    "nodeId": "mt_Zx1xZM-RbX",
    "type": "x-threegroups",
    "taskHash": "db8d158f321394085115fca4d4634df0c1d493890e93cf62f617f1de6d39cba9",
    "task": {
      "type": "x-threegroups",
      "values": [
        4,
        4,
        3
      ],
      "prompt": "这次没有凑十的一对，但有一样多的两堆。留两种做法。",
      "useful": true
    }
  },
  {
    "sessionId": "regroupadd",
    "index": 0,
    "nodeId": "mt_T76hKqXf0z",
    "type": "x-threegroups",
    "taskHash": "2b91a2fd13d5322375328b5fff12342043d01728d6c52dbdb7b9d8d0ab59a4d3",
    "task": {
      "type": "x-threegroups",
      "values": [
        2,
        6,
        4
      ],
      "prompt": "同样三堆，先合不同的两堆，留两种做法比较。",
      "useful": false
    }
  },
  {
    "sessionId": "regroupadd",
    "index": 1,
    "nodeId": "mt_T76hKqXf0z",
    "type": "x-threegroups",
    "taskHash": "3517499a8d480b5dc93bff9de6de290c330de2d8c788eda1756129f9da815e15",
    "task": {
      "type": "x-threegroups",
      "values": [
        2,
        8,
        5
      ],
      "prompt": "改变先算哪一对，第三堆仍要带上。再试两种做法。",
      "useful": false
    }
  },
  {
    "sessionId": "general34",
    "index": 0,
    "nodeId": "mt_fZTn0W_iZR",
    "type": "x-threegroups",
    "taskHash": "2dfc0627fc830d7e96318509c2e78fb73459e70744cf9ba5dc41ed460345ecd1",
    "task": {
      "type": "x-threegroups",
      "values": [
        6,
        6,
        1
      ],
      "prompt": "把6＋7看成6＋6＋1。先找一样多的两堆，再把1带上。",
      "useful": true
    }
  }
];
export const P009C_SOURCES = Object.freeze(reviewed.map(({task,...source})=>Object.freeze(source)));
export function p009cThreeGroupPairingsBinding(task,context) {
  if (!isEvidenceContext(context)) return null;
  const row = reviewed.find(entry=>entry.sessionId===context.sessionId && entry.index===context.index);
  if (!row || !sameEvidence(row.task,task) || !matchesNativeEvidenceTask(task,context,row)) return null;
  return {nodeId:row.nodeId,kind:'p009c-three-group-pairings',method:null,question:"先合哪两组？总数怎样保持不变？"};
}
export function replayP009CThreeGroupPairingsEvidence(task,model,context) {
  try {
    const binding=p009cThreeGroupPairingsBinding(task,context);
    if (!binding || !hasExactKeys(model,Object.keys(initial(task))) || !valid(task,model) ||
        model.issue!=='' || !model.history.length || Object.keys(model.history).length!==model.history.length) return null;
    const sum=values=>values.reduce((a,b)=>a+b,0);
    const total=sum(task.values);
    const validPair=pair=>Array.isArray(pair)&&pair.length===2&&new Set(pair).size===2&&pair.every(i=>Number.isInteger(i)&&i>=0&&i<3);
    const integer=raw=>typeof raw==='string'&&/^\s*-?\d{1,4}\s*$/.test(raw)?Number(raw):null;
    const saved=new Map();
    let merged=null, rejected=0;
    for (const event of model.history) {
      if (event.action==='merge'&&hasExactKeys(event,['action','pair'])&&!merged&&validPair(event.pair)) {
        merged=event.pair;
      } else if (event.action==='reset'&&hasExactKeys(event,['action','pair'])) {
        if (merged&&!sameEvidence(merged,event.pair)||!Array.isArray(event.pair)||event.pair.length>2||
            new Set(event.pair).size!==event.pair.length||!event.pair.every(i=>Number.isInteger(i)&&i>=0&&i<3)) return null;
        merged=null;
      } else if (hasExactKeys(event,['pair','sub','total'])&&merged&&sameEvidence(merged,event.pair)) {
        const [a,b]=merged.map(i=>task.values[i]);
        if (integer(event.sub)!==a+b||integer(event.total)!==total) {rejected++;continue;}
        const key=[...merged].sort().join(':');
        if (!saved.has(key)) saved.set(key,event);
        merged=null;
      } else return null;
    }
    const paths=[...saved.values()];
    const useful=paths.some(({pair:[a,b]})=>task.values[a]+task.values[b]===10||task.values[a]===task.values[b]);
    if (paths.length<2||(task.useful&&!useful)||Boolean(merged)!==model.merged||
        (merged&&!sameEvidence(merged,model.selected))||!sameEvidence(paths,model.saved)||!inspect(task,model).correct) return null;
    return {binding,total,paths,rejected};
  } catch {
    return null;
  }
}
export function submittedP009CThreeGroupPairingsEvidence(task,model,record,context) {
  return latestSubmissionMatches(model,record) ? replayP009CThreeGroupPairingsEvidence(task,model,context) : null;
}
