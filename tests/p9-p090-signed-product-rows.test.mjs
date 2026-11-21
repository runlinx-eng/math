import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {BRIDGES, sessionTaskFor} from '../dist/learning/bridges.js';
import {ensureB39Ready} from '../dist/learning/phase4/async-batches.js';
import * as original from '../dist/learning/phase5/b15-model.js';
import {
  P090_SOURCES,
  p090SignedProductRowsBinding,
  replayP090SignedProductRowsEvidence,
  submittedP090SignedProductRowsEvidence
} from '../dist/learning/p090-signed-product-rows-evidence.js';

const cases = P090_SOURCES.map((source,i) => {
  const {sessionId,index} = source;
  return {source,context:{sessionId,index},task:sessionTaskFor(sessionId,index),
    results:[[-6,-3,0,3,6],[12,-12,-12,12,0],[4,-4,-4,4]][i]};
});

function ordered(value) {
  if (Array.isArray(value)) return value.map(ordered);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort((a,b) => a.localeCompare(b,'en'))
      .map(key => [key,ordered(value[key])]));
  }
  return value;
}

const replay = (row,model) => replayP090SignedProductRowsEvidence(row.task,model,row.context);
const submit = (row,model,...versions) => submittedP090SignedProductRowsEvidence(row.task,model,
  {attempts:versions.map(value => ({value:structuredClone(value)}))},row.context);

function add(row,model,value) {
  model.result = String(value);
  original.act(row.task,model,'b15-sign');
}

function complete(row,model = original.initial(row.task)) {
  for (const value of row.results) add(row,model,value);
  if (row.task.reason) model.reason = row.task.reason;
  return model;
}

test('P090 locks the three original task fingerprints and node positions', () => {
  for (const {source,task,context} of cases) {
    assert.equal(createHash('sha256').update(JSON.stringify(ordered(task))).digest('hex'),source.taskHash);
    assert.equal(p090SignedProductRowsBinding(task,context)?.nodeId,source.nodeId);
    assert.equal(p090SignedProductRowsBinding({...task,mode:'replaced'},context),null);
    assert.equal(p090SignedProductRowsBinding(task,{...context,index:String(context.index)}),null);
  }
});

test('P090 derives the change across zero by removing one negative factor amount', () => {
  const [row] = cases;
  const model = complete(row), before = structuredClone(model);
  const proof = replay(row,model);
  assert.deepEqual(proof?.rows.map(r => r.value),row.results);
  assert.deepEqual(proof?.rows.map(r => r.change),[null,3,3,3,3]);
  assert.equal(proof?.reason,'plus3');
  assert.deepEqual(model,before);
  model.reason = 'minus3';
  assert.equal(replay(row,model),null);
});

test('P090 distinguishes magnitudes, signs and the product involving zero', () => {
  const [,row] = cases;
  const model = original.initial(row.task);
  add(row,model,-12);
  const proof = replay(row,complete(row,model));
  assert.deepEqual(proof?.rows.map(r => [r.magnitude,r.value]),
    [[12,12],[12,-12],[12,-12],[12,12],[0,0]]);
  assert.equal(Object.is(proof.rows.at(-1).value,-0),false);
  assert.deepEqual(proof.attempts[0],{row:0,raw:'-12',expected:12,accepted:false});
});

test('P090 can reconstruct all divisions as inverse multiplication', () => {
  const [,,row] = cases;
  const proof = replay(row,complete(row));
  assert.deepEqual(proof?.rows.map(r => r.value),row.results);
  assert.deepEqual(proof?.rows.map(r => r.inverseProduct),[12,12,-12,-12]);
});

test('P090 requires actual current rows and a fresh Check through a real reset', () => {
  for (const row of cases) {
    const model = original.initial(row.task);
    for (const value of row.results.slice(0,-1)) add(row,model,value);
    const partial = structuredClone(model);
    add(row,model,row.results.at(-1));
    if (row.task.reason) model.reason = row.task.reason;
    assert.equal(submit(row,model,partial),null);
    assert.equal(submit(row,model,partial,model)?.rows.length,row.results.length);
    const checked = structuredClone(model);
    original.act(row.task,model,'b15-reset');
    assert.equal(replay(row,model),null);
    complete(row,model);
    assert.equal(replay(row,model)?.resets,1);
    assert.equal(submit(row,model,checked),null);
  }
});

test('P090 rejects altered operations or forged later rows', () => {
  const row = cases[1];
  for (const change of [
    m => { m.history.length = 0; },
    m => { m.history[0].data.index = 0; },
    m => { m.board.rows[1].value = 12; },
    m => add(row,m,0),
    m => original.act(row.task,m,'b15-build')
  ]) {
    const model = complete(row);
    change(model);
    assert.equal(replay(row,model),null,change.toString());
  }
});

test('P090 excludes practice, bridges and the duplicate mixed-lesson positions', async () => {
  await ensureB39Ready();
  for (const {task,context} of cases) {
    assert.equal(p090SignedProductRowsBinding(task,{...context,index:-1}),null);
    for (const index of [10,11]) {
      assert.equal(p090SignedProductRowsBinding(task,{sessionId:'fractionfour',index}),null);
    }
    for (const [id,bridge] of Object.entries(BRIDGES)) {
      for (const [index,related] of bridge.tasks.entries()) {
        if (related?.type === task.type) assert.equal(p090SignedProductRowsBinding(related,{sessionId:id,index}),null);
      }
    }
  }
});
