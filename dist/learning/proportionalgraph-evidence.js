// #298: source-bound replay for the two existing B37 unit-rate point plots.
// Original source tasks, grader, saved event schema and State-v2 remain untouched.
import * as native from './phase5/b16-model.js';
import {matchesNativeEvidenceTask,hasExactKeys,sameEvidence} from './evidence-contract.js';

const TYPE='x-graphpoints';
const CASES=Object.freeze({
 'proportion37:3':'mt_5mIcmKRCgA',
 'proportionGraph37:0':'mt_FspV_imUGK'
});
const dense=a=>Array.isArray(a)&&Object.keys(a).length===a.length;
const expected=Object.freeze(Array.from({length:5},(_,x)=>[x,2*x]));
const equalPoints=(a,b)=>sameEvidence(a,b);
const numbersAreWhole=(x,y)=>Number.isSafeInteger(x)&&Number.isSafeInteger(y);
function admitted(task,context){
 if(!context||typeof context.sessionId!=='string'||!Number.isInteger(context.index))return null;
 const source=CASES[context.sessionId+':'+context.index];
 if(!source||!matchesNativeEvidenceTask(task,context,{type:TYPE,nodeId:source})||
  !dense(task.data)||task.data.length!==5||!task.data.every((p,i)=>equalPoints(p,expected[i]))||
  task.maxX!==4||task.maxY!==8||task.rate!==2||task.line!==true||
  task.xLabel!=='千克'||task.yLabel!=='价格（元）'||task.read)return null;
 return source;
}
const parse=s=>typeof s==='string'&&/^\s*\d{1,12}\s*$/.test(s)?BigInt(s.trim()):null;
function eventValue(fields){
 const x=parse(fields.x),y=parse(fields.y);
 if(x===null||y===null)return null;
 if(x>4n||y>8n)return null;
 return [Number(x),Number(y)];
}
const independentCheck=p=>p&&BigInt(p[1])===2n*BigInt(p[0]);
export function proportionalGraphBinding(task,context={}){
 try{const nodeId=admitted(task,context);return nodeId?{nodeId,method:null,
  question:'实际放入的数对是否符合每千克增加2元？哪次重新放点改正了旧位置？'}:null;}
 catch{return null;}
}
export function replayProportionalGraphEvidence(task,model,context={}){
 try{
  const nodeId=admitted(task,context);
  if(!nodeId||!native.valid(task,model)||!native.inspect(task,model).correct||
   !dense(model.history)||model.history.length<5||model.history.length>2000||
   !dense(model.board?.points)||!dense(model.board?.selected)||model.board.selected.length||
   model.issue!==''||model.reason!=='per-x'||native.number(model.answer)!==2)return null;
  let points=[],first=null,firstSeen=false;
  const attempts=[],invalidIndices=[],incorrectIndices=[],replacements=[],resets=[];
  for(const [index,event] of model.history.entries()){
   if(!hasExactKeys(event,['action','data'])||
    !hasExactKeys(event.data,['fields'])||
    !event.data.fields||typeof event.data.fields!=='object'||Array.isArray(event.data.fields))return null;
   if(event.action==='reset'){
    points=[];resets.push(index);continue;
   }
   if(event.action!=='plot')return null;
   const f=event.data.fields;
   if(typeof f.x!=='string'||typeof f.y!=='string')return null;
   const nativeX=native.number(f.x),nativeY=native.number(f.y);
   if(!firstSeen){first={x:nativeX,y:nativeY};firstSeen=true;}
   // Follow the *original* validator's numeric syntax and integer range for
   // whether a point was actually drawn. Independent math is checked below.
   const placed=numbersAreWhole(nativeX,nativeY)&&nativeX>=0&&nativeX<=4&&nativeY>=0&&nativeY<=8;
   const p=placed?[nativeX,nativeY]:null;
   const independent=placed&&independentCheck(p);
   attempts.push({index,x:f.x,y:f.y,placed,consistent:independent});
   if(!placed){invalidIndices.push(index);continue;}
   const old=points.find(q=>q[0]===p[0]);
   if(old)replacements.push({index,previous:[...old],next:[...p]});
   points=points.filter(q=>q[0]!==p[0]);points.push(p);
   if(!independent)incorrectIndices.push(index);
  }
  if(!firstSeen||points.length!==5||!expected.every(p=>points.some(q=>equalPoints(q,p)))||
   !sameEvidence(points,model.board.points)||!sameEvidence(first,model.board.first))return null;
  const unitSteps=expected.slice(1).map((p,i)=>{
   const prior=expected[i];
   return {from:prior,to:p,dx:p[0]-prior[0],dy:p[1]-prior[1],unitRate:String(BigInt(p[1]-prior[1])/BigInt(p[0]-prior[0]))};
  });
  if(unitSteps.some(s=>s.dx!==1||s.dy!==2||s.unitRate!=='2'))return null;
  return {kind:'proportional-graphpoints',nodeId,method:null,
   construction:{finalPoints:points,unitSteps,origin:[0,0],unitRate:'2',attempts,
    invalidIndices,incorrectIndices,replacements,resets,firstPointAttempt:first,
    plottedByLearner:true,straightLineRenderedByTool:true},
   eventCount:model.history.length,originalControlsReplayed:true,
   independentIntegerMath:true,originalQuestionAndAxesProvided:true,
   generalOriginProofAssessed:false,independentRuleDiscoveryAssessed:false,
   currentSubmissionVerifiedHere:false,generalMasteryAssessed:false};
 }catch{return null;}
}
