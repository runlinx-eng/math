// Engineering examples built only through original, currently available B16
// fields/buttons. No production example/solver/adapter supplies the actions.
import * as modelApi from '../dist/learning/phase5/b16-model.js';
import * as view from '../dist/learning/phase5/b16-view.js';

export const paperPaintPatterns=Object.freeze([
 [0,0,0,0,1,1,1,1,2,2,2,2,3,3,3,3],
 [0,1,2,3,0,1,2,3,0,1,2,3,0,1,2,3],
 [0,0,1,1,0,0,1,1,2,2,3,3,2,2,3,3]
].map(Object.freeze));

export function paperLabSolveSteps(task,{reverse=false}={}){
 if(task?.type!=='x-paperlab')throw new TypeError('Expected a paper partition task');
 const steps=[],field=(key,value)=>steps.push({field:key,value:String(value)}),
  action=(name,data={})=>steps.push({action:'b16-'+name,data});
 if(task.mode==='classify'){
  for(const pieces of task.cases){
   const same=pieces.length===task.d&&pieces.every(value=>value===pieces[0]);
   field('choice',same?'yes':'no');if(task.writeName)field('answer','1/'+task.d);
   action('judge');
  }
 }else if(task.mode==='paint'){
  for(const pattern of paperPaintPatterns.slice(0,2)){
   const order=Array.from({length:16},(_,i)=>i);if(reverse)order.reverse();
   for(const i of order){field('color',pattern[i]);action('paint',{index:i});}
   action('save');
  }
  field('answer','1/4');
 }else{
  if(task.mode==='fold'){
   for(let parts=1;parts<task.d;parts*=2)action('fold',{value:reverse?'y':'x'});
  }else if(task.mode==='build'){
   const rows=reverse&&!task.shape&&task.d%2===0?2:1;
   field('rows',rows);field('cols',task.d/rows);action('partition');
  }else throw new TypeError('Unreviewed paper mode');
  for(let i=0;i<(task.take||1);i++)action('paper',{index:reverse?task.d-1-i:i});
  field('answer',(task.take||1)+'/'+task.d);
 }
 return steps;
}

export function applyPaperVisibleStep(task,model,step){
 const html=view.render(task,model);
 if(step.field){
  const controls=[...html.matchAll(/<(?:input|select|textarea)\b[^>]*data-xfield="([^"]+)"[^>]*>/g)].filter(m=>m[1]===step.field);
  if(controls.length!==1||/\bdisabled\b|\breadonly\b/.test(controls[0][0]))throw Error('Unavailable paper field '+step.field);
  if(controls[0][0].startsWith('<select')){
   const start=controls[0].index,end=html.indexOf('</select>',start),options=html.slice(start,end);
   if(!options.includes('value="'+step.value+'"'))throw Error('Unavailable paper option '+step.value);
  }
  const max=controls[0][0].match(/maxlength="(\d+)"/);
  if(max&&String(step.value).length>Number(max[1]))throw Error('Paper input too long');
  model[step.field]=String(step.value);modelApi.field(task,model,step.field);
 }else{
  const controls=[...html.matchAll(/<(?:button|g)\b[^>]*>/g)].map(m=>m[0]).filter(tag=>
   tag.includes('data-x="'+step.action+'"')&&Object.entries(step.data||{}).every(([k,v])=>tag.includes('data-'+k+'="'+v+'"')));
  if(controls.length!==1||/\bdisabled\b/.test(controls[0]))throw Error('Unavailable paper action '+step.action);
  modelApi.act(task,model,step.action,step.data);
 }
 if(!modelApi.valid(task,model))throw Error('Original paper model is invalid');
 return model;
}

export function paperLabEvidenceExample(task,options){
 const model=modelApi.initial(task);
 for(const step of paperLabSolveSteps(task,options))applyPaperVisibleStep(task,model,step);
 return model;
}
