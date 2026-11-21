import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {BRIDGES, sessionTaskFor} from '../dist/learning/bridges.js';
import {ensureB39Ready} from '../dist/learning/phase4/async-batches.js';
import * as original from '../dist/learning/phase5/b14-model.js';
import {
  P097_SOURCES,p097SquarePairBinding,
  replayP097SquarePairEvidence,submittedP097SquarePairEvidence
} from '../dist/learning/p097-square-pair-evidence.js';

const [source] = P097_SOURCES;
const {sessionId,index} = source;
const context = {sessionId,index};
const task = sessionTaskFor(sessionId,index);
const replay = model => replayP097SquarePairEvidence(task,model,context);
const submit = (model,...versions) => submittedP097SquarePairEvidence(task,model,
  {attempts:versions.map(value => ({value:structuredClone(value)}))},context);

function place(model,a,b) {
  model.sideA = String(a);
  model.sideB = String(b);
  original.act(task,model,'b14-square');
}

function work() {
  const model = original.initial(task);
  place(model,0,10);
  place(model,6,7);
  place(model,6,8);
  return model;
}

test('P097 locks the actual square-pair task and entire source fingerprint', () => {
  assert.equal(P097_SOURCES.length,1);
  const ordered = Object.fromEntries(Object.entries(task).sort(([a],[b]) => a.localeCompare(b,'en')));
  assert.equal(createHash('sha256').update(JSON.stringify(ordered)).digest('hex'),source.taskHash);
  assert.equal(p097SquarePairBinding(task,context)?.nodeId,source.nodeId);
  assert.equal(p097SquarePairBinding({...task,total:85},context),null);
  assert.equal(p097SquarePairBinding({...task,prompt:'changed'},context),null);
  assert.equal(p097SquarePairBinding(task,{...context,index:'3'}),null);
});

test('P097 distinguishes a zero side, insufficient sum and correct pair', () => {
  const model = work(), before = structuredClone(model);
  assert.equal(original.inspect(task,model).correct,true);
  const proof = replay(model);
  assert.equal(proof.target,100);
  assert.deepEqual(proof.squares,[{side:6,area:36},{side:8,area:64}]);
  assert.deepEqual(proof.attempts.map(a => [a.sum,a.recorded,a.accepted]),
    [[100,false,false],[85,true,false],[100,true,true]]);
  assert.deepEqual(model,before);
  place(model,8,6);
  assert.deepEqual(replay(model)?.squares,[{side:8,area:64},{side:6,area:36}]);
});

test('P097 requires a genuine current placement and latest matching Check', () => {
  const model = work(), accepted = structuredClone(model);
  place(model,6,7);
  const wrong = structuredClone(model);
  assert.equal(replay(model),null);
  model.sideB = '8';
  assert.ok(original.inspect(task,model).correct);
  assert.equal(replay(model),null);
  place(model,6,8);
  assert.equal(submit(model,accepted),null);
  assert.equal(submit(model,wrong),null);
  assert.equal(submit(model,wrong,model)?.target,100);
  assert.equal(submit(model,model,wrong),null);
});

test('P097 rejects forged side snapshots, hidden positions and fabricated attempts', () => {
  for (const change of [
    m => { m.history.length=0; },
    m => { m.history.at(-1).data.fields.sideA='06'; },
    m => { m.history.at(-1).data.side=0; },
    m => { m.board.trials[0][1]=8; },
    m => { m.board.pair=[10,0]; },
    m => original.act(task,m,'b14-undo')
  ]) {
    const model = work();
    change(model);
    assert.equal(replay(model),null,change.toString());
  }
});

test('P097 excludes prior divisor questions, old practice and real bridges', async () => {
  await ensureB39Ready();
  assert.equal(p097SquarePairBinding(task,{...context,index:-1}),null);
  assert.equal(p097SquarePairBinding(task,{...context,index:2}),null);
  assert.equal(p097SquarePairBinding(sessionTaskFor(sessionId,2),context),null);
  for (const [id,bridge] of Object.entries(BRIDGES)) {
    for (const [i,related] of bridge.tasks.entries()) {
      if (related?.type === task.type) assert.equal(p097SquarePairBinding(related,{sessionId:id,index:i}),null);
    }
  }
});
