// #337: fixture uses only original B08 selection actions and final input fields.
import {createHash} from 'node:crypto';
import * as M from '../dist/learning/phase5/b08-model.js';
import {positiveOrderBinding} from '../dist/learning/positive-order-evidence.js';
const HASH=Object.freeze({
 'bigcompare:2':'3af8e623611e2f89e1e0aa354e1f023203a77fd200f5ceee9381967878a05639',
 'sixdigits:2':'15c65015c8abb99241d30bb8ffff1bf16ea6ba529c114a612ffd664acce484ea',
 'millionwords:1':'f4b80d951ea72967caa1de4041a4aa113cd4d7d1d69d56ab59fb6ecbb1278e38'
});
const stable=x=>Array.isArray(x)?x.map(stable):x&&typeof x==='object'?
 Object.fromEntries(Object.keys(x).sort((a,b)=>a.localeCompare(b,'en')).map(k=>[k,stable(x[k])])):x;
export function positiveOrderEvidenceExample(task,context={}){
 const expected=HASH[context.sessionId+':'+context.index];
 const actual=createHash('sha256').update(JSON.stringify(stable(task))).digest('hex');
 if(!expected||actual!==expected||!positiveOrderBinding(task,context))
  throw Error('Not an exact reviewed positive integer order task');
 const model=M.initial(task);
 const sorted=task.values.map((v,index)=>({n:BigInt(v),index}))
  .sort((a,b)=>a.n<b.n?-1:a.n>b.n?1:0);
 for(const {index} of sorted)M.act(task,model,'wide-order',{index});
 for(let i=0;i<task.values.length;i++){
  model.positions[i]=Math.round((Number(task.values[i])-task.min)/(task.max-task.min)*1000);
  M.field(task,model,'positions.'+i);
 }
 if(!M.valid(task,model)||!M.inspect(task,model).correct)
  throw Error('Original native card actions failed B08 grading');
 return model;
}
