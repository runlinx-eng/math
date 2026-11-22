import {initial, valid} from './phase5/b24-model.js';
import {equal} from './phase5/b16-model.js';
import {hasExactKeys, latestSubmissionMatches, matchesNativeEvidenceTask, sameEvidence} from './evidence-contract.js';

export const P115F_SOURCES=Object.freeze([Object.freeze({
  sessionId:'patternfloor',index:0,nodeId:'mt_61Nhj8W78f',type:'x-p24-fan',
  taskHash:'67cf90d194df985310dd7ad5f28d58a080ddeb85c43c503a8d7851377a7ee2e3',
})]);

export function p115fPolygonAngleFanBinding(task,context) {
  const [row]=P115F_SOURCES;
  if (context?.sessionId!==row.sessionId||context?.index!==row.index||
      !matchesNativeEvidenceTask(task,context,row)) return null;
  return {nodeId:row.nodeId,kind:'p115f-polygon-angle-fan',method:null,question:'各个角围起来刚好360度、还有空隙，还是超过一整圈？'};
}

export function replayP115FPolygonAngleFanEvidence(task,model,context) {
  try {
    const binding=p115fPolygonAngleFanBinding(task,context);
    if (!binding||!hasExactKeys(model,Object.keys(initial(task,1)))||!valid(task,model)||
        model.issue!==''||Object.keys(model.history).length!==model.history.length) return null;
    const runs=[];
    let shape=null;
    let count=0;
    for (const event of model.history) {
      if (!hasExactKeys(event,['a','d','f'])||!hasExactKeys(event.d,[])) return null;
      if (event.a==='fanChoose'&&hasExactKeys(event.f,['kind'])) {
        const sides=Number(event.f.kind);
        if ([3,4,5,6].includes(sides)&&equal(event.f.kind,sides)) {
          shape=sides;
          count=0;
        }
        continue;
      }
      if (!hasExactKeys(event.f,[])) return null;
      switch (event.a) {
      case 'reset': shape=null; count=0; runs.length=0; break;
      case 'fanClear': count=0; break;
      case 'fanAdd': if (shape&&count<6) count++; break;
      case 'fanRecord':
        if (shape&&count&&!runs.some(([s,n])=>s===shape&&n===count)) runs.push([shape,count]);
        break;
      default: return null;
      }
    }
    if (shape!==model.board.shape||count!==model.board.count||!sameEvidence(runs,model.board.runs)||
        !task.samples.every(sample=>runs.some(run=>sameEvidence(sample,run)))) return null;
    const angle=(sides,n)=>180*(sides-2)*n/sides;
    const threePentagons=angle(5,3);
    const fills=runs.filter(([s,n])=>angle(s,n)===360).map(([s])=>s).sort((a,b)=>a-b);
    if (!equal(model.answers[0],threePentagons)||!equal(model.answers[1],360-threePentagons)||
        !sameEvidence(fills,[3,4,6])||model.answers[2]!=='three') return null;
    return {...binding,angles:runs.map(([s,n])=>angle(s,n))};
  } catch {
    return null;
  }
}

export function submittedP115FPolygonAngleFanEvidence(task,model,record,context) {
  return latestSubmissionMatches(model,record)?replayP115FPolygonAngleFanEvidence(task,model,context):null;
}
