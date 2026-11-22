import {initial, number, valid} from './phase5/b20-model.js';
import {equal} from './phase5/b16-model.js';
import {hasExactKeys, latestSubmissionMatches, matchesNativeEvidenceTask, sameEvidence} from './evidence-contract.js';

export const P116D_SOURCES=Object.freeze([Object.freeze({
  sessionId:'fractiondots',index:2,nodeId:'mt_IHipFGTFEY',type:'x-dotdraw',
  taskHash:'3873e521e51855f69df548b45580bf627d70d3bdd27ec34378142830502ad1c1',
})]);

export function p116dFractionFairShareBinding(task,context) {
  const [row]=P116D_SOURCES;
  if (context?.sessionId!==row.sessionId||context?.index!==row.index||
      !matchesNativeEvidenceTask(task,context,row)) return null;
  return {nodeId:row.nodeId,kind:'p116d-fraction-fair-share',method:null,question:'每次只倒八分之一杯，怎样让四杯相等并保持总量？'};
}

export function replayP116DFractionFairShareEvidence(task,model,context) {
  try {
    const binding=p116dFractionFairShareBinding(task,context);
    if (!binding||!hasExactKeys(model,Object.keys(initial(task)))||!valid(task,model)||
        model.issue!==''||Object.keys(model.history).length!==model.history.length) return null;
    const placed=task.values.map(()=>null);
    const cups=[...task.values];
    let cursor=0;
    let transfers=0;
    const count=task.values.length;
    const inRange=i=>Number.isInteger(i)&&i>=0&&i<count;
    for (const event of model.history) {
      if (!hasExactKeys(event,['a','d','f'])) return null;
      if (event.a==='reset'&&hasExactKeys(event.d,[])) {
        placed.fill(null);
        cups.splice(0,count,...task.values);
        cursor=0;
        transfers=0;
      } else if (event.a==='row'&&hasExactKeys(event.d,['index'])) {
        const i=number(event.d.index);
        if (!inRange(i)||!equal(event.d.index,i)) return null;
        cursor=i;
      } else if (event.a==='dot'&&hasExactKeys(event.d,[])) {
        const tick=Math.round(number(event.f.value)*task.d);
        if (!Number.isInteger(tick)||tick<task.min||tick>task.max||!equal(event.f.value,tick,task.d)) continue;
        placed[cursor]=tick;
        const next=placed.indexOf(null);
        if (next>=0) cursor=next;
      } else if (event.a==='transfer'&&hasExactKeys(event.d,[])) {
        const from=number(event.f.from);
        const to=number(event.f.to);
        if (!sameEvidence(placed,task.values)) return null;
        if (!inRange(from)||!inRange(to)||from===to||!cups[from]||cups[to]>=task.max) continue;
        if (!equal(event.f.from,from)||!equal(event.f.to,to)) return null;
        cups[from]--;
        cups[to]++;
        transfers++;
      } else {
        return null;
      }
    }
    const total=task.values.reduce((a,b)=>a+b,0);
    if (!sameEvidence(placed,task.values)||!sameEvidence(placed,model.board.placed)||cursor!==model.board.cursor||
        !transfers||transfers!==model.board.transfers||!sameEvidence(cups,model.board.cups)||
        cups.some(cup=>cup*count!==total)||!equal(model.answers[0],total,task.d)||
        !equal(model.answers[1],total,task.d*count)) return null;
    return {...binding,placed,cups,transfers,total};
  } catch {
    return null;
  }
}

export function submittedP116DFractionFairShareEvidence(task,model,record,context) {
  return latestSubmissionMatches(model,record)?replayP116DFractionFairShareEvidence(task,model,context):null;
}
