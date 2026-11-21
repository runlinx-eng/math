import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {BRIDGES, sessionTaskFor} from '../dist/learning/bridges.js';
import {ensureB39Ready} from '../dist/learning/phase4/async-batches.js';
import * as original from '../dist/learning/phase5/b23-model.js';
import {
  P092_SOURCES,
  p092TriangleTilingBinding,
  replayP092TriangleTilingEvidence,
  submittedP092TriangleTilingEvidence
} from '../dist/learning/p092-triangle-tiling-evidence.js';

const cases = P092_SOURCES.map((source,i) => {
  const {sessionId,index} = source;
  return {source,context:{sessionId,index},task:sessionTaskFor(sessionId,index),
    step:[90,60][i],orientations:[[0,180],[0,60,120,180,240,300]][i],
    outerEdges:[4,6][i],internalSeams:[1,6][i],answer:[2,6][i]};
});

function ordered(value) {
  if (Array.isArray(value)) return value.map(ordered);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort((a,b) => a.localeCompare(b,'en'))
      .map(key => [key,ordered(value[key])]));
  }
  return value;
}

const replay = (row,m) => replayP092TriangleTilingEvidence(row.task,m,row.context);
const submit = (row,m,...versions) => submittedP092TriangleTilingEvidence(row.task,m,
  {attempts:versions.map(value => ({value:structuredClone(value)}))},row.context);
const act = (row,m,action,piece) => {
  m.piece = piece === null ? '' : String(piece);
  original.act(row.task,m,'g23-'+action);
};

function blank(row) {
  const model = original.initial(row.task,7);
  model.answers[0] = String(row.answer);
  return model;
}

function placeAll(row,model = blank(row)) {
  for (const piece of row.orientations.keys()) act(row,model,'place',piece);
  return model;
}

function rotateToPartition(row,model) {
  for (const [piece,angle] of row.orientations.entries()) {
    for (let rotation = 0; rotation < angle; rotation += row.step) act(row,model,'rotate',piece);
  }
  return model;
}

test('P092 locks both exact original geometry tasks', () => {
  for (const {source,task,context} of cases) {
    assert.equal(createHash('sha256').update(JSON.stringify(ordered(task))).digest('hex'),source.taskHash);
    assert.equal(p092TriangleTilingBinding(task,context)?.nodeId,source.nodeId);
    assert.equal(p092TriangleTilingBinding({...task,slots:task.slots+1},context),null);
    assert.equal(p092TriangleTilingBinding({...task,questions:[]},context),null);
    assert.equal(p092TriangleTilingBinding(task,{...context,index:String(context.index)}),null);
  }
});

test('P092 needs complementary orientations even when every piece has been placed', () => {
  for (const row of cases) {
    const model = placeAll(row);
    assert.equal(model.board.slots.filter(p => p !== null).length,row.task.slots);
    assert.equal(replay(row,model),null);
    rotateToPartition(row,model);
    const before = structuredClone(model);
    const proof = replay(row,model);
    assert.deepEqual(proof?.pieces.map(p => p.degrees),row.orientations);
    assert.equal(proof?.outerEdges,row.outerEdges);
    assert.equal(proof?.internalSeams,row.internalSeams);
    assert.equal(proof?.answer,row.answer);
    assert.ok(proof.actions.find(a => a.overlaps?.includes(0) && a.gaps?.length));
    assert.deepEqual(model,before);
  }
});

test('P092 records the protruding quarter-turn of a right triangle', () => {
  const [row] = cases;
  const model = placeAll(row);
  act(row,model,'rotate',1);
  assert.equal(replay(row,model),null);
  act(row,model,'rotate',1);
  const proof = replay(row,model);
  assert.deepEqual(proof?.actions.at(-2).outside,[1]);
  assert.deepEqual(proof?.actions.at(-2).gaps,[180]);
  assert.deepEqual(proof?.actions.at(-1).outside,[]);
});

test('P092 checks the numeric answer and requires a fresh Check after fixing the layout', () => {
  for (const row of cases) {
    const model = placeAll(row), wrong = structuredClone(model);
    rotateToPartition(row,model);
    assert.equal(submit(row,model,wrong),null);
    assert.equal(submit(row,model,wrong,model)?.answer,row.answer);
    const checked = structuredClone(model);
    model.answers[0] = String(row.answer+1);
    assert.equal(submit(row,model,wrong,model),null);
    model.answers[0] = row.answer.toFixed(1);
    assert.equal(replay(row,model)?.answer,row.answer);
    assert.equal(submit(row,model,wrong,checked),null);
  }
});

test('P092 recognizes allowed exploration and fails closed on tampered geometry', () => {
  const [row] = cases;
  const model = blank(row);
  act(row,model,'rotate',null);
  rotateToPartition(row,placeAll(row,model));
  act(row,model,'place',0);
  assert.equal(replay(row,model)?.actions[0].accepted,false);
  for (const change of [
    m => { m.board.rotations[1] = 0; },
    m => { m.board.slots[1] = 0; },
    m => { m.history[1].d.index = '1'; },
    m => original.act(row.task,m,'g23-unplace'),
    m => original.act(row.task,m,'g23-reset')
  ]) {
    const copy = structuredClone(model);
    change(copy);
    assert.equal(replay(row,copy),null,change.toString());
  }
});

test('P092 excludes practice, bridge and separately scoped shape-merger material', async () => {
  await ensureB39Ready();
  for (const {task,context} of cases) {
    assert.equal(p092TriangleTilingBinding(task,{...context,index:-1}),null);
    assert.equal(p092TriangleTilingBinding(task,{...context,sessionId:'shapemerge'}),null);
    assert.equal(p092TriangleTilingBinding(sessionTaskFor('shapemerge',0),context),null);
    for (const [id,bridge] of Object.entries(BRIDGES)) {
      for (const [index,related] of bridge.tasks.entries()) {
        if (related?.type === task.type) assert.equal(p092TriangleTilingBinding(related,{sessionId:id,index}),null);
      }
    }
  }
});
