import test from 'node:test';
import assert from 'node:assert/strict';
import {LESSONS} from '../dist/learning/catalog.js';
import {BRIDGES,sessionMeta,sessionTasks} from '../dist/learning/bridges.js';
import {ensureB39Ready} from '../dist/learning/phase4/async-batches.js';
import * as walks from '../dist/learning/phase5/b16-model.js';
import {groupwalkBinding,replayGroupwalkEvidence} from '../dist/learning/groupwalk-evidence.js';
import {unitwalkBinding,replayUnitwalkEvidence} from '../dist/learning/unitwalk-evidence.js';
import {EVIDENCE_ADAPTERS} from '../dist/learning/evidence-adapters.js';
import {thinkingGuide,thinkingFeedback} from '../dist/learning/thinking-feedback.js';

await ensureB39Ready();
// Fixed identities and mathematics independently reviewed from B16/B18 sources.
const cases=[
 ['manycopies',0,'mt_HJA2Oz-Zh1',15,8,3],['manycopies',1,'mt_HJA2Oz-Zh1',8,3,2],
 ['manycopies',2,'mt_HJA2Oz-Zh1',18,4,3],['repeatfraction',0,'mt_TgHxujL81r',12,8,3],
 ['repeatfraction',1,'mt_TgHxujL81r',21,3,7],['repeatfraction',2,'mt_TgHxujL81r',5,4,1]
].map(([sessionId,index,nodeId,n,d,chunk])=>({sessionId,index,nodeId,n,d,chunk}));
const record=value=>({support:false,attempts:[{value:structuredClone(value)}]});
const act=(task,model,action)=>walks.act(task,model,'b16-'+action);
const start=(task,parts=String(task.d))=>{
 const model=walks.initial(task);model.parts=parts;act(task,model,'partition');return model;
};
const answers=(task,model)=>{
 for(const step of walks.solveSteps(task))if(step.field&&step.field!=='parts')model[step.field]=step.value;
 return model;
};
const example=(task,parts)=>{
 const model=start(task,parts);for(let i=0;i<task.n/task.chunk;i++)act(task,model,'walk');return answers(task,model);
};
const originalAccepts=(task,model,message)=>{
 assert.equal(walks.valid(task,model),true,message);assert.equal(walks.inspect(task,model).correct,true,message);
};
const accepts=(task,model)=>{originalAccepts(task,model);const proof=replayGroupwalkEvidence(task,model);assert.ok(proof);return proof;};
const rejects=(task,model,label)=>assert.equal(replayGroupwalkEvidence(task,model),null,label);

test('six grouped native tasks bind two exact non-MP sources and remain disjoint from fixed-unit binding',()=>{
 const found=[];
 for(const c of cases){
  const task=sessionTasks(c.sessionId)[c.index],binding=groupwalkBinding(task,c);
  assert.equal(binding?.nodeId,c.nodeId);assert.equal(binding.method,null);
  assert.equal(sessionMeta(c.sessionId).topicId,c.nodeId);
  assert.deepEqual([task.n,task.d,task.chunk],[c.n,c.d,c.chunk]);
  assert.ok(thinkingGuide(task,c)?.question.includes('一次前进'));
  assert.equal(unitwalkBinding(task,c),null);assert.equal(replayUnitwalkEvidence(task,example(task)),null);
  for(const changed of [null,[],false,'manycopies',{}, {...c,index:String(c.index)},
   {...c,index:-1},{...c,sessionId:'__proto__'}])assert.equal(groupwalkBinding(task,changed),null);
  for(const changed of [{...task,prompt:task.prompt+' changed'},{...task,n:task.n+1},
   {...task,d:task.d+1},{...task,chunk:task.chunk+1},{...task,whole:false}])
   assert.equal(groupwalkBinding(changed,c),null);
 }
 const families=EVIDENCE_ADAPTERS.filter(adapter=>['unitwalk','groupwalk'].includes(adapter.id));
 assert.equal(families.length,2);assert.equal(new Set(families.map(adapter=>adapter.type)).size,1);
 for(const sessionId of Object.keys(LESSONS))sessionTasks(sessionId).forEach((task,index)=>{
  const context={sessionId,index};
  if(groupwalkBinding(task,context))found.push(sessionId+':'+index);
  assert.ok(families.filter(adapter=>adapter.binding(task,context)).length<=1,'shared widget bindings must not overlap');
 });
 assert.deepEqual(found.sort(),cases.map(c=>c.sessionId+':'+c.index).sort());
 for(const sessionId of Object.keys(BRIDGES))sessionTasks(sessionId).forEach((task,index)=>{
  assert.equal(groupwalkBinding(task,{sessionId,index}),null,sessionId+':'+index);
 });
});

for(const c of cases)test(`${c.sessionId}:${c.index} replays grouped advances and keeps equation, source and latest submission aligned`,()=>{
 const task=sessionTasks(c.sessionId)[c.index],model=example(task),before=JSON.stringify(model),proof=accepts(task,model);
 assert.deepEqual(proof.start,[0,c.d]);assert.deepEqual(proof.end,[c.n,c.d]);
 assert.deepEqual(proof.unit,[1,c.d]);assert.deepEqual(proof.group,[c.chunk,c.d]);
 assert.equal(proof.groups,c.n/c.chunk);assert.equal(proof.advances,proof.groups);assert.equal(proof.retreats,0);
 assert.deepEqual(proof.steps,Array.from({length:proof.groups},(_,i)=>({delta:c.chunk,from:[i*c.chunk,c.d],to:[(i+1)*c.chunk,c.d]})));
 assert.equal(proof.whole,Math.floor(c.n/c.d));assert.deepEqual(proof.remainder,[c.n%c.d,c.d]);
 assert.deepEqual(proof.bounds,task.bounds?[Math.floor(c.n/c.d),Math.ceil(c.n/c.d)]:null);
 assert.equal(proof.purchase,task.buy?Math.ceil(c.n/c.d):null);
 const saved=record(model),feedback=thinkingFeedback(task,model,saved,c);
 assert.ok(feedback);assert.equal(feedback.method,null);
 assert.match(feedback.observation,new RegExp(`整组前进 ${proof.groups} 次`));
 assert.match(feedback.observation,new RegExp(`每次接上 ${c.chunk} 小份`));
 assert.match(feedback.detail.join(' '),new RegExp(`共 ${proof.groups} 组`));
 assert.equal(thinkingFeedback(task,model,null,c),null);assert.equal(thinkingFeedback(task,model,saved,{}),null);
 const edited=structuredClone(model);edited.equation='1=1';
 assert.equal(thinkingFeedback(task,edited,saved,c),null);assert.equal(thinkingFeedback(task,edited,record(edited),c),null);
 assert.equal(thinkingFeedback(task,model,{attempts:[{value:model},{value:edited}]},c),null);
 const missing=structuredClone(model);missing.history=[];rejects(task,missing);
 assert.equal(thinkingFeedback(task,missing,record(missing),c),null);
 const restored=JSON.parse(JSON.stringify({model,saved}));
 assert.ok(thinkingFeedback(task,restored.model,restored.saved,c));assert.equal(JSON.stringify(model),before);
});

test('group advances and single-unit retreats allow real detours without confusing operations with task group count',()=>{
 for(const c of cases){
  const task=sessionTasks(c.sessionId)[c.index],model=start(task);
  act(task,model,'walk');for(let i=0;i<c.chunk;i++)act(task,model,'walk-back');
  assert.deepEqual(model.board.steps,[],'one full advance needs chunk separate backward actions to undo');
  for(let i=0;i<c.n/c.chunk+1;i++)act(task,model,'walk');
  for(let i=0;i<c.chunk;i++)act(task,model,'walk-back');answers(task,model);
  const proof=accepts(task,model);
  assert.equal(proof.groups,c.n/c.chunk);assert.equal(proof.advances,proof.groups+2);assert.equal(proof.retreats,2*c.chunk);
  assert.equal(proof.advances*c.chunk-proof.retreats,c.n);
  assert.deepEqual(proof.steps[1],{delta:-1,from:[c.chunk,c.d],to:[c.chunk-1,c.d]});
  const words=thinkingFeedback(task,model,record(model),c);
  assert.match(words.observation,new RegExp(`整组前进 ${proof.groups+2} 次`));
  assert.match(words.detail.join(' '),new RegExp(`共 ${proof.groups} 组`));
 }
});

test('repeatfraction 7/3 advances may cross the original pre-move limit, but a subsequent no-op is rejected',()=>{
 const task=sessionTasks('repeatfraction')[1];assert.deepEqual([task.n,task.d,task.chunk],[21,3,7]);
 for(const extra of [false,true]){
  const model=start(task);for(let i=0;i<4;i++)act(task,model,'walk');
  assert.equal(model.board.steps.length,28,'21 < 24 permits the original advance to 28');
  if(extra){act(task,model,'walk');assert.equal(model.board.steps.length,28);}
  for(let i=0;i<7;i++)act(task,model,'walk-back');answers(task,model);originalAccepts(task,model);
  if(extra)rejects(task,model,'an out-of-limit ineffective walk cannot be hidden by later retreats');
  else{
   const proof=accepts(task,model);assert.deepEqual(proof.steps[3],{delta:7,from:[21,3],to:[28,3]});
   assert.equal(proof.advances,4);assert.equal(proof.groups,3);assert.equal(proof.retreats,7);
  }
 }
});

test('every reviewed upper boundary obeys the original before-move guard',()=>{
 for(const c of cases){
  const task=sessionTasks(c.sessionId)[c.index],limit=(Math.ceil(c.n/c.d)+1)*c.d;
  for(const extra of [false,true]){
   const model=start(task);while(model.board.steps.length<limit)act(task,model,'walk');
   const reached=model.board.steps.length;assert.ok(reached>=limit&&reached<limit+c.chunk);
   if(extra)act(task,model,'walk');
   while(model.board.steps.length>c.n)act(task,model,'walk-back');answers(task,model);originalAccepts(task,model);
   if(extra)rejects(task,model);else accepts(task,model);
  }
 }
});

test('commuted factors, reversed equality and original Unicode operator notation retain group meaning',()=>{
 for(const c of cases){
  const task=sessionTasks(c.sessionId)[c.index],model=example(task),groups=c.n/c.chunk;
  for(const equation of [`(${c.chunk}/${c.d})*${groups}=${c.n}/${c.d}`,
   `${groups}*(${c.chunk}/${c.d})=${c.n}/${c.d}`,`${c.n}/${c.d}=(${c.chunk}/${c.d})*${groups}`,
   `${c.n}/${c.d}=${groups}*(${c.chunk}/${c.d})`,
   `（${c.chunk}.0 ÷ ${c.d}.0）×${groups}.0=${c.n}.0/${c.d}.0`]){
   model.equation=equation;accepts(task,model);
  }
  for(const equation of ['1=1',`${c.n}/${c.d}=${c.n}/${c.d}`,
   `(${c.chunk}/${c.d})*${groups+1}=${c.n}/${c.d}`,
   `(${c.chunk+1}/${c.d})*${groups}=${c.n}/${c.d}`,
   `(${c.chunk}/${c.d})+${groups}=${c.n}/${c.d}`,
   `(${c.chunk}/${c.d})*${groups}=${c.n+1}/${c.d}`,
   `(${c.chunk}/${c.d})*${groups}=${c.n}/${c.d}=1`,
   `(${c.chunk}/${c.d})*${groups}=NaN`,`${c.chunk}/0*${groups}=${c.n}/${c.d}`,
   'process.exit()','1'.repeat(2001)]){
   model.equation=equation;rejects(task,model,equation);
  }
 }
});

test('whole parts, fractional remainder, adjacent integers and minimum whole purchase are independent obligations',()=>{
 const changes=[['manycopies',0,'whole','2'],['manycopies',0,'remainder','1/8'],
  ['manycopies',0,'total','1'],['manycopies',0,'total','3'],['manycopies',0,'total','15/8'],
  ['manycopies',2,'left','3'],['manycopies',2,'right','6'],
  ['repeatfraction',1,'whole','6'],['repeatfraction',1,'remainder','1/3'],
  ['repeatfraction',2,'answer','4/5']];
 for(const [sessionId,index,key,value] of changes){
  const task=sessionTasks(sessionId)[index],model=example(task);model[key]=value;
  rejects(task,model,sessionId+':'+index+' '+key);assert.equal(thinkingFeedback(task,model,record(model),{sessionId,index}),null);
 }
 const task=sessionTasks('manycopies')[0],model=example(task);model.total='+2.0';accepts(task,model);
});

test('rounded parser leaves cannot turn inexact equation literals into exact grouped mathematics',()=>{
 const task=sessionTasks('manycopies')[0],model=example(task);
 for(const equation of ['(3.0000000000000001/8)*5=15/8',
  '(3/8.0000000000000001)*5=15/8','(3/8)*5.0000000000000001=15/8',
  '(3/8)*5=15.0000000000000001/8','(3/8)*5=15/8.0000000000000001',
  '(3. 0000000000000001/8)*5=15/8','(3 .0000000000000001/8)*5=15/8',
  '(3/8)*5.\n0000000000000001=15/8','(3/8)*5=15/8.\t0000000000000001']){
  model.equation=equation;
  originalAccepts(task,model,'the unchanged original parser rounds this literal');
  rejects(task,model,'strict equation evidence must check the original decimal token before Number conversion');
 }
 model.equation='(3.0000000000000000/8.0000000000000000)*5.0000000000000000=15.0000000000000000/8';
 accepts(task,model);
});

test('first group string is preserved, and later same-endpoint edits still require a new check',()=>{
 const context=cases[0],task=sessionTasks(context.sessionId)[context.index];
 for(const parts of ['+8','8.0',' 8 ']){
  const model=example(task,parts);accepts(task,model);assert.equal(model.board.first,parts);
  const changed=structuredClone(model);changed.board.first='8';rejects(task,changed);
 }
 const model=example(task),saved=record(model);
 act(task,model,'walk');for(let i=0;i<task.chunk;i++)act(task,model,'walk-back');accepts(task,model);
 assert.equal(thinkingFeedback(task,model,saved,context),null);
 assert.ok(thinkingFeedback(task,model,record(model),context));
});

test('zero retreat, repeated partition, wrong scale, reset and unrelated operations cannot be erased',()=>{
 const task=sessionTasks('manycopies')[0];
 for(const variant of ['zero-back','repeat-partition','reset','wrong-scale','foreign','unpartitioned','changed-input']){
  const model=walks.initial(task);model.parts=String(task.d);
  if(variant==='zero-back')act(task,model,'walk-back');
  if(variant==='repeat-partition')act(task,model,'partition');
  if(variant==='reset'){act(task,model,'partition');act(task,model,'walk');act(task,model,'reset');}
  if(variant==='wrong-scale'){model.parts='2';act(task,model,'partition');act(task,model,'walk');}
  if(variant==='foreign')act(task,model,'fold');
  if(variant==='unpartitioned')act(task,model,'walk');
  model.parts=String(task.d);act(task,model,'partition');
  for(let i=0;i<task.n/task.chunk;i++){
   if(variant==='changed-input'&&i===1)model.parts='2';
   act(task,model,'walk');model.parts=String(task.d);
  }
  answers(task,model);originalAccepts(task,model,variant);rejects(task,model,variant);
 }
});

test('every event, position, current field and history structure must correspond to the actual grouped work',()=>{
 for(const c of cases){
  const task=sessionTasks(c.sessionId)[c.index],base=example(task);
  const changes=[
   ['missing partition',m=>m.history.shift()],['missing group',m=>m.history.pop()],
   ['insert group',m=>m.history.splice(1,0,structuredClone(m.history[1]))],
   ['reverse history',m=>m.history.reverse()],['unknown action',m=>m.history[1].action='teleport'],
   ['event extra key',m=>m.history[1].extra=true],['missing data',m=>delete m.history[1].data],
   ['unrelated index',m=>m.history[1].data.index='0'],['unrelated row',m=>m.history[1].data.row='left'],
   ['unrelated value',m=>m.history[1].data.value='2'],['extra field',m=>m.history[1].data.fields.extra='forged'],
   ['missing field',m=>delete m.history[1].data.fields.answer],['wrong field type',m=>m.history[1].data.fields.parts=c.d],
   ['oversized field',m=>m.history[1].data.fields.answer='1'.repeat(2001)],
   ['wrong denominator snapshot',m=>m.history[1].data.fields.parts=String(c.d+1)],
   ['wrong current denominator',m=>m.parts=String(c.d+1)],['changed position',m=>m.board.steps[0]=2],
   ['false whole-group retreat',m=>m.board.steps.splice(-c.chunk)],
   ['changed first snapshot',m=>m.board.first='99'],['changed board scale',m=>m.board.parts++],
   ['extra board key',m=>m.board.extra=true],['extra model key',m=>m.extra=true],['active issue',m=>m.issue='invalid']
  ];
  for(const [label,change] of changes){const model=structuredClone(base);change(model);rejects(task,model,c.sessionId+':'+c.index+' '+label);}
  for(const malformed of [null,{},[],{...base,history:null},{...base,board:null},
   {...base,history:Array(2001).fill(base.history[1])}])rejects(task,malformed);
 }
});

test('unsupported task semantics and the denominator-one task do not inherit grouped evidence',()=>{
 const task=sessionTasks('manycopies')[0],model=example(task);
 for(const changed of [{...task,chunk:0},{...task,chunk:-1},{...task,chunk:1.5},{...task,chunk:2001},
  {...task,n:14},{...task,n:0},{...task,d:1},{...task,d:13},{...task,whole:false},
  {...task,copies:true},{...task,decimal:true},{...task,halfBound:true},{...task,buy:'true'},
  {...task,bounds:1},{...task,axisMax:0}])rejects(changed,model);
 const context={sessionId:'wholefractions',index:0},excluded=sessionTasks(context.sessionId)[context.index],work=walks.initial(excluded);
 for(const step of walks.solveSteps(excluded)){if(step.field)work[step.field]=step.value;else walks.act(excluded,work,step.action,step.data);}
 originalAccepts(excluded,work);assert.equal(groupwalkBinding(excluded,context),null);rejects(excluded,work);
 assert.equal(thinkingGuide(excluded,context),null);assert.equal(thinkingFeedback(excluded,work,record(work),context),null);
});
