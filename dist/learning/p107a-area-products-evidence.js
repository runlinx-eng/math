import {initial, number, valid} from './phase5/b14-model.js';
import {hasExactKeys, latestSubmissionMatches, matchesNativeEvidenceTask, sameEvidence} from './evidence-contract.js';

export const P107A_SOURCES = Object.freeze([
  {
    "sessionId": "largerfacts",
    "index": 0,
    "nodeId": "mt_8A3pZNOp7Z",
    "type": "x-areaproduct",
    "taskHash": "591026b38d52b774e1a3289c2bf11e9178eb1dc9c11e960e1689d97cc5fbb2ea"
  },
  {
    "sessionId": "largerfacts",
    "index": 1,
    "nodeId": "mt_8A3pZNOp7Z",
    "type": "x-areaproduct",
    "taskHash": "ed2dc02f1d456d845765b4c81a431b3e052d260de4922b5ac742507a75454cd0"
  },
  {
    "sessionId": "writtenstart",
    "index": 0,
    "nodeId": "mt_DyGBW3ZHh3",
    "type": "x-areaproduct",
    "taskHash": "1a6dcd3e5c36624a268981a123be68b5368c33a1d79c77f42a79b23df5e2b08a"
  },
  {
    "sessionId": "longproduct",
    "index": 2,
    "nodeId": "mt_q9EaJc2FP8",
    "type": "x-areaproduct",
    "taskHash": "b87f5b78ca6bd987300746cd885724bce804a730ddefb85d37a0d0ae9bed63ca"
  },
  {
    "sessionId": "decimalproduct",
    "index": 2,
    "nodeId": "mt_SoDP1fSQEB",
    "type": "x-areaproduct",
    "taskHash": "ffc0ea216ee83ea53525e160a5012c9f083642d2e616e9fa76ac3bacc3c91304"
  },
  {
    "sessionId": "mentalchoices",
    "index": 0,
    "nodeId": "mt_vmW2cb5c7A",
    "type": "x-areaproduct",
    "taskHash": "13580d87a5587378d3e1e80a8f27e620d2d05fb3e5a769c53a891e529a2f1832"
  },
  {
    "sessionId": "combineproducts",
    "index": 0,
    "nodeId": "mt_AR-K72OIIO",
    "type": "x-areaproduct",
    "taskHash": "2922a2a328d419550bd9c1e130d8b86ed95ff1dbe687a2bf724a10cc32edfa25"
  },
  {
    "sessionId": "modelrecipe",
    "index": 0,
    "nodeId": "mt_K3R0yaHVcx",
    "type": "x-areaproduct",
    "taskHash": "3dba29ecc8254b08178281e156f6cde8a1a9245ad70e462a5dc6d54bccbaf415"
  },
  {
    "sessionId": "translateamount",
    "index": 1,
    "nodeId": "mt_3VmBdlAeOZ",
    "type": "x-areaproduct",
    "taskHash": "08ae045d0d726879d652f82115094c8f91c36d90d56f95739bfdd338440e583f"
  },
  {
    "sessionId": "structure39",
    "index": 0,
    "nodeId": "mt__Itf4aQZUj",
    "type": "x-areaproduct",
    "taskHash": "39f6a5cf05b613d211f3d0482378110a02ae812ee12f0722ecc4b92b2e018172"
  }
].map(Object.freeze));

export function p107aAreaProductsBinding(task, context) {
  const source = P107A_SOURCES.find(row => row.sessionId === context?.sessionId && row.index === context?.index);
  if (!source || !matchesNativeEvidenceTask(task,context,source)) return null;
  return {nodeId:source.nodeId,kind:'p107a-area-products',method:null,question:'两个边长怎样拆？每块面积加起来为什么等于整个长方形？'};
}

function nativeCut(task,x,y) {
  if (!Number.isInteger(x) || !Number.isInteger(y) || x < 1 || x > task.a || y < 1 || y > task.b) return false;
  if (task.a === 7 && task.b === 15) return y === 5 || y === 10;
  if (task.a === 23 && task.b === 4) return x === 3 || x === 20;
  if (task.a === 45 && task.b === 23) return [5,40].includes(x) && [3,20].includes(y);
  return true;
}

function matchesRequestedSplit(task,[x,y],parts) {
  if (task.a === 40 && task.b === 60) return parts.length === 4;
  if (task.a === 45 && task.b === 23) return parts.length === 4;
  if (parts.length !== 2) return false;
  if (task.a === 456) return x === 400 || x === 56;
  if (task.a === 14) return x === 10 || x === 4;
  if (task.a === 7) return y < task.b;
  if (task.a === 6) return true;
  return x < task.a;
}

export function replayP107AAreaProductsEvidence(task, model, context) {
  try {
    const binding = p107aAreaProductsBinding(task,context);
    if (!binding || !hasExactKeys(model,Object.keys(initial(task))) || !valid(task,model) ||
        model.issue !== '' || Object.keys(model.history).length !== model.history.length) return null;
    let cuts = null;
    let parts = [];
    let values = [];
    for (const {action,data} of model.history) {
      if (data.index !== null || data.side !== null || data.value !== null) return null;
      const {fields} = data;
      if (action === 'b14-reset') {
        cuts = null;
        parts = [];
        values = [];
      } else if (action === 'b14-cut') {
        const x = number(fields.cutA);
        const y = number(fields.cutB);
        if (!nativeCut(task,x,y)) continue;
        cuts = [x,y];
        parts = [x,task.a-x].flatMap((a,i) => [y,task.b-y].flatMap((b,j) =>
          a && b ? [{a,b,side:[i,j]}] : []));
        values = [];
      } else if (action === 'b14-part') {
        const part = parts[values.length];
        if (!part || !sameEvidence(cuts,[number(fields.cutA),number(fields.cutB)])) continue;
        const area = part.a*part.b;
        if (number(fields.part) === area) values.push(area);
      } else {
        return null;
      }
    }
    if (!cuts || !matchesRequestedSplit(task,cuts,parts) ||
        !sameEvidence({cuts,parts,values},model.board) || !sameEvidence(cuts,[number(model.cutA),number(model.cutB)]) ||
        values.length !== parts.length || number(model.answer) !== values.reduce((a,b)=>a+b,0) ||
        number(model.answer) !== task.a*task.b) return null;
    if (task.a === 40 && task.b === 60 && number(model.base) !== (task.a/10)*(task.b/10)) return null;
    return {...binding,cuts,partialProducts:values,totalUnits:task.a*task.b,unitsPerWhole:task.a === 456 ? 100 : 1};
  } catch {
    return null;
  }
}

export function submittedP107AAreaProductsEvidence(task, model, record, context) {
  return latestSubmissionMatches(model,record) ? replayP107AAreaProductsEvidence(task,model,context) : null;
}
