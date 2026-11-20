// #276/B37 stage 1: independently reconstruct 13 genuine ratio comparisons.
// Read only. Never grade the learner or infer their unobserved strategy.
import * as native from './phase5/b37-model.js';
import {LESSONS} from './catalog.js';
import {matchesNativeEvidenceTask,hasExactKeys} from './evidence-contract.js';

const TYPE='x-r37-pair';
const POSITIONS=Object.freeze({
 pctIdeas37:Object.freeze([0]),
 ratioProblem37:Object.freeze([0,1,2]),
 rateWords37:Object.freeze([0,1]),
 ratioNotation37:Object.freeze([0]),
 proportion37:Object.freeze([0,1]),
 ratioLink37:Object.freeze([0,1]),
 recipeScale37:Object.freeze([0,1])
});
const OWN=Object.freeze(['same','different']);
const recordKeys=['pair','guess','relation','correct'];
const equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const array=a=>Array.isArray(a)&&Object.keys(a).length===a.length;
const integer=x=>Number.isSafeInteger(x)&&x>=0&&x<=10000;
const rawInt=s=>typeof s==='string'&&/^(?:0|[1-9]\d{0,4})$/.test(s)?Number(s):null;
const exact=(t,a,b)=>t.relation==='inverse'
 ? BigInt(a[0])*BigInt(a[1])===BigInt(b[0])*BigInt(b[1])
 : BigInt(a[0])*BigInt(b[1])===BigInt(a[1])*BigInt(b[0]);
function math(task){
 if(task?.type!==TYPE||!['direct','inverse',undefined].includes(task.relation)||
    !array(task.base)||task.base.length!==2||!task.base.every(integer)||
    !array(task.targets)||!task.targets.length||task.targets.length>6||
    !task.targets.every(p=>array(p)&&p.length===2&&p.every(integer))||
    !array(task.labels)||task.labels.length!==2||
    !task.labels.every(x=>typeof x==='string'&&x.trim().length>0&&x.length<=80)||
    !array(task.questions||[])||
    (task.relation==='inverse'&&[...task.base,...task.targets.flat()].some(x=>x===0))||
    !task.base.some(x=>x>0))return null;
 const expected=task.targets.map(p=>exact(task,task.base,p)?'same':'different');
 return {relation:task.relation==='inverse'?'inverse':'direct',
  base:[...task.base],targets:task.targets.map(x=>[...x]),expected,
  commonUnit:task.commonUnit!==false};
}
function source(task,context){
 if(!context||typeof context.sessionId!=='string'||
    !Object.hasOwn(POSITIONS,context.sessionId)||
    !POSITIONS[context.sessionId].includes(context.index))return null;
 const nodeId=LESSONS[context.sessionId]?.topicId;
 return nodeId&&matchesNativeEvidenceTask(task,context,{type:TYPE,nodeId})?nodeId:null;
}
export function ratioPairBinding(task,context={}){
 try{
  const nodeId=source(task,context),m=math(task);if(!nodeId||!m)return null;
  return {nodeId,method:null,
   question:m.relation==='inverse'
    ?'人数和天数一起变化时，为什么要比较两个数的乘积是否不变？'
    :'两种数量一起变化时，如何区分同乘一个倍数与各自加同一个数？'};
 }catch{return null;}
}
export function replayRatioPairEvidence(task,model,context={}){
 try{
  const nodeId=source(task,context),plan=math(task);
  if(!nodeId||!plan||!native.valid(task,model)||!native.inspect(task,model).correct||
     !array(model.history)||model.history.length<2||model.history.length>2000||
     !array(model.board?.records)||model.board.records.length<plan.targets.length||
     !hasExactKeys(model.board.first,['place','save'])||model.issue!=='')return null;
  let preview=null,firstPlace=null,firstSave=null,wrong=[],placed=0;
  const records=[];
  for(let at=0;at<model.history.length;at++){
   const e=model.history[at];
   if(!hasExactKeys(e,['a','i','v','w','c'])||e.i!=='')return null;
   if(e.a==='place'){
    const a=rawInt(e.v),b=rawInt(e.w);
    if(a===null||b===null||(a===0&&b===0)||
       (plan.relation==='inverse'&&(a===0||b===0)))return null;
    preview=[a,b];placed++;
    if(firstPlace===null)firstPlace=[e.v,e.w];
   }else if(e.a==='save'){
    if(!preview||!OWN.includes(e.c)||rawInt(e.v)!==preview[0]||
       rawInt(e.w)!==preview[1])return null;
    const relation=exact(task,plan.base,preview)?'same':'different';
    const correct=e.c===relation;
    const result={at,pair:[...preview],guess:e.c,relation,correct};
    if(firstSave===null)firstSave={pair:preview.map(String),guess:e.c};
    records.push(result);
    if(!correct)wrong.push(at);
   }else return null; // ignored controller events do not prove math
  }
  const last=records.at(-1);
  if(!last||last.at!==model.history.length-1||!last.correct||
     !plan.targets.every(p=>records.some(r=>r.correct&&equal(r.pair,p)))||
     !equal(preview?.map(String),model.board.preview)||
     !equal(firstPlace,model.board.first.place)||
     !equal(firstSave,model.board.first.save)||
     !equal(records.map(r=>({pair:r.pair.map(String),guess:r.guess,
       relation:r.relation,correct:r.correct})),model.board.records)||
     model.board.bad!==(wrong.length>0)||
     rawInt(model.value)!==preview[0]||
     rawInt(model.second)!==preview[1]||model.choice!==last.guess)return null;
  return {kind:'ratio-pair',nodeId,method:null,
   construction:{
    relation:plan.relation,base:plan.base,targets:plan.targets,
    expected:plan.expected,commonUnit:plan.commonUnit,
    placements:placed,firstPlace,firstSave,
    comparisons:records,wrongSaveIndices:wrong,
    crossProducts:records.map(r=>({
      left:plan.relation==='inverse'?plan.base[0]*plan.base[1]:r.pair[0]*plan.base[1],
      right:plan.relation==='inverse'?r.pair[0]*r.pair[1]:r.pair[1]*plan.base[0]
    }))
   },
   eventCount:model.history.length,originalControlsReplayed:true,
   taskValuesProvided:true,realWorldMeasurementAssessed:false,
   independentStrategyAssessed:false,freeExplanationAssessed:false,
   generalMasteryAssessed:false,checkedSubmissionAssessed:false};
 }catch{return null;}
}
