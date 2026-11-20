import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {sessionTasks} from '../dist/learning/bridges.js';
import {ensureB39Ready} from '../dist/learning/phase4/async-batches.js';
import * as M from '../dist/learning/phase5/b07-model.js';
import {pvSavedBinding,replayPVSavedEvidence} from '../dist/learning/pv-saved-evidence.js';
await ensureB39Ready();
const cases=[
 ['twoproblems',2,'59a6ea394f2dcd1b08303a7cc9805a2486e9d1f6e520d0922fd85fc9d5718b09',[0,6,8,0],[0,6,8,0]],
 ['faces100',1,'07e8a17978517505e0ac71b1a76c2496470f34174a8284302e42e92cbd186991',[0,6,3,0],[0,6,3,0]],
 ['faces120',1,'52d7025de61aaa946b91cdfc0c1a24104caa2360d176f82c2323d461f8c8dcf3',[0,11,2,0],[1,1,2,0]],
 ['screen1000',0,'cd08dd4052954442639f3886a17c6b73cef0c85c906aedd155f53d49388f16b6',[3,4,7,0],[3,4,7,0]]
];
const stable=v=>Array.isArray(v)?v.map(stable):v&&typeof v==='object'?
 Object.fromEntries(Object.keys(v).sort((a,b)=>a.localeCompare(b,'en')).map(k=>[k,stable(v[k])])):v;
const hash=v=>createHash('sha256').update(JSON.stringify(stable(v))).digest('hex');
function positive([id,index,expected,first,second]){
 const task=sessionTasks(id)[index],context={sessionId:id,index},model=M.initial(task);
 assert.equal(hash(task),expected);
 const forms=task.forms;
 for(let i=0;i<2;i++){
  if(i)M.act(task,model,'pv-form',{form:forms[i]});
  const wanted=i?second:first;
  for(let p=0;p<3;p++)for(let k=0;k<wanted[p];k++)
   M.act(task,model,'pv-add',{index:p,delta:1});
  M.act(task,model,'pv-save');
 }
 model.answer=task.n;
 if(task.expanded)model.parts=[Math.floor(task.n/100)*100,Math.floor(task.n/10)%10*10,task.n%10];
 if(task.chart)M.act(task,model,'pv-cell',{index:task.n});
 assert.ok(M.inspect(task,model).correct,id);
 return {task,context,model};
}
test('four exact originals provide ordered, numerical save witnesses, not invented click histories',()=>{
 for(const c of cases){
  const x=positive(c),p=replayPVSavedEvidence(x.task,x.model,x.context);
  assert.ok(p,c[0]);assert.equal(p.representations.length,2);
  assert.equal(p.savedOrderObserved,true);assert.equal(p.addRemoveHistoryObserved,false);
  assert.equal(p.learnerMasteryAssessed,false);
  assert.ok(pvSavedBinding(x.task,x.context));
 }
});
test('source, form order, absent saves, incorrect totals and incorrect additional fields fail closed',()=>{
 for(const c of cases){
  const x=positive(c);
  assert.equal(pvSavedBinding(x.task,{...x.context,index:String(c[1])}),null);
  assert.equal(pvSavedBinding({...x.task,prompt:x.task.prompt+'!'},x.context),null);
  for(const mutate of [
   m=>m.saved.reverse(),m=>m.saved.pop(),m=>m.saved[0].u[2]++,
   m=>m.saved[0].u.push(0),m=>m.saved[0].injected=true,
   m=>m.saved.push(structuredClone(m.saved[0])),m=>m.answer++,
   m=>m.history.push('down1'),m=>m.u[2]++,
   m=>m.form='injected',m=>m.parts[0]=999,
   m=>m.mark=1,m=>m.touched=true,m=>m.packs=0,
   m=>m.cell=x.task.chart?null:1
  ]){
   const model=structuredClone(x.model);mutate(model);
   assert.equal(replayPVSavedEvidence(x.task,model,x.context),null,mutate.toString());
  }
 }
});
test('only four approved candidate positions bind, and no fixed, other Q04 or bridges bind',()=>{
 const allowed=new Set(cases.map(c=>c[0]+':'+c[1])),found=[];
 for(const id of ['twoproblems','faces100','faces120','screen1000','twoplaces','words100','rename']){
  const tasks=sessionTasks(id);
  tasks.forEach((task,index)=>{if(pvSavedBinding(task,{sessionId:id,index}))found.push(id+':'+index);});
 }
 assert.deepEqual(found.sort(),[...allowed].sort());
 const fake=positive(cases[0]);
 assert.equal(pvSavedBinding(fake.task,{sessionId:'link-tenexchange-twoplaces',index:0}),null);
 const wrong=positive(cases[2]);
 wrong.model.saved[1].u=[0,11,2,0];wrong.model.u=[0,11,2,0];
 assert.equal(replayPVSavedEvidence(wrong.task,wrong.model,wrong.context),null);
});
