import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {sessionTaskFor} from '../dist/learning/bridges.js';
import {act,initial} from '../dist/learning/phase5/b25-model.js';
import {P054_SOURCES,p054OppositeSideMarksBinding,replayP054OppositeSideMarksEvidence,submittedP054OppositeSideMarksEvidence} from '../dist/learning/p054-opposite-side-marks-evidence.js';

const [source]=P054_SOURCES;
const {sessionId,index}=source;
const context={sessionId,index}, task=sessionTaskFor(sessionId,index);
const step=(m,index)=>act(task,m,'g25-markSide',{index});
const replay=m=>replayP054OppositeSideMarksEvidence(task,m,context);

test('P054 verifies the original hash and rejects a different task slot',()=>{
  const order=v=>Array.isArray(v)?v.map(order):v&&typeof v==='object'
    ?Object.fromEntries(Object.keys(v).sort((a,b)=>a.localeCompare(b,'en')).map(k=>[k,order(v[k])])):v;
  assert.equal(createHash('sha256').update(JSON.stringify(order(task))).digest('hex'),source.taskHash);
  assert.ok(p054OppositeSideMarksBinding(task,context));
  assert.equal(p054OppositeSideMarksBinding(task,{sessionId,index:-1}),null);
});

test('P054 distinguishes adjacent from opposite sides, cycles marks and requires a fresh Check',()=>{
  const m=initial(task,1);
  m.answers[0]='equal';
  [0,1,2,3].forEach(i=>step(m,i));
  const wrong=structuredClone(m);
  assert.equal(replay(m),null);
  [1,3].forEach(i=>step(m,i));
  assert.deepEqual(replay(m)?.marks,[1,2,1,2]);
  assert.equal(submittedP054OppositeSideMarksEvidence(task,m,{attempts:[{value:wrong}]},context),null);
  assert.ok(submittedP054OppositeSideMarksEvidence(task,m,{attempts:[{value:m}]},context));
  step(m,3);
  assert.equal(replay(m),null);
  step(m,3);
  step(m,3);
  assert.deepEqual(replay(m)?.marks,[1,2,1,2]);
  m.answers[0]='angle';
  assert.equal(replay(m),null);
});
