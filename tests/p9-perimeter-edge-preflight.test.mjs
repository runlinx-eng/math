// #310: independent positive and adversarial checks for real B30 edge histories.
import test from 'node:test';
import assert from 'node:assert/strict';
import {sessionTaskFor} from '../dist/learning/bridges.js';
import * as b30 from '../dist/learning/phase5/b30-model.js';
import {boundaryRuns,perimeterEdges} from '../dist/learning/phase5/b30-geometry.js';
import {perimeterEdgeBinding,replayPerimeterEdgeEvidence} from '../dist/learning/perimeter-edge-evidence.js';
import {thinkingGuide,thinkingFeedback} from '../dist/learning/thinking-feedback.js';
const cases=[
 {id:'walkperim',index:0,length:10,area:6,segments:[3,2,2,3],nodeId:'mt_wE7-Gs9ENL'},
 {id:'walkperim',index:1,length:16,area:16,segments:[4,4,4,4],nodeId:'mt_wE7-Gs9ENL'},
 {id:'walkperim',index:2,length:14,area:10,segments:[5,2,2,5],nodeId:'mt_wE7-Gs9ENL',answer:10},
 {id:'polyperim',index:0,length:26,area:40,segments:[8,5,5,8],nodeId:'mt_WtcFrxGOgw'},
 {id:'lperim',index:0,length:20,area:20,segments:[4,4,2,6,2,2],nodeId:'mt_n0AlyLQwC9',answer:2},
 {id:'lperim',index:1,length:20,area:23,segments:[5,5,3,1,4,2],nodeId:'mt_n0AlyLQwC9'}
];
function solved(row){
 const task=sessionTaskFor(row.id,row.index),model=b30.initial(task);
 const count=boundaryRuns(task.cells).length;
 for(let i=0;i<count;i++)b30.act(task,model,'a30-edge',{index:i});
 model.perimeter=String(row.length);b30.field(task,model,'perimeter');
 model.unit=task.unit;b30.field(task,model,'unit');
 for(const [i,q] of (task.questions||[]).entries()){
  model.answers[i]=String(q.value);b30.field(task,model,'answers.'+i);
 }
 return {task,model,context:{sessionId:row.id,index:row.index}};
}
const proof=(row,value)=>replayPerimeterEdgeEvidence(value.task,value.model,value.context);
test('#310 six original B30 outer-edge tasks replay complete unit-edge geometry',()=>{
 for(const row of cases){
  const entry=solved(row),{task,model,context}=entry;
  assert.equal(task.type,'x-a30-grid');assert.equal(task.mode,'edge');
  assert.equal(task.cells.length,row.area);
  assert.equal(perimeterEdges(task.cells).length,row.length);
  assert.deepEqual(boundaryRuns(task.cells).map(([a,b])=>Math.abs(a[0]-b[0])+Math.abs(a[1]-b[1])),row.segments);
  assert.ok(b30.valid(task,model));assert.equal(b30.inspect(task,model).correct,true);
  assert.equal(perimeterEdgeBinding(task,context)?.nodeId,row.nodeId);
  const result=proof(row,entry);
  assert.ok(result,row.id+':'+row.index);
  assert.equal(result.perimeter,String(row.length));
  assert.equal(result.unitEdgesVerified,row.length);
  assert.equal(result.runs.reduce((s,p)=>s+p.length,0),row.length);
  assert.equal(result.chronologicalRequests.length,row.segments.length);
  assert.equal(result.toolProvidedGeometry,true);
  assert.equal(result.learnerMasteryAssessed,false);
  const record={support:false,attempts:[{value:structuredClone(model)}]};
  assert.ok(thinkingGuide(task,context));assert.ok(thinkingFeedback(task,model,record,context));
 }
});
test('#310 toggle, undo and clear preserve history but never invent perimeter',()=>{
 for(const row of cases){
  const {task,model,context}=solved(row);
  b30.act(task,model,'a30-edge',{index:0});
  assert.equal(replayPerimeterEdgeEvidence(task,model,context),null);
  b30.act(task,model,'a30-edge',{index:0});
  assert.equal(replayPerimeterEdgeEvidence(task,model,context)?.toggles.length,2);
  b30.act(task,model,'a30-undo');
  assert.equal(replayPerimeterEdgeEvidence(task,model,context),null);
  b30.act(task,model,'a30-edge',{index:boundaryRuns(task.cells).length-1});
  assert.ok(replayPerimeterEdgeEvidence(task,model,context)?.undone.length);
  b30.act(task,model,'a30-clear');
  assert.equal(replayPerimeterEdgeEvidence(task,model,context),null);
  for(let i=0;i<boundaryRuns(task.cells).length;i++)b30.act(task,model,'a30-edge',{index:i});
  assert.equal(replayPerimeterEdgeEvidence(task,model,context)?.clears.length,1);
 }
});
test('#310 forged geometry, malformed events and incorrect numeric or source scope fail closed',()=>{
 for(const row of cases){
  const {task,model,context}=solved(row);
  const bad=[
   x=>x.history.shift(),x=>x.history[0].a='tile',
   x=>x.history[0].i='01',x=>x.history[0].i='-1',
   x=>x.history[0].i='200',x=>x.history[0].f.fake='1',
   x=>x.history[0].extra=true,x=>x.history.reverse(),
   x=>x.history.push({a:'oops',i:'',f:{}}),
   x=>x.board.bad=true,x=>x.board.first.edge=0,
   x=>x.board.edges[0]=99,x=>x.unit='cm²',
   x=>x.perimeter=String(row.segments.length),
   x=>x.perimeter=String(row.length)+'.000000000000001',
   x=>x.perimeter='2e1',x=>x.perimeter='Infinity',
   x=>x.area='1',x=>x.issue='invalid'
  ];
  for(const edit of bad){
   const copied=structuredClone(model);edit(copied);
   // Reversing an entire correct path is valid unordered outer-edge coverage.
   assert.equal(replayPerimeterEdgeEvidence(task,copied,context),null,edit.toString());
  }
  if(task.questions?.length){
   const x=structuredClone(model);x.answers[0]=String(task.questions[0].value)+'.00000000001';
   assert.equal(replayPerimeterEdgeEvidence(task,x,context),null);
  }
  assert.equal(replayPerimeterEdgeEvidence({...task,prompt:task.prompt+'?'},model,context),null);
  assert.equal(replayPerimeterEdgeEvidence(task,model,{...context,index:2.5}),null);
  assert.equal(replayPerimeterEdgeEvidence(task,model,{...context,sessionId:'gridarea'}),null);
  assert.equal(replayPerimeterEdgeEvidence(task,model,null),null);
  assert.equal(replayPerimeterEdgeEvidence(task,model,{sessionId:{bad:true},index:0}),null);
  const wrong={support:false,attempts:[{value:structuredClone(model)},{value:b30.initial(task)}]};
  assert.equal(thinkingFeedback(task,model,wrong,context),null);
  assert.equal(thinkingFeedback(task,{...model,prose:'new'},{
   attempts:[{value:structuredClone(model)}]},context),null);
 }
 for(const [id,index] of [['gridarea',2],['polyperim',1],['polyperim',2],['lperim',2],['rectsplit',0]]){
  const task=sessionTaskFor(id,index),context={sessionId:id,index};
  assert.equal(perimeterEdgeBinding(task,context),null,id+':'+index);
 }
});
