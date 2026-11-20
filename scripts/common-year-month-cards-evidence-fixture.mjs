// #335: independent native task fingerprint and authentic widget actions.
// Source cards contain every month/day answer: this fixture is NOT strict A approval.
import {createHash} from 'node:crypto';
import * as native from '../dist/learning/phase5/b32-model.js';
import {applyTimeFixtureStep} from './time-evidence-fixture.mjs';
const FROZEN_TASK_SHA256='d1b0ee036acf3aa56ebe9c4e228dd7a62d9383af23fc7773cce8dd48450a7546';
const stable=x=>Array.isArray(x)?x.map(stable):x&&typeof x==='object'?
 Object.fromEntries(Object.keys(x).sort((a,b)=>a.localeCompare(b,'en')).map(k=>[k,stable(x[k])])):x;
export const commonYearMonthCardsFingerprint=task=>
 createHash('sha256').update(JSON.stringify(stable(task))).digest('hex');
export function commonYearMonthCardsEvidenceExample(task){
 if(task?.type!=='x-t32-units'||commonYearMonthCardsFingerprint(task)!==FROZEN_TASK_SHA256)
  throw Error('Not the frozen native common-year month cards task');
 if(task.parts?.length!==12||task.questions?.length!==2)
  throw Error('Original month card and question counts changed');
 const model=native.initial(task);
 for(let index=0;index<12;index++)
  applyTimeFixtureStep(task,model,{action:'t32-unit',data:{index}});
 applyTimeFixtureStep(task,model,{field:'answers.0',value:'30'});
 applyTimeFixtureStep(task,model,{field:'answers.1',value:'28'});
 if(!native.valid(task,model)||!native.inspect(task,model).correct)
  throw Error('Original month cards or answers failed native grading');
 return model;
}
