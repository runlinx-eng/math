import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {BRIDGES, sessionTaskFor} from '../dist/learning/bridges.js';
import {ensureB39Ready} from '../dist/learning/phase4/async-batches.js';
import * as original from '../dist/learning/phase5/b36-model.js';
import {
  P098_SOURCES,p098LinearParameterBinding,
  replayP098LinearParameterEvidence,submittedP098LinearParameterEvidence
} from '../dist/learning/p098-linear-parameter-evidence.js';

const expected = [[[1,1],[2,1],[-1,1]],[[1,1],[1,3],[1,-1]]];
const rows = P098_SOURCES.map((source,i) => {
  const {sessionId,index} = source;
  return {source,context:{sessionId,index},task:sessionTaskFor(sessionId,index),lines:expected[i]};
});

function ordered(value) {
  if (Array.isArray(value)) return value.map(ordered);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort((a,b) => a.localeCompare(b,'en'))
      .map(key => [key,ordered(value[key])]));
  }
  return value;
}

const act = (row,model,a,i) => original.act(row.task,model,'f36-'+a,i === undefined ? {} : {index:i});
const replay = (row,model) => replayP098LinearParameterEvidence(row.task,model,row.context);
const submit = (row,model,...versions) => submittedP098LinearParameterEvidence(row.task,model,
  {attempts:versions.map(value => ({value:structuredClone(value)}))},row.context);

function save(row,model,target) {
  const [parameter] = row.task.controls;
  while (model.board[parameter] !== target) {
    act(row,model,'change',parameter+','+Math.sign(target-model.board[parameter]));
  }
  act(row,model,'save');
}

function work(row,complete = true) {
  const model = original.initial(row.task), [parameter] = row.task.controls;
  save(row,model,1);
  act(row,model,'save');
  save(row,model,row.task.required[1][parameter]);
  if (complete) save(row,model,-1);
  model.answers = [String(row.task.questions[0].value)];
  return model;
}

test('P098 binds the complete originals and preserved source hashes', () => {
  assert.equal(rows.length,2);
  for (const {source,task,context} of rows) {
    assert.equal(createHash('sha256').update(JSON.stringify(ordered(task))).digest('hex'),source.taskHash);
    assert.equal(p098LinearParameterBinding(task,context)?.nodeId,source.nodeId);
    assert.equal(p098LinearParameterBinding({...task,initial:{m:0,c:1}},context),null);
    assert.equal(p098LinearParameterBinding({...task,controls:['m','c']},context),null);
    assert.equal(p098LinearParameterBinding(task,{...context,index:String(context.index)}),null);
  }
});

test('P098 derives the exact intercept and per-step change while the other parameter is fixed', () => {
  for (const row of rows) {
    const model = work(row), before = structuredClone(model);
    assert.equal(original.inspect(row.task,model).correct,true);
    const proof = replay(row,model);
    assert.deepEqual(proof.lines.map(line => [line.m,line.c]),row.lines);
    assert.deepEqual(proof.lines.map(line => [line.stepChange,line.atZero]),row.lines);
    assert.equal(proof.actions.filter(action => action.action === 'save' && !action.newView).length,1);
    assert.deepEqual(model,before);
  }
});

test('P098 requires each saved comparison and latest matching Check', () => {
  for (const row of rows) {
    const model = work(row,false), incomplete = structuredClone(model);
    assert.equal(original.inspect(row.task,model).correct,false);
    assert.equal(replay(row,model),null);
    save(row,model,-1);
    assert.ok(replay(row,model));
    assert.equal(submit(row,model,incomplete),null);
    assert.equal(submit(row,model,incomplete,model)?.lines.length,3);
    assert.equal(submit(row,model,model,incomplete),null);
  }
});

test('P098 distinguishes a current draft line from an actual saved line', () => {
  const row = rows[0], model = work(row);
  act(row,model,'change','m,1');
  assert.ok(original.inspect(row.task,model).correct);
  assert.equal(replay(row,model),null);
  act(row,model,'save');
  assert.equal(replay(row,model)?.lines.at(-1).stepChange,0);
});

test('P098 declines edits to the fixed parameter, forged saves and a wrong reading', () => {
  const row = rows[1];
  for (const change of [
    m => { m.history.length=0; },
    m => { m.board.views[2].c=1; },
    m => { m.history[0].i='0'; },
    m => { m.history[0].v='unverified'; },
    m => act(row,m,'change','m,-1'),
    m => { m.answers[0]='1'; }
  ]) {
    const model = work(row);
    change(model);
    assert.equal(replay(row,model),null,change.toString());
  }
});

test('P098 excludes the quadratic mode, practice and original bridge positions', async () => {
  await ensureB39Ready();
  for (const {task,context} of rows) {
    assert.equal(p098LinearParameterBinding(task,{...context,index:-1}),null);
    assert.equal(p098LinearParameterBinding(task,{sessionId:'quadratic36',index:1}),null);
    assert.equal(p098LinearParameterBinding(sessionTaskFor('quadratic36',1),context),null);
    for (const [sessionId,bridge] of Object.entries(BRIDGES)) {
      for (const [index,related] of bridge.tasks.entries()) {
        if (related?.type === task.type) assert.equal(p098LinearParameterBinding(related,{sessionId,index}),null);
      }
    }
  }
});
