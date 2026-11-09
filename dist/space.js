import {readStored,writeStored,unpackText,MAX_BACKUP_BYTES} from './storage.js';
import {SpatialScene} from './spatial-scene.js';
import {relationsFor,LAYOUT_VERSION,parseView,objectKey} from './spatial-model.js';
import {buildRelationshipSpace,RELATIONSHIP_VERSION} from './spatial-relationship.js';
import {activityForms,activityGlyph,ACTIVITY_FORMS} from './spatial-activities.js';
import {makeKnowledgeNames} from './spatial-names.js';
import {applyNavigationCopy,relationHeading,relationStrength} from './navigation-copy.js';
import {conceptHelpFor} from './concept-explanations.js';
import {relationExplanation} from './spatial-reasons.js';
import {buildStructureGuide,linkedSuggestions,guideNextTargets,guideStepReady,GUIDE_ID} from './spatial-guide.js';
import {placeGuideCue} from './spatial-labels.js';
import {KEY,OLD_KEY,fresh,validate,migrateLegacy,merge,nodeState,evidenceSummary,PROGRESS,completionClass,completionSummary,backup,parseBackup,now} from './exploration-core.js';
import {ACTIVITIES,activityIds} from './exploration-content.js';
import {ROUTE_ID,ROUTE_TITLE,ROUTE_STEPS,routeStep} from './journey-model.js';

import {LESSONS,ROUTES,ROUTE_SECTIONS,lessonForTopic,routeFor,routeForPack,routesForPack} from './learning/catalog.js';
import {BRIDGES,sessionMeta,sessionRoute} from './learning/bridges.js';
import {lessonSummary} from './learning/state.js';
import {dayKey,dailySummary,continuation,pendingQuestions,addQuestion,resumeQuestion,questionAction,questionDone} from './learning/daily.js';
import {askQuestion} from './learning/question-ui.js';
import {gradeMapSelection,GRADE_MAP_STAGES,loadGradePanoramaData} from './grade-node-filter.js';
import {gradeDistribution} from './grade-distribution.js';
import {renderGradeDistributionHTML} from './grade-distribution-view.js';
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const date=s=>new Date(s).toLocaleString('zh-CN',{month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'});
const button=(action,text,attrs='',css='soft-button')=>`<button type="button" class="${css}" data-action="${action}" ${attrs}>${text}</button>`;
const routeSection=(r,packId)=>r.sectionByPack?.[packId]||r.section;
const activityFor=id=>activityIds.find(key=>ACTIVITIES[key].topicId===id);
let atlas,space,scene,learning=fresh(),readBlocked=false,activePanel=null,selectedFilter='all',searchPack=null,searchLimit=24,saveTimer,toastTimer;
const RELATIONSHIP_VIEW_KEY='math-explorer-network-relationship-view-v1';
let worldLayout='network',gradePanoramaData=null,gradePanoramaPromise=null,gradeNodeMappingsById=new Map(),gradePositionLoadTimer=null,selectedGradeStage='all';
const GRADE_ROLE_LABELS=Object.freeze({main:'主要',extension:'延伸',transition:'过渡'});
const panels=new Map(),visits=[];
let renderedDay=null,activeRouteId=null;
let journeyOpen=false,journeySuspended=false,activeLessonId=null,activeSessionId=null,activeQuestionId=null;
let guideSteps=[],guideVisible=false,guideSuspended=false,guideWalkSeen=new Set(),guideObserved=new Set();
const displayTitle=o=>worldLayout==='network'&&o?.kind==='pack'?o.title:worldLayout==='network'&&o?.kind==='node'?(space.knowledgeNames.get(o.id)||o.title):o?.kind==='node'&&LESSONS[lessonForTopic(o.id)]?.title||o?.kind==='pack'&&routesForPack(o.id).length===1&&routeForPack(o.id)?.title||o?.kind==='node'&&routeStep(o.id)?.title||o?.key==='pack:same-amount'&&ROUTE_TITLE||o?.title;
const objectLevelLabel=o=>o?.kind==='node'?(o.domainId==='thinking'?'数学思维':'知识点'):o?.kind==='pack'?'知识群':'主题';

function toast(message){$('#toast').textContent=message;$('#toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').hidden=true,4200);}
function warning(message){$('#storage-warning').textContent=message;$('#storage-warning').hidden=false;}
function readLearning(){
  try {const raw=readStored(KEY);if(raw)learning=validate(JSON.parse(raw),atlas);else learning=fresh();return learning;}
  catch {readBlocked=true;warning('原有学习记录暂时无法读取，已停止覆盖。空间仍可浏览，请先保留原始记录。');return learning;}
}
function mutateLearning(fn){if(readBlocked)return false;readLearning();if(readBlocked)return false;try{const working=structuredClone(learning);fn(working);const next=validate(working,atlas);writeStored(KEY,JSON.stringify(next));learning=next;refreshLearning();return true;}catch(error){warning('还没保存成功，原记录已保留。'+error.message);return false;}}
function questionComposer(context={}){const v=captureView(),guide=learning.daily.guide;const world={position:v.position,target:v.target,selected:v.selected,...(worldLayout==='network'?{layout:'network',networkView:v.networkView,networkVersion:v.networkVersion,...(v.cameraZoom?{cameraZoom:v.cameraZoom,traceMode:v.traceMode,traceScroll:v.traceScroll}:{}),...(v.edgeDisplay?{edgeDisplay:v.edgeDisplay}:{}),...(guide?.active&&(guideVisible||guideSuspended)?{guideStep:guide.step}:{})}:{})};askQuestion(text=>{const ok=mutateLearning(s=>addQuestion(s,text,{...context,world}));if(ok)toast('已留下，下次从这里继续。');return ok;});}
// One vocabulary for resuming a real learning record, opening a new task,
// and returning to the unchanged 3D knowledge space.
function continuationNav(next){
  if(next.kind==='question')return {heading:'待续问题',label:'回到待续问题',hint:'上次留下的问题仍在本机。'};
  if(next.kind==='session'){
    const record=BRIDGES[next.sessionId]?learning.daily?.bridges?.[next.sessionId]:learning.lessons[next.sessionId];
    return record?{heading:'上次学习',label:'继续上次学习',hint:'从已有作品和尝试记录接着操作。'}
      :{heading:'推荐学习',label:'开始学习',hint:'这是推荐的起点，还没有你的学习记录。'};
  }
  return {heading:'知识联系',label:'查看知识联系',hint:'回到原来的数学空间观察相关知识。'};
}
function renderContinue(){const card=$('#continue-card');if(!scene)return;const next=continuation(learning),nav=continuationNav(next),menu=$('#menu-popover [data-action="continue"]');if(menu)menu.textContent=nav.label;card.hidden=guideVisible||(journeyOpen&&!journeySuspended)||!!scene.selected||!!panels.size;if(card.hidden)return;const q=next.kind==='question'&&learning.daily.questions.find(q=>q.id===next.questionId),missing=q&&!q.scene&&!lessonForTopic(q.nodeId);card.innerHTML=`<small>${nav.heading}</small><p>${esc(next.title)}</p>${missing?'<small>这里还没有对应活动，问题先留着。</small>':''}<div>${button('continue',nav.label,'','primary-button')}${q?button('question-later','先放着',`data-id="${q.id}"`,'plain-button'):''}</div>`;}
function questionList(){closePopovers();const el=$('#questions-popover');el.hidden=false;const list=learning.daily.questions,render=q=>`<article><p>${esc(q.text)}</p><div>${button('resume-question',q.scene?'回到当时':'回到这个位置',`data-id="${q.id}"`)}${!questionDone(q)?button('question-finish','想明白了',`data-id="${q.id}"`,'plain-button'):'<small>✓ 完成</small>'}</div></article>`;el.innerHTML=`<div class="popover-heading"><strong>留下的问题</strong>${button('close-popover','×','aria-label="关闭问题"','plain-button')}</div>${[...list].reverse().filter(q=>!questionDone(q)).map(render).join('')||'<p class="quiet">还没有待继续的问题。</p>'}${list.some(questionDone)?`<details><summary>已经想明白的</summary>${[...list].reverse().filter(questionDone).map(render).join('')}</details>`:''}`;}
function resume(id){
  readLearning();
  let q;if(!mutateLearning(s=>{q=structuredClone(resumeQuestion(s,id));if(q.world?.guideStep!==undefined)s.daily.guide={id:GUIDE_ID,step:q.world.guideStep,active:true,updatedAt:now()};}))return;
  closePopovers();if(journeyOpen)closeJourney(false);
  if(guideVisible||guideSuspended){if(q.world?.guideStep!==undefined){guideVisible=false;guideSuspended=false;scene.clearGuideFocus();renderGuide();}else leaveGuide();}
  // Only a current relationship-map pose can be restored as camera coordinates.
  // An older saved question keeps its text/learning record and opens its node here,
  // rather than reopening an obsolete spatial mode with incompatible coordinates.
  if(q.world?.layout==='network'&&q.world.networkVersion===RELATIONSHIP_VERSION){scene.restore(q.world);setHash(q.world.selected);}
  else if(q.world?.selected&&space.byKey.has(q.world.selected)){scene.select(q.world.selected);setHash(q.world.selected);}
  else if(q.nodeId&&space.byKey.has('node:'+q.nodeId)){scene.select('node:'+q.nodeId);setHash('node:'+q.nodeId);}
  if(q.scene){if(q.world?.guideStep!==undefined&&guideSteps[q.world.guideStep])guideSuspended=true;scene.select('node:'+q.nodeId);setHash('node:'+q.nodeId);openLearningLesson(q.scene.record.id,{restore:!!q.world,questionId:id});}
  else if(q.world?.guideStep!==undefined&&guideSteps[q.world.guideStep]){activateGuide(q.world.guideStep,{record:false,animate:false,fit:false});}
  else if(lessonForTopic(q.nodeId)){scene.select('node:'+q.nodeId);openLearningLesson(lessonForTopic(q.nodeId),{restore:!!q.world,questionId:id});}
  else{toast('问题和位置都还在。这里还没有对应活动，可以继续观察。');renderFocus();renderLocation();renderContinue();}scheduleSave();
}
function unfinishedContinuation(){const next=continuation(learning);if(next.kind!=='session')return null;const record=BRIDGES[next.sessionId]?learning.daily.bridges[next.sessionId]:learning.lessons[next.sessionId];return record&&!lessonSummary(record).completed?next:null;}
function continueLearning(){readLearning();const next=continuation(learning);if(next.kind==='question')resume(next.questionId);else if(next.kind==='session'){const id=sessionMeta(next.sessionId).topicId,guide=learning.daily.guide;if(guide?.active&&scene.relationshipMap&&guideSteps[guide.step]?.anchor===id){guideSuspended=true;scene.select('node:'+id);setHash('node:'+id);}else choose('node:'+id,{openLesson:false});openLearningLesson(next.sessionId);}else choose('pack:'+next.packId);}

function refreshLearning(){renderedDay=dayKey();if(scene){const daily=dailySummary(learning,atlas);scene.setPersonalProgress(daily.completedConnections);if(worldLayout==='network'){const scenes=new Set(),questions=new Set();for(const [id,record]of Object.entries(learning.lessons))if(LESSONS[id]&&!lessonSummary(record).completed&&Object.keys(record.models||{}).length)scenes.add(LESSONS[id].topicId);for(const id of activityIds){const record=learning.activities[id];if(record&&nodeState(learning,ACTIVITIES[id].topicId).progress!=='completed'&&(Object.keys(record.models||{}).length||record.draft||record.notes?.length||record.observations?.length))scenes.add(ACTIVITIES[id].topicId);}for(const q of learning.daily.questions){if(questionDone(q))continue;const node=q.nodeId||(q.world?.selected?.startsWith('node:')?q.world.selected.slice(5):null);if(node&&space.nodes.has(node))questions.add(node);}scene.setPersonalMarkers(scenes,questions);}$('#today-progress').textContent=`今天 +${daily.nodes.length} 个点 · +${daily.connections.length} 条连接`;$('#today-progress').hidden=!daily.nodes.length&&!daily.connections.length;}scene?.refresh(id=>nodeState(learning,id),selectedFilter);const {done,total}=completionSummary(learning);$('#overall-count').textContent=`${done} / ${total}`;const meter=$('#overall-progress');meter.max=total||1;meter.value=done;meter.setAttribute('aria-label',`已开放任务，完成 ${done} / ${total}`);for(const panel of panels.values()){if(panel.tab==='records')renderPanelSection(panel,'records',{activate:false});}renderFocus();renderContinue();}
function scheduleSave(){clearTimeout(saveTimer);saveTimer=setTimeout(saveView,250);}
function captureView(){const v=scene.snapshot();if(scene.global){v.traceScroll=Math.max(0,Math.min(100000,$('#focus-card').scrollTop||0));const focused=document.activeElement?.closest?.('[data-preview-key]');if(focused)v.traceFocused=focused.dataset.previewKey;}return v;}
function restoreFocus(view){const card=$('#focus-card');if(!card.hidden&&Number.isFinite(view?.traceScroll))card.scrollTop=view.traceScroll;if(view?.traceFocused){const target=[...card.querySelectorAll('[data-preview-key] [data-action="choose"]')].find(el=>el.closest('[data-preview-key]').dataset.previewKey===view.traceFocused);target?.focus({preventScroll:true});}}
function saveView(){if(!scene)return;const view={version:LAYOUT_VERSION,...captureView(),selectedGradeStage,activePanel,journeyOpen,journeySuspended,sessionId:activeSessionId,questionId:activeQuestionId,panels:[...panels.values()].map(p=>({id:p.id,anchor:p.anchor,minimized:p.minimized,tab:p.tab,expanded:p.expanded}))};try{writeStored(RELATIONSHIP_VIEW_KEY,JSON.stringify(view));}catch{warning('观察位置暂时无法保存，学习记录仍按原来的方式保存。');}}
function remember(){if(!scene)return;const view=captureView();if(visits.length&&JSON.stringify(visits.at(-1))===JSON.stringify(view))return;visits.push(view);if(visits.length>30)visits.shift();$('#back-button').disabled=false;}
function recordGuide(step,active){return mutateLearning(s=>{s.daily.guide={id:GUIDE_ID,step,active,updatedAt:now()};});}
function guideThemeId(){return space.nodes.get(guideSteps[1]?.anchor)?.themeId||null;}
function guideTargets(){return guideNextTargets(guideSteps,learning.daily.guide?.step||0,[...guideWalkSeen],guideThemeId());}
function guideReady(){return guideStepReady(guideSteps,learning.daily.guide?.step||0,[...guideWalkSeen],guideThemeId());}
function guideStepMessage(index){
  if(guideReady())return [
    '找到了入口。下一步看看第一条知识连接。',
    '你已经沿真实关系走了一段路。',
    '一个基础可以分成不同方向。',
    '两个基础可以汇合到同一个知识。'
  ][index]||'';
  if(index===1&&guideWalkSeen.size)return '已经找到起点。沿线去下一处。';
  if(index===2&&guideWalkSeen.size)return '已经看过一条分支。再试试另一条。';
  if(index===4)return '这次没有唯一指定路线，自己选一条。';
  return '地图上标出了下一处，可以直接点击。';
}
function positionGuide(){
  const panel=$('#guide-panel');
  if(!guideVisible||panel.hidden)return;
  const top=Math.max(112,$('#network-guide').getBoundingClientRect().bottom+12);
  panel.style.top=`${top}px`;
  panel.style.maxHeight=`${Math.max(170,innerHeight-top-100)}px`;
}
// An on-map cue follows the projection of an unchanged source point; it is not a
// new graph edge, route coordinate or camera instruction.
let lastGuideCueMarkup='';
function renderGuideCues(){
  const layer=$('#guide-cues');
  layer.hidden=!guideVisible||journeyOpen||!scene?.relationshipMap;
  if(layer.hidden){layer.replaceChildren();lastGuideCueMarkup='';return;}
  const panel=$('#guide-panel').getBoundingClientRect(),targets=guideTargets(),shown=[],projections=new Map();
  for(const target of targets){
    const object=space.byKey.get(target.key);
    if(!object||!scene.canLocate(object))continue;
    const p=scene.project(object.position);
    const clear=p.visible&&p.x>50&&p.x<innerWidth-90&&p.y>155&&p.y<innerHeight-120
      &&!(p.x>panel.left-45&&p.x<panel.right+75&&p.y>panel.top-40&&p.y<panel.bottom+65);
    if(clear){
      projections.set(target.key,{x:p.x,y:p.y,visible:true});
      shown.push(`<button type="button" class="guide-cue" data-action="guide-visit" data-key="${esc(target.key)}" aria-label="${esc(target.label)}：${esc(displayTitle(object))}" title="${esc(target.label)}：${esc(displayTitle(object))}"><span class="guide-cue-action"><span class="guide-cue-dot" aria-hidden="true"></span>${esc(target.label)}</span><strong class="guide-cue-name">${esc(displayTitle(object))}</strong></button>`);
    }else{
      const cx=Math.max(panel.right+100,Math.min(innerWidth-135,Math.max(p.x||0,0))),cy=Math.max(185,Math.min(innerHeight-155,Math.max(p.y||0,0)));
      const dx=p.x-cx,dy=p.y-cy,arrow=Math.abs(dx)>Math.abs(dy)?dx<0?'←':'→':dy<0?'↑':'↓';
      projections.set(target.key,{x:cx,y:cy,visible:false});
      shown.push(`<span class="guide-cue guide-cue-offscreen" data-key="${esc(target.key)}" aria-label="目标在当前可视区域外：${esc(displayTitle(object))}"><span class="guide-cue-action">${arrow} ${esc(target.label)}</span><strong class="guide-cue-name">${esc(displayTitle(object))}</strong><small>移动地图寻找</small></span>`);
    }
  }
  // Compare the content, not innerHTML after positioning. The positions are
  // updated in place on camera movement, so clicking is not repeatedly reset.
  const html='<svg class="guide-cue-leaders" aria-hidden="true"></svg>'+shown.join('');
  if(lastGuideCueMarkup!==html){layer.innerHTML=html;lastGuideCueMarkup=html;}
  const occupied=[{x:panel.left,y:panel.top,w:panel.width,h:panel.height}],tethers=[];
  // Keep persistent theme landmarks unobstructed. The map labels themselves
  // retain their full text and remain clickable throughout the guide.
  for(const el of document.querySelectorAll('.space-label.theme:not([hidden])')){
    const r=el.getBoundingClientRect();
    if(r.width&&r.height)occupied.push({x:r.left,y:r.top,w:r.width,h:r.height});
  }
  for(const cue of layer.querySelectorAll('.guide-cue')){
    const point=projections.get(cue.dataset.key);
    if(!point)continue;
    cue.hidden=false; // Re-measure if a prior narrow viewport could not fit it.
    const rect=placeGuideCue({x:point.x,y:point.y,w:cue.offsetWidth,h:cue.offsetHeight,
      viewport:{w:innerWidth,h:innerHeight},occupied});
    if(!rect){cue.hidden=true;continue;}
    cue.hidden=false;
    cue.style.left=`${rect.x.toFixed(1)}px`;
    cue.style.top=`${rect.y.toFixed(1)}px`;
    occupied.push(rect);
    if(point.visible){
      // Dotted neutral tethers indicate only where the on-screen instruction
      // belongs; they do NOT represent mathematical prerequisite edges.
      const tx=Math.max(rect.x,Math.min(rect.x+rect.w,point.x));
      const ty=Math.max(rect.y,Math.min(rect.y+rect.h,point.y));
      if(Math.hypot(tx-point.x,ty-point.y)>8)
        tethers.push(`<path d="M ${tx.toFixed(1)} ${ty.toFixed(1)} L ${point.x.toFixed(1)} ${point.y.toFixed(1)}"/>`);
    }
  }
  const leaders=layer.querySelector('.guide-cue-leaders');
  if(leaders){leaders.setAttribute('viewBox',`0 0 ${innerWidth} ${innerHeight}`);leaders.innerHTML=tethers.join('');}
}
function renderGuide(){
  const panel=$('#guide-panel');
  document.body.classList.toggle('guide-mode',!!guideVisible&&!journeyOpen&&!!scene?.relationshipMap);
  panel.hidden=!guideVisible||journeyOpen||!scene?.relationshipMap;
  if(panel.hidden){renderGuideCues();return;}
  const step=guideSteps[learning.daily.guide?.step||0],index=guideSteps.indexOf(step);
  if(!step){panel.hidden=true;renderGuideCues();return;}
  document.body.dataset.guideStep=String(index);
  const nextText=['沿连接出发','观察分叉','观察汇合','自己选路'][index]||'';
  panel.innerHTML=`<div class="guide-head"><span class="guide-step">发现知识的联系</span><span class="guide-count">${String(index+1).padStart(2,'0')} <span aria-hidden="true">/</span> ${String(guideSteps.length).padStart(2,'0')}</span></div>
    <progress class="guide-progress" max="${guideSteps.length}" value="${index+1}" aria-label="导览观察步骤 ${index+1} / ${guideSteps.length}"></progress>
    <h2>${esc(step.title)}</h2>
    <p class="guide-hint">${esc(step.hint)}</p>
    <p class="guide-status" role="status"><span class="guide-status-dot" aria-hidden="true"></span><span>${esc(guideStepMessage(index))}</span></p>
    <div class="guide-actions">
      ${index<4?button('guide-step',nextText,`data-step="${index+1}" ${guideReady()?'':'disabled'}`,'primary-button'):''}
      <div class="guide-actions-secondary">
        ${index?button('guide-step','上一步',`data-step="${index-1}"`,'plain-button'):''}
        ${index>0?button('guide-learn','动手试试',`data-id="${step.anchor}"`,'plain-button'):''}
        ${button('guide-exit','退出引导','','plain-button')}
      </div>
    </div>`;
  positionGuide();renderGuideCues();
}
function activateGuide(index,{record=true,animate=true,fit=true,rememberView=false}={}){
  if(!scene?.relationshipMap||!guideSteps[index]||journeyOpen)return;
  if(rememberView)remember();
  if(record&&!recordGuide(index,true))return;
  if(!guideVisible||index===0)guideObserved=new Set();
  if(scene.guideFocus?.step!==index||!guideVisible)guideWalkSeen=new Set();
  guideVisible=true;guideSuspended=false;closePopovers();
  scene.setGuideFocus(guideSteps,index,{animate,fit});
  scene.setGuideTargets(guideTargets().map(t=>t.key),[...guideObserved]);
  setHash(guideSteps[index].overview?null:'node:'+guideSteps[index].anchor);
  renderFocus();renderGuide();renderLocation();scheduleSave();
}
function visitGuideTarget(key){
  if(!guideVisible||!guideTargets().some(t=>t.key===key))return false;
  const index=learning.daily.guide?.step||0;
  if(index===4){
    leaveGuide();
    choose(key,{openLesson:false,inPlace:true});
    return true;
  }
  guideWalkSeen.add(key);guideObserved.add(key);
  if(index===0){activateGuide(1);return true;}
  scene.setGuideTargets(guideTargets().map(t=>t.key),[...guideObserved]);
  renderGuide();scheduleSave();
  return true;
}
function leaveGuide({record=true}={}){if(!guideVisible&&!guideSuspended)return;const step=learning.daily.guide?.step||0;guideVisible=false;guideSuspended=false;guideWalkSeen=new Set();guideObserved=new Set();scene.clearGuideFocus();if(record)recordGuide(step,false);renderGuide();renderFocus();renderLocation();scheduleSave();}
function returnFromLesson(){if(journeySuspended)resumeJourney();const resumeGuide=guideSuspended&&learning.daily.guide?.active&&scene.relationshipMap&&guideSteps[learning.daily.guide.step];if(!resumeGuide)guideSuspended=false;const stableKnowledge=scene.relationshipMap&&!resumeGuide&&space.byKey.get(scene.selected)?.kind==='node';const selected=scene.selected;closeJourney(!resumeGuide&&!stableKnowledge);if(resumeGuide)activateGuide(learning.daily.guide.step,{record:false});else if(stableKnowledge){scene.select(selected);scene.setRelations('source');setHash(selected);renderFocus();renderLocation();scheduleSave();}setTaskSurfaceUrl('explore',{replace:true});restoreTaskSurface();}
function closePopovers(){document.querySelectorAll('.popover').forEach(p=>p.hidden=true);}
function setHash(key){history.replaceState(null,'',key?'#space/'+key.replace(':','/'):'#space');}
function deselectKnowledge(){if(!scene)return;remember();scene.select(null);activeRouteId=null;scene.setLearningRoute(null);scene.setLearningSection(null);setHash(null);renderFocus();renderLocation();scheduleSave();}
function focusSelected(){const o=space.byKey.get(scene.selected);if(o&&scene.canLocate(o)){scene.panIntoViewWithoutZoom(o,true);scheduleSave();}}
function choose(key,{animate=true,history=true,openLesson=worldLayout!=='network',inPlace=true}={}){const object=space.byKey.get(key);if(!object)return;if(guideVisible){visitGuideTarget(key);return;}if(journeyOpen)closeJourney(false);if(guideVisible||guideSuspended)leaveGuide();else if(learning.daily.guide?.active&&scene.relationshipMap)recordGuide(learning.daily.guide.step,false);if(history)remember();pointerPreview=null;focusPreview=null;scene.setPreview(null);closePopovers();activeRouteId=null;scene.setLearningRoute(null);scene.setLearningSection(null);if(inPlace){if(scene.relationshipMap&&!scene.selected&&object.kind==='node'&&animate)scene.beginViewTransition('to-focus',850);else scene.viewTransition=null;scene.select(key);}else scene.focus(key,{animate});setHash(key);
  if(object.kind==='node')mutateLearning(s=>{s.visited[object.id]??=now();s.openedPacks[object.packId]??=now();});
  else if(object.kind==='pack')mutateLearning(s=>{s.openedPacks[object.id]??=now();});
  if(object.kind==='node'&&openLesson){const lesson=lessonForTopic(object.id);if(lesson)openLearningLesson(lesson);else if(routeStep(object.id))openJourney(routeStep(object.id).step);}
  renderFocus();renderLocation();scheduleSave();
}
function overview({animate=true,saveHistory=true}={}){if(journeyOpen)closeJourney(false);if(guideVisible||guideSuspended)leaveGuide();if(saveHistory)remember();closePopovers();activeRouteId=null;scene.setLearningRoute(null);scene.setLearningSection(null);scene.overview(animate);setHash(null);renderFocus();renderLocation();scheduleSave();}
function back(){if(journeyOpen)closeJourney(false);if(guideVisible||guideSuspended)leaveGuide();const previous=visits.pop();if(!previous)return;pointerPreview=null;focusPreview=null;scene.select(previous.selected);activeRouteId=previous.learningRouteId||null;setHash(previous.selected);$('#back-button').disabled=!visits.length;renderFocus();renderLocation();restoreFocus(previous);scheduleSave();}
// A single relationship panorama. Stage selection changes emphasis only; no nodes or positions move.
function renderGradeMapFilter(){
  const host=$('#grade-map-filter');if(!scene||!host)return;
  host.hidden=worldLayout!=='network'||!scene.relationshipMap||guideVisible||journeyOpen;
  for(const b of host.querySelectorAll('[data-action="grade-map-stage"]'))
    b.setAttribute('aria-pressed',String(b.dataset.stage===selectedGradeStage));
  const status=$('#grade-map-filter-status');
  if(!gradePanoramaData){
    scene.setGradeStageFilter('all');
    status.textContent='正在读取课程映射…';
    return;
  }
  const chosen=gradeMapSelection(gradePanoramaData,selectedGradeStage);
  scene.setGradeStageFilter(chosen.stageId,chosen.nodeIds);
  status.textContent=chosen.stageId==='all'
    ?'537个领域知识点 · 完整关系不变'
    :`突出${chosen.mappedCount}个节点 · 其他节点浅色保留，真实关系与位置不变`;
}
function ensureGradePanoramaData(){
  if(gradePanoramaData)return Promise.resolve(gradePanoramaData);
  if(!gradePanoramaPromise){
    gradePanoramaPromise=loadGradePanoramaData().then(data=>{gradePanoramaData=data;gradeNodeMappingsById=new Map(data.nodeMappings.map(item=>[item.nodeId,item]));return data;}).catch(error=>{gradePanoramaPromise=null;throw error;});
  }
  return gradePanoramaPromise;
}

function renderLocation(){renderNetworkGuide();renderContinue();const o=space.byKey.get(scene.selected);$('#current-place').textContent=o?displayTitle(o):'整个数学空间';$('#scale-label').textContent=scene.localRelationshipFocus?'局部探索':o?objectLevelLabel(o):'全貌';updatePrimaryNavigation();}
function renderNetworkGuide(){
  if(!scene||worldLayout!=='network')return;
  const mode=scene.networkView,current=scene.global,direction=scene.camera.position.clone().sub(scene.controls.target).normalize();
  const expected=mode==='map'?[0,1,.0001]:mode==='relations'?[0,0,1]:[.65,.5,1],length=Math.hypot(...expected);
  const rotated=current&&(direction.x*expected[0]+direction.y*expected[1]+direction.z*expected[2])/length<.99995;
  document.body.dataset.networkView=mode;document.body.dataset.networkVersion=String(scene.networkVersion);document.body.dataset.mapFocus=scene.hoverMapKey?.split(':')[0]||(scene.hoverThemeId?'theme':scene.selected?.split(':')[0]||'overview');
  $('.tool-rail [data-action="front"]').textContent='归位';
  $('#network-view-title').textContent=scene.localRelationshipFocus?'局部探索 · 从当前知识出发':current?(rotated?'自由视角 · 整张知识地图':mode==='map'?'顶视 · 知识分布':mode==='relations'?'侧视 · 基础到后续':'立体总览 · 整张知识地图'):'保存时的空间';
  $('#network-view-description').textContent=scene.localRelationshipFocus?`当前知识、真实直接联系与走过的路径高亮（${Math.max(0,scene.explorationTrail.length-1)} 步）；其他知识仍以浅色保留在同一张图。点「全貌」取消选择，镜头不变；点「归位」主动重新取景。`:current?(rotated?'正在从不同角度观察同一张图。点顶视、侧视或立体总览可以回到对应视角。':scene.relationshipMap?(mode==='relations'?'关键基础在下，后续在上；辅助联系不决定高度。':'颜色表示主题，位置参考知识联系。数学思维可在搜索和联系中查看。'):mode==='map'?'五个主题、23 组内容。每个点的位置固定，连线连接真实关系。':mode==='relations'?'关键前项在下，后项在上；虚线辅助联系不决定高度。':'颜色分主题，聚集分内容，高度沿关键关系展开。转动查看同一张图。'):'已恢复旧记录的位置。点击顶视、侧视或立体总览，进入整体地图。';
  const activeTheme=space.byKey.get(scene.selected);
  if(scene.relationshipMap&&activeTheme?.kind==='theme'){
    const packs=activeTheme.children.map(k=>space.byKey.get(k)).filter(p=>p?.kind==='pack');
    const mapped=packs.reduce((sum,p)=>sum+p.nodeIds.filter(id=>space.relationshipIds.has(id)).length,0);
    $('#network-view-title').textContent=`主题 · ${activeTheme.title}`;
    $('#network-view-description').textContent=`聚焦 ${packs.length} 个真实知识群、${mapped} 个地图知识点。左侧可按问题选一个知识群；其他主题仍在背景中。`;
  }
  if(scene.relationshipMap&&activeTheme?.kind==='pack'){
    const theme=space.themes.get(activeTheme.themeId);
    const mapped=activeTheme.nodeIds.filter(id=>space.relationshipIds.has(id)).length;
    $('#network-view-title').textContent=`知识群 · ${activeTheme.title}`;
    $('#network-view-description').textContent=`属于「${theme?.title||''}」 · ${mapped} 个地图知识点；仅本群名称参与地图标注，其余知识点保留为淡色背景。`;
  }
  if(scene.structuralOverview&&!scene.localRelationshipFocus){
    const labels={origin:'起点',fork:'分叉',join:'汇合',all:'同时比较'};
    $('#network-view-title').textContent='全貌 · 观察'+(labels[scene.structureMode]||'真实关系');
    $('#network-view-description').textContent=scene.structureMode==='all'?'正在同时对照三组真实关系示例；可切回单一结构减少干扰。':'仅突出一组真实关系示例。其他知识点仍在原三维坐标，可点击观察或主动切换；不代表唯一数学主干。';
  }
  const hoverObject=scene.relationshipMap?space.byKey.get(scene.hoverMapKey):null;
  const hoverTitle=$('#network-view-title');
  if(hoverObject?.kind==='pack'||hoverObject?.kind==='node'){
    const theme=space.themes.get(hoverObject.themeId),group=hoverObject.kind==='node'?space.packs.get(hoverObject.packId):null;
    const path=[theme?.title,group?.title,hoverObject.kind==='node'?displayTitle(hoverObject):hoverObject.title].filter(Boolean).join(' › ');
    hoverTitle.textContent=path;
    hoverTitle.title=path;
    if(hoverObject.kind==='node'){
      const links=relationsFor(space,hoverObject.key);
      $('#network-view-description').textContent=`正在观察这个知识点 · 直接前置 ${links.filter(l=>l.to===hoverObject.key).length} · 直接后续 ${links.filter(l=>l.from===hoverObject.key).length} · 点击查看详情`;
    }else{
      $('#network-view-description').textContent=`正在观察知识群 · ${hoverObject.nodeIds.filter(id=>space.relationshipIds.has(id)).length} 个地图知识点 · 点击查看详情`;
    }
  }else hoverTitle.removeAttribute('title');
  $('#network-edge-controls').hidden=!scene.relationshipMap;
  renderGradeMapFilter();
  const structureControls=$('#overview-structure-controls');
  if(structureControls){structureControls.hidden=!scene.relationshipMap||!!scene.selected||guideVisible||journeyOpen;
    // The curriculum row changes the guide's height. Anchor structure tools
    // below the actual guide instead of letting a fixed y overlap edge controls.
    if(!structureControls.hidden){
      const top=$('#network-guide')?.getBoundingClientRect().bottom||0;
      const baseline=innerWidth<=600?170:innerWidth<=900?183:210;
      const sideBySide=innerWidth>=920;
      structureControls.style.top=Math.ceil(sideBySide?100:Math.max(baseline,top+9))+'px';
      structureControls.style.left=sideBySide?Math.ceil($('#network-guide').getBoundingClientRect().right+12)+'px':'';
    }
    for(const button of structureControls.querySelectorAll('[data-action="overview-structure"]'))button.setAttribute('aria-pressed',String(button.dataset.structure===scene.structureMode));}
   document.body.dataset.localFocus=scene.localRelationshipFocus?'true':'false';
   const localExit=$('#local-overview-exit');if(localExit)localExit.hidden=!scene.localRelationshipFocus||journeyOpen||guideVisible;
   const allNodesButton=$('[data-action="all-nodes"]');if(allNodesButton)allNodesButton.hidden=scene.relationshipMap;
  if(scene.relationshipMap){const shellButton=$('[data-action="overview-shells"]');if(shellButton){shellButton.hidden=!!scene.selected||!scene.overviewShells.length;shellButton.setAttribute('aria-pressed',String(scene.overviewShellsEnabled));shellButton.textContent=scene.overviewShellsEnabled?'隐藏知识群外壳':`试看知识群外壳 · ${scene.overviewShells.length}`;}for(const b of document.querySelectorAll('[data-action="edge-display"]'))b.setAttribute('aria-pressed',String(b.dataset.edgeDisplay===scene.edgeDisplay));$('#network-edge-hint').textContent=scene.edgeDisplay==='outline'?'只简化背景；选中后仍显示全部直接联系':scene.edgeDisplay==='critical'?'显示全部关键联系；辅助联系可在节点中查看':'显示关键与辅助联系';}
  for(const b of document.querySelectorAll('#network-legend [data-action="network-theme"]'))b.setAttribute('aria-pressed',String(scene.selected==='theme:'+b.dataset.id));
  const guide=learning.daily.guide,guideEntry=$('[data-action="guide-start"]');guideEntry.hidden=!guideSteps.length||guideVisible||journeyOpen;guideEntry.textContent=guide?.step>0&&guide.step<guideSteps.length-1?'继续发现知识的联系':'发现知识的联系';
  for(const b of document.querySelectorAll('[data-action="network-view"]')){const match=b.dataset.view==='side'?'relations':b.dataset.view==='top'?'map':'oblique';b.setAttribute('aria-pressed',String(current&&!rotated&&match===mode));b.disabled=false;if(b.dataset.view==='oblique')b.textContent=scene.localRelationshipFocus?'立体视角':'立体总览';b.title='只转动镜头，知识点保持原位';}
}
function networkRelations(o,relations){
  const fv=scene.localRelationshipFocus?scene.focusView:null;
  const focusFilters=fv?`<div class="focus-filter" aria-label="按真实数学关系过滤">
    <div class="focus-filter-row"><strong>观察方向</strong><div role="group" aria-label="观察方向">${[['before','看基础'],['after','看后续'],['both','两边都看']].map(([value,label])=>button('focus-direction',label,`data-direction="${value}" aria-pressed="${scene.focusDirection===value}"`,'focus-filter-button')).join('')}</div></div>
    <div class="focus-filter-row"><strong>展开范围</strong><div role="group" aria-label="展开范围">${[['1','直接联系'],['2','再展开一层'],['all','完整关系']].map(([value,label])=>button('focus-depth',label,`data-depth="${value}" aria-pressed="${scene.focusDepth===value}"`,'focus-filter-button')).join('')}</div></div>
    <p class="focus-filter-count" role="status">当前高亮 ${fv.counts.nodes} 个知识点、${fv.counts.edges} 条真实联系；其余 ${fv.counts.hidden} 个领域知识点仍以浅色背景保留。</p>
  </div>`:'';
  const mode=scene.global?scene.traceMode:'direct',directions=fv?focusFilters:scene.global?`<div class="trace-modes" aria-label="关系范围">${[['direct','直接联系'],['before','追溯基础'],['after','查看后续']].map(([id,title])=>button('trace-mode',title,`data-mode="${id}" aria-pressed="${mode===id}"`,'trace-button')).join('')}</div>${scene.relationMode==='off'?'<p class="trace-note">当前连线处于收起状态，点“直接联系”可以点亮。</p>':''}`:'';
  if(mode!=='direct'){
    const trace=scene.traceResult,groups=new Map();for(const id of trace.nodes){const d=trace.distances.get(id);if(!groups.has(d))groups.set(d,[]);groups.get(d).push(id);}
    return `<div class="network-explore">${directions}<p class="trace-note">来源中的关键${mode==='before'?'基础':'后续'}：${trace.nodes.length} 个相关内容，${trace.edges.length} 条联系。数字是最短经过的联系数，不改变地图位置。</p><div class="network-relations trace-list">${[...groups].map(([d,ids])=>`<section><h3>隔 ${d} 条联系 · ${ids.length}</h3>${ids.map(id=>{const item=space.nodes.get(id);return `<div class="network-relation" data-preview-key="${item.key}">${button('choose',`<span>${esc(displayTitle(item))}</span>${scene.canLocate(item)?'':'<small>数学思维 · 可查看联系</small>'}`,`data-key="${item.key}"`,'relation-button')}<span class="preview-hint" aria-live="polite"></span></div>`;}).join('')}</section>`).join('')||'<p class="quiet">来源没有列出这个方向的关键联系。</p>'}</div></div>`;
  }
  const sections=['before','after'].map(side=>{const list=relations.filter(l=>side==='before'?l.to===o.key:l.from===o.key);return `<section><h3>${relationHeading(side)} · ${list.length}</h3>${list.map(l=>{const other=space.byKey.get(side==='before'?l.from:l.to),edge=l.edges[0],bridge=Object.values(BRIDGES).find(b=>b.fromTopicId===edge.prerequisiteId&&b.topicId===edge.topicId),why=relationExplanation(edge);return `<div class="network-relation" data-preview-key="${other.key}">${button('choose',`${esc(displayTitle(other))}<small>${esc(space.packs.get(other.packId).title)} · ${relationStrength(edge.strength)}${scene.canLocate(other)?'':' · 数学思维，在学习中查看'}</small>`,`data-key="${other.key}"`,'relation-button')}<span class="preview-hint" aria-live="polite"></span><p class="relation-reason${why.reviewed?'':' pending'}">${why.reviewed?esc(why.text):'中文理由正在核对，可先看来源原文。'}</p>${edge.reason?`<details><summary>来源原文</summary><p>${esc(edge.reason)}</p></details>`:''}${bridge?button('bridge',`一起做：${esc(bridge.title)} · ${lessonSummary(learning.daily.bridges[bridge.id]).completed?'✓ 完成':'○ 未完成'}`,`data-id="${bridge.id}"`,'plain-button'):''}</div>`;}).join('')||'<p class="quiet">源图没有列出这个方向的联系。</p>'}</section>`;});
  return `<div class="network-explore">${directions}<details class="network-relations" ${scene.global?'open':''}><summary>直接联系 · ${relations.length}</summary>${sections.join('')}</details></div>`;
}
function nextIdea(o){if(!scene.relationshipMap||o.kind!=='node')return '';const pending=pendingQuestions(learning).map(q=>q.nodeId).filter(Boolean),edge=linkedSuggestions(atlas,o.id,{hasActivity:id=>!!lessonForTopic(id),isComplete:id=>nodeState(learning,id).progress==='completed',pendingNodes:pending})[0];if(!edge)return '';const target=space.nodes.get(edge.topicId),why=relationExplanation(edge);return `<section class="next-idea"><small>${pending.includes(target.id)?'这里有你留下的问题':'从这里可以接着看'}</small>${button('choose',`${esc(displayTitle(target))} →`,`data-key="${target.key}"`,'plain-button')}<details><summary>为什么可以接着看？</summary><p>${why.reviewed?esc(why.text):'来源中列出了这条联系，理由正在核对。'}</p></details></section>`;}

function themeOverview(o){
  // A theme is a choice of real knowledge groups, never a prescribed study order.
  const packs=o.children.map(key=>space.byKey.get(key)).filter(p=>p?.kind==='pack');
  const visible=id=>space.relationshipIds?.has(id);
  const nodeCount=packs.reduce((sum,p)=>sum+p.nodeIds.length,0);
  const mapCount=packs.reduce((sum,p)=>sum+p.nodeIds.filter(visible).length,0);
  const thinkingCount=nodeCount-mapCount;
  const choices=packs.map(p=>{
    const mapped=p.nodeIds.filter(visible).length,extra=p.nodeIds.length-mapped;
    const meta=extra? `地图知识点 ${mapped} 个 · 数学思维 ${extra} 个`:`${p.nodeIds.length} 个知识点`;
    return button('choose',`<span class="theme-pack-title">${esc(p.title)}</span><span class="theme-pack-question">${esc(p.question||'查看本组的知识和联系')}</span><span class="theme-pack-meta">${meta}<span aria-hidden="true">→</span></span>`,`data-key="${p.key}"`,'theme-pack-choice');
  }).join('');
  return `<div class="theme-overview" data-theme-id="${esc(o.id)}" data-pack-count="${packs.length}" data-node-count="${nodeCount}" data-map-count="${mapCount}">
    <p class="theme-overview-intro">${esc(o.description)}</p>
    <div class="theme-overview-counts" aria-label="该主题的真实内容规模"><span><strong>${packs.length}</strong> 个知识群</span><span><strong>${mapCount}</strong> 个地图知识点</span>${thinkingCount?`<span class="theme-thinking-count">另有 ${thinkingCount} 个数学思维内容（不在地图上单独显示）</span>`:''}</div>
    <div class="theme-overview-guide"><strong>从哪个问题开始？</strong><p>任选一个知识群，进一步查看它的知识与真实联系。这里没有规定的学习顺序。</p></div>
    <nav class="theme-pack-list" aria-label="${esc(o.title)}的知识群">${choices}</nav>
    <p class="theme-overview-footnote">地图上仍保留其他主题作为空间参照；主题分组不代表新增数学前置关系。</p>
  </div>`;
}

function renderGradeDistribution(o){
  if(!scene?.relationshipMap||!['theme','pack'].includes(o.kind))return '';
  if(!gradePanoramaData)return '<section class="grade-distribution"><h3>小学学段分布</h3><p>正在读取节点级课程映射…</p></section>';
  const stats=gradeDistribution(atlas,gradePanoramaData,o.kind,o.id);
  return stats?renderGradeDistributionHTML(stats,{
    selectedStage:selectedGradeStage,
    nodeTitle:id=>displayTitle(space.nodes.get(id)),
    nodeRole:(id,stage)=>GRADE_ROLE_LABELS[gradeNodeMappingsById.get(id)?.curriculum.roles?.[stage]]||'已映射'
  }):'';
}
function renderGradeNodePosition(o){
  if(worldLayout!=='network')return '';
  const packName=space.packs.get(o.packId)?.title||o.packId||'未记录';
  if(!gradePanoramaData){
    if(gradePositionLoadTimer)clearTimeout(gradePositionLoadTimer);
    gradePositionLoadTimer=setTimeout(()=>{
      gradePositionLoadTimer=null;
      if(scene?.selected!==o.key||journeyOpen)return;
      ensureGradePanoramaData().then(()=>{if(scene?.selected===o.key&&!journeyOpen)renderFocus();}).catch(()=>{
        const host=$('#focus-card .grade-node-position');
        if(host&&scene?.selected===o.key&&!journeyOpen)host.innerHTML='<h3>小学阶段位置</h3><p>阶段信息暂时无法读取；原知识点和关系仍可继续查看。</p>';
      });
    },800);
    return '<section class="grade-node-position"><h3>小学阶段位置</h3><p>正在读取节点课程阶段信息…</p></section>';
  }
  const thinking=gradePanoramaData.specialRisks.thinkingNodes.ids.includes(o.id);
  if(thinking)return `<section class="grade-node-position" aria-label="小学阶段位置"><h3>小学阶段位置</h3><p class="grade-node-status">数学思维节点 · 独立内容，不分配小学学段。</p><p>所属知识群：${esc(packName)}</p></section>`;
  const mapping=gradeNodeMappingsById.get(o.id);
  if(!mapping)return `<section class="grade-node-position" aria-label="小学阶段位置"><h3>小学阶段位置</h3><p>当前没有该节点的课程阶段映射记录，不推断年级归属。</p><p>所属知识群：${esc(packName)}</p></section>`;
  const primary=mapping.curriculum.primaryStages||[];
  const stageTags=gradePanoramaData.stages.map(stage=>{
    const role=mapping.curriculum.roles?.[stage.id];
    const label=role?`${stage.label}：${role}（${GRADE_ROLE_LABELS[role]||role}）`:`${stage.label}：未映射`;
    return `<span class="grade-node-stage-tag" data-stage-id="${esc(stage.id)}" data-role="${esc(role||'unmapped')}">${esc(label)}</span>`;
  }).join('');
  const stageMarkup=primary.length?`<div class="grade-node-stage-tags" aria-label="小学各学段节点角色">${stageTags}</div>`:'<p class="grade-node-no-primary">小学阶段：未纳入当前课程阶段映射</p>';
  const beyondRole=mapping.curriculum.beyondPrimary?.role;
  const beyondMarkup=beyondRole?`<p class="grade-node-beyond">初中后续：${esc(beyondRole)}（${esc(GRADE_ROLE_LABELS[beyondRole]||beyondRole)}）</p>`:'';
  const evidence=mapping.curriculum.evidenceLevelLabel||mapping.curriculum.evidenceLevel||'未提供';
  const unresolved=gradePanoramaData.specialRisks.unresolvedNode?.id===o.id;
  const unresolvedMarkup=unresolved?`<p class="grade-node-unresolved">${esc(gradePanoramaData.specialRisks.unresolvedNode.status)}</p>`:'';
  return `<section class="grade-node-position" aria-label="小学阶段位置"><h3>小学阶段位置</h3>${stageMarkup}${beyondMarkup}${unresolvedMarkup}<p class="grade-node-position-evidence">证据：<strong data-evidence="${esc(mapping.curriculum.evidenceLevel)}">${esc(evidence)}</strong></p><p>所属知识群：${esc(packName)}</p></section>`;
}


function conceptVisualHtml(kind){
  if(kind==='equal-fraction-bars'){
    return '<details class="concept-mode concept-visual-mode"><summary>看图理解</summary>'+
      '<figure class="concept-visual"><svg viewBox="0 0 240 112" role="img" aria-label="两个等长整体，上面二等分涂一份，下面四等分涂两份，涂色长度一样">'+
      '<text x="4" y="25">1/2</text><rect x="42" y="8" width="180" height="26" fill="#f2eee2" stroke="#74897f"/>'+
      '<rect x="42" y="8" width="90" height="26" fill="#dfb477"/><path d="M132 8V34" stroke="#74897f"/>'+
      '<text x="4" y="76">2/4</text><rect x="42" y="59" width="180" height="26" fill="#f2eee2" stroke="#74897f"/>'+
      '<rect x="42" y="59" width="90" height="26" fill="#dfb477"/>'+
      '<path d="M87 59V85 M132 59V85 M177 59V85" stroke="#74897f"/>'+
      '</svg><figcaption>整体相同、涂色长度相同：1/2＝2/4。只改变分法，不改变所表示的数。</figcaption></figure></details>';
  }
  if(kind==='linear-function-graph'){
    return '<details class="concept-mode concept-visual-mode"><summary>看图理解</summary>'+
      '<figure class="concept-visual"><svg viewBox="0 0 280 176" role="img" aria-label="直线 y=2x+1，经过 (0，1)、(1，3)、(2，5) 三个点">'+
      '<path d="M42 24V144H254" fill="none" stroke="#74897f" stroke-width="1.5"/>'+
      '<path d="M50 24V144 M120 24V144 M190 24V144 M42 120H254 M42 72H254 M42 24H254" fill="none" stroke="#dfe4dc" stroke-width="1"/>'+
      '<path d="M50 120L190 24" fill="none" stroke="#c98e45" stroke-width="3"/>'+
      '<circle cx="50" cy="120" r="4.5" fill="#c98e45"/><circle cx="120" cy="72" r="4.5" fill="#c98e45"/><circle cx="190" cy="24" r="4.5" fill="#c98e45"/>'+
      '<text x="27" y="124">1</text><text x="27" y="76">3</text><text x="27" y="28">5</text>'+
      '<text x="47" y="160">0</text><text x="117" y="160">1</text><text x="187" y="160">2</text>'+
      '<text x="260" y="148">x</text><text x="31" y="16">y</text><text x="158" y="54">y = 2x + 1</text>'+
      '<text x="54" y="113">(0,1)</text><text x="124" y="65">(1,3)</text><text x="194" y="19">(2,5)</text>'+
      '</svg><figcaption>每个点都满足同一个关系式 y＝2x＋1；横坐标 x 对应纵坐标 y，三个点落在同一条直线上。</figcaption></figure></details>';
  }
  if(kind==='ratio-bar-model'){
    return '<details class="concept-mode concept-visual-mode"><summary>看图理解</summary>'+
      '<figure class="concept-visual"><svg viewBox="0 0 300 118" role="img" aria-label="30张贴纸按2比3分成5个相等单位，第一份占2格得到12张，第二份占3格得到18张">'+
      '<text x="110" y="19" text-anchor="middle">第一份：2份</text><text x="210" y="19" text-anchor="middle">第二份：3份</text>'+
      '<rect x="70" y="30" width="40" height="42" fill="#dfb477" stroke="#74897f"/><rect x="110" y="30" width="40" height="42" fill="#dfb477" stroke="#74897f"/>'+
      '<rect x="150" y="30" width="40" height="42" fill="#a8c5d6" stroke="#74897f"/><rect x="190" y="30" width="40" height="42" fill="#a8c5d6" stroke="#74897f"/><rect x="230" y="30" width="40" height="42" fill="#a8c5d6" stroke="#74897f"/>'+
      '<text x="110" y="94" text-anchor="middle">12张</text><text x="210" y="94" text-anchor="middle">18张</text>'+
      '</svg><figcaption>5 格大小相同，每格 6 张：前 2 格是 12 张，后 3 格是 18 张。</figcaption></figure></details>';
  }
  if(kind==='venn-two-sets'){
    return '<details class="concept-mode concept-visual-mode"><summary>看图理解</summary>'+
      '<figure class="concept-visual"><svg viewBox="0 0 320 190" role="img" aria-label="30名学生的韦恩图：只喜欢足球10人，两项都喜欢6人，只喜欢板球8人，两项都不喜欢6人">'+
      '<rect x="12" y="10" width="296" height="166" rx="5" fill="none" stroke="#74897f"/>'+
      '<circle cx="112" cy="92" r="58" fill="#dfb477" fill-opacity=".42" stroke="#b18a50" stroke-width="2"/>'+
      '<circle cx="208" cy="92" r="58" fill="#a8c5d6" fill-opacity=".48" stroke="#688ba0" stroke-width="2"/>'+
      '<text x="95" y="25" text-anchor="middle">喜欢足球</text><text x="160" y="25" text-anchor="middle">共30人</text><text x="225" y="25" text-anchor="middle">喜欢板球</text>'+
      '<text x="78" y="98" text-anchor="middle">10</text><text x="160" y="98" text-anchor="middle">6</text><text x="242" y="98" text-anchor="middle">8</text>'+
      '<text x="160" y="164" text-anchor="middle">都不喜欢：6</text>'+
      '</svg><figcaption>交叠处的 6 人同时属于两组；两个圆合起来有 24 人，圆外还有 6 人。</figcaption></figure></details>';
  }
  if(kind==='multiplication-array'){
    return '<details class="concept-mode concept-visual-mode"><summary>看图理解</summary>'+
      '<figure class="concept-visual"><svg viewBox="0 0 300 184" role="img" aria-label="3行4列的排列方阵，共12个圆点；3乘4等于12，12除以3等于4">'+
      '<text x="160" y="17" text-anchor="middle">每行 4 个</text><text x="10" y="82">3 行</text>'+
      '<g fill="#dfb477" stroke="#9a794c" stroke-width="1">'+
      '<circle cx="78" cy="42" r="11"/><circle cx="123" cy="42" r="11"/><circle cx="168" cy="42" r="11"/><circle cx="213" cy="42" r="11"/>'+
      '<circle cx="78" cy="82" r="11"/><circle cx="123" cy="82" r="11"/><circle cx="168" cy="82" r="11"/><circle cx="213" cy="82" r="11"/>'+
      '<circle cx="78" cy="122" r="11"/><circle cx="123" cy="122" r="11"/><circle cx="168" cy="122" r="11"/><circle cx="213" cy="122" r="11"/>'+
      '</g><text x="150" y="164" text-anchor="middle">3×4＝12　12÷3＝4</text>'+
      '</svg><figcaption>3 行、每行 4 个，共 12 个；已知总数和行数，也能反过来求每行数量。</figcaption></figure></details>';
  }
  if(kind==='area-distributive-model'){
    return '<details class="concept-mode concept-visual-mode"><summary>看图理解</summary>'+
      '<figure class="concept-visual"><svg viewBox="0 0 300 180" role="img" aria-label="一个高3、宽4加2的长方形分成两个部分，左边面积3乘4等于12，右边面积3乘2等于6，总面积18">'+
      '<text x="120" y="25" text-anchor="middle">4</text><text x="210" y="25" text-anchor="middle">2</text><text x="42" y="88">3</text>'+
      '<rect x="60" y="38" width="120" height="90" fill="#dfb477" fill-opacity=".65" stroke="#74897f" stroke-width="1.5"/>'+
      '<rect x="180" y="38" width="60" height="90" fill="#a8c5d6" fill-opacity=".7" stroke="#74897f" stroke-width="1.5"/>'+
      '<path d="M90 38V128 M120 38V128 M150 38V128 M210 38V128 M60 68H240 M60 98H240" fill="none" stroke="#74897f" stroke-width=".8"/>'+
      '<text x="120" y="88" text-anchor="middle">12</text><text x="210" y="88" text-anchor="middle">6</text>'+
      '<text x="150" y="158" text-anchor="middle">3×(4＋2)＝12＋6＝18</text>'+
      '</svg><figcaption>把大长方形分成两块，面积相加；括号里的 4 和 2 都要乘以高度 3。</figcaption></figure></details>';
  }
  if(kind==='dot-plot'){
    return '<details class="concept-mode concept-visual-mode"><summary>看图理解</summary>'+
      '<figure class="concept-visual"><svg viewBox="0 0 340 205" role="img" aria-label="20名学生读书本数的点图，每个点代表1名学生，5本出现6次，7本没有出现">'+
      '<text x="170" y="16" text-anchor="middle">每个点代表 1 名学生</text><path d="M16 150H324" stroke="#74897f" stroke-width="1.5"/>'+
      '<g fill="#dfb477" stroke="#9a794c" stroke-width=".8">'+
      '<circle cx="24" cy="140" r="4.5"/><circle cx="48" cy="140" r="4.5"/>'+
      '<circle cx="72" cy="140" r="4.5"/><circle cx="72" cy="127" r="4.5"/>'+
      '<circle cx="96" cy="140" r="4.5"/><circle cx="96" cy="127" r="4.5"/><circle cx="96" cy="114" r="4.5"/><circle cx="96" cy="101" r="4.5"/>'+
      '<circle cx="120" cy="140" r="4.5"/><circle cx="120" cy="127" r="4.5"/>'+
      '<circle cx="144" cy="140" r="4.5"/><circle cx="144" cy="127" r="4.5"/><circle cx="144" cy="114" r="4.5"/><circle cx="144" cy="101" r="4.5"/><circle cx="144" cy="88" r="4.5"/><circle cx="144" cy="75" r="4.5"/>'+
      '<circle cx="168" cy="140" r="4.5"/><circle cx="216" cy="140" r="4.5"/><circle cx="264" cy="140" r="4.5"/><circle cx="312" cy="140" r="4.5"/>'+
      '</g>'+
      '<g fill="#394c42" font-size="11" text-anchor="middle">'+
      '<text x="24" y="170">0</text><text x="48" y="170">1</text><text x="72" y="170">2</text><text x="96" y="170">3</text><text x="120" y="170">4</text><text x="144" y="170">5</text><text x="168" y="170">6</text><text x="192" y="170">7</text><text x="216" y="170">8</text><text x="240" y="170">9</text><text x="264" y="170">10</text><text x="288" y="170">11</text><text x="312" y="170">12</text>'+
      '</g><text x="170" y="196" text-anchor="middle">读书本数（本）</text>'+
      '</svg><figcaption>5 本上方有 6 个点，表示 6 名学生各读了 5 本；7 的位置留空，表示没有人读 7 本。</figcaption></figure></details>';
  }
  if(kind==='histogram'){
    return '<details class="concept-mode concept-visual-mode"><summary>看图理解</summary>'+
      '<figure class="concept-visual"><svg viewBox="0 0 320 200" role="img" aria-label="30名学生身高直方图，五个连续区间的频数分别为3、7、10、6、4，区间宽度均为10厘米">'+
      '<path d="M30 24V150H292" fill="none" stroke="#74897f" stroke-width="1.5"/><text x="8" y="18">人数</text>'+
      '<g fill="#a8c5d6" stroke="#688ba0" stroke-width="1">'+
      '<rect x="30" y="126" width="52" height="24"/><rect x="82" y="94" width="52" height="56"/><rect x="134" y="70" width="52" height="80"/><rect x="186" y="102" width="52" height="48"/><rect x="238" y="118" width="52" height="32"/>'+
      '</g>'+
      '<g fill="#394c42" font-size="12" text-anchor="middle">'+
      '<text x="56" y="120">3</text><text x="108" y="88">7</text><text x="160" y="64">10</text><text x="212" y="96">6</text><text x="264" y="112">4</text>'+
      '<text x="30" y="170">130</text><text x="82" y="170">140</text><text x="134" y="170">150</text><text x="186" y="170">160</text><text x="238" y="170">170</text><text x="290" y="170">180</text>'+
      '</g><text x="160" y="195" text-anchor="middle">身高（厘米）</text>'+
      '</svg><figcaption>区间连续，所以长条相连；150 厘米归入 150≤h＜160 这一组。</figcaption></figure></details>';
  }
  if(kind==='box-plot'){
    return '<details class="concept-mode concept-visual-mode"><summary>看图理解</summary>'+
      '<figure class="concept-visual"><svg viewBox="0 0 330 190" role="img" aria-label="箱线图五数概括为3、6、9、14、21，中位数9，四分位距8，极差18">'+
      '<text x="165" y="16" text-anchor="middle">五数概括：3、6、9、14、21</text>'+
      '<path d="M58 78H91 M181 78H259 M58 62V94 M259 62V94" fill="none" stroke="#74897f" stroke-width="2"/>'+
      '<rect x="91" y="52" width="90" height="52" fill="#dfb477" fill-opacity=".55" stroke="#9a794c" stroke-width="2"/>'+
      '<path d="M125 52V104" stroke="#9a794c" stroke-width="3"/>'+
      '<path d="M24 118H304" stroke="#74897f" stroke-width="1.5"/>'+
      '<g fill="#394c42" font-size="11" text-anchor="middle">'+
      '<text x="58" y="48">3</text><text x="91" y="42">6</text><text x="125" y="42">9</text><text x="181" y="42">14</text><text x="259" y="48">21</text>'+
      '<text x="24" y="136">0</text><text x="80" y="136">5</text><text x="136" y="136">10</text><text x="192" y="136">15</text><text x="248" y="136">20</text><text x="304" y="136">25</text>'+
      '</g><text x="165" y="172" text-anchor="middle">四分位距＝14－6＝8；极差＝21－3＝18</text>'+
      '</svg><figcaption>箱体表示中间一半数据；须线长短表示数值跨度，不表示这一段有更多或更少的人。</figcaption></figure></details>';
  }
  if(kind==='cube-net'){
    return '<details class="concept-mode concept-visual-mode"><summary>看图理解</summary>'+
      '<figure class="concept-visual"><svg viewBox="0 0 260 180" role="img" aria-label="一种正方体展开图，由四个正方形排成一行，第二个正方形上方和下方各连接一个正方形">'+
      '<g fill="#dfb477" fill-opacity=".65" stroke="#74897f" stroke-width="1.5">'+
      '<rect x="30" y="70" width="40" height="40"/><rect x="70" y="70" width="40" height="40"/><rect x="110" y="70" width="40" height="40"/><rect x="150" y="70" width="40" height="40"/><rect x="70" y="30" width="40" height="40"/><rect x="70" y="110" width="40" height="40"/>'+
      '</g><g fill="#394c42" font-size="14" font-weight="650" text-anchor="middle">'+
      '<text x="50" y="95">1</text><text x="90" y="95">2</text><text x="130" y="95">3</text><text x="170" y="95">4</text><text x="90" y="55">5</text><text x="90" y="135">6</text>'+
      '</g><text x="130" y="170" text-anchor="middle">六个面折起后组成正方体</text>'+
      '</svg><figcaption>每个正方形对应一个面；折起后六个面各出现一次，不能互相重叠。</figcaption></figure></details>';
  }

  if(kind==='coordinate-grid'){
    return '<details class="concept-mode concept-visual-mode"><summary>看图理解</summary>'+
      '<figure class="concept-visual"><svg viewBox="0 0 300 190" role="img" aria-label="坐标网格：A(1，1)、B(1，4)、C(5，4)、D(5，1)依次连接成一个长方形；先读横坐标，再读纵坐标">'+
      '<path d="M48 154H250 M48 154V18" fill="none" stroke="#74897f" stroke-width="1.6"/>'+
      '<path d="M78 34V154 M108 34V154 M138 34V154 M168 34V154 M198 34V154 M228 34V154 M48 124H228 M48 94H228 M48 64H228 M48 34H228" fill="none" stroke="#dfe4dc" stroke-width="1"/>'+
      '<g fill="#394c42" font-size="11" text-anchor="middle"><text x="78" y="170">1</text><text x="108" y="170">2</text><text x="138" y="170">3</text><text x="168" y="170">4</text><text x="198" y="170">5</text></g>'+
      '<g fill="#394c42" font-size="11" text-anchor="end"><text x="39" y="128">1</text><text x="39" y="98">2</text><text x="39" y="68">3</text><text x="39" y="38">4</text></g>'+
      '<path d="M78 124L78 34L198 34L198 124Z" fill="#dfb477" fill-opacity=".35" stroke="#b18a50" stroke-width="2.5"/>'+
      '<g fill="#c98e45" stroke="#fff" stroke-width="1.2"><circle cx="78" cy="124" r="4.5"/><circle cx="78" cy="34" r="4.5"/><circle cx="198" cy="34" r="4.5"/><circle cx="198" cy="124" r="4.5"/></g>'+
      '<g fill="#394c42" font-size="11" font-weight="650"><text x="84" y="141">A</text><text x="84" y="24">B</text><text x="204" y="24">C</text><text x="204" y="141">D</text><text x="258" y="158">x</text><text x="39" y="14">y</text></g>'+
      '</svg><figcaption>先按第一个数找到横向位置，再按第二个数找到纵向位置。A、B、C、D 依次连接，得到长 4 格、宽 3 格的长方形。</figcaption></figure></details>';
  }
  if(kind==='grid-transformations'){
    return '<details class="concept-mode concept-visual-mode"><summary>看图理解</summary>'+
      '<figure class="concept-visual"><svg viewBox="0 0 360 190" role="img" aria-label="网格上的三种图形变换：平移让三角形整体移动，反射让三角形关于竖直镜线翻转，旋转让三角形绕中心转动">'+
      '<g fill="none" stroke="#dfe4dc" stroke-width=".8"><path d="M10 50H112 M10 80H112 M10 110H112 M10 140H112 M30 40V150 M55 40V150 M80 40V150 M105 40V150 M128 50H232 M128 80H232 M128 110H232 M128 140H232 M148 40V150 M173 40V150 M198 40V150 M223 40V150 M246 50H350 M246 80H350 M246 110H350 M246 140H350 M266 40V150 M291 40V150 M316 40V150 M341 40V150"/></g>'+
      '<g fill="#394c42" font-size="12" font-weight="650" text-anchor="middle"><text x="61" y="24">平移</text><text x="180" y="24">反射</text><text x="299" y="24">旋转</text></g>'+
      '<path d="M22 130L42 130L22 110Z" fill="#dfb477" fill-opacity=".7" stroke="#9a794c" stroke-width="1.5"/><path d="M55 110L75 110L55 90Z" fill="#a8c5d6" fill-opacity=".8" stroke="#688ba0" stroke-width="1.5"/><path d="M43 120L52 111" stroke="#74897f" stroke-width="1.4"/>'+
      '<path d="M180 42V150" stroke="#74897f" stroke-width="1.7" stroke-dasharray="4 3"/><path d="M142 130L162 130L142 110Z" fill="#dfb477" fill-opacity=".7" stroke="#9a794c" stroke-width="1.5"/><path d="M218 130L198 130L218 110Z" fill="#a8c5d6" fill-opacity=".8" stroke="#688ba0" stroke-width="1.5"/>'+
      '<path d="M260 130L280 130L260 110Z" fill="#dfb477" fill-opacity=".7" stroke="#9a794c" stroke-width="1.5"/><path d="M280 70L280 90L300 70Z" fill="#a8c5d6" fill-opacity=".8" stroke="#688ba0" stroke-width="1.5"/><circle cx="300" cy="110" r="3" fill="#394c42"/>'+
      '<g fill="#394c42" font-size="10" text-anchor="middle"><text x="61" y="166">整体挪动</text><text x="180" y="166">镜线翻转</text><text x="299" y="166">绕中心转</text></g>'+
      '</svg><figcaption>三种变换都保持图形的大小和形状；平移与旋转保持朝向，反射会把朝向翻转。</figcaption></figure></details>';
  }
  if(kind==='triangle-parallelogram-area'){
    return '<details class="concept-mode concept-visual-mode"><summary>看图理解</summary>'+
      '<figure class="concept-visual"><svg viewBox="0 0 340 170" role="img" aria-label="垂直高：平行四边形剪下左端三角形并移到右端，拼成同底同高的长方形；高与底垂直">'+
      '<text x="70" y="20" text-anchor="middle" fill="#394c42" font-size="12">原来的平行四边形</text><text x="242" y="20" text-anchor="middle" fill="#394c42" font-size="12">剪拼后的长方形</text>'+
      '<path d="M30 55L130 55L105 120L5 120Z" fill="#dfb477" fill-opacity=".38" stroke="#9a794c" stroke-width="1.7"/>'+
      '<path d="M5 120L30 55L30 120Z" fill="#a8c5d6" fill-opacity=".85" stroke="#688ba0" stroke-width="1.5"/>'+
      '<path d="M30 55V120" stroke="#74897f" stroke-width="1.2" stroke-dasharray="3 3"/><path d="M30 111H39V120" fill="none" stroke="#74897f" stroke-width="1"/>'+
      '<text x="12" y="88" fill="#394c42" font-size="10">高 h</text><text x="66" y="137" fill="#394c42" font-size="11">底 b</text>'+
      '<path d="M145 88H176 M169 82L176 88L169 94" fill="none" stroke="#74897f" stroke-width="1.8"/>'+
      '<path data-part="remaining-trapezoid" d="M190 55H290L265 120H190Z" fill="#dfb477" fill-opacity=".38" stroke="#9a794c" stroke-width="1.7"/>'+
      '<path data-part="moved-triangle" d="M265 120L290 55L290 120Z" fill="#a8c5d6" fill-opacity=".85" stroke="#688ba0" stroke-width="1.5"/>'+
      '<path d="M190 55H290V120H190Z" fill="none" stroke="#9a794c" stroke-width="1.7"/>'+
      '<path d="M190 55V120" stroke="#74897f" stroke-width="1.2" stroke-dasharray="3 3"/><path d="M190 111H199V120" fill="none" stroke="#74897f" stroke-width="1"/>'+
      '<text x="178" y="88" fill="#394c42" font-size="10">h</text><text x="230" y="137" fill="#394c42" font-size="11">底 b</text>'+
      '<text x="170" y="158" text-anchor="middle" fill="#394c42" font-size="11">平行四边形：b×h　　三角形：b×h÷2</text>'+
      '</svg><figcaption>剪下并移动三角形，面积不变，平行四边形变成长方形；同底同高的三角形面积是它的一半。高必须垂直于底。</figcaption></figure></details>';
  }
  if(kind==='polygon-area-decomposition'){
    return '<details class="concept-mode concept-visual-mode"><summary>看图理解</summary>'+
      '<figure class="concept-visual"><svg viewBox="0 0 340 205" role="img" aria-label="梯形分割：不等腰梯形，上底6厘米，下底10厘米，高4厘米；左侧三角形底1厘米，右侧三角形底3厘米，两个三角形不相等，合计底长4厘米；分割面积32平方厘米">'+
      '<text x="160" y="18" text-anchor="middle" fill="#394c42" font-size="12">不等腰梯形：长方形＋两个不等三角形</text>'+
      '<path d="M80 50L200 50L260 122L60 122Z" fill="#dfb477" fill-opacity=".3" stroke="#9a794c" stroke-width="1.7"/>'+
      '<path data-part="left-triangle" d="M60 122L80 50L80 122Z" fill="#a8c5d6" fill-opacity=".85"/>'+
      '<rect data-part="central-rectangle" x="80" y="50" width="120" height="72" fill="#dfb477" fill-opacity=".38"/>'+
      '<path data-part="right-triangle" d="M200 50L260 122L200 122Z" fill="#a8c5d6" fill-opacity=".85"/>'+
      '<path d="M80 50V122 M200 50V122" stroke="#688ba0" stroke-width="1.5" stroke-dasharray="4 3"/>'+
      '<path d="M80 112H90V122" fill="none" stroke="#74897f" stroke-width="1.2"/>'+
      '<path d="M80 50L200 50L260 122L60 122Z" fill="none" stroke="#9a794c" stroke-width="1.7"/>'+
      '<g fill="#394c42" font-size="11" text-anchor="middle"><text x="140" y="42">上底 6 cm</text><text x="160" y="160">下底 10 cm</text><text x="97" y="91">高 4 cm</text><text x="70" y="141">1 cm</text><text x="230" y="141">3 cm</text><text x="170" y="188">6×4＋(10−6)×4÷2＝32 cm²</text></g>'+
      '</svg><figcaption>中间长方形面积为 6×4＝24 平方厘米；两侧三角形的底长合计 10−6＝4 厘米，面积合计 4×4÷2＝8 平方厘米。两侧三角形不必相等。</figcaption></figure></details>';
  }
  return '';
}
function conceptExplanationHtml(id){
  const c=conceptHelpFor(id);
  if(!c)return '';
  const modes=[
    ['换个说法',[c.simpler]],
    ['举例与反例',[c.example,c.counterexample]],
    ['自己试一试',[c.tryIt]],
    ['为什么',[c.why]]
  ];
  const textModes=modes.map(([label,parts])=>
    '<details class="concept-mode"><summary>'+esc(label)+'</summary>'+
    parts.map(part=>'<p>'+esc(part)+'</p>').join('')+'</details>'
  );
  // The visual aid follows the plain-language option, so it is discoverable
  // without scrolling past every written explanation.
  const content=textModes[0]+conceptVisualHtml(c.visual)+textModes.slice(1).join('');
  return '<section class="concept-help" aria-label="理解数学概念">'+
    '<p class="concept-term">数学概念 · '+esc(c.formal)+'</p>'+
    '<p class="concept-definition">'+esc(c.definition)+'</p>'+
    '<details class="concept-alternatives"><summary>没看懂？换种方式理解</summary><div class="concept-modes">'+content+'</div></details>'+
  '</section>';
}
function renderFocus(){if(!scene)return;const card=$('#focus-card'),o=space.byKey.get(scene.selected);if(!o||(journeyOpen&&!journeySuspended)||guideVisible||panels.has(o.id)){card.hidden=true;document.body.classList.remove('has-context-card');return;}
  card.dataset.kind=o.kind;if(worldLayout==='network')card.style.visibility='visible';card.style.setProperty('--object-color',o.color);
  const same=card.dataset.currentKey===scene.selected,priorScroll=same?card.scrollTop:0,priorFocus=same?document.activeElement?.closest?.('[data-preview-key]')?.dataset.previewKey:null;const relations=relationsFor(space,o.key),before=relations.filter(e=>e.to===o.key).length,after=relations.filter(e=>e.from===o.key).length;
  let body='';
  if(o.kind==='node'){const state=nodeState(learning,o.id),legacy=activityFor(o.id),lesson=lessonForTopic(o.id),a=legacy||lesson,markers=worldLayout==='network'?[scene.savedScenes?.has(o.id)?'有未完现场':'',scene.queuedQuestions?.has(o.id)?'有待续问题':''].filter(Boolean):[];body=`${a?`<p class="status-text"><i class="status-dot ${completionClass(state)}"></i>${PROGRESS[state.progress]}</p>`:''}${scene.canLocate(o)?'':'<p class="quiet">这个数学思维内容不在地图上单独显示；可以查看联系或打开相关活动。</p>'}<div class="focus-actions">${button('open',a?'打开学习':'查看联系',`data-id="${o.id}"`,'primary-button')}${button('bookmark',learning.bookmarks.includes(o.id)?'已收藏':'收藏',`data-id="${o.id}"`)}${worldLayout==='network'&&legacy&&learning.activities[legacy]?button('open-legacy','打开早期现场',`data-id="${o.id}"`):''}${worldLayout==='network'&&scene.queuedQuestions?.has(o.id)?button('questions','看看留下的问题'):''}</div>${worldLayout==='network'?`<section class="focus-context-section" data-context-section="understand" aria-label="理解">${conceptExplanationHtml(o.id)}<nav class="focus-section-nav" aria-label="知识详情分组"><button type="button" data-action="focus-section" data-section="understand">理解</button><button type="button" data-action="focus-section" data-section="relations">联系</button><button type="button" data-action="focus-section" data-section="learn">学习与接续</button></nav></section>`:''}${scene.global&&a&&!markers.length?'':`<p class="quiet">${markers.length?markers.join(' · '):a?'这里已有动手活动':'动手活动准备中，可以先看联系'}</p>`}${worldLayout==='network'?`<section class="focus-context-section" data-context-section="learn"><h3>学习与接续</h3><p class="network-concept">可以试：${esc(LESSONS[lesson]?.title||ACTIVITIES[legacy]?.title||o.title)}</p><div class="activity-forms">${activityForms(o.id).map(f=>`<span>${activityGlyph(f)}${ACTIVITY_FORMS[f].label}</span>`).join('')}</div>${renderGradeNodePosition(o)}${nextIdea(o)}</section><section class="focus-context-section" data-context-section="relations"><h3>联系</h3>${relations.length?'<p class="network-focus-key"><span class="before">基础 → 这里</span><span class="after">这里 → 后续</span></p>':''}${scene.global?'':button('network-view','从侧面看整张图','data-view="side"','soft-button')}${networkRelations(o,relations)}</section>`:''}`;}
  else if(o.kind==='pack'&&routeForPack(o.id)){const routes=routesForPack(o.id),route=routes.find(r=>r.id===activeRouteId)||(routes.length===1?routes[0]:null);if(!route){const sections=ROUTE_SECTIONS.filter(s=>routes.some(r=>routeSection(r,o.id)===s.id)),section=sections.find(s=>s.id===scene.learningSectionId);if(sections.length&&!section)body=`<p class="quiet">先挑一个想试的方向。</p><div class="route-choices">${sections.map(s=>button('choose-section',esc(s.title),`data-id="${s.id}"`,'route-choice route-set')).join('')}</div>`;else{const allChoices=section?routes.filter(r=>routeSection(r,o.id)===section.id):routes,page=Math.min(scene.learningRoutePage||0,Math.floor((allChoices.length-1)/3)),choices=allChoices.slice(page*3,page*3+3);body=`<p class="quiet">${section?esc(section.title):'选一条小路线开始，也可以随时换。'}</p><div class="route-choices">${choices.map(r=>button('choose-route',`${esc(r.title)}<small>${r.ids.length} 个学习环节</small>`,`data-id="${r.id}"`,'route-choice route-set')).join('')}</div>${allChoices.length>3?`<div class="route-pages">${button('route-page','上一组',`data-page="${page-1}" ${page===0?'disabled':''}`,'plain-button')}${button('route-page','再看看',`data-page="${page+1}" ${(page+1)*3>=allChoices.length?'disabled':''}`,'plain-button')}</div>`:''}${section?button('choose-section','换个方向','data-id=""','plain-button'):''}`;}}else{const links=Object.values(BRIDGES).filter(b=>route.ids.includes(b.to));body=`<p class="quiet">${esc(route.title)} · 可以跳着看</p><ol class="route-choices">${route.ids.map((id,i)=>{const n=LESSONS[id],status=nodeState(learning,n.topicId).progress==='completed'?'✓ 完成':'○ 未完成';return `<li>${button('choose',`<span class="route-number">${route.id}–${String(i+1).padStart(2,'0')}</span><span>${n.title}<small>${status}</small></span>`,`data-key="node:${n.topicId}"`,'route-choice')}</li>`;}).join('')}</ol>${links.length?`<details class="route-links"><summary>把想法连起来</summary>${links.map(b=>button('bridge',`<small>${LESSONS[b.from].title} ↔ ${LESSONS[b.to].title}</small>${esc(b.title)}<small>${esc(b.summary)}</small><small>${lessonSummary(learning.daily.bridges[b.id]).completed?'✓ 完成':'○ 未完成'}</small>`,`data-id="${b.id}"`,'bridge-choice')).join('')}</details>`:''}${routes.length>1?button('choose-route','换条小路线','data-id=""','plain-button'):''}`;}body+=`<div class="focus-actions">${button('list-pack','查看这里的全部知识',`data-id="${o.id}"`,'plain-button')}</div>`;}

  else if(o.kind==='pack'){const mapped=o.nodeIds.filter(id=>space.relationshipIds?.has(id)).length,extra=o.nodeIds.length-mapped;body=`<p>${esc(o.question)}</p><p class="quiet">${scene.relationshipMap?`${mapped} 个地图知识点${extra?` · ${extra} 个数学思维内容`:''}`:`${o.nodeIds.length} 个相关内容`}${o.activityIds.length?` · ${o.activityIds.length} 个活动可打开`:''}</p><div class="focus-actions">${button('list-pack','查看本群内容',`data-id="${o.id}"`)}</div>`;}
  else if(o.kind==='theme'&&scene.relationshipMap)body=themeOverview(o);
  else body=`<p>${esc(o.description)}</p><p class="quiet">${o.children.length} 簇想法，点一个名字靠近。</p>`;
  if(o.kind==='pack'||o.kind==='theme')body+=renderGradeDistribution(o);
  const previouslyOpen=new Set([...card.querySelectorAll('.grade-stage-list[open],.grade-group-list[open]')].map(el=>el.classList.contains('grade-group-list')?'groups':el.dataset.stage));
  card.innerHTML=`<div class="focus-sticky"><div class="focus-heading"><span class="overline">${objectLevelLabel(o)}</span>${scene.canLocate(o)?button('focus-selected','聚焦所选','','plain-button'):''}${button('deselect','×','aria-label="取消选择，不移动镜头"','plain-button')}</div><h2>${esc(displayTitle(o))}</h2></div>${body}${relations.length&&!(scene.global&&o.kind==='node')?`<div class="relationship-key">${button('toggle-relations',scene.relationMode==='off'?'看看这里的联系':'收起联系',`aria-pressed="${scene.relationMode!=='off'}"`,'plain-button')}</div>`:''}`;card.hidden=false;card.dataset.currentKey=scene.selected;document.body.classList.add('has-context-card');
  if(same)for(const details of card.querySelectorAll('.grade-stage-list,.grade-group-list'))if(previouslyOpen.has(details.classList.contains('grade-group-list')?'groups':details.dataset.stage))details.open=true;
  card.scrollTop=priorScroll;if(priorFocus)restoreFocus({traceScroll:priorScroll,traceFocused:priorFocus});
  // The card has just changed height. Position it now, not on the next WebGL frame;
  // a rapid selection at a compact desktop viewport must never show stale bounds.
  if(worldLayout==='network')updateOverlays();
}
function openJourney(step,{restore=false}={}){
  journeySuspended=false;hideLearningHub();closeUtility();
  for(const id of [...panels.keys()])closePanel(id);
  scene.setRelations('off');
  journeyOpen=true;$('#journey-surface').style.removeProperty('--learning-desired-height');$('#journey-surface').hidden=false;document.body.classList.add('has-journey');
  $('#focus-card').hidden=true;$('#journey-surface header span').textContent='早期路线 A';const frame=$('#journey-frame');frame.src=`journey.html#${step}`;
  // The task workspace is independent of the 3D camera: never fly a map behind a lesson.
  scene.tween=null;scene.viewTransition=null;
  $('#journey-surface [data-action="close-journey"]').textContent='返回知识空间 ×';
  updatePrimaryNavigation();scheduleSave();
}
function openLearningLesson(id,{restore=false,questionId=null}={}){
 if(!sessionMeta(id))return;journeySuspended=false;hideLearningHub();closeUtility();closePopovers();for(const key of [...panels.keys()])closePanel(key);
 if(guideVisible){guideVisible=false;guideSuspended=true;scene.clearGuideFocus();renderGuide();}
 activeRouteId=sessionRoute(id).id;scene.setLearningRoute(activeRouteId);activeSessionId=id;activeQuestionId=questionId;activeLessonId=BRIDGES[id]?.to||id;journeyOpen=true;$('#journey-surface').style.removeProperty('--learning-desired-height');scene.select('node:'+sessionMeta(id).topicId);setHash('node:'+sessionMeta(id).topicId);scene.setRelations('off');$('#journey-surface').hidden=false;document.body.classList.add('has-journey');$('#focus-card').hidden=true;$('#continue-card').hidden=true;
 $('#journey-surface [data-action="close-journey"]').textContent='返回知识空间 ×';
 $('#journey-surface header span').textContent='路线 '+sessionRoute(id).id;$('#journey-surface').setAttribute('aria-label',sessionRoute(id).title+' · 操作现场');$('#journey-frame').title=sessionMeta(id).title+' · 操作现场';$('#journey-frame').src=`learn.html${questionId?'?question='+encodeURIComponent(questionId):''}#${id}`;
 // Learning should open as a stable workspace, not move or zoom the hidden map.
 scene.tween=null;scene.viewTransition=null;
 renderLocation();updatePrimaryNavigation();scheduleSave();
}

function suspendJourney(){if(!journeyOpen||journeySuspended)return;journeySuspended=true;document.body.classList.remove('has-journey');$('#journey-surface').hidden=true;renderFocus();renderLocation();updatePrimaryNavigation();scheduleSave();}
function resumeJourney(){if(!journeyOpen||!journeySuspended)return;journeySuspended=false;$('#journey-surface').hidden=false;document.body.classList.add('has-journey');$('#focus-card').hidden=true;updatePrimaryNavigation();scheduleSave();}
function closeJourney(returnToPack=false){journeySuspended=false;const route=activeLessonId?routeFor(activeLessonId):null,pack=route?.packIds[0]||'same-amount';activeLessonId=null;activeSessionId=null;activeQuestionId=null;journeyOpen=false;$('#journey-surface').hidden=true;$('#journey-surface').style.removeProperty('--learning-desired-height');$('#journey-frame').src='about:blank';document.body.classList.remove('has-journey');scene.setRelations('off');if(returnToPack){choose('pack:'+pack);activeRouteId=route?.id||null;scene.setLearningRoute(activeRouteId);renderFocus();}updatePrimaryNavigation();scheduleSave();}
function openSearch(packId=null){if(!$('#learning-hub').hidden||!$('#utility-drawer').hidden)navigateTaskSurface('explore');searchPack=packId;searchLimit=24;closePopovers();$('#search-popover').hidden=false;$('#search-input').value='';$('#search-label').textContent=packId?space.packs.get(packId).title:'查找主题、知识群或知识点';renderSearch();$('#search-input').focus();}
function renderSearch(){const q=$('#search-input').value.trim().toLowerCase();let matches;
  if(searchPack)matches=space.packs.get(searchPack).nodeIds.map(id=>space.nodes.get(id));
  else if(!q)matches=[...space.themes.values(),...learning.bookmarks.map(id=>space.nodes.get(id))];
  else matches=space.objects.filter(o=>(o.title+' '+(o.name||'')+' '+o.id+' '+displayTitle(o)+' '+(o.kind==='node'?LESSONS[lessonForTopic(o.id)]?.title||'':'')).toLowerCase().includes(q));
  if(searchPack&&q)matches=matches.filter(o=>(o.title+' '+(o.name||'')+' '+o.id+' '+displayTitle(o)+' '+(o.kind==='node'?LESSONS[lessonForTopic(o.id)]?.title||'':'')).toLowerCase().includes(q));
  $('#search-results').innerHTML=matches.length?matches.slice(0,searchLimit).map(o=>button('choose',`<span>${esc(displayTitle(o))}<small>${o.kind==='node'?`${space.packs.get(o.packId).title}${(activityFor(o.id)||lessonForTopic(o.id))?' · '+PROGRESS[nodeState(learning,o.id).progress]:''}`:o.kind==='pack'?'知识群':'主题'}</small></span><span aria-hidden="true">↗</span>`,`data-key="${o.key}"`,'search-result')).join(''):'<p class="empty-search">还没找到这个名字，可以换个词。</p>';
  $('#search-count').textContent=q||searchPack?`找到 ${matches.length} 个，显示 ${Math.min(searchLimit,matches.length)} 个`:'选一个方向，或输入想找的名字';
  $('#search-more').hidden=matches.length<=searchLimit;
}
function relationButtons(id){const links=relationsFor(space,objectKey('node',id));return ['before','after'].map(side=>{const list=links.filter(e=>side==='before'?e.to===objectKey('node',id):e.from===objectKey('node',id));return `<section class="panel-relations"><h3>${relationHeading(side)} <small>${list.length}</small></h3>${list.map(e=>{const other=space.byKey.get(side==='before'?e.from:e.to);return button('choose',`${esc(displayTitle(other))}<small>${space.packs.get(other.packId).title} · ${relationStrength(e.edges[0].strength)}</small>`,`data-key="${other.key}"`,'relation-button');}).join('')||'<p class="quiet">原图暂未列出这个方向的数学联系。</p>'}</section>`;}).join('');}
function overviewContent(id){const n=space.nodes.get(id),activity=activityFor(id),s=nodeState(learning,id);return `<div class="panel-intro">${activity?`<span class="status-text"><i class="status-dot ${completionClass(s)}"></i>${PROGRESS[s.progress]}</span>`:''}<h2>${esc(displayTitle(n))}</h2><p>${activity?esc(ACTIVITIES[activity].goal):'这个知识点暂无独立学习活动，可以先查看相关基础和后续知识。'}</p>${button('bookmark',learning.bookmarks.includes(id)?'已收藏':'收藏',`data-id="${id}"`)}</div>${relationButtons(id)}<details class="source-details"><summary>原始定义与目标</summary><p>${esc(n.name)}</p><p>${esc(n.description)}</p><ul>${n.evidence.map(e=>`<li>${esc(e)}</li>`).join('')}</ul><p class="quiet">原始节点 ${esc(n.id)} · 来源 os-taxonomy。空间分类为本地组织。</p></details>`;}
function recordContent(id){const k=activityFor(id),a=k&&learning.activities[k],s=nodeState(learning,id);if(!a)return `<div class="panel-intro"><h2>留在这里的足迹</h2><p>${learning.visited[id]?`看过联系 · ${date(learning.visited[id])}`:'这里还没有探索记录。'}</p><p class="quiet">打开、浏览和收藏会保留；它们不代表已经理解。</p></div>`;
  const e=evidenceSummary(a);return `<div class="panel-intro"><h2>留在这里的足迹</h2><p>${PROGRESS[s.progress]} · ${e.demonstrated?'有独立操作与迁移证据':e.needsSupport?'还有需要支持的地方':'正在收集理解证据'}</p><p class="quiet">解释单独保存，内容待确认。</p></div>${e.kinds.map(k=>`<div class="record-item"><b>${k.kind==='construct'?'自己的构造':'换情境的尝试'}</b><p>${({none:'还没有提交作品',independent:'有本次独立操作证据',supported:'有支持的尝试'})[k.status]}${k.attempts?` · ${k.attempts} 次提交`:''}</p></div>`).join('')}<div class="record-item"><b>自由探索</b><p>保存了 ${a.observations.length} 次发现</p></div>${a.notes.map(n=>`<div class="record-item"><small>${date(n.at)} · 解释待确认</small><p>${esc(n.text)}</p></div>`).join('')}${button('journal','查看完整作品与备份','','soft-button')}`;
}
function renderPanelSection(panel,tab,{activate=true}={}){panel.tab=tab;for(const [key,section]of Object.entries(panel.sections))section.hidden=key!==tab;panel.el.querySelectorAll('[data-panel-tab]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.panelTab===tab)));
  if(tab==='overview')panel.sections.overview.innerHTML=overviewContent(panel.id);
  if(tab==='records')panel.sections.records.innerHTML=recordContent(panel.id);
  if(tab==='activity'&&!panel.iframe){const key=activityFor(panel.id),frame=document.createElement('iframe');frame.title=ACTIVITIES[key].title;frame.className='activity-frame';frame.src=`v2.html?embedded=1#activity/${key}`;panel.sections.activity.append(frame);panel.iframe=frame;}
  if(activate){panel.minimized=false;panel.el.classList.remove('minimized');}scheduleSave();scene.dirty=true;
}
function openPanel(id,{anchor=null,minimized=false,restore=false,tab=null,expanded=false}={}){if(!space.nodes.has(id))return;closePopovers();if(panels.has(id)){activePanel=id;panels.get(id).minimized=false;renderWorkspaceButtons();scene.dirty=true;return;}
  if(panels.size===2){toast('已经展开两个工作面。关闭其中一个后，可以再打开新的。');return;}
  const n=space.nodes.get(id),activity=activityFor(id),el=document.createElement('section');el.className='work-panel';el.dataset.node=id;el.setAttribute('aria-label',displayTitle(n)+'的工作面');el.style.setProperty('--object-color',n.color);
  el.innerHTML=`<header class="work-header"><span class="work-title" title="${esc(displayTitle(n))}">${esc(displayTitle(n))}</span><div>${button('resize-panel','放大',`data-id="${id}" aria-label="调整${esc(displayTitle(n))}工作面大小"`,'plain-button')}${button('minimize-panel','收起',`data-id="${id}"`,'plain-button')}${button('close-panel','×',`data-id="${id}" aria-label="关闭${esc(displayTitle(n))}工作面"`,'plain-button')}</div></header><nav class="work-tabs" aria-label="工作面内容">${[['overview','联系'],...(activity?[['activity','动手']]:[]),['records','记录']].map(([key,title])=>`<button type="button" data-panel-tab="${key}" data-id="${id}">${title}</button>`).join('')}</nav><div class="work-content"><div class="work-section" data-section="overview"></div>${activity?'<div class="work-section iframe-section" data-section="activity" hidden></div>':''}<div class="work-section" data-section="records" hidden></div></div>`;
  const sections=Object.fromEntries([...el.querySelectorAll('[data-section]')].map(s=>[s.dataset.section,s]));
  const p={id,el,sections,anchor:anchor||[...n.position],minimized,expanded,tab:'overview'};panels.set(id,p);activePanel=id;$('#workspaces').append(el);renderPanelSection(p,Object.hasOwn(sections,tab)?tab:activity?'activity':'overview');p.minimized=minimized;
  if(!restore){mutateLearning(s=>{s.visited[id]??=now();s.openedPacks[n.packId]??=now();});scene.select(n.key);setHash(n.key);arrangePanels();}
  renderWorkspaceButtons();renderFocus();scheduleSave();scene.dirty=true;
}
function closePanel(id){const p=panels.get(id);if(!p)return;p.el.remove();panels.delete(id);if(activePanel===id)activePanel=[...panels.keys()].at(-1)||null;renderWorkspaceButtons();renderFocus();scheduleSave();scene.dirty=true;}
function renderWorkspaceButtons(){document.body.classList.toggle('has-workspaces',!!panels.size);const bar=$('#workspace-list');bar.hidden=!panels.size;bar.innerHTML=[...panels.values()].map(p=>button('locate-panel',esc(displayTitle(space.nodes.get(p.id))),`data-id="${p.id}"`,p.id===activePanel?'workspace-chip active':'workspace-chip')).join('')+(panels.size===2?button('arrange','并排看','','workspace-chip'):'');}
function arrangePanels(){if(!panels.size)return;
  // Panel arrangement is a UI operation, not permission to move the camera.
  renderWorkspaceButtons();scene.dirty=true;scheduleSave();
}
function updateOverlays(){
  positionGuide();renderGuideCues();
  const o=space.byKey.get(scene.selected),card=$('#focus-card');if(o&&!card.hidden){const p=scene.project(o.position);if(worldLayout!=='network'&&!p.visible)card.style.visibility='hidden';else {card.style.visibility='visible';const minCardTop=innerWidth>800?112:innerWidth>620?138:112;
    if(worldLayout==='network'){
      // A single stable context rail: no chasing projected nodes and no
      // shifting the knowledge card as the camera or selected node changes.
      const viewportBottom=innerHeight<=780?74:94;
      const compact=innerWidth<=800,side=compact?12:innerWidth<=1100?18:24;
      const top=compact?143:94;
      const panelWidth=compact?Math.min(360,innerWidth-24):Math.min(354,Math.max(285,innerWidth*.265));
      const availableHeight=Math.max(180,innerHeight-top-viewportBottom);
      card.style.left=`${Math.max(side,innerWidth-panelWidth-side)}px`;
      card.style.top=`${top}px`;
      card.style.width=`${panelWidth}px`;
      card.style.maxWidth=`calc(100vw - ${side*2}px)`;
      card.style.maxHeight=`${availableHeight}px`;
      card.style.visibility='visible';
    }else{
      const width=card.offsetWidth,height=card.offsetHeight;
      const docked=o.kind!=='node'&&innerWidth>760;
      const left=docked?30:Math.max(16,Math.min(innerWidth-width-22,p.x+120));
      card.style.left=`${left}px`;
      card.style.top=`${docked?142:Math.max(110,Math.min(innerHeight-height-145,p.y-height*.25))}px`;
    }
  }}
  const tethers=[];for(const p of panels.values()){
    const projected=scene.project(p.anchor),source=scene.project(space.nodes.get(p.id).position),far=projected.distance>1450,compact=innerWidth<760;
    const visible=!p.minimized&&(!compact||activePanel===p.id);p.el.hidden=!visible;if(!visible)continue;
    const minimized=p.minimized;p.el.classList.toggle('minimized',minimized);p.el.classList.toggle('distant',far);
    const width=minimized?230:Math.min(panels.size===2&&!compact?innerWidth*.36:p.expanded?620:480,Math.max(250,innerWidth*.46)),height=minimized?46:Math.max(220,Math.min(innerHeight-205,p.expanded?740:590));
    p.el.style.width=`${width}px`;p.el.style.height=`${height}px`;
    const x=Math.max(16,innerWidth-width-24),y=Math.max(100,Math.min(innerHeight-height-96,118));
    p.el.style.transform=`translate(${x}px,${y}px)`;p.el.style.zIndex=p.id===activePanel?'5':'4';
    const toggle=p.el.querySelector('[data-action="minimize-panel"]');toggle.textContent=minimized?'展开':'收起';
    p.el.querySelector('[data-action="resize-panel"]').textContent=p.expanded?'缩小':'放大';
    if(source.visible&&scene.canLocate(space.nodes.get(p.id))&&Math.hypot(source.x-x,source.y-y)<230){const edgeX=source.x<x?x:source.x>x+width?x+width:source.x,edgeY=Math.max(y+24,Math.min(y+height-24,source.y));tethers.push(`<path d="M ${source.x.toFixed(1)} ${source.y.toFixed(1)} Q ${((source.x+edgeX)/2).toFixed(1)} ${(source.y-24).toFixed(1)} ${edgeX.toFixed(1)} ${edgeY.toFixed(1)}"/><circle cx="${source.x.toFixed(1)}" cy="${source.y.toFixed(1)}" r="4"/>`);}
  }
  if(journeyOpen&&o?.kind==='node'&&scene.canLocate(o)){const source=scene.project(o.position),r=$('#journey-surface').getBoundingClientRect();if(source.visible&&Math.hypot(source.x-r.left,source.y-r.top)<180)tethers.push(`<path d="M ${source.x} ${source.y} L ${Math.max(r.left,Math.min(r.right,source.x))} ${Math.max(r.top+25,Math.min(r.bottom-25,source.y))}"/>`);}
  $('#work-tethers').innerHTML=tethers.join('');
  const d=scene.camera.position.distanceTo(scene.controls.target)/(scene.global?scene.camera.zoom:1);$('#distance-meter').style.width=`${Math.max(8,Math.min(100,Math.log(8000/d)/Math.log(8000/30)*100))}%`;
  return [...document.querySelectorAll('#focus-card,#guide-panel,#guide-cues .guide-cue,.work-panel,#journey-surface,.tool-rail,#workspace-list,#continue-card,#network-guide')].filter(el=>!el.hidden&&el.style.visibility!=='hidden'&&el.getClientRects().length).map(el=>{const r=el.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height};});
}
// The main navigation is a surface switch over the single map and existing records.
// It does not select knowledge, move a camera or write learning evidence.
function updatePrimaryNavigation(){
  const drawer=$('#utility-drawer'),hub=$('#learning-hub');
  const active=journeyOpen&&!journeySuspended||!hub.hidden?'learn':!drawer.hidden&&drawer.dataset.surface==='trail'?'trail':'explore';
  for(const b of document.querySelectorAll('.primary-nav [data-surface]'))
    b.setAttribute('aria-pressed',String(b.dataset.surface===active));
  document.body.classList.toggle('has-task-surface',!hub.hidden||!drawer.hidden);
  document.body.classList.toggle('has-context-card',!$('#focus-card').hidden&&!journeyOpen&&hub.hidden&&drawer.hidden);
  // A context surface changes background legibility, not the camera pose.
  if(scene)scene.dirty=true;
}
function hideLearningHub(){$('#learning-hub').hidden=true;updatePrimaryNavigation();}
function closeUtility(){
  const drawer=$('#utility-drawer');drawer.hidden=true;delete drawer.dataset.surface;
  // Keep the embedded trail DOM and scroll position while the drawer is closed.
  updatePrimaryNavigation();
}
// Task URLs are independent of the knowledge hash, camera and learning data.
function setTaskSurfaceUrl(surface,{replace=false}={}){
  const url=new URL(location.href);
  if(surface==='explore')url.searchParams.delete('surface');
  else url.searchParams.set('surface',surface);
  if(surface==='explore'&&(url.hash==='#trail'||url.hash==='#about'))
    url.hash=scene?.selected?'#space/'+scene.selected.replace(':','/'):'#space';
  if(url.href!==location.href)history[replace?'replaceState':'pushState'](history.state,'',url.href);
}
function navigateTaskSurface(surface,{replace=false}={}){
  if(journeyOpen){if(surface==='learn'){closeUtility();hideLearningHub();resumeJourney();}else{suspendJourney();if(surface==='trail'||surface==='about')showUtility(surface);else{hideLearningHub();closeUtility();closePopovers();}}setTaskSurfaceUrl(surface,{replace});updatePrimaryNavigation();return;}
  if(surface==='learn')showLearningHub();
  else if(surface==='trail'||surface==='about')showUtility(surface);
  else{hideLearningHub();closeUtility();closePopovers();}
  setTaskSurfaceUrl(surface,{replace});
}
function restoreTaskSurface({initial=false}={}){
  if(!scene){updatePrimaryNavigation();return;}
  const drawer=$('#utility-drawer'),url=new URL(location.href);
  const legacy=url.hash==='#trail'||url.hash==='#about'?url.hash.slice(1):null;
  const surface=url.searchParams.get('surface')||legacy||'explore';
  if(surface==='learn'){
    if(journeyOpen){closeUtility();hideLearningHub();resumeJourney();}else if($('#learning-hub').hidden)showLearningHub();
  }else if(surface==='trail'||surface==='about'){
    if(journeyOpen)suspendJourney();
    if(drawer.hidden||drawer.dataset.surface!==surface)showUtility(surface);
  }else{
    // A legacy direct lesson URL opens its persisted activity on initial load.
    // Subsequent browser task-history navigation to exploration only suspends it.
    if(journeyOpen&&!initial)suspendJourney();
    if(!$('#learning-hub').hidden)hideLearningHub();
    if(!drawer.hidden)closeUtility();
  }
  updatePrimaryNavigation();
}
function renderLearningHub(){
  if(!scene)return;
  const selected=space.byKey.get(scene.selected),node=selected?.kind==='node'?selected:null;
  const lesson=node?lessonForTopic(node.id):null,legacy=node?activityFor(node.id):null;
  const record=lesson?learning.lessons[lesson]:null,summary=record?lessonSummary(record):null;
  const packId=selected?.kind==='pack'?selected.id:node?.packId;
  const routes=(packId?routesForPack(packId):ROUTES).filter(r=>r.ids.some(id=>LESSONS[id])).slice(0,3);
  const next=continuation(learning),nav=continuationNav(next),sameTask=!!lesson&&next.kind==='session'&&next.sessionId===lesson;
  const current=lesson?button('learn-session','打开学习',`data-id="${esc(lesson)}"`,'primary-button')
    :legacy?button('learn-legacy','打开早期活动',`data-id="${esc(node.id)}"`,'primary-button'):'<p class="quiet">当前知识没有单独的学习活动，可以继续查看联系或选择其他内容。</p>';
  const evidence=summary?.total?`活动操作 ${summary.done}/${summary.total} 项${summary.independent?' · 有首次独立正确操作证据':''}。`:'活动操作与独立证据分别记录。';
  $('#learning-hub-content').innerHTML=`
    <p class="learning-hub-intro">从一个知识开始，动手操作，再查看结果与下一步。活动完成不等于数学掌握。</p>
    ${node?`<section class="learning-hub-section"><span class="overline">当前知识点</span><h2>${esc(displayTitle(node))}</h2><p class="quiet">${esc(evidence)}</p>${current}</section>`:''}
    ${sameTask?'':`<section class="learning-hub-section"><span class="overline">${nav.heading}</span><h2>${esc(next.title)}</h2><p class="quiet">${nav.hint}</p>${button('continue',nav.label,'','primary-button')}</section>`}
    <section class="learning-hub-section"><span class="overline">${packId?'当前知识群':'可选示例'}</span><h2>选一条短路线</h2><p class="quiet">以下来自已配置的学习任务，不表示必须按此顺序掌握。</p><div class="learning-hub-routes">${routes.map(r=>{const first=r.ids.find(id=>LESSONS[id]);return button('learn-session',`${esc(r.title)}<small>${r.ids.length} 个学习环节 · 从「${esc(LESSONS[first].title)}」进入</small>`,`data-id="${esc(first)}"`,'learning-hub-route');}).join('')||'<p class="quiet">该知识群暂无已配置的短路线。</p>'}</div></section>
    <div class="learning-hub-footer">${button('learn-find','查找知识或学习活动')}${button('nav-trail','查看学习足迹')}</div>`;
}
function showLearningHub(){
  if(journeyOpen)return;
  closePopovers();closeUtility();$('#learning-hub').hidden=false;
  renderLearningHub();updatePrimaryNavigation();
}
function showUtility(which){
  hideLearningHub();closePopovers();
  const drawer=$('#utility-drawer');drawer.hidden=false;drawer.dataset.surface=which;
  $('#utility-title').textContent=which==='trail'?'学习足迹 · 记录与备份':'地图与学习的依据';
  const frame=$('#utility-frame');frame.dataset.embeddedSrc=`v2.html?embedded=1#${which}`;
  // Replacing the iframe's current entry prevents its load from consuming the
  // parent's Back/Forward task-history step.
  if(frame.contentWindow.location.href!==new URL(frame.dataset.embeddedSrc,location.href).href)
    frame.contentWindow.location.replace(new URL(frame.dataset.embeddedSrc,location.href).href);
  updatePrimaryNavigation();
}
function download(value,name){const url=URL.createObjectURL(new Blob([JSON.stringify(value,null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1200);}
function applyRoute({initial=false}={}){const bits=location.hash.slice(1).split('/');if(bits[0]==='space'&&bits[1]&&bits[2]){choose(objectKey(bits[1],bits[2]),{animate:!initial,history:!initial});return true;}
  if(['theme','pack','node'].includes(bits[0])&&bits[1]){choose(objectKey(bits[0],bits[1]),{animate:!initial,history:!initial});return true;}
  if(bits[0]==='activity'&&activityIds.includes(bits[1])){const id=ACTIVITIES[bits[1]].topicId;choose(objectKey('node',id),{animate:false,history:!initial,openLesson:false});openPanel(id);return true;}
  if(bits[0]==='atlas'){if(bits[1])choose(objectKey('pack',bits[1]),{animate:!initial,history:!initial});else overview({animate:!initial,saveHistory:!initial});return true;}
  if(bits[0]==='trail'||bits[0]==='about'){showUtility(bits[0]);return true;}return false;
}

document.addEventListener('click',event=>{
  const tab=event.target.closest('[data-panel-tab]');if(tab){renderPanelSection(panels.get(tab.dataset.id),tab.dataset.panelTab);return;}
  const el=event.target.closest('[data-action]');if(!el||!scene)return;const {action,id,key}=el.dataset;
  if(action==='nav-explore')navigateTaskSurface('explore');
   else if(action==='nav-learn')navigateTaskSurface('learn');
   else if(action==='nav-trail')navigateTaskSurface('trail');
   else if(action==='close-learning-hub')navigateTaskSurface('explore',{replace:true});
   else if(action==='learn-find'){navigateTaskSurface('explore',{replace:true});openSearch();}
   else if(action==='learn-session'){hideLearningHub();openLearningLesson(id);}
   else if(action==='learn-legacy'){navigateTaskSurface('explore',{replace:true});openPanel(id);}
   else if(action==='focus-section'){const section=$('#focus-card [data-context-section="'+el.dataset.section+'"]');if(section){const card=$('#focus-card');card.scrollTop=Math.max(0,section.offsetTop-card.querySelector('.focus-sticky').offsetHeight-12);}}
   else if(action==='overview')overview();else if(action==='back')back();else if(action==='focus-selected')focusSelected();else if(action==='choose')choose(key,{inPlace:true,openLesson:!el.closest('.grade-distribution')&&(worldLayout!=='network'||!!el.closest('.route-choices'))});else if(action==='grade-open-pack')choose('pack:'+id,{inPlace:true,openLesson:false});else if(action==='open'){if(guideVisible)return;const lesson=lessonForTopic(id);if(lesson)openLearningLesson(lesson);else openPanel(id);}else if(action==='open-legacy')openPanel(id);
  else if(action==='search')openSearch();else if(action==='list-pack')openSearch(id);else if(action==='search-more'){searchLimit+=24;renderSearch();}
  else if(action==='close-popover')closePopovers();
  else if(action==='grade-map-stage'){
    if(GRADE_MAP_STAGES.includes(el.dataset.stage)){
      selectedGradeStage=el.dataset.stage;renderGradeMapFilter();renderFocus();scheduleSave();
      if(!gradePanoramaData)ensureGradePanoramaData().then(()=>{renderGradeMapFilter();renderFocus();}).catch(error=>{$('#grade-map-filter-status').textContent='课程映射读取失败：'+error.message;});
    }
  }
  else if(action==='deselect'&&scene.relationshipMap)deselectKnowledge();else if(action==='deselect'){if(worldLayout==='network'&&!scene.global&&scene.networkView==='relations')scene.overview();else if(scene.global){const full=scene.wholeMapVisible();scene.select(null);if(full)scene.fitGlobalView();}else scene.select(null);cardHide();setHash(null);renderLocation();scheduleSave();}
  else if(action==='mode'){scene.setMode(el.dataset.mode);document.querySelectorAll('[data-action="mode"]').forEach(b=>b.setAttribute('aria-pressed',String(b===el)));}
  else if(action==='zoom')scene.zoom(Number(el.dataset.factor));else if(action==='front')scene.front();
  else if(action==='network-view'){remember();scene.viewFrom(el.dataset.view);renderLocation();renderFocus();scheduleSave();}
  else if(action==='edge-display'){scene.setEdgeDisplay(el.dataset.edgeDisplay);renderNetworkGuide();scheduleSave();}
  else if(action==='overview-shells'){scene.setOverviewShells(!scene.overviewShellsEnabled);renderNetworkGuide();scheduleSave();}
  else if(action==='overview-structure'){scene.setStructureMode(el.dataset.structure);renderNetworkGuide();scheduleSave();}
  else if(action==='guide-start'){const saved=learning.daily.guide,index=saved&&saved.step<guideSteps.length-1?saved.step:0;activateGuide(index,{rememberView:true});}
  else if(action==='guide-step'){const index=Number(el.dataset.step),current=learning.daily.guide?.step||0;if(index===current+1&&!guideReady())return;if(index>=guideSteps.length)leaveGuide();else activateGuide(index);}
  else if(action==='guide-reset')activateGuide(0);
  else if(action==='guide-exit')leaveGuide();
  else if(action==='guide-visit'){visitGuideTarget(key);}
  else if(action==='guide-node'){if(!visitGuideTarget('node:'+id)){leaveGuide();choose('node:'+id);}}
  else if(action==='guide-learn'){const lesson=lessonForTopic(id);if(lesson)openLearningLesson(lesson);}
  else if(action==='network-theme')choose('theme:'+id);
  else if(action==='help'||action==='menu'){const target=$(`#${action}-popover`),was=target.hidden;closePopovers();target.hidden=!was;}
  else if(action==='all-nodes'&&scene.relationshipMap){overview();}else if(action==='all-nodes'){scene.setAllNodes(!scene.showAllNodes);el.setAttribute('aria-pressed',String(scene.showAllNodes));el.textContent=scene.showAllNodes?'收起所有知识点':'展开所有知识点';closePopovers();scheduleSave();}
  else if(action==='focus-direction'||action==='focus-depth'){
    const dir=action==='focus-direction'?el.dataset.direction:scene.focusDirection;
    const depth=action==='focus-depth'?el.dataset.depth:scene.focusDepth;
    scene.setFocusFilter(dir,depth);renderFocus();renderNetworkGuide();scheduleSave();
  }
  else if(action==='trace-mode'){const hadFocus=el.matches(':focus-visible');pointerPreview=null;focusPreview=null;scene.setRelations('source');scene.setTrace(el.dataset.mode);$('#focus-card').scrollTop=0;renderFocus();if(hadFocus)document.querySelector(`[data-action="trace-mode"][data-mode="${el.dataset.mode}"]`)?.focus({preventScroll:true});scheduleSave();}
  else if(action==='toggle-relations'){scene.setRelations(scene.relationMode==='off'?'source':'off');renderFocus();scheduleSave();}
  else if(action==='close-journey')returnFromLesson();
  else if(action==='filter'){selectedFilter=el.dataset.filter;document.querySelectorAll('[data-action="filter"]').forEach(b=>b.setAttribute('aria-pressed',String(b===el)));scene.refresh(i=>nodeState(learning,i),selectedFilter);}
  else if(action==='bookmark'){mutateLearning(s=>{s.bookmarks=s.bookmarks.includes(id)?s.bookmarks.filter(n=>n!==id):[...s.bookmarks,id];});if(panels.has(id)&&panels.get(id).tab==='overview')renderPanelSection(panels.get(id),'overview');}
  else if(action==='close-panel')closePanel(id);
  else if(action==='resize-panel'){const p=panels.get(id);if(p){p.expanded=!p.expanded;activePanel=id;scheduleSave();scene.dirty=true;}}
  else if(action==='minimize-panel'){const p=panels.get(id);if(p){if(p.el.classList.contains('minimized')){p.minimized=false;activePanel=id;arrangePanels();}else p.minimized=true;scheduleSave();scene.dirty=true;}}
  else if(action==='locate-panel'){const p=panels.get(id);if(p){activePanel=id;p.minimized=false;scene.select(objectKey('node',id));arrangePanels();renderFocus();renderLocation();}}
  else if(action==='arrange')arrangePanels();else if(action==='journal')navigateTaskSurface('trail');else if(action==='about')navigateTaskSurface('about');
  else if(action==='close-utility')navigateTaskSurface('explore',{replace:true});
  else if(action==='export'){readLearning();download(backup(learning),`数学探索-${new Date().toISOString().slice(0,10)}.json`);}
  else if(action==='import')$('#import-file').click();
  else if(action==='continue'){hideLearningHub();continueLearning();}
  else if(action==='choose-section'){activeRouteId=null;scene.setLearningSection(id||null);renderFocus();scheduleSave();}
  else if(action==='route-page'){scene.learningRoutePage=Math.max(0,Number(el.dataset.page)||0);renderFocus();scheduleSave();}
  else if(action==='choose-route'){activeRouteId=id||null;scene.setLearningRoute(activeRouteId);renderFocus();scheduleSave();}
  else if(action==='bridge')openLearningLesson(id);
  else if(action==='question'){closePopovers();if(journeyOpen&&activeSessionId)$('#journey-frame').contentWindow.postMessage({type:'math-space:request-question'},location.origin);else questionComposer({nodeId:space.byKey.get(scene.selected)?.kind==='node'?space.byKey.get(scene.selected).id:null});}
  else if(action==='questions')questionList();
  else if(action==='resume-question')resume(id);
  else if(action==='question-later'||action==='question-finish'){if(mutateLearning(s=>questionAction(s,id,action==='question-later'?'later':'finish'))){if(!$('#questions-popover').hidden)questionList();if(action==='question-later')toast('先放着，仍在“问题”里。');}}

});
function cardHide(){$('#focus-card').hidden=true;document.body.classList.remove('has-context-card');}
// The header identifies the parent theme; the map preview keeps its own level.
const themeOfLegendTarget=target=>target?.closest?.('#network-legend [data-action="network-theme"]')?.dataset.id||null;
function syncHoverHeader(){
  if(!scene)return;
  const object=space.byKey.get(scene.hoverMapKey);
  const parentId=object?.kind==='theme'?object.id:object?.themeId||scene.hoverThemeId;
  for(const button of document.querySelectorAll('#network-legend [data-action="network-theme"]'))
    button.dataset.hover=String(button.dataset.id===parentId);
  renderNetworkGuide();
}
function highlightThemeHeader(id){
  scene?.setThemeHover(scene.relationshipMap&&space.themes.has(id)?id:null);
}
$('#network-legend').addEventListener('pointerover',event=>{if(event.pointerType!=='touch')highlightThemeHeader(themeOfLegendTarget(event.target));});
$('#network-legend').addEventListener('pointerout',event=>{if(event.pointerType!=='touch')highlightThemeHeader(themeOfLegendTarget(event.relatedTarget));});
$('#network-legend').addEventListener('pointercancel',()=>highlightThemeHeader(null));
let pointerPreview=null,focusPreview=null;
const previewFrom=target=>target?.closest?.('#focus-card [data-preview-key]')?.dataset.previewKey||null;
const updatePreview=()=>{const key=focusPreview||pointerPreview;scene?.setPreview(key);for(const hint of document.querySelectorAll('#focus-card .preview-hint'))hint.textContent='';if(!key||!scene?.global)return;const o=space.byKey.get(key),row=[...document.querySelectorAll('#focus-card [data-preview-key]')].find(el=>el.dataset.previewKey===key);if(!o||!row)return;if(!scene.canLocate(o)){row.querySelector('.preview-hint').textContent='这个数学思维内容不在地图上单独显示，点名称查看联系。';return;}const p=scene.project(o.position),insets=scene.globalInsets();if(!p.visible||p.x<insets.left||p.x>scene.width-insets.right||p.y<insets.top||p.y>scene.height-insets.bottom)row.querySelector('.preview-hint').textContent='这个点在画面外，点名字查看。';};
$('#focus-card').addEventListener('pointerover',e=>{pointerPreview=previewFrom(e.target);updatePreview();});
$('#focus-card').addEventListener('pointerout',e=>{pointerPreview=previewFrom(e.relatedTarget);updatePreview();});
$('#focus-card').addEventListener('focusin',e=>{focusPreview=previewFrom(e.target);updatePreview();});
$('#focus-card').addEventListener('focusout',e=>{focusPreview=previewFrom(e.relatedTarget);updatePreview();});
$('#focus-card').addEventListener('scroll',()=>{if(scene?.global)scheduleSave();},{passive:true});
$('#search-input').addEventListener('input',()=>{searchLimit=24;renderSearch();});
$('#search-input').addEventListener('keydown',e=>{if(e.key==='Enter')$('#search-results button')?.click();});
$('#import-file').addEventListener('change',async event=>{const file=event.target.files?.[0];if(!file)return;try{readLearning();if(readBlocked)throw new Error('原始存储无法读取，暂时不能覆盖或合并。');if(file.size>MAX_BACKUP_BYTES)throw new Error('备份超过 50 MB。');const incoming=parseBackup(await file.text(),atlas),combined=validate(merge(learning,incoming),atlas);writeStored(KEY+'-before-import',JSON.stringify(backup(learning)));writeStored(KEY,JSON.stringify(combined));learning=combined;refreshLearning();toast('备份已合并，已有作品和提示历史已保留。');}catch(e){toast(e.message);}finally{event.target.value='';}});
window.addEventListener('storage',e=>{if(e.key===KEY&&atlas){readLearning();if(guideVisible){const saved=learning.daily.guide;if(saved?.active&&guideSteps[saved.step]){if(scene.guideFocus?.step!==saved.step){guideWalkSeen=new Set();guideObserved=new Set();scene.setGuideFocus(guideSteps,saved.step,{animate:false});scene.setGuideTargets(guideTargets().map(t=>t.key),[...guideObserved]);setHash(guideSteps[saved.step].overview?null:'node:'+guideSteps[saved.step].anchor);}}else{guideVisible=false;scene.clearGuideFocus();}renderGuide();}refreshLearning();}});
window.addEventListener('message',e=>{if(e.origin!==location.origin||!e.data)return;
  if(e.source===$('#journey-frame').contentWindow&&journeyOpen){
    if(e.data.type==='math-space:lesson-height'){
      const height=Number(e.data.height);
      if(Number.isFinite(height)&&height>100&&height<60000){
        const header=$('#journey-surface>header')?.getBoundingClientRect().height||38;
        $('#journey-surface').style.setProperty('--learning-desired-height',Math.ceil(height+header+2)+'px');
      }
      return;
    }
    if(e.data.type==='math-space:lesson-change'&&LESSONS[e.data.id]){activeLessonId=e.data.id;activeSessionId=sessionMeta(e.data.sessionId)?e.data.sessionId:e.data.id;activeQuestionId=e.data.questionId||null;const n=LESSONS[e.data.id];scene.select('node:'+n.topicId);setHash('node:'+n.topicId);readLearning();refreshLearning();renderLocation();scheduleSave();return;}
    if(e.data.type==='math-space:question-request'){questionComposer({nodeId:e.data.nodeId,scene:e.data.scene});return;}
    if(e.data.type==='math-space:lesson-close'){returnFromLesson();return;}
    if(e.data.type==='math-space:lesson-show-node'){const target='node:'+e.data.nodeId;if(space.byKey.has(target)){closeJourney(false);choose(target,{animate:false,inPlace:true,openLesson:false});restoreTaskSurface();}return;}
     if(e.data.type==='math-space:lesson-relations'){scene.setRelations(scene.relationMode==='off'?'source':'off');scheduleSave();return;}
    if(e.data.type==='math-space:journey-change'){const step=ROUTE_STEPS.find(s=>s.step===e.data.step);if(step){scene.select('node:'+step.id);setHash('node:'+step.id);readLearning();refreshLearning();renderLocation();scheduleSave();}return;}
    if(e.data.type==='math-space:journey-relations'){scene.setRelations(e.data.open?'route':'off');scheduleSave();return;}
  }
  if(e.data.type!=='math-space:navigate')return;
  const sources=[...panels.values()].map(p=>p.iframe?.contentWindow).concat($('#utility-frame').contentWindow,$('#journey-frame').contentWindow);if(!sources.includes(e.source))return;
  if(e.source===$('#utility-frame').contentWindow){closeUtility();setTaskSurfaceUrl('explore',{replace:true});}
  const {kind,id}=e.data;
  if(kind==='lesson'&&sessionMeta(id)){openLearningLesson(id);setTaskSurfaceUrl('learn',{replace:true});return;}if(['activity','legacy-activity'].includes(kind)&&activityIds.includes(id)){const node=ACTIVITIES[id].topicId;choose(objectKey('node',node),{openLesson:false});openPanel(node);}
  else if(['node','pack','theme'].includes(kind)&&space.byKey.has(objectKey(kind,id)))choose(objectKey(kind,id));else if(['map','atlas'].includes(kind))overview();
});
window.addEventListener('hashchange',()=>applyRoute());
window.addEventListener('popstate',()=>restoreTaskSurface());
window.addEventListener('resize',()=>{if(!scene)return;updateOverlays();renderNetworkGuide();});
window.addEventListener('pagehide',saveView);
document.addEventListener('visibilitychange',()=>{if(document.hidden)saveView();else if(scene){readLearning();refreshLearning();scene.dirty=true;}});
// Only the WebGL canvas owns spatial zoom through OrbitControls.
// Prevent browser-level pinch zoom anywhere in the page, including on future UI;
// this does not stop wheel gestures reaching the canvas or scrolling UI panels.
document.addEventListener('wheel',e=>{if(e.ctrlKey&&e.cancelable)e.preventDefault();},{capture:true,passive:false});
window.addEventListener('gesturestart',e=>{if(e.cancelable)e.preventDefault();},{capture:true,passive:false});
window.addEventListener('gesturechange',e=>{if(e.cancelable)e.preventDefault();},{capture:true,passive:false});
document.addEventListener('keydown',e=>{if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k'){e.preventDefault();openSearch();}if(e.key==='Escape'){if(document.querySelector('.popover:not([hidden])')){closePopovers();return;}if(journeyOpen&&!journeySuspended){navigateTaskSurface('explore',{replace:true});return;}if(!$('#learning-hub').hidden||!$('#utility-drawer').hidden){navigateTaskSurface('explore',{replace:true});return;}if(scene.selected)deselectKnowledge();}});

async function offline(){if(!('serviceWorker'in navigator))return;try {await navigator.serviceWorker.register('./sw.js',{updateViaCache:'none'});await navigator.serviceWorker.ready;
  const check=async()=>{const cache=await caches.open('math-explorer-20261109-p7d1-d2-learning-shell');const ready=(await Promise.all(['learning/phase5/b39.js','learning/phase5/b39-model.js','learning/phase5/b39-view.js','learning/phase5/b39.css','learning/phase5/b38-more.js','learning/phase5/b38.js','learning/phase5/b38-model.js','learning/phase5/b38-view.js','learning/phase5/b38.css','learning/phase5/b36.js','learning/phase5/b36-model.js','learning/phase5/b36-view.js','learning/phase5/b36.css','learning/phase5/b35.js','learning/phase5/b35-model.js','learning/phase5/b35-view.js','learning/phase5/b35.css','learning/phase5/b34.js','learning/phase5/b34-model.js','learning/phase5/b34-view.js','learning/phase5/b34-space-view.js','learning/phase5/b34.css','learning/phase5/b33.js','learning/phase5/b33-model.js','learning/phase5/b33-view.js','learning/phase5/b33.css','learning/phase5/b32.js','learning/phase5/b32-model.js','learning/phase5/b32-view.js','learning/phase5/b32.css','learning/phase5/b31.js','learning/phase5/b31-model.js','learning/phase5/b31-view.js','learning/phase5/b31-cube-view.js','learning/phase5/b31.css','learning/phase5/b30.js','learning/phase5/b30-model.js','learning/phase5/b30-geometry.js','learning/phase5/b30-view.js','learning/phase5/b30-solid-view.js','learning/phase5/b30.css','learning/phase5/b29.js','learning/phase5/b29-model.js','learning/phase5/b29-view.js','learning/phase5/b29.css','learning/phase5/b28.js','learning/phase5/b28-model.js','learning/phase5/b28-view.js','learning/phase5/b28.css','learning/phase5/b27.js','learning/phase5/b27-model.js','learning/phase5/b27-view.js','learning/phase5/b27-geometry.js','learning/phase5/b27-solid-view.js','learning/phase5/b27.css','learning/phase5/b26.js','learning/phase5/b26-model.js','learning/phase5/b26-view.js','learning/phase5/b26-geometry.js','learning/phase5/b26.css','learning/phase5/b25.js','learning/phase5/b25-model.js','learning/phase5/b25-view.js','learning/phase5/b25-geometry.js','learning/phase5/b25.css','learning/phase5/b24.js','learning/phase5/b24-model.js','learning/phase5/b24-view.js','learning/phase5/b24-geometry.js','learning/phase5/b24.css','learning/phase5/b23.js','learning/phase5/b23-model.js','learning/phase5/b23-view.js','learning/phase5/b23-geometry.js','learning/phase5/b23-solid-view.js','learning/phase5/b23.css','learning/phase4/b02-model.js','learning/phase4/b02-view.js','learning/phase4/b02.js','learning/phase4/b03-model.js','learning/phase4/b03-view.js','learning/phase4/b03.js','learning/phase4/b04-model.js','learning/phase4/b04-view.js','learning/phase4/b04.js','learning/phase4/b05-model.js','learning/phase4/b05-view.js','learning/phase4/b05.js','learning/phase4/catalog.js','learning/phase4/common.js','learning/phase4/engine.js','learning/phase4/geometry.js','learning/phase4/solid-view.js','learning/phase4/ui.js','learning/bridges.js','learning/daily.js','learning/question-ui.js','learning/question.css','learn.html','learning/learn.js','learning/p3-workflow.js','learning/p3-view.js','learning/state.js','learning/tasks.js','learning/catalog.js','learning/cubes.js','learning/cube-tasks.js','learning/learn.css','learning/thinking-feedback.js','index.html','space.js','navigation-copy.js','concept-explanations.js','grade-node-filter.js','data/grade-panorama-lite.json','spatial-scene.js','spatial-model.js','spatial-network.js','spatial-global.js','spatial-relationship.js','spatial-relationship-data.js','spatial-guide.js','spatial-names.js','spatial-trace.js','spatial-reasons.js','spatial-activities.js','spatial-labels.js','journey.html','journey.js','journey.css','journey-model.js','space.css','vendor/three/three.module.min.js','vendor/three/three.core.min.js','vendor/three/OrbitControls.js','v2.html?embedded=1','data/atlas.json'].map(p=>cache.match(new URL(p,location.href))))).every(Boolean);$('#offline-status').textContent=ready?'本机保存 · 离线就绪':'本机保存 · 正在准备离线资源';};await check();navigator.serviceWorker.addEventListener('controllerchange',check);
 }catch{$('#offline-status').textContent='本机保存';}}
async function boot(){try {
  const response=await fetch('./data/atlas.json');if(!response.ok)throw new Error('知识地图暂时无法读取');atlas=applyNavigationCopy(await response.json());
  try{guideSteps=buildStructureGuide(atlas);}catch{guideSteps=[];warning('导览所用的来源联系有变化，暂时收起导览；其他知识仍可查看。');}
  // Retired world/layout URLs and locally saved mode preferences now resolve to
  // the single relationship panorama. Preserve hashes, query context and learning data.
  const canonical=new URL(location.href);
  if(canonical.searchParams.get('world')!=='network'||canonical.searchParams.get('layout')!==String(RELATIONSHIP_VERSION)){
    canonical.searchParams.set('world','network');canonical.searchParams.set('layout',String(RELATIONSHIP_VERSION));
    history.replaceState(null,'',canonical.href);
  }
  worldLayout='network';const chosenNetworkVersion=RELATIONSHIP_VERSION;
  document.body.dataset.world=worldLayout;space=buildRelationshipSpace(atlas);
  space.defaultNetworkVersion=chosenNetworkVersion;space.knowledgeNames=makeKnowledgeNames(atlas);
  document.body.dataset.networkVersion=String(space.networkVersion);readLearning();
  $('#network-legend').innerHTML=worldLayout==='network'?[...space.themes.values()].map(t=>button('network-theme',`<i style="--object-color:${esc(t.color)}" aria-hidden="true"></i>${esc(t.title)}`,`data-id="${t.id}" aria-pressed="false"`)).join(''):'';
  if(!readBlocked){try {const old=readStored(OLD_KEY);if(old){learning=validate(merge(learning,migrateLegacy(JSON.parse(old),atlas.nodes.map(n=>n.id))),atlas);writeStored(KEY,JSON.stringify(learning));}}catch{readBlocked=true;warning('旧版记录暂时无法读取，已停止覆盖原数据。');}}
  scene=new SpatialScene($('#space-canvas'),space,{onSelect:choose,onOpen:id=>{if(guideVisible)return;return lessonForTopic(id)?openLearningLesson(lessonForTopic(id)):openPanel(id);},onOverview:overview,onMapHover:syncHoverHeader,onMove:updateOverlays,onCameraChange:()=>{if(scene){renderNetworkGuide();scheduleSave();}},onSettled:scheduleSave,onError:warning});
  const defaultMode=worldLayout==='network'?'rotate':'pan';scene.setMode(defaultMode);document.querySelectorAll('[data-action="mode"]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mode===defaultMode)));let stored=null;try{stored=parseView(JSON.parse(readStored(RELATIONSHIP_VIEW_KEY)),space);}catch{}
  if(stored)selectedGradeStage=GRADE_MAP_STAGES.includes(stored.selectedGradeStage)?stored.selectedGradeStage:'all';
  const route=location.hash.slice(1).split('/'),routeKey=route[0]==='space'&&route[1]&&route[2]?objectKey(route[1],route[2]):null,explicitOverview=route[0]==='atlas'&&!route[1];
  const due=pendingQuestions(learning)[0],last=learning.daily.continuation,sameDayActive=due&&stored?.journeyOpen&&stored.questionId===due.id&&last?.questionId===due.id&&dayKey(last.at)===dayKey();
  const showQuestionEntry=!explicitOverview&&!!due&&!sameDayActive&&(!routeKey||routeKey===stored?.selected);
  if(stored){scene.restore(stored);activeRouteId=scene.learningRouteId;for(const p of stored.panels)openPanel(p.id,{...p,restore:true});activePanel=stored.activePanel;renderWorkspaceButtons();if(stored.journeyOpen&&!showQuestionEntry&&!explicitOverview&&(!routeKey||routeKey===stored.selected)){const selectedId=space.byKey.get(stored.selected)?.id,lesson=lessonForTopic(selectedId);if(lesson)openLearningLesson(sessionMeta(stored.sessionId)?stored.sessionId:lesson,{restore:true,questionId:learning.daily.questions.some(q=>q.id===stored.questionId&&!questionDone(q))?stored.questionId:null});else if(routeStep(selectedId))openJourney(routeStep(selectedId).step,{restore:true});if(journeyOpen&&stored.journeySuspended)suspendJourney();}}else scene.overview(false);
  const showUnfinishedEntry=!explicitOverview&&!showQuestionEntry&&!journeyOpen&&learning.daily.guide?.active&&!!unfinishedContinuation()&&(!routeKey||routeKey===stored?.selected);
  if(showQuestionEntry||showUnfinishedEntry){scene.select(null);setHash(null);}
  // Restoring an open lesson updates the hash itself. Do not treat that new hash
  // as a navigation request and immediately close the lesson again.
  const initialRouteRequested=!stored||routeKey&&routeKey!==stored.selected||!routeKey&&(!stored.journeyOpen||route[0]&&route[0]!=='space');
  if(!showQuestionEntry&&!showUnfinishedEntry&&initialRouteRequested)applyRoute({initial:true});
  if(guideSteps.length&&learning.daily.guide?.active&&scene.relationshipMap&&!showQuestionEntry&&!showUnfinishedEntry&&!explicitOverview){if(journeyOpen)guideSuspended=true;else if(!routeKey||routeKey===stored?.selected)activateGuide(learning.daily.guide.step,{record:false,animate:false,fit:!stored||stored.networkVersion!==RELATIONSHIP_VERSION||stored.selected!=='node:'+guideSteps[learning.daily.guide.step].anchor});}
  // Never refit while navigating; repair only an unreadably distant saved view
  // once at startup, after all saved route/guide selections have been restored.
  if(stored&&!journeyOpen&&scene.relationshipMap)scene.recoverUnreadableSavedCamera();
  const allButton=$('[data-action="all-nodes"]');allButton.setAttribute('aria-pressed',String(scene.showAllNodes));allButton.textContent=scene.showAllNodes?'收起所有知识点':'展开所有知识点';
  refreshLearning();renderLocation();if(stored)restoreFocus(stored);restoreTaskSurface({initial:true});renderGradeMapFilter();$('#loading').hidden=true;$('#space-app').classList.add('ready');offline();
  if(worldLayout==='network'&&scene.relationshipMap)ensureGradePanoramaData().then(()=>{renderGradeMapFilter();renderFocus();}).catch(error=>{$('#grade-map-filter-status').textContent='课程映射读取失败：'+error.message;});
  // Read-only diagnostics used by local browser checks; no learning-state setters.
  window.mathSpace={motion:()=>({zoom:scene.camera.zoom,transition:scene.viewTransition?.kind||null,progress:scene.viewTransition?scene.transitionProgress():null,tween:scene.tween?{fromZoom:scene.tween.fromZoom,toZoom:scene.tween.toZoom}:null}),snapshot:()=>({...scene.snapshot(),layout:worldLayout,relationBands:space.relationLayout?{before:space.relationLayout.before,after:space.relationLayout.after}:null,backgroundEdges:(scene.networkEdges?.geometry.attributes.position.count||0)/2+(scene.networkSoftEdges?.geometry.attributes.position.count||0)/2,backgroundEdgesVisible:!!scene.networkEdges?.visible,structureMode:scene.structureMode,focusDirection:scene.focusDirection,focusDepth:scene.focusDepth,focusFilterCounts:scene.focusView?.counts||null,focusFilterEdges:scene.focusView?.links?.map(e=>({from:e.prerequisiteId,to:e.topicId,strength:e.strength}))||[],structureExamples:scene.overviewStructure?.paths?.map(p=>({role:p.role,edges:p.links})),structureLandmarks:scene.overviewStructure?.landmarks||[],structureStats:scene.overviewStructure?.stats||{},focusTransition:scene.viewTransition?{kind:scene.viewTransition.kind,progress:scene.transitionProgress(),fromCount:scene.viewTransition.fromKeys.size}:null,zoomEnabled:scene.controls.enableZoom,cameraTween:scene.tween?{fromZoom:scene.tween.fromZoom,toZoom:scene.tween.toZoom}:null,overviewShellCount:scene.overviewShells?.length||0,overviewShellsEnabled:!!scene.overviewShellsEnabled,overviewShellsVisible:!!scene.overviewShellGroup?.visible,sourceLayers:scene.global?space.globalInfo.maxLayer+1:null,globalCoordinates:scene.global,guide:scene.guideFocus?{step:learning.daily.guide?.step,seenNodes:[...scene.guideFocus.seenNodes],currentNodes:[...scene.guideFocus.currentNodes],edges:scene.guideFocus.edges.map(e=>({from:e.prerequisiteId,to:e.topicId,strength:e.strength}))}:null,guideSuspended,journeySuspended,gradeStageFilter:scene.gradeStageId,gradeStageMatchedIds:[...scene.gradeStageIds],progressBackground:scene.progressBackground||[],previewKey:scene.previewKey,previewEdges:scene.edgesGroup.children.filter(c=>c.userData.relation&&c.geometry.type!=='ConeGeometry').map(c=>({from:c.userData.relation[0],to:c.userData.relation[1],opacity:c.material.opacity,geometry:c.geometry.type})),traceArrows:scene.edgesGroup.children.filter(c=>c.userData.relation&&c.geometry.type==='ConeGeometry').length,traceNodes:scene.traceResult?.nodes.map(id=>({id,distance:scene.traceResult.distances.get(id)}))||[],traceEdgeCount:scene.traceResult?.edges.length||0,sceneMarkers:[...(scene.savedScenes||[])],questionMarkers:[...(scene.queuedQuestions||[])],counts:{themes:space.themes.size,packs:space.packs.size,nodes:space.nodes.size,edges:atlas.edges.length},journeyOpen,visibleNodes:[...(scene.visibleNodes||[])],relations:scene.relations.map(l=>({from:l.from,to:l.to,count:l.edges.length,strength:l.edges[0]?.strength,lit:!!l.lit})),panels:[...panels.values()].map(p=>({id:p.id,anchor:[...p.anchor],tab:p.tab})),positions:space.objects.map(o=>({key:o.key,position:[...o.position]})),rendered:true}),project:key=>{const o=space.byKey.get(key);return scene.canLocate(o)?scene.project(o.position):null;},nodeRadius:key=>scene.nodeScreenRadius(key),nodeTint:key=>{const i=scene.nodeList.findIndex(n=>n.key===key);return i<0?null:[...scene.nodeMesh.instanceColor.array.slice(i*3,i*3+3)];},completionMarker:key=>scene.completionMarkerVisible(key),hoverPreview:()=>({key:scene.hoverMapKey,themeId:scene.hoverThemeId,related:[...scene.hoverRelatedKeys],edges:scene.hoverVisualLinks.map(l=>({from:l.fromKey,to:l.toKey,soft:l.soft}))})};
 }catch(error){$('#loading').innerHTML=`<h1>空间暂时没有展开</h1><p>${esc(error.message)}</p><p>学习记录没有被清除。请刷新页面重试；已有记录不会因地图故障而清除。</p><a href="index.html#atlas" class="primary-button">重新打开三维关系全景</a>`;}}
setInterval(()=>{if(scene&&!document.hidden&&dayKey()!==renderedDay){readLearning();refreshLearning();}},60000);
boot();
