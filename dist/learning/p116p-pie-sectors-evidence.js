import {initial, number, valid} from './phase5/b20-model.js';
import {equal, rational} from './phase5/b16-model.js';
import {hasExactKeys, latestSubmissionMatches, matchesNativeEvidenceTask, sameEvidence} from './evidence-contract.js';

export const P116P_SOURCES = Object.freeze([
  {
    "sessionId": "chartfamilies",
    "index": 1,
    "nodeId": "mt_eKJG-0eC6D",
    "type": "x-piesector",
    "taskHash": "df7fdb1c32984df97bed621eceaffe5d42fa038efae6a7ac3053c3fc53b00616"
  },
  {
    "sessionId": "piepieces",
    "index": 1,
    "nodeId": "mt_bESTSBB0wK",
    "type": "x-piesector",
    "taskHash": "16f097d56008b86956e36c9e8fa5bb5c077cde1b8162bb9b8108c594d25809a8"
  },
  {
    "sessionId": "piepieces",
    "index": 3,
    "nodeId": "mt_bESTSBB0wK",
    "type": "x-piesector",
    "taskHash": "f7233854cc20113d83e66631b13d49b24c911488b5bfafe5c718c6ab31744a9e"
  }
].map(Object.freeze));

export function p116pPieSectorsBinding(task,context) {
  const row=P116P_SOURCES.find(source=>source.sessionId===context?.sessionId&&source.index===context?.index);
  if (!row||!matchesNativeEvidenceTask(task,context,row)) return null;
  return {nodeId:row.nodeId,kind:'p116p-pie-sectors',method:null,question:'每块角度怎样从票数算出？为什么只凑够360度还不够？'};
}

const zero=[0n,1n];
const add=([a,b],[n,d])=>[a*d+b*n,b*d];

export function replayP116PPieSectorsEvidence(task,model,context) {
  try {
    const binding=p116pPieSectorsBinding(task,context);
    if (!binding||!hasExactKeys(model,Object.keys(initial(task)))||!valid(task,model)||
        model.issue!==''||Object.keys(model.history).length!==model.history.length) return null;
    const angles=task.counts.map(()=>null);
    let cursor=0;
    for (const event of model.history) {
      if (!hasExactKeys(event,['a','d','f'])) return null;
      if (event.a==='reset'&&hasExactKeys(event.d,[])) {
        angles.fill(null);
        cursor=0;
      } else if (event.a==='row'&&hasExactKeys(event.d,['index'])) {
        const i=number(event.d.index);
        if (!Number.isInteger(i)||i<0||i>=angles.length||!equal(event.d.index,i)) return null;
        cursor=i;
      } else if (event.a==='sector'&&hasExactKeys(event.d,[])) {
        if (!Number.isFinite(number(event.f.angle))) continue;
        const raw=rational(event.f.angle);
        if (!raw) return null;
        const angle=raw.map(BigInt);
        if (angle[0]<=0n||angle[0]>360n*angle[1]) continue;
        const [sum,scale]=angles.reduce((value,part,i)=>i!==cursor&&part?add(value,part):value,angle);
        if (sum>360n*scale) continue;
        angles[cursor]=angle;
        const next=angles.indexOf(null);
        if (next>=0) cursor=next;
      } else {
        return null;
      }
    }
    const total=BigInt(task.counts.reduce((a,b)=>a+b,0));
    if (!angles.every((part,i)=>part&&part[0]*total===360n*BigInt(task.counts[i])*part[1])) return null;
    const [sum,scale]=angles.reduce(add,zero);
    const degrees=angles.map(([n,d])=>Number(n)/Number(d));
    if (sum!==360n*scale||!sameEvidence(degrees,model.board.angles)||cursor!==model.board.cursor) return null;
    return {...binding,angles:degrees};
  } catch {
    return null;
  }
}

export function submittedP116PPieSectorsEvidence(task,model,record,context) {
  return latestSubmissionMatches(model,record)?replayP116PPieSectorsEvidence(task,model,context):null;
}
