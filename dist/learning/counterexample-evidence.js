// Source-bound, strict mathematical observations for two native counterexample tasks.
// Does not change B38 grading or evaluate learner explanations.
import * as reason from './phase5/b38-model.js';
import {rational} from './phase5/b16-model.js';
import {isEvidenceContext,matchesNativeEvidenceTask} from './evidence-contract.js';

const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const shape=(o,keys)=>o&&typeof o==='object'&&!Array.isArray(o)&&same(Object.keys(o).sort(),[...keys].sort());
const SOURCES=Object.freeze({
  3:{nodeId:'mt_j5YqQnN6xe',rule:'strict',question:'一个大于0的数，乘1后真的会变大吗？乘小于1的正数呢？先猜，再亲自比较。'},
  4:{nodeId:'mt_j5YqQnN6xe',rule:'nonstrict',question:'如果把“总会变大”改成“总不会变小”，乘1还能作反例吗？试试0与小于1的乘数。'}
});
export function counterexampleBinding(task,context={}){
 if(!isEvidenceContext(context))return null;
 const source=Object.hasOwn(SOURCES,context.index)?SOURCES[context.index]:null;
 if(context.sessionId!=='argument38'||!Number.isInteger(context.index)||!source||task?.type!=='x-r38-counterexample'||
    task.rule!==source.rule||
    !matchesNativeEvidenceTask(task,context,{type:'x-r38-counterexample',nodeId:source.nodeId}))return null;
 return source;
}
const fraction=raw=>{
 if(typeof raw!=='string')return null;
 const a=rational(raw.trim());
 return a&&a[1]>0&&a.every(Number.isSafeInteger)?a:null;
};
const cmp=(a,b)=>BigInt(a[0])*BigInt(b[1])-BigInt(b[0])*BigInt(a[1]);
// B38 keeps the first request, failed input requests, and actual comparisons
// whose prediction was wrong. Recompute these separately; the final matched
// counterexample does not turn an earlier wrong prediction into a success.
export function replayCounterexampleEvidence(task,model){
 try{
  if(task?.type!=='x-r38-counterexample'||!['strict','nonstrict'].includes(task.rule)||
     !model||!Array.isArray(model.history)||!model.history.length||model.history.length>1500||
     !shape(model,['board','history','value','second','choice','prose','issue'])||
     !reason.valid(task,model)||!reason.inspect(task,model).correct||
     !['','less','equal','greater'].includes(model.choice))return null;
  const records=[],events=[];let first=null,bad=false,issue='',failedRequests=0,wrongPredictions=0,lastComparisonIndex=null;
  for(const [historyIndex,e] of model.history.entries()){
   if(!shape(e,['a','i','v','w','c'])||e.a!=='test'||e.i!==''||
      ![e.v,e.w,e.c].every(x=>typeof x==='string')||
      !['','less','equal','greater'].includes(e.c))return null;
   first??={value:e.v,factor:e.w,prediction:e.c};issue='';
   const value=fraction(e.v),factor=fraction(e.w);
   if(!value||!factor||cmp(value,[0,1])<=0||cmp(value,[12,1])>0||
      cmp(factor,[0,1])<0||cmp(factor,[3,1])>0){
    issue='原来的数用大于0、不超过12的数；乘的数用0到3之间的数。';
   }else if(e.c==='')issue='先猜一猜结果与原来的数相比怎样。';
   if(issue){bad=true;failedRequests++;events.push({historyIndex,raw:{value:e.v,factor:e.w,prediction:e.c},compared:false,match:false,issue});continue;}
   // The starting quantity is positive, so comparing x*f and x
   // is equivalent to comparing f with 1; BigInt avoids floating rounding.
   const rel=cmp(factor,[1,1]),actual=rel<0?'less':rel>0?'greater':'equal';
   const match=e.c===actual;
   const breaks=task.rule==='strict'?actual!=='greater':actual==='less';
   if(!match){bad=true;wrongPredictions++;issue='看看两条带子的长度，再改猜测试一次。';}
   lastComparisonIndex=historyIndex;
   events.push({historyIndex,raw:{value:e.v,factor:e.w,prediction:e.c},compared:true,match,actual,breaks,issue});
   records.push({value:e.v,factor:e.w,prediction:e.c,actual,breaks,match});
  }
  const last=records.at(-1);
  if(!last?.match||!last.breaks||model.issue!==issue||!same({records,first,bad},model.board)||
     last.value!==model.value||last.factor!==model.second||last.prediction!==model.choice)return null;
  return {value:last.value,factor:last.factor,actual:last.actual,rule:task.rule,
    comparisons:records.length,first,failedRequests,wrongPredictions,lastComparisonIndex,events};
 }catch{return null;}
}
