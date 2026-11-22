import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareSessionRuntime} from '../dist/learning/phase4/async-batches.js';
import {sessionTaskFor} from '../dist/learning/bridges.js';
import {taskFingerprint} from '../scripts/audit-evidence-expansion.mjs';
import {ISSUE343_NEXT95_ADAPTERS,ISSUE343_NEXT95_FROZEN_SOURCES}
 from '../dist/learning/issue343-a214-next95-candidates.js';
test('21 remaining frozen B39 families are 95 individually locked native tasks',async()=>{
 assert.equal(ISSUE343_NEXT95_ADAPTERS.length,21);
 assert.equal(ISSUE343_NEXT95_FROZEN_SOURCES.length,95);
 const seen=new Set();
 for(const family of ISSUE343_NEXT95_ADAPTERS){
  for(const source of family.sources){
   const key=source.sessionId+':'+source.index;
   assert.equal(seen.has(key),false,key);seen.add(key);
   await prepareSessionRuntime(source.sessionId);
   const task=sessionTaskFor(source.sessionId,source.index);
   assert.equal(task?.type,source.type,key);
   assert.equal(taskFingerprint(task),source.taskHash,key);
   const binding=family.binding(task,source);
   assert.equal(binding?.nodeId,source.nodeId,key);
   assert.equal(binding?.strictAApproved,false,key);
   assert.equal(family.binding(task,{...source,index:source.index+100000}),null,key);
   assert.equal(family.binding({...task,prompt:(task.prompt||'')+'!'},source),null,key);
  }
 }
 assert.equal(seen.size,95);
});
