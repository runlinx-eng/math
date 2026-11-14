import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {LESSONS} from '../dist/learning/catalog.js';
import {BRIDGES,sessionMeta,sessionTasks} from '../dist/learning/bridges.js';
import {ensureB39Ready} from '../dist/learning/phase4/async-batches.js';
import * as walks from '../dist/learning/phase5/b16-model.js';
import {unitwalkBinding,replayUnitwalkEvidence} from '../dist/learning/unitwalk-evidence.js';
import {groupwalkBinding,replayGroupwalkEvidence} from '../dist/learning/groupwalk-evidence.js';
import {thinkingGuide,thinkingFeedback} from '../dist/learning/thinking-feedback.js';

await ensureB39Ready();
// An independent reviewed location/source list, never derived from the adapter.
const groups=[
 ['lineplaces',[0,1,2,3],'mt_Kr3IyA6m-O'],['unitcopies',[0,1,2],'mt_09sySPqM9Z'],
 ['wholefractions',[1,2,3,4],'mt_AYzE1EAvI0'],['translateamount',[3],'mt_3VmBdlAeOZ'],
 ['storyfraction',[2],'mt_dXq9VWm31W'],['tenpieces',[0],'mt_YzM5goBctT'],
 ['decimalnames',[1],'mt_Vi4Vo5xs_g'],['fractionmeasure',[3],'mt_wB-GBDkoNr'],
 ['mixedrename',[0,1],'mt_o_p-3tCxiM']
];
const cases=groups.flatMap(([sessionId,indices,nodeId])=>indices.map(index=>({sessionId,index,nodeId})));
const record=model=>({support:false,attempts:[{value:structuredClone(model)}]});
const action=(task,model,name)=>walks.act(task,model,'b16-'+name);
const fillAnswers=(task,model)=>{
 for(const step of walks.solveSteps(task))if(step.field&&step.field!=='parts'){
  model[step.field]=step.value;walks.field(task,model,step.field);
 }
 return model;
};
const start=(task,parts=String(task.d))=>{
 const model=walks.initial(task);model.parts=parts;action(task,model,'partition');return model;
};
const example=(task,parts)=>{
 const model=start(task,parts);
 for(let i=0;i<task.n;i++)action(task,model,'walk');
 return fillAnswers(task,model);
};
const originalAccepts=(task,model,message)=>{
 assert.equal(walks.valid(task,model),true,message);
 assert.equal(walks.inspect(task,model).correct,true,message);
};
const accepts=(task,model)=>{
 originalAccepts(task,model);const proof=replayUnitwalkEvidence(task,model);assert.ok(proof);return proof;
};
const rejects=(task,model,message)=>assert.equal(replayUnitwalkEvidence(task,model),null,message);

test('eighteen native unit walks bind nine original sources and only two actual MP.2 sources',()=>{
 const source=JSON.parse(readFileSync(new URL('../docs/spatial-learning/thinking-source-map.json',import.meta.url)));
 const mp2=source.groups.find(group=>group.code==='ccss-math:MP.2');
 assert.equal(cases.length,18);assert.equal(new Set(cases.map(c=>c.nodeId)).size,9);
 for(const c of cases){
  const task=sessionTasks(c.sessionId)[c.index],binding=unitwalkBinding(task,c);
  assert.equal(binding?.nodeId,c.nodeId);
  assert.equal(sessionMeta(c.sessionId).topicId,c.nodeId);
  const mapped=mp2.nodes.some(node=>node.id===c.nodeId);
  assert.equal(mapped,['translateamount','storyfraction'].includes(c.sessionId));
  if(mapped){assert.equal(binding.method?.nodeId,c.nodeId);assert.equal(binding.method?.code,'ccss-math:MP.2');}
  else assert.equal(binding.method,null);
  assert.ok(thinkingGuide(task,c)?.question.length>10);
  for(const context of [null,[],false,'lineplaces',{}, {...c,index:String(c.index)},{...c,index:-1},{...c,sessionId:'__proto__'}])
   assert.equal(unitwalkBinding(task,context),null);
  for(const changed of [{...task,prompt:task.prompt+' changed'},{...task,n:task.n+1},{...task,d:task.d+1},{...task,chunk:1}])
   assert.equal(unitwalkBinding(changed,c),null,'complete native task identity matters');
 }
 const found=[];
 for(const sessionId of Object.keys(LESSONS))sessionTasks(sessionId).forEach((task,index)=>{
  if(unitwalkBinding(task,{sessionId,index}))found.push(sessionId+':'+index);
 });
 assert.deepEqual(found.sort(),cases.map(c=>c.sessionId+':'+c.index).sort());
 for(const sessionId of Object.keys(BRIDGES))sessionTasks(sessionId).forEach((task,index)=>{
  assert.equal(unitwalkBinding(task,{sessionId,index}),null,sessionId+':'+index);
 });
});

for(const c of cases)test(`${c.sessionId}:${c.index} replays exact unit positions and requires the current checked submission`,()=>{
 const task=sessionTasks(c.sessionId)[c.index],model=example(task),before=JSON.stringify(model),proof=accepts(task,model);
 assert.deepEqual(proof.start,[0,task.d]);assert.deepEqual(proof.end,[task.n,task.d]);
 assert.deepEqual(proof.unit,[1,task.d]);
 assert.equal(proof.advances,task.n);assert.equal(proof.retreats,0);
 assert.deepEqual(proof.steps,Array.from({length:task.n},(_,i)=>({direction:1,from:[i,task.d],to:[i+1,task.d]})));
 assert.equal(proof.whole,Math.floor(task.n/task.d));
 assert.deepEqual(proof.remainder,[task.n%task.d,task.d]);
 assert.equal(proof.decimal,task.decimal?model.decimal:null);
 assert.deepEqual(proof.bounds,task.bounds?[Math.floor(task.n/task.d),Math.ceil(task.n/task.d)]:null);
 const saved=record(model),feedback=thinkingFeedback(task,model,saved,c);
 assert.ok(feedback);assert.deepEqual(feedback.method,unitwalkBinding(task,c).method);
 assert.match(feedback.observation,new RegExp('1/'+task.d));
 assert.match(feedback.detail.join(' '),/解释|证明|掌握/);
 assert.equal(thinkingFeedback(task,model,null,c),null);
 assert.equal(thinkingFeedback(task,model,{attempts:[]},c),null);
 assert.equal(thinkingFeedback(task,model,saved,{}),null);
 const edited=structuredClone(model);edited.answer='999';
 assert.equal(thinkingFeedback(task,edited,saved,c),null);
 assert.equal(thinkingFeedback(task,edited,record(edited),c),null);
 assert.equal(thinkingFeedback(task,model,{attempts:[{value:model},{value:edited}]},c),null);
 const missing=structuredClone(model);missing.history=[];
 rejects(task,missing);assert.equal(thinkingFeedback(task,missing,record(missing),c),null);
 const resumed=JSON.parse(JSON.stringify({model,saved}));
 assert.ok(thinkingFeedback(task,resumed.model,resumed.saved,c));
 assert.equal(JSON.stringify(model),before,'replay and feedback never mutate the workpiece');
});

test('identical forward events are separate effective steps, not duplicate records to discard',()=>{
 const task=sessionTasks('unitcopies')[0],model=example(task);
 assert.deepEqual(model.history[1],model.history[2]);
 const proof=accepts(task,model);
 assert.equal(proof.steps.length,5);assert.deepEqual(proof.steps.at(-1).to,[5,8]);
});

test('all reviewed denominators support overshooting, retreating and returning to zero before continuing',()=>{
 for(const c of cases){
  const task=sessionTasks(c.sessionId)[c.index],model=start(task);
  action(task,model,'walk');action(task,model,'walk-back');
  for(let i=0;i<task.n+1;i++)action(task,model,'walk');
  action(task,model,'walk-back');fillAnswers(task,model);
  const proof=accepts(task,model);
  assert.equal(proof.advances,task.n+2);assert.equal(proof.retreats,2);
  assert.deepEqual(proof.steps[1],{direction:-1,from:[1,task.d],to:[0,task.d]});
  assert.deepEqual(proof.steps.at(-1),{direction:-1,from:[task.n+1,task.d],to:[task.n,task.d]});
 }
});

test('actual movement after a checked answer stays unsubmitted even when the endpoint returns',()=>{
 const context={sessionId:'lineplaces',index:2},task=sessionTasks(context.sessionId)[context.index],model=example(task),saved=record(model);
 action(task,model,'walk-back');action(task,model,'walk');
 originalAccepts(task,model);assert.ok(replayUnitwalkEvidence(task,model));
 assert.equal(thinkingFeedback(task,model,saved,context),null,'a changed movement history requires a new check');
 assert.ok(thinkingFeedback(task,model,record(model),context));
});

test('equivalent original numeric partition inputs keep their actual first-walk string',()=>{
 const task=sessionTasks('lineplaces')[2];
 for(const parts of ['+4','4.0',' 4 ']){
  const model=example(task,parts);accepts(task,model);assert.equal(model.board.first,parts);
  const changed=structuredClone(model);changed.board.first='4';
  rejects(task,changed,'first must match the actual first walk, not a normalized substitute');
 }
});

test('the true upper boundary is allowed and an ineffective forward request is retained without a step',()=>{
 const task=sessionTasks('lineplaces')[0],limit=(Math.ceil(task.n/task.d)+1)*task.d;
 for(const extra of [false,true]){
  const model=start(task);
  for(let i=0;i<limit;i++)action(task,model,'walk');
  if(extra)action(task,model,'walk');
  for(let i=limit;i>task.n;i--)action(task,model,'walk-back');
  fillAnswers(task,model);originalAccepts(task,model);
  const proof=accepts(task,model);assert.deepEqual(proof.steps[limit-1].to,[limit,task.d]);
  assert.equal(proof.advances,limit);assert.equal(proof.history.ineffectiveRequests.length,extra?1:0);
  if(extra)assert.equal(proof.history.ineffectiveRequests[0].reason,'forward-limit');
 }
});

test('visible zero retreats, partitions and resets remain recorded, while foreign actions are rejected',()=>{
 const task=sessionTasks('lineplaces')[2];
 for(const variant of ['initial-retreat','zero-retreat','duplicate-partition','repartition-after-walk','reset','foreign-action']){
  const model=walks.initial(task);model.parts=String(task.d);
  if(variant==='initial-retreat')action(task,model,'walk-back');
  action(task,model,'partition');
  if(variant==='zero-retreat')action(task,model,'walk-back');
  if(variant==='duplicate-partition')action(task,model,'partition');
  if(variant==='repartition-after-walk'){action(task,model,'walk');action(task,model,'partition');}
  if(variant==='reset'){action(task,model,'reset');action(task,model,'partition');}
  if(variant==='foreign-action')action(task,model,'fold');
  for(let i=0;i<task.n;i++)action(task,model,'walk');
  fillAnswers(task,model);originalAccepts(task,model,variant);
  if(variant==='foreign-action')rejects(task,model,variant);
  else{
   const proof=accepts(task,model);assert.equal(proof.history.events.length,model.history.length);
   assert.equal(proof.advances,task.n);assert.equal(proof.retreats,0);
   assert.equal(proof.history.resetCount,variant==='reset'?1:0);
   assert.equal(proof.history.ineffectiveRequests.length,['initial-retreat','zero-retreat'].includes(variant)?1:0);
  }
 }
});

test('earlier units and failed partitions are retained separately from the final construction',()=>{
 const task=sessionTasks('lineplaces')[2];
 for(const variant of ['unpartitioned','wrong-partition','invalid-partition','changed-input']){
  const model=walks.initial(task);
  if(variant==='unpartitioned'){model.parts=String(task.d);action(task,model,'walk');}
  if(variant==='wrong-partition'){model.parts='2';action(task,model,'partition');action(task,model,'walk');}
  if(variant==='invalid-partition'){model.parts='13';action(task,model,'partition');}
  if(variant==='changed-input'){
   model.parts=String(task.d);action(task,model,'partition');model.parts='2';action(task,model,'walk');
  }
  model.parts=String(task.d);action(task,model,'partition');
  for(let i=0;i<task.n;i++)action(task,model,'walk');
  fillAnswers(task,model);originalAccepts(task,model,variant);const proof=accepts(task,model);
  assert.equal(proof.advances,task.n);assert.equal(proof.history.events.length,model.history.length);
  if(variant==='invalid-partition')assert.equal(proof.history.failedRequests.length,1);
  else{
   const first=proof.history.events.find(e=>e.action==='walk');
   assert.equal(first.before.parts,variant==='unpartitioned'?1:variant==='wrong-partition'?2:task.d);
   assert.deepEqual(first.after.steps,[1]);
  }
 }
});

test('unapplied input text cannot change the applied unit, and current submitted units still agree',()=>{
 const task=sessionTasks('lineplaces')[2],base=example(task);
 for(const wrong of ['2','1/4','4e0','0x4','NaN','Infinity','0','-4','4.5','']){
  const model=structuredClone(base);model.history[2].data.fields.parts=wrong;
  originalAccepts(task,model,wrong+' ignored by original walk action');const proof=accepts(task,model);
  assert.equal(proof.history.events[2].fields.parts,wrong);
  assert.equal(proof.history.events[2].before.parts,task.d);
  assert.deepEqual(proof.steps[1],{direction:1,from:[1,task.d],to:[2,task.d]});
 }
 const current=structuredClone(base);current.parts='2';rejects(task,current);
});

test('native additional answers remain necessary and exact after movement replay',()=>{
 const changes=[
  ['unitcopies',0,'copies','4'],['unitcopies',0,'equation','1/8+1/8+1/8+1/8'],
  ['unitcopies',0,'equation','1/8+1/8+1/8+1/8+2/8'],
  ['wholefractions',1,'whole','0'],['wholefractions',1,'remainder','1/4'],
  ['mixedrename',1,'whole','2'],['mixedrename',1,'remainder','3/5'],
  ['translateamount',3,'decimal','0.30000001'],['decimalnames',1,'decimal','0.31'],
  ['lineplaces',3,'left','1'],['lineplaces',3,'right','2'],['lineplaces',3,'relation','>']
 ];
 for(const [sessionId,index,field,value] of changes){
  const task=sessionTasks(sessionId)[index],model=example(task);model[field]=value;
  rejects(task,model,sessionId+':'+field);
  assert.equal(thinkingFeedback(task,model,record(model),{sessionId,index}),null);
 }
 const task=sessionTasks('decimalnames')[1],model=example(task);model.decimal='0.3000';accepts(task,model);
});

test('missing, inserted, malformed and unrelated events cannot masquerade as the current construction',()=>{
 for(const c of cases){
  const task=sessionTasks(c.sessionId)[c.index],base=example(task);
  const mutations=[
   ['missing partition',m=>m.history.shift()],['missing step',m=>m.history.pop()],
   ['duplicate inserted step',m=>m.history.splice(1,0,structuredClone(m.history[1]))],
   ['reordered partition',m=>m.history.reverse()],['unknown action',m=>m.history[1].action='teleport'],
   ['event extra key',m=>m.history[1].extra=true],['event missing data',m=>delete m.history[1].data],
   ['unrelated index',m=>m.history[1].data.index='0'],['unrelated value',m=>m.history[1].data.value='2'],
   ['unrelated row',m=>m.history[1].data.row='left'],['extra field',m=>m.history[1].data.fields.extra='forged'],
   ['missing field',m=>delete m.history[1].data.fields.answer],['wrong field type',m=>m.history[1].data.fields.parts=task.d],
   ['oversized field',m=>m.history[1].data.fields.answer='1'.repeat(2001)],
   ['wrong step position',m=>m.board.steps[0]=2],['wrong denominator',m=>m.board.parts++],
   ['wrong first snapshot',m=>m.board.first='999'],['extra board field',m=>m.board.extra=true],
   ['active issue',m=>m.issue='invalid'],['extra model field',m=>m.extra='forged']
  ];
  for(const [label,mutate] of mutations){
   const model=structuredClone(base);mutate(model);rejects(task,model,c.sessionId+':'+c.index+' '+label);
  }
  rejects(task,{...base,history:Array(2001).fill(base.history[1])});
  for(const malformed of [null,{},[],{...base,history:null},{...base,board:null}])rejects(task,malformed);
 }
});

test('fixed unit replay excludes grouped jumps, unit-one tasks and unsupported numeric bounds',()=>{
 const task=sessionTasks('lineplaces')[2],model=example(task);
 for(const changed of [{...task,chunk:1},{...task,chunk:2},{...task,chunk:0},{...task,chunk:null},
  {...task,d:1},{...task,d:13},{...task,d:0},{...task,d:2.5},
  {...task,n:0},{...task,n:-1},{...task,n:1.5},{...task,n:2001},{...task,n:Number.MAX_SAFE_INTEGER}])
  rejects(changed,model);
});

test('all seven original excluded tasks still pass their own grader without inheriting the fixed-unit contract',()=>{
 const excluded=[['wholefractions',0],['manycopies',0],['manycopies',1],['manycopies',2],
  ['repeatfraction',0],['repeatfraction',1],['repeatfraction',2]];
 for(const [sessionId,index] of excluded){
  const task=sessionTasks(sessionId)[index],model=walks.initial(task),context={sessionId,index};
  for(const step of walks.solveSteps(task)){
   if(step.field){model[step.field]=step.value;walks.field(task,model,step.field);}
   else walks.act(task,model,step.action,step.data);
  }
  originalAccepts(task,model,sessionId+':'+index);
  rejects(task,model,'different jump semantics require separate review');
  assert.equal(unitwalkBinding(task,context),null);
  if(task.chunk!==undefined){
   assert.ok(groupwalkBinding(task,context),'six reviewed grouped tasks now use their own explicit source contract');
   assert.ok(replayGroupwalkEvidence(task,model));
   assert.match(thinkingGuide(task,context).summary,/一次接几小份/);
   assert.ok(thinkingFeedback(task,model,record(model),context));
  }else{
   assert.equal(groupwalkBinding(task,context),null);
   assert.equal(thinkingGuide(task,context),null);
   assert.equal(thinkingFeedback(task,model,record(model),context),null);
  }
 }
});


test('Issue 166 original visible controls preserve failed requests, resets and latest failed issues',async()=>{
 const {verifyVisibleCorrections}=await import('./helpers/p9-fraction-correction-controls.mjs');
 const result=await verifyVisibleCorrections('unitwalk',replayUnitwalkEvidence,thinkingFeedback);
 assert.equal(result.paths,result.nativeTasks*3);
 assert.ok(result.failedRequests>=result.nativeTasks);
 assert.equal(result.forgeriesRejected,result.paths*3);
});
