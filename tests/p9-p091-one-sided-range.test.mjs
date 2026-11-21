import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {BRIDGES, sessionTaskFor} from '../dist/learning/bridges.js';
import {ensureB39Ready} from '../dist/learning/phase4/async-batches.js';
import * as original from '../dist/learning/phase5/b09-model.js';
import {
  P091_SOURCES,
  p091OneSidedRangeBinding,
  replayP091OneSidedRangeEvidence,
  submittedP091OneSidedRangeEvidence
} from '../dist/learning/p091-one-sided-range-evidence.js';

const cases = P091_SOURCES.map((source,i) => {
  const {sessionId,index} = source;
  return {source,context:{sessionId,index},task:sessionTaskFor(sessionId,index),
    inclusive:i===0,statement:['12 ≤ x','−2 < x'][i],samples:[['23/2','12','25/2'],['-5/2','-2','-3/2']][i]};
});
const replay = (row,model) => replayP091OneSidedRangeEvidence(row.task,model,row.context);
const submit = (row,model,...versions) => submittedP091OneSidedRangeEvidence(row.task,model,
  {attempts:versions.map(value => ({value:structuredClone(value)}))},row.context);

function plotted(row, inclusive, boundary = row.task.bound) {
  const model = original.initial(row.task);
  model.boundary = boundary;
  original.field(row.task,model,'boundary');
  model.side = 'right';
  model.closed = inclusive ? 'yes' : 'no';
  model.statement = row.statement;
  return model;
}

function probe(row,model,text) {
  model.probe = text;
  original.act(row.task,model,'range-test');
}

test('P091 checks both original prompts and fingerprints', () => {
  for (const {source,task,context} of cases) {
    const ordered = Object.fromEntries(Object.entries(task).sort(([a],[b]) => a.localeCompare(b,'en')));
    assert.equal(createHash('sha256').update(JSON.stringify(ordered)).digest('hex'),source.taskHash);
    assert.equal(p091OneSidedRangeBinding(task,context)?.nodeId,source.nodeId);
    assert.equal(p091OneSidedRangeBinding({...task,bound:17},context),null);
    assert.equal(p091OneSidedRangeBinding({...task,relation:'<'},context),null);
    assert.equal(p091OneSidedRangeBinding(task,{...context,index:String(context.index)}),null);
  }
});

test('P091 distinguishes open and closed endpoints and compares fractional probes exactly', () => {
  for (const row of cases) {
    const model = plotted(row,row.inclusive);
    for (const value of row.samples) probe(row,model,value);
    const before = structuredClone(model);
    const proof = replay(row,model);
    assert.ok(original.inspect(row.task,model).correct);
    assert.deepEqual(proof?.trials.map(t => t.relative),[-1,0,1]);
    assert.deepEqual(proof?.trials.map(t => t.allowed),[false,row.inclusive,true]);
    assert.deepEqual(proof?.trials[0].value,row.inclusive ? [23,2] : [-5,2]);
    assert.deepEqual(model,before);
    model.statement = row.inclusive ? 'x ≥ 12' : 'x > −2';
    assert.equal(replay(row,model)?.inclusive,row.inclusive);
    model.statement = row.inclusive ? '12 ≥ x' : '−2 > x';
    assert.equal(replay(row,model),null);
  }
});

test('P091 retains a disagreement at the endpoint and requires a fresh Check', () => {
  for (const row of cases) {
    const model = plotted(row,!row.inclusive);
    for (const value of row.samples) probe(row,model,value);
    assert.equal(submit(row,model,model),null);
    const wrong = structuredClone(model);
    model.closed = row.inclusive ? 'yes' : 'no';
    assert.equal(replay(row,model),null);
    probe(row,model,row.samples[1]);
    assert.equal(submit(row,model,wrong),null);
    const proof = submit(row,model,wrong,model);
    assert.deepEqual(proof?.trials.filter(t => t.relative === 0).map(t => t.agrees),[false,true]);
  }
});

test('P091 needs all three actual probe classes and a deliberately set boundary', () => {
  for (const row of cases) {
    const model = plotted(row,row.inclusive);
    probe(row,model,row.samples[0]);
    probe(row,model,row.samples[0]);
    probe(row,model,row.samples[1]);
    model.probe = row.samples[2];
    assert.equal(replay(row,model),null);
    probe(row,model,row.samples[2]);
    assert.equal(replay(row,model)?.bound,row.task.bound);
    model.touched = false;
    assert.equal(replay(row,model),null);
  }
});

test('P091 rejects altered probe verdicts, the graph and extra unrecorded algebra', () => {
  const [row] = cases;
  const model = plotted(row,row.inclusive);
  for (const value of row.samples) probe(row,model,value);
  for (const change of [
    m => { m.trials[0].actual = true; },
    m => { m.trials[0].boundary = 12; },
    m => { m.trials[0].graph = true; },
    m => { m.side = 'left'; },
    m => { m.commands.push({op:'sub',value:2}); }
  ]) {
    const copy = structuredClone(model);
    change(copy);
    assert.equal(replay(row,copy),null,change.toString());
  }
});

test('P091 does not bind practice, bridges, algebra or a two-ended interval', async () => {
  await ensureB39Ready();
  const [row] = cases;
  assert.equal(p091OneSidedRangeBinding(row.task,{...row.context,index:-1}),null);
  for (let index = 2; index <= 4; index++) {
    const id = row.context.sessionId;
    assert.equal(p091OneSidedRangeBinding(sessionTaskFor(id,index),{sessionId:id,index}),null);
  }
  for (const [id,bridge] of Object.entries(BRIDGES)) {
    for (const [index,related] of bridge.tasks.entries()) {
      if (related?.type === row.task.type) assert.equal(p091OneSidedRangeBinding(related,{sessionId:id,index}),null);
    }
  }
});
