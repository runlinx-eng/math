// #270 independently reviewed source admission; no bridge inherits native evidence.
import test from 'node:test';
import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {LESSONS} from '../dist/learning/catalog.js';
import {BRIDGES,sessionTaskFor,sessionTasks} from '../dist/learning/bridges.js';
import * as original from '../dist/learning/phase5/b31-model.js';
import {cupfillBinding,replayCupfillEvidence} from '../dist/learning/cupfill-evidence.js';
import {taskFingerprint} from '../scripts/audit-evidence-expansion.mjs';

const selected=[['comparecap',2,200,1],['comparecap',3,100,1],
 ['cupmeasure',0,1000,1],['cupmeasure',1,1000,2]];
const eligible=new Set(selected.map(([id,index])=>id+':'+index));

test('#270 independently reviewed four existing B31 source positions, no invented task',()=>{
 assert.equal(eligible.size,4);
 assert.deepEqual(new Set(selected.map(([id])=>LESSONS[id].topicId)).size,2);
 for(const [id,index,goal,unitCount] of selected){
  assert.ok(Object.hasOwn(LESSONS,id));
  assert.equal(Object.hasOwn(BRIDGES,id),false);
  const t=sessionTaskFor(id,index);
  assert.equal(t.type,'x-m31-fill');
  assert.equal(t.goal,goal);
  assert.equal(t.requiredUnits.length,unitCount);
  assert.equal(t.unit,'mL');
  assert.ok(t.requiredUnits.every(k=>t.units.some(u=>u.id===k&&goal%u.amount===0)));
  const before=JSON.stringify(t);
  const m=original.initial(t);
  assert.ok(original.valid(t,m));
  assert.equal(original.inspect(t,m).correct,false);
  const bind=cupfillBinding(t,{sessionId:id,index});
  assert.equal(bind.nodeId,LESSONS[id].topicId);
  assert.equal(bind.method,null);
  assert.equal(JSON.stringify(t),before);
 }
});
test('#270 same widget type is not enough to admit another native or bridge',()=>{
 for(const id of Object.keys(LESSONS))for(const [index,t] of (sessionTasks(id)||[]).entries()){
  if(t?.type!=='x-m31-fill')continue;
  const bound=!!cupfillBinding(t,{sessionId:id,index});
  assert.equal(bound,eligible.has(id+':'+index),id+':'+index);
 }
 for(const id of Object.keys(BRIDGES))for(const [index,t] of (sessionTasks(id)||[]).entries()){
  if(t?.type!=='x-m31-fill')continue;
  assert.equal(cupfillBinding(t,{sessionId:id,index}),null);
 }
});
test('#270 source scope and real replay remain separate from A admission',()=>{
 const t=sessionTaskFor('cupmeasure',1),example=original.example(t);
 assert.ok(replayCupfillEvidence(t,example,{sessionId:'cupmeasure',index:1}));
 assert.equal(replayCupfillEvidence(t,example,{sessionId:'comparecap',index:1}),null);
 assert.equal(replayCupfillEvidence(t,example,{sessionId:'cupmeasure',index:0}),null);
});

test('#270 the immutable reviewed source manifest admits only the four native positions',()=>{
 const manifest=JSON.parse(readFileSync(new URL('../docs/spatial-learning/evidence-review-manifest.json',import.meta.url)));
 const actual=selected.map(([sessionId,index])=>({sessionId,index,type:'x-m31-fill',
  nodeId:LESSONS[sessionId].topicId,adapter:'cupfill',
  taskHash:taskFingerprint(sessionTaskFor(sessionId,index)),method:null}));
 assert.equal(manifest.tasks.filter(row=>row.adapter==='cupfill').length,4);
 for(const row of actual)assert.deepEqual(manifest.tasks.find(x=>x.adapter==='cupfill'&&
  x.sessionId===row.sessionId&&x.index===row.index),row);
});
