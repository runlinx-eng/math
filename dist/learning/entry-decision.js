// P7-D5: choose one real learning destination before rendering any navigation.
// A recommendation from daily.continuation() is not evidence of a saved session.
import {lessonForTopic,lessonIds} from './catalog.js';
import {bridgeIds,sessionMeta} from './bridges.js';
import {lessonSummary} from './state.js';
import {defaultModel} from './tasks.js';
import {sessionTaskFor} from './bridges.js';
import {pendingQuestions,sessionRecord} from './daily.js';
import {ACTIVITIES,activityIds} from '../exploration-content.js';
import {routeStep} from '../journey-model.js';

// A freshly opened empty session is not a restored workpiece. Preserve a
// modified widget model even before the learner makes their first submission.
function hasWork(record){
  if(record.draft?.trim()||record.notes?.length)return true;
  if(Object.values(record.cases||{}).some(c=>c.support||c.attempts?.length))return true;
  return Object.entries(record.models||{}).some(([key,value])=>{
    const task=sessionTaskFor(record.id,Number(key));
    return task&&JSON.stringify(value)!==JSON.stringify(defaultModel(task));
  });
}
const incomplete = (state,id) => {
  const record=id&&sessionMeta(id)?sessionRecord(state,id):null;
  return record?.id===id&&!lessonSummary(record).completed&&hasWork(record)?record:null;
};

export function recoverableLearning(state,{at=new Date(),timeZone}={}){
  // A question without a stored learning scene remains accessible from Questions,
  // but cannot be presented as a runnable lesson.
  for(const question of pendingQuestions(state,at,timeZone)){
    const saved=question.scene?.record;
    if(saved&&sessionMeta(saved.id)&&!lessonSummary(saved).completed)
      return {kind:'resume',resumeKind:'question',questionId:question.id,sessionId:saved.id,title:sessionMeta(saved.id).title};
  }
  const last=state.daily?.continuation?.id||state.lessonContinuation;
  const ids=[...new Set([last,...lessonIds,...bridgeIds].filter(Boolean))];
  const records=ids.map(id=>incomplete(state,id)).filter(Boolean);
  if(!records.length)return null;
  const preferred=incomplete(state,last);
  const record=preferred||records.sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt))[0];
  return {kind:'resume',resumeKind:'session',sessionId:record.id,title:sessionMeta(record.id).title};
}

export function decideLearningEntry({selected=null,state,at=new Date(),timeZone}={}){
  if(selected?.kind==='node'){
    const lessonId=lessonForTopic(selected.id);
    if(lessonId&&sessionMeta(lessonId))
      return {kind:'lesson',lessonId,nodeId:selected.id,restore:!!sessionRecord(state,lessonId)};
    const legacyId=activityIds.find(id=>ACTIVITIES[id].topicId===selected.id);
    if(legacyId)return {kind:'legacy',nodeId:selected.id,legacyId};
    const journey=routeStep(selected.id);
    if(journey)return {kind:'journey',nodeId:selected.id,step:journey.step};
    return {kind:'unavailable',nodeId:selected.id,title:selected.title||''};
  }
  const resume=recoverableLearning(state,{at,timeZone});
  if(resume)return {...resume,packId:selected?.kind==='pack'?selected.id:null};
  return {kind:'pick',packId:selected?.kind==='pack'?selected.id:null};
}
