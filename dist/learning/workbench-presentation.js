import {studyActionFocus} from './workspace-flow.js';
import * as B22 from './phase5/b22-model.js';
import * as B23 from './phase5/b23-model.js';
import * as B24 from './phase5/b24-model.js';
import * as B25 from './phase5/b25-model.js';
import * as B26 from './phase5/b26-model.js';
import * as B27 from './phase5/b27-model.js';
import * as B28 from './phase5/b28-model.js';

// B1: a visual rhythm derived solely from the validated existing stage.
 // Reading is always available; exploration can start immediately. No new
 // stage, model field, completion requirement or fabricated "read" event.
export const WORKBENCH_BEATS=Object.freeze([
  {id:'read',label:'看清问题'},
  {id:'try',label:'动手尝试'},
  {id:'check',label:'检查验证'},
  {id:'record',label:'记下发现'}
]);
// Compare only existing work evidence, not correctness or readiness. A seed
// belongs to the saved exercise; status must not generate a new random draw.
const seededModels=[B22,B23,B24,B25,B26,B27,B28];
const sameWork=(a,b)=>{
 if(Object.is(a,b))return true;
 if(!a||!b||typeof a!=='object'||typeof b!=='object'||Array.isArray(a)!==Array.isArray(b))return false;
 const keys=Object.keys(a);
 return keys.length===Object.keys(b).length&&keys.every(k=>Object.hasOwn(b,k)&&sameWork(a[k],b[k]));
};
function blankWorkbenchModel(task,model,initialModel){
 if(Object.hasOwn(model,'seed')){
  const seed=model.seed,adapter=seededModels.find(m=>m.TYPES.has(task.type));
  if(adapter)return adapter.initial(task,seed);
  // B04 creates its random seed inside initial(). Reuse the exact original
  // empty-work shape for its three stochastic types without calling RNG.
  if(task.type==='x-experiment')return {seed,guess:null,prediction:null,draws:[],counts:task.labels.map(()=>0),comparison:''};
  if(task.type==='x-spinner')return {seed,color:0,sectors:Array(task.sectors).fill(-1),prediction:'',runs:[],why:''};
  if(task.type==='x-simulation')return {seed,sample:'10',runs:[],trend:'',guarantee:'',why:''};
  return null; // unknown seed-bearing models stay on the old visual rhythm
 }
 return initialModel?.(task);
}
export function workbenchBeat(stage='explore',{v54=false,task=null,model=null,initialModel=null}={}){
  if(stage==='reflect')return 'record';
  if(['revise','recheck','passed'].includes(stage))return 'check';
  if(v54&&stage==='explore'&&task&&model){
   if(Array.isArray(model.history)&&model.history.length)return 'try';
   try{
    const blank=blankWorkbenchModel(task,model,initialModel);
    if(blank&&sameWork(model,blank))return 'read';
   }catch{/* Unrecognized legacy work keeps its previous display. */}
  }
  return 'try';
}

// V54 readiness is an overlay on the frozen shared action controller.
// Standalone/V53 and every existing shared gate keep their original behavior.
const waiting=(cue,selector=null)=>selector
 ?{kind:'widget',selector,readyToCheck:false,cue}
 :{kind:'work',readyToCheck:false,cue};
export function studyActionFocusForWorkbench({v54=false,...context}={}){
 const focus=studyActionFocus(context);
 if(!v54||!focus.readyToCheck||focus.kind==='continue')return focus;
 const {task,model}=context,type=task?.type,board=model?.board;
 // V54 only: readiness is the number/presence of original work events,
 // never the expected answer, correct groups, rule coefficients or result.
 // Unknown or correctness-entangled tasks keep their existing Check path.
 if(type==='x-net'&&Array.isArray(model?.runs)){
  if(model.fold!==100||model.runs.length===0)
   return waiting('先留下猜想，再把纸片合起来试一次。');
 }
 if(type==='x-fracdecompose'&&Array.isArray(board?.saved)){
  const total=task.count||task.required?.length||1;
  if(board.saved.length<total)return waiting('已留下 '+board.saved.length+'/'+total+' 种分法；再完成剩下的分法。','[data-x="b18-save"]');
 }
 if(type==='x-rulejump'&&Array.isArray(board?.records)&&Array.isArray(task.inputs)){
  if(!board.rule)return waiting('先搭一条可以运行的规则。','[data-x="b17-rule"]');
  const done=task.inputs.filter(n=>board.records.some(r=>r.n===n)).length;
  if(done<task.inputs.length)return waiting('已记录 '+done+'/'+task.inputs.length+' 个位置；把其余位置也试一遍。','[data-x="b17-run"]');
 }
 if(type==='x-g27-net'&&Array.isArray(board?.parts)&&task.rotate&&!board.turned)
  return waiting('再转一转，观察合起来的盒子。','[data-x="turn-extra"]');
 // B21: sample completion is the existing number of committed draw/return
 // cycles. Do not compare estimates, the sample composition or conclusions.
 // The original widget itself accepts or rejects each individual record.
 if(type==='x-samplelab'&&Array.isArray(board?.runs)&&Number.isInteger(task.runs)&&task.runs>0){
  const done=board.runs.length;
  if(done<task.runs||board.pending)return board.pending
   ?waiting('已记录 '+done+'/'+task.runs+' 次。先记下这次结果，再全部放回。','[data-x="b21-record"]')
   :waiting('已记录 '+done+'/'+task.runs+' 次。再抽一次，完成剩余记录。','[data-x="b21-draw"]');
 }
 // B04: count actual trials, not correctness of the final tally or prediction.
 if(type==='x-experiment'&&Array.isArray(model?.draws)&&Number.isInteger(task.count)&&task.count>0&&model.draws.length<task.count)
  return waiting('已试 '+model.draws.length+'/'+task.count+' 次。按教具的原顺序逐次试验、记录。','[data-x="experiment-draw"]');
 if(type==='x-simulation'&&Array.isArray(model?.runs)){
  const sizes=[10,100,1000],counts=sizes.map(n=>model.runs.filter(r=>r.n===n).length);
  if(counts.some(n=>n<5))return waiting('各规模已完成 '+sizes.map((n,i)=>n+'次：'+counts[i]+'/5').join('；')+'。每种再做到五轮。','[data-x="simulate"]');
 }
 // B22: each configured observation checkpoint is an actual run, independent
 // of the rate, theoretical expectation, or subsequent answer.
 if(type==='x-p22-experiment'&&Array.isArray(board?.checkpoints)&&Array.isArray(task.targets)&&task.targets.length){
  const done=task.targets.filter(n=>board.checkpoints.includes(n)).length;
  if(done<task.targets.length)return board.started
   ?waiting('已留下 '+done+'/'+task.targets.length+' 组试验记录。继续试到题目要求的次数。','[data-x="p22-run"]')
   :waiting('先留下猜想，再开始试验。','[data-x="p22-start"]');
 }
 return focus;
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
  // Only the native V54 embedding owns a parent header; keep the real question
  // action and location nodes within the existing delegated child event root.
  try{
    if(doc.defaultView.parent.document.body.dataset.networkVersion==='54'){
      const dock=doc.getElementById('workbench-drawer'),panel=doc.getElementById('learning-support-drawer-panel');
      const question=doc.querySelector('#lesson>header [data-do="question"]');
      const curriculum=doc.getElementById('workbench-curriculum'),route=doc.getElementById('route-title');
      if(dock&&panel&&question&&curriculum&&route){
        dock.append(question);panel.prepend(route,curriculum);doc.body.dataset.workbenchHeader='parent';
        // One footer, with the original auxiliary dock on the left and the
        // original execution command on the right. No new action owner.
        const content=doc.getElementById('workbench-content');
        if(content&&dock.parentElement===content){
          const footer=doc.createElement('div');footer.id='workbench-footer';
          footer.setAttribute('role','group');footer.setAttribute('aria-label','学习底栏');
          dock.before(footer);footer.append(dock,command);
          // When the original buttons wrap or an action changes, keep the
          // overlay confined to the scroll stage, above the whole footer.
          const measure=()=>content.style.setProperty('--workbench-footer-height',footer.getBoundingClientRect().height+'px');
          measure();
          if(doc.defaultView.ResizeObserver){
            const observer=new doc.defaultView.ResizeObserver(measure);observer.observe(footer);
          }
        }
      }
    }
  }catch{/* Non-native embeddings keep the original presentation. */}
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
