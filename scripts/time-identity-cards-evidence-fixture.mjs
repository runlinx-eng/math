// #331: explicit original time-identity card fixture, not inferred mental work.
import {createHash} from 'node:crypto';
import * as native from '../dist/learning/phase5/b32-model.js';
import {applyTimeFixtureStep} from './time-evidence-fixture.mjs';
const reviewed=new Map([
 ['2e1eccd3687fcc14db1fdea4610ad8d7b55e0219325b63362e9d8b04184e6d3c',['night']],
 ['41bd633d375cda7ab04d3059e3ab1bb8e7f47ad2005efb8529a7d1a2062da0bd',['15:20','07:05','12:20','00:20']],
 ['d2e443e7b91877d239d6b9a40637d176836385d94f40a0910b1f91d946fceb20',['00:20','12:20']]
]);
const stable=x=>Array.isArray(x)?x.map(stable):x&&typeof x==='object'?
 Object.fromEntries(Object.keys(x).sort((a,b)=>a.localeCompare(b,'en')).map(k=>[k,stable(x[k])])):x;
export const timeIdentityCardsFingerprint=task=>createHash('sha256').update(JSON.stringify(stable(task))).digest('hex');
export function timeIdentityCardsEvidenceExample(task){
 if(task?.type!=='x-t32-units')throw Error('Not an original B32 identity-card lesson');
 const answers=reviewed.get(timeIdentityCardsFingerprint(task));
 if(!answers||!Array.isArray(task.parts)||!Array.isArray(task.questions)||
    task.questions.length!==answers.length)throw Error('Unreviewed original B32 time identity source');
 const model=native.initial(task);
 for(let index=0;index<task.parts.length;index++)
  applyTimeFixtureStep(task,model,{action:'t32-unit',data:{index}});
 for(let i=0;i<answers.length;i++)
  applyTimeFixtureStep(task,model,{field:'answers.'+i,value:answers[i]});
 if(!native.valid(task,model)||!native.inspect(task,model).correct)
  throw Error('Native time identity review fixture failed original grader');
 return model;
}
