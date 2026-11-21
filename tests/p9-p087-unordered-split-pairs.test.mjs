import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {BRIDGES,sessionTaskFor} from '../dist/learning/bridges.js';
import {ensureB39Ready} from '../dist/learning/phase4/async-batches.js';
import * as original from '../dist/learning/phase5/b10-model.js';
import {
  P087_SOURCES,
  p087UnorderedSplitPairsBinding,
  replayP087UnorderedSplitPairsEvidence,
  submittedP087UnorderedSplitPairsEvidence
} from '../dist/learning/p087-unordered-split-pairs-evidence.js';

const cases = P087_SOURCES.map((source,i) => {
  const {sessionId,index} = source;
  return {source,context:{sessionId,index},task:sessionTaskFor(sessionId,index),
    chosen:[[1,0,2],[1,2,3]][i],possible:[3,5][i]};
});
const replay = (row,model) => replayP087UnorderedSplitPairsEvidence(row.task,model,row.context);
const submit = (row,model,...versions) => submittedP087UnorderedSplitPairsEvidence(row.task,model,
  {attempts:versions.map(value => ({value:structuredClone(value)}))},row.context);

function save(row,model,a,text = a+'+'+(row.task.total-a)+'='+row.task.total) {
  for (let i = 0; i < row.task.total; i++) {
    if (model.left.includes(i) !== (i < a)) original.act(row.task,model,'split-token',{index:i});
  }
  model.equation = text;
  original.act(row.task,model,'split-save');
}

function complete(row,model = original.initial(row.task)) {
  for (const a of row.chosen) save(row,model,a);
  return model;
}

test('P087 locks the two native source positions and mathematical prompts', () => {
  for (const {source,task,context} of cases) {
    const ordered = Object.fromEntries(Object.entries(task).sort(([a],[b]) => a.localeCompare(b,'en')));
    assert.equal(createHash('sha256').update(JSON.stringify(ordered)).digest('hex'),source.taskHash);
    assert.equal(p087UnorderedSplitPairsBinding(task,context)?.nodeId,source.nodeId);
    assert.equal(p087UnorderedSplitPairsBinding({...task,count:1},context),null);
    assert.equal(p087UnorderedSplitPairsBinding({...task,total:10},context),null);
  }
});

test('P087 enumerates the 5 partitions including zero and accepts any 3 distinct ones for 8', () => {
  for (const row of cases) {
    const model = complete(row), before = structuredClone(model);
    const proof = replay(row,model);
    assert.equal(proof?.possiblePairs,row.possible);
    assert.equal(proof?.required,3);
    assert.deepEqual(proof?.partitions.map(p => p.pair),
      row.chosen.map(a => [a,row.task.total-a]));
    for (const {leftIds,rightIds,pair} of proof.partitions) {
      assert.deepEqual([leftIds.length,rightIds.length],pair);
      assert.equal(new Set([...leftIds,...rightIds]).size,row.task.total);
    }
    assert.deepEqual(model,before);
  }
});

test('P087 rejects a correct-looking equation for the wrong piles and repeated reversed placement', () => {
  for (const row of cases) {
    const model = original.initial(row.task);
    const total = row.task.total;
    save(row,model,1,'2+'+(total-2)+'='+total);
    assert.equal(model.saved.length,0);
    save(row,model,1,total+'＝'+(total-1)+'＋1');
    save(row,model,total-1);
    assert.equal(model.saved.length,1);
    const wrong = structuredClone(model);
    for (const a of row.chosen.slice(1)) save(row,model,a);
    assert.equal(submit(row,model,wrong),null);
    const proof = submit(row,model,wrong,model);
    assert.equal(proof?.partitions.length,3);
    assert.deepEqual(proof.attemptedSaves.filter(e => !e.accepted).map(e => e.reason),
      ['equation','reversed-or-repeat']);
    assert.equal(proof.partitions[0].equation,total+'＝'+(total-1)+'＋1');
  }
});

test('P087 permits more genuinely distinct pairs than requested for the larger whole', () => {
  const [,row] = cases, model = complete(row);
  save(row,model,4);
  save(row,model,8);
  assert.equal(replay(row,model)?.partitions.length,5);
});

test('P087 rejects inconsistent token sets, equations, counts and order of saved snapshots', () => {
  const row = cases[1], model = complete(row);
  for (const change of [
    m => { m.history.length = 0; },
    m => { m.history[1].b = 4; },
    m => { m.saved[0].ids = [9]; },
    m => { m.saved[0].eq = '8=7+1'; },
    m => { m.saved.reverse(); },
    m => { m.history[2].extra = '1'; }
  ]) {
    const copy = structuredClone(model);
    change(copy);
    assert.equal(replay(row,copy),null,change.toString());
  }
});

test('P087 excludes directed splits, ten partners, a practice slot and generated bridges', async () => {
  await ensureB39Ready();
  for (const {task,context} of cases) {
    assert.equal(p087UnorderedSplitPairsBinding(task,{...context,index:-1}),null);
    assert.equal(p087UnorderedSplitPairsBinding(task,{...context,index:String(context.index)}),null);
    assert.equal(p087UnorderedSplitPairsBinding(sessionTaskFor('screenadd',0),context),null);
    assert.equal(p087UnorderedSplitPairsBinding(sessionTaskFor('partnersten',2),context),null);
    for (const [id,bridge] of Object.entries(BRIDGES)) {
      for (const [index,related] of bridge.tasks.entries()) {
        if (related?.type === task.type) assert.equal(p087UnorderedSplitPairsBinding(related,{sessionId:id,index}),null);
      }
    }
  }
});
