import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {sessionTaskFor} from '../dist/learning/bridges.js';
import {act,initial} from '../dist/learning/phase5/b26-model.js';
import {P055_SOURCES,p055RightTriangleConditionBinding,replayP055RightTriangleConditionEvidence,submittedP055RightTriangleConditionEvidence} from '../dist/learning/p055-right-triangle-condition-evidence.js';

const [source]=P055_SOURCES;
const {sessionId,index}=source;
const context={sessionId,index};
const task=sessionTaskFor(sessionId,index);
const click=(m,a,i)=>act(task,m,'g26-'+a,{index:i});
const replay=m=>replayP055RightTriangleConditionEvidence(task,m,context);

test('P055 locks exact source shapes, question and position',()=>{
  const order=v=>Array.isArray(v)?v.map(order):v&&typeof v==='object'
    ?Object.fromEntries(Object.keys(v).sort((a,b)=>a.localeCompare(b,'en')).map(k=>[k,order(v[k])])):v;
  assert.equal(createHash('sha256').update(JSON.stringify(order(task))).digest('hex'),source.taskHash);
  assert.ok(p055RightTriangleConditionBinding(task,context));
  assert.equal(p055RightTriangleConditionBinding(task,{sessionId,index:-1}),null);
  assert.equal(p055RightTriangleConditionBinding({...task,shapes:[...task.shapes].reverse()},context),null);
});

test('P055 requires both inspections and the triangle with perpendicular adjacent sides',()=>{
  const m=initial(task,1);
  m.answers[0]='right';
  click(m,'probe',0);
  click(m,'choose',0);
  assert.equal(replay(m),null);
  click(m,'probe',1);
  click(m,'choose',1);
  assert.equal(replay(m),null);
  const wrong=structuredClone(m);
  click(m,'choose',0);
  assert.deepEqual(replay(m)?.angleProducts,[[0,16,9],[8,8,5]]);
  assert.equal(submittedP055RightTriangleConditionEvidence(task,m,{attempts:[{value:wrong}]},context),null);
  assert.ok(submittedP055RightTriangleConditionEvidence(task,m,{attempts:[{value:m}]},context));
  m.answers[0]='all';
  assert.equal(replay(m),null);
});
