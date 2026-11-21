import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {BRIDGES, sessionTaskFor} from '../dist/learning/bridges.js';
import {ensureB39Ready} from '../dist/learning/phase4/async-batches.js';
import * as original from '../dist/learning/phase5/b24-model.js';
import {
  P101_SOURCES,p101AxisMirrorBinding,
  replayP101AxisMirrorEvidence,submittedP101AxisMirrorEvidence
} from '../dist/learning/p101-axis-mirror-evidence.js';

const targets = [[[-2,1],[-3,3]],[[-1,2],[-3,4]],[[2,1],[3,3]]];
const rows = P101_SOURCES.map((source,i) => {
  const {sessionId,index} = source;
  return {source,context:{sessionId,index},task:sessionTaskFor(sessionId,index),targets:targets[i]};
});

function ordered(value) {
  if (Array.isArray(value)) return value.map(ordered);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort((a,b) => a.localeCompare(b,'en'))
      .map(key => [key,ordered(value[key])]));
  }
  return value;
}

const action = (row,model,name,data) => original.act(row.task,model,'p24-' + name,data);
const replay = (row,model) => replayP101AxisMirrorEvidence(row.task,model,row.context);
const submit = (row,model,...versions) => submittedP101AxisMirrorEvidence(row.task,model,
  {attempts:versions.map(value => ({value:structuredClone(value)}))},row.context);

function plot(row,model,x,y) {
  model.x = String(x);
  model.y = String(y);
  action(row,model,'plot');
}

function wrongWork(row) {
  const model = original.initial(row.task,13);
  plot(row,model,...row.targets[0]);
  plot(row,model,row.targets[1][0],row.targets[1][1]+1);
  action(row,model,'fold');
  model.answers = row.task.questions.map(q => String(q.value));
  return model;
}

function correct(row,model) {
  action(row,model,'undo');
  const [x,y] = row.targets[1], [xmin,xmax,ymin] = row.task.domain;
  action(row,model,'dot',{index:x-xmin+(y-ymin)*(xmax-xmin+1)});
  action(row,model,'fold');
  return model;
}

test('P101 binds the three complete originals and their fingerprints', () => {
  assert.equal(rows.length,3);
  for (const {source,task,context} of rows) {
    assert.equal(createHash('sha256').update(JSON.stringify(ordered(task))).digest('hex'),source.taskHash);
    assert.equal(p101AxisMirrorBinding(task,context)?.nodeId,source.nodeId);
    assert.equal(p101AxisMirrorBinding({...task,line:'x'},context),null);
    assert.equal(p101AxisMirrorBinding({...task,half:[...task.half].reverse()},context),null);
    assert.equal(p101AxisMirrorBinding(task,{...context,index:String(context.index)}),null);
  }
});

test('P101 verifies axis-fixed points and actual mirror placements from both sides', () => {
  for (const row of rows) {
    const wrong = wrongWork(row);
    assert.equal(original.inspect(row.task,wrong).correct,false);
    assert.equal(replay(row,wrong),null);
    const model = correct(row,structuredClone(wrong)), before = structuredClone(model);
    assert.equal(original.inspect(row.task,model).correct,true);
    const proof = replay(row,model);
    assert.deepEqual(proof.placed,row.targets);
    assert.equal(proof.axis,'x=0');
    assert.equal(proof.mappings.filter(point => point.fixed).length,2);
    assert.deepEqual(proof.events.filter(event => event.action === 'fold').map(event => event.matched),[false,true]);
    assert.equal(proof.events.at(-2).action,'dot');
    for (const {original:[x,y],image:[xp,yp]} of proof.mappings) {
      assert.equal(x+xp,0);
      assert.equal(y,yp);
    }
    assert.deepEqual(model,before);
  }
});

test('P101 requires an actual new fold followed by the latest original Check', () => {
  const row = rows[0], wrong = wrongWork(row), model = structuredClone(wrong);
  action(row,model,'undo');
  plot(row,model,...row.targets[1]);
  assert.equal(model.board.folded,false);
  assert.equal(replay(row,model),null);
  action(row,model,'fold');
  assert.equal(submit(row,model,wrong),null);
  assert.ok(submit(row,model,wrong,model)?.fold.matched);
  assert.equal(submit(row,model,model,wrong),null);
  model.answers[0] = 'samey';
  assert.equal(replay(row,model),null);
});

test('P101 supports exact integer aliases and declines a silently rounded coordinate', () => {
  const row = rows[2], model = original.initial(row.task,13);
  plot(row,model,'2.0000000000000000000','2/2');
  plot(row,model,'6/2','2 1/1');
  model.answers = ['match'];
  action(row,model,'fold');
  assert.deepEqual(replay(row,model)?.placed,row.targets);

  const rounded = original.initial(row.task,13);
  plot(row,rounded,'2.0000000000000000001',1);
  plot(row,rounded,3,3);
  rounded.answers = ['match'];
  action(row,rounded,'fold');
  assert.ok(original.inspect(row.task,rounded).correct);
  assert.equal(replay(row,rounded),null);
});

test('P101 declines forged folds, noncanonical grid identities and wrong source geometry', () => {
  const row = rows[1], changes = [
    m => { m.history.length=0; },
    m => { m.history.at(-2).d.index='0'+m.history.at(-2).d.index; },
    m => { m.history.at(-1).d.index='0'; },
    m => { m.board.placed[1]=[0,5]; },
    m => { m.answers[0]='4'; },
    m => action(row,m,'spin')
  ];
  for (const change of changes) {
    const model = correct(row,wrongWork(row));
    change(model);
    assert.equal(replay(row,model),null,change.toString());
  }
});

test('P101 excludes adjacent geometry, actual practice and source bridges', async () => {
  await ensureB39Ready();
  for (const {task,context} of rows) {
    assert.equal(p101AxisMirrorBinding(task,{...context,index:-1}),null);
    assert.equal(p101AxisMirrorBinding(task,{sessionId:'turnsym',index:0}),null);
    assert.equal(p101AxisMirrorBinding(sessionTaskFor('turnsym',0),context),null);
    for (const [sessionId,bridge] of Object.entries(BRIDGES)) {
      for (const [index,related] of bridge.tasks.entries()) {
        if (related?.type === task.type) assert.equal(p101AxisMirrorBinding(related,{sessionId,index}),null);
      }
    }
  }
});
