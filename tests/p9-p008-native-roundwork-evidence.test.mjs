import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {sessionTaskFor} from '../dist/learning/bridges.js';
import {LESSONS} from '../dist/learning/catalog.js';
import * as native from '../dist/learning/phase5/b08-model.js';
import {P008_ROUNDWORK_SOURCES,p008RoundworkBinding,replayP008RoundworkEvidence,
 submittedP008RoundworkEvidence} from '../dist/learning/p008-native-roundwork-evidence.js';

const stable=value=>Array.isArray(value)?value.map(stable):
 value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort((a,b)=>a.localeCompare(b,'en')).map(k=>[k,stable(value[k])])):value;
const sha=task=>createHash('sha256').update(JSON.stringify(stable(task))).digest('hex');
const copy=x=>structuredClone(x);
const position=s=>s.sessionId+':'+s.index;
test('P008 inventory is exactly 28 source-frozen B08 roundwork tasks, not B07 faces100:2',()=>{
 assert.equal(P008_ROUNDWORK_SOURCES.length,28);
 const positions=P008_ROUNDWORK_SOURCES.map(position);
 assert.equal(new Set(positions).size,28);
 assert.equal(positions.includes('faces100:2'),false);
});
for(const row of P008_ROUNDWORK_SOURCES){
 const context={sessionId:row.sessionId,index:row.index};
 const task=sessionTaskFor(row.sessionId,row.index);
 const replay=model=>replayP008RoundworkEvidence(task,model,context);
 test('P008 '+position(row)+' exact source, decimal math, current state and stale Check',()=>{
  assert.equal(row.type,'x-roundwork');
  assert.equal(LESSONS[row.sessionId].topicId,row.nodeId);
  assert.equal(sha(task),row.taskHash,'complete original task SHA256');
  assert.ok(p008RoundworkBinding(task,context));
  assert.equal(p008RoundworkBinding(task,{sessionId:row.sessionId,index:-1}),null);
  assert.equal(p008RoundworkBinding(task,{sessionId:row.sessionId,index:999}),null);
  assert.equal(p008RoundworkBinding({...task,prompt:task.prompt+'!'},context),null);
  assert.equal(p008RoundworkBinding({...task,unit:'999'},context),null);
  assert.equal(p008RoundworkBinding(task,{sessionId:'link-'+row.sessionId,index:row.index}),null);
  const model=native.example(task),snapshot=JSON.stringify(model);
  assert.equal(native.inspect(task,model).correct,true,'original grader');
  const proof=replay(model);
  assert.ok(proof,'independent decimal replay and bounded observed final state');
  assert.equal(proof.source.taskHash,row.taskHash);
  assert.equal(proof.strictAApproved,false);
  assert.equal(proof.actionSequenceObserved,false);
  assert.equal(JSON.stringify(model),snapshot,'pure replay never changes State-v2');
  const wrong=copy(model);wrong.steps[0].result='-999';
  assert.equal(replay(wrong),null,'wrong mathematical result rejected');
  assert.equal(submittedP008RoundworkEvidence(task,model,{attempts:[{value:wrong}]},context),null,'stale wrong Check');
  assert.deepEqual(submittedP008RoundworkEvidence(task,model,{attempts:[{value:wrong},{value:copy(model)}]},context),proof,'latest matching Check after correction');
  for(const [desc,mutate] of [
    ['missing slider touch',m=>m.steps[0].touched=false],
    ['altered lower station',m=>m.steps[0].low='-3'],
    ['altered upper station',m=>m.steps[0].high='999'],
    ['wrong final slider mark',m=>m.steps[0].mark=(m.steps[0].mark+25)%1001],
    ['forged extra source field',m=>m.issue='approved'],
    ['not all task steps completed',m=>m.steps.pop()],
    ['wrong unit selection',m=>m.unit='999']
  ]){
    const changed=copy(model);mutate(changed);
    assert.equal(replay(changed),null,desc);
  }
  if(task.sf){const changed=copy(model);changed.sig.pop();assert.equal(replay(changed),null,'marked significant digits required');}
  if(task.calc){const changed=copy(model);changed.estimate='1';assert.equal(replay(changed),null,'independent approximate arithmetic');}
  if(task.exact){const changed=copy(model);changed.relation='>';assert.equal(replay(changed),null,'estimate vs exact relation');}
  assert.equal(replay({}),null);
 });
}
test('P008 same-widget sibling and related exercises are never automatically bound',()=>{
 const first=P008_ROUNDWORK_SOURCES[0],context={sessionId:first.sessionId,index:first.index};
 assert.equal(p008RoundworkBinding(sessionTaskFor('estbounds',1),context),null);
 assert.equal(p008RoundworkBinding(sessionTaskFor('roundwhole',0),{sessionId:'roundwhole',index:-1}),null);
});
