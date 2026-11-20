import test from 'node:test';
import assert from 'node:assert/strict';
import {sessionTaskFor} from '../dist/learning/bridges.js';
import * as native from '../dist/learning/phase5/b37-model.js';
import {ratioPairBinding,replayRatioPairEvidence} from '../dist/learning/ratiopair-evidence.js';
import {thinkingGuide,thinkingFeedback} from '../dist/learning/thinking-feedback.js';

// Independently chosen original examples. Neither the adapter nor the model
// is allowed to produce these expected mathematical relationships.
const rows=[
 ['pctIdeas37',0,'direct',['same','different']],
 ['ratioProblem37',0,'direct',['same','different']],
 ['ratioProblem37',1,'direct',['same']],
 ['ratioProblem37',2,'direct',['same','different']],
 ['rateWords37',0,'direct',['same']],
 ['rateWords37',1,'inverse',['same']],
 ['ratioNotation37',0,'direct',['same']],
 ['proportion37',0,'direct',['same','different']],
 ['proportion37',1,'inverse',['same','same']],
 ['ratioLink37',0,'direct',['same']],
 ['ratioLink37',1,'direct',['same','same']],
 ['recipeScale37',0,'direct',['same']],
 ['recipeScale37',1,'direct',['same']]
];
const ctx=(sessionId,index)=>({sessionId,index});
const proof=(id,index,m)=>replayRatioPairEvidence(sessionTaskFor(id,index),m,ctx(id,index));
function place(t,m,a,b){
 m.value=String(a);m.second=String(b);
 native.field(t,m,'value');native.field(t,m,'second');
 native.act(t,m,'r37-place');
}
function choose(t,m,c){
 m.choice=c;native.field(t,m,'choice');native.act(t,m,'r37-save');
}
for(const [id,index,relation,expected] of rows){
 test('#276 original controls independently prove ratio or product '+id+':'+index,()=>{
  const task=sessionTaskFor(id,index),model=native.example(task);
  const before=JSON.stringify({task,model});
  assert.equal(task.type,'x-r37-pair');
  assert.equal(task.relation==='inverse'?'inverse':'direct',relation);
  assert.equal(native.valid(task,model),true);
  assert.equal(native.inspect(task,model).correct,true);
  assert.ok(ratioPairBinding(task,ctx(id,index)));
  const p=proof(id,index,model);
  assert.ok(p,'must replay original actions, not reuse a grader answer');
  assert.equal(p.construction.relation,relation);
  assert.deepEqual(p.construction.expected,expected);
  assert.equal(p.construction.placements,task.targets.length);
  assert.equal(p.eventCount,task.targets.length*2);
  assert.deepEqual(p.construction.wrongSaveIndices,[]);
  assert.ok(p.construction.comparisons.every(r=>r.correct));
  task.targets.forEach((pair,i)=>{
   const base=task.base;
   const [left,right]=relation==='inverse'
    ?[base[0]*base[1],pair[0]*pair[1]]
    :[pair[0]*base[1],pair[1]*base[0]];
   assert.deepEqual(p.construction.crossProducts[i],{left,right});
   assert.equal(left===right,expected[i]==='same');
  });
  for(const key of ['independentStrategyAssessed','realWorldMeasurementAssessed',
   'freeExplanationAssessed','generalMasteryAssessed','checkedSubmissionAssessed'])
   assert.equal(p[key],false,key);
  assert.equal(p.originalControlsReplayed,true);
  assert.equal(JSON.stringify({task,model}),before,'never alter the actual learner record');
 });
 test('#276 no forged source or result-only shortcut '+id+':'+index,()=>{
  const task=sessionTaskFor(id,index),model=native.example(task);
  assert.equal(ratioPairBinding(task),null);
  assert.equal(proof(id,index,null),null);
  assert.equal(replayRatioPairEvidence(task,model,{}),null);
  assert.equal(replayRatioPairEvidence(task,model,{sessionId:id,index:String(index)}),null);
  assert.equal(replayRatioPairEvidence(task,model,ctx(id,index+1)),null);
  const altered=structuredClone(task);altered.base[0]++;
  assert.equal(ratioPairBinding(altered,ctx(id,index)),null);
  assert.equal(replayRatioPairEvidence(altered,model,ctx(id,index)),null);
  const noEvents=structuredClone(model);noEvents.history=[];
  assert.equal(proof(id,index,noEvents),null);
  const incomplete=structuredClone(model);incomplete.history.pop();
  assert.equal(proof(id,index,incomplete),null);
  const unused=structuredClone(model);
  native.act(task,unused,'r37-person',{index:0});
  assert.equal(native.valid(task,unused),true);
  assert.equal(native.inspect(task,unused).correct,true);
  assert.equal(proof(id,index,unused),null,
   'unrelated controller request is not mathematical evidence');
 });
}
test('#276 a wrong ratio judgement remains even after genuine correction',()=>{
 const t=sessionTaskFor('ratioProblem37',0),m=native.initial(t);
 place(t,m,9,15);choose(t,m,'different'); // incorrect, 3:5 = 9:15
 assert.equal(native.inspect(t,m).correct,false);
 assert.equal(proof('ratioProblem37',0,m),null);
 choose(t,m,'same');
 place(t,m,5,7);choose(t,m,'different'); // 3:5 is not 5:7
 assert.equal(native.valid(t,m),true);
 assert.equal(native.inspect(t,m).correct,true);
 const p=proof('ratioProblem37',0,m);
 assert.ok(p);
 assert.deepEqual(p.construction.expected,['same','different']);
 assert.deepEqual(p.construction.wrongSaveIndices,[1]);
 assert.equal(p.construction.firstSave.guess,'different');
 assert.equal(m.board.bad,true);
 assert.equal(p.construction.comparisons[0].correct,false);
});
test('#276 inverse relation preserves product, not the direct ratio',()=>{
 const t=sessionTaskFor('proportion37',1);
 const p=proof('proportion37',1,native.example(t));
 assert.ok(p);
 assert.deepEqual(p.construction.base,[2,12]);
 assert.deepEqual(p.construction.targets,[[4,6],[8,3]]);
 assert.deepEqual(p.construction.crossProducts,[{left:24,right:24},{left:24,right:24}]);
 assert.notEqual(4*12,6*2);
});
test('#276 merely placing a ratio without saving a judgement cannot prove it',()=>{
 const t=sessionTaskFor('ratioProblem37',1),m=native.initial(t);
 place(t,m,8,20);assert.equal(proof('ratioProblem37',1,m),null);
 m.choice='same';native.field(t,m,'choice');
 assert.equal(proof('ratioProblem37',1,m),null);
 choose(t,m,'same');
 m.answers[0]=String(t.questions[0].value);
 native.field(t,m,'answers.0');
 assert.equal(native.inspect(t,m).correct,true);
 assert.ok(proof('ratioProblem37',1,m));
 m.value='7';native.field(t,m,'value');
 assert.equal(proof('ratioProblem37',1,m),null);
});

test('#276 shared feedback requires an actually checked identical and source-valid model',()=>{
 for(const [id,index] of rows){
  const task=sessionTaskFor(id,index),model=native.example(task);
  const saved={support:false,attempts:[{value:structuredClone(model)}]};
  const before=JSON.stringify({task,model,saved});
  const guide=thinkingGuide(task,ctx(id,index));
  const feedback=thinkingFeedback(task,model,saved,ctx(id,index));
  assert.ok(guide?.question);
  assert.ok(feedback?.observation&&feedback.detail.length>=4);
  assert.equal(feedback.method,null);
  assert.ok(feedback.detail.some(s=>s.includes('独立核算')));
  const edited=structuredClone(model);edited.value='999';
  assert.equal(thinkingFeedback(task,edited,saved,ctx(id,index)),null,
   'a later visible edit revokes stale proof');
  assert.equal(thinkingFeedback(task,model,{support:false,attempts:[]},ctx(id,index)),null);
  assert.equal(thinkingFeedback(task,model,
   {support:false,attempts:[{value:native.initial(task)}]},ctx(id,index)),null);
  assert.equal(thinkingFeedback(task,model,saved,{sessionId:id,index:String(index)}),null);
  assert.equal(thinkingGuide(task,{sessionId:id,index:String(index)}),null);
  assert.equal(JSON.stringify({task,model,saved}),before);
 }
});
