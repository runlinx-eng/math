import test from 'node:test';
import assert from 'node:assert/strict';
import {sessionTasks,sessionMeta,BRIDGES} from '../dist/learning/bridges.js';
import {LESSONS} from '../dist/learning/catalog.js';
import * as geometry from '../dist/learning/phase5/b23-model.js';
import {lineBinding,replayLineEvidence} from '../dist/learning/line-evidence.js';
import {thinkingGuide,thinkingFeedback} from '../dist/learning/thinking-feedback.js';
import {ensureB39Ready} from '../dist/learning/phase4/async-batches.js';
await ensureB39Ready();
const cases=[...['lineproperties','lineorientation'].flatMap(id=>Array.from({length:id==='lineproperties'?3:4},(_,index)=>[id,index])),['geometrynotation',2],['linemark',1],['structure34',3]];
const record=m=>({support:false,attempts:[{value:structuredClone(m)}]});
test('ten exact native tasks bind original nodes; copied widgets and bridges do not inherit sources',()=>{
 for(const [id,index] of cases){
  const t=sessionTasks(id)[index],c={sessionId:id,index},b=lineBinding(t,c);
  assert.equal(b.nodeId,sessionMeta(id).topicId);assert.ok(thinkingGuide(t,c));
  assert.equal(lineBinding({...t,rotation:99},c),null);
  assert.equal(lineBinding({...t,prompt:'changed'},c),null);
  assert.equal(lineBinding(t,{sessionId:id,index:String(index)}),null);
  assert.equal(lineBinding(t,{sessionId:'__proto__',index}),null);
 }
 for(const [id,meta] of Object.entries(BRIDGES))for(const [index,t] of sessionTasks(id).entries())assert.equal(lineBinding(t,{sessionId:id,index}),null,id);
 const actual=[];
 for(const id of Object.keys(LESSONS))sessionTasks(id).forEach((t,index)=>{if(lineBinding(t,{sessionId:id,index}))actual.push(id+':'+index);});
 assert.deepEqual(actual.sort(),cases.map(([id,i])=>id+':'+i).sort());
});
test('all ten mathematics proofs require actions and a current checked snapshot; only MP.7 source is tagged',()=>{
 for(const [id,index] of cases){
  const t=sessionTasks(id)[index],m=geometry.example(t),c={sessionId:id,index};
  const proof=replayLineEvidence(t,m);assert.ok(proof,id+':'+index);
  assert.equal(proof.tests.length,t.required.length);
  const f=thinkingFeedback(t,m,record(m),c);assert.ok(f);assert.match(f.observation,/实际检查/);
  assert.equal(f.method?.nodeId||null,id==='structure34'?'mt_FAXjFkgG6X':null);
  assert.match(f.detail.join(' '),/不能推断/);
  assert.equal(thinkingFeedback(t,m,null,c),null);
  const changed=structuredClone(m);changed.answers[0]='__changed__';
  assert.equal(thinkingFeedback(t,changed,record(m),c),null);
  assert.equal(thinkingFeedback(t,changed,record(changed),c),null);
  assert.equal(thinkingFeedback({...t,rotation:89},m,record(m),c),null);
 }
});
test('reject valid-grader no-ops and malformed histories, fabricated booleans, partial work and board tampering',()=>{
 for(const [id,index] of cases){
  const t=sessionTasks(id)[index],done=geometry.example(t);
  const mutations=[m=>m.history=[],m=>m.history.push({a:'reset',f:{},d:{}}),
   m=>m.history.push(structuredClone(m.history[0])),m=>m.history[0].a='test',
   m=>m.history[0].f.first='99',m=>m.history[0].f.first=m.history[0].f.second,
   m=>m.history[0].f.first='',m=>m.history[0].d.index='0',m=>m.history[0].extra=true,
   m=>m.history[0].f.extra='',m=>m.board.tests[0].parallel=!m.board.tests[0].parallel,
   m=>m.issue='invalid',m=>m.board.tests[0].first=99,m=>m.board.tests.pop()];
  for(const mutate of mutations){const m=structuredClone(done);mutate(m);assert.equal(replayLineEvidence(t,m),null,id+':'+index);}
  // Build actual grader-valid histories to demonstrate the stricter observation boundary.
  for(const [a,b] of [[0,0],[Number(done.history[0].f.first),Number(done.history[0].f.second)]]){
   const m=geometry.initial(t,314159);m.first=String(a);m.second=String(b);geometry.act(t,m,'g23-lineTest');
   for(const e of done.history){m.first=e.f.first;m.second=e.f.second;geometry.act(t,m,'g23-lineTest');}
   m.answers=done.answers;
   assert.ok(geometry.valid(t,m));assert.ok(geometry.inspect(t,m).correct);
   assert.equal(replayLineEvidence(t,m),null,'invalid/duplicate pair is not observational evidence');
  }
  if(t.required.length===2){const m=structuredClone(done);m.history.pop();assert.equal(replayLineEvidence(t,m),null);}
 }
});
test('independently checked edge relations distinguish slanted parallel, rotated right angle and trapezoid',()=>{
 for(const [id,index,expected] of [['lineproperties',0,'parallel'],['lineorientation',1,'perpendicular'],['linemark',1,'parallel']]){
  const t=sessionTasks(id)[index],p=replayLineEvidence(t,geometry.example(t));assert.equal(p.tests[0][expected],true);
 }
 const t=sessionTasks('structure34')[3],m=geometry.initial(t,314159);
 // Distinct pairs may be tested in either order; exploring another pair is legitimate.
 for(const [a,b] of [[1,3],[1,2]]){m.first=String(a);m.second=String(b);geometry.act(t,m,'g23-lineTest');}
 m.answers=['both'];assert.ok(replayLineEvidence(t,m));
 const reversed=structuredClone(m);reversed.history.reverse();
 assert.equal(replayLineEvidence(t,reversed),null,'reordered history must agree with the actual board');
});
