import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {BRIDGES, sessionTaskFor} from '../dist/learning/bridges.js';
import {ensureB39Ready} from '../dist/learning/phase4/async-batches.js';
import * as original from '../dist/learning/phase5/b29-model.js';
import {
  P095_SOURCES,p095ZeroCrossingBinding,
  replayP095ZeroCrossingEvidence,submittedP095ZeroCrossingEvidence
} from '../dist/learning/p095-zero-crossing-evidence.js';

const facts = [[3,5,8,-1],[120,350,470,1]];
const rows = P095_SOURCES.map((source,i) => {
  const {sessionId,index} = source;
  const [toZero,afterZero,distance,direction] = facts[i];
  return {source,context:{sessionId,index},task:sessionTaskFor(sessionId,index),toZero,afterZero,distance,direction};
});

const act = (row,model,name) => original.act(row.task,model,'m29-'+name);
const replay = (row,model) => replayP095ZeroCrossingEvidence(row.task,model,row.context);
const submit = (row,model,...versions) => submittedP095ZeroCrossingEvidence(row.task,model,
  {attempts:versions.map(value => ({value:structuredClone(value)}))},row.context);

function move(row,model,length) {
  model.jump = String(length);
  act(row,model,'move');
}

function work(row) {
  const model = original.initial(row.task);
  move(row,model,row.distance+1);
  move(row,model,row.toZero);
  act(row,model,'undo');
  move(row,model,row.toZero);
  move(row,model,row.afterZero);
  model.answer = String(row.distance);
  model.unit = row.task.unit;
  return model;
}

test('P095 binds exact sources, units and full fingerprints', () => {
  assert.equal(rows.length,2);
  for (const {source,task,context} of rows) {
    const ordered = Object.fromEntries(Object.entries(task).sort(([a],[b]) => a.localeCompare(b,'en')));
    assert.equal(createHash('sha256').update(JSON.stringify(ordered)).digest('hex'),source.taskHash);
    assert.equal(p095ZeroCrossingBinding(task,context)?.nodeId,source.nodeId);
    assert.equal(p095ZeroCrossingBinding({...task,start:0},context),null);
    assert.equal(p095ZeroCrossingBinding({...task,unit:'cm'},context),null);
    assert.equal(p095ZeroCrossingBinding(task,{...context,index:String(context.index)}),null);
  }
});

test('P095 verifies real steps, rejected overshoot, Undo and exact spans in both directions', () => {
  for (const row of rows) {
    const model = work(row), before = structuredClone(model);
    assert.ok(original.inspect(row.task,model).correct);
    const proof = replay(row,model);
    assert.equal(proof.direction,row.direction);
    assert.deepEqual([proof.beforeZero,proof.afterZero,proof.distance],[row.toZero,row.afterZero,row.distance]);
    assert.deepEqual(proof.path.map(step => [step.from,step.to]),[[row.task.start,0],[0,row.task.end]]);
    assert.equal(proof.events[0].accepted,false);
    assert.equal(proof.events[2].to,row.task.start);
    assert.deepEqual(model,before);
  }
});

test('P095 permits an exact move across zero without requiring a stop at zero', () => {
  for (const row of rows) {
    const model = original.initial(row.task);
    move(row,model,(row.distance*2)+'/2');
    model.answer = row.distance + '.0000000000000';
    model.unit = row.task.unit;
    const proof = replay(row,model);
    assert.deepEqual(proof.path.map(step => [step.from,step.to]),[[row.task.start,row.task.end]]);
    assert.equal(proof.distance,row.distance);
  }
});

test('P095 requires an exact distance, correct unit and latest original Check', () => {
  const row = rows[0], model = work(row);
  model.answer = '9';
  const wrong = structuredClone(model);
  assert.equal(replay(row,model),null);
  model.answer = '8';
  assert.equal(submit(row,model,wrong),null);
  assert.equal(submit(row,model,wrong,model)?.distance,8);
  assert.equal(submit(row,model,model,wrong),null);
  model.answer='8.000000001';
  assert.ok(original.inspect(row.task,model).correct);
  assert.equal(replay(row,model),null);
  model.answer='8';
  model.unit='cm';
  assert.equal(replay(row,model),null);
});

test('P095 rejects forged event targets, missing histories and later unsaved inputs', () => {
  const row = rows[1];
  for (const change of [
    m => { m.history.length=0; },
    m => { m.history.at(-1).i='0'; },
    m => { m.history.at(-1).v='350.00000000000000001'; },
    m => { m.board.moves[1]=351; },
    m => { m.jump='470'; },
    m => act(row,m,'clear')
  ]) {
    const model = work(row);
    change(model);
    assert.equal(replay(row,model),null,change.toString());
  }
});

test('P095 excludes other interval sources, actual practice and related bridges', async () => {
  await ensureB39Ready();
  for (const {task,context} of rows) {
    assert.equal(p095ZeroCrossingBinding(task,{...context,index:-1}),null);
    assert.equal(p095ZeroCrossingBinding(task,{...context,index:3}),null);
    assert.equal(p095ZeroCrossingBinding(task,{sessionId:'discounts',index:2}),null);
    for (const [sessionId,bridge] of Object.entries(BRIDGES)) {
      for (const [index,related] of bridge.tasks.entries()) {
        if (related?.type === task.type) assert.equal(p095ZeroCrossingBinding(related,{sessionId,index}),null);
      }
    }
  }
});
