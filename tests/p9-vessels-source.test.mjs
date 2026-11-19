// #256: source-bound contract; bridge examples never inherit strict eligibility.
import test from 'node:test';
import assert from 'node:assert/strict';
import {LESSONS} from '../dist/learning/catalog.js';
import {BRIDGES,sessionTasks} from '../dist/learning/bridges.js';
import {defaultModel,validModel,inspect} from '../dist/learning/tasks.js';
import * as model from '../dist/learning/phase5/b28-model.js';
import {ensureB39Ready} from '../dist/learning/phase4/async-batches.js';
await ensureB39Ready();

const reviewed=Object.freeze([
 {sessionId:'indirectmass',index:1},
 {sessionId:'ordermeasure',index:1},
 {sessionId:'precisionunits',index:1}
]);
const sourceKey=({sessionId,index})=>sessionId+':'+index;

test('#256: the candidate is exactly three real native measurement sources',()=>{
 assert.equal(new Set(reviewed.map(sourceKey)).size,3);
 assert.equal(new Set(reviewed.map(({sessionId})=>LESSONS[sessionId]?.topicId)).size,3);
 for(const {sessionId,index} of reviewed){
  assert.ok(Object.hasOwn(LESSONS,sessionId),sessionId+' is an original lesson');
  assert.equal(Object.hasOwn(BRIDGES,sessionId),false);
  const t=sessionTasks(sessionId)[index];
  assert.equal(t.type,'x-m28-vessels',sourceKey({sessionId,index}));
  assert.ok(Array.isArray(t.capacities)&&t.capacities.every(n=>Number.isSafeInteger(n)&&n>0));
  assert.ok(Array.isArray(t.units)&&t.units.every(u=>u.amount>0&&u.id));
  assert.ok(['order','precision'].includes(t.mode));
  const fresh=defaultModel(t);
  assert.ok(validModel(t,fresh));
  assert.equal(typeof inspect(t,fresh).correct,'boolean');
  assert.ok(model.TYPES.has(t.type));
 }
});

test('#256: equal widget type does not grant bridge or unrelated-course A status',()=>{
 const eligible=new Set(reviewed.map(sourceKey));
 const native=Object.keys(LESSONS).flatMap(sessionId=>
  sessionTasks(sessionId).map((task,index)=>({sessionId,index,type:task.type})));
 const actual=native.filter(item=>item.type==='x-m28-vessels').map(sourceKey);
 assert.deepEqual(actual.sort(),[...eligible].sort());
 const reused=Object.keys(BRIDGES).flatMap(sessionId=>
  sessionTasks(sessionId).map((task,index)=>({sessionId,index,type:task.type})))
  .filter(x=>x.type==='x-m28-vessels');
 assert.equal(reused.length,3,'3 related bridge tasks remain independently classified');
 assert.ok(reused.every(x=>!eligible.has(sourceKey(x))));
});

test('#256: original task and model input are not mutated by the source audit',()=>{
 for(const {sessionId,index} of reviewed){
  const t=sessionTasks(sessionId)[index];
  const before=JSON.stringify(t),m=defaultModel(t);
  assert.equal(model.valid(t,m),true);
  assert.equal(JSON.stringify(t),before);
 }
});
