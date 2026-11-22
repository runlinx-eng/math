import {initial, valid} from './phase5/b22-model.js';
import {equal} from './phase5/b16-model.js';
import {hasExactKeys, latestSubmissionMatches, matchesNativeEvidenceTask, sameEvidence} from './evidence-contract.js';

export const P112O_SOURCES = Object.freeze([
  {
    "sessionId": "chanceorder",
    "index": 0,
    "nodeId": "mt_UcGn2hjhYU",
    "type": "x-p22-order",
    "taskHash": "1c669cde9d466e18d86b51da07429d6eb296b099545c478c4db9a9a7a3ce348f"
  },
  {
    "sessionId": "chanceorder",
    "index": 2,
    "nodeId": "mt_UcGn2hjhYU",
    "type": "x-p22-order",
    "taskHash": "3a17a40c87605b2859a6c17de1ea5ef9cb65f6bad6dd4e9918dedd7b57ba4bd9"
  },
  {
    "sessionId": "chanceline",
    "index": 0,
    "nodeId": "mt_t0g2SlP404",
    "type": "x-p22-order",
    "taskHash": "b21a7b0bff21e4802ab251cfc8d180e00f63663c72661afa61e8e53193e2a073"
  },
  {
    "sessionId": "chanceline",
    "index": 2,
    "nodeId": "mt_t0g2SlP404",
    "type": "x-p22-order",
    "taskHash": "cc3cd2e1afc05d46a65b0e05b8a5e6cc65381ceef02da81d2c0c97e4193d6098"
  },
  {
    "sessionId": "chancescale",
    "index": 0,
    "nodeId": "mt_vmQJAtAFuy",
    "type": "x-p22-order",
    "taskHash": "941b3cfd61255a91c9721328d957456d10d786bd43d393f36fcdd47395aa3675"
  }
].map(Object.freeze));

export function p112oProbabilityOrderBinding(task,context) {
  const row=P112O_SOURCES.find(source=>source.sessionId===context?.sessionId&&source.index===context?.index);
  if (!row||!matchesNativeEvidenceTask(task,context,row)) return null;
  return {nodeId:row.nodeId,kind:'p112o-probability-order',method:null,question:'从不可能到一定，怎样比较表示同样机会的分数、小数和百分数？'};
}

function answersMatch(context,answers,quarters) {
  if (context.sessionId==='chanceorder') {
    return answers[0].trim()===(context.index===0 ? 'even' : 'three');
  }
  if (context.sessionId==='chanceline') {
    return context.index===2 ? answers[0].trim()==='no' :
      equal(answers[0],quarters[2],4)&&equal(answers[1],quarters[2]*25);
  }
  return equal(answers[0],quarters[0],4)&&equal(answers[1],quarters.at(-1),4);
}

export function replayP112OProbabilityOrderEvidence(task,model,context) {
  try {
    const binding=p112oProbabilityOrderBinding(task,context);
    if (!binding||!hasExactKeys(model,Object.keys(initial(task,1)))||!valid(task,model)||
        model.issue!==''||Object.keys(model.history).length!==model.history.length) return null;
    let order=[];
    for (const event of model.history) {
      if (!hasExactKeys(event,['a','f','d'])||!hasExactKeys(event.f,[])) return null;
      if (event.a==='put'&&hasExactKeys(event.d,['index'])&&/^\d+$/.test(event.d.index)) {
        const i=Number(event.d.index);
        if (i>=task.cards.length) return null;
        if (!order.includes(i)) order.push(i);
      } else if (event.a==='undo'&&hasExactKeys(event.d,[])) {
        order.pop();
      } else if (event.a==='reset'&&hasExactKeys(event.d,[])) {
        order=[];
      } else {
        return null;
      }
    }
    if (order.length!==task.cards.length||!sameEvidence(order,model.board.order)) return null;
    const quarters=order.map(i=>task.cards[i].p*4);
    if (!sameEvidence(quarters,[0,1,2,3,4])||!answersMatch(context,model.answers,quarters)) return null;
    return {...binding,order,quarters};
  } catch {
    return null;
  }
}

export function submittedP112OProbabilityOrderEvidence(task,model,record,context) {
  return latestSubmissionMatches(model,record)?replayP112OProbabilityOrderEvidence(task,model,context):null;
}
