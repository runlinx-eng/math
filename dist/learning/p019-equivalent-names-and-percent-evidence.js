import {initial, inspect, valid} from './phase5/b17-model.js';
import {hasExactKeys, isEvidenceContext, latestSubmissionMatches, matchesNativeEvidenceTask, sameEvidence} from './evidence-contract.js';
import {rational} from './phase5/b16-model.js';
import * as bridge from './phase5/b15-model.js';

const reviewed = [
  {
    "sessionId": "structurebridge",
    "index": 2,
    "nodeId": "mt_hImiKNiaNh",
    "type": "x-fractionbridge",
    "taskHash": "ce9ecb663338adb3635a37597a69a8daf0f120b4e8e7f153fd593a90bd8cde9c",
    "task": {
      "type": "x-fractionbridge",
      "prompt": "先在八等份中涂出一份，再把另一条涂到同样长。用它与同一整体的12%比较。"
    }
  },
  {
    "sessionId": "percentpatterns",
    "index": 2,
    "nodeId": "mt_jCy07DyBNU",
    "type": "x-percentkit",
    "taskHash": "fdae73853ee5b7f5ddd60ac795911b485d073c2885b45fde146898037a34c068",
    "task": {
      "type": "x-percentkit",
      "total": 80,
      "percent": 35,
      "prompt": "80元的35%：先分出10%和5%，再自己选这些小块来拼。"
    }
  },
  {
    "sessionId": "percentpatterns",
    "index": 3,
    "nodeId": "mt_jCy07DyBNU",
    "type": "x-percentkit",
    "taskHash": "8fbd0cdbf217a4e9a34bc5a2122859384d785c07810f0f92a3a4c65fdb813cbe",
    "task": {
      "type": "x-percentkit",
      "total": 140,
      "percent": 65,
      "prompt": "整体变成140元，这次要65%。还是同样比例的小块，金额怎样跟着变？"
    }
  },
  {
    "sessionId": "thousandparts",
    "index": 0,
    "nodeId": "mt_kdWoAel3Zl",
    "type": "x-decimalzoom",
    "taskHash": "d1140a61638e89924248c36620c89a69e6ce3b012b297227e0c58c93188cefd2",
    "task": {
      "type": "x-decimalzoom",
      "n": 25,
      "prompt": "放大0到0.1，再放大里面合适的一小段，把0.025放到准确位置。"
    }
  },
  {
    "sessionId": "thousandparts",
    "index": 2,
    "nodeId": "mt_kdWoAel3Zl",
    "type": "x-decimalzoom",
    "taskHash": "e9367693fee148e0c1a9d5c7ed1df6dde1bfad898a9e71b8658e142513561f39",
    "task": {
      "type": "x-decimalzoom",
      "n": 345,
      "prompt": "在0.34与0.35里面找0.345。两次放大后，一小步占原单位的多少？"
    }
  },
  {
    "sessionId": "thousandparts",
    "index": 3,
    "nodeId": "mt_kdWoAel3Zl",
    "type": "x-decimalzoom",
    "taskHash": "64087149fa058a2cf71aaec84fb0559d77fcbd76eff544ee0f4b205719d60743",
    "task": {
      "type": "x-decimalzoom",
      "n": 347,
      "prompt": "换成0.347，仍然从原来的0到1进入合适的间隔。"
    }
  },
  {
    "sessionId": "fdpswitch",
    "index": 1,
    "nodeId": "mt_4K1dr204Hi",
    "type": "x-fdprecall",
    "taskHash": "f9e2b3260237605522ff0fcbb193271bf35467257b64cf6a5c5fff87ab55b0f6",
    "task": {
      "type": "x-fdprecall",
      "prompt": "先不看图，给1/5、1/4、1/10分别写出小数与百分数名字。",
      "cases": [
        [
          1,
          5
        ],
        [
          1,
          4
        ],
        [
          1,
          10
        ]
      ]
    }
  },
  {
    "sessionId": "pctCalculate37",
    "index": 0,
    "nodeId": "mt_PNSyfH56eQ",
    "type": "x-percentkit",
    "taskHash": "afcdd50babb22c746c1196829ad3abeb5089a0f403f9a36bfb44db9a84ad49e5",
    "task": {
      "type": "x-percentkit",
      "total": 360,
      "percent": 15,
      "prompt": "整体360元。先分出10%和5%，再把它们拼成15%。"
    }
  },
  {
    "sessionId": "pctCalculate37",
    "index": 2,
    "nodeId": "mt_PNSyfH56eQ",
    "type": "x-percentkit",
    "taskHash": "374ed2ca9fbee0e42c6821e53736ad963e964bb1a96c736aa8aea28391885805",
    "task": {
      "type": "x-percentkit",
      "total": 140,
      "percent": 35,
      "prompt": "换一个整体140元，自己用10%和5%拼出35%。"
    }
  }
];
export const P019_SOURCES = Object.freeze(reviewed.map(({task, ...source}) => Object.freeze(source)));
export function p019EquivalentNamesAndPercentBinding(task, context) {
  if (!isEvidenceContext(context)) return null;
  const entry = reviewed.find(source => source.sessionId === context.sessionId && source.index === context.index);
  if (!entry || !sameEvidence(task, entry.task) || !matchesNativeEvidenceTask(task, context, entry)) return null;
  return {nodeId:entry.nodeId, kind:'p019-equivalent-names-and-percent', method:null, question:"换成小数、百分数或分数以后，如何检查表示的是同一个量？"};
}
export function replayP019EquivalentNamesAndPercentEvidence(task, model, context) {
  try {
    const binding = p019EquivalentNamesAndPercentBinding(task, context);
    if (binding && task.type === 'x-fractionbridge') return bridgeEvidence(task,model,binding);
    if (!binding || !hasExactKeys(model, Object.keys(initial(task))) || !valid(task, model) ||
        model.issue !== '' || !model.history.length || Object.keys(model.history).length !== model.history.length) return null;
    const fields = Object.keys(initial(task)).filter(key => !['board','history','issue'].includes(key));
    const board = initial(task).board;
    const equal = (raw, n, d=1) => {
      const value = rational(raw.trim().replace(/\s*\/\s*/g,'/'));
      return value && BigInt(value[0])*BigInt(d) === BigInt(n)*BigInt(value[1]);
    };
    let issue = false;
    for (const event of model.history) {
      if (!hasExactKeys(event,['a','d','f']) || !hasExactKeys(event.f,fields)) return null;
      const {a,d,f} = event;
      issue = false;
      if (a === 'reset' && hasExactKeys(d,[])) {
        Object.assign(board,{...initial(task).board,first:board.first});
      } else if (task.type === 'x-decimalzoom') {
        if (!hasExactKeys(d,['index']) || !/^\d+$/.test(d.index)) return null;
        const index = Number(d.index);
        if (a === 'zoom' && index < 10 && board.span > 10) {
          board.first ??= index;
          board.span /= 10;
          board.lo += board.span*index;
          board.levels.push(index);
          board.mark = null;
        } else if (a === 'mark' && index <= 10) board.mark = board.lo + board.span*index/10;
        else return null;
      } else if (task.type === 'x-percentkit') {
        if (a === 'tenth' && hasExactKeys(d,[])) {
          board.first ??= f.amount;
          if (equal(f.amount,task.total,10)) board.tenth = f.amount;
          else issue = true;
        } else if (a === 'fifth' && hasExactKeys(d,[]) && board.tenth !== null) {
          if (equal(f.amount,task.total,20)) board.fifth = f.amount;
          else issue = true;
        } else if (a === 'piece' && hasExactKeys(d,['value']) && ['5','10'].includes(d.value) && board.fifth !== null) {
          const piece = Number(d.value);
          if (board.pieces.reduce((sum,value) => sum+value,0)+piece <= 100) board.pieces.push(piece);
        } else return null;
      } else if (a === 'recall' && hasExactKeys(d,[]) && board.index < task.cases.length) {
        const [n,den] = task.cases[board.index];
        board.first[board.index] ??= [f.decimal,f.percent];
        if (!equal(f.decimal,n,den) || !equal(f.percent,n*100,den)) issue = true;
        else {
          board.records.push({fraction:[n,den],decimal:f.decimal,percent:f.percent,first:board.first[board.index]});
          board.index++;
        }
      } else return null;
    }
    if (issue || !sameEvidence(board,model.board) || !inspect(task,model).correct) return null;
    if (task.type === 'x-decimalzoom') {
      if (board.levels.length !== 2 || board.mark !== task.n || !equal(model.decimal,task.n,1000) ||
          !equal(model.fraction,task.n,1000) || !equal(model.answer,1,1000)) return null;
      return {binding, thousandths:board.mark, levels:board.levels};
    }
    if (task.type === 'x-percentkit') {
      const percent = board.pieces.reduce((sum,value) => sum+value,0);
      if (board.tenth === null || board.fifth === null || percent !== task.percent ||
          !equal(model.percent,percent) || !equal(model.answer,task.total*percent,100) || model.reason !== 'same-total') return null;
      return {binding, percent, amount:task.total*percent/100, pieces:board.pieces};
    }
    return board.index === task.cases.length ? {binding, recall:board.records} : null;

  } catch {
    return null;
  }
}
export function submittedP019EquivalentNamesAndPercentEvidence(task, model, record, context) {
  return latestSubmissionMatches(model, record) ? replayP019EquivalentNamesAndPercentEvidence(task, model, context) : null;
}

function bridgeEvidence(task, model, binding) {
  const initial = bridge.initial(task);
  if (!hasExactKeys(model,Object.keys(initial)) || !bridge.valid(task,model) ||
      !model.history.length || Object.keys(model.history).length !== model.history.length || model.issue !== '') return null;
  const fields = Object.keys(initial).filter(key => !['board','history','issue','inner'].includes(key));
  const selected = new Set();
  for (const event of model.history) {
    if (!hasExactKeys(event,['action','data']) || !hasExactKeys(event.data,['fields','index','value']) ||
        !hasExactKeys(event.data.fields,fields) || event.data.value !== null) return null;
    if (event.action === 'b15-reset' && event.data.index === null) {
      selected.clear();
    } else if (event.action === 'b15-fraction' && Number.isInteger(event.data.index) && event.data.index >= 0 && event.data.index < 8) {
      if (!selected.delete(event.data.index)) selected.add(event.data.index);
    } else return null;
  }
  const exact = (text, numerator, denominator=1) => {
    const value = rational(String(text).trim());
    return value && BigInt(value[0])*BigInt(denominator) === BigInt(numerator)*BigInt(value[1]);
  };
  if (selected.size !== 1 || !sameEvidence({selected:[...selected]},model.board) ||
      !exact(model.thousandths,125) || !exact(model.percent,25,2) || model.answer !== 'greater' ||
      model.reason !== 'same' || !bridge.inspect(task,model).correct) return null;
  return {binding, thousandths:125, percent:12.5, comparePercent:12};
}
