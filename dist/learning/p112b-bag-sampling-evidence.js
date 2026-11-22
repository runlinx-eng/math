import {initial,valid} from './phase5/b22-model.js';
import {randoms} from './phase4/b04-model.js';
import {hasExactKeys,latestSubmissionMatches,matchesNativeEvidenceTask,sameEvidence} from './evidence-contract.js';

export const P112B_SOURCES=Object.freeze([Object.freeze({
  sessionId:'chanceorder',index:1,nodeId:'mt_UcGn2hjhYU',type:'x-p22-order',
  taskHash:'e32656ecc9f522a5126f9ff1c540874f859177c96672a976a47a4d9c29b4d36e',
})]);

export function p112bBagSamplingBinding(task,context) {
  const [row]=P112B_SOURCES;
  if (context?.sessionId!==row.sessionId||context?.index!==row.index||
      !matchesNativeEvidenceTask(task,context,row)) return null;
  return {nodeId:row.nodeId,kind:'p112b-bag-sampling',method:null,question:'两袋红珠的理论机会怎样比较？模拟结果为什么可能不同？'};
}

export function replayP112BBagSamplingEvidence(task,model,context) {
  try {
    const binding=p112bBagSamplingBinding(task,context);
    if (!binding||!hasExactKeys(model,Object.keys(initial(task,1)))||!valid(task,model)||
        model.issue!==''||Object.keys(model.history).length!==model.history.length) return null;
    let started=false;
    let order=[];
    let draws=[null,null];
    for (const event of model.history) {
      if (!hasExactKeys(event,['a','d','f'])) return null;
      if (event.a==='start'&&hasExactKeys(event.d,[])&&hasExactKeys(event.f,['guess'])) {
        if (['a','b','same','unknown'].includes(event.f.guess)) started=true;
        continue;
      }
      if (!hasExactKeys(event.f,[])) return null;
      if (event.a==='reset'&&hasExactKeys(event.d,[])) {
        started=false;
        order=[];
        draws=[null,null];
      } else if (event.a==='put'&&hasExactKeys(event.d,['index'])&&['0','1'].includes(event.d.index)) {
        const i=Number(event.d.index);
        if (!order.includes(i)) order.push(i);
      } else if (event.a==='undo'&&hasExactKeys(event.d,[])) {
        order.pop();
      } else if (event.a==='sample'&&hasExactKeys(event.d,['index'])&&['0','1'].includes(event.d.index)&&started) {
        const i=Number(event.d.index);
        if (draws[i]===null) {
          const seed=((model.seed+Math.imul(i+1,2654435761))>>>0)||1;
          draws[i]=randoms(seed,50,task.sampleBags[i]);
        }
      } else {
        return null;
      }
    }
    const theoretical=task.sampleBags.map(([red,other])=>[red,red+other]);
    const [[a,da],[b,db]]=theoretical;
    if (!started||!model.board.started||draws.some(sample=>sample?.length!==50)||
        !sameEvidence(draws,[model.board.drawA,model.board.drawB])||
        !sameEvidence(order,[0,1])||!sameEvidence(order,model.board.order)||a*db<=b*da||
        !sameEvidence(model.answers,['a','vary'])) return null;
    return {...binding,theoretical,observed:draws.map(sample=>sample.filter(i=>i===0).length)};
  } catch {
    return null;
  }
}

export function submittedP112BBagSamplingEvidence(task,model,record,context) {
  return latestSubmissionMatches(model,record)?replayP112BBagSamplingEvidence(task,model,context):null;
}
