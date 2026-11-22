// #342 / P004e: exact native regularity:0..3, Node development verification.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {sessionTaskFor} from '../dist/learning/bridges.js';
import * as native from '../dist/learning/phase5/b23-model.js';
import {regularPolygonConditionsBinding as binding,
 replayRegularPolygonConditionsEvidence as replay,
 submittedRegularPolygonConditionsEvidence as submitted}
 from '../dist/learning/p004e-regular-polygon-conditions-evidence.js';

const specs=[
 {index:0,shape:'pentagon',classes:[5],answers:['5','equal'],
  sides:true,angles:true,right:false,regular:true},
 {index:1,shape:'square',classes:[0,1,2,3,4,5],answers:['yes'],
  sides:true,angles:true,right:true,regular:true},
 {index:2,shape:'rectangle',classes:[0,1,2],answers:['irregular'],
  sides:false,angles:true,right:true,regular:false},
 {index:3,shape:'rhombus',classes:[0,1,3],answers:['irregular'],
  sides:true,angles:false,right:false,regular:false}
];
const context=s=>({sessionId:'regularity',index:s.index});
const stable=v=>Array.isArray(v)?v.map(stable):v&&typeof v==='object'?
 Object.fromEntries(Object.keys(v).sort((a,b)=>a.localeCompare(b,'en')).map(k=>[k,stable(v[k])])):v;
const hash=v=>createHash('sha256').update(JSON.stringify(stable(v))).digest('hex');
function fixture(s,chosen=s.classes){
 const task=sessionTaskFor('regularity',s.index);
 const model=native.initial(task,314159);
 for(const i of [0,1,2])native.act(task,model,'g23-test',{index:i});
 for(const i of chosen)native.act(task,model,'g23-class',{index:i});
 model.answers=s.answers.slice();
 return {task,model,ctx:context(s)};
}
const edit=(model,fn)=>{const m=structuredClone(model);fn(m);return m;};

for(const s of specs){
 const position='regularity:'+s.index;
 test('P004e '+position+' native task/source, SHA and side-angle geometry',()=>{
  const {task,model,ctx}=fixture(s);
  const sha=hash(task);
  console.log('P004E_NATIVE_FULL_TASK_SHA256 '+position+' '+sha);
  assert.match(sha,/^[a-f0-9]{64}$/);
  assert.equal(task.type,'x-s23-quad');
  assert.equal(task.shape,s.shape);
  assert.equal(binding(task,ctx)?.nodeId,'mt_8H2kO4k2B9');
  assert.equal(native.valid(task,model),true);
  assert.equal(native.inspect(task,model).correct,true);
  const proof=replay(task,model,ctx);
  assert.ok(proof);
  assert.deepEqual(proof.independentlyCalculatedClasses,s.classes);
  assert.deepEqual(proof.classesActuallySelected,s.classes);
  assert.deepEqual(proof.propertyButtonsActuallyTested,[0,1,2]);
  const m=proof.independentlyMeasured;
  assert.equal(m.sideLengths.length,s.index===0?5:4);
  assert.equal(m.interiorAnglesDegrees.length,m.sideLengths.length);
  assert.equal(m.allSidesEqual,s.sides);
  assert.equal(m.allAnglesEqual,s.angles);
  assert.equal(m.allAnglesRight,s.right);
  assert.equal(m.regularPolygon,s.regular);
  if(s.index===0)for(const a of m.interiorAnglesDegrees)
   assert.ok(Math.abs(a-108)<1e-7);
  assert.equal(proof.generalMasteryAssessed,false);
  assert.equal(proof.physicalMeasurementObserved,false);
 });
 test('P004e '+position+' wrong to corrected Check, newest attempt only',()=>{
  const {task,model,ctx}=fixture(s,[0]);
  assert.equal(native.inspect(task,model).correct,false);
  assert.equal(replay(task,model,ctx),null);
  const wrong=structuredClone(model);
  if(!s.classes.includes(0))native.act(task,model,'g23-class',{index:0});
  for(const i of s.classes.filter(i=>i!==0))
   native.act(task,model,'g23-class',{index:i});
  assert.equal(native.inspect(task,model).correct,true);
  const record={attempts:[{value:wrong},{value:structuredClone(model)}]};
  assert.ok(submitted(task,model,record,ctx));
  assert.equal(submitted(task,model,{attempts:[{value:wrong}]},ctx),null);
  assert.equal(submitted(task,wrong,record,ctx),null);
  assert.equal(submitted(task,model,{attempts:[]},ctx),null);
 });
 test('P004e '+position+' rejects forged event/history, final board and answers',()=>{
  const {task,model,ctx}=fixture(s);
  const bad=[
   m=>{m.history=[];},m=>{m.history[0].a='class';},
   m=>{m.history[0].d.index='3';},m=>{m.history[0].d.index='00';},
   m=>{m.history[1].f.fake='control';},
   m=>{m.history[2].a='mark';},
   m=>{m.history[3].d.index='6';},
   m=>{m.history[3].d.extra='forged';},
   m=>{m.history[3].f.fake='forged';},
   m=>{m.board.tested.pop();},
   m=>{m.board.selected.pop();},
   m=>{m.answers[0]='incorrect';},
   m=>{m.issue='forged';},
   m=>{m.extra='forged';},
   m=>{m.history[0].extra=1;}
  ];
  for(const fn of bad)
   assert.equal(replay(task,edit(model,fn),ctx),null,fn.toString());
 });
 test('P004e '+position+' rejects different source/task/position',()=>{
  const {task,model,ctx}=fixture(s);
  for(const c of [{sessionId:'regularity',index:(s.index+1)%4},
   {sessionId:'regularity',index:String(s.index)},
   {sessionId:'quadsort',index:s.index},null])
   assert.equal(replay(task,model,c),null);
  for(const t of [
   {...task,prompt:task.prompt+' '},
   {...task,rotation:task.rotation+30},
   {...task,shape:'irregular'},
   {...task,questions:[{...task.questions[0],value:'fake'},...task.questions.slice(1)]}
  ])assert.equal(replay(t,model,ctx),null);
  const forged=native.initial(task,1);
  forged.board.tested=[0,1,2];
  forged.board.selected=s.classes.slice();
  forged.answers=s.answers.slice();
  assert.equal(replay(task,forged,ctx),null);
 });
}
test('P004e history reset requires new independent property checks and class clicks',()=>{
 const s=specs[1],{task,model,ctx}=fixture(s);
 native.act(task,model,'g23-reset');
 assert.equal(replay(task,model,ctx),null);
 for(const i of [0,1,2])native.act(task,model,'g23-test',{index:i});
 for(const i of s.classes)native.act(task,model,'g23-class',{index:i});
 const proof=replay(task,model,ctx);
 assert.ok(proof);
 assert.ok(proof.originalControlEvents.some(e=>e.action==='reset'));
});
test('P004e refuses a mathematically correct result with a non-UI class-first history',()=>{
 const s=specs[0],task=sessionTaskFor('regularity',s.index);
 const model=native.initial(task,1234);
 native.act(task,model,'g23-class',{index:5});
 for(const i of [0,1,2])native.act(task,model,'g23-test',{index:i});
 model.answers=s.answers.slice();
 assert.equal(native.valid(task,model),true);
 assert.equal(native.inspect(task,model).correct,true);
 assert.equal(replay(task,model,context(s)),null);
});
