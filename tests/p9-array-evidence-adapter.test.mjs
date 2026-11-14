import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {TASKS as T34} from '../dist/learning/phase5/b34.js';
import {TASKS as T13} from '../dist/learning/phase5/b13.js';
import * as arrays from '../dist/learning/phase5/b13-model.js';
import * as view from '../dist/learning/phase5/b13-view.js';
import {visibleModel} from './helpers/p9-basic-visible-controls.mjs';
import {sessionTasks,sessionMeta} from '../dist/learning/bridges.js';
import {arrayBinding,replayArrayEvidence} from '../dist/learning/array-evidence.js';
import {thinkingGuide,thinkingFeedback} from '../dist/learning/thinking-feedback.js';
const cases=[
 ['structure34',1,'mt_FAXjFkgG6X','ccss-math:MP.7'],
 ['tables34',1,'mt_2jbUekyTu4','ccss-math:MP.8'],
 ...[0,3,4,5,6].map(i=>['derivepatterns',i,'mt_aivrWs6jrS','ccss-math:MP.8'])
];
const record=v=>({support:false,attempts:[{value:structuredClone(v)}]});
const source=JSON.parse(readFileSync(new URL('../docs/spatial-learning/thinking-source-map.json',import.meta.url)));
test('seven explicitly sourced native B13 arrays offer optional prompts',()=>{
 for(const [id,index,nodeId,code] of cases){
  const task=sessionTasks(id)[index],context={sessionId:id,index};
  assert.equal(task.type,'x-mularray');
  const bind=arrayBinding(task,context);
  assert.equal(bind?.nodeId,nodeId);
  assert.equal(bind.code,code);
  assert.equal(sessionMeta(id).topicId,nodeId);
  const node=source.groups.find(g=>g.code===code).nodes.find(n=>n.id===nodeId);
  assert.equal(node.displayName,bind.label);
  assert.equal(node.lessonId,id);
  assert.ok(node.goals.some(g=>g.tasks.some(t=>t.index===index&&t.type===task.type)));
  assert.match(thinkingGuide(task,context).summary,/想一想/);
  assert.ok(thinkingGuide(task,context).question.length>10);
  assert.equal(arrayBinding({...task,unit:10000},context),null);
 }
 const domain=arrayBinding(T13.productways[0],{sessionId:'productways',index:0});
 assert.equal(domain?.nodeId,'mt_Lb2ZnMdkYR');
 assert.equal(domain.method,null,'domain array facts must not inherit an MP label');
 assert.equal(arrayBinding(T34.structure34[1],{sessionId:'structure34',index:3}),null);
 assert.equal(arrayBinding(T34.structure34[1],{sessionId:'link-productways-structure34',index:1}),null);
});
test('seven array lessons require actual checked actions and current submission',()=>{
 for(const [id,index,nodeId,code] of cases){
  const task=sessionTasks(id)[index],context={sessionId:id,index},done=arrays.example(task);
  assert.equal(arrays.valid(task,done),true,id+':'+index);
  assert.equal(arrays.inspect(task,done).correct,true,id+':'+index);
  const proof=replayArrayEvidence(task,done);
  assert.ok(proof,id+':'+index);
  assert.equal(proof.rows,task.a);
  assert.equal(proof.cols,task.b);
  assert.equal(proof.total,task.a*task.b*(task.unit||1));
  assert.equal(thinkingFeedback(task,done,record(arrays.initial(task)),context),null);
  assert.equal(thinkingFeedback(task,done,record(done)),null);
  const feedback=thinkingFeedback(task,done,record(done),context);
  assert.equal(feedback.method.nodeId,nodeId);
  assert.equal(feedback.method.code,code);
  assert.match(feedback.observation,/实际摆出/);
  assert.match(feedback.detail.join(' '),/不能据此判断/);
  assert.equal(thinkingFeedback(task,done,null,context),null);
  const changed=structuredClone(done);changed.answer='__changed__';
  assert.equal(thinkingFeedback(task,changed,record(done),context),null);
  const wrong=structuredClone(done);wrong.answer='12345';
  assert.equal(thinkingFeedback(task,wrong,record(wrong),context),null);
 }
});
test('turn, partition and changing units yield distinct mathematics',()=>{
 const rot=replayArrayEvidence(T34.structure34[1],arrays.example(T34.structure34[1]));
 assert.equal(rot.turned,true);assert.equal(rot.total,24);
 const split=replayArrayEvidence(T34.tables34[1],arrays.example(T34.tables34[1]));
 assert.deepEqual([split.left,split.right,split.cut],[40,16,5]);
 for(const [index,unit,total] of [[3,1,12],[4,10,120],[5,100,1200]]){
  const t=T13.derivepatterns[index],proof=replayArrayEvidence(t,arrays.example(t));
  assert.equal(proof.unit,unit);assert.equal(proof.total,total);
 }
});
test('reordered events and changed pieces are refused; repeat shape keeps its actual effect',()=>{
 for(const [id,index] of cases){
  const t=sessionTasks(id)[index],done=arrays.example(t);
  const altered=fn=>{const m=structuredClone(done);fn(m);return m;};
  assert.equal(replayArrayEvidence(t,altered(m=>m.history=[])),null);
  const repeated=altered(m=>m.history.push(structuredClone(m.history[0])));
  if(t.rotate||t.split)assert.equal(replayArrayEvidence(t,repeated),null,'rebuilding really clears turn/cut state');
  else{const proof=replayArrayEvidence(t,repeated);assert.ok(proof);assert.equal(proof.shapeRequests,2);assert.equal(proof.shapes,1);assert.equal(proof.confirmations.length,1);assert.deepEqual(proof.events[1].before,proof.events[1].after);assert.equal(proof.events[1].changed,false);}
  assert.equal(replayArrayEvidence(t,altered(m=>m.history[0].action='b13-reset')),null);
  assert.equal(replayArrayEvidence(t,altered(m=>m.history[0].data.rows='11')),null);
  assert.equal(replayArrayEvidence(t,altered(m=>m.board.built.rows=11)),null);
  assert.equal(replayArrayEvidence(t,altered(m=>m.board.rows=11)),null);
  if(done.history.length===2){
   assert.equal(replayArrayEvidence(t,altered(m=>m.history.reverse())),null);
   assert.equal(replayArrayEvidence(t,altered(m=>m.history.pop())),null);
  }
 }
});

test('all native arrays keep zero-size failures, alternate shapes and repeated constructions from visible controls',()=>{
 const manifest=JSON.parse(readFileSync(new URL('../docs/spatial-learning/evidence-review-manifest.json',import.meta.url))).tasks;
 for(const c of manifest.filter(x=>x.adapter==='array')){
  const t=sessionTasks(c.sessionId)[c.index],d=visibleModel(t,arrays,view),ctx={sessionId:c.sessionId,index:c.index};
  const failed=d.action('b13-shape');assert.deepEqual(failed.before.board,failed.after.board);
  d.field('rows','1');d.field('cols','1');if(t.rotate)d.field('prediction','more');d.action('b13-shape');
  for(const step of arrays.solveSteps(t))d.step(step);
  if(t.rotate){d.action('b13-turn');if(t.repeated)d.field('addition',Array(t.a).fill(t.b*(t.unit??1)).join('+')+'='+t.a*t.b*(t.unit??1));}
  const proof=replayArrayEvidence(t,d.model);assert.ok(proof,c.sessionId+':'+c.index);
  assert.equal(proof.failedActions,1);assert.equal(proof.shapeRequests,2);assert.ok(proof.shapes>=1&&proof.shapes<=2);assert.deepEqual(proof.events[0].before,proof.events[0].after);
  for(const e of proof.events.filter(e=>e.action==='b13-turn'))assert.equal(BigInt(e.before.rows)*BigInt(e.before.cols),BigInt(e.after.rows)*BigInt(e.after.cols));
  assert.equal(proof.total,t.a*t.b*(t.unit??1));assert.ok(thinkingFeedback(t,d.model,record(d.model),ctx));
  if(t.rotate){assert.equal(proof.retainedPrediction,'more');assert.equal(proof.currentRows,t.a);assert.equal(proof.currentCols,t.b);assert.ok(d.model.issue);}
  const stale=structuredClone(d.model);stale.answer='wrong';assert.equal(thinkingFeedback(t,d.model,record(stale),ctx),null);
  for(const mutate of [m=>m.history[0].data.rows='0.0',m=>m.history[0].action='b13-reset',m=>m.history[0].data.amount='2',m=>m.board.prediction='invented']){
   const m=structuredClone(d.model);mutate(m);assert.equal(replayArrayEvidence(t,m),null);
  }
 }
});

test('split boundaries, repeated cuts and initial empty prediction retain actual outcomes',()=>{
 const t=T34.tables34[1],d=visibleModel(t,arrays,view);
 d.field('rows',t.a);d.field('cols',t.b);d.action('b13-shape');
 for(const cut of ['0',String(t.b)]){d.field('cut',cut);const x=d.action('b13-cut');assert.deepEqual(x.before.board,x.after.board);}
 for(const step of arrays.solveSteps(t).slice(3))d.step(step);
 d.action('b13-cut');const proof=replayArrayEvidence(t,d.model);assert.ok(proof);assert.equal(proof.failedActions,2);assert.equal(proof.cutRequests,2);assert.equal(proof.cuts,1);assert.equal(proof.confirmations.length,1);
 const rot=T34.structure34[1],r=visibleModel(rot,arrays,view);r.field('rows',rot.a);r.field('cols',rot.b);r.action('b13-shape');
 assert.equal(r.model.board.built,null);for(const step of arrays.solveSteps(rot))r.step(step);
 assert.equal(replayArrayEvidence(rot,r.model)?.failedActions,1);
});

test('repeat shape/cut confirms the same board while an actual rebuild clears a previous turn or cut',()=>{
 for(const [t,ctx] of [[T13.derivepatterns[3],{sessionId:'derivepatterns',index:3}],[T34.tables34[1],{sessionId:'tables34',index:1}]]){
  const d=visibleModel(t,arrays,view);for(const s of arrays.solveSteps(t))d.step(s);
  const before=structuredClone(d.model.board);d.action(t.split?'b13-cut':'b13-shape');
  assert.deepEqual(d.model.board,before);const p=replayArrayEvidence(t,d.model);assert.ok(p);
  assert.equal(p.shapes,1);assert.equal(p.cuts,t.split?1:0);assert.equal(p.confirmations.length,1);
  const feedback=thinkingFeedback(t,d.model,record(d.model),ctx);assert.match(feedback.detail.join(' '),/确认了相同/);assert.doesNotMatch(feedback.detail.join(' '),/2 次摆放|2 次切分/);
 }
 const t=T34.structure34[1],d=visibleModel(t,arrays,view);for(const s of arrays.solveSteps(t))d.step(s);
 d.action('b13-shape');assert.equal(d.model.board.turns,0);d.action('b13-turn');
 const p=replayArrayEvidence(t,d.model);assert.ok(p);assert.equal(p.shapes,2);assert.equal(p.turns,2);assert.equal(p.confirmations.length,0);
});

test('pending sliders dynamically disable turn/cut, and direct model events cannot impersonate those buttons',()=>{
 for(const [t,action] of [[T34.structure34[1],'b13-turn'],[T34.tables34[1],'b13-cut']]){
  const d=visibleModel(t,arrays,view),steps=arrays.solveSteps(t),at=steps.findIndex(s=>s.action===action);
  for(const s of steps.slice(0,at))d.step(s);d.field('rows','1');
  assert.throws(()=>d.action(action),/visible enabled action/);
  if(t.split)assert.throws(()=>d.field('cut','1'),/enabled field/);
  arrays.act(t,d.model,action);d.field('rows',t.a);
  for(const s of steps.slice(at+1))d.step(s);
  assert.ok(arrays.valid(t,d.model)&&arrays.inspect(t,d.model).correct);
  assert.equal(replayArrayEvidence(t,d.model),null,'forged action during dynamic disable remains rejected');
 }
});

test('separated decimal digits cannot be joined by strict notation normalization; operator spacing stays valid',()=>{
 for(const [id,index,field,value] of [['tables12',0,'equation','7×8=5 6'],['tensproducts',0,'equation','7×3 0=210'],['rowsums',0,'addition','4+4+4=1 2'],['divisionmeaning',3,'check','7×8=5 6']]){
  const task=sessionTasks(id)[index],model=arrays.example(task);model[field]=value;
  assert.ok(arrays.valid(task,model)&&arrays.inspect(task,model).correct,id+':'+index+' original grading remains unchanged');
  assert.equal(replayArrayEvidence(task,model),null,'separated digits are not a precise statement');
 }
 for(const task of [T34.tables34[1],T13.tensproducts[0],T13.rowsums[0]]){
  const model=arrays.example(task);for(const key of ['equation','addition','check'])model[key]=model[key].replace(/[×+=÷]/g,x=>' '+x+' ');
  assert.ok(arrays.inspect(task,model).correct);assert.ok(replayArrayEvidence(task,model));
 }
});
