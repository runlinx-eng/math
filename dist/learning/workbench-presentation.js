// B1: a visual rhythm derived solely from the validated existing stage.
 // Reading is always available; exploration can start immediately. No new
 // stage, model field, completion requirement or fabricated "read" event.
export const WORKBENCH_BEATS=Object.freeze([
  {id:'read',label:'看清问题'},
  {id:'try',label:'动手尝试'},
  {id:'check',label:'检查验证'},
  {id:'record',label:'记下发现'}
]);
export function workbenchBeat(stage='explore'){
  if(stage==='reflect')return 'record';
  if(['revise','recheck','passed'].includes(stage))return 'check';
  return 'try';
}

 // B1: mount once, before rendering. Move original containers, never clone a
 // workpiece, action, feedback or record. Standalone lessons keep their layout.
export function mountWorkbenchShell(doc){
  const scene=doc.querySelector('#scene');
  if(!scene||doc.querySelector('#workbench-stage'))return false;
  const command=scene.querySelector('.execution-command');
  const stageItems=['question-context','learning-problem','learning-interaction','learning-check','learning-next','record'].map(id=>doc.getElementById(id));
  if(!command||stageItems.some(el=>!el))return false;
  const stage=doc.createElement('section');
  stage.id='workbench-stage';stage.tabIndex=0;
  stage.setAttribute('role','region');stage.setAttribute('aria-label','数学主舞台');
  scene.insertBefore(stage,command);
  stage.append(...stageItems);
  doc.body.dataset.workbenchShell='fixed';
  mountWorkbenchDrawer(doc,stage,command);
  mountWorkbenchLocation(doc);
  return true;
}

// The current work identity and validated stage drive only scroll presentation.
// Keep the original shared Check/Next controller byte-for-byte unchanged.
const workbenchScrollContext=new WeakMap();
export function syncWorkbenchScroll(doc,{sessionId,index,view,stage}){
  const surface=doc.getElementById('workbench-stage');
  if(!surface)return;
  const key=JSON.stringify([sessionId,index,view]),previous=workbenchScrollContext.get(surface);
  workbenchScrollContext.set(surface,{key,stage});
  if(!previous||previous.key!==key){closeWorkbenchDrawer(doc);surface.scrollTop=0;return;}
  // Existing Check still scrolls to its original target. With an independent
  // command row, a newly passed check also brings its real feedback into view.
  if(stage==='passed'&&previous.stage!=='passed'&&surface.clientHeight>0){
    const feedback=doc.getElementById('check-feedback');
    if(feedback&&!feedback.hidden)feedback.scrollIntoView({block:'nearest'});
  }
}

// B1: the native network lesson keeps one original workpiece and one
// original action bar. Only the existing optional details move to a drawer.
export function mountWorkbenchDrawer(doc, stage, command) {
  const support=doc.getElementById('learning-support');
  const history=doc.getElementById('record');
  const sections=[support,history];
  if(!stage||!command||doc.getElementById('workbench-drawer')||sections.some(el=>!el?.querySelector(':scope > summary')))return false;
  const body=doc.createElement('div');body.id='workbench-content';
  const dock=doc.createElement('aside');dock.id='workbench-drawer';dock.setAttribute('aria-label','辅助资料');
  stage.before(body);body.append(stage,dock);
  const fixed=doc.defaultView.matchMedia('(min-height:440px) and (min-width:340px)');
  const opened=()=>sections.find(el=>el.open&&!el.hidden);
  const sync=()=>{stage.inert=fixed.matches&&!!opened();};
  const close=({restoreFocus=false}={})=>{
    const active=opened();
    for(const el of sections)el.open=false;
    sync();
    if(active&&restoreFocus)active.querySelector(':scope > summary').focus();
  };
  for(const el of sections){
    const summary=el.querySelector(':scope > summary');
    const panel=doc.createElement('div');panel.id=el.id+'-drawer-panel';panel.className='workbench-drawer-panel';
    panel.tabIndex=0;panel.setAttribute('role','region');panel.setAttribute('aria-label',summary.textContent.trim());
    summary.setAttribute('aria-controls',panel.id);
    panel.append(...Array.from(el.childNodes).filter(child=>child!==summary));
    el.append(panel);el.setAttribute('name','workbench-auxiliary');dock.append(el);
    el.addEventListener('toggle',()=>{
      if(el.open)for(const other of sections)if(other!==el)other.open=false;
      sync();
    });
  }
  dock.addEventListener('keydown',event=>{
    if(event.key!=='Escape'||!opened()||event.defaultPrevented)return;
    event.preventDefault();event.stopPropagation();close({restoreFocus:true});
  });
  // The original command remains usable. Closing is presentation only, before
  // the existing delegated Check/Next action runs; no action is duplicated.
  command.addEventListener('click',()=>close(),true);
  // Close before an original secondary action, without replacing its handler.
  dock.addEventListener('click',event=>{
    const action=event.target.closest('button[data-do]');
    if(action&&!action.disabled)close({restoreFocus:true});
  },true);
  // A real state transition can hide the record. Do not strand the work surface.
  const visibility=new doc.defaultView.MutationObserver(()=>{
    for(const el of sections)if(el.hidden&&el.open)el.open=false;
    sync();
  });
  for(const el of sections)visibility.observe(el,{attributes:true,attributeFilter:['hidden']});
  fixed.addEventListener('change',sync);
  sync();
  return true;
}
export function closeWorkbenchDrawer(doc){
  const dock=doc.getElementById('workbench-drawer');
  if(!dock)return;
  for(const el of dock.querySelectorAll(':scope > details[open]'))el.open=false;
  const stage=doc.getElementById('workbench-stage');if(stage)stage.inert=false;
}


// B1: location is read-only display of the active session, never the selected
// map node or its grade filter. The existing validated curriculum loader is
// reused lazily; unavailable metadata must not delay or prevent learning.
const LOCATION_ROLES=Object.freeze({main:'主要',extension:'延伸',transition:'过渡'});
const locationPrefix=bridge=>bridge?'关联任务目标知识学段':'知识学段';
function mountWorkbenchLocation(doc){
  const heading=doc.querySelector('#scene .lesson-heading');
  if(!heading||doc.getElementById('workbench-curriculum'))return;
  const host=doc.createElement('p');
  host.id='workbench-curriculum';host.hidden=true;
  host.setAttribute('aria-live','polite');
  heading.append(host);
}
export function describeWorkbenchCurriculum(data,topicId,{bridge=false}={}){
  const prefix=locationPrefix(bridge);
  const result=(state,label,stageIds=[],evidence='',detail='')=>({state,text:prefix+'：'+label,stageIds,evidence,
    title:(detail?detail+'。':'')+'仅为来源知识的课程映射参考，不规定学习顺序或评定掌握。'});
  if(!data)return result('unavailable','暂不可读');
  if(data.specialRisks?.thinkingNodes?.ids?.includes(topicId))return result('thinking','数学思维，不分小学学段');
  const curriculum=data.nodeMappings?.find(row=>row.nodeId===topicId)?.curriculum;
  if(data.specialRisks?.unresolvedNode?.id===topicId)
    return result('unresolved','待核对',[],curriculum?.evidenceLevel||'',data.specialRisks.unresolvedNode.status);
  if(!curriculum)return result('missing','暂无映射，不推断年级');
  const stages=(data.stages||[]).filter(stage=>curriculum.primaryStages?.includes(stage.id));
  const roleLabel=role=>LOCATION_ROLES[role]?'（'+LOCATION_ROLES[role]+'）':'';
  const primary=stages.map(stage=>stage.label+roleLabel(curriculum.roles?.[stage.id]));
  const parts=primary.length?primary:['未纳入小学学段'];
  if(curriculum.beyondPrimary?.role)parts.push('初中后续'+roleLabel(curriculum.beyondPrimary.role));
  return result(primary.length?'mapped':'unassigned',parts.join(' / '),stages.map(stage=>stage.id),curriculum.evidenceLevel||'',
    curriculum.evidenceLevelLabel?'来源证据：'+curriculum.evidenceLevelLabel:'');
}
let workbenchCurriculumRequest;
function loadWorkbenchCurriculum(){
  return workbenchCurriculumRequest??=import('../grade-node-filter.js')
    .then(({loadGradePanoramaData})=>loadGradePanoramaData()).catch(()=>null);
}
const workbenchLocationContexts=new WeakMap();
export function syncWorkbenchLocation(doc,{sessionId,topicId,bridge=false,index,view,total},load=loadWorkbenchCurriculum){
  const host=doc.getElementById('workbench-curriculum');
  if(!host)return; // standalone and other embedded surfaces retain their UI.
  const status=doc.getElementById('status');
  if(status){
    status.dataset.sessionId=sessionId;status.dataset.view=view;
    if(Number.isSafeInteger(total)&&total>0)status.dataset.taskTotal=String(total);
    else delete status.dataset.taskTotal;
    if(view==='task'&&Number.isSafeInteger(index)&&index>=0&&index<total){
      const ordinal=index+1;
      status.dataset.taskOrdinal=String(ordinal);
      const label='任务 '+ordinal+' / '+total;
      // Preserve the original count-twenty completion wording if it is present.
      const complete=status.textContent.includes('三项已完成');
      status.textContent=label+(complete?' · 三项已完成':'');
    }else delete status.dataset.taskOrdinal;
  }
  const previous=workbenchLocationContexts.get(host);
  if(previous?.sessionId===sessionId&&previous.topicId===topicId&&previous.bridge===bridge)return previous.pending;
  const current={sessionId,topicId,bridge};
  workbenchLocationContexts.set(host,current);
  host.hidden=false;host.dataset.sessionId=sessionId;host.dataset.topicId=topicId;
  host.dataset.scope=bridge?'bridge-target':'native';host.dataset.state='loading';
  host.dataset.stageIds='';host.dataset.evidence='';host.textContent=locationPrefix(bridge)+'：读取中';host.title='';
  const paint=data=>{
    if(workbenchLocationContexts.get(host)!==current)return; // older session response cannot relabel current work.
    const label=describeWorkbenchCurriculum(data,topicId,{bridge});
    host.textContent=label.text;host.title=label.title;host.dataset.state=label.state;
    host.dataset.stageIds=label.stageIds.join(' ');host.dataset.evidence=label.evidence;
  };
  current.pending=Promise.resolve().then(load).then(paint,()=>paint(null));
  return current.pending;
}
