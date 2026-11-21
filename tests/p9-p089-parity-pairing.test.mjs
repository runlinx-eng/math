import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {BRIDGES, sessionTaskFor} from '../dist/learning/bridges.js';
import {ensureB39Ready} from '../dist/learning/phase4/async-batches.js';
import * as original from '../dist/learning/phase5/b14-model.js';
import {
  P089_SOURCES,
  p089ParityPairingBinding,
  replayP089ParityPairingEvidence,
  submittedP089ParityPairingEvidence
} from '../dist/learning/p089-parity-pairing-evidence.js';

const cases = P089_SOURCES.map((source,i) => {
  const {sessionId,index} = source;
  return {source,context:{sessionId,index},task:sessionTaskFor(sessionId,index),
    answer:i === 3 ? 'odd' : 'even',reason:['two','two','whole','one'][i],
    totalPairs:[6,238,111,8][i]};
});
const replay = (row,model) => replayP089ParityPairingEvidence(row.task,model,row.context);
const submit = (row,model,...versions) => submittedP089ParityPairingEvidence(row.task,model,
  {attempts:versions.map(value => ({value:structuredClone(value)}))},row.context);
const act = (row,model,action) => original.act(row.task,model,'b14-'+action);

function complete(row,model = original.initial(row.task)) {
  if (!model.board.first) {
    model.prediction = row.answer === 'odd' ? 'even' : 'odd';
    act(row,model,'predict');
  }
  act(row,model,'join');
  model.answer = row.answer;
  model.reason = row.reason;
  return model;
}

test('P089 binds all four exact original prompts and their fingerprints', () => {
  for (const {source,task,context} of cases) {
    const ordered = Object.fromEntries(Object.entries(task).sort(([a],[b]) => a.localeCompare(b,'en')));
    assert.equal(createHash('sha256').update(JSON.stringify(ordered)).digest('hex'),source.taskHash);
    assert.equal(p089ParityPairingBinding(task,context)?.nodeId,source.nodeId);
    assert.equal(p089ParityPairingBinding({...task,a:task.a+2},context),null);
    assert.equal(p089ParityPairingBinding(task,{...context,index:String(context.index)}),null);
  }
});

test('P089 distinguishes the leftovers and the pairs already formed by two piles', () => {
  for (const index of [0,1,3]) {
    const row = cases[index], model = complete(row), before = structuredClone(model);
    const proof = replay(row,model);
    assert.equal(proof?.totalPairs,row.totalPairs);
    assert.equal(proof?.extraPairs,index === 3 ? 0 : 1);
    assert.equal(proof?.leftovers,index === 3 ? 1 : 0);
    assert.deepEqual(proof?.piles.map(p => p.leftover),index === 3 ? [1,0] : [1,1]);
    assert.equal(proof?.predictionAgrees,false);
    assert.deepEqual(model,before);
  }
});

test('P089 reconstructs three pairs of whole groups and 37 matched positions per pair', () => {
  const row = cases[2], proof = replay(row,complete(row));
  assert.equal(proof?.groupPairs,3);
  assert.equal(proof?.perGroup,37);
  assert.equal(proof?.totalPairs,111);
  assert.equal(proof?.leftovers,0);
  assert.equal(proof?.reason,'whole');
});

test('P089 requires prediction, pairing, the reason and a fresh Check', () => {
  for (const row of cases) {
    const model = complete(row);
    model.reason = 'none';
    const wrong = structuredClone(model);
    assert.equal(submit(row,model,wrong),null);
    model.reason = row.reason;
    assert.equal(submit(row,model,wrong),null);
    assert.equal(submit(row,model,wrong,model)?.answer,row.answer);
    act(row,model,'reset');
    assert.equal(replay(row,model),null);
    act(row,model,'join');
    assert.equal(replay(row,model)?.resets,1);
    assert.equal(replay(row,model)?.prediction,wrong.prediction);
  }
});

test('P089 distinguishes a blank prediction from a saved guess and excludes forged actions', () => {
  const [row] = cases;
  const model = original.initial(row.task);
  act(row,model,'predict');
  assert.equal(replay(row,model),null);
  complete(row,model);
  assert.equal(replay(row,model)?.actions[0].accepted,false);
  for (const change of [
    m => { m.history.length = 0; },
    m => { m.board.joined = false; },
    m => { m.history[2].data.index = 0; },
    m => { m.prediction = 'even'; },
    m => act(row,m,'predict'),
    m => act(row,m,'list')
  ]) {
    const copy = structuredClone(model);
    change(copy);
    assert.equal(replay(row,copy),null,change.toString());
  }
});

test('P089 excludes practice, bridge and other source positions', async () => {
  await ensureB39Ready();
  for (const {task,context} of cases) {
    assert.equal(p089ParityPairingBinding(task,{...context,index:-1}),null);
    assert.equal(p089ParityPairingBinding(task,{...context,sessionId:'factoruse'}),null);
    for (const [id,bridge] of Object.entries(BRIDGES)) {
      for (const [index,related] of bridge.tasks.entries()) {
        if (related?.type === task.type) assert.equal(p089ParityPairingBinding(related,{sessionId:id,index}),null);
      }
    }
  }
});
