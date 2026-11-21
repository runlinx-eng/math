import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {BRIDGES, sessionTaskFor} from '../dist/learning/bridges.js';
import {ensureB39Ready} from '../dist/learning/phase4/async-batches.js';
import * as original from '../dist/learning/phase5/b27-model.js';
import {
  P093_SOURCES,
  p093TriangularPrismNetBinding,
  replayP093TriangularPrismNetEvidence,
  submittedP093TriangularPrismNetEvidence
} from '../dist/learning/p093-triangular-prism-net-evidence.js';

const [source] = P093_SOURCES;
const {sessionId,index} = source;
const context = {sessionId,index};
const task = sessionTaskFor(sessionId,index);
const act = (model,action,value) => original.act(task,model,'g27-'+action,
  value === undefined ? {} : {index:value});
const replay = model => replayP093TriangularPrismNetEvidence(task,model,context);
const submit = (model,...versions) => submittedP093TriangularPrismNetEvidence(task,model,
  {attempts:versions.map(value => ({value:structuredClone(value)}))},context);

function attach(model,parts) {
  for (const part of parts) act(model,'piece',part);
}

function foldTo(model,position) {
  model.foldPosition = String(position);
  original.field(task,model,'foldPosition');
}

function complete(model = original.initial(task,7)) {
  attach(model,[3,1,0,2]);
  act(model,'predict','yes');
  foldTo(model,50);
  act(model,'fold');
  act(model,'turn');
  return model;
}

test('P093 locks the original prompt, node and complete fingerprint', () => {
  const sorted = Object.fromEntries(Object.entries(task).sort(([a],[b]) => a.localeCompare(b,'en')));
  assert.equal(createHash('sha256').update(JSON.stringify(sorted)).digest('hex'),source.taskHash);
  assert.equal(p093TriangularPrismNetBinding(task,context)?.nodeId,source.nodeId);
  assert.equal(p093TriangularPrismNetBinding({...task,rotate:false},context),null);
  assert.equal(p093TriangularPrismNetBinding(task,{...context,index:'1'}),null);
});

test('P093 reconstructs the visible shell and its two triangular ends', () => {
  const model = complete(), before = structuredClone(model);
  const proof = replay(model);
  assert.ok(original.inspect(task,model).correct);
  assert.deepEqual(proof?.geometry,
    {rectangles:3,triangles:2,vertices:6,edges:9,openEdges:0,closed:true});
  assert.deepEqual(proof?.folds,
    [{parts:[0,1,2,3],prediction:'yes',...proof.geometry}]);
  assert.equal(proof.turns,1);
  assert.ok(proof.observations.some(item => item.action === 'fold' && item.position === 50));
  assert.deepEqual(model,before);
});

test('P093 preserves the missing end and demands a new Check after correction', () => {
  const model = original.initial(task,7);
  attach(model,[0,1,2]);
  act(model,'predict','yes');
  act(model,'fold');
  act(model,'turn');
  assert.ok(!original.inspect(task,model).correct);
  assert.equal(submit(model,model),null);
  const wrong = structuredClone(model);
  act(model,'piece',3);
  assert.deepEqual(model.board.parts,[0,1,2]);
  act(model,'unfold');
  act(model,'piece',3);
  act(model,'predict','yes');
  act(model,'fold');
  assert.equal(submit(model,wrong),null);
  const proof = submit(model,wrong,model);
  assert.deepEqual(proof?.folds[0],
    {parts:[0,1,2],prediction:'yes',rectangles:3,triangles:1,vertices:6,edges:9,openEdges:3,closed:false});
  assert.equal(proof?.folds[1].closed,true);
  assert.ok(proof.observations.some(item => item.part === 3 && item.accepted === false));
});

test('P093 rejects half-folds, an opposing prediction and an unturned result', () => {
  const model = original.initial(task,7);
  attach(model,[0,1,2,3]);
  act(model,'predict','no');
  act(model,'fold');
  act(model,'turn');
  assert.equal(replay(model),null);
  act(model,'unfold');
  act(model,'predict','yes');
  foldTo(model,50);
  assert.equal(submit(model,model),null);
  const unturned = complete();
  unturned.history.pop();
  unturned.board.turned = false;
  assert.equal(replay(unturned),null);
});

test('P093 excludes impossible native actions and tampering with the recorded fold', () => {
  for (const change of [
    m => { m.history.length = 0; },
    m => { m.board.attempts[0].parts[0] = 3; },
    m => { m.history[0].d.index = '03'; },
    m => act(m,'predict','yes'),
    m => act(m,'help')
  ]) {
    const model = complete();
    change(model);
    assert.equal(replay(model),null,change.toString());
  }
});

test('P093 excludes the prerequisite, practice and bridge positions', async () => {
  await ensureB39Ready();
  assert.equal(p093TriangularPrismNetBinding(sessionTaskFor(sessionId,0),context),null);
  assert.equal(p093TriangularPrismNetBinding(task,{sessionId,index:0}),null);
  assert.equal(p093TriangularPrismNetBinding(task,{sessionId,index:-1}),null);
  for (const [id,bridge] of Object.entries(BRIDGES)) {
    for (const [index,related] of bridge.tasks.entries()) {
      if (related?.type === task.type) assert.equal(p093TriangularPrismNetBinding(related,{sessionId:id,index}),null);
    }
  }
});
