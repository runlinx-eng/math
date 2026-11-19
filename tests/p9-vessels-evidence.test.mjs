// #256 source-bound vessel replay and negative contracts, integrated into the shared gate.
import test from 'node:test';
import assert from 'node:assert/strict';
import * as original from '../dist/learning/phase5/b28-model.js';
import {BRIDGES,sessionTaskFor,sessionTasks} from '../dist/learning/bridges.js';
import {vesselsBinding,replayVesselsEvidence} from '../dist/learning/vessels-evidence.js';
import {thinkingGuide,thinkingFeedback} from '../dist/learning/thinking-feedback.js';

const sources=['indirectmass','ordermeasure','precisionunits'];
const context=sessionId=>({sessionId,index:1});
const clone=structuredClone;

for(const sessionId of sources){
 test('#256 original native task example has independently replayed fills: '+sessionId,()=>{
  const task=sessionTaskFor(sessionId,1),m=original.example(task);
  assert.equal(task.type,'x-m28-vessels');
  assert.equal(original.valid(task,m),true);
  assert.equal(original.inspect(task,m).correct,true);
  const before=JSON.stringify({task,m});
  const binding=vesselsBinding(task,context(sessionId));
  assert.ok(binding?.nodeId);
  assert.equal(binding.method,null);
  const proof=replayVesselsEvidence(task,m,context(sessionId));
  assert.ok(proof,'full pours and observations must have actual events');
  assert.equal(proof.eventCount,m.history.length);
  assert.equal(proof.construction.measurements.length,task.capacities.length);
  assert.deepEqual(proof.construction.suppliedCapacities,task.capacities.map(String));
  assert.ok(proof.construction.measurements.every(x=>
   x.count*x.unitAmount===x.capacity&&x.seenAt>=0));
  assert.equal(proof.physicalMeasurementAssessed,false);
  assert.equal(proof.independentUnitChoiceReasoningAssessed,false);
  assert.equal(proof.method,null);
  assert.equal(JSON.stringify({task,m}),before,'no task or attempt mutation');
 });

 test('#256 fail closed on no provenance, invented source and help: '+sessionId,()=>{
  const task=sessionTaskFor(sessionId,1),m=original.example(task);
  assert.equal(replayVesselsEvidence(task,m),null);
  assert.equal(replayVesselsEvidence(task,m,{sessionId,index:0}),null);
  const invented=clone(task);invented.prompt+='(forged)';
  assert.equal(replayVesselsEvidence(invented,m,context(sessionId)),null);
  const erased=clone(m);erased.history=[];
  assert.equal(replayVesselsEvidence(task,erased,context(sessionId)),null);
  const help=clone(m);
  original.act(task,help,'m28-help');
  assert.equal(original.valid(task,help),true);
  assert.equal(original.inspect(task,help).correct,true);
  assert.equal(replayVesselsEvidence(task,help,context(sessionId)),null);
 });
}

test('#256 sorting before measuring passes original grading, not strict causal replay',()=>{
 const task=sessionTaskFor('ordermeasure',1);
 const model=original.initial(task,314159);
 const sorted=task.capacities.map((v,i)=>[v,i]).sort((a,b)=>a[0]-b[0]).map(x=>x[1]);
 for(const i of sorted)original.act(task,model,'m28-order',{index:i});
 for(const step of original.solveSteps(task)){
  if(step.field)model[step.field]=step.value;
  else original.act(task,model,step.action,step.data);
 }
 assert.equal(original.valid(task,model),true);
 assert.equal(original.inspect(task,model).correct,true);
 assert.equal(replayVesselsEvidence(task,model,context('ordermeasure')),null);
 original.act(task,model,'m28-clear');
 for(const i of sorted)original.act(task,model,'m28-order',{index:i});
 assert.ok(replayVesselsEvidence(task,model,context('ordermeasure')),
  'a real clear and later measured reorder can correct the trace');
});

test('#256 overflow never counts as measured quantity, but correction is preserved',()=>{
 const task=sessionTaskFor('precisionunits',1);
 const model=original.initial(task,314159);
 original.act(task,model,'m28-select',{index:0});
 original.act(task,model,'m28-vunit',{index:'cup'});
 original.act(task,model,'m28-pour');
 assert.equal(model.board.levels[0],0);
 assert.equal(model.board.first.overflow,'cup');
 original.act(task,model,'m28-vunit',{index:'spoon'});
 for(let i=0;i<6;i++)original.act(task,model,'m28-pour');
 original.act(task,model,'m28-seen');
 model.answers[0]='6';
 assert.equal(original.valid(task,model),true);
 assert.equal(original.inspect(task,model).correct,true);
 const proof=replayVesselsEvidence(task,model,context('precisionunits'));
 assert.ok(proof);
 assert.equal(proof.construction.overflows.length,1);
 assert.equal(proof.construction.successfulPours.length,6);
 assert.equal(proof.construction.measurements[0].count,6);
 assert.deepEqual(proof.construction.questions,[{expected:'6',raw:'6'}]);
 original.act(task,model,'m28-pour');
 assert.equal(original.inspect(task,model).correct,true);
 assert.equal(replayVesselsEvidence(task,model,context('precisionunits')),null,
  'unresolved late overflow is not a clean proof');
 original.act(task,model,'m28-seen');
 assert.ok(replayVesselsEvidence(task,model,context('precisionunits')),
  'corrective operation can clear the failure without deleting history');
});

test('#256 exactly three bridge vessel tasks have no native A binding',()=>{
 const bridges=Object.keys(BRIDGES).flatMap(sessionId=>
  sessionTasks(sessionId).map((task,index)=>({sessionId,index,task})))
  .filter(x=>x.task?.type==='x-m28-vessels');
 assert.equal(bridges.length,3);
 for(const {sessionId,index,task} of bridges){
  assert.equal(vesselsBinding(task,{sessionId,index}),null);
  assert.equal(replayVesselsEvidence(task,original.example(task),{sessionId,index}),null);
 }
});


test('#256 exact capacity answers reject grader-only floating tolerance',()=>{
 const task=sessionTaskFor('precisionunits',1);
 const model=original.example(task);
 assert.equal(original.valid(task,model),true);
 assert.equal(original.inspect(task,model).correct,true);
 assert.ok(replayVesselsEvidence(task,model,context('precisionunits')));
 // The old near() grader accepts 6.00000001 as sufficiently close to 6,
 // but a strict unit-count proof must not advertise eight decimal digits
 // of fabricated count precision as the exact number of real pours.
 const almost=clone(model);
 almost.answers[0]='6.00000001';
 assert.equal(original.valid(task,almost),true);
 assert.equal(original.inspect(task,almost).correct,true,
  'this documents a deliberately weaker unchanged original grading threshold');
 assert.equal(replayVesselsEvidence(task,almost,context('precisionunits')),null);
 const fraction=clone(model);
 fraction.answers[0]='12/2';
 assert.equal(original.valid(task,fraction),true);
 assert.equal(original.inspect(task,fraction).correct,true);
 assert.ok(replayVesselsEvidence(task,fraction,context('precisionunits')),
  'exact rational equivalence is mathematical equality, not numeric tolerance');
});

test('#256 replay cannot discard actual pours, silently alter issues, or forge terminal board',()=>{
 const task=sessionTaskFor('ordermeasure',1),m=original.example(task);
 assert.ok(replayVesselsEvidence(task,m,context('ordermeasure')));
 const before=JSON.stringify(m);
 const deleted=clone(m);
 deleted.history=deleted.history.filter(x=>x.a!=='pour');
 assert.equal(replayVesselsEvidence(task,deleted,context('ordermeasure')),null);
 const forged=clone(m);
 forged.board.levels[0]=0;
 assert.equal(replayVesselsEvidence(task,forged,context('ordermeasure')),null);
 const issue=clone(m);
 issue.issue='过去的失败不能被悄悄重写';
 assert.equal(replayVesselsEvidence(task,issue,context('ordermeasure')),null);
 assert.equal(JSON.stringify(m),before,'negative probes never mutate the original work');
});

test('#256 shared source-bound guide and current-submission visible feedback',()=>{
 for(const sessionId of sources){
  const task=sessionTaskFor(sessionId,1),model=original.example(task),source=context(sessionId);
  const saved={support:false,attempts:[{value:clone(model)}]};
  const guide=thinkingGuide(task,source),feedback=thinkingFeedback(task,model,saved,source);
  assert.ok(guide?.question,'reviewed source has an optional question');
  assert.ok(feedback?.observation&&feedback.detail.length>=2,'strict replay yields visible card');
  assert.equal(feedback.method,null,'no independent reasoning method asserted');
  const edited=clone(model);edited.offset='3';
  assert.equal(thinkingFeedback(task,edited,saved,source),null,'edited work invalidates feedback');
  assert.equal(thinkingGuide(task,{sessionId,index:'1'}),null);
  assert.equal(thinkingFeedback(task,model,saved,{sessionId,index:'1'}),null);
  assert.equal(thinkingFeedback(task,model,{support:false,attempts:[{value:clone(model)},{value:original.initial(task,42)}]},source),null);
 }
});
