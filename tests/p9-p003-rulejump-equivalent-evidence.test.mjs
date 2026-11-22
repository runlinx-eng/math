// #342 P003 percentpatterns:0 isolated contract tests. Candidate-only; not CI acceptance.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {sessionTaskFor} from '../dist/learning/bridges.js';
import * as original from '../dist/learning/phase5/b17-model.js';
import {
 rulejumpEquivalentBinding as binding,
 replayRulejumpEquivalentEvidence as replay,
 submittedRulejumpEquivalentEvidence as submitted
} from '../dist/learning/p003-rulejump-equivalent-evidence.js';

const context={sessionId:'percentpatterns',index:0};
const stable=v=>Array.isArray(v)?v.map(stable):v&&typeof v==='object'?
 Object.fromEntries(Object.keys(v).sort((a,b)=>a.localeCompare(b,'en')).map(k=>[k,stable(v[k])])):v;
const digest=v=>createHash('sha256').update(JSON.stringify(stable(v))).digest('hex');
function fixture(){
 const task=sessionTaskFor(context.sessionId,context.index);
 const model=original.initial(task);
 for(const [name,value] of Object.entries({multiplier:'100',offset:'0',divisor:'4'}))
  model[name]=value;
 original.act(task,model,'b17-rule');
 for(const n of [4,7,16]){
  model.n=String(n);model.answer=String(25*n);
  original.act(task,model,'b17-run');
 }
 return {task,model};
}
const changed=(model,edit)=>{const m=structuredClone(model);edit(m);return m;};
test('P003 runtime native source + event-by-event equivalent arithmetic',()=>{
 const {task,model}=fixture();
 assert.equal(digest(task),'860ef4c64b8993c38591ccf90ddf032c3e9aaa789f8a10e459b2362757436fce',
  'runtime native task must match source-constructed candidate SHA');
 assert.equal(binding(task,context)?.nodeId,'mt_jCy07DyBNU');
 assert.equal(original.valid(task,model),true);
 assert.equal(original.inspect(task,model).correct,true);
 const proof=replay(task,model,context);
 assert.ok(proof);
 assert.deepEqual(proof.canonicalRuns.map(r=>r.thenDivideBy4),[100,175,400]);
 assert.equal(proof.chronologicalControlEvents.length,4);
 assert.equal(proof.mentalCalculationOrderObserved,false);
 assert.equal(proof.learnerMasteryAssessed,false);
});
test('P003 original wrong => corrected submission, latest-only gate',()=>{
 const {task,model}=fixture();
 const wrong=changed(model,m=>{m.answer='401';});
 assert.equal(replay(task,wrong,context),null);
 const attempts=[{value:wrong},{value:structuredClone(model)}];
 assert.ok(submitted(task,model,{attempts},context));
 assert.equal(submitted(task,model,{attempts:[{value:wrong}]},context),null);
 assert.equal(submitted(task,wrong,{attempts},context),null);
 assert.equal(submitted(task,model,{attempts:[]},context),null);
});
test('P003 rejects final-answer-only, forged rule, missing history and field snapshots',()=>{
 const {task,model}=fixture();
 const edits=[
  m=>{m.history=[];},m=>{m.history.pop();},
  m=>{m.history[0].a='run';},m=>{m.history[0].unexpected=1;},
  m=>{m.history[1].f.answer='999';},m=>{m.history[1].d.index='0';},
  m=>{m.history[1].f.offset='1';},m=>{m.history[1].f.n='1';},
  m=>{m.history[1].f.divisor='0';},m=>{m.history[1].f.multiplier='25';},
  m=>{m.board.records.pop();},m=>{m.board.rule=[25,0,1];},
  m=>{m.board.first=['25','0','1'];},m=>{m.issue='bad';},
  m=>{m.answer='1e2';},m=>{m.multiplier='25';},
  m=>{m.history[3].f.answer='399';},m=>{m.history[3].f.n='100';},
  m=>{m.history.push({...m.history[3],a:'predict'});}
 ];
 for(const edit of edits)
  assert.equal(replay(task,changed(model,edit),context),null,edit.toString());
});
test('P003 excludes other native position, bridge, task clone and misleading affine rule',()=>{
 const {task,model}=fixture();
 for(const badContext of [{sessionId:'percentpatterns',index:1},
   {sessionId:'percentpatterns',index:'0'}, {sessionId:'derivepatterns',index:0},null]){
  assert.equal(binding(task,badContext),null);
  assert.equal(replay(task,model,badContext),null);
 }
 for(const t of [{...task,prompt:task.prompt+' '},{...task,inputs:[4,7,17]},
   {...task,exampleRule:[25,0,1]},sessionTaskFor('percentpatterns',1)]){
  assert.equal(binding(t,context),null);
  assert.equal(replay(t,model,context),null);
 }
 // The original grader accepts any equivalent formula; that is not evidence
 // of observing the specified times-100 / divide-4 operation.
 const alternative=original.initial(task);
 alternative.multiplier='25';alternative.offset='0';alternative.divisor='1';
 original.act(task,alternative,'b17-rule');
 for(const n of [4,7,16]){
  alternative.n=String(n);alternative.answer=String(n*25);
  original.act(task,alternative,'b17-run');
 }
 assert.equal(original.inspect(task,alternative).correct,true);
 assert.equal(replay(task,alternative,context),null);
});
