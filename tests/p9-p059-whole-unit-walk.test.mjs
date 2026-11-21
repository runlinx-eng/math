import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {sessionTaskFor} from '../dist/learning/bridges.js';
import {act, initial, inspect} from '../dist/learning/phase5/b16-model.js';
import {P059_SOURCES,p059WholeUnitWalkBinding,replayP059WholeUnitWalkEvidence,submittedP059WholeUnitWalkEvidence} from '../dist/learning/p059-whole-unit-walk-evidence.js';

const [source] = P059_SOURCES;
const {sessionId,index} = source;
const context = {sessionId,index};
const task = sessionTaskFor(sessionId,index);
const replay = m => replayP059WholeUnitWalkEvidence(task,m,context);
function walk(partition = true) {
  const m = initial(task);
  m.parts = '1';
  if (partition) act(task,m,'partition');
  for (let i=0; i<5; i++) act(task,m,'walk');
  m.answer = '5/1';
  return m;
}

test('P059 binds only the exact native denominator-one task', () => {
  const ordered = Object.fromEntries(Object.entries(task).sort(([a],[b])=>a.localeCompare(b,'en')));
  assert.equal(createHash('sha256').update(JSON.stringify(ordered)).digest('hex'),source.taskHash);
  assert.ok(p059WholeUnitWalkBinding(task,context));
  for (const index of [-1,1,'0']) assert.equal(p059WholeUnitWalkBinding(task,{sessionId,index}),null);
  assert.equal(p059WholeUnitWalkBinding({...task,n:4},context),null);
});

test('P059 replays one whole per click and keeps an actual retreat', () => {
  const m = walk();
  act(task,m,'walk-back');
  act(task,m,'walk');
  const proof = replay(m);
  assert.deepEqual(proof?.end,[5,1]);
  assert.equal(proof.history.current.retreats,1);
  assert.deepEqual(proof.history.current.steps[5],{delta:-1,from:[5,1],to:[4,1]});
});

test('P059 requires an explicit recorded unit and the requested fraction representation', () => {
  assert.equal(inspect(task,walk(false)).correct,true);
  assert.equal(replay(walk(false)),null);
  const m = walk();
  const good = structuredClone(m);
  m.answer = '10/2';
  assert.equal(inspect(task,m).correct,true);
  assert.equal(replay(m),null);
  m.answer = '5/1';
  assert.equal(submittedP059WholeUnitWalkEvidence(task,m,{attempts:[{value:{...m,answer:'5/2'}}]},context),null);
  assert.deepEqual(submittedP059WholeUnitWalkEvidence(task,m,{attempts:[{value:good}]},context)?.end,[5,1]);
  m.history.pop();
  assert.equal(replay(m),null);
});
