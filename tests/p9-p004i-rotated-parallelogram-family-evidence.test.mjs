// #342 P004i candidate-only; native B23 model and true runtime session tasks.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {sessionTaskFor} from '../dist/learning/bridges.js';
import * as original from '../dist/learning/phase5/b23-model.js';
import {rotatedParallelogramFamilyBinding as binding,
 replayRotatedParallelogramFamilyEvidence as replay,
 submittedRotatedParallelogramFamilyEvidence as submitted}
 from '../dist/learning/p004i-rotated-parallelogram-family-evidence.js';

const specs=[
 {id:'quadhierarchy',index:2,shape:'parallelogram',rotation:25,classes:[0,1],answer:'parallel',node:'mt_liIW336odh'}
];
const stable=v=>Array.isArray(v)?v.map(stable):v&&typeof v==='object'?
 Object.fromEntries(Object.keys(v).sort((a,b)=>a.localeCompare(b,'en')).map(k=>[k,stable(v[k])])):v;
const digest=v=>createHash('sha256').update(JSON.stringify(stable(v))).digest('hex');
function fixture(s,partial=false){
 const context={sessionId:s.id,index:s.index};
 const task=sessionTaskFor(s.id,s.index);
 const model=original.initial(task,314159);
 for(let i=0;i<3;i++)original.act(task,model,'g23-test',{index:i});
 for(const index of partial?[0]:s.classes)original.act(task,model,'g23-class',{index});
 model.answers[0]=s.answer;
 return {context,task,model};
}
const edited=(m,fn)=>{const copy=structuredClone(m);fn(copy);return copy;};
for(const s of specs){
 const title=s.id+':'+s.index;
 test('P004i '+title+' runtime source, SHA discovery, independent math',()=>{
  const {context,task,model}=fixture(s);
  const hash=digest(task);
  console.log('P004I_NATIVE_FULL_TASK_SHA256 '+title+' '+hash);
  assert.match(hash,/^[0-9a-f]{64}$/);
  assert.equal(task.shape,s.shape);
  assert.equal(binding(task,context)?.nodeId,s.node);
  assert.equal(original.valid(task,model),true);
  assert.equal(original.inspect(task,model).correct,true);
  const proof=replay(task,model,context);
  assert.ok(proof,'native source/action proof');
  assert.deepEqual(proof.independentlyCalculatedClasses,s.classes);
  assert.deepEqual(proof.propertyButtonsActuallyTested,[0,1,2]);
  assert.equal(proof.verifiedGeometry.square,false);
  assert.equal(proof.verifiedGeometry.parallel,true);
  assert.equal(proof.verifiedGeometry.rectangle,false);
  assert.equal(proof.verifiedGeometry.allAnglesRight,false);
  assert.equal(proof.verifiedGeometry.allSidesEqual,false);
  assert.equal(proof.verbalProofAssessed,false);
  assert.equal(proof.generalMasteryAssessed,false);
 });
 test('P004i '+title+' genuine wrong -> corrected, latest Check only',()=>{
  const {context,task,model}=fixture(s,true);
  assert.equal(original.valid(task,model),true);
  assert.equal(original.inspect(task,model).correct,false);
  assert.equal(replay(task,model,context),null);
  const wrong=structuredClone(model);
  for(const index of s.classes.slice(1))original.act(task,model,'g23-class',{index});
  assert.equal(original.inspect(task,model).correct,true);
  const record={attempts:[{value:wrong},{value:structuredClone(model)}]};
  assert.ok(submitted(task,model,record,context));
  assert.equal(submitted(task,model,{attempts:[{value:wrong}]},context),null);
  assert.equal(submitted(task,wrong,record,context),null);
  assert.equal(submitted(task,model,{attempts:[]},context),null);
 });
 test('P004i '+title+' rejects forged and missing UI actions',()=>{
  const {context,task,model}=fixture(s);
  const bad=[
   m=>{m.history=[];},m=>{m.history[0].a='class';},
   m=>{m.history[0].d.index='3';},m=>{m.history[0].d.index='00';},
   m=>{m.history[1].f.fake='button';},m=>{m.history[2].a='mark';},
   m=>{m.history[3].d.extra='1';},m=>{m.history[3].d.index='5';},
   m=>{m.board.tested.pop();},m=>{m.board.selected.pop();},
   m=>{m.answers[0]='right';},
   m=>{m.issue='fake';},m=>{m.extra='forgery';},
   m=>{m.history[3].extra=1;}
  ];
  for(const edit of bad)
   assert.equal(replay(task,edited(model,edit),context),null,edit.toString());
 });
 test('P004i '+title+' excludes other sources/positions/tasks',()=>{
  const {context,task,model}=fixture(s);
  const next={sessionId:s.id,index:s.index===0?1:0};
  for(const c of [next,{sessionId:s.id,index:'0'},{sessionId:'regularity',index:1},null])
   assert.equal(replay(task,model,c),null);
  for(const t of [
   {...task,prompt:task.prompt+' '},
   {...task,rotation:task.rotation+30},
   {...task,shape:task.shape==='square'?'rectangle':'square'},
   {...task,questions:[{...task.questions[0],value:'fake'}]}
  ])assert.equal(replay(t,model,context),null);
  const forged=original.initial(task,1);
  forged.board.selected=[...s.classes];
  forged.board.tested=[0,1,2];
  forged.answers[0]=s.answer;
  assert.equal(replay(task,forged,context),null,'no source actions');
 });
}
test('P004i reset preserves history but needs renewed three tests/class picks',()=>{
 const s=specs[0],{context,task,model}=fixture(s);
 original.act(task,model,'g23-reset');
 assert.equal(replay(task,model,context),null);
 for(let i=0;i<3;i++)original.act(task,model,'g23-test',{index:i});
 for(const index of s.classes)original.act(task,model,'g23-class',{index});
 const proof=replay(task,model,context);
 assert.ok(proof);
 assert.ok(proof.originalControlEvents.some(e=>e.action==='reset'));
});
