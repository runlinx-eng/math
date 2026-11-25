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
  if(!previous||previous.key!==key){surface.scrollTop=0;return;}
  // Existing Check still scrolls to its original target. With an independent
  // command row, a newly passed check also brings its real feedback into view.
  if(stage==='passed'&&previous.stage!=='passed'&&surface.clientHeight>0){
    const feedback=doc.getElementById('check-feedback');
    if(feedback&&!feedback.hidden)feedback.scrollIntoView({block:'nearest'});
  }
}
