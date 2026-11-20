// #327: independently reviewed native time-unit cards only, never auto-admit a
// task because it happens to share the B32 widget. Exercises the actual view
// actions rather than treating a prefilled answer as a mathematical replay.
import {createHash} from 'node:crypto';
import * as native from '../dist/learning/phase5/b32-model.js';
import {applyTimeFixtureStep} from './time-evidence-fixture.mjs';

const reviewed=new Map([
 ['a4b8cc3ab8ca39557ad2f318869c86009190b05403c227878710fa8f1338a9d3',['2','120']],
 ['212843e1f0b36c73b1eb788e2b94fc795e03a2396166de57b7435c8b70828302',['60']],
 ['bab632b8393c8e0224ce0e4e9b83bb4f46b8b6df20b4f5603ed0f71177a7c759',['24']],
 ['cef8b68d985c09debdf129887cfe8fe1c2aee31756f8a7308cf7c71ec875bf0f',['1','30']],
 ['1bae521a58580ee0fe402c19cf0f3d3aa946368e84fd42b3e1a2991f54aded92',['205']],
 ['2635aa3849d226069eb93f7f6efe01c25bb497f54034837d2ab98ccecf1c40ec',['2','30']],
 ['56655e258936575429bca55375504ac92cb9b58d05a55b75aad0053205c4f14d',['60']]
]);
const stable=value=>Array.isArray(value)?value.map(stable):value&&typeof value==='object'?
 Object.fromEntries(Object.keys(value).sort((a,b)=>a.localeCompare(b,'en')).map(k=>[k,stable(value[k])])):value;
const fingerprint=task=>createHash('sha256').update(JSON.stringify(stable(task))).digest('hex');

export function timeUnitPartsEvidenceExample(task){
 if(task?.type!=='x-t32-units')throw Error('Not a native B32 unit-card lesson');
 const answers=reviewed.get(fingerprint(task));
 if(!answers||!Array.isArray(task.parts)||!Array.isArray(task.questions)||
    task.questions.length!==answers.length)throw Error('Unreviewed original B32 time-unit source');
 const model=native.initial(task);
 for(let index=0;index<task.parts.length;index++)
  applyTimeFixtureStep(task,model,{action:'t32-unit',data:{index}});
 for(let i=0;i<answers.length;i++)
  applyTimeFixtureStep(task,model,{field:'answers.'+i,value:answers[i]});
 if(!native.valid(task,model)||!native.inspect(task,model).correct)
  throw Error('Independent unit-card fixture does not satisfy the original B32 model');
 return model;
}
