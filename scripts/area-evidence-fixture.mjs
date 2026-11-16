// Engineering examples only: frozen plans derived from independent geometry.
// Never call the original solver, erase a learner's history, or infer coverage.
import {createHash} from 'node:crypto';
import fixture from '../tests/fixtures/p9-area-cases.cjs';
import * as M from '../dist/learning/phase5/b30-model.js';
import * as V from '../dist/learning/phase5/b30-view.js';
const stable=v=>Array.isArray(v)?v.map(stable):v&&typeof v==='object'?
 Object.fromEntries(Object.keys(v).sort((a,b)=>a.localeCompare(b,'en')).map(k=>[k,stable(v[k])])):v;
const hash=t=>createHash('sha256').update(JSON.stringify(stable(t))).digest('hex');
const all=[...fixture.cases,...fixture.excludedCases,...fixture.associatedCases];
export function applyAreaFixtureStep(task,model,step){
 const html=V.visual(task,model)+V.controls(task,model);
 if(step.field){
  const tags=[...html.matchAll(/<(input|select)\b[^>]*data-xfield="([^"]+)"[^>]*>/g)].filter(m=>m[2]===step.field);
  if(tags.length!==1||/\bdisabled\b/.test(tags[0][0]))throw Error('Unavailable area field: '+step.field);
  if(tags[0][1]==='select'&&!html.slice(tags[0].index).split('</select>')[0].includes('value="'+step.value+'"'))throw Error('Unavailable area option');
  const [k,i]=step.field.split('.');if(i===undefined)model[k]=step.value;else model[k][Number(i)]=step.value;
  M.field(task,model,step.field);
 }else{
  const tags=[...html.matchAll(/<(?:button|rect|polygon|path)\b[^>]*>/g)].map(m=>m[0]).filter(s=>s.includes('data-x="'+step.action+'"')&&
   Object.entries(step.data||{}).every(([k,v])=>s.includes('data-'+k+'="'+v+'"')));
  // Some original widgets expose the same identity on both a polygon and a
  // button. The accessible button is an actual alternative, not a new action.
  const buttons=tags.filter(s=>s.startsWith('<button')),targets=buttons.length?buttons:tags;
  if(targets.length!==1||/\bdisabled\b/.test(targets[0]))throw Error('Unavailable area action: '+step.action);
  M.act(task,model,step.action==='turn-extra'?'a30-turn':step.action,step.data);
 }
 return model;
}
export function areaEvidenceExample(task){
 const row=all.find(c=>c.taskHash===hash(task));if(!row)throw Error('No independently reviewed area example for this complete task');
 const m=M.initial(task);for(const step of row.actions)applyAreaFixtureStep(task,m,step);return m;
}
