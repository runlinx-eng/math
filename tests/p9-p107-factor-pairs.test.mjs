import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {BRIDGES, sessionTaskFor} from '../dist/learning/bridges.js';
import {ensureB39Ready} from '../dist/learning/phase4/async-batches.js';
import * as original from '../dist/learning/phase5/b13-model.js';
import {
  P107_SOURCES,p107FactorPairsBinding,
  replayP107FactorPairsEvidence,submittedP107FactorPairsEvidence
} from '../dist/learning/p107-factor-pairs-evidence.js';

const expected = [
  [[1,24],[2,12],[3,8],[4,6]],
  [[1,36],[2,18],[3,12],[4,9],[6,6]]
];
const rows = P107_SOURCES.map((source,i) => {
  const {sessionId,index} = source;
  return {source,context:{sessionId,index},task:sessionTaskFor(sessionId,index),pairs:expected[i]};
});

function ordered(value) {
  if (Array.isArray(value)) return value.map(ordered);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort((a,b) => a.localeCompare(b,'en'))
      .map(key => [key,ordered(value[key])]));
  }
  return value;
}

const replay = (row,model) => replayP107FactorPairsEvidence(row.task,model,row.context);
const submit = (row,model,...versions) => submittedP107FactorPairsEvidence(row.task,model,
  {attempts:versions.map(value => ({value:structuredClone(value)}))},row.context);

function save(row,model,r,c,answer = row.task.n) {
  [model.rows,model.cols,model.answer] = [r,c,answer].map(String);
  original.act(row.task,model,'b13-pair-save');
}

function work(row) {
  const model = original.initial(row.task);
  save(row,model,0,2);
  save(row,model,1,row.task.n,row.task.n-1);
  for (const pair of [...row.pairs].reverse()) save(row,model,pair[1],pair[0]);
  return model;
}

test('P107 locks both originals and their full source fingerprints', () => {
  assert.equal(rows.length,2);
  for (const {source,task,context} of rows) {
    assert.equal(createHash('sha256').update(JSON.stringify(ordered(task))).digest('hex'),source.taskHash);
    assert.equal(p107FactorPairsBinding(task,context)?.nodeId,source.nodeId);
    assert.equal(p107FactorPairsBinding({...task,n:40},context),null);
    assert.equal(p107FactorPairsBinding({...task,prompt:'changed'},context),null);
    assert.equal(p107FactorPairsBinding(task,{...context,index:String(context.index)}),null);
  }
});

test('P107 reconstructs every original pair from genuine saves in either direction', () => {
  for (const row of rows) {
    const model = work(row), before = structuredClone(model);
    assert.equal(original.inspect(row.task,model).correct,true);
    const proof = replay(row,model);
    assert.deepEqual(proof.pairs,row.pairs);
    assert.deepEqual(proof.observed,[...row.pairs].reverse());
    assert.deepEqual(proof.attempts.slice(0,2).map(event => event.reason),
      ['does-not-match-total','does-not-match-total']);
    assert.deepEqual(model,before);
  }
});

test('P107 keeps rotations and the square from being recorded twice', () => {
  const first = rows[0], rectangle = work(first);
  save(first,rectangle,1,24);
  const rotation = replay(first,rectangle);
  assert.equal(rotation.attempts.at(-1).reason,'duplicate');
  assert.deepEqual(rotation.observed,[...first.pairs].reverse());
  assert.equal(rotation.attempts.at(-1).previous,rectangle.history.length-2);

  const second = rows[1], square = work(second);
  save(second,square,6,6);
  const squareProof = replay(second,square);
  assert.equal(squareProof.attempts.at(-1).reason,'duplicate');
  assert.equal(squareProof.observed.filter(([r,c]) => r === 6 && c === 6).length,1);
});

test('P107 requires a complete set and freshness for fields and latest Check', () => {
  const row = rows[0], incomplete = original.initial(row.task);
  save(row,incomplete,1,24);
  assert.equal(replay(row,incomplete),null);
  const complete = work(row);
  assert.equal(submit(row,complete,incomplete),null);
  assert.equal(submit(row,complete,incomplete,complete)?.pairs.length,4);
  assert.equal(submit(row,complete,complete,incomplete),null);
  complete.rows = '4';
  assert.equal(original.inspect(row.task,complete).correct,true);
  assert.equal(replay(row,complete),null);
  save(row,complete,4,6);
  assert.equal(replay(row,complete)?.attempts.at(-1).reason,'duplicate');
});

test('P107 declines forged ranges, false pairs, hidden actions and a mismatched total', () => {
  const row = rows[1], changes = [
    m => { m.history.length = 0; },
    m => { m.history[2].data.rows = '06'; },
    m => { m.history[2].data.index = 0; },
    m => { m.board.pairs.push([3,11]); },
    m => original.act(row.task,m,'b13-round'),
    m => save(row,m,6,6,35)
  ];
  for (const change of changes) {
    const model = work(row);
    change(model);
    assert.equal(replay(row,model),null,change.toString());
  }
});

test('P107 excludes same-payload reuses, practice and related original bridges', async () => {
  await ensureB39Ready();
  for (const {task,context} of rows) {
    assert.equal(p107FactorPairsBinding(task,{...context,index:-1}),null);
    assert.equal(p107FactorPairsBinding(task,{sessionId:'factorlab',index:0}),null);
    assert.equal(p107FactorPairsBinding(task,{sessionId:'term38',index:0}),null);
    for (const [sessionId,bridge] of Object.entries(BRIDGES)) {
      for (const [index,related] of bridge.tasks.entries()) {
        if (related?.type === task.type) assert.equal(p107FactorPairsBinding(related,{sessionId,index}),null);
      }
    }
  }
});
