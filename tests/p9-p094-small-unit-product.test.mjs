import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {BRIDGES, sessionTaskFor} from '../dist/learning/bridges.js';
import {ensureB39Ready} from '../dist/learning/phase4/async-batches.js';
import * as original from '../dist/learning/phase5/b15-model.js';
import {
  P094_SOURCES,p094SmallUnitProductBinding,
  replayP094SmallUnitProductEvidence,submittedP094SmallUnitProductEvidence
} from '../dist/learning/p094-small-unit-product-evidence.js';

const facts = [
  {units:100,amount:456,product:3192,answer:'31.92',estimate:3500,columns:[[42,2,4,0],[39,9,3,4],[31,1,3,3]]},
  {units:10,amount:32,product:160,answer:'16.0',estimate:150,columns:[[10,0,1,0],[16,6,1,1]]}
];
const rows = P094_SOURCES.map((source,i) => {
  const {sessionId,index} = source;
  return {source,context:{sessionId,index},task:sessionTaskFor(sessionId,index),...facts[i]};
});

const act = (row,model,action) => original.act(row.task,model,action);
const replay = (row,model) => replayP094SmallUnitProductEvidence(row.task,model,row.context);
const submit = (row,model,...versions) => submittedP094SmallUnitProductEvidence(row.task,model,
  {attempts:versions.map(value => ({value:structuredClone(value)}))},row.context);

function complete(row, model = original.initial(row.task)) {
  model.inner.estimate = String(row.estimate+1);
  act(row,model,'b14-estimate');
  model.inner.estimate = String(row.estimate);
  act(row,model,'b14-estimate');
  for (const [i,[raw,digit,carry]] of row.columns.entries()) {
    if (i === 0) {
      model.inner.raw = String(raw+1);
      act(row,model,'b14-mul-count');
    }
    model.inner.raw = String(raw);
    act(row,model,'b14-mul-count');
    for (let bundles=0; bundles<carry; bundles++) act(row,model,'b14-trade');
    model.inner.digit = String(digit);
    act(row,model,'b14-digit');
  }
  model.inner.shift = '0';
  model.inner.rowvalue = String(row.product);
  act(row,model,'b14-row');
  model.inner.answer = String(row.product);
  model.unit = String(row.units);
  model.answer = row.answer;
  return model;
}

test('P094 locks both exact original sources and full fingerprints', () => {
  assert.equal(rows.length,2);
  for (const {source,task,context} of rows) {
    const ordered = Object.fromEntries(Object.entries(task).sort(([a],[b]) => a.localeCompare(b,'en')));
    assert.equal(createHash('sha256').update(JSON.stringify(ordered)).digest('hex'),source.taskHash);
    assert.equal(p094SmallUnitProductBinding(task,context)?.nodeId,source.nodeId);
    assert.equal(p094SmallUnitProductBinding({...task,decimal:'4.6'},context),null);
    assert.equal(p094SmallUnitProductBinding({...task,estimate:5000},context),null);
    assert.equal(p094SmallUnitProductBinding(task,{...context,index:String(context.index)}),null);
  }
});

test('P094 independently reconstructs each count, bundles, digit and carry', () => {
  for (const row of rows) {
    const model = complete(row), before = structuredClone(model);
    assert.ok(original.inspect(row.task,model).correct);
    const proof = replay(row,model);
    assert.deepEqual([proof.operandInSmallUnits,proof.productInSmallUnits,proof.unitsPerWhole],
      [row.amount,row.product,row.units]);
    assert.deepEqual(proof.columns.map(c => [c.raw,c.loose,c.bundles,c.incoming]),row.columns);
    assert.deepEqual(proof.result,{numerator:row.product,denominator:row.units});
    assert.equal(proof.actions.filter(a => a.accepted === false).length,2);
    assert.deepEqual(model,before);
  }
});

test('P094 requires actual conversion out of the small unit and exact equivalent decimal forms', () => {
  for (const row of rows) {
    const model = complete(row);
    model.answer = String(row.product);
    assert.equal(replay(row,model),null);
    model.answer = (row.product/row.units).toFixed(8);
    assert.equal(replay(row,model)?.unitsPerWhole,row.units);
    model.unit = '1';
    assert.equal(replay(row,model),null);
    model.unit = String(row.units);
    model.inner.answer = String(row.product/row.units);
    assert.equal(replay(row,model),null);
  }
});

test('P094 requires a fresh latest Check after correction or an original reset', () => {
  const row = rows[1], model = complete(row);
  model.answer='160';
  const wrong = structuredClone(model);
  model.answer='16';
  assert.equal(submit(row,model,wrong),null);
  assert.equal(submit(row,model,wrong,model)?.result.numerator,160);
  const checked = structuredClone(model);
  act(row,model,'b15-reset');
  assert.equal(replay(row,model),null);
  complete(row,model);
  assert.equal(replay(row,model)?.resets,1);
  assert.equal(submit(row,model,checked),null);
});

test('P094 excludes altered cast-off bundles and unsupported hidden events', () => {
  const row = rows[0];
  for (const change of [
    m => { m.inner.history.length=0; },
    m => { m.inner.board.work[0].incoming=1; },
    m => { m.inner.board.rows[0].shift=1; },
    m => { m.inner.history[0].data.index=0; },
    m => act(row,m,'b14-list'),
    m => act(row,m,'b15-build')
  ]) {
    const model = complete(row);
    change(model);
    assert.equal(replay(row,model),null,change.toString());
  }
});

test('P094 excludes decimal division, practice and related real bridges', async () => {
  await ensureB39Ready();
  for (const {task,context} of rows) {
    assert.equal(p094SmallUnitProductBinding(task,{...context,index:-1}),null);
    assert.equal(p094SmallUnitProductBinding(task,{sessionId:'decimaldivide',index:0}),null);
    assert.equal(p094SmallUnitProductBinding(sessionTaskFor('decimaldivide',0),context),null);
    for (const [id,bridge] of Object.entries(BRIDGES)) {
      for (const [index,related] of bridge.tasks.entries()) {
        if (related?.type === task.type) assert.equal(p094SmallUnitProductBinding(related,{sessionId:id,index}),null);
      }
    }
  }
});
