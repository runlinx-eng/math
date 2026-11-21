import {initial, inspect, valid} from './phase5/b14-model.js';
import {
  hasExactKeys,
  isEvidenceContext,
  latestSubmissionMatches,
  matchesNativeEvidenceTask,
  sameEvidence
} from './evidence-contract.js';

const sessionId = 'parityrules';
const nodeId = 'mt_oxfxzbat3k';
const type = 'x-parityjoin';
const reviewed = [
  {
    taskHash:'df3acebdef9bd0750dc206d19b9552d9f1358c5f2745beb8120818e551132736',
    task:{type,a:5,b:7,op:'+',prompt:'两堆各有一颗落单的。先猜合起来怎样，再把它们配好。'}
  },
  {
    taskHash:'2c4de894dec640f76fde3af88df4537aef5092d837a216ec9dd7ff6fa657a27d',
    task:{type,a:347,b:129,op:'+',prompt:'不先算总和，判断347+129会不会有落单的。看看两堆各剩下什么。'}
  },
  {
    taskHash:'4e03f029f1ab74ee71b5aed0997942317491f67d071c30fed873057badd6a599',
    task:{type,a:6,b:37,op:'×',prompt:'6份37个，不先算总数。把整份两两作伴，看看剩不剩一份。'}
  },
  {
    taskHash:'de43b766ddb96e3e681afe3b1c411c9b38ec789d20e00575564cd5d7254cb158',
    task:{type,a:9,b:8,op:'+',prompt:'换成一奇一偶，刚才的办法还会把所有颗粒配好吗？'}
  }
];

export const P089_SOURCES = Object.freeze(reviewed.map(({taskHash},index) =>
  Object.freeze({sessionId,index,nodeId,type,taskHash})
));

export function p089ParityPairingBinding(task,context) {
  if (!isEvidenceContext(context) || context.sessionId !== sessionId ||
      !sameEvidence(task,reviewed[context.index]?.task) ||
      !matchesNativeEvidenceTask(task,context,{type,nodeId})) return null;
  return {nodeId,kind:'p089-parity-pairing',method:null,question:task.op === '+'
    ? '两堆各有几颗落单？把落单的放在一起，还剩几颗？'
    : '两份里的同一位置怎样作伴？整份两两作伴后，还剩下一份吗？'};
}

function pairing({a,b,op}) {
  if (op === '×') {
    const groupPairs = a/2;
    return {groupPairs,perGroup:b,totalPairs:groupPairs*b,leftovers:0,reason:'whole'};
  }
  const piles = [a,b].map(amount => ({pairs:Math.floor(amount/2),leftover:amount%2}));
  const unpacked = piles[0].leftover + piles[1].leftover;
  const extraPairs = Math.floor(unpacked/2);
  return {piles,extraPairs,totalPairs:piles[0].pairs + piles[1].pairs + extraPairs,
    leftovers:unpacked%2,reason:['none','one','two'][unpacked]};
}

export function replayP089ParityPairingEvidence(task,model,context) {
  try {
    const binding = p089ParityPairingBinding(task,context);
    if (!binding || !hasExactKeys(model,Object.keys(initial(task))) || !valid(task,model) ||
        model.issue !== '' || !model.history.length ||
        Object.keys(model.history).length !== model.history.length) return null;

    let prediction = null;
    let joined = false;
    let resets = 0;
    const actions = [];
    for (const {action,data} of model.history) {
      if (data.index !== null || data.side !== null || data.value !== null) return null;
      if (action === 'b14-predict' && !prediction) {
        const raw = data.fields.prediction;
        if (!['','even','odd'].includes(raw)) return null;
        prediction = raw || null;
        actions.push({action,prediction,accepted:prediction !== null});
      } else if (action === 'b14-join' && prediction && !joined) {
        joined = true;
        actions.push({action});
      } else if (action === 'b14-reset') {
        joined = false;
        resets++;
        actions.push({action});
      } else {
        return null;
      }
    }

    if (!joined || model.board.joined !== true || model.board.first !== prediction ||
        model.prediction !== prediction) return null;
    const facts = pairing(task);
    const answer = facts.leftovers ? 'odd' : 'even';
    if (model.answer !== answer || model.reason !== facts.reason || !inspect(task,model).correct) return null;
    return {binding,prediction,predictionAgrees:prediction === answer,answer,...facts,actions,resets};
  } catch {
    return null;
  }
}

export function submittedP089ParityPairingEvidence(task,model,record,context) {
  if (!latestSubmissionMatches(model,record)) return null;
  return replayP089ParityPairingEvidence(task,model,context);
}
