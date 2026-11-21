import {initial, inspect, valid} from './phase5/b15-model.js';
import {hasExactKeys, isEvidenceContext, latestSubmissionMatches, matchesNativeEvidenceTask, sameEvidence} from './evidence-contract.js';
const reviewed = [
  {
    "sessionId": "undocalc",
    "index": 0,
    "nodeId": "mt_VUQNveSYjQ",
    "type": "x-undolab",
    "taskHash": "448bf3074a184465295fb715c35d4a7f89a12f4112a81ace58ec156bd3b347f4",
    "task": {
      "type": "x-undolab",
      "start": 17,
      "forward": [
        {
          "op": "+",
          "amount": 8
        }
      ],
      "end": 25,
      "prompt": "17先增加8。把最后的变化撤回，检查加与减的关系。",
      "absolute": false
    }
  },
  {
    "sessionId": "undocalc",
    "index": 1,
    "nodeId": "mt_VUQNveSYjQ",
    "type": "x-undolab",
    "taskHash": "4a7c6decf0f04abc1f75eb45ed0a231c292f0671c12861e8fbc85c5fbe1499ef",
    "task": {
      "type": "x-undolab",
      "start": 5,
      "forward": [
        {
          "op": "*",
          "amount": 3
        },
        {
          "op": "+",
          "amount": 2
        }
      ],
      "end": 17,
      "prompt": "5先取3份，再添2。现在从终点出发，自己挑怎样走回去。",
      "absolute": false
    }
  },
  {
    "sessionId": "undocalc",
    "index": 2,
    "nodeId": "mt_VUQNveSYjQ",
    "type": "x-undolab",
    "taskHash": "fde5bdd28bdd0755b87a1a591f2435bb4aa9c1fe7ea5eaafa95d5b4076f846d4",
    "task": {
      "type": "x-undolab",
      "start": 13,
      "forward": [
        {
          "op": "*",
          "amount": 12
        }
      ],
      "end": 156,
      "prompt": "13份12合成156。走回去找一份，再想156÷13为什么也能检查这组关系。",
      "absolute": false
    }
  },
  {
    "sessionId": "undocalc",
    "index": 3,
    "nodeId": "mt_VUQNveSYjQ",
    "type": "x-undolab",
    "taskHash": "dcb073574c017a24db8c06deae90fe8bdfe57d8a82d69e522d361876e5c37dbc",
    "task": {
      "type": "x-undolab",
      "start": 7,
      "forward": [
        {
          "op": "square"
        }
      ],
      "end": 49,
      "prompt": "边长7铺成正方形。知道面积后，怎样走回非负的边长？",
      "absolute": false
    }
  },
  {
    "sessionId": "undocalc",
    "index": 4,
    "nodeId": "mt_VUQNveSYjQ",
    "type": "x-undolab",
    "taskHash": "6679a2427a972b44bd4f64fad408b44f7cd1db2437296e9d7153f5d0dd1efb14",
    "task": {
      "type": "x-undolab",
      "start": -3,
      "forward": [
        {
          "op": "square"
        }
      ],
      "end": 9,
      "prompt": "从−3先平方，再取非负平方根。这次会回到−3吗？",
      "absolute": true
    }
  }
];
export const P009D_SOURCES = Object.freeze(reviewed.map(({task,...source})=>Object.freeze(source)));
export function p009dInverseCalculationBinding(task,context) {
  if (!isEvidenceContext(context)) return null;
  const row = reviewed.find(entry=>entry.sessionId===context.sessionId && entry.index===context.index);
  if (!row || !sameEvidence(row.task,task) || !matchesNativeEvidenceTask(task,context,row)) return null;
  return {nodeId:row.nodeId,kind:'p009d-inverse-calculation',method:null,question:"撤回时为什么从最后一次运算开始？"};
}
export function replayP009DInverseCalculationEvidence(task,model,context) {
  try {
    const binding=p009dInverseCalculationBinding(task,context);
    if (!binding || !hasExactKeys(model,Object.keys(initial(task))) || !valid(task,model) ||
        model.issue!=='' || !model.history.length || Object.keys(model.history).length!==model.history.length) return null;
    const actions={'+':'-','-':'+','*':'/','/':'*',square:'sqrt'};
    const plan=[...task.forward].reverse().map(step=>({op:actions[step.op],amount:step.amount}));
    const fields=Object.keys(initial(task)).filter(key=>!['history','board','issue'].includes(key));
    const number=raw=>/^[+-]?\d{1,10}(?:\.\d{1,8})?$/.test(raw.trim())?Number(raw):null;
    let steps=[], value=task.end, rejected=0, issue=false;
    for (const event of model.history) {
      if (!hasExactKeys(event,['action','data'])||!hasExactKeys(event.data,['fields','index','value'])||
          !hasExactKeys(event.data.fields,fields)||event.data.index!==null||event.data.value!==null) return null;
      issue=false;
      if (event.action==='b15-reset') {
        steps=[];
        value=task.end;
        continue;
      }
      if (event.action!=='b15-undo-step') return null;
      const step=plan[steps.length];
      if (!step) continue;
      const {operator,result,amount:raw}=event.data.fields;
      const amount=number(raw);
      const expected=step.op==='sqrt'?Math.sqrt(value):step.op==='-'?value-step.amount:value/step.amount;
      if (operator!==step.op||(step.op!=='sqrt'&&amount!==step.amount)||number(result)!==expected) {
        rejected++;
        issue=true;
        continue;
      }
      steps.push({before:value,op:operator,amount:amount??0,value:expected});
      value=expected;
    }
    const expected=task.absolute?Math.abs(task.start):task.start;
    if (issue||steps.length!==plan.length||value!==expected||number(model.answer)!==expected||
        (task.absolute&&model.reason!=='nonnegative')||!sameEvidence({value,steps},model.board)||!inspect(task,model).correct) return null;
    return {binding,value,steps,rejected};
  } catch {
    return null;
  }
}
export function submittedP009DInverseCalculationEvidence(task,model,record,context) {
  return latestSubmissionMatches(model,record) ? replayP009DInverseCalculationEvidence(task,model,context) : null;
}
