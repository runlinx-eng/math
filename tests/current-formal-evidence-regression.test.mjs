// Current runtime regression, not a substitute or reconstruction of the
// original 949 historical Check artifacts. Every source is independently
// fingerprinted; new test records come only from the current submitLesson.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {ensureB39Ready} from '../dist/learning/phase4/async-batches.js';
import {sessionTaskFor,BRIDGES,sessionTasks} from '../dist/learning/bridges.js';
import {LESSONS} from '../dist/learning/catalog.js';
import {defaultModel,exampleModel,validModel,inspect} from '../dist/learning/tasks.js';
import {freshLesson,submitLesson} from '../dist/learning/state.js';
import {ISSUE341_FORMAL_MANIFEST} from '../dist/learning/issue341-formal-admissions.js';
import {createIssue341ManifestGatedRouting} from '../dist/learning/issue341-formal-source-routing.js';
import {taskFingerprint} from '../scripts/audit-evidence-expansion.mjs';
await ensureB39Ready();
const manifest=JSON.parse(readFileSync(new URL('../docs/spatial-learning/evidence-review-manifest.json',import.meta.url)));
const rows=ISSUE341_FORMAL_MANIFEST.tasks,route=createIssue341ManifestGatedRouting(ISSUE341_FORMAL_MANIFEST);
const key=(id,index)=>id+':'+index;
const rowByKey=new Map(rows.map(r=>[key(r.sessionId,r.index),r]));
// Independently observed from the initial #401 actual CI run on the unchanged
// formal main product, not regenerated from the implementation under test.
const positiveBaseline=JSON.parse(readFileSync(new URL('./fixtures/current-formal-evidence-positive-baseline.json',import.meta.url)));
assert.equal(positiveBaseline.schema,'math-current-example-positive-baseline/1');
assert.equal(positiveBaseline.positions.length,841);
assert.equal(new Set(positiveBaseline.positions).size,841);
assert.ok(positiveBaseline.positions.every(id=>rowByKey.has(id)));
test('all949 current native sources, fingerprints, graders and Check freshness remain exact',()=>{
 assert.equal(rows.length,949);assert.equal(route.approvedFamilies,284);
 assert.deepEqual(manifest.tasks.filter(r=>r.adapter.startsWith('issue341-')),rows);
 const positives=[],examples=[],wrong=[];
 for(const row of rows){
  const ctx={sessionId:row.sessionId,index:row.index},id=key(ctx.sessionId,ctx.index),task=sessionTaskFor(ctx.sessionId,ctx.index);
  assert.ok(task,id);assert.equal(task.type,row.type,id);assert.equal(LESSONS[ctx.sessionId].topicId,row.nodeId,id);
  assert.equal(taskFingerprint(task),row.taskHash,id+' full current task fingerprint changed; review the source rather than refreshing a digest');
  const match=route.registry.resolve(task,ctx);
  assert.equal(match.status,'matched',id);assert.equal(match.match.adapter.id,row.adapter,id);assert.equal(match.match.binding.strictAApproved,true,id);
  assert.equal(route.guide(task,ctx).question,'哪些记录能帮助你核对这次结果？',id);
  assert.equal(route.registry.resolve({...task,prompt:task.prompt+' forged'},ctx).status,'unbound',id+' altered task');
  const m=defaultModel(task),initial=structuredClone(m);
  assert.equal(validModel(task,m),true,id+' initial model');
  assert.equal(typeof inspect(task,m).correct,'boolean',id+' callable grader');
  assert.equal(route.feedback(task,m,{attempts:[]},ctx),null,id+' cannot give feedback without Check');
  const a=freshLesson(ctx.sessionId);a.index=ctx.index;a.models[ctx.index]=m;
  const first=submitLesson(a),firstRecord=structuredClone(a.cases[ctx.index]);
  if(!first.correct){
   wrong.push(id);assert.equal(route.feedback(task,m,a.cases[ctx.index],ctx),null,id+' wrong Check must not earn proof');
  }
  assert.deepEqual(m,initial,id+' model unchanged by checking');
  const example=exampleModel(task);
  assert.equal(validModel(task,example),true,id+' current example validity');
  assert.equal(inspect(task,example).correct,true,id+' current example original mathematical grader');
  examples.push(id);
  a.models[ctx.index]=structuredClone(example);
  assert.equal(submitLesson(a).correct,true,id+' actual current in-memory Check');
  const rec=a.cases[ctx.index],current=a.models[ctx.index];
  assert.deepEqual(rec.attempts.slice(0,-1),firstRecord.attempts,id+' earlier Check preserved');
  const saved=structuredClone(rec);
  const feedback=route.feedback(task,current,rec,ctx);
  if(feedback){assert.equal(feedback.method,null,id+' no fabricated thinking label');positives.push(id);}
  assert.equal(route.feedback(task,{...current,__stale_test_only:true},rec,ctx),null,id+' stale work');
  assert.equal(route.feedback(task,current,{...rec,attempts:[]},ctx),null,id+' removed Check');
  assert.deepEqual(rec,saved,id+' feedback must not rewrite records');
 }
 // The B06 count-trail examples are deliberately required positive proofs.
 // Some other contracts require particular wrong-to-correct actions beyond
 // exampleModel. Their original evidence must not be invented or claimed.
 const positiveSet=new Set(positives);
 for(const id of positiveBaseline.positions)assert.ok(positiveSet.has(id),id+' previously verified current strict positive proof disappeared');
 for(const id of ['countonce:0','lastcount:0','lastcount:1','lastcount:2'])assert.ok(positiveSet.has(id),id+' current strict positive proof');
 assert.equal(examples.length,949);
 console.log('CURRENT_FORMAL_REGRESSION '+JSON.stringify({scope:'current model and actual in-memory Check',sources:rows.length,examples:examples.length,wrongChecks:wrong.length,currentPositiveProofs:positives.length,positivePositions:positives,historicalOriginalChecksReplayed:0}));
});
test('formal bindings never leak to unrelated native or associated positions',()=>{
 const candidateIds=new Set(route.adapters.map(a=>a.id));
 for(const id of Object.keys(LESSONS)){
  for(const [index,t]of sessionTasks(id).entries()){
   if(rowByKey.has(key(id,index)))continue;
   const r=route.registry.resolve(t,{sessionId:id,index});
   assert.ok(!r.match||!candidateIds.has(r.match.adapter.id),key(id,index)+' unexpected formal candidate');
  }
 }
 for(const id of Object.keys(BRIDGES))for(const [index,t]of sessionTasks(id).entries()){
  const ctx={sessionId:id,index},r=route.registry.resolve(t,ctx);
  assert.ok(!r.match||!candidateIds.has(r.match.adapter.id),key(id,index)+' associated evidence leakage');
  assert.equal(route.guide(t,ctx),null,key(id,index)+' associated guide leakage');
 }
});
