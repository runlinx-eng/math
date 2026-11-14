// Engineering fixture only. The historical B10 example fills both swap-only
// fields, although just one is visible. Build a fresh genuine control path;
// never sanitize an existing model or change the original model/example.
import * as stories from '../dist/learning/phase5/b10-model.js';
import * as view from '../dist/learning/phase5/b10-view.js';

export function joinStorySolveSteps(task,{guess}={}){
 if(task?.type!=='x-joinstory')throw new TypeError('Expected a B10 join story');
 const result=task.a+(task.op==='+'?task.b:-task.b),steps=[];
 for(const [group,n] of [['left',task.a],['right',task.b]])
  for(let i=0;i<n;i++)steps.push({action:'story-counter',data:{group,delta:1}});
 steps.push({field:'guess',value:guess??String(task.hidden?task[task.hidden]:result)},
  {field:'op',value:task.op},{action:'story-do'},
  {field:'equation',value:task.balance?`${task.a}+${task.b}=${task.balance[0]}+${task.balance[1]}`:`${task.a}${task.op}${task.b}=${result}`});
 if(task.swap)steps.push({action:'story-swap'},task.op==='+'?
  {field:'otherEquation',value:`${task.b}+${task.a}=${result}`}:{field:'shortage',value:'not-enough'});
 return steps;
}

export function joinStoryEvidenceExample(task,options){
 const model=stories.initial(task);
 for(const step of joinStorySolveSteps(task,options)){
  const html=view.controls(task,model);
  if(step.field){
   const matches=[...html.matchAll(/<(input|select)\b[^>]*data-xfield="([^"]+)"[^>]*>/g)].filter(m=>m[2]===step.field);
   if(matches.length!==1||/\bdisabled\b/.test(matches[0][0]))throw Error('Fixture field is not available: '+step.field);
   if(matches[0][1]==='select'){
    const select=html.slice(matches[0].index).split('</select>')[0];
    if(!select.includes('value="'+step.value+'"'))throw Error('Fixture option is not available: '+step.field);
   }
   model[step.field]=step.value;stories.field(task,model,step.field);
  }else{
   const buttons=[...html.matchAll(/<button\b[^>]*>/g)].map(m=>m[0]).filter(s=>s.includes('data-x="'+step.action+'"')&&
    Object.entries(step.data||{}).every(([k,v])=>s.includes('data-'+k+'="'+v+'"')));
   if(buttons.length!==1||/\bdisabled\b/.test(buttons[0]))throw Error('Fixture action is not available: '+step.action);
   stories.act(task,model,step.action,step.data);
  }
 }
 return model;
}
