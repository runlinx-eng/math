import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {BRIDGES, sessionTaskFor} from '../dist/learning/bridges.js';
import {ensureB39Ready} from '../dist/learning/phase4/async-batches.js';
import * as original from '../dist/learning/phase5/b30-model.js';
import {
  P086_SOURCES,
  p086JoinedSolidSurfacesBinding,
  replayP086JoinedSolidSurfacesEvidence,
  submittedP086JoinedSolidSurfacesEvidence
} from '../dist/learning/p086-joined-solid-surfaces-evidence.js';

const [source] = P086_SOURCES;
const {sessionId,index} = source;
const context = {sessionId,index};
const task = sessionTaskFor(sessionId,index);
const act = (model,action,value) => original.act(task,model,'a30-'+action,
  value === undefined ? {} : {index:value});
const replay = model => replayP086JoinedSolidSurfacesEvidence(task,model,context);
const submit = (model,...versions) => submittedP086JoinedSolidSurfacesEvidence(task,model,
  {attempts:versions.map(value => ({value:structuredClone(value)}))},context);

function ordered(value) {
  if (Array.isArray(value)) return value.map(ordered);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort((a,b) => a.localeCompare(b,'en'))
      .map(key => [key,ordered(value[key])]));
  }
  return value;
}

function complete({splits=2,turn=true} = {}) {
  const model = original.initial(task);
  for (let i = 0; i < splits; i++) act(model,'split');
  if (turn) act(model,'turn');
  for (const i of [3,0,1,2,4]) act(model,'face',i);
  Object.assign(model,{
    faceValues:['16','32','12','4','16'],area:'80',unit:'cm²',
    calcValues:['32','8'],volume:'40',volumeUnit:'cm³',answers:['88','8']
  });
  return model;
}

test('P086 locks the original joined-solid prompt, faces, and fingerprint', () => {
  assert.equal(createHash('sha256').update(JSON.stringify(ordered(task))).digest('hex'),source.taskHash);
  assert.equal(p086JoinedSolidSurfacesBinding(task,context)?.nodeId,source.nodeId);
  assert.equal(p086JoinedSolidSurfacesBinding({...task,surface:88},context),null);
  assert.equal(p086JoinedSolidSurfacesBinding({...task,canSplit:false},context),null);
  assert.equal(p086JoinedSolidSurfacesBinding(task,{...context,index:'1'}),null);
});

test('P086 computes the exposed faces, both hidden faces and unchanged volume', () => {
  const model = complete(), before = structuredClone(model);
  const proof = replay(model);
  assert.ok(original.inspect(task,model).correct);
  assert.deepEqual(proof?.exposedAreas,[16,32,12,4,16]);
  assert.deepEqual([proof.contact,proof.hiddenSurface,proof.separateSurface,proof.surface],[4,8,88,80]);
  assert.deepEqual(proof.volumes,[32,8]);
  assert.deepEqual(proof.changes,[
    {split:true,surface:88,volume:40},
    {split:false,surface:80,volume:40}
  ]);
  assert.deepEqual(model,before);
});

test('P086 requires a real separation, rejoin, rotation and all five exterior groups', () => {
  for (const splits of [0,1,3]) assert.equal(replay(complete({splits})),null);
  assert.equal(replay(complete({turn:false})),null);
  const incomplete = complete();
  act(incomplete,'face',2);
  assert.equal(replay(incomplete),null);
  act(incomplete,'face',2);
  assert.equal(replay(incomplete)?.surface,80);
});

test('P086 checks boundary versus volume calculations and requires a fresh Check', () => {
  const model = complete();
  model.area = '88';
  assert.equal(submit(model,model),null);
  const wrong = structuredClone(model);
  model.area = '80';
  assert.equal(submit(model,wrong),null);
  assert.equal(submit(model,wrong,model)?.volume,40);
  model.volumeUnit = 'cm²';
  assert.equal(replay(model),null);
  model.volumeUnit = 'cm³';
  model.calcValues[1] = '4';
  assert.equal(replay(model),null);
});

test('P086 excludes inconsistent snapshots and unrelated hidden actions', () => {
  const model = complete();
  for (const change of [
    m => { m.history.length = 0; },
    m => { m.board.splitSeen = false; },
    m => { m.history[3].i = '03'; },
    m => { m.answers[1] = '4'; },
    m => act(m,'clear')
  ]) {
    const copy = structuredClone(model);
    change(copy);
    assert.equal(replay(copy),null,change.toString());
  }
});

test('P086 excludes the precursor prism, L-shaped volume, practice and bridges', async () => {
  await ensureB39Ready();
  for (const other of [0,2]) {
    assert.equal(p086JoinedSolidSurfacesBinding(sessionTaskFor(sessionId,other),{sessionId,index:other}),null);
  }
  assert.equal(p086JoinedSolidSurfacesBinding(task,{sessionId,index:-1}),null);
  for (const [id,bridge] of Object.entries(BRIDGES)) {
    for (const [index,related] of bridge.tasks.entries()) {
      if (related?.type === task.type) assert.equal(p086JoinedSolidSurfacesBinding(related,{sessionId:id,index}),null);
    }
  }
});
