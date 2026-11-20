// #333: exact original week/day task fingerprint and authentic native actions.
import {createHash} from 'node:crypto';
import * as native from '../dist/learning/phase5/b32-model.js';
import {applyTimeFixtureStep} from './time-evidence-fixture.mjs';
const FROZEN_TASK_SHA256='b4bdce5c9ab7c5c273aed81f2d2daeb33dfa3ccf22c838df1b21e5948bbe899a';
const stable=x=>Array.isArray(x)?x.map(stable):x&&typeof x==='object'?
 Object.fromEntries(Object.keys(x).sort((a,b)=>a.localeCompare(b,'en')).map(k=>[k,stable(x[k])])):x;
export const weekDayCardsFingerprint=task=>createHash('sha256').update(JSON.stringify(stable(task))).digest('hex');
export function weekDayCardsEvidenceExample(task){
 if(task?.type!=='x-t32-units'||weekDayCardsFingerprint(task)!==FROZEN_TASK_SHA256)
  throw Error('Not the reviewed native 8-week plus 3-day task');
 if(task.parts?.length!==9||task.questions?.length!==1)throw Error('Task card structure changed');
 const model=native.initial(task);
 for(let index=0;index<9;index++)applyTimeFixtureStep(task,model,{action:'t32-unit',data:{index}});
 applyTimeFixtureStep(task,model,{field:'answers.0',value:'59'});
 if(!native.valid(task,model)||!native.inspect(task,model).correct)
  throw Error('Original native actions or answer failed B32 grading');
 return model;
}
