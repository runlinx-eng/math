// #342 P006s: two original simulated survey frequency tasks.
// Development-only, source-bound; the native record has NO per-observation event history.
// Do not infer real respondents, exact button sequence, independent counting process or strict A.
import {validModel,inspect} from './tasks.js';
import {isEvidenceContext,matchesNativeEvidenceTask,latestSubmissionMatches,
  hasExactKeys as exact,sameEvidence as same} from './evidence-contract.js';

const NODE='mt_ebQURBOsM5';
const SPECS={
 0:{type:'survey',labels:['走路','公交','骑车'],counts:[4,3,2],
    prompt:'观察这组模拟到校记录，再回答：哪种方式最多？',
    question:'大家怎样来上学？',order:[1,0,2,0,1,0,2,1,0]},
 1:{type:'survey',labels:['0 人','1 人','2 人','3 人'],counts:[2,4,3,1],
    prompt:'换个问题：兄弟姐妹人数最常见的是多少？把每个回答录入两列表格。',
    question:'兄弟姐妹有几人？',order:[1,2,0,1,3,2,1,0,2,1]}
};
const MODEL_KEYS=['seen','counts','choice'];
const TASK_KEYS=['type','labels','counts','prompt','question','order'];
const TASK_HASHES={
 0:'b408662903dcf4427dbd62cde33a67aed44713215040dfe2e1a315ed6d040712',
 1:'62e70fbba828146520ab23b8f3e59738ddde922ff980cc3b79af83e2ce892595'
};
function source(task,context){
 if(!isEvidenceContext(context)||context.sessionId!=='survey'||
    !Object.hasOwn(SPECS,context.index))return null;
 const spec=SPECS[context.index];
 return exact(task,TASK_KEYS)&&same(task,spec)&&
  matchesNativeEvidenceTask(task,context,{type:'survey',nodeId:NODE})?spec:null;
}
function frequencies(spec){
 const result=spec.labels.map(()=>0);
 for(const i of spec.order){
  if(!Number.isInteger(i)||i<0||i>=result.length)return null;
  result[i]++;
 }
 return result;
}
function finished(task,model,spec){
 if(!exact(model,MODEL_KEYS)||!validModel(task,model))return false;
 const freq=frequencies(spec);
 if(!freq||!same(freq,spec.counts)||model.seen!==spec.order.length||
    model.counts.length!==freq.length||!same(model.counts,freq)||
    model.counts.reduce((a,b)=>a+b,0)!==model.seen)return false;
 const max=Math.max(...freq),mode=freq.indexOf(max);
 if(freq.filter(v=>v===max).length!==1||model.choice!==mode)return false;
 return inspect(task,model).correct===true;
}
export function nativeSurveyFrequencyBinding(task,context={}){
 const spec=source(task,context);
 if(!spec)return null;
 const freq=frequencies(spec);
 return {position:'survey:'+context.index,sourceNodeId:NODE,
  originalType:'survey',originalTaskSha256:TASK_HASHES[context.index],
  simulatedObservationCount:spec.order.length,categoryLabels:[...spec.labels],
  sourceScenarioCounts:freq,originalObservationEventHistoryAvailable:false,
  actualSurveyRespondentsObserved:false,strictAApproved:false};
}
// Recompute the unique modal category from the immutable ORIGINAL order,
// independently of the original Check. This verifies saved totals, not
// when or how the learner pressed each control.
export function replayNativeSurveyFrequency(task,model,context={}){
 try{
  const spec=source(task,context);
  if(!spec||!finished(task,model,spec))return null;
  const freq=frequencies(spec),mode=freq.indexOf(Math.max(...freq));
  return {kind:'native-simulated-survey-frequency',
   originalPosition:'survey:'+context.index,sourceNodeId:NODE,
   originalTaskSha256:TASK_HASHES[context.index],
   simulatedObservationCount:spec.order.length,
   independentlyRecountedFrequencies:freq,
   savedFrequencies:[...model.counts],
   modalCategoryIndex:mode,modalCategoryLabel:spec.labels[mode],
   totalsMatchObservedScenario:true,
   originalObservationEventHistoryAvailable:false,
   individualCountButtonHistoryAvailable:false,
   realSurveyRespondentsObserved:false,
   childIndependentCountingProcessVerified:false,
   longTermMasteryAssessed:false,strictAApproved:false};
 }catch{return null;}
}
// Two actual original Check snapshots may prove a corrected saved total.
// They do NOT prove the interval's individual clicks or observation timing.
export function submittedNativeSurveyFrequency(task,model,record,context={}){
 try{
  const proof=replayNativeSurveyFrequency(task,model,context);
  if(!proof||!latestSubmissionMatches(model,record)||
     record.attempts.length!==2)return null;
  const before=record.attempts[0]?.value;
  const mode=proof.modalCategoryIndex;
  if(!exact(before,MODEL_KEYS)||!validModel(task,before)||
     inspect(task,before).correct!==false||
     before.seen!==model.seen||before.choice!==model.choice||
     !before.counts.every((v,i)=>v===model.counts[i]-(i===mode?1:0))||
     before.counts.reduce((a,b)=>a+b,0)!==model.seen-1)return null;
  return {...proof,originalCheckSnapshotsObserved:2,
   wrongToCorrectCheckRevisionObserved:true,
   singleSavedFrequencyRevisionObserved:true,
   individualCountButtonHistoryAvailable:false};
 }catch{return null;}
}
