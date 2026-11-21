import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {BRIDGES, sessionTaskFor} from '../dist/learning/bridges.js';
import {ensureB39Ready} from '../dist/learning/phase4/async-batches.js';
import * as original from '../dist/learning/phase5/b29-model.js';
import {
  P099_SOURCES,p099LengthTapeBinding,
  replayP099LengthTapeEvidence,submittedP099LengthTapeEvidence
} from '../dist/learning/p099-length-tape-evidence.js';

const facts = [[18,27,27],[27,18,18],[30,12,30]];
const rows = P099_SOURCES.map((source,i) => {
  const {sessionId,index} = source;
  const [left,right,unknown] = facts[i];
  return {source,context:{sessionId,index},task:sessionTaskFor(sessionId,index),left,right,unknown};
});

const replay = (row,model) => replayP099LengthTapeEvidence(row.task,model,row.context);
const submit = (row,model,...versions) => submittedP099LengthTapeEvidence(row.task,model,
  {attempts:versions.map(value => ({value:structuredClone(value)}))},row.context);

function cut(row,model,value) {
  model.cut = String(value);
  original.act(row.task,model,'m29-cut');
}

function wrong(row) {
  const model = original.initial(row.task);
  cut(row,model,'');
  cut(row,model,row.left+1);
  model.equation = row.task.whole+'−'+row.task.known+'=□';
  model.answer = String(row.unknown);
  model.unit = 'cm';
  return model;
}

function work(row) {
  const model = wrong(row);
  cut(row,model,row.left);
  return model;
}

test('P099 binds the exact source at all three original positions', () => {
  assert.equal(rows.length,3);
  for (const {source,task,context} of rows) {
    const ordered = Object.fromEntries(Object.entries(task).sort(([a],[b]) => a.localeCompare(b,'en')));
    assert.equal(createHash('sha256').update(JSON.stringify(ordered)).digest('hex'),source.taskHash);
    assert.equal(p099LengthTapeBinding(task,context)?.nodeId,source.nodeId);
    assert.equal(p099LengthTapeBinding({...task,knownSide:'changed'},context),null);
    assert.equal(p099LengthTapeBinding({...task,unit:'m'},context),null);
    assert.equal(p099LengthTapeBinding(task,{...context,index:String(context.index)}),null);
  }
});

test('P099 replays correction on each side and verifies conservation of length', () => {
  for (const row of rows) {
    const model = wrong(row);
    assert.equal(original.inspect(row.task,model).correct,false);
    assert.equal(replay(row,model),null);
    cut(row,model,row.left);
    const before = structuredClone(model), proof = replay(row,model);
    assert.deepEqual([proof.left,proof.right,proof.unknown],[row.left,row.right,row.unknown]);
    assert.equal(proof.left+proof.right,proof.whole);
    assert.equal(proof[proof.knownSide],proof.known);
    assert.equal(proof.attempts[0].recorded,false);
    assert.equal(proof.attempts[1].matchesKnown,false);
    assert.equal(proof.attempts.at(-1).matchesKnown,true);
    assert.equal(proof.unit,'cm');
    assert.deepEqual(model,before);
  }
});

test('P099 preserves the role of the unit and supports exact related equations', () => {
  const row = rows[0], model = work(row);
  model.equation = '45＝□＋18';
  model.answer = '54/2';
  assert.equal(replay(row,model)?.unknown,27);
  model.equation = '45−□=18';
  assert.equal(replay(row,model)?.unknown,27);
  model.equation = '45+18=□';
  assert.equal(replay(row,model),null);
  model.equation = '45−18=□';
  model.answer = '26.999999999';
  assert.ok(original.inspect(row.task,model).correct);
  assert.equal(replay(row,model),null);
  model.answer = '27';
  model.unit = 'm';
  assert.equal(replay(row,model),null);
});

test('P099 requires the saved cut and a new original Check on that model', () => {
  const row = rows[2], model = wrong(row), savedWrong = structuredClone(model);
  model.cut = '30';
  assert.equal(replay(row,model),null);
  cut(row,model,30);
  assert.equal(replay(row,model)?.knownSide,'right');
  assert.equal(submit(row,model,savedWrong),null);
  assert.equal(submit(row,model,savedWrong,model)?.unknown,30);
  cut(row,model,12);
  assert.equal(replay(row,model),null);
});

test('P099 declines forged cuts, unsupported actions and hidden action targets', () => {
  const row = rows[1];
  for (const change of [
    m => { m.history.length=0; },
    m => { m.history.at(-1).v='027'; },
    m => { m.history.at(-1).i='0'; },
    m => { m.board.first.cut='27'; },
    m => { m.board.cut=18; },
    m => original.act(row.task,m,'m29-undo')
  ]) {
    const model = work(row);
    change(model);
    assert.equal(replay(row,model),null,change.toString());
  }
});

test('P099 excludes other measuring models, practice and related bridges', async () => {
  await ensureB39Ready();
  for (const {task,context} of rows) {
    assert.equal(p099LengthTapeBinding(task,{...context,index:-1}),null);
    assert.equal(p099LengthTapeBinding(task,{sessionId:'measurecalc',index:4}),null);
    assert.equal(p099LengthTapeBinding(sessionTaskFor('measurecalc',4),context),null);
    for (const [sessionId,bridge] of Object.entries(BRIDGES)) {
      for (const [index,related] of bridge.tasks.entries()) {
        if (related?.type === task.type) assert.equal(p099LengthTapeBinding(related,{sessionId,index}),null);
      }
    }
  }
});
