// #342 P006r: original B04 statistical-question variation, checked snapshots only.
// Development candidate; these tasks DO NOT record a per-field event timeline.
// Do not infer understanding of optional prose, an actual survey, or formal A.
import * as native from './phase4/b04-model.js';
import {isEvidenceContext,matchesNativeEvidenceTask,latestSubmissionMatches,
  hasExactKeys as exact,sameEvidence as same} from './evidence-contract.js';

const NODE='mt_iykH2P5oFq';
const SPECS={
 1:{type:'x-questionbuild',variable:'sport',
    prompt:'想知道这群孩子最喜欢的运动，拼出调查的问题，并给出两种可能不同的回答。'},
 2:{type:'x-questionbuild',variable:'minutes',
    prompt:'“我今天读了几分钟”只有一次记录。改成能研究一周变化的问题。不要把问一个人就当作一定不能统计。',
    self:true}
};
const MODEL_KEYS=['population','variable','expected','answerA','answerB','question','why'];
const VALUES={sport:['足球','游泳','羽毛球'],minutes:['10','20','30']};

function source(task,context){
 if(!isEvidenceContext(context)||context.sessionId!=='statquestions'||
    !Object.hasOwn(SPECS,context.index))return null;
 const spec=SPECS[context.index];
 return exact(task,Object.keys(spec))&&same(task,spec)&&
  matchesNativeEvidenceTask(task,context,{type:'x-questionbuild',nodeId:NODE})?
  spec:null;
}
function fullModel(task,model,spec){
 const correctPopulation=spec.self?'self-days':'group';
 return exact(model,MODEL_KEYS)&&native.valid(task,model)&&
  model.population===correctPopulation&&model.variable===spec.variable&&
  model.expected==='vary'&&VALUES[spec.variable].includes(model.answerA)&&
  VALUES[spec.variable].includes(model.answerB)&&
  model.answerA!==model.answerB&&native.inspect(task,model).correct===true;
}
export function nativeQuestionVariationBinding(task,context={}){
 const spec=source(task,context);return spec?{
  position:'statquestions:'+context.index,sourceNodeId:NODE,
  originalType:'x-questionbuild',variable:spec.variable,
  observationUnit:spec.self?'one-person-many-days':'different-children',
  validPossibleValues:[...VALUES[spec.variable]],optionChangeIsObservable:true,
  originalFieldEventHistoryAvailable:false,strictAApproved:false
 }:null;
}
// This proves ONLY the native saved selection's bounded statistical-variable
// meaning. It is NOT an action history, independent proof of reasoning,
// observation of responses, or evidence that the optional prose was understood.
export function replayNativeQuestionVariation(task,model,context={}){
 try{
  const spec=source(task,context);
  if(!spec||!fullModel(task,model,spec))return null;
  return {
   kind:'b04-native-statistical-question-variation',
   originalPosition:'statquestions:'+context.index,sourceNodeId:NODE,
   recordedVariable:spec.variable,observationUnit:spec.self?
    'one-person-many-days':'different-children',
   observedPossibleAnswers:[model.answerA,model.answerB],
   alternativesDiffer:true,expectedVariationSelected:true,
   onePersonCanHaveVariationAcrossDays:!!spec.self,
   originalFieldEventHistoryAvailable:false,
   actualSurveyResponsesObserved:false,freeTextMeaningAssessed:false,
   longTermMasteryAssessed:false,strictAApproved:false
  };
 }catch{return null;}
}
// A wrong->correct pair of two ORIGINAL Check snapshots is observable,
// even though the B04 task model contains no control-action history.
export function submittedNativeQuestionVariation(task,model,record,context={}){
 try{
  const proof=replayNativeQuestionVariation(task,model,context);
  if(!proof||!latestSubmissionMatches(model,record)||
     record.attempts.length!==2)return null;
  const before=record.attempts[0]?.value;
  if(!exact(before,MODEL_KEYS)||!native.valid(task,before)||
     native.inspect(task,before).correct!==false||
     before.population!=='one-once')return null;
  for(const key of MODEL_KEYS){
   if(key!=='population'&&!same(before[key],model[key]))return null;
  }
  if(before.population===model.population)return null;
  return {...proof,originalCheckSnapshotsObserved:2,
    wrongToCorrectCheckRevisionObserved:true,
    onlyObservationUnitSelectionChangedBetweenChecks:true,
    originalControlChangeEventLogObserved:false};
 }catch{return null;}
}
