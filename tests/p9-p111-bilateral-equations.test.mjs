import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {BRIDGES, sessionTaskFor} from '../dist/learning/bridges.js';
import {ensureB39Ready} from '../dist/learning/phase4/async-batches.js';
import * as original from '../dist/learning/phase5/b35-model.js';
import {
  P111_SOURCES, p111BilateralEquationsBinding,
  replayP111BilateralEquationsEvidence, submittedP111BilateralEquationsEvidence
} from '../dist/learning/p111-bilateral-equations-evidence.js';

const expected = [['7','26'], ['3','15'], ['4','19'], ['-1','6'], ['4','5']];
const rows = P111_SOURCES.map((source, i) => {
  const {sessionId,index} = source;
  const [root, substitution] = expected[i];
  return {source, context:{sessionId,index}, task:sessionTaskFor(sessionId,index), root, substitution};
});

function ordered(value) {
  if (Array.isArray(value)) return value.map(ordered);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort((a,b) => a.localeCompare(b,'en'))
      .map(key => [key,ordered(value[key])]));
  }
  return value;
}

const replay = (row, model) => replayP111BilateralEquationsEvidence(row.task,model,row.context);
const submit = (row, model, ...attempts) => submittedP111BilateralEquationsEvidence(row.task,model,
  {attempts:attempts.map(value => ({value:structuredClone(value)}))},row.context);

function act(row, model, action, value, index) {
  if (value !== undefined) model.value = String(value);
  original.act(row.task, model, 'a35-' + action, index === undefined ? {} : {index});
}

function isolate(row, model) {
  for (const {op,value} of row.task.exampleOps) act(row,model,'op',value,op);
}

function solve(row) {
  const model = original.initial(row.task);
  isolate(row,model);
  act(row,model,'try',row.root);
  return model;
}

test('P111 binds five original equation positions and frozen full hashes', () => {
  assert.equal(rows.length, 5);
  for (const {source, task, context} of rows) {
    assert.equal(createHash('sha256').update(JSON.stringify(ordered(task))).digest('hex'), source.taskHash);
    assert.equal(p111BilateralEquationsBinding(task, context)?.nodeId, source.nodeId);
    assert.equal(p111BilateralEquationsBinding({...task, solution:'0'}, context), null);
    assert.equal(p111BilateralEquationsBinding({...task, exampleOps:[]}, context), null);
    assert.equal(p111BilateralEquationsBinding(task, {...context,index:String(context.index)}), null);
  }
});

test('P111 proves each unique solution and exact substitution through original events', () => {
  for (const row of rows) {
    const model = original.initial(row.task);
    act(row,model,'op','0','div');
    act(row,model,'one-side','1','sub');
    act(row,model,'try',Number(row.root) + 1);
    isolate(row,model);
    assert.equal(original.inspect(row.task,model).correct,false);
    assert.equal(replay(row,model),null);
    act(row,model,'try',row.root);
    assert.equal(original.inspect(row.task,model).correct,true);
    const before = structuredClone(model);
    const proof = replay(row,model);
    assert.equal(proof.solution,row.root);
    assert.deepEqual(proof.transforms,model.board.steps);
    assert.equal(proof.substitution.left,row.substitution);
    assert.equal(proof.substitution.right,row.substitution);
    assert.deepEqual(proof.events.slice(0,2).map(e => [e.action,e.accepted]), [['op',false],['one-side',false]]);
    assert.deepEqual(proof.trials.map(e => e.equal), [false,true]);
    assert.deepEqual(model,before);
  }
});

test('P111 accepts alternate legal paths with actual Undo and Reset', () => {
  const row = rows[0], model = original.initial(row.task);
  act(row,model,'op','3','add');
  act(row,model,'reset');
  act(row,model,'op','2','mul');
  act(row,model,'op','1','addx');
  act(row,model,'undo');
  act(row,model,'op','-10','add');
  act(row,model,'op','6','div');
  act(row,model,'try','14/2');
  assert.equal(original.inspect(row.task,model).correct,true);
  const proof = replay(row,model);
  assert.equal(proof.solution,'7');
  assert.deepEqual(proof.transforms.map(step => [step.op,step.value]), [['mul','2'],['add','-10'],['div','6']]);
  assert.deepEqual(proof.events.filter(event => ['reset','undo'].includes(event.action))
    .map(event => [event.action,event.changed]), [['reset',true],['undo',true]]);
});

test('P111 requires a fresh substitution following the active transformation path and latest Check', () => {
  const row = rows[0], model = original.initial(row.task);
  act(row,model,'try',row.root);
  isolate(row,model);
  model.value = row.root;
  assert.equal(original.inspect(row.task,model).correct,true);
  assert.equal(replay(row,model),null);
  const stale = structuredClone(model);
  act(row,model,'try',row.root);
  assert.equal(submit(row,model,stale),null);
  assert.equal(submit(row,model,stale,model)?.solution,'7');
  assert.equal(submit(row,model,model,stale),null);

  act(row,model,'undo');
  act(row,model,'op','3','div');
  model.value = row.root;
  assert.equal(original.inspect(row.task,model).correct,true);
  assert.equal(replay(row,model),null);
});

test('P111 rejects forged steps, unsupported controls and an unresolved preview', () => {
  const row = rows[2];
  const changes = [
    m => { m.history.length = 0; },
    m => { m.history[0].v = '3'; },
    m => { m.board.steps[0].left[0] = [4,1]; },
    m => { m.board.trials.at(-1).right = '0'; },
    m => { m.history[0].unverified = true; },
    m => act(row,m,'walk','4','1'),
    m => {
      act(row,m,'one-side','1','sub');
      act(row,m,'try',row.root);
      assert.equal(original.inspect(row.task,m).correct,true);
      assert.ok(m.board.preview);
    }
  ];
  for (const change of changes) {
    const model = solve(row);
    change(model);
    assert.equal(replay(row,model),null,change.toString());
  }
});

test('P111 excludes the neighboring expansion, practice and bridge positions', async () => {
  await ensureB39Ready();
  for (const {task, context} of rows) {
    assert.equal(p111BilateralEquationsBinding(task,{...context,index:-1}),null);
    assert.equal(p111BilateralEquationsBinding(task,{...context,index:1}),null);
    assert.equal(p111BilateralEquationsBinding(sessionTaskFor('equations35',1),context),null);
    for (const [sessionId, bridge] of Object.entries(BRIDGES)) {
      for (const [index, related] of bridge.tasks.entries()) {
        if (related?.type === task.type) assert.equal(p111BilateralEquationsBinding(related,{sessionId,index}),null);
      }
      assert.equal(p111BilateralEquationsBinding(task,{sessionId,index:0}),null);
    }
  }
});
