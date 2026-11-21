import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {BRIDGES, sessionTaskFor} from '../dist/learning/bridges.js';
import {ensureB39Ready} from '../dist/learning/phase4/async-batches.js';
import * as original from '../dist/learning/phase4/b03-model.js';
import {
  P106_SOURCES,p106PaperFoldCountsBinding,
  replayP106PaperFoldCountsEvidence,submittedP106PaperFoldCountsEvidence
} from '../dist/learning/p106-paper-fold-counts-evidence.js';

const [source] = P106_SOURCES;
const {sessionId,index} = source;
const context = {sessionId,index};
const task = sessionTaskFor(sessionId,index);
const replay = model => replayP106PaperFoldCountsEvidence(task,model,context);
const submit = (model,...snapshots) => submittedP106PaperFoldCountsEvidence(task,model,
  {attempts:snapshots.map(value => ({value:structuredClone(value)}))},context);
const fold = model => original.act(task,model,'fold-paper',{});

function threeFolds() {
  const model = original.initial(task);
  for (let i = 0; i < 3; i++) fold(model);
  return model;
}

test('P106 locks the complete original paper strip task and fingerprint', () => {
  assert.equal(P106_SOURCES.length,1);
  const ordered = Object.fromEntries(Object.entries(task).sort(([a],[b]) => a.localeCompare(b,'en')));
  assert.equal(createHash('sha256').update(JSON.stringify(ordered)).digest('hex'),source.taskHash);
  assert.equal(p106PaperFoldCountsBinding(task,context)?.nodeId,source.nodeId);
  assert.equal(p106PaperFoldCountsBinding({...task,prompt:'different'},context),null);
  assert.equal(p106PaperFoldCountsBinding({...task,folds:2},context),null);
  assert.equal(p106PaperFoldCountsBinding(task,{...context,index:'0'}),null);
});

test('P106 uses the three original folds to check that every stage doubles', () => {
  const model = original.initial(task);
  for (const [i,pieces] of [2,4,8].entries()) {
    fold(model);
    assert.equal(model.folds,i+1);
    assert.equal(model.history.at(-1),pieces);
    model.labels[i] = pieces;
    if (i < 2) assert.equal(replay(model),null);
  }
  const before = structuredClone(model);
  const proof = replay(model);
  assert.deepEqual(proof.stages.map(({before,after,label}) => [before,after,label]),[[1,2,2],[2,4,4],[4,8,8]]);
  assert.equal(proof.totalParts,8);
  assert.equal(proof.labelEntryTimingAssessed,false);
  assert.equal(proof.physicalFoldingAssessed,false);
  assert.deepEqual(model,before);
  fold(model);
  assert.deepEqual(model,before);
});

test('P106 records the wrong label, then requires a fresh matching Check after correction', () => {
  const model = threeFolds();
  model.labels = [1,4,8];
  assert.equal(original.inspect(task,model).correct,false);
  assert.equal(replay(model),null);
  const incorrect = structuredClone(model);
  model.labels[0] = 2;
  assert.ok(replay(model));
  assert.equal(submit(model,incorrect),null);
  assert.equal(submit(model,incorrect,model)?.totalParts,8);
  assert.equal(submit(model,model,incorrect),null);
});

test('P106 rejects forged counts and duplicate, missing or reversed stage labels', () => {
  const changes = [
    m => { m.history = [2,3,8]; },
    m => { m.history.length = 2; },
    m => { m.history.reverse(); },
    m => { m.folds = 2; },
    m => { m.labels = [4,4,8]; },
    m => { delete m.labels[2]; },
    m => { m.labels = [8,4,2]; },
    m => { m.labels[1] = '4'; },
    m => { m.unsupported = true; }
  ];
  for (const change of changes) {
    const model = threeFolds();
    model.labels = [2,4,8];
    change(model);
    assert.equal(replay(model),null,change.toString());
  }
});

test('P106 excludes nearby tasks, actual practice and related original bridges', async () => {
  await ensureB39Ready();
  assert.equal(p106PaperFoldCountsBinding(task,{...context,index:1}),null);
  assert.equal(p106PaperFoldCountsBinding(task,{...context,index:-1}),null);
  assert.equal(p106PaperFoldCountsBinding(sessionTaskFor(sessionId,1),context),null);
  for (const [id,bridge] of Object.entries(BRIDGES)) {
    for (const [i,related] of bridge.tasks.entries()) {
      if (related?.type === task.type) assert.equal(p106PaperFoldCountsBinding(related,{sessionId:id,index:i}),null);
    }
  }
});
