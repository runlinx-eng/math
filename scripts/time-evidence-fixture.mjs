// Engineering fixture only. Use literal independently reviewed plans rather
// than the original B32 solver: some original one-hop examples intentionally
// do not establish a chosen decomposition. Never rewrite an existing model.
import {createHash} from 'node:crypto';
import fixture from '../tests/fixtures/p9-time-cases.cjs';
import * as time from '../dist/learning/phase5/b32-model.js';
import * as view from '../dist/learning/phase5/b32-view.js';

const stable=v=>Array.isArray(v)?v.map(stable):v&&typeof v==='object'?
 Object.fromEntries(Object.keys(v).sort((a,b)=>a.localeCompare(b,'en')).map(k=>[k,stable(v[k])])):v;
const fingerprint=task=>createHash('sha256').update(JSON.stringify(stable(task))).digest('hex');
const all=[...fixture.cases,...fixture.excludedCases,...fixture.associatedCases];

export function applyTimeFixtureStep(task,model,step){
 const html=view.visual(task,model)+view.controls(task,model);
 if(step.field){
  const matches=[...html.matchAll(/<(input|select)\b[^>]*data-xfield="([^"]+)"[^>]*>/g)].filter(m=>m[2]===step.field);
  if(matches.length!==1||/\bdisabled\b/.test(matches[0][0]))throw Error('Unavailable time fixture field: '+step.field);
  if(matches[0][1]==='select'&&!html.slice(matches[0].index).split('</select>')[0].includes('value="'+step.value+'"'))throw Error('Unavailable time fixture option');
  const [key,index]=step.field.split('.');
  if(index===undefined)model[key]=step.value;else model[key][Number(index)]=step.value;
  time.field(task,model,step.field);
 }else{
  const targets=[...html.matchAll(/<(?:button|circle|rect|path)\b[^>]*>/g)].map(m=>m[0]).filter(s=>s.includes('data-x="'+step.action+'"')&&
   Object.entries(step.data||{}).every(([k,v])=>s.includes('data-'+k+'="'+v+'"')));
  if(targets.length!==1||/\bdisabled\b/.test(targets[0]))throw Error('Unavailable time fixture action: '+step.action);
  time.act(task,model,step.action,step.data);
 }
 return model;
}

export function timeEvidenceExample(task){
 const spec=all.find(row=>row.taskHash===fingerprint(task));
 if(!spec)throw Error('No independently reviewed time fixture for this complete task');
 const model=time.initial(task);
 for(const step of spec.actions)applyTimeFixtureStep(task,model,step);
 return model;
}
