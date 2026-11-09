// P7-D5: choose one real learning destination before rendering any navigation.
// A recommendation from daily.continuation() is not evidence of a saved session.
import {lessonForTopic,lessonIds} from './catalog.js';
import {bridgeIds,sessionMeta} from './bridges.js';
import {lessonSummary} from './state.js';
import {pendingQuestions,sessionRecord} from './daily.js';
import {ACTIVITIES,activityIds} from '../exploration-content.js';
import {routeStep} from '../journey-model.js';

const incomplete = (state,id) => {
  const record=id&&sessionMeta(id)?sessionRecord(state,id):null;
  return record?.id===id&&!lessonSummary(record).completed?record:null;
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
      return {kind:'lesson',lessonId,nodeId:selected.id,restore:!!incomplete(state,lessonId)};
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
