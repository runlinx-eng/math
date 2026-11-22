import {initial, valid} from './phase5/b39-model.js';
import {equal, rational} from './phase5/b16-model.js';
import {hasExactKeys, latestSubmissionMatches, matchesNativeEvidenceTask, sameEvidence} from './evidence-contract.js';


export const P088R_SOURCES = Object.freeze([
  {
    "sessionId": "graph39",
    "index": 0,
    "nodeId": "mt_Yw27nweoTj",
    "type": "x-s39-graph",
    "taskHash": "1eec6cf40609b87aa267170a6e66026b4c4a54c948bb7293129a55f6da427635"
  },
  {
    "sessionId": "graph39",
    "index": 3,
    "nodeId": "mt_Yw27nweoTj",
    "type": "x-s39-graph",
    "taskHash": "9f6a367322f7bd237cb87e0030a157912d8597777f052efd2d11be0686a23e3b"
  }
].map(Object.freeze));

export function p088rGraphReadingBinding(task,context) {
  const row=P088R_SOURCES.find(source=>source.sessionId===context?.sessionId&&source.index===context?.index);
  if (!row||!matchesNativeEvidenceTask(task,context,row)) return null;
  return {nodeId:row.nodeId,kind:'p088r-graph-reading',method:null,question:'标出横向位置后，纵向读数和水平路段各表示什么？'};
}

function within(raw,expected,tolerance) {
  const value=rational(raw);
  if (!value) return false;
  const [a,b]=value.map(BigInt);
  const [n,d]=expected.map(BigInt);
  const [p,q]=rational(tolerance).map(BigInt);
  const diff=a*d-n*b;
  return (diff<0n?-diff:diff)*q<=p*b*d;
}

function targetValue(task,tick) {
  if (task.graph==='curve') return {value:[tick*tick+100*task.offset,100],stopped:false};
  const end=task.points.findIndex(([x])=>10*x>=tick);
  const [x0,y0]=task.points[end-1];
  const [x1,y1]=task.points[end];
  const delta=10*(x1-x0);
  return {value:[delta*y0+(tick-10*x0)*(y1-y0),delta],stopped:y0===y1};
}

export function replayP088RGraphReadingEvidence(task,model,context) {
  try {
    const binding=p088rGraphReadingBinding(task,context);
    if (!binding||!hasExactKeys(model,Object.keys(initial(task)))||!valid(task,model)||
        model.issue!==''||Object.keys(model.history).length!==model.history.length) return null;
    const ticks=[];
    for (const event of model.history) {
      if (!hasExactKeys(event,['a','i','v','w','c'])||event.a!=='mark'||event.i!=='') return null;
      const tick=Math.round(Number(event.v)*10);
      if (!Number.isSafeInteger(tick)||tick<10*task.xMin||tick>10*task.xMax||!equal(event.v,tick,10)) return null;
      ticks.push(tick);
    }
    const target=Math.round(task.targetX*10);
    if (ticks.at(-1)!==target||!equal(model.cursor,target,10)||
        !sameEvidence(ticks.map(tick=>tick/10),model.board.marks)) return null;
    const {value:[n,d],stopped}=targetValue(task,target);
    if (!within(model.answer,[n,d],task.tolerance)||(task.graph==='journey'&&(!stopped||model.judgment!=='stopped'))) return null;
    return {...binding,expected:n/d,tolerance:task.tolerance};
  } catch {
    return null;
  }
}

export function submittedP088RGraphReadingEvidence(task,model,record,context) {
  return latestSubmissionMatches(model,record)?replayP088RGraphReadingEvidence(task,model,context):null;
}
