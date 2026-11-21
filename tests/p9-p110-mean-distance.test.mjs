import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {BRIDGES, sessionTaskFor} from '../dist/learning/bridges.js';
import {ensureB39Ready} from '../dist/learning/phase4/async-batches.js';
import * as original from '../dist/learning/phase5/b21-model.js';
import {
  P110_SOURCES, p110MeanDistanceBinding,
  replayP110MeanDistanceEvidence, submittedP110MeanDistanceEvidence
} from '../dist/learning/p110-mean-distance-evidence.js';

const expected = [
  {center:8, distances:[4,2,0,1,5], fraction:'12/5', meanDistance:{numerator:12,denominator:5}},
  {center:10, distances:[6,0,3,3], fraction:'3', meanDistance:{numerator:3,denominator:1}}
];
const rows = P110_SOURCES.map((source,i) => {
  const {sessionId,index} = source;
  return {source, context:{sessionId,index}, task:sessionTaskFor(sessionId,index), ...expected[i]};
});

function ordered(value) {
  if (Array.isArray(value)) return value.map(ordered);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort((a,b) => a.localeCompare(b,'en'))
      .map(key => [key,ordered(value[key])]));
  }
  return value;
}

const action = (row, model, name, data) => original.act(row.task,model,'b21-' + name,data);
const replay = (row, model) => replayP110MeanDistanceEvidence(row.task,model,row.context);
const submit = (row, model, ...versions) => submittedP110MeanDistanceEvidence(row.task,model,
  {attempts:versions.map(value => ({value:structuredClone(value)}))},row.context);

function writeDistance(row,model,number) {
  model.distance = String(number);
  action(row,model,'distance');
}

function work(row,{anchor = row.center, wrongFirst = false, wrongAnchor = false} = {}) {
  const model = original.initial(row.task);
  if (wrongAnchor) {
    model.anchor = String(row.center+1);
    action(row,model,'anchor');
  }
  model.anchor = String(anchor);
  action(row,model,'anchor');
  for (const [i,d] of row.distances.entries()) writeDistance(row,model,wrongFirst && i === 0 ? d+1 : d);
  model.value = row.fraction;
  model.answers = row.task.questions.map(q => q.value[0]);
  return model;
}

test('P110 binds both complete native distance tasks and their frozen hashes', () => {
  assert.equal(rows.length,2);
  for (const {source,task,context} of rows) {
    const hash = createHash('sha256').update(JSON.stringify(ordered(task))).digest('hex');
    assert.equal(hash,source.taskHash);
    assert.equal(p110MeanDistanceBinding(task,context)?.nodeId,source.nodeId);
    assert.equal(p110MeanDistanceBinding({...task,unit:'米'},context),null);
    assert.equal(p110MeanDistanceBinding({...task,values:[...task.values].reverse()},context),null);
    assert.equal(p110MeanDistanceBinding(task,{...context,index:String(context.index)}),null);
  }
});

test('P110 replays an anchor correction and real distance edit with independent exact math', () => {
  for (const row of rows) {
    const wrong = work(row,{wrongFirst:true,wrongAnchor:true});
    assert.equal(original.inspect(row.task,wrong).correct,false);
    const done = structuredClone(wrong);
    action(row,done,'row',{index:0});
    writeDistance(row,done,row.distances[0]);
    assert.equal(original.inspect(row.task,done).correct,true);
    const before = structuredClone(done);
    const proof = replay(row,done);
    assert.equal(proof.center,row.center);
    assert.equal(proof.unit,'厘米');
    assert.equal(proof.count,row.distances.length);
    assert.equal(proof.distanceTotal,12);
    assert.deepEqual(proof.rows.map(item => item.distance),row.distances);
    assert.deepEqual(proof.meanDistance,row.meanDistance);
    assert.deepEqual(proof.events.filter(e => e.action === 'anchor').map(e => e.accepted),[false,true]);
    assert.equal(proof.events.at(-2).row,0);
    assert.equal(proof.rows[0].eventIndex,done.history.length-1);
    assert.deepEqual(done,before);
    assert.equal(submit(row,done,wrong),null);
    assert.deepEqual(submit(row,done,wrong,done),proof);
  }
});

test('P110 keeps the zero and duplicate heights as independent observations', () => {
  const row = rows[1], model = work(row);
  const proof = replay(row,model);
  assert.deepEqual(proof.rows.map(({row,value,distance}) => [row,value,distance]),
    [[0,4,6],[1,10,0],[2,13,3],[3,13,3]]);
  assert.notEqual(proof.rows[2].eventIndex,proof.rows[3].eventIndex);
  model.answers[0] = 'same';
  assert.equal(replay(row,model),null);
});

test('P110 accepts original older full-field event snapshots', () => {
  const row = rows[0], model = work(row);
  const expand = f => ({...original.fields(row.task),...f});
  for (const event of model.history) event.f = expand(event.f);
  model.board.first = Object.fromEntries(Object.entries(model.board.first).map(([key,f]) => [key,expand(f)]));
  assert.equal(original.valid(row.task,model),true);
  assert.deepEqual(replay(row,model)?.meanDistance,row.meanDistance);
});

test('P110 excludes rounded anchors, rounded totals, missing actions and forged rows', () => {
  const row = rows[0];
  const approximateCenter = work(row,{anchor:'7.99999999'});
  assert.equal(original.inspect(row.task,approximateCenter).correct,true);
  assert.equal(replay(row,approximateCenter),null);
  const alternate = work(row);
  alternate.value = '2.40000001';
  assert.equal(original.inspect(row.task,alternate).correct,true);
  assert.equal(replay(row,alternate),null);

  const changes = [
    m => { m.history.length = 0; },
    m => { m.history[1].f.distance = '1'; },
    m => { m.board.distances[2] = null; },
    m => {
      action(row,m,'row',{index:'3/3'});
      writeDistance(row,m,'2');
    },
    m => {
      action(row,m,'row',{index:1});
      writeDistance(row,m,'2.00000001');
    }
  ];
  for (const change of changes) {
    const model = work(row);
    change(model);
    assert.equal(replay(row,model),null,change.toString());
  }
});

test('P110 declines related spread, bridge and practice tasks', async () => {
  await ensureB39Ready();
  for (const {task,context} of rows) {
    assert.equal(p110MeanDistanceBinding(task,{...context,index:-1}),null);
    assert.equal(p110MeanDistanceBinding(task,{...context,index:2}),null);
    assert.equal(p110MeanDistanceBinding(sessionTaskFor('meandistance',2),context),null);
    for (const [sessionId,bridge] of Object.entries(BRIDGES)) {
      for (const [index,related] of bridge.tasks.entries()) {
        if (related?.type === task.type) assert.equal(p110MeanDistanceBinding(related,{sessionId,index}),null);
      }
      assert.equal(p110MeanDistanceBinding(task,{sessionId,index:0}),null);
    }
  }
});
