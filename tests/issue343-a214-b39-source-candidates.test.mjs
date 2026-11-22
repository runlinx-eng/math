import test from 'node:test';
import assert from 'node:assert/strict';
import {ensureB39Ready} from '../dist/learning/phase4/async-batches.js';
import {sessionTaskFor} from '../dist/learning/bridges.js';
import {ISSUE343_B39_FIRST4_ADAPTERS} from '../dist/learning/issue343-a214-b39-candidates.js';
import {taskFingerprint} from '../scripts/audit-evidence-expansion.mjs';
await ensureB39Ready();
test('B39 four candidates are strictly source/position locked, and never self-approved',()=>{
 assert.equal(ISSUE343_B39_FIRST4_ADAPTERS.length,4);
 const found=new Set();
 for(const family of ISSUE343_B39_FIRST4_ADAPTERS){
  assert.equal(family.sources.length,1);
  const source=family.sources[0],task=sessionTaskFor(source.sessionId,source.index);
  assert.equal(taskFingerprint(task),source.taskHash,source.position);
  const match=family.binding(task,source);
  assert.equal(match?.nodeId,source.nodeId);
  assert.equal(match?.strictAApproved,false);
  assert.equal(match?.method,null);
  assert.equal(family.binding(task,{...source,index:source.index-1}),null);
  assert.equal(family.binding({...task,prompt:task.prompt+'!' },source),null);
  assert.equal(found.has(source.position),false);
  found.add(source.position);
 }
 assert.deepEqual([...found].sort(),['representations39:2','representations39:3','structure39:2','structure39:3']);
});
