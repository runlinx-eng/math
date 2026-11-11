// The on-demand boundary is separate from the synchronous grading and record APIs.
// Loading never writes localStorage; validation still uses the original validators.
import {LESSONS} from '../catalog.js';
import {TASKS,PRACTICE} from '../tasks.js';
import {BRIDGES} from '../bridges.js';
import {registerB39Model} from './engine.js';

const isB39=id=>LESSONS[id]?.batch==='B39'||BRIDGES[id]?.batch==='B39';
const bridgeId=b=>'link-'+b.from+'-'+b.to;
let ready=false,loading=null,loadedModel=null,attempt=0;
let viewLoading=null,viewReady=false,viewAttempt=0;
export const isB39Ready=()=>ready;
export const needsB39Runtime=raw=>{
  if(!raw||typeof raw!=='object')return false;
  if(Object.keys(raw.lessons||{}).some(isB39)||Object.keys(raw.daily?.bridges||{}).some(isB39))return true;
  return Array.isArray(raw.daily?.questions)&&raw.daily.questions.some(q=>
    isB39(q?.scene?.record?.id)||q?.events?.some(e=>isB39(e?.displaced?.record?.id)));
};
export async function ensureB39Ready(){
  if(ready)return;
  if(loading)return loading;
  const retry=attempt++;
  const suffix=retry?'?retry='+retry:'';
  loading=Promise.all([import('../phase5/b39.js'+suffix),import('../phase5/b39-model.js'+suffix)])
    .then(([batch,model])=>{
      const ids=Object.keys(batch.TASKS);
      if(ids.length!==8||ids.some(id=>!isB39(id))||batch.BRIDGES.length!==13)
        throw new Error('B39 任务目录与轻量元数据不一致');
      for(const b of batch.BRIDGES){
        const configured=BRIDGES[bridgeId(b)];
        if(!configured||configured.batch!=='B39'||configured.title!==b.title||b.tasks.length!==2)
          throw new Error('B39 关联任务目录不一致');
      }
      Object.assign(TASKS,batch.TASKS);
      Object.assign(PRACTICE,batch.PRACTICE);
      for(const b of batch.BRIDGES)BRIDGES[bridgeId(b)].tasks=b.tasks;
      registerB39Model(model);
      loadedModel=model;
      ready=true;
    }).catch(error=>{loading=null;throw error;});
  return loading;
}
export async function prepareStateForValidation(raw){
  if(needsB39Runtime(raw))await ensureB39Ready();
}
export async function prepareSessionRuntime(id,{view=false}={}){
  if(!isB39(id))return;
  await ensureB39Ready();
  if(!view||viewReady)return;
  if(!viewLoading){
    const retry=viewAttempt++;
    const suffix=retry?'?retry='+retry:'';
    viewLoading=Promise.all([import('../phase5/b39-view.js'+suffix),import('./view-engine.js')])
      .then(([renderer,dispatcher])=>{dispatcher.registerB39View(loadedModel,renderer);viewReady=true;})
      .catch(error=>{viewLoading=null;throw error;});
  }
  await viewLoading;
}
