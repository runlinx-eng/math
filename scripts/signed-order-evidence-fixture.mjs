// #339: deterministic audit fixture uses original signed B08 actions, not a seeded history.
import {createHash} from 'node:crypto';
import * as M from '../dist/learning/phase5/b08-model.js';
import {signedOrderBinding} from '../dist/learning/signed-order-evidence.js';
const TASK_SHA='0deadc9a3d0aac1cdf6206a515848e9642f08d687f6d8e4b730d70aae64c859c';
const stable=x=>Array.isArray(x)?x.map(stable):x&&typeof x==='object'?
 Object.fromEntries(Object.keys(x).sort().map(k=>[k,stable(x[k])])):x;
export function signedOrderEvidenceExample(task,context={}){
 const actual=createHash('sha256').update(JSON.stringify(stable(task))).digest('hex');
 if(context.sessionId!=='tenmillion'||context.index!==1||actual!==TASK_SHA||
  !signedOrderBinding(task,context))throw Error('Not the frozen native signed-order source');
 const model=M.initial(task);
 const order=task.values.map((v,index)=>({v:BigInt(v),index}))
  .sort((a,b)=>a.v<b.v?-1:a.v>b.v?1:0);
 for(const {index} of order)M.act(task,model,'wide-order',{index});
 for(let index=0;index<task.values.length;index++){
  model.positions[index]=Math.round((Number(task.values[index])-task.min)/(task.max-task.min)*1000);
  M.field(task,model,'positions.'+index);
 }
 if(!M.valid(task,model)||!M.inspect(task,model).correct)
  throw Error('Original signed order grader refused fixture actions');
 return model;
}
