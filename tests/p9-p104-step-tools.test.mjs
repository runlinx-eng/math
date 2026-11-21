import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {BRIDGES, sessionTaskFor} from '../dist/learning/bridges.js';
import {ensureB39Ready} from '../dist/learning/phase4/async-batches.js';
import * as original from '../dist/learning/phase5/b09-model.js';
import {
  P104_SOURCES,p104StepToolsBinding,
  replayP104StepToolsEvidence,submittedP104StepToolsEvidence
} from '../dist/learning/p104-step-tools-evidence.js';

const facts = [
  {end:62, steps:[10,10,1,1,1,1,1,1,1,1],tool:'line',other:'hundred'},
  {end:36, steps:[-10,-10,-10,-1,-1,-1,-1,-1,-1],tool:'hundred',other:'line'}
];
const rows = P104_SOURCES.map((source,i) => {
  const {sessionId,index} = source;
  return {source,context:{sessionId,index},task:sessionTaskFor(sessionId,index),...facts[i]};
});

const action = (row,model,name,data) => original.act(row.task,model,name,data);
const select = (row,model,tool) => action(row,model,'tool-select',{value:tool});
const move = (row,model,delta) => action(row,model,'tool-move',{delta});
const replay = (row,model) => replayP104StepToolsEvidence(row.task,model,row.context);
const submit = (row,model,...versions) => submittedP104StepToolsEvidence(row.task,model,
  {attempts:versions.map(value => ({value:structuredClone(value)}))},row.context);

function work(row,both = false) {
  const model = original.initial(row.task);
  select(row,model,row.other);
  for (const delta of both ? row.steps : [Math.sign(row.task.change)]) move(row,model,delta);
  select(row,model,row.tool);
  for (const delta of row.steps) move(row,model,delta);
  model.answer = String(row.end);
  return model;
}

test('P104 binds both originals and the entire task fingerprints', () => {
  assert.equal(rows.length,2);
  for (const {source,task,context} of rows) {
    const ordered = Object.fromEntries(Object.entries(task).sort(([a],[b]) => a.localeCompare(b,'en')));
    assert.equal(createHash('sha256').update(JSON.stringify(ordered)).digest('hex'),source.taskHash);
    assert.equal(p104StepToolsBinding(task,context)?.nodeId,source.nodeId);
    assert.equal(p104StepToolsBinding({...task,start:0},context),null);
    assert.equal(p104StepToolsBinding({...task,change:0},context),null);
    assert.equal(p104StepToolsBinding(task,{...context,index:String(context.index)}),null);
  }
});

test('P104 reconstructs both independent paths from the given origin', () => {
  for (const row of rows) {
    const model = work(row), before = structuredClone(model);
    assert.equal(original.inspect(row.task,model).correct,true);
    const proof = replay(row,model);
    assert.equal(proof.start,row.task.start);
    assert.equal(proof.end,row.end);
    assert.equal(proof.change,row.task.change);
    assert.equal(proof.tool,row.tool);
    assert.deepEqual(proof.routes[row.tool].steps.map(step => step.delta),row.steps);
    assert.equal(proof.routes[row.other].position,row.task.start+Math.sign(row.task.change));
    assert.equal(proof.routes[row.tool].steps[0].from,row.task.start);
    assert.equal(proof.routes[row.tool].steps.at(-1).to,row.end);
    assert.deepEqual(model,before);
  }
});

test('P104 accepts either complete path, backtracking and exact equivalent answers', () => {
  for (const row of rows) {
    const model = work(row,true);
    select(row,model,row.other);
    move(row,model,1);
    move(row,model,-1);
    model.answer = (row.end*2)+'/2';
    const proof = replay(row,model);
    assert.equal(proof.tool,row.other);
    assert.equal(proof.routes[row.other].position,row.end);
    assert.equal(proof.toolSelectionTimingAssessed,false);
  }
});

test('P104 requires the current tool, destination and latest matching Check', () => {
  const row = rows[0], model = work(row);
  model.answer = String(row.task.change);
  const wrong = structuredClone(model);
  assert.equal(replay(row,wrong),null);
  model.answer = String(row.end);
  assert.equal(submit(row,model,wrong),null);
  assert.equal(submit(row,model,wrong,model)?.end,62);
  assert.equal(submit(row,model,model,wrong),null);
  select(row,model,row.other);
  assert.equal(replay(row,model),null);
});

test('P104 excludes reconstructed arrays, non-native event types and moves beyond the saved log', () => {
  const row = rows[0];
  for (const change of [
    m => { m.history.length=0; },
    m => { m.history[0].tool='ruler'; },
    m => { m.history[1].value=-10; },
    m => { m.history[0].unverified=true; },
    m => { m.segments=[{tool:'ruler',zero:0,length:2}]; },
    m => {
      m.line = [-10,-10,-10,-10,10,10,10,10,...m.line];
      m.history = [
        ...m.line.map(value => ({tool:'line',value})),
        ...m.grid.map(value => ({tool:'hundred',value}))
      ];
    }
  ]) {
    const model = work(row);
    change(model);
    assert.equal(replay(row,model),null,change.toString());
  }
  const capped = original.initial(row.task);
  select(row,capped,row.other);
  for (let i=0; i<100; i++) move(row,capped,i%2 ? -1 : 1);
  select(row,capped,row.tool);
  for (const delta of row.steps) move(row,capped,delta);
  capped.answer=String(row.end);
  assert.equal(original.inspect(row.task,capped).correct,true);
  assert.equal(capped.history.length,100);
  assert.equal(replay(row,capped),null);
});

test('P104 excludes the same payload at a different origin, other modes and bridges', async () => {
  await ensureB39Ready();
  for (const {task,context} of rows) {
    assert.equal(p104StepToolsBinding(task,{...context,index:-1}),null);
    assert.equal(p104StepToolsBinding(task,{sessionId:'strategy39',index:4}),null);
    assert.equal(p104StepToolsBinding(sessionTaskFor('toolchoice',2),context),null);
    for (const [sessionId,bridge] of Object.entries(BRIDGES)) {
      for (const [index,related] of bridge.tasks.entries()) {
        if (related?.type === task.type) assert.equal(p104StepToolsBinding(related,{sessionId,index}),null);
      }
    }
  }
});
