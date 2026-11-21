import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {BRIDGES, sessionTaskFor} from '../dist/learning/bridges.js';
import {ensureB39Ready} from '../dist/learning/phase4/async-batches.js';
import * as original from '../dist/learning/phase5/b13-model.js';
import {
  P102_SOURCES,p102ProductGroupingBinding,
  replayP102ProductGroupingEvidence,submittedP102ProductGroupingEvidence
} from '../dist/learning/p102-product-grouping-evidence.js';

const facts = [[100,400],[92,368]];
const rows = P102_SOURCES.map((source,i) => {
  const {sessionId,index} = source;
  const [first,product] = facts[i];
  return {source,context:{sessionId,index},task:sessionTaskFor(sessionId,index),first,product};
});

const act = (row,model,action,data) => original.act(row.task,model,'b13-chain-' + action,data);
const pick = (row,model,index) => act(row,model,'pick',{index});
const replay = (row,model) => replayP102ProductGroupingEvidence(row.task,model,row.context);
const submit = (row,model,...versions) => submittedP102ProductGroupingEvidence(row.task,model,
  {attempts:versions.map(value => ({value:structuredClone(value)}))},row.context);

function merge(row,model,product) {
  model.result = String(product);
  act(row,model,'merge');
}

function work(row,alternate = false,undo = false) {
  const model = original.initial(row.task);
  if (undo || alternate) {
    pick(row,model,1);
    pick(row,model,2);
    merge(row,model,16);
    if (undo) act(row,model,'undo');
  }
  if (!alternate || undo) {
    pick(row,model,0);
    pick(row,model,1);
    merge(row,model,row.first+1);
    merge(row,model,row.first);
  }
  pick(row,model,0);
  pick(row,model,1);
  merge(row,model,row.product);
  model.answer = String(row.product);
  return model;
}

test('P102 binds the two complete original sources and fingerprints', () => {
  assert.equal(rows.length,2);
  for (const {source,task,context} of rows) {
    const ordered = Object.fromEntries(Object.entries(task).sort(([a],[b]) => a.localeCompare(b,'en')));
    assert.equal(createHash('sha256').update(JSON.stringify(ordered)).digest('hex'),source.taskHash);
    assert.equal(p102ProductGroupingBinding(task,context)?.nodeId,source.nodeId);
    assert.equal(p102ProductGroupingBinding({...task,values:[4,4,task.values[0]]},context),null);
    assert.equal(p102ProductGroupingBinding({...task,prompt:'changed'},context),null);
    assert.equal(p102ProductGroupingBinding(task,{...context,index:String(context.index)}),null);
  }
});

test('P102 restores separate factor identities after Undo and counts each original once', () => {
  for (const row of rows) {
    const model = work(row,false,true), before = structuredClone(model);
    assert.ok(original.inspect(row.task,model).correct);
    const proof = replay(row,model);
    assert.deepEqual(proof.factors,row.task.values);
    assert.equal(proof.product,row.product);
    assert.deepEqual(proof.merges.map(merge => Number(merge.result)),[row.first,row.product]);
    assert.deepEqual(proof.actions.find(action => action.action === 'undo').restored.map(group => group.ids),
      [[0],[1],[2]]);
    const accepted = proof.actions.filter(action => action.action === 'merge' && action.accepted);
    assert.deepEqual(accepted[0].left,[1]);
    assert.deepEqual(accepted[0].right,[2]);
    assert.equal(proof.actions.filter(action => action.action === 'merge' && !action.accepted).length,1);
    assert.deepEqual(model,before);
  }
});

test('P102 accepts grouping the two 4s or pairing the first factor with a 4', () => {
  for (const row of rows) {
    const primary = replay(row,work(row));
    const alternate = replay(row,work(row,true));
    assert.equal(Number(primary.merges[0].result),row.first);
    assert.equal(Number(alternate.merges[0].result),16);
    assert.equal(primary.product,alternate.product);
  }
});

test('P102 requires two retained merges, exact total and a fresh matching Check', () => {
  const row = rows[0], model = work(row,false,true);
  model.answer = String(row.first);
  const wrong = structuredClone(model);
  assert.equal(replay(row,wrong),null);
  model.answer = String(row.product);
  assert.equal(submit(row,model,wrong),null);
  assert.equal(submit(row,model,wrong,model)?.product,400);
  const checked = structuredClone(model);
  act(row,model,'undo');
  assert.equal(replay(row,model),null);
  pick(row,model,1);
  pick(row,model,0);
  merge(row,model,row.product);
  assert.ok(replay(row,model));
  assert.equal(submit(row,model,checked),null);
});

test('P102 rejects forged merge provenance, hidden coordinates and an incomplete path', () => {
  const row = rows[1];
  for (const change of [
    m => { m.history.length=0; },
    m => { m.history[0].data.token=0; },
    m => { m.board.groups[0].ids=[0,1,1]; },
    m => { m.board.merges[0].left.value=25; },
    m => { m.result='368'; },
    m => act(row,m,'undo'),
    m => act(row,m,'pick',{index:0})
  ]) {
    const model = work(row);
    change(model);
    assert.equal(replay(row,model),null,change.toString());
  }
});

test('P102 excludes other multiplication positions, practice and related bridges', async () => {
  await ensureB39Ready();
  for (const {task,context} of rows) {
    assert.equal(p102ProductGroupingBinding(task,{...context,index:-1}),null);
    assert.equal(p102ProductGroupingBinding(task,{sessionId:'factorpairs',index:2}),null);
    assert.equal(p102ProductGroupingBinding(sessionTaskFor('factorpairs',2),context),null);
    for (const [sessionId,bridge] of Object.entries(BRIDGES)) {
      for (const [index,related] of bridge.tasks.entries()) {
        if (related?.type === task.type) assert.equal(p102ProductGroupingBinding(related,{sessionId,index}),null);
      }
    }
  }
});
