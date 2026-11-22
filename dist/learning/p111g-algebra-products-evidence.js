import {polyEqual, initial, valid} from './phase5/b35-model.js';
import {hasExactKeys, latestSubmissionMatches, matchesNativeEvidenceTask, sameEvidence} from './evidence-contract.js';


export const P111G_SOURCES = Object.freeze([
  {
    "sessionId": "equations35",
    "index": 1,
    "nodeId": "mt_QhFEDyIwSO",
    "type": "x-a35-grid",
    "taskHash": "8e698895ebcb9a2a749afe3787fdbef807dd22c6a01a467c4f15f362ec6ac4e3"
  },
  {
    "sessionId": "expand35",
    "index": 0,
    "nodeId": "mt_FX4a2Q8XXN",
    "type": "x-a35-grid",
    "taskHash": "1b8fcf02af233f83e76e6c52fd4b219cd0de9178f047d652dcb193dc92cb0c15"
  },
  {
    "sessionId": "expand35",
    "index": 1,
    "nodeId": "mt_FX4a2Q8XXN",
    "type": "x-a35-grid",
    "taskHash": "ceec78c2f7b637f08b83ebc26f82416fb5318f344ee4e054e9882f97de029471"
  },
  {
    "sessionId": "expand35",
    "index": 2,
    "nodeId": "mt_FX4a2Q8XXN",
    "type": "x-a35-grid",
    "taskHash": "103e87721a7b69950747e4199b732a6748f2d1863e53968fdfa93da431d3c10b"
  },
  {
    "sessionId": "double35",
    "index": 0,
    "nodeId": "mt_KhS7K1Mgrw",
    "type": "x-a35-grid",
    "taskHash": "b1302429f763381657e7e2c7d2b075598bcc5b1c80f8f421d55d73e0d50337f1"
  },
  {
    "sessionId": "double35",
    "index": 1,
    "nodeId": "mt_KhS7K1Mgrw",
    "type": "x-a35-grid",
    "taskHash": "d815e48276a4d5e6f16c8414eff6671521708670ec332434ce01d966d4243539"
  },
  {
    "sessionId": "double35",
    "index": 2,
    "nodeId": "mt_KhS7K1Mgrw",
    "type": "x-a35-grid",
    "taskHash": "95c4420f1ab9e2b4018f29827648e3f51a088e5f0e97d6045d8a1bac7c8498b6"
  }
].map(Object.freeze));

export function p111gAlgebraProductsBinding(task,context) {
  const row=P111G_SOURCES.find(source=>source.sessionId===context?.sessionId&&source.index===context?.index);
  if (!row||!matchesNativeEvidenceTask(task,context,row)) return null;
  return {nodeId:row.nodeId,kind:'p111g-algebra-products',method:null,question:'哪一行和哪一列相乘得到这一格？哪些项可以合并？'};
}

function format(coefficients) {
  const parts=coefficients.flatMap((coefficient,power)=>{
    if (!coefficient) return [];
    const magnitude=Math.abs(coefficient);
    const variable=['','x','x^2'][power];
    return [(coefficient<0?'-':'+')+(variable&&magnitude===1?'':String(magnitude))+variable];
  });
  return parts.reverse().join('').replace(/^\+/,'')||'0';
}

export function replayP111GAlgebraProductsEvidence(task,model,context) {
  try {
    const binding=p111gAlgebraProductsBinding(task,context);
    if (!binding||!hasExactKeys(model,Object.keys(initial(task)))||!valid(task,model)||
        model.issue!==''||Object.keys(model.history).length!==model.history.length) return null;
    const products=task.rows.flatMap(row=>task.cols.map(col=>({
      coefficient:row.c*col.c,power:Number(row.k==='x')+Number(col.k==='x'),
    })));
    const expressions=products.map(({coefficient,power})=>{
      const term=[0,0,0];
      term[power]=coefficient;
      return format(term);
    });
    const cells=products.map(()=>'');
    for (const event of model.history) {
      if (!hasExactKeys(event,['a','i','v','w','z','k'])||event.a!=='cell'||!/^\d+$/.test(event.i)) return null;
      const i=Number(event.i);
      if (i>=cells.length) return null;
      if (polyEqual(event.v,expressions[i])) cells[i]=event.v;
    }
    if (!cells.every(Boolean)||!sameEvidence(cells,model.board.cells)) return null;
    const coefficients=[0,task.extra==='+x'?1:0,0];
    for (const {coefficient,power} of products) coefficients[power]+=coefficient;
    const simplified=format(coefficients);
    if (!polyEqual(model.answers[0],simplified,{simplified:true})) return null;
    return {...binding,cells:expressions,simplified};
  } catch {
    return null;
  }
}

export function submittedP111GAlgebraProductsEvidence(task,model,record,context) {
  return latestSubmissionMatches(model,record)?replayP111GAlgebraProductsEvidence(task,model,context):null;
}
