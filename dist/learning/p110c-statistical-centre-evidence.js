import {fields,initial,number,stats,valid} from './phase5/b21-model.js';
import {rational} from './phase5/b16-model.js';
import {hasExactKeys,latestSubmissionMatches,matchesNativeEvidenceTask,sameEvidence} from './evidence-contract.js';

export const P110C_SOURCES=Object.freeze([
  {
    "sessionId": "statwords",
    "index": 0,
    "nodeId": "mt_fmm-P17Vka",
    "type": "x-statcentre",
    "taskHash": "16c55c5295f0f19b94bae151a0a0dc42766f9a2ffe4c101ba0c39f80f8719e71"
  },
  {
    "sessionId": "statwords",
    "index": 1,
    "nodeId": "mt_fmm-P17Vka",
    "type": "x-statcentre",
    "taskHash": "992c688aa55f9364094830c1eb1621ae6d59fd1d84acbaa10109c747d74ba897"
  },
  {
    "sessionId": "meanbalance",
    "index": 0,
    "nodeId": "mt_Cg8VPguS_V",
    "type": "x-statcentre",
    "taskHash": "7cd0762e78e1e0e4a74a8df33f19d3e00207116f566e39ea1170ed663bcf3dc2"
  },
  {
    "sessionId": "meanbalance",
    "index": 1,
    "nodeId": "mt_Cg8VPguS_V",
    "type": "x-statcentre",
    "taskHash": "2bbc697cf68f741137706e3a296b607be68b2326fc7b57fd6ad047f4a9641570"
  },
  {
    "sessionId": "meanbalance",
    "index": 2,
    "nodeId": "mt_Cg8VPguS_V",
    "type": "x-statcentre",
    "taskHash": "f102506b895645588b5209c2818e196acde91ad638c9e4db968df79e4786137e"
  },
  {
    "sessionId": "averagestory",
    "index": 0,
    "nodeId": "mt_XSXnTQoQ4l",
    "type": "x-statcentre",
    "taskHash": "fa6e053fba8619b9cf0f9f8ff7114a2780370f85974842c8e3f5eb67e944fc01"
  },
  {
    "sessionId": "averagestory",
    "index": 1,
    "nodeId": "mt_XSXnTQoQ4l",
    "type": "x-statcentre",
    "taskHash": "f71713eb257cd5a096c9502f5e254138d1ed02d283539af99c89cc7db6510291"
  },
  {
    "sessionId": "quartiles",
    "index": 0,
    "nodeId": "mt_KCS9GbZgU_",
    "type": "x-statcentre",
    "taskHash": "3dfe6fe3d9e229436705c20c3806ae82c6af4d5f9d55055ce296cd9a0ab4960f"
  },
  {
    "sessionId": "quartiles",
    "index": 1,
    "nodeId": "mt_KCS9GbZgU_",
    "type": "x-statcentre",
    "taskHash": "dbdb7a49fc1807fc1ff0bc2d1dc917b9b451bbe22aadd502349e7f2f360663a4"
  },
  {
    "sessionId": "quartiles",
    "index": 2,
    "nodeId": "mt_KCS9GbZgU_",
    "type": "x-statcentre",
    "taskHash": "fcc08a037977aaf0e3075f75895a8a259288188b4d2084129a21705ba11a71f7"
  }
].map(Object.freeze));

const eventFields={
  reset:[],put:[],undo:[],start:['guess'],change:[],
  transfer:['from','to','amount'],whole:['total'],missing:['value'],
};
const predictionWarning='记录改变后再比较总量与份数。最初的猜想也保留，可以看它哪里需要调整。';
const transferWarning='从一堆拿出有的数量，交给另一堆；总量保持不变。';
const sum=values=>values.reduce((total,value)=>total+value,0);

function exact(raw,n,d=1) {
  const pair=rational(raw);
  return Number.isFinite(number(raw))&&pair!==null&&BigInt(pair[0])*BigInt(d)===BigInt(n)*BigInt(pair[1]);
}
function integer(raw) {
  const value=number(raw);
  return Number.isSafeInteger(value)&&exact(raw,value)?value:null;
}
function metricMatches(raw,wanted) {
  const decimalScale=100000000;
  return exact(raw,Math.round(wanted*decimalScale),decimalScale);
}
function modeMatches(raw,modes) {
  const entries=raw.split(/[,，、\s]+/).filter(Boolean).map(integer);
  return entries.every(n=>n!==null)&&sameEvidence(entries.sort((a,b)=>a-b),modes);
}

export function p110cStatisticalCentreBinding(task,context) {
  const row=P110C_SOURCES.find(s=>s.sessionId===context?.sessionId&&s.index===context?.index);
  if (!row||!matchesNativeEvidenceTask(task,context,row)) return null;
  return {nodeId:row.nodeId,kind:'p110c-statistical-centre',method:null,
    question:'这次用了哪些记录，怎样算出中心和散开的程度？'};
}

export function replayP110CStatisticalCentreEvidence(task,model,context) {
  try {
    const binding=p110cStatisticalCentreBinding(task,context);
    if (!binding||!hasExactKeys(model,Object.keys(initial(task)))||!valid(task,model)||
        Object.keys(model.history).length!==model.history.length) return null;
    const sort=['sort','quartile'].includes(task.mode);
    const change=['change','append'].includes(task.mode);
    const allFieldKeys=Object.keys(fields(task));
    let {board}=initial(task);
    let issue='';
    for (const e of model.history) {
      if (!hasExactKeys(e,['a','d','f'])||!Object.hasOwn(eventFields,e.a)||
          !(hasExactKeys(e.f,eventFields[e.a])||hasExactKeys(e.f,allFieldKeys))||
          !hasExactKeys(e.d,e.a==='put'?['index']:[])) return null;
      const {a,f,d}=e;
      board.first[a+'-0']??=f;
      issue='';
      if (a==='reset') {
        board={...initial(task).board,first:board.first};
      } else if (a==='put'&&sort) {
        const i=task.values.findIndex((_,index)=>d.index===String(index));
        if (i<0||board.order.includes(i)) return null;
        board.order.push(i);
      } else if (a==='undo'&&sort) {
        board.order.pop();
      } else if (a==='start'&&change&&!board.started) {
        if (['up','down','same','unknown'].includes(f.guess)) board.started=true;
      } else if (a==='change'&&change&&board.started&&!board.changed) {
        const order=task.mode==='append'
          ? task.append*task.values.length-sum(task.values)
          : task.change[1]-task.values[task.change[0]];
        if (task.mode==='append') board.values.push(task.append);
        else board.values[task.change[0]]=task.change[1];
        board.changed=true;
        if (board.first['start-0'].guess!==(order>0?'up':order<0?'down':'same')) issue=predictionWarning;
      } else if (a==='transfer'&&task.mode==='level') {
        const from=integer(f.from),to=integer(f.to),amount=integer(f.amount);
        if (from===null||to===null||from===to||board.piles[from]===undefined||
            board.piles[to]===undefined||amount===null||amount<=0||
            amount>board.piles[from]||amount%(task.step||1)!==0) {
          issue=transferWarning;
        } else {
          board.piles[from]-=amount;
          board.piles[to]+=amount;
          board.moves++;
        }
      } else if ((a==='whole'||a==='missing')&&task.mode==='missing') {
        const current=number(a==='whole'?f.total:f.value);
        if (current>=0&&current<=10000) {
          if (!Number.isSafeInteger(current)) return null;
          if (a==='whole') board.total=current;
          else board.values=[...task.values,current];
        }
      } else return null;
    }
    if (issue!==model.issue||!sameEvidence(board,model.board)) return null;
    if (sort&&(board.order.length!==task.values.length||
        board.order.some((id,i)=>i>0&&task.values[board.order[i-1]]>task.values[id]))) return null;
    if (change&&!board.changed) return null;
    if (task.mode==='level'&&(!board.moves||
        board.piles.some(n=>n*board.piles.length!==sum(task.values)))) return null;
    const total=task.targetMean*task.targetCount, missing=total-sum(task.values);
    if (task.mode==='missing'&&(board.total!==total||
        board.values.length!==task.targetCount||board.values.at(-1)!==missing)) return null;
    const result={...stats(board.values),total,missing};
    if (!task.metrics.every((metric,i)=>metric==='mode'
      ? modeMatches(model.metrics[i],result.modes)
      : (metric==='mean'&&exact(model.metrics[i],result.sum,result.n))||
        metricMatches(model.metrics[i],result[metric]))) return null;
    if (!task.questions.every((q,i)=>Array.isArray(q.value)
      ? q.value.includes(model.answers[i])
      : metricMatches(model.answers[i],q.value))) return null;
    return {...binding,mode:task.mode,metrics:Object.fromEntries(task.metrics.map(key=>
      [key,key==='mode'?result.modes:result[key]])),originalCount:task.values.length,currentCount:board.values.length};
  } catch {
    return null;
  }
}

export function submittedP110CStatisticalCentreEvidence(task,model,record,context) {
  return latestSubmissionMatches(model,record)?replayP110CStatisticalCentreEvidence(task,model,context):null;
}
