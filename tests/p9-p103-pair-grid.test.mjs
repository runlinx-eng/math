import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {BRIDGES, sessionTaskFor} from '../dist/learning/bridges.js';
import {ensureB39Ready} from '../dist/learning/phase4/async-batches.js';
import * as original from '../dist/learning/phase5/b34-model.js';
import {
  P103_SOURCES,p103PairGridBinding,
  replayP103PairGridEvidence,submittedP103PairGridEvidence
} from '../dist/learning/p103-pair-grid-evidence.js';

const facts = [[3,4,12],[2,3,6]];
const rows = P103_SOURCES.map((source,i) => {
  const {sessionId,index} = source;
  return {source,context:{sessionId,index},task:sessionTaskFor(sessionId,index),expected:facts[i]};
});

function ordered(value) {
  if (Array.isArray(value)) return value.map(ordered);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort((a,b) => a.localeCompare(b,'en'))
      .map(key => [key,ordered(value[key])]));
  }
  return value;
}

const toggle = (row,model,index) => original.act(row.task,model,'p34-cell',{index});
const replay = (row,model) => replayP103PairGridEvidence(row.task,model,row.context);
const submit = (row,model,...versions) => submittedP103PairGridEvidence(row.task,model,
  {attempts:versions.map(value => ({value:structuredClone(value)}))},row.context);

function work(row,includingFirst = true) {
  const model = original.initial(row.task), total = row.expected[2];
  toggle(row,model,0);
  toggle(row,model,0);
  for (let i=total-1; i>0; i--) toggle(row,model,i);
  if (includingFirst) toggle(row,model,0);
  model.answers = row.task.questions.map(() => String(total));
  return model;
}

test('P103 binds both complete original task shapes and fingerprints', () => {
  assert.equal(rows.length,2);
  for (const {source,task,context} of rows) {
    assert.equal(createHash('sha256').update(JSON.stringify(ordered(task))).digest('hex'),source.taskHash);
    assert.equal(p103PairGridBinding(task,context)?.nodeId,source.nodeId);
    assert.equal(p103PairGridBinding({...task,rows:[...task.rows].reverse()},context),null);
    assert.equal(p103PairGridBinding({...task,cols:[...task.cols,'额外']},context),null);
    assert.equal(p103PairGridBinding(task,{...context,index:String(context.index)}),null);
  }
});

test('P103 independently enumerates and replays every labeled pair', () => {
  for (const row of rows) {
    const model = work(row), before = structuredClone(model);
    const proof = replay(row,model);
    assert.deepEqual([proof.rowCount,proof.columnCount,proof.pairs.length],row.expected);
    assert.deepEqual(proof.pairs.map(pair => [pair.row,pair.column]),
      row.task.rows.flatMap(label => row.task.cols.map(column => [label,column])));
    assert.deepEqual(proof.toggles.filter(x => x.cell === 0).map(x => x.selected),[true,false,true]);
    assert.deepEqual(model,before);
  }
});

test('P103 requires every pair and the count in every original answer field', () => {
  for (const row of rows) {
    const missing = work(row,false);
    assert.equal(original.inspect(row.task,missing).correct,false);
    assert.equal(replay(row,missing),null);
    toggle(row,missing,0);
    assert.ok(replay(row,missing));
    missing.answers[0] = String(row.expected[2]*2) + '/2';
    assert.ok(replay(row,missing));
    missing.answers[missing.answers.length-1] = String(row.expected[2]+1);
    assert.equal(replay(row,missing),null);
  }
});

test('P103 does not use an older Check after a cell is changed and reselected', () => {
  const row = rows[0], old = work(row), changed = structuredClone(old);
  toggle(row,changed,0);
  toggle(row,changed,0);
  assert.equal(original.inspect(row.task,changed).correct,true);
  assert.equal(submit(row,changed,old),null);
  assert.equal(submit(row,changed,old,changed)?.pairs.length,12);
  assert.equal(submit(row,changed,changed,old),null);
});

test('P103 excludes forged cells, unsupported actions and duplicate saved IDs', () => {
  const row = rows[1];
  for (const change of [
    m => { m.history.length=0; },
    m => { m.history[0].i='00'; },
    m => { m.history[0].i='6'; },
    m => { m.history[0].w='unexpected'; },
    m => { m.board.selected[1]=0; },
    m => original.act(row.task,m,'p34-undo')
  ]) {
    const model = work(row);
    change(model);
    assert.equal(replay(row,model),null,change.toString());
  }
});

test('P103 excludes related pairing mode, actual practice and bridge positions', async () => {
  await ensureB39Ready();
  for (const {task,context} of rows) {
    assert.equal(p103PairGridBinding(task,{...context,index:-1}),null);
    assert.equal(p103PairGridBinding(task,{sessionId:'paired34',index:0}),null);
    assert.equal(p103PairGridBinding(sessionTaskFor('paired34',0),context),null);
    for (const [sessionId,bridge] of Object.entries(BRIDGES)) {
      for (const [index,related] of bridge.tasks.entries()) {
        if (related?.type === task.type) assert.equal(p103PairGridBinding(related,{sessionId,index}),null);
      }
    }
  }
});
