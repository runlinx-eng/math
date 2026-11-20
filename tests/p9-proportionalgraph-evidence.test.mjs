import test from 'node:test';
import assert from 'node:assert/strict';
import {LESSONS} from '../dist/learning/catalog.js';
import {BRIDGES,sessionTaskFor,sessionTasks} from '../dist/learning/bridges.js';
import * as native from '../dist/learning/phase5/b16-model.js';
import {proportionalGraphBinding,replayProportionalGraphEvidence} from '../dist/learning/proportionalgraph-evidence.js';

const cases=[
 {sessionId:'proportion37',index:3,nodeId:'mt_5mIcmKRCgA'},
 {sessionId:'proportionGraph37',index:0,nodeId:'mt_FspV_imUGK'}
];
const task=c=>sessionTaskFor(c.sessionId,c.index);
const proof=(c,m)=>replayProportionalGraphEvidence(task(c),m,c);
const point=(t,m,x,y)=>{m.x=String(x);m.y=String(y);native.act(t,m,'b16-plot');};
test('#298 two source-bound original graph tasks use actual point events, not drawn line pixels',()=>{
 for(const c of cases){
  const t=task(c),m=native.example(t),before=JSON.stringify(m);
  assert.equal(LESSONS[c.sessionId].topicId,c.nodeId);
  assert.deepEqual(t.data,[[0,0],[1,2],[2,4],[3,6],[4,8]]);
  assert.equal(proportionalGraphBinding(t,c)?.nodeId,c.nodeId);
  assert.equal(native.inspect(t,m).correct,true);
  const p=proof(c,m);assert.ok(p,c.sessionId);
  assert.equal(p.nodeId,c.nodeId);
  assert.equal(p.construction.unitRate,'2');
  assert.equal(p.construction.unitSteps.length,4);
  assert.equal(p.construction.origin[0],0);
  assert.equal(p.generalOriginProofAssessed,false);
  assert.equal(p.independentRuleDiscoveryAssessed,false);
  assert.equal(JSON.stringify(m),before,'replay must never change learning records');
 }
});
test('#298 a wrong point, re-placement and original first attempt are preserved',()=>{
 for(const c of cases){
  const t=task(c),m=native.initial(t);
  point(t,m,0,1);
  assert.equal(proof(c,m),null);
  point(t,m,0,0);
  for(let i=1;i<=4;i++)point(t,m,i,2*i);
  m.answer='2';m.reason='per-x';
  assert.equal(native.inspect(t,m).correct,true);
  const p=proof(c,m);assert.ok(p);
  assert.deepEqual(p.construction.incorrectIndices,[0]);
  assert.deepEqual(p.construction.firstPointAttempt,{x:0,y:1});
  assert.equal(p.construction.replacements.length,1);
  assert.deepEqual(p.construction.replacements[0].previous,[0,1]);
  assert.deepEqual(p.construction.replacements[0].next,[0,0]);
  const forged=structuredClone(m);forged.history[0].data.fields.y='2';
  assert.equal(proof(c,forged),null,'modified original event fails source replay');
  const deleted=structuredClone(m);deleted.history.shift();
  assert.equal(proof(c,deleted),null);
  const altered={...t,prompt:t.prompt+' synthetic'};
  assert.equal(replayProportionalGraphEvidence(altered,m,c),null);
  assert.equal(proof(c,{...m,history:[]}),null);
  assert.equal(proof(c,{...m,reason:'sum'}),null);
 }
});
test('#298 original reset retains first attempt but requires a fresh five-point construction',()=>{
 for(const c of cases){
  const t=task(c),m=native.initial(t);
  point(t,m,3,7);
  native.act(t,m,'b16-reset');
  for(let i=0;i<5;i++)point(t,m,i,2*i);
  m.answer='2';m.reason='per-x';
  assert.equal(native.inspect(t,m).correct,true);
  const p=proof(c,m);assert.ok(p);
  assert.deepEqual(p.construction.resets,[1]);
  assert.deepEqual(p.construction.firstPointAttempt,{x:3,y:7});
  assert.deepEqual(p.construction.incorrectIndices,[0]);
 }
});
test('#298 practice, bridge, nonzero-intercept and other graphpoint sources remain excluded',()=>{
 const allowed=new Set(cases.map(c=>c.sessionId+':'+c.index));
 for(const id of Object.keys(LESSONS))
  for(const [index,t] of (sessionTasks(id)||[]).entries())
   if(t.type==='x-graphpoints')
    assert.equal(!!proportionalGraphBinding(t,{sessionId:id,index}),allowed.has(id+':'+index),id+':'+index);
 for(const id of Object.keys(BRIDGES))
  for(const [index,t] of (sessionTasks(id)||[]).entries())
   if(t.type==='x-graphpoints')
    assert.equal(proportionalGraphBinding(t,{sessionId:id,index}),null,'bridge '+id+':'+index);
 for(const c of cases){
  assert.equal(proportionalGraphBinding(task(c)),null);
  assert.equal(proportionalGraphBinding(task(c),{...c,index:0}),null);
  assert.equal(proportionalGraphBinding(task(c),{sessionId:'linear36',index:0}),null);
 }
});
