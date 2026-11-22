import {initial,valid} from './phase5/b09-model.js';
import {equal,parse} from './phase5/b09-math.js';
import {hasExactKeys,latestSubmissionMatches,matchesNativeEvidenceTask,sameEvidence} from './evidence-contract.js';

export const P104T_SOURCES=Object.freeze([
  {
    "sessionId": "toolchoice",
    "index": 3,
    "nodeId": "mt_zMEvtigoM3",
    "type": "x-toolwork",
    "taskHash": "4682de9d44be426e09691a8af01e52966d35e1bf4886eb442eb648225957895d"
  },
  {
    "sessionId": "toolchoice",
    "index": 4,
    "nodeId": "mt_zMEvtigoM3",
    "type": "x-toolwork",
    "taskHash": "59c5db26e7baf11d9781316e7df8677e5a15d1f3c243c379ae13a314edf491ae"
  },
  {
    "sessionId": "strategy39",
    "index": 3,
    "nodeId": "mt_mQcWGh02no",
    "type": "x-toolwork",
    "taskHash": "59c5db26e7baf11d9781316e7df8677e5a15d1f3c243c379ae13a314edf491ae"
  },
  {
    "sessionId": "strategy39",
    "index": 4,
    "nodeId": "mt_mQcWGh02no",
    "type": "x-toolwork",
    "taskHash": "f737425d54111adc53d3a5b1525b5cfa9ade58ff320f70ef0075cf48167f808b"
  }
].map(Object.freeze));

export function p104tToolPathsBinding(task,context) {
  const row=P104T_SOURCES.find(s=>s.sessionId===context?.sessionId&&s.index===context?.index);
  if (!row||!matchesNativeEvidenceTask(task,context,row)) return null;
  return {nodeId:row.nodeId,kind:'p104t-tool-paths',method:null,question:task.mode==='measure'
    ?'尺的零刻度在哪里？下一段怎样和前一段接上？'
    :'数轴或百数表上，十和一怎样合成这次的变化？'};
}

function calculation(task,model) {
  const lanes={line:[],hundred:[]};
  const ends={line:task.start,hundred:task.start};
  if (!Object.hasOwn(lanes,model.tool)||model.segments.length||model.unit!==''||model.zero||model.length) return null;
  for (const {tool,value} of model.history) {
    if (!Object.hasOwn(lanes,tool)||![-10,-1,1,10].includes(value)) return null;
    ends[tool]+=value;
    if (ends[tool]<0||ends[tool]>100) return null;
    lanes[tool].push(value);
  }
  const end=task.start+task.change;
  if (!sameEvidence(lanes.line,model.line)||!sameEvidence(lanes.hundred,model.grid)||
      !lanes[model.tool].length||ends[model.tool]!==end||!equal(parse(model.answer),[end,1])) return null;
  return {moves:lanes[model.tool],start:task.start,end};
}

function measurement(task,model) {
  const tools=['ruler','stick'];
  if (!tools.includes(model.tool)||model.line.length||model.grid.length||
      !model.segments.length||model.segments.length>task.maxSegments) return null;
  const maxZero=task.length>30?219:40;
  if (model.history.some(({tool,value})=>!tools.includes(tool)||value<0||value>maxZero)) return null;
  let end=task.start, cursor=0;
  for (const segment of model.segments) {
    if (!hasExactKeys(segment,['tool','zero','length'])||segment.zero!==end||
        segment.length>(segment.tool==='stick'?100:30)) return null;
    // History retains the tool and alignment of each accepted segment.
    // Unmeasuring and the lengths of removed segments leave no event.
    const at=model.history.findIndex((entry,i)=>i>=cursor&&entry.tool===segment.tool&&entry.value===segment.zero);
    if (at===-1) return null;
    cursor=at+1;
    end+=segment.length;
  }
  const measured=end-task.start;
  if (measured!==task.length||end>220||model.unit!==task.unit||
      !equal(parse(model.answer),[measured,task.unit==='m'?100:1])) return null;
  return {segments:model.segments.map(s=>({...s})),centimetres:measured,unit:task.unit};
}

export function replayP104TToolPathsEvidence(task,model,context) {
  try {
    const binding=p104tToolPathsBinding(task,context);
    if (!binding||!hasExactKeys(model,Object.keys(initial(task)))||!valid(task,model)||
        model.red||model.blue||Object.keys(model.history).length!==model.history.length||
        !model.history.every(e=>hasExactKeys(e,['tool','value']))) return null;
    const result=task.mode==='measure'?measurement(task,model):calculation(task,model);
    return result?{...binding,tool:model.tool,...result}:null;
  } catch {
    return null;
  }
}

export function submittedP104TToolPathsEvidence(task,model,record,context) {
  return latestSubmissionMatches(model,record)?replayP104TToolPathsEvidence(task,model,context):null;
}
