import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {sessionTaskFor} from '../dist/learning/bridges.js';
import {act,initial} from '../dist/learning/phase5/b19-model.js';
import {P053_SOURCES,p053DataKindOrderBinding,replayP053DataKindOrderEvidence,submittedP053DataKindOrderEvidence} from '../dist/learning/p053-data-kind-order-evidence.js';
const [source]=P053_SOURCES;
const {sessionId,index}=source,context={sessionId,index},task=sessionTaskFor(sessionId,index);
const types=['nominal','ordinal','nominal'];
const replay=m=>replayP053DataKindOrderEvidence(task,m,context);

test('P053 locks the three original cards and rejects practice',()=>{
  const sorted=v=>Array.isArray(v)?v.map(sorted):v&&typeof v==='object'
    ?Object.fromEntries(Object.keys(v).sort((a,b)=>a.localeCompare(b,'en')).map(k=>[k,sorted(v[k])])):v;
  assert.equal(createHash('sha256').update(JSON.stringify(sorted(task))).digest('hex'),source.taskHash);
  assert.ok(p053DataKindOrderBinding(task,context));
  assert.equal(p053DataKindOrderBinding(task,{sessionId,index:-1}),null);
});
test('P053 requires both classification and the distinction between order and equal intervals',()=>{
  const m=initial(task);
  types.forEach((kind,index)=>act(task,m,'b19-kind',{kind,index}));
  m.orderReason='order';m.precisionReason='equal';
  act(task,m,'b19-classify');
  const wrong=structuredClone(m);
  m.precisionReason='not-equal';
  assert.equal(replay(m),null);
  act(task,m,'b19-classify');
  assert.deepEqual(replay(m)?.submissions.map(s=>s.accepted),[false,true]);
  assert.equal(submittedP053DataKindOrderEvidence(task,m,{attempts:[{value:wrong}]},context),null);
  assert.ok(submittedP053DataKindOrderEvidence(task,m,{attempts:[{value:m}]},context));
});
