import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {BRIDGES, sessionTaskFor} from '../dist/learning/bridges.js';
import {ensureB39Ready} from '../dist/learning/phase4/async-batches.js';
import * as original from '../dist/learning/phase5/b11-model.js';
import {
  P096_SOURCES,p096FourAddendsBinding,
  replayP096FourAddendsEvidence,submittedP096FourAddendsEvidence
} from '../dist/learning/p096-four-addends-evidence.js';

const facts = [[40,30,70],[50,30,80]];
const rows = P096_SOURCES.map((source,i) => {
  const {sessionId,index} = source;
  const [first,second,total] = facts[i];
  return {source,context:{sessionId,index},task:sessionTaskFor(sessionId,index),first,second,total};
});

const act = (row,model,action,data) => original.act(row.task,model,'b11-group-'+action,data);
const replay = (row,model) => replayP096FourAddendsEvidence(row.task,model,row.context);
const submit = (row,model,...versions) => submittedP096FourAddendsEvidence(row.task,model,
  {attempts:versions.map(value => ({value:structuredClone(value)}))},row.context);

function choose(row,model,a,b) {
  act(row,model,'pick',{index:a});
  act(row,model,'pick',{index:b});
}

function merge(row,model,value) {
  model.subtotal = String(value);
  act(row,model,'merge');
}

function wrong(row) {
  const model = original.initial(row.task);
  choose(row,model,0,2);
  merge(row,model,row.first+1);
  return model;
}

function correct(row,model) {
  merge(row,model,row.first);
  choose(row,model,0,1);
  merge(row,model,row.second);
  choose(row,model,0,1);
  merge(row,model,row.total);
  return model;
}

test('P096 binds both original four-addend positions with the complete fingerprints', () => {
  assert.equal(rows.length,2);
  for (const {source,task,context} of rows) {
    const ordered = Object.fromEntries(Object.entries(task).sort(([a],[b]) => a.localeCompare(b,'en')));
    assert.equal(createHash('sha256').update(JSON.stringify(ordered)).digest('hex'),source.taskHash);
    assert.equal(p096FourAddendsBinding(task,context)?.nodeId,source.nodeId);
    assert.equal(p096FourAddendsBinding({...task,values:[...task.values].reverse()},context),null);
    assert.equal(p096FourAddendsBinding({...task,prompt:'changed'},context),null);
    assert.equal(p096FourAddendsBinding(task,{...context,index:String(context.index)}),null);
  }
});

test('P096 traces each pair to independent original IDs and exact subtotals', () => {
  for (const row of rows) {
    const model = correct(row,wrong(row)), before = structuredClone(model);
    assert.equal(original.inspect(row.task,model).correct,true);
    const proof = replay(row,model);
    assert.equal(proof.total,row.total);
    assert.deepEqual(proof.originalAddends,row.task.values);
    assert.deepEqual(proof.attempts.map(a => a.accepted),[false,true,true,true]);
    assert.deepEqual(proof.merges.map(a => Number(a.answer)),[row.first,row.second,row.total]);
    assert.deepEqual([proof.merges[0].left.ids,proof.merges[0].right.ids],[[0],[2]]);
    assert.deepEqual([proof.merges[1].left.ids,proof.merges[1].right.ids],[[1],[3]]);
    assert.equal(proof.individualSelectionTimingAssessed,false);
    assert.deepEqual(model,before);
  }
});

test('P096 accepts alternate legal pairs and describes the actual subtotals', () => {
  for (const row of rows) {
    const model = original.initial(row.task);
    const [a,b,c,d] = row.task.values;
    choose(row,model,0,1);
    merge(row,model,a+b);
    choose(row,model,0,1);
    merge(row,model,c+d);
    choose(row,model,0,1);
    merge(row,model,row.total);
    const proof = replay(row,model);
    assert.deepEqual(proof.attempts.map(a => a.value),[a+b,c+d,row.total]);
    assert.deepEqual(proof.attempts.map(a => a.makesWholeTen),[false,false,true]);
  }
});

test('P096 requires the complete history and a new original Check on the current work', () => {
  const row = rows[0], incomplete = wrong(row);
  assert.equal(replay(row,incomplete),null);
  const model = correct(row,structuredClone(incomplete));
  assert.equal(submit(row,model,incomplete),null);
  assert.equal(submit(row,model,incomplete,model)?.total,70);
  assert.equal(submit(row,model,model,incomplete),null);
});

test('P096 rejects invented or duplicated group history and incorrect active leftovers', () => {
  const row = rows[1];
  for (const change of [
    m => { m.history.length=0; },
    m => { m.history.at(-1).right=m.history.at(-1).left; },
    m => { m.history[0].left.ids=[1]; },
    m => { m.history[0].unverified=true; },
    m => { m.merges[1].left.value=25; },
    m => { m.subtotal='80'; },
    m => { m.selected=[0]; }
  ]) {
    const model = correct(row,wrong(row));
    change(model);
    assert.equal(replay(row,model),null,change.toString());
  }
});

test('P096 excludes a different grouping mechanism, practice and related bridges', async () => {
  await ensureB39Ready();
  for (const {task,context} of rows) {
    assert.equal(p096FourAddendsBinding(task,{...context,index:-1}),null);
    assert.equal(p096FourAddendsBinding(task,{sessionId:'regroupadd',index:2}),null);
    assert.equal(p096FourAddendsBinding(sessionTaskFor('regroupadd',2),context),null);
    for (const [sessionId,bridge] of Object.entries(BRIDGES)) {
      for (const [index,related] of bridge.tasks.entries()) {
        if (related?.type === task.type) assert.equal(p096FourAddendsBinding(related,{sessionId,index}),null);
      }
    }
  }
});
