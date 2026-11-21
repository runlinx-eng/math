import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {BRIDGES, sessionTaskFor} from '../dist/learning/bridges.js';
import {ensureB39Ready} from '../dist/learning/phase4/async-batches.js';
import * as original from '../dist/learning/phase5/b39-model.js';
import {
  P088_SOURCES,
  p088GraphCrossingsBinding,
  replayP088GraphCrossingsEvidence,
  submittedP088GraphCrossingsEvidence
} from '../dist/learning/p088-graph-crossings-evidence.js';

await ensureB39Ready();
const cases = P088_SOURCES.map((source,i) => {
  const {sessionId,index} = source;
  return {source,context:{sessionId,index},task:sessionTaskFor(sessionId,index),
    marks:[[-1.4,1.4],[-1.6,2.6]][i]};
});
const replay = (row,model) => replayP088GraphCrossingsEvidence(row.task,model,row.context);
const submit = (row,model,...versions) => submittedP088GraphCrossingsEvidence(row.task,model,
  {attempts:versions.map(value => ({value:structuredClone(value)}))},row.context);

function mark(row,model,cursor) {
  model.cursor = String(cursor);
  original.field(row.task,model,'cursor');
  original.act(row.task,model,'s39-mark');
}

function complete(row,model = original.initial(row.task)) {
  for (const cursor of row.marks) mark(row,model,cursor);
  return model;
}

test('P088 binds both exact original crossing tasks and their fingerprints', () => {
  for (const {source,task,context} of cases) {
    const ordered = Object.fromEntries(Object.entries(task).sort(([a],[b]) => a.localeCompare(b,'en')));
    assert.equal(createHash('sha256').update(JSON.stringify(ordered)).digest('hex'),source.taskHash);
    assert.equal(p088GraphCrossingsBinding(task,context)?.nodeId,source.nodeId);
    assert.equal(p088GraphCrossingsBinding({...task,offset:0},context),null);
    assert.equal(p088GraphCrossingsBinding({...task,tolerance:0.5},context),null);
  }
});

test('P088 independently finds crossings with the axis and with y = x', () => {
  for (const row of cases) {
    const model = complete(row), before = structuredClone(model);
    const proof = replay(row,model);
    assert.equal(proof?.tolerance,0.16);
    assert.deepEqual(proof?.crossings.map(c => c.marked),row.marks);
    for (const [i,{expected,marked,error,curveY,lineY}] of proof.crossings.entries()) {
      assert.ok(Math.abs(expected-row.task.targets[i]) < 1e-12);
      assert.equal(curveY,marked**2+row.task.offset);
      assert.equal(lineY,row.task.mode === 'roots' ? 0 : marked);
      assert.ok(error <= 0.16 && curveY !== lineY);
    }
    assert.deepEqual(model,before);
  }
});

test('P088 rejects repeated marks on one side and requires a new Check after undo', () => {
  for (const row of cases) {
    const model = original.initial(row.task);
    mark(row,model,row.marks[0]);
    mark(row,model,-1.5);
    const wrong = structuredClone(model);
    assert.equal(submit(row,model,wrong),null);
    original.act(row.task,model,'s39-undo');
    mark(row,model,row.marks[1]);
    assert.equal(submit(row,model,wrong),null);
    const proof = submit(row,model,wrong,model);
    assert.deepEqual(proof?.actions[2],{action:'undo',removed:-1.5});
    assert.deepEqual(proof?.marks,row.marks);
  }
});

test('P088 distinguishes approximate crossings from exploratory marks and out-of-window guesses', () => {
  for (const row of cases) {
    const model = original.initial(row.task);
    mark(row,model,0);
    mark(row,model,row.marks[0]);
    mark(row,model,(row.marks[1]-0.3).toFixed(1));
    assert.equal(replay(row,model),null);
    mark(row,model,row.marks[1]);
    const proof = replay(row,model);
    assert.deepEqual(proof?.crossings.map(c => c.marked),row.marks);
    assert.equal(proof?.marks.length,4);
  }
});

test('P088 rejects altered artifacts and unsupported action histories', () => {
  const [row] = cases;
  const model = complete(row);
  for (const change of [
    m => { m.board.marks[0] = -1.42; },
    m => { m.history.length = 0; },
    m => { m.history[0].i = '1'; },
    m => original.act(row.task,m,'s39-run'),
    m => { m.cursor = '4'; }
  ]) {
    const copy = structuredClone(model);
    change(copy);
    assert.equal(replay(row,copy),null,change.toString());
  }
});

test('P088 excludes the native prerequisite, journey reading, practice and bridges', () => {
  const id = cases[0].context.sessionId;
  for (const index of [0,3]) {
    assert.equal(p088GraphCrossingsBinding(sessionTaskFor(id,index),{sessionId:id,index}),null);
  }
  for (const {task,context} of cases) {
    assert.equal(p088GraphCrossingsBinding(task,{...context,index:-1}),null);
    assert.equal(p088GraphCrossingsBinding(task,{...context,index:String(context.index)}),null);
    for (const [sessionId,bridge] of Object.entries(BRIDGES)) {
      for (const [index,related] of bridge.tasks.entries()) {
        if (related?.type === task.type) assert.equal(p088GraphCrossingsBinding(related,{sessionId,index}),null);
      }
    }
  }
});
