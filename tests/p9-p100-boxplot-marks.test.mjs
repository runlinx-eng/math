import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {BRIDGES, sessionTaskFor} from '../dist/learning/bridges.js';
import {ensureB39Ready} from '../dist/learning/phase4/async-batches.js';
import * as original from '../dist/learning/phase5/b20-model.js';
import {
  P100_SOURCES,p100BoxplotMarksBinding,
  replayP100BoxplotMarksEvidence,submittedP100BoxplotMarksEvidence
} from '../dist/learning/p100-boxplot-marks-evidence.js';

const [source] = P100_SOURCES;
const {sessionId,index} = source;
const context = {sessionId,index};
const task = sessionTaskFor(sessionId,index);
const replay = model => replayP100BoxplotMarksEvidence(task,model,context);
const submit = (model,...versions) => submittedP100BoxplotMarksEvidence(task,model,
  {attempts:versions.map(value => ({value:structuredClone(value)}))},context);

function ordered(value) {
  if (Array.isArray(value)) return value.map(ordered);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort((a,b) => a.localeCompare(b,'en'))
      .map(key => [key,ordered(value[key])]));
  }
  return value;
}

function mark(model,value) {
  model.value = String(value);
  original.act(task,model,'b20-mark');
}

function row(model,index) {
  original.act(task,model,'b20-row',{index});
}

function work(q1 = '7') {
  const model = original.initial(task);
  mark(model,25);
  for (const value of [3,q1,9,14,21]) mark(model,value);
  model.answers = ['9','8','18','minmax'];
  return model;
}

function correct(model) {
  row(model,1);
  mark(model,6);
}

test('P100 binds the complete box construction source and fingerprint', () => {
  assert.equal(P100_SOURCES.length,1);
  assert.equal(createHash('sha256').update(JSON.stringify(ordered(task))).digest('hex'),source.taskHash);
  assert.equal(p100BoxplotMarksBinding(task,context)?.nodeId,source.nodeId);
  assert.equal(p100BoxplotMarksBinding({...task,domain:[0,25]},context),null);
  assert.equal(p100BoxplotMarksBinding({...task,summary:[3,5,9,14,21]},context),null);
  assert.equal(p100BoxplotMarksBinding(task,{...context,index:'0'}),null);
});

test('P100 replays all five marks and a returned row correction', () => {
  const model = work();
  assert.equal(original.inspect(task,model).correct,false);
  assert.equal(replay(model),null);
  correct(model);
  assert.equal(original.inspect(task,model).correct,true);
  const before = structuredClone(model), proof = replay(model);
  assert.deepEqual(proof.marks.map(mark => mark.value),[3,6,9,14,21]);
  assert.deepEqual(proof.box,[6,14]);
  assert.deepEqual(proof.whiskers,[3,21]);
  assert.deepEqual([proof.median,proof.boxWidth,proof.range],[9,8,18]);
  assert.equal(proof.events[0].recorded,false);
  assert.equal(proof.events.at(-2).position,1);
  assert.equal(proof.marks[1].eventIndex,model.history.length-1);
  assert.equal(proof.sourceSuppliedSummary,true);
  assert.deepEqual(model,before);
});

test('P100 requires exact numeric quantities and the source whisker convention', () => {
  const m = work('6.0000000000000000000');
  m.answers = ['18/2','0 8/1','36/2','minmax'];
  assert.equal(replay(m)?.boxWidth,8);
  m.answers[1]='8.000000001';
  assert.ok(original.inspect(task,m).correct);
  assert.equal(replay(m),null);
  m.answers[1]='8';
  m.answers[3]='fence';
  assert.equal(replay(m),null);
  const rounded = work('6.0000000000000000001');
  assert.ok(original.inspect(task,rounded).correct);
  assert.equal(replay(rounded),null);
});

test('P100 requires current saves and a latest matching original Check', () => {
  const wrong = work(), model = structuredClone(wrong);
  correct(model);
  assert.equal(submit(model,wrong),null);
  assert.equal(submit(model,wrong,model)?.range,18);
  assert.equal(submit(model,model,wrong),null);
  model.value='5';
  assert.ok(original.inspect(task,model).correct);
  assert.equal(replay(model),null);
});

test('P100 rejects forged event coordinates, missing marks and hidden alterations', () => {
  for (const change of [
    m => { m.history.length=0; },
    m => { m.board.marks[3]=21; },
    m => { m.history.at(-2).d.index='01'; },
    m => { m.history.at(-1).d.index='1'; },
    m => original.act(task,m,'b20-alter')
  ]) {
    const model = work();
    correct(model);
    change(model);
    assert.equal(replay(model),null,change.toString());
  }
});

test('P100 excludes the other boxplot modes, practice and original bridges', async () => {
  await ensureB39Ready();
  for (const position of [-1,1,2]) {
    assert.equal(p100BoxplotMarksBinding(task,{...context,index:position}),null);
  }
  assert.equal(p100BoxplotMarksBinding(sessionTaskFor(sessionId,1),context),null);
  for (const [id,bridge] of Object.entries(BRIDGES)) {
    for (const [i,related] of bridge.tasks.entries()) {
      if (related?.type === task.type) assert.equal(p100BoxplotMarksBinding(related,{sessionId:id,index:i}),null);
    }
  }
});
