import {readStored,writeStored,unpackText,MAX_BACKUP_BYTES} from './storage.js';
import {SpatialScene} from './spatial-scene.js';
import {buildSpace,relationsFor,VIEW_KEY,LAYOUT_VERSION,parseView,objectKey} from './spatial-model.js';
import {buildRelationshipSpace,selectRelationshipVersion,RELATIONSHIP_VERSION} from './spatial-relationship.js';
import {activityForms,activityGlyph,ACTIVITY_FORMS} from './spatial-activities.js';
import {makeKnowledgeNames} from './spatial-names.js';
import {relationExplanation} from './spatial-reasons.js';
import {buildStructureGuide,linkedSuggestions,GUIDE_ID} from './spatial-guide.js';
import {KEY,OLD_KEY,fresh,validate,migrateLegacy,merge,nodeState,evidenceSummary,PROGRESS,completionClass,completionSummary,backup,parseBackup,now} from './exploration-core.js';
import {ACTIVITIES,activityIds} from './exploration-content.js';
import {ROUTE_ID,ROUTE_TITLE,ROUTE_STEPS,routeStep} from './journey-model.js';

import {LESSONS,ROUTES,ROUTE_SECTIONS,lessonForTopic,routeFor,routeForPack,routesForPack} from './learning/catalog.js';
import {BRIDGES,sessionMeta,sessionRoute} from './learning/bridges.js';
import {lessonSummary} from './learning/state.js';
import {dayKey,dailySummary,continuation,pendingQuestions,addQuestion,resumeQuestion,questionAction,questionDone} from './learning/daily.js';
import {askQuestion} from './learning/question-ui.js';
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const date=s=>new Date(s).toLocaleString('zh-CN',{month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'});
const button=(action,text,attrs='',css='soft-button')=>`<button type="button" class="${css}" data-action="${action}" ${attrs}>${text}</button>`;
const routeSection=(r,packId)=>r.sectionByPack?.[packId]||r.section;
const activityFor=id=>activityIds.find(key=>ACTIVITIES[key].topicId===id);
let atlas,space,scene,learning=fresh(),readBlocked=false,activePanel=null,selectedFilter='all',searchPack=null,searchLimit=24,saveTimer,toastTimer;
const NETWORK_VIEW_KEY='math-explorer-network-global-view-v1',RELATIONSHIP_VIEW_KEY='math-explorer-network-relationship-view-v1',NETWORK_LAYOUT_KEY='math-explorer-network-layout-v1',LEGACY_NETWORK_VIEW_KEY='math-explorer-network-view-v1',WORLD_MODE_KEY='math-explorer-world-mode-v1',PENDING_RESUME_KEY='math-explorer-pending-resume-v1';
let worldLayout='network';
const panels=new Map(),visits=[];
let renderedDay=null,activeRouteId=null;
let journeyOpen=false,activeLessonId=null,activeSessionId=null,activeQuestionId=null;
let guideSteps=[],guideVisible=false,guideSuspended=false;
const displayTitle=o=>worldLayout==='network'&&o?.kind==='node'?(space.knowledgeNames.get(o.id)||o.title):o?.kind==='node'&&LESSONS[lessonForTopic(o.id)]?.title||o?.kind==='pack'&&routesForPack(o.id).length===1&&routeForPack(o.id)?.title||o?.kind==='node'&&routeStep(o.id)?.title||o?.key==='pack:same-amount'&&ROUTE_TITLE||o?.title;

function toast(message){$('#toast').textContent=message;$('#toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').hidden=true,4200);}
function warning(message){$('#storage-warning').textContent=message;$('#storage-warning').hidden=false;}
function readLearning(){
  try {const raw=readStored(KEY);if(raw)learning=validate(JSON.parse(raw),atlas);else learning=fresh();return learning;}
  catch {readBlocked=true;warning('原有学习记录暂时无法读取，已停止覆盖。空间仍可浏览，请先保留原始记录。');return learning;}
}
function mutateLearning(fn){if(readBlocked)return false;readLearning();if(readBlocked)return false;try{const working=structuredClone(learning);fn(working);const next=validate(working,atlas);writeStored(KEY,JSON.stringify(next));learning=next;refreshLearning();return true;}catch(error){warning('还没保存成功，原记录已保留。'+error.message);return false;}}
function questionComposer(context={}){const v=captureView(),guide=learning.daily.guide;const world={position:v.position,target:v.target,selected:v.selected,...(worldLayout==='network'?{layout:'network',networkView:v.networkView,networkVersion:v.networkVersion,...(v.cameraZoom?{cameraZoom:v.cameraZoom,traceMode:v.traceMode,traceScroll:v.traceScroll}:{}),...(v.edgeDisplay?{edgeDisplay:v.edgeDisplay}:{}),...(guide?.active&&(guideVisible||guideSuspended)?{guideStep:guide.step}:{})}:{})};askQuestion(text=>{const ok=mutateLearning(s=>addQuestion(s,text,{...context,world}));if(ok)toast('已留下，下次从这里继续。');return ok;});}
function renderContinue(){const card=$('#continue-card');if(!scene)return;card.hidden=journeyOpen||!!scene.selected||!!panels.size;if(card.hidden)return;const next=continuation(learning),q=next.kind==='question'&&learning.daily.questions.find(q=>q.id===next.questionId),missing=q&&!q.scene&&!lessonForTopic(q.nodeId);card.innerHTML=`<small>${q?'接着上次的问题':'接着试一试'}</small><p>${esc(next.title)}</p>${missing?'<small>这里还没有对应活动，问题先留着。</small>':''}<div>${button('continue',q?(missing?'回到这个位置':'从这里继续'):'开始', '', 'primary-button')}${q?button('question-later','先放着',`data-id="${q.id}"`,'plain-button'):''}</div>`;}
function questionList(){closePopovers();const el=$('#questions-popover');el.hidden=false;const list=learning.daily.questions,render=q=>`<article><p>${esc(q.text)}</p><div>${button('resume-question',q.scene?'回到当时':'回到这个位置',`data-id="${q.id}"`)}${!questionDone(q)?button('question-finish','想明白了',`data-id="${q.id}"`,'plain-button'):'<small>✓ 完成</small>'}</div></article>`;el.innerHTML=`<div class="popover-heading"><strong>留下的问题</strong>${button('close-popover','×','aria-label="关闭问题"','plain-button')}</div>${[...list].reverse().filter(q=>!questionDone(q)).map(render).join('')||'<p class="quiet">还没有待继续的问题。</p>'}${list.some(questionDone)?`<details><summary>已经想明白的</summary>${[...list].reverse().filter(questionDone).map(render).join('')}</details>`:''}`;}
function resume(id){
  readLearning();const pending=learning.daily.questions.find(q=>q.id===id),needed=pending?.world?(pending.world.layout||'classic'):null;
  if(needed&&needed!==worldLayout){try{sessionStorage.setItem(PENDING_RESUME_KEY,id);}catch{toast('暂时无法切换回问题所在的空间。');return;}switchWorld(needed,true);return;}
  let q;if(!mutateLearning(s=>{q=structuredClone(resumeQuestion(s,id));if(q.world?.guideStep!==undefined)s.daily.guide={id:GUIDE_ID,step:q.world.guideStep,active:true,updatedAt:now()};}))return;
  closePopovers();if(journeyOpen)closeJourney(false);
  if(guideVisible||guideSuspended){if(q.world?.guideStep!==undefined){guideVisible=false;guideSuspended=false;scene.clearGuideFocus();renderGuide();}else leaveGuide();}
  if(q.world){if(q.world.layout==='network'){if(q.world.networkVersion!==scene.networkVersion)saveView();const version=q.world.networkVersion===RELATIONSHIP_VERSION?RELATIONSHIP_VERSION:49;scene.defaultNetworkVersion=version;const url=new URL(location.href);url.searchParams.set('layout',String(version));history.replaceState(null,'',url.href);try{writeStored(NETWORK_LAYOUT_KEY,String(version));}catch{warning('地图选择暂时无法保存，问题原文和现场仍已保留。');}}scene.restore(q.world);setHash(q.world.selected);}
  else if(q.nodeId)scene.focus('node:'+q.nodeId,{animate:false});
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
function saveView(){if(!scene)return;const view={version:LAYOUT_VERSION,...captureView(),activePanel,journeyOpen,sessionId:activeSessionId,questionId:activeQuestionId,panels:[...panels.values()].map(p=>({id:p.id,anchor:p.anchor,minimized:p.minimized,tab:p.tab,expanded:p.expanded}))};try{writeStored(worldLayout==='network'?(scene.relationshipMap?RELATIONSHIP_VIEW_KEY:NETWORK_VIEW_KEY):VIEW_KEY,JSON.stringify(view));}catch{warning('观察位置暂时无法保存，学习记录仍按原来的方式保存。');}}
function switchWorld(mode,forQuestion=false){if(!forQuestion&&(journeyOpen||panels.size)){toast('先回到空间并收起工作面，再切换视图。');return;}if(guideVisible||guideSuspended)leaveGuide();saveView();try{writeStored(WORLD_MODE_KEY,mode);}catch{warning('视图选择暂时无法保存，学习记录没有改变。');return;}const url=new URL(location.href);url.searchParams.set('world',mode);url.hash='#space';location.assign(url.href);}
function switchLayout(){if(journeyOpen||panels.size){toast('先回到空间并收起工作面，再切换地图。');return;}if(guideVisible||guideSuspended)leaveGuide();saveView();const next=scene.relationshipMap?49:RELATIONSHIP_VERSION;try{writeStored(NETWORK_LAYOUT_KEY,String(next));}catch{warning('地图选择暂时无法保存，学习记录没有改变。');return;}const url=new URL(location.href);url.searchParams.set('world','network');url.searchParams.set('layout',String(next));url.hash=scene.selected?'#space/'+scene.selected.replace(':','/'):'#space';location.assign(url.href);}
function remember(){if(!scene)return;const view=captureView();if(visits.length&&JSON.stringify(visits.at(-1))===JSON.stringify(view))return;visits.push(view);if(visits.length>30)visits.shift();$('#back-button').disabled=false;}
function recordGuide(step,active){return mutateLearning(s=>{s.daily.guide={id:GUIDE_ID,step,active,updatedAt:now()};});}
function positionGuide(){const panel=$('#guide-panel');if(!guideVisible||panel.hidden)return;const top=$('#network-guide').getBoundingClientRect().bottom+12;panel.style.top=`${top}px`;panel.style.maxHeight=`${Math.max(200,innerHeight-top-100)}px`;}
function renderGuide(){const panel=$('#guide-panel');document.body.classList.toggle('guide-mode',!!guideVisible&&!journeyOpen&&!!scene?.relationshipMap);panel.hidden=!guideVisible||journeyOpen||!scene?.relationshipMap;if(panel.hidden)return;positionGuide();const step=guideSteps[learning.daily.guide?.step||0],index=guideSteps.indexOf(step);if(!step){panel.hidden=true;return;}
  panel.innerHTML=`<div class="guide-step">认识知识怎样相连 · ${String(index+1).padStart(2,'0')} / ${String(guideSteps.length).padStart(2,'0')}</div><progress class="guide-progress" max="${guideSteps.length}" value="${index+1}" aria-label="导览观察步骤 ${index+1} / ${guideSteps.length}"></progress><h2>${esc(step.title)}</h2><p>${esc(step.text)}</p><p class="guide-prompt">${esc(step.prompt)}</p><div class="guide-nodes">${step.nodes.map(id=>button('guide-node',esc(displayTitle(space.nodes.get(id))),`data-id="${id}"`)).join('')}</div><p class="guide-note">走过的联系会留在图上。导览高亮不是学习完成。</p><div class="guide-actions">${button('guide-step','上一步',`data-step="${index-1}" ${index===0?'disabled':''}`)}${button('guide-step',index===guideSteps.length-1?'自己探索':'继续观察',`data-step="${index+1}"`,'primary-button')}${button('guide-learn','动手试试',`data-id="${step.anchor}"`)}${button('guide-exit','先自由探索','','plain-button')}${index?button('guide-reset','从头看','','plain-button'):''}</div>`;
}
function activateGuide(index,{record=true,animate=true,fit=true,rememberView=false}={}){if(!scene?.relationshipMap||!guideSteps[index]||journeyOpen)return;if(rememberView)remember();if(record&&!recordGuide(index,true))return;guideVisible=true;guideSuspended=false;closePopovers();scene.setGuideFocus(guideSteps,index,{animate,fit});setHash('node:'+guideSteps[index].anchor);renderFocus();renderGuide();renderLocation();scheduleSave();}
function leaveGuide({record=true}={}){if(!guideVisible&&!guideSuspended)return;const step=learning.daily.guide?.step||0;guideVisible=false;guideSuspended=false;scene.clearGuideFocus();if(record)recordGuide(step,false);renderGuide();renderFocus();renderLocation();scheduleSave();}
function returnFromLesson(){const resumeGuide=guideSuspended&&learning.daily.guide?.active&&scene.relationshipMap&&guideSteps[learning.daily.guide.step];if(!resumeGuide)guideSuspended=false;const stableKnowledge=scene.relationshipMap&&!resumeGuide&&space.byKey.get(scene.selected)?.kind==='node';const selected=scene.selected;closeJourney(!resumeGuide&&!stableKnowledge);if(resumeGuide)activateGuide(learning.daily.guide.step,{record:false});else if(stableKnowledge){scene.select(selected);scene.setRelations('source');setHash(selected);renderFocus();renderLocation();scheduleSave();}}
function closePopovers(){document.querySelectorAll('.popover').forEach(p=>p.hidden=true);}
function setHash(key){history.replaceState(null,'',key?'#space/'+key.replace(':','/'):'#space');}
function choose(key,{animate=true,history=true,openLesson=worldLayout!=='network'}={}){const object=space.byKey.get(key);if(!object)return;if(journeyOpen)closeJourney(false);if(guideVisible||guideSuspended)leaveGuide();else if(learning.daily.guide?.active&&scene.relationshipMap)recordGuide(learning.daily.guide.step,false);if(history)remember();pointerPreview=null;focusPreview=null;scene.setPreview(null);closePopovers();activeRouteId=null;scene.setLearningRoute(null);scene.setLearningSection(null);scene.focus(key,{animate});setHash(key);
  if(object.kind==='node')mutateLearning(s=>{s.visited[object.id]??=now();s.openedPacks[object.packId]??=now();});
  else if(object.kind==='pack')mutateLearning(s=>{s.openedPacks[object.id]??=now();});
  if(object.kind==='node'&&openLesson){const lesson=lessonForTopic(object.id);if(lesson)openLearningLesson(lesson);else if(routeStep(object.id))openJourney(routeStep(object.id).step);}
  renderFocus();renderLocation();scheduleSave();
}
function overview({animate=true,saveHistory=true}={}){if(journeyOpen)closeJourney(false);if(guideVisible||guideSuspended)leaveGuide();if(saveHistory)remember();closePopovers();activeRouteId=null;scene.setLearningRoute(null);scene.setLearningSection(null);scene.overview(animate);setHash(null);renderFocus();renderLocation();scheduleSave();}
function back(){if(journeyOpen)closeJourney(false);if(guideVisible||guideSuspended)leaveGuide();const previous=visits.pop();if(!previous)return;pointerPreview=null;focusPreview=null;scene.restore(previous,true);activeRouteId=scene.learningRouteId;setHash(previous.selected);$('#back-button').disabled=!visits.length;renderFocus();renderLocation();restoreFocus(previous);scheduleSave();}
function renderLocation(){renderNetworkGuide();renderContinue();const o=space.byKey.get(scene.selected);$('#current-place').textContent=o?displayTitle(o):'整个数学空间';$('#scale-label').textContent=scene.localRelationshipFocus?'局部探索':o?({theme:'一个方向',pack:'一簇想法',node:'一个想法'})[o.kind]:'全貌';}
function renderNetworkGuide(){
  if(!scene||worldLayout!=='network')return;
  const mode=scene.networkView,current=scene.global,direction=scene.camera.position.clone().sub(scene.controls.target).normalize();
  const expected=mode==='map'?[0,1,.0001]:mode==='relations'?[0,0,1]:[.65,.5,1],length=Math.hypot(...expected);
  const rotated=current&&(direction.x*expected[0]+direction.y*expected[1]+direction.z*expected[2])/length<.99995;
  document.body.dataset.networkView=mode;document.body.dataset.networkVersion=String(scene.networkVersion);document.body.dataset.mapFocus=scene.hoverThemeId?'theme':scene.selected?.split(':')[0]||'overview';
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
  if(scene.structuralOverview&&!scene.localRelationshipFocus){
    const labels={origin:'起点',fork:'分叉',join:'汇合',all:'同时比较'};
    $('#network-view-title').textContent='全貌 · 观察'+(labels[scene.structureMode]||'真实关系');
    $('#network-view-description').textContent=scene.structureMode==='all'?'正在同时对照三组真实关系示例；可切回单一结构减少干扰。':'仅突出一组真实关系示例。其他知识点仍在原三维坐标，可点击观察或主动切换；不代表唯一数学主干。';
  }
  $('#network-edge-controls').hidden=!scene.relationshipMap;
  const structureControls=$('#overview-structure-controls');
  if(structureControls){structureControls.hidden=!scene.relationshipMap||!!scene.selected||guideVisible||journeyOpen;
    for(const button of structureControls.querySelectorAll('[data-action="overview-structure"]'))button.setAttribute('aria-pressed',String(button.dataset.structure===scene.structureMode));}
   document.body.dataset.localFocus=scene.localRelationshipFocus?'true':'false';
   const localExit=$('#local-overview-exit');if(localExit)localExit.hidden=!scene.localRelationshipFocus||journeyOpen||guideVisible;
   const allNodesButton=$('[data-action="all-nodes"]');if(allNodesButton)allNodesButton.hidden=scene.relationshipMap;
  if(scene.relationshipMap){const shellButton=$('[data-action="overview-shells"]');if(shellButton){shellButton.hidden=!!scene.selected||!scene.overviewShells.length;shellButton.setAttribute('aria-pressed',String(scene.overviewShellsEnabled));shellButton.textContent=scene.overviewShellsEnabled?'隐藏知识群外壳':`试看知识群外壳 · ${scene.overviewShells.length}`;}for(const b of document.querySelectorAll('[data-action="edge-display"]'))b.setAttribute('aria-pressed',String(b.dataset.edgeDisplay===scene.edgeDisplay));$('#network-edge-hint').textContent=scene.edgeDisplay==='outline'?'只简化背景；选中后仍显示全部直接联系':scene.edgeDisplay==='critical'?'显示全部关键联系；辅助联系可在节点中查看':'显示关键与辅助联系';}
  for(const b of document.querySelectorAll('#network-legend [data-action="network-theme"]'))b.setAttribute('aria-pressed',String(scene.selected==='theme:'+b.dataset.id));
  const guide=learning.daily.guide,guideEntry=$('[data-action="guide-start"]');guideEntry.hidden=!guideSteps.length||guideVisible||journeyOpen;guideEntry.textContent=guide?.step>0&&guide.step<guideSteps.length-1?'继续认识这张图':'认识这张图';
  $('[data-action="switch-layout"]').textContent=scene.relationshipMap?'切换到旧关系地图':'切换到新关系地图';
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
    return `<div class="network-explore">${directions}<p class="trace-note">来源中的关键${mode==='before'?'基础':'后续'}：${trace.nodes.length} 个想法，${trace.edges.length} 条联系。数字是最短经过的联系数，不改变地图位置。</p><div class="network-relations trace-list">${[...groups].map(([d,ids])=>`<section><h3>隔 ${d} 条联系 · ${ids.length}</h3>${ids.map(id=>{const item=space.nodes.get(id);return `<div class="network-relation" data-preview-key="${item.key}">${button('choose',`<span>${esc(displayTitle(item))}</span>${scene.canLocate(item)?'':'<small>数学思维 · 在学习中查看</small>'}`,`data-key="${item.key}"`,'relation-button')}<span class="preview-hint" aria-live="polite"></span></div>`;}).join('')}</section>`).join('')||'<p class="quiet">来源没有列出这个方向的关键联系。</p>'}</div></div>`;
  }
  const sections=['before','after'].map(side=>{const list=relations.filter(l=>side==='before'?l.to===o.key:l.from===o.key);return `<section><h3>${side==='before'?'这里会用到':'还会连到哪里'} · ${list.length}</h3>${list.map(l=>{const other=space.byKey.get(side==='before'?l.from:l.to),edge=l.edges[0],bridge=Object.values(BRIDGES).find(b=>b.fromTopicId===edge.prerequisiteId&&b.topicId===edge.topicId),why=relationExplanation(edge);return `<div class="network-relation" data-preview-key="${other.key}">${button('choose',`${esc(displayTitle(other))}<small>${esc(space.packs.get(other.packId).title)} · ${edge.strength==='hard'?'关键基础':'辅助联系'}${scene.canLocate(other)?'':' · 数学思维，在学习中查看'}</small>`,`data-key="${other.key}"`,'relation-button')}<span class="preview-hint" aria-live="polite"></span><p class="relation-reason${why.reviewed?'':' pending'}">${why.reviewed?esc(why.text):'中文理由正在核对，可先看来源原文。'}</p>${edge.reason?`<details><summary>来源原文</summary><p>${esc(edge.reason)}</p></details>`:''}${bridge?button('bridge',`一起做：${esc(bridge.title)} · ${lessonSummary(learning.daily.bridges[bridge.id]).completed?'✓ 完成':'○ 未完成'}`,`data-id="${bridge.id}"`,'plain-button'):''}</div>`;}).join('')||'<p class="quiet">源图没有列出这个方向的联系。</p>'}</section>`;});
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
    const meta=extra? `图中 ${mapped} 个 · 学习中 ${extra} 个`:`${p.nodeIds.length} 个知识点`;
    return button('choose',`<span class="theme-pack-title">${esc(p.title)}</span><span class="theme-pack-question">${esc(p.question||'查看本组的知识和联系')}</span><span class="theme-pack-meta">${meta}<span aria-hidden="true">→</span></span>`,`data-key="${p.key}"`,'theme-pack-choice');
  }).join('');
  return `<div class="theme-overview" data-theme-id="${esc(o.id)}" data-pack-count="${packs.length}" data-node-count="${nodeCount}" data-map-count="${mapCount}">
    <p class="theme-overview-intro">${esc(o.description)}</p>
    <div class="theme-overview-counts" aria-label="该主题的真实内容规模"><span><strong>${packs.length}</strong> 个知识群</span><span><strong>${mapCount}</strong> 个地图知识点</span>${thinkingCount?`<span class="theme-thinking-count">另有 ${thinkingCount} 个思维节点在学习中</span>`:''}</div>
    <div class="theme-overview-guide"><strong>从哪个问题开始？</strong><p>任选一个知识群，进一步查看它的知识与真实联系。这里没有规定的学习顺序。</p></div>
    <nav class="theme-pack-list" aria-label="${esc(o.title)}的知识群">${choices}</nav>
    <p class="theme-overview-footnote">地图上仍保留其他主题作为空间参照；主题分组不代表新增数学前置关系。</p>
  </div>`;
}
function renderFocus(){if(!scene)return;const card=$('#focus-card'),o=space.byKey.get(scene.selected);if(!o||journeyOpen||guideVisible||panels.has(o.id)){card.hidden=true;return;}
  card.dataset.kind=o.kind;if(worldLayout==='network')card.style.visibility='visible';card.style.setProperty('--object-color',o.color);
  const same=card.dataset.currentKey===scene.selected,priorScroll=same?card.scrollTop:0,priorFocus=same?document.activeElement?.closest?.('[data-preview-key]')?.dataset.previewKey:null;const relations=relationsFor(space,o.key),before=relations.filter(e=>e.to===o.key).length,after=relations.filter(e=>e.from===o.key).length;
  let body='';
  if(o.kind==='node'){const state=nodeState(learning,o.id),legacy=activityFor(o.id),lesson=lessonForTopic(o.id),a=legacy||lesson,markers=worldLayout==='network'?[scene.savedScenes?.has(o.id)?'有未完现场':'',scene.queuedQuestions?.has(o.id)?'有待续问题':''].filter(Boolean):[];body=`${a?`<p class="status-text"><i class="status-dot ${completionClass(state)}"></i>${PROGRESS[state.progress]}</p>`:''}${scene.canLocate(o)?'':'<p class="quiet">这个数学思维在学习中呈现；可以查看联系或开始活动。</p>'}<div class="focus-actions">${button('open',a?(worldLayout==='network'&&lesson&&learning.lessons[lesson]?'继续活动':'开始'):'查看联系',`data-id="${o.id}"`,'primary-button')}${button('bookmark',learning.bookmarks.includes(o.id)?'已收藏':'收藏',`data-id="${o.id}"`)}${worldLayout==='network'&&legacy&&learning.activities[legacy]?button('open-legacy','打开早期现场',`data-id="${o.id}"`):''}${worldLayout==='network'&&scene.queuedQuestions?.has(o.id)?button('questions','看看留下的问题'):''}</div>${scene.global&&a&&!markers.length?'':`<p class="quiet">${markers.length?markers.join(' · '):a?'这里已有动手活动':'动手活动准备中，可以先看联系'}</p>`}${worldLayout==='network'?`<p class="network-concept">可以试：${esc(LESSONS[lesson]?.title||ACTIVITIES[legacy]?.title||o.title)}</p><div class="activity-forms">${activityForms(o.id).map(f=>`<span>${activityGlyph(f)}${ACTIVITY_FORMS[f].label}</span>`).join('')}</div>${nextIdea(o)}${relations.length?'<p class="network-focus-key"><span class="before">基础 → 这里</span><span class="after">这里 → 后续</span></p>':''}${scene.global?'':button('network-view','从侧面看整张图','data-view="side"','soft-button')}${networkRelations(o,relations)}`:''}`;}
  else if(o.kind==='pack'&&routeForPack(o.id)){const routes=routesForPack(o.id),route=routes.find(r=>r.id===activeRouteId)||(routes.length===1?routes[0]:null);if(!route){const sections=ROUTE_SECTIONS.filter(s=>routes.some(r=>routeSection(r,o.id)===s.id)),section=sections.find(s=>s.id===scene.learningSectionId);if(sections.length&&!section)body=`<p class="quiet">先挑一个想试的方向。</p><div class="route-choices">${sections.map(s=>button('choose-section',esc(s.title),`data-id="${s.id}"`,'route-choice route-set')).join('')}</div>`;else{const allChoices=section?routes.filter(r=>routeSection(r,o.id)===section.id):routes,page=Math.min(scene.learningRoutePage||0,Math.floor((allChoices.length-1)/3)),choices=allChoices.slice(page*3,page*3+3);body=`<p class="quiet">${section?esc(section.title):'选一条小路线开始，也可以随时换。'}</p><div class="route-choices">${choices.map(r=>button('choose-route',`${esc(r.title)}<small>${r.ids.length} 个想法</small>`,`data-id="${r.id}"`,'route-choice route-set')).join('')}</div>${allChoices.length>3?`<div class="route-pages">${button('route-page','上一组',`data-page="${page-1}" ${page===0?'disabled':''}`,'plain-button')}${button('route-page','再看看',`data-page="${page+1}" ${(page+1)*3>=allChoices.length?'disabled':''}`,'plain-button')}</div>`:''}${section?button('choose-section','换个方向','data-id=""','plain-button'):''}`;}}else{const links=Object.values(BRIDGES).filter(b=>route.ids.includes(b.to));body=`<p class="quiet">${esc(route.title)} · 可以跳着看</p><ol class="route-choices">${route.ids.map((id,i)=>{const n=LESSONS[id],status=nodeState(learning,n.topicId).progress==='completed'?'✓ 完成':'○ 未完成';return `<li>${button('choose',`<span class="route-number">${route.id}–${String(i+1).padStart(2,'0')}</span><span>${n.title}<small>${status}</small></span>`,`data-key="node:${n.topicId}"`,'route-choice')}</li>`;}).join('')}</ol>${links.length?`<details class="route-links"><summary>把想法连起来</summary>${links.map(b=>button('bridge',`<small>${LESSONS[b.from].title} ↔ ${LESSONS[b.to].title}</small>${esc(b.title)}<small>${esc(b.summary)}</small><small>${lessonSummary(learning.daily.bridges[b.id]).completed?'✓ 完成':'○ 未完成'}</small>`,`data-id="${b.id}"`,'bridge-choice')).join('')}</details>`:''}${routes.length>1?button('choose-route','换条小路线','data-id=""','plain-button'):''}`;}body+=`<div class="focus-actions">${button('list-pack','查看这里的全部知识',`data-id="${o.id}"`,'plain-button')}</div>`;}

  else if(o.kind==='pack'){body=`<p>${esc(o.question)}</p><p class="quiet">${o.nodeIds.length} 个想法${o.activityIds.length?` · ${o.activityIds.length} 个活动可打开`:''}</p><div class="focus-actions">${button('list-pack','看看这里的想法',`data-id="${o.id}"`)}</div>`;}
  else if(o.kind==='theme'&&scene.relationshipMap)body=themeOverview(o);
  else body=`<p>${esc(o.description)}</p><p class="quiet">${o.children.length} 簇想法，点一个名字靠近。</p>`;
  card.innerHTML=`<div class="focus-sticky"><div class="focus-heading"><span class="overline">${({theme:'一个方向',pack:'一簇想法',node:'一个想法'})[o.kind]}</span>${button('deselect',scene.localRelationshipFocus?'回到全貌 ×':'×',scene.localRelationshipFocus?'aria-label="回到整张知识地图"':'aria-label="收起选中信息"','plain-button')}</div><h2>${esc(displayTitle(o))}</h2></div>${body}${relations.length&&!(scene.global&&o.kind==='node')?`<div class="relationship-key">${button('toggle-relations',scene.relationMode==='off'?'看看这里的联系':'收起联系',`aria-pressed="${scene.relationMode!=='off'}"`,'plain-button')}</div>`:''}`;card.hidden=false;card.dataset.currentKey=scene.selected;card.scrollTop=priorScroll;if(priorFocus)restoreFocus({traceScroll:priorScroll,traceFocused:priorFocus});
}
function openJourney(step,{restore=false}={}){
  for(const id of [...panels.keys()])closePanel(id);
  scene.setRelations('off');
  journeyOpen=true;$('#journey-surface').style.removeProperty('--learning-desired-height');$('#journey-surface').hidden=false;document.body.classList.add('has-journey');
  $('#focus-card').hidden=true;$('#journey-surface header span').textContent='早期路线 A';const frame=$('#journey-frame');frame.src=`journey.html#${step}`;
  // The task workspace is independent of the 3D camera: never fly a map behind a lesson.
  scene.tween=null;scene.viewTransition=null;
  scheduleSave();
}
function openLearningLesson(id,{restore=false,questionId=null}={}){
 if(!sessionMeta(id))return;closePopovers();for(const key of [...panels.keys()])closePanel(key);
 if(guideVisible){guideVisible=false;guideSuspended=true;scene.clearGuideFocus();renderGuide();}
 activeRouteId=sessionRoute(id).id;scene.setLearningRoute(activeRouteId);activeSessionId=id;activeQuestionId=questionId;activeLessonId=BRIDGES[id]?.to||id;journeyOpen=true;$('#journey-surface').style.removeProperty('--learning-desired-height');scene.select('node:'+sessionMeta(id).topicId);setHash('node:'+sessionMeta(id).topicId);scene.setRelations('off');$('#journey-surface').hidden=false;document.body.classList.add('has-journey');$('#focus-card').hidden=true;$('#continue-card').hidden=true;
 $('#journey-surface header span').textContent='路线 '+sessionRoute(id).id;$('#journey-surface').setAttribute('aria-label',sessionRoute(id).title+' · 操作现场');$('#journey-frame').title=sessionMeta(id).title+' · 操作现场';$('#journey-frame').src=`learn.html${questionId?'?question='+encodeURIComponent(questionId):''}#${id}`;
 // Learning should open as a stable workspace, not move or zoom the hidden map.
 scene.tween=null;scene.viewTransition=null;
 renderLocation();scheduleSave();
}

function closeJourney(returnToPack=true){const route=activeLessonId?routeFor(activeLessonId):null,pack=route?.packIds[0]||'same-amount';activeLessonId=null;activeSessionId=null;activeQuestionId=null;journeyOpen=false;$('#journey-surface').hidden=true;$('#journey-surface').style.removeProperty('--learning-desired-height');$('#journey-frame').src='about:blank';document.body.classList.remove('has-journey');scene.setRelations('off');if(returnToPack){choose('pack:'+pack);activeRouteId=route?.id||null;scene.setLearningRoute(activeRouteId);renderFocus();}scheduleSave();}
function openSearch(packId=null){searchPack=packId;searchLimit=24;closePopovers();$('#search-popover').hidden=false;$('#search-input').value='';$('#search-label').textContent=packId?space.packs.get(packId).title:'想靠近哪个想法？';renderSearch();$('#search-input').focus();}
function renderSearch(){const q=$('#search-input').value.trim().toLowerCase();let matches;
  if(searchPack)matches=space.packs.get(searchPack).nodeIds.map(id=>space.nodes.get(id));
  else if(!q)matches=[...space.themes.values(),...learning.bookmarks.map(id=>space.nodes.get(id))];
  else matches=space.objects.filter(o=>(o.title+' '+(o.name||'')+' '+o.id+' '+displayTitle(o)+' '+(o.kind==='node'?LESSONS[lessonForTopic(o.id)]?.title||'':'')).toLowerCase().includes(q));
  if(searchPack&&q)matches=matches.filter(o=>(o.title+' '+(o.name||'')+' '+o.id+' '+displayTitle(o)+' '+(o.kind==='node'?LESSONS[lessonForTopic(o.id)]?.title||'':'')).toLowerCase().includes(q));
  $('#search-results').innerHTML=matches.length?matches.slice(0,searchLimit).map(o=>button('choose',`<span>${esc(displayTitle(o))}<small>${o.kind==='node'?`${space.packs.get(o.packId).title}${(activityFor(o.id)||lessonForTopic(o.id))?' · '+PROGRESS[nodeState(learning,o.id).progress]:''}`:o.kind==='pack'?'知识簇':'主题区域'}</small></span><span aria-hidden="true">↗</span>`,`data-key="${o.key}"`,'search-result')).join(''):'<p class="empty-search">还没找到这个名字，可以换个词。</p>';
  $('#search-count').textContent=q||searchPack?`找到 ${matches.length} 个，显示 ${Math.min(searchLimit,matches.length)} 个`:'选一个方向，或输入想找的名字';
  $('#search-more').hidden=matches.length<=searchLimit;
}
function relationButtons(id){const links=relationsFor(space,objectKey('node',id));return ['before','after'].map(side=>{const list=links.filter(e=>side==='before'?e.to===objectKey('node',id):e.from===objectKey('node',id));return `<section class="panel-relations"><h3>${side==='before'?'这里会用到':'还会连到哪里'} <small>${list.length}</small></h3>${list.map(e=>{const other=space.byKey.get(side==='before'?e.from:e.to);return button('choose',`${esc(other.title)}<small>${space.packs.get(other.packId).title} · ${e.edges[0].strength==='hard'?'关键基础':'辅助关联'}</small>`,`data-key="${other.key}"`,'relation-button');}).join('')||'<p class="quiet">原图暂未列出这个方向的数学联系。</p>'}</section>`;}).join('');}
function overviewContent(id){const n=space.nodes.get(id),activity=activityFor(id),s=nodeState(learning,id);return `<div class="panel-intro">${activity?`<span class="status-text"><i class="status-dot ${completionClass(s)}"></i>${PROGRESS[s.progress]}</span>`:''}<h2>${esc(n.title)}</h2><p>${activity?esc(ACTIVITIES[activity].goal):'这个想法的动手内容还在准备。可以沿着连接看看它与哪些想法有关。'}</p>${button('bookmark',learning.bookmarks.includes(id)?'已收藏':'收藏',`data-id="${id}"`)}</div>${relationButtons(id)}<details class="source-details"><summary>原始定义与目标</summary><p>${esc(n.name)}</p><p>${esc(n.description)}</p><ul>${n.evidence.map(e=>`<li>${esc(e)}</li>`).join('')}</ul><p class="quiet">原始节点 ${esc(n.id)} · 来源 os-taxonomy。空间分类为本地组织。</p></details>`;}
function recordContent(id){const k=activityFor(id),a=k&&learning.activities[k],s=nodeState(learning,id);if(!a)return `<div class="panel-intro"><h2>留在这里的足迹</h2><p>${learning.visited[id]?`看过联系 · ${date(learning.visited[id])}`:'这里还没有探索记录。'}</p><p class="quiet">打开、浏览和收藏会保留；它们不代表已经理解。</p></div>`;
  const e=evidenceSummary(a);return `<div class="panel-intro"><h2>留在这里的足迹</h2><p>${PROGRESS[s.progress]} · ${e.demonstrated?'有独立操作与迁移证据':e.needsSupport?'还有需要支持的地方':'正在收集理解证据'}</p><p class="quiet">解释单独保存，内容待确认。</p></div>${e.kinds.map(k=>`<div class="record-item"><b>${k.kind==='construct'?'自己的构造':'换情境的尝试'}</b><p>${({none:'还没有提交作品',independent:'有本次独立操作证据',supported:'有支持的尝试'})[k.status]}${k.attempts?` · ${k.attempts} 次提交`:''}</p></div>`).join('')}<div class="record-item"><b>自由探索</b><p>保存了 ${a.observations.length} 次发现</p></div>${a.notes.map(n=>`<div class="record-item"><small>${date(n.at)} · 解释待确认</small><p>${esc(n.text)}</p></div>`).join('')}${button('journal','查看完整作品与备份','','soft-button')}`;
}
function renderPanelSection(panel,tab,{activate=true}={}){panel.tab=tab;for(const [key,section]of Object.entries(panel.sections))section.hidden=key!==tab;panel.el.querySelectorAll('[data-panel-tab]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.panelTab===tab)));
  if(tab==='overview')panel.sections.overview.innerHTML=overviewContent(panel.id);
  if(tab==='records')panel.sections.records.innerHTML=recordContent(panel.id);
  if(tab==='activity'&&!panel.iframe){const key=activityFor(panel.id),frame=document.createElement('iframe');frame.title=ACTIVITIES[key].title;frame.className='activity-frame';frame.src=`v2.html?embedded=1#activity/${key}`;panel.sections.activity.append(frame);panel.iframe=frame;}
  if(activate){panel.minimized=false;panel.el.classList.remove('minimized');}scheduleSave();scene.dirty=true;
}
function openPanel(id,{anchor=null,minimized=false,restore=false,tab=null,expanded=false}={}){if(!space.nodes.has(id))return;closePopovers();if(panels.has(id)){activePanel=id;panels.get(id).minimized=false;arrangePanels();return;}
  if(panels.size===2){toast('已经展开两个工作面。关闭其中一个后，可以再打开新的。');return;}
  const n=space.nodes.get(id),activity=activityFor(id),el=document.createElement('section');el.className='work-panel';el.dataset.node=id;el.setAttribute('aria-label',n.title+'的工作面');el.style.setProperty('--object-color',n.color);
  el.innerHTML=`<header class="work-header"><span class="work-title" title="${esc(n.title)}">${esc(n.title)}</span><div>${button('resize-panel','放大',`data-id="${id}" aria-label="调整${esc(n.title)}工作面大小"`,'plain-button')}${button('minimize-panel','收起',`data-id="${id}"`,'plain-button')}${button('close-panel','×',`data-id="${id}" aria-label="关闭${esc(n.title)}工作面"`,'plain-button')}</div></header><nav class="work-tabs" aria-label="工作面内容">${[['overview','联系'],...(activity?[['activity','动手']]:[]),['records','记录']].map(([key,title])=>`<button type="button" data-panel-tab="${key}" data-id="${id}">${title}</button>`).join('')}</nav><div class="work-content"><div class="work-section" data-section="overview"></div>${activity?'<div class="work-section iframe-section" data-section="activity" hidden></div>':''}<div class="work-section" data-section="records" hidden></div></div>`;
  const sections=Object.fromEntries([...el.querySelectorAll('[data-section]')].map(s=>[s.dataset.section,s]));
  const p={id,el,sections,anchor:anchor||[...n.position],minimized,expanded,tab:'overview'};panels.set(id,p);activePanel=id;$('#workspaces').append(el);renderPanelSection(p,Object.hasOwn(sections,tab)?tab:activity?'activity':'overview');p.minimized=minimized;
  if(!restore){mutateLearning(s=>{s.visited[id]??=now();s.openedPacks[n.packId]??=now();});scene.select(n.key);setHash(n.key);arrangePanels();}
  renderWorkspaceButtons();renderFocus();scheduleSave();scene.dirty=true;
}
function closePanel(id){const p=panels.get(id);if(!p)return;p.el.remove();panels.delete(id);if(activePanel===id)activePanel=[...panels.keys()].at(-1)||null;renderWorkspaceButtons();renderFocus();scheduleSave();scene.dirty=true;}
function renderWorkspaceButtons(){document.body.classList.toggle('has-workspaces',!!panels.size);const bar=$('#workspace-list');bar.hidden=!panels.size;bar.innerHTML=[...panels.values()].map(p=>button('locate-panel',esc(space.nodes.get(p.id).title),`data-id="${p.id}"`,p.id===activePanel?'workspace-chip active':'workspace-chip')).join('')+(panels.size===2?button('arrange','并排看','','workspace-chip'):'');}
function arrangePanels(){if(!panels.size)return;const {right,up,direction}=scene.basis(),list=[...panels.values()],center=[0,0,0];for(const p of list){const n=space.nodes.get(p.id);n.position.forEach((x,i)=>center[i]+=x/list.length);}
  const ratio=Math.max(1,.8/scene.camera.aspect),d=(list.length===1?600:890)*ratio;
  const target=center.map((x,i)=>x+(list.length===1?right.getComponent(i)*105:0));
  const width=d*Math.tan(20*Math.PI/180)*scene.camera.aspect;
  list.forEach((p,i)=>{const offset=list.length===1?width*.41:(i===0?-1:1)*width*.52;p.anchor=target.map((x,j)=>x+right.getComponent(j)*offset+up.getComponent(j)*8);});
  scene.fly(target.map((x,i)=>x+direction.getComponent(i)*d),target,850);renderWorkspaceButtons();scheduleSave();
}
function updateOverlays(){
  positionGuide();
  const o=space.byKey.get(scene.selected),card=$('#focus-card');if(o&&!card.hidden){const p=scene.project(o.position);if(worldLayout!=='network'&&!p.visible)card.style.visibility='hidden';else {card.style.visibility='visible';const width=card.offsetWidth,height=card.offsetHeight,docked=o.kind!=='node'&&innerWidth>760,routeOnMobile=o.key==='pack:same-amount'&&innerWidth<=760;let left=routeOnMobile?16:docked?30:Math.max(16,Math.min(innerWidth-width-22,p.x+120));if(worldLayout==='network'&&innerWidth>760){const maxLeft=Math.max(16,innerWidth-width-100),guideRight=$('#network-guide').getBoundingClientRect().right;left=Math.max(Math.min(guideRight+16,maxLeft),Math.min(left,maxLeft));}if(worldLayout==='network'){
      // The browser can have a left vertical-tabs/sidebar overlay. Keep the
      // knowledge card in a safe interior column, never behind that chrome.
      const inset=innerWidth>900?124:innerWidth>620?96:18;
      const available=Math.max(180,innerWidth-inset-18);
      card.style.maxWidth=`${available}px`;
      card.style.left=`${inset}px`;
      const guide=$('#network-guide'),guideBottom=guide&&!guide.hidden?guide.getBoundingClientRect().bottom:0;
      card.style.top=`${Math.max(innerWidth>620?170:100,guideBottom+14)}px`;
    }else{card.style.left=`${left}px`;card.style.top=`${docked?142:Math.max(110,Math.min(innerHeight-height-145,p.y-height*.25))}px`;}}}
  const tethers=[];for(const p of panels.values()){
    const projected=scene.project(p.anchor),source=scene.project(space.nodes.get(p.id).position),far=projected.distance>1450,compact=innerWidth<760;
    const visible=projected.visible&&(!compact||activePanel===p.id);p.el.hidden=!visible;if(!visible)continue;
    const minimized=p.minimized||far;p.el.classList.toggle('minimized',minimized);p.el.classList.toggle('distant',far);
    const width=minimized?230:Math.min(panels.size===2&&!compact?Math.min(innerWidth*.42,p.expanded?680:560):p.expanded?720:520,innerWidth-32),height=minimized?46:Math.min(innerHeight-265,p.expanded?740:590);
    p.el.style.width=`${width}px`;p.el.style.height=`${height}px`;
    const x=Math.max(16,Math.min(innerWidth-width-16,projected.x-width/2)),y=Math.max(100,Math.min(innerHeight-height-165,projected.y-height/2));
    p.el.style.transform=`translate(${x}px,${y}px)`;p.el.style.zIndex=p.id===activePanel?'5':'4';
    const toggle=p.el.querySelector('[data-action="minimize-panel"]');toggle.textContent=minimized?'展开':'收起';
    p.el.querySelector('[data-action="resize-panel"]').textContent=p.expanded?'缩小':'放大';
    if(source.visible&&scene.canLocate(space.nodes.get(p.id))){const edgeX=source.x<x?x:source.x>x+width?x+width:source.x,edgeY=Math.max(y+24,Math.min(y+height-24,source.y));tethers.push(`<path d="M ${source.x.toFixed(1)} ${source.y.toFixed(1)} Q ${((source.x+edgeX)/2).toFixed(1)} ${(source.y-24).toFixed(1)} ${edgeX.toFixed(1)} ${edgeY.toFixed(1)}"/><circle cx="${source.x.toFixed(1)}" cy="${source.y.toFixed(1)}" r="4"/>`);}
  }
  if(journeyOpen&&o?.kind==='node'&&scene.canLocate(o)){const source=scene.project(o.position),r=$('#journey-surface').getBoundingClientRect();if(source.visible)tethers.push(`<path d="M ${source.x} ${source.y} L ${Math.max(r.left,Math.min(r.right,source.x))} ${Math.max(r.top+25,Math.min(r.bottom-25,source.y))}"/>`);}
  $('#work-tethers').innerHTML=tethers.join('');
  const d=scene.camera.position.distanceTo(scene.controls.target)/(scene.global?scene.camera.zoom:1);$('#distance-meter').style.width=`${Math.max(8,Math.min(100,Math.log(8000/d)/Math.log(8000/30)*100))}%`;
  return [...document.querySelectorAll('#focus-card,#guide-panel,.work-panel,#journey-surface,.tool-rail,#workspace-list,#continue-card,#network-guide')].filter(el=>!el.hidden&&el.style.visibility!=='hidden'&&el.getClientRects().length).map(el=>{const r=el.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height};});
}
function showUtility(which){closePopovers();const drawer=$('#utility-drawer');drawer.hidden=false;$('#utility-title').textContent=which==='trail'?'记录与备份':'地图与学习的依据';const frame=$('#utility-frame');frame.src=`v2.html?embedded=1#${which}`;}
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
  if(action==='overview')overview();else if(action==='back')back();else if(action==='choose')choose(key,{openLesson:worldLayout!=='network'||!!el.closest('.route-choices')});else if(action==='open'){const lesson=lessonForTopic(id);if(lesson)openLearningLesson(lesson);else openPanel(id);}else if(action==='open-legacy')openPanel(id);
  else if(action==='search')openSearch();else if(action==='list-pack')openSearch(id);else if(action==='search-more'){searchLimit+=24;renderSearch();}
  else if(action==='close-popover')closePopovers();
  else if(action==='deselect'&&scene.relationshipMap)overview();else if(action==='deselect'){if(worldLayout==='network'&&!scene.global&&scene.networkView==='relations')scene.overview();else if(scene.global){const full=scene.wholeMapVisible();scene.select(null);if(full)scene.fitGlobalView();}else scene.select(null);cardHide();setHash(null);renderLocation();scheduleSave();}
  else if(action==='mode'){scene.setMode(el.dataset.mode);document.querySelectorAll('[data-action="mode"]').forEach(b=>b.setAttribute('aria-pressed',String(b===el)));}
  else if(action==='zoom')scene.zoom(Number(el.dataset.factor));else if(action==='front')scene.front();
  else if(action==='network-view'){remember();scene.viewFrom(el.dataset.view);renderLocation();renderFocus();scheduleSave();}
  else if(action==='edge-display'){scene.setEdgeDisplay(el.dataset.edgeDisplay);renderNetworkGuide();scheduleSave();}
  else if(action==='overview-shells'){scene.setOverviewShells(!scene.overviewShellsEnabled);renderNetworkGuide();scheduleSave();}
  else if(action==='overview-structure'){scene.setStructureMode(el.dataset.structure);renderNetworkGuide();scheduleSave();}
  else if(action==='guide-start'){const saved=learning.daily.guide,index=saved&&saved.step<guideSteps.length-1?saved.step:0;activateGuide(index,{rememberView:true});}
  else if(action==='guide-step'){const index=Number(el.dataset.step);if(index>=guideSteps.length)leaveGuide();else activateGuide(index);}
  else if(action==='guide-reset')activateGuide(0);
  else if(action==='guide-exit')leaveGuide();
  else if(action==='guide-node'){leaveGuide();choose('node:'+id);}
  else if(action==='guide-learn'){const lesson=lessonForTopic(id);if(lesson)openLearningLesson(lesson);}
  else if(action==='network-theme')choose('theme:'+id);
  else if(action==='switch-world')switchWorld(worldLayout==='network'?'classic':'network');
  else if(action==='switch-layout')switchLayout();
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
  else if(action==='arrange')arrangePanels();else if(action==='journal')showUtility('trail');else if(action==='about')showUtility('about');
  else if(action==='close-utility'){$('#utility-drawer').hidden=true;$('#utility-frame').src='about:blank';}
  else if(action==='export'){readLearning();download(backup(learning),`数学探索-${new Date().toISOString().slice(0,10)}.json`);}
  else if(action==='import')$('#import-file').click();
  else if(action==='continue')continueLearning();
  else if(action==='choose-section'){activeRouteId=null;scene.setLearningSection(id||null);renderFocus();scheduleSave();}
  else if(action==='route-page'){scene.learningRoutePage=Math.max(0,Number(el.dataset.page)||0);renderFocus();scheduleSave();}
  else if(action==='choose-route'){activeRouteId=id||null;scene.setLearningRoute(activeRouteId);renderFocus();scheduleSave();}
  else if(action==='bridge')openLearningLesson(id);
  else if(action==='question'){closePopovers();if(journeyOpen&&activeSessionId)$('#journey-frame').contentWindow.postMessage({type:'math-space:request-question'},location.origin);else questionComposer({nodeId:space.byKey.get(scene.selected)?.kind==='node'?space.byKey.get(scene.selected).id:null});}
  else if(action==='questions')questionList();
  else if(action==='resume-question')resume(id);
  else if(action==='question-later'||action==='question-finish'){if(mutateLearning(s=>questionAction(s,id,action==='question-later'?'later':'finish'))){if(!$('#questions-popover').hidden)questionList();if(action==='question-later')toast('先放着，仍在“问题”里。');}}

});
function cardHide(){$('#focus-card').hidden=true;}
// Theme hover is a one-level navigation cue, not a graph-selection preview.
// Keep all node labels, theme cards, camera and saved learning state unchanged.
const themeOfLegendTarget=target=>target?.closest?.('#network-legend [data-action="network-theme"]')?.dataset.id||null;
function highlightThemeHeader(id){
  const next=scene?.relationshipMap&&space.themes.has(id)?id:null;
  for(const button of document.querySelectorAll('#network-legend [data-action="network-theme"]')){
    button.dataset.hover=String(button.dataset.id===next);
  }
  scene?.setThemeHover(next);
  document.body.dataset.mapFocus=next?'theme':scene?.selected?.split(':')[0]||'overview';
}
$('#network-legend').addEventListener('pointerover',event=>{if(event.pointerType!=='touch')highlightThemeHeader(themeOfLegendTarget(event.target));});
$('#network-legend').addEventListener('pointerout',event=>{if(event.pointerType!=='touch')highlightThemeHeader(themeOfLegendTarget(event.relatedTarget));});
$('#network-legend').addEventListener('pointercancel',()=>highlightThemeHeader(null));
let pointerPreview=null,focusPreview=null;
const previewFrom=target=>target?.closest?.('#focus-card [data-preview-key]')?.dataset.previewKey||null;
const updatePreview=()=>{const key=focusPreview||pointerPreview;scene?.setPreview(key);for(const hint of document.querySelectorAll('#focus-card .preview-hint'))hint.textContent='';if(!key||!scene?.global)return;const o=space.byKey.get(key),row=[...document.querySelectorAll('#focus-card [data-preview-key]')].find(el=>el.dataset.previewKey===key);if(!o||!row)return;if(!scene.canLocate(o)){row.querySelector('.preview-hint').textContent='这个数学思维在学习中呈现，点名字查看。';return;}const p=scene.project(o.position),insets=scene.globalInsets();if(!p.visible||p.x<insets.left||p.x>scene.width-insets.right||p.y<insets.top||p.y>scene.height-insets.bottom)row.querySelector('.preview-hint').textContent='这个点在画面外，点名字查看。';};
$('#focus-card').addEventListener('pointerover',e=>{pointerPreview=previewFrom(e.target);updatePreview();});
$('#focus-card').addEventListener('pointerout',e=>{pointerPreview=previewFrom(e.relatedTarget);updatePreview();});
$('#focus-card').addEventListener('focusin',e=>{focusPreview=previewFrom(e.target);updatePreview();});
$('#focus-card').addEventListener('focusout',e=>{focusPreview=previewFrom(e.relatedTarget);updatePreview();});
$('#focus-card').addEventListener('scroll',()=>{if(scene?.global)scheduleSave();},{passive:true});
$('#search-input').addEventListener('input',()=>{searchLimit=24;renderSearch();});
$('#search-input').addEventListener('keydown',e=>{if(e.key==='Enter')$('#search-results button')?.click();});
$('#import-file').addEventListener('change',async event=>{const file=event.target.files?.[0];if(!file)return;try{readLearning();if(readBlocked)throw new Error('原始存储无法读取，暂时不能覆盖或合并。');if(file.size>MAX_BACKUP_BYTES)throw new Error('备份超过 50 MB。');const incoming=parseBackup(await file.text(),atlas),combined=validate(merge(learning,incoming),atlas);writeStored(KEY+'-before-import',JSON.stringify(backup(learning)));writeStored(KEY,JSON.stringify(combined));learning=combined;refreshLearning();toast('备份已合并，已有作品和提示历史已保留。');}catch(e){toast(e.message);}finally{event.target.value='';}});
window.addEventListener('storage',e=>{if(e.key===KEY&&atlas){readLearning();if(guideVisible){const saved=learning.daily.guide;if(saved?.active&&guideSteps[saved.step]){if(scene.guideFocus?.step!==saved.step){scene.setGuideFocus(guideSteps,saved.step,{animate:false});setHash('node:'+guideSteps[saved.step].anchor);}}else{guideVisible=false;scene.clearGuideFocus();}renderGuide();}refreshLearning();}});
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
    if(e.data.type==='math-space:lesson-relations'){scene.setRelations(scene.relationMode==='off'?'source':'off');scheduleSave();return;}
    if(e.data.type==='math-space:journey-change'){const step=ROUTE_STEPS.find(s=>s.step===e.data.step);if(step){scene.select('node:'+step.id);setHash('node:'+step.id);readLearning();refreshLearning();renderLocation();scheduleSave();}return;}
    if(e.data.type==='math-space:journey-relations'){scene.setRelations(e.data.open?'route':'off');scheduleSave();return;}
  }
  if(e.data.type!=='math-space:navigate')return;
  const sources=[...panels.values()].map(p=>p.iframe?.contentWindow).concat($('#utility-frame').contentWindow,$('#journey-frame').contentWindow);if(!sources.includes(e.source))return;
  if(e.source===$('#utility-frame').contentWindow){$('#utility-drawer').hidden=true;$('#utility-frame').src='about:blank';}
  const {kind,id}=e.data;if(['activity','legacy-activity'].includes(kind)&&activityIds.includes(id)){const node=ACTIVITIES[id].topicId;choose(objectKey('node',node),{openLesson:false});openPanel(node);}
  else if(['node','pack','theme'].includes(kind)&&space.byKey.has(objectKey(kind,id)))choose(objectKey(kind,id));else if(['map','atlas'].includes(kind))overview();
});
window.addEventListener('hashchange',()=>applyRoute());
window.addEventListener('pagehide',saveView);
document.addEventListener('visibilitychange',()=>{if(document.hidden)saveView();else if(scene){readLearning();refreshLearning();scene.dirty=true;}});
// The lesson overlay is a fixed workspace. Trackpad pinch gestures must not
// accidentally magnify the surrounding web page when focus is outside iframe.
document.addEventListener('wheel',e=>{if(journeyOpen&&e.ctrlKey&&e.cancelable)e.preventDefault();},{capture:true,passive:false});
window.addEventListener('gesturestart',e=>{if(journeyOpen&&e.cancelable)e.preventDefault();},{capture:true,passive:false});
window.addEventListener('gesturechange',e=>{if(journeyOpen&&e.cancelable)e.preventDefault();},{capture:true,passive:false});
document.addEventListener('keydown',e=>{if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k'){e.preventDefault();openSearch();}if(e.key==='Escape'){closePopovers();if(!$('#utility-drawer').hidden){$('#utility-drawer').hidden=true;$('#utility-frame').src='about:blank';}else cardHide();}});

async function offline(){if(!('serviceWorker'in navigator))return;try {await navigator.serviceWorker.register('./sw.js',{updateViaCache:'none'});await navigator.serviceWorker.ready;
  const check=async()=>{const cache=await caches.open('math-explorer-20261027-learning-v56');const ready=(await Promise.all(['learning/phase5/b39.js','learning/phase5/b39-model.js','learning/phase5/b39-view.js','learning/phase5/b39.css','learning/phase5/b38-more.js','learning/phase5/b38.js','learning/phase5/b38-model.js','learning/phase5/b38-view.js','learning/phase5/b38.css','learning/phase5/b36.js','learning/phase5/b36-model.js','learning/phase5/b36-view.js','learning/phase5/b36.css','learning/phase5/b35.js','learning/phase5/b35-model.js','learning/phase5/b35-view.js','learning/phase5/b35.css','learning/phase5/b34.js','learning/phase5/b34-model.js','learning/phase5/b34-view.js','learning/phase5/b34-space-view.js','learning/phase5/b34.css','learning/phase5/b33.js','learning/phase5/b33-model.js','learning/phase5/b33-view.js','learning/phase5/b33.css','learning/phase5/b32.js','learning/phase5/b32-model.js','learning/phase5/b32-view.js','learning/phase5/b32.css','learning/phase5/b31.js','learning/phase5/b31-model.js','learning/phase5/b31-view.js','learning/phase5/b31-cube-view.js','learning/phase5/b31.css','learning/phase5/b30.js','learning/phase5/b30-model.js','learning/phase5/b30-geometry.js','learning/phase5/b30-view.js','learning/phase5/b30-solid-view.js','learning/phase5/b30.css','learning/phase5/b29.js','learning/phase5/b29-model.js','learning/phase5/b29-view.js','learning/phase5/b29.css','learning/phase5/b28.js','learning/phase5/b28-model.js','learning/phase5/b28-view.js','learning/phase5/b28.css','learning/phase5/b27.js','learning/phase5/b27-model.js','learning/phase5/b27-view.js','learning/phase5/b27-geometry.js','learning/phase5/b27-solid-view.js','learning/phase5/b27.css','learning/phase5/b26.js','learning/phase5/b26-model.js','learning/phase5/b26-view.js','learning/phase5/b26-geometry.js','learning/phase5/b26.css','learning/phase5/b25.js','learning/phase5/b25-model.js','learning/phase5/b25-view.js','learning/phase5/b25-geometry.js','learning/phase5/b25.css','learning/phase5/b24.js','learning/phase5/b24-model.js','learning/phase5/b24-view.js','learning/phase5/b24-geometry.js','learning/phase5/b24.css','learning/phase5/b23.js','learning/phase5/b23-model.js','learning/phase5/b23-view.js','learning/phase5/b23-geometry.js','learning/phase5/b23-solid-view.js','learning/phase5/b23.css','learning/phase4/b02-model.js','learning/phase4/b02-view.js','learning/phase4/b02.js','learning/phase4/b03-model.js','learning/phase4/b03-view.js','learning/phase4/b03.js','learning/phase4/b04-model.js','learning/phase4/b04-view.js','learning/phase4/b04.js','learning/phase4/b05-model.js','learning/phase4/b05-view.js','learning/phase4/b05.js','learning/phase4/catalog.js','learning/phase4/common.js','learning/phase4/engine.js','learning/phase4/geometry.js','learning/phase4/solid-view.js','learning/phase4/ui.js','learning/bridges.js','learning/daily.js','learning/question-ui.js','learning/question.css','learn.html','learning/learn.js','learning/state.js','learning/tasks.js','learning/catalog.js','learning/cubes.js','learning/cube-tasks.js','learning/learn.css','learning/thinking-feedback.js','index.html','space.js','spatial-scene.js','spatial-model.js','spatial-network.js','spatial-global.js','spatial-relationship.js','spatial-relationship-data.js','spatial-guide.js','spatial-names.js','spatial-trace.js','spatial-reasons.js','spatial-activities.js','spatial-labels.js','journey.html','journey.js','journey.css','journey-model.js','space.css','vendor/three/three.module.min.js','vendor/three/three.core.min.js','vendor/three/OrbitControls.js','v2.html?embedded=1','data/atlas.json'].map(p=>cache.match(new URL(p,location.href))))).every(Boolean);$('#offline-status').textContent=ready?'本机保存 · 离线就绪':'本机保存 · 正在准备离线资源';};await check();navigator.serviceWorker.addEventListener('controllerchange',check);
 }catch{$('#offline-status').textContent='本机保存';}}
async function boot(){try {
  const response=await fetch('./data/atlas.json');if(!response.ok)throw new Error('知识地图暂时无法读取');atlas=await response.json();
  try{guideSteps=buildStructureGuide(atlas);}catch{guideSteps=[];warning('导览所用的来源联系有变化，暂时收起导览；其他知识仍可查看。');}
  let previous=null,preference=null;try{previous=JSON.parse(readStored(VIEW_KEY));preference=readStored(WORLD_MODE_KEY);}catch{}
  const params=new URL(location.href).searchParams,requested=params.get('world');
  let oldNetwork=null,layoutPreference=null;try{oldNetwork=JSON.parse(readStored(NETWORK_VIEW_KEY))||JSON.parse(readStored(LEGACY_NETWORK_VIEW_KEY));layoutPreference=readStored(NETWORK_LAYOUT_KEY);}catch{}
  const layoutRequest=params.get('layout'),chosenNetworkVersion=['49','53'].includes(layoutRequest)?Number(layoutRequest):['49','53'].includes(layoutPreference)?Number(layoutPreference):oldNetwork&&(oldNetwork.journeyOpen||oldNetwork.panels?.length)?49:RELATIONSHIP_VERSION;
  worldLayout=['classic','network'].includes(requested)?requested:['classic','network'].includes(preference)?preference:previous&&(previous.journeyOpen||previous.panels?.length)?'classic':'network';
  document.body.dataset.world=worldLayout;space=worldLayout==='network'?buildRelationshipSpace(atlas):buildSpace(atlas);if(worldLayout==='network'){space.defaultNetworkVersion=chosenNetworkVersion;if(chosenNetworkVersion===49)selectRelationshipVersion(space,49);}space.knowledgeNames=makeKnowledgeNames(atlas);if(worldLayout==='network')document.body.dataset.networkVersion=String(space.networkVersion);readLearning();
  $('[data-action="switch-world"]').textContent=worldLayout==='network'?'原有空间':'关系全图';
  $('#network-legend').innerHTML=worldLayout==='network'?[...space.themes.values()].map(t=>button('network-theme',`<i style="--object-color:${esc(t.color)}" aria-hidden="true"></i>${esc(t.title)}`,`data-id="${t.id}" aria-pressed="false"`)).join(''):'';
  if(!readBlocked){try {const old=readStored(OLD_KEY);if(old){learning=validate(merge(learning,migrateLegacy(JSON.parse(old),atlas.nodes.map(n=>n.id))),atlas);writeStored(KEY,JSON.stringify(learning));}}catch{readBlocked=true;warning('旧版记录暂时无法读取，已停止覆盖原数据。');}}
  scene=new SpatialScene($('#space-canvas'),space,{onSelect:choose,onOpen:id=>lessonForTopic(id)?openLearningLesson(lessonForTopic(id)):openPanel(id),onOverview:overview,onThemeHover:highlightThemeHeader,onMove:updateOverlays,onCameraChange:()=>{if(scene){renderNetworkGuide();scheduleSave();}},onSettled:scheduleSave,onError:warning});
  const defaultMode=worldLayout==='network'?'rotate':'pan';scene.setMode(defaultMode);document.querySelectorAll('[data-action="mode"]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mode===defaultMode)));let stored=null;try{stored=parseView(JSON.parse(readStored(worldLayout==='network'?(chosenNetworkVersion===RELATIONSHIP_VERSION?RELATIONSHIP_VIEW_KEY:NETWORK_VIEW_KEY):VIEW_KEY)),space);if(!stored&&worldLayout==='network'&&chosenNetworkVersion===49){const old=parseView(JSON.parse(readStored(LEGACY_NETWORK_VIEW_KEY)),space);if(old&&(old.journeyOpen||old.panels.length))stored=old;}}catch{}
  const route=location.hash.slice(1).split('/'),routeKey=route[0]==='space'&&route[1]&&route[2]?objectKey(route[1],route[2]):null,explicitOverview=route[0]==='atlas'&&!route[1];
  const due=pendingQuestions(learning)[0],last=learning.daily.continuation,sameDayActive=due&&stored?.journeyOpen&&stored.questionId===due.id&&last?.questionId===due.id&&dayKey(last.at)===dayKey();
  const showQuestionEntry=!explicitOverview&&!!due&&!sameDayActive&&(!routeKey||routeKey===stored?.selected);
  if(stored){scene.restore(stored);activeRouteId=scene.learningRouteId;for(const p of stored.panels)openPanel(p.id,{...p,restore:true});activePanel=stored.activePanel;renderWorkspaceButtons();if(stored.journeyOpen&&!showQuestionEntry&&!explicitOverview&&(!routeKey||routeKey===stored.selected)){const selectedId=space.byKey.get(stored.selected)?.id,lesson=lessonForTopic(selectedId);if(lesson)openLearningLesson(sessionMeta(stored.sessionId)?stored.sessionId:lesson,{restore:true,questionId:learning.daily.questions.some(q=>q.id===stored.questionId&&!questionDone(q))?stored.questionId:null});else if(routeStep(selectedId))openJourney(routeStep(selectedId).step,{restore:true});}}else scene.overview(false);
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
  refreshLearning();renderLocation();if(stored)restoreFocus(stored);$('#loading').hidden=true;$('#space-app').classList.add('ready');offline();
  // Read-only diagnostics used by local browser checks; no learning-state setters.
  window.mathSpace={motion:()=>({zoom:scene.camera.zoom,transition:scene.viewTransition?.kind||null,progress:scene.viewTransition?scene.transitionProgress():null,tween:scene.tween?{fromZoom:scene.tween.fromZoom,toZoom:scene.tween.toZoom}:null}),snapshot:()=>({...scene.snapshot(),layout:worldLayout,relationBands:space.relationLayout?{before:space.relationLayout.before,after:space.relationLayout.after}:null,backgroundEdges:(scene.networkEdges?.geometry.attributes.position.count||0)/2+(scene.networkSoftEdges?.geometry.attributes.position.count||0)/2,backgroundEdgesVisible:!!scene.networkEdges?.visible,structureMode:scene.structureMode,focusDirection:scene.focusDirection,focusDepth:scene.focusDepth,focusFilterCounts:scene.focusView?.counts||null,focusFilterEdges:scene.focusView?.links?.map(e=>({from:e.prerequisiteId,to:e.topicId,strength:e.strength}))||[],structureExamples:scene.overviewStructure?.paths?.map(p=>({role:p.role,edges:p.links})),structureLandmarks:scene.overviewStructure?.landmarks||[],structureStats:scene.overviewStructure?.stats||{},focusTransition:scene.viewTransition?{kind:scene.viewTransition.kind,progress:scene.transitionProgress(),fromCount:scene.viewTransition.fromKeys.size}:null,zoomEnabled:scene.controls.enableZoom,cameraTween:scene.tween?{fromZoom:scene.tween.fromZoom,toZoom:scene.tween.toZoom}:null,overviewShellCount:scene.overviewShells?.length||0,overviewShellsEnabled:!!scene.overviewShellsEnabled,overviewShellsVisible:!!scene.overviewShellGroup?.visible,sourceLayers:scene.global?space.globalInfo.maxLayer+1:null,globalCoordinates:scene.global,guide:scene.guideFocus?{step:learning.daily.guide?.step,seenNodes:[...scene.guideFocus.seenNodes],currentNodes:[...scene.guideFocus.currentNodes],edges:scene.guideFocus.edges.map(e=>({from:e.prerequisiteId,to:e.topicId,strength:e.strength}))}:null,guideSuspended,progressBackground:scene.progressBackground||[],previewKey:scene.previewKey,previewEdges:scene.edgesGroup.children.filter(c=>c.userData.relation&&c.geometry.type!=='ConeGeometry').map(c=>({from:c.userData.relation[0],to:c.userData.relation[1],opacity:c.material.opacity,geometry:c.geometry.type})),traceArrows:scene.edgesGroup.children.filter(c=>c.userData.relation&&c.geometry.type==='ConeGeometry').length,traceNodes:scene.traceResult?.nodes.map(id=>({id,distance:scene.traceResult.distances.get(id)}))||[],traceEdgeCount:scene.traceResult?.edges.length||0,sceneMarkers:[...(scene.savedScenes||[])],questionMarkers:[...(scene.queuedQuestions||[])],counts:{themes:space.themes.size,packs:space.packs.size,nodes:space.nodes.size,edges:atlas.edges.length},journeyOpen,visibleNodes:[...(scene.visibleNodes||[])],relations:scene.relations.map(l=>({from:l.from,to:l.to,count:l.edges.length,strength:l.edges[0]?.strength,lit:!!l.lit})),panels:[...panels.values()].map(p=>({id:p.id,anchor:[...p.anchor],tab:p.tab})),positions:space.objects.map(o=>({key:o.key,position:[...o.position]})),rendered:true}),project:key=>{const o=space.byKey.get(key);return scene.canLocate(o)?scene.project(o.position):null;},nodeRadius:key=>scene.nodeScreenRadius(key),nodeTint:key=>{const i=scene.nodeList.findIndex(n=>n.key===key);return i<0?null:[...scene.nodeMesh.instanceColor.array.slice(i*3,i*3+3)];},completionMarker:key=>scene.completionMarkerVisible(key)};
  let pendingResume=null;try{pendingResume=sessionStorage.getItem(PENDING_RESUME_KEY);sessionStorage.removeItem(PENDING_RESUME_KEY);}catch{}if(pendingResume)queueMicrotask(()=>resume(pendingResume));
 }catch(error){$('#loading').innerHTML=`<h1>空间暂时没有展开</h1><p>${esc(error.message)}</p><p>学习记录没有被清除。可以重新打开，或使用保留的平面入口。</p><a href="v2.html#map" class="primary-button">打开平面入口</a>`;}}
setInterval(()=>{if(scene&&!document.hidden&&dayKey()!==renderedDay){readLearning();refreshLearning();}},60000);
boot();
