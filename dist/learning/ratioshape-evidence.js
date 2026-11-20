// #282 B37: independent evidence for five original rectangle scaling tasks.
// Read the native factor/save history without changing the grader or records.
import * as native from './phase5/b37-model.js';
import {LESSONS} from './catalog.js';
import {matchesNativeEvidenceTask,hasExactKeys,sameEvidence} from './evidence-contract.js';

const TYPE='x-r37-shape';
const POSITIONS=Object.freeze({
 pctIdeas37:Object.freeze([2]),
 recipeScale37:Object.freeze([2]),
 similar37:Object.freeze([0,2]),
 scaleArea37:Object.freeze([0])
});
// Question meanings are reviewed per original task, never inferred from an
// unrelated task with the same widget or trusted from its answer key.
const ANSWERS=Object.freeze({
 'pctIdeas37:2':Object.freeze([['choice','same','corresponding-edge-rule']]),
 'recipeScale37:2':Object.freeze([['number','1/2','length-factor']]),
 'similar37:0':Object.freeze([['number','3','length-factor']]),
 'similar37:2':Object.freeze([['choice','same','corresponding-angles']]),
 'scaleArea37:0':Object.freeze([
  ['number','2','original-area'],
  ['number','18','scaled-area'],
  ['number','9','area-factor']
 ])
});
const dense=a=>Array.isArray(a)&&Object.keys(a).length===a.length;
const bounded=(n,min,max)=>Number.isSafeInteger(n)&&n>=min&&n<=max;
function gcd(a,b){a=a<0n?-a:a;while(b){const c=a%b;a=b;b=c;}return a||1n;}
function fraction(value){
 if(typeof value!=='string'||value.length>96)return null;
 const text=value.trim().replace(/\\s*\\/\\s*/g,'/');
 let n,d;
 if(/^-?\\d+\\/[1-9]\\d*$/.test(text)){
  const parts=text.split('/');n=BigInt(parts[0]);d=BigInt(parts[1]);
 }else if(/^-?\\d+(?:\\.\\d+)?$/.test(text)){
  const [whole,decimal='']=text.split('.');
  const negative=whole.startsWith('-');
  n=BigInt((negative?whole.slice(1):whole)+decimal)*(negative?-1n:1n);
  d=10n**BigInt(decimal.length);
 }else return null;
 const g=gcd(n,d);return [n/g,d/g];
}
const multiply=(a,b)=>{const g=gcd(a[0]*b[0],a[1]*b[1]);return [a[0]*b[0]/g,a[1]*b[1]/g];};
const value=a=>a[1]===1n?String(a[0]):String(a[0])+'/'+String(a[1]);
const sameNumber=(a,b)=>{const x=fraction(a);return !!x&&x[0]===b[0]&&x[1]===b[1];};

function plan(task,context){
 if(task?.type!==TYPE||!dense(task.base)||task.base.length!==2||
    !task.base.every(x=>bounded(x,1,10000))||
    !dense(task.factors)||!dense(task.required)||
    !task.factors.length||task.factors.length>8||
    !task.required.length||task.required.length>5||
    !task.factors.every(x=>typeof x==='string'&&!!fraction(x)&&fraction(x)[0]>0n)||
    !task.required.every(f=>task.factors.includes(f))||
    new Set(task.required).size!==task.required.length||
    !dense(task.questions||[]))return null;
 const key=context.sessionId+':'+context.index,roles=ANSWERS[key];
 if(!roles||task.questions.length!==roles.length)return null;
 return {base:task.base,required:task.required,
  roles,originalArea:BigInt(task.base[0])*BigInt(task.base[1])};
}
function source(task,context){
 if(!context||!Object.hasOwn(POSITIONS,context.sessionId)||
    !POSITIONS[context.sessionId].includes(context.index))return null;
 const nodeId=LESSONS[context.sessionId]?.topicId;
 return nodeId&&matchesNativeEvidenceTask(task,context,{type:TYPE,nodeId})?nodeId:null;
}
function answers(task,model,plan){
 if(!dense(model.answers)||model.answers.length!==plan.roles.length)return null;
 const result=[];
 for(let i=0;i<plan.roles.length;i++){
  const [kind,expected,role]=plan.roles[i],raw=model.answers[i];
  const q=task.questions[i];
  if(!q||typeof q.label!=='string'||typeof raw!=='string'||
     (kind==='choice'?(q.kind!=='choice'||raw!==expected):
      (q.kind==='choice'||!sameNumber(raw,fraction(expected)))))return null;
  result.push({role,label:q.label,raw,expected});
 }
 return result;
}
export function ratioShapeBinding(task,context={}){
 try{
  const nodeId=source(task,context),p=plan(task,context);
  return nodeId&&p?{nodeId,method:null,
   question:'对应长、宽都乘同一个缩放倍数时，面积为什么乘这个倍数的平方？'}:null;
 }catch{return null;}
}
export function replayRatioShapeEvidence(task,model,context={}){
 try{
  const nodeId=source(task,context),p=plan(task,context);
  if(!nodeId||!p||!native.valid(task,model)||!native.inspect(task,model).correct||
     !dense(model.history)||model.history.length<2||model.history.length>2000||
     !hasExactKeys(model.board,['bad','first','factor','records'])||
     !dense(model.board.records)||!hasExactKeys(model.board.first,['save'])||
     model.issue!=='')return null;
  let factor=task.factors[0],firstSave=null,wrongSaveIndices=[];
  const records=[],events=[];
  for(let at=0;at<model.history.length;at++){
   const e=model.history[at];
   if(!hasExactKeys(e,['a','i','v','w','c']))return null;
   if(e.a==='factor'){
    if(!task.factors.includes(e.i))return null;
    factor=e.i;events.push({at,action:'factor',factor});
   }else if(e.a==='save'){
    if(e.i!=='')return null;
    const f=fraction(factor),width=multiply([BigInt(p.base[0]),1n],f);
    const height=multiply([BigInt(p.base[1]),1n],f);
    const correct=sameNumber(e.v,width)&&sameNumber(e.w,height);
    const row={at,factor,width:e.v,height:e.w,correct,
     expectedWidth:value(width),expectedHeight:value(height),
     expectedArea:value(multiply(width,height)),
     expectedAreaFactor:value(multiply(f,f))};
    records.push(row);
    events.push({at,action:'save',record:records.length-1,correct});
    if(firstSave===null)firstSave={factor,width:e.v,height:e.w};
    if(!correct)wrongSaveIndices.push(at);
   }else return null; // Unrelated/ignored native events cannot prove scaling.
  }
  const last=records.at(-1),checked=answers(task,model,p);
  if(!last||!checked||events.at(-1)?.action!=='save'||!last.correct||
     !task.required.every(f=>records.some(r=>r.factor===f&&r.correct))||
     factor!==model.board.factor||factor!==last.factor||
     !sameNumber(model.value,fraction(last.width))||
     !sameNumber(model.second,fraction(last.height))||
     !sameEvidence(model.board.first.save,firstSave)||
     !sameEvidence(model.board.records,records.map(r=>({
      factor:r.factor,width:r.width,height:r.height,correct:r.correct
     })))||model.board.bad!==(wrongSaveIndices.length>0))return null;
  // In addition to the original grader, independently establish the geometric
  // invariant A' = (k*w)(k*h) = k² * (w*h) for each saved correction.
  const originalArea=value([p.originalArea,1n]);
  const scaledArea=last.expectedArea,areaFactor=last.expectedAreaFactor;
  return {kind:'ratio-shape',nodeId,method:null,
   construction:{base:[...p.base],originalArea,required:[...p.required],
    lastFactor:last.factor,lastWidth:last.expectedWidth,
    lastHeight:last.expectedHeight,scaledArea,areaFactor,
    firstSave,records,wrongSaveIndices,answers:checked,events},
   eventCount:events.length,originalControlsReplayed:true,
   independentStrategyAssessed:false,freeExplanationAssessed:false,
   angleProofAssessed:false,physicalMeasurementAssessed:false,
   generalMasteryAssessed:false,checkedSubmissionAssessed:false};
 }catch{return null;}
}
