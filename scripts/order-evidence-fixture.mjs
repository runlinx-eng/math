// Drive only controls present in the unchanged B15 view. Original solveSteps is
// an input recipe, never an expected mathematical result: fixed tests and the
// independent artifact review supply separate exact expectations.
import * as model from '../dist/learning/phase5/b15-model.js';
import * as view from '../dist/learning/phase5/b15-view.js';
const attrs=tag=>Object.fromEntries([...tag.matchAll(/([\w-]+)="([^"]*)"/g)].map(m=>[m[1],m[2]]));
export function applyOrderStep(task,current,step){
 const html=view.render(task,current);
 if(step.field){
  const tags=[...html.matchAll(/<(?:input|select|textarea)\b[^>]*>/g)].map(m=>m[0]).filter(s=>attrs(s)['data-xfield']===step.field);
  if(tags.length!==1||/\bdisabled\b/.test(tags[0]))throw Error('Field is not visible: '+step.field);
  if(tags[0].startsWith('<select')){
   const start=html.indexOf(tags[0]),select=html.slice(start,html.indexOf('</select>',start));
   if(!select.includes('value="'+step.value+'"'))throw Error('Option is not visible: '+step.field);
  }
  current[step.field]=String(step.value);model.field(task,current,step.field);
 }else{
  const tags=[...html.matchAll(/<button\b[^>]*>/g)].map(m=>m[0]).filter(s=>attrs(s)['data-x']===step.action&&
   Object.entries(step.data||{}).every(([k,v])=>attrs(s)['data-'+k]===String(v)));
  if(tags.length!==1||/\bdisabled\b/.test(tags[0]))throw Error('Action is not visible: '+step.action);
  const length=current.history.length;model.act(task,current,step.action,step.data);
  if(current.history.length!==length+1)throw Error('Action was not recorded');
 }
 return current;
}
export const orderSolveSteps=task=>model.solveSteps(task);
export function orderEvidenceExample(task,steps=orderSolveSteps(task)){
 const current=model.initial(task);for(const step of steps)applyOrderStep(task,current,step);return current;
}
